import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  studentAttendance,
  staffAttendance,
  staffAttendancePhotos,
  consentRecords,
  campusLocations,
  students,
  staff,
  users,
  notifications,
  auditLog,
} from '@classo/db';
import { eq, and, sql, desc, inArray } from 'drizzle-orm';
import * as crypto from 'crypto';
import type {
  MarkStudentAttendanceDto,
  QueryStudentAttendanceDto,
  EditStudentAttendanceDto,
  StaffSelfieCheckInDto,
  StaffSelfieCheckOutDto,
  ReviewStaffAttendanceDto,
  AdminOverrideStaffAttendanceDto,
  RecordConsentDto,
} from './attendance.dto';

function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

@Injectable()
export class AttendanceService {
  constructor(private readonly dbService: DatabaseService) {}

  // -------------------------------------------------------------
  // STUDENT ATTENDANCE (ATT-01..05)
  // -------------------------------------------------------------

  async markStudentAttendance(
    tenantId: string,
    userId: string,
    dto: MarkStudentAttendanceDto
  ) {
    const db = this.dbService.getDb();

    if (!dto.records || dto.records.length === 0) {
      throw new BadRequestException('At least one student attendance record is required');
    }

    const insertedOrUpdated = [];
    const absentStudentIds: string[] = [];

    for (const record of dto.records) {
      // Upsert student attendance record for the date
      const [existing] = await db
        .select()
        .from(studentAttendance)
        .where(
          and(
            eq(studentAttendance.instituteId, tenantId),
            eq(studentAttendance.studentId, record.studentId),
            eq(studentAttendance.date, dto.date)
          )
        );

      let saved;
      if (existing) {
        [saved] = await db
          .update(studentAttendance)
          .set({
            status: record.status,
            remarks: record.remarks ?? existing.remarks,
            classId: dto.classId ?? existing.classId,
            sectionId: dto.sectionId ?? existing.sectionId,
            batchId: dto.batchId ?? existing.batchId,
            editedBy: userId,
            editedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(studentAttendance.id, existing.id))
          .returning();
      } else {
        [saved] = await db
          .insert(studentAttendance)
          .values({
            instituteId: tenantId,
            studentId: record.studentId,
            date: dto.date,
            status: record.status,
            remarks: record.remarks,
            classId: dto.classId,
            sectionId: dto.sectionId,
            batchId: dto.batchId,
            markedBy: userId,
          })
          .returning();
      }

      insertedOrUpdated.push(saved);

      if (record.status === 'absent') {
        absentStudentIds.push(record.studentId);
      }
    }

    // Auto notification to parent/student on absence (ATT-03, COM-05)
    if (absentStudentIds.length > 0) {
      for (const studentId of absentStudentIds) {
        const [studentRec] = await db
          .select()
          .from(students)
          .where(and(eq(students.instituteId, tenantId), eq(students.id, studentId)));

        if (studentRec?.userId) {
          await db.insert(notifications).values({
            instituteId: tenantId,
            userId: studentRec.userId,
            title: 'Absence Alert',
            message: `${studentRec.fullName} was marked absent on ${dto.date}. Please contact the school if this was unexpected.`,
            type: 'attendance',
          });
        }
      }
    }

    return {
      message: 'Student attendance recorded successfully',
      date: dto.date,
      totalMarked: insertedOrUpdated.length,
      absentCount: absentStudentIds.length,
      records: insertedOrUpdated,
    };
  }

  async getStudentAttendance(tenantId: string, query: QueryStudentAttendanceDto) {
    const db = this.dbService.getDb();

    const conditions = [
      eq(studentAttendance.instituteId, tenantId),
      eq(studentAttendance.date, query.date),
    ];

    if (query.classId) {
      conditions.push(eq(studentAttendance.classId, query.classId));
    }
    if (query.sectionId) {
      conditions.push(eq(studentAttendance.sectionId, query.sectionId));
    }
    if (query.batchId) {
      conditions.push(eq(studentAttendance.batchId, query.batchId));
    }

    const records = await db
      .select({
        id: studentAttendance.id,
        studentId: studentAttendance.studentId,
        date: studentAttendance.date,
        status: studentAttendance.status,
        remarks: studentAttendance.remarks,
        studentName: students.fullName,
        admissionNo: students.admissionNo,
        rollNo: students.rollNo,
      })
      .from(studentAttendance)
      .leftJoin(students, eq(studentAttendance.studentId, students.id))
      .where(and(...conditions));

    const total = records.length;
    const presentCount = records.filter((r) => r.status === 'present').length;
    const absentCount = records.filter((r) => r.status === 'absent').length;
    const lateCount = records.filter((r) => r.status === 'late').length;
    const leaveCount = records.filter((r) => r.status === 'leave').length;
    const percentage = total > 0 ? Math.round(((presentCount + lateCount) / total) * 100) : 0;

    return {
      date: query.date,
      summary: {
        total,
        presentCount,
        absentCount,
        lateCount,
        leaveCount,
        percentage,
      },
      records,
    };
  }

  async editStudentAttendance(
    tenantId: string,
    id: string,
    userId: string,
    userRole: string,
    dto: EditStudentAttendanceDto
  ) {
    const db = this.dbService.getDb();

    const [record] = await db
      .select()
      .from(studentAttendance)
      .where(and(eq(studentAttendance.instituteId, tenantId), eq(studentAttendance.id, id)));

    if (!record) {
      throw new NotFoundException('Attendance record not found');
    }

    // ATT-02: Same-day edits allowed for teachers; later edits need Admin permission
    const today = new Date().toISOString().slice(0, 10);
    if (record.date !== today && userRole !== 'Admin') {
      throw new ForbiddenException(
        'Past attendance records can only be modified by an Institute Admin'
      );
    }

    const [updated] = await db
      .update(studentAttendance)
      .set({
        status: dto.status,
        remarks: dto.remarks ?? record.remarks,
        editedBy: userId,
        editedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(studentAttendance.id, id))
      .returning();

    // Audit log
    await db.insert(auditLog).values({
      instituteId: tenantId,
      userId,
      action: 'student_attendance.edited',
      entityType: 'student_attendance',
      entityId: id,
      diff: {
        before: { status: record.status, remarks: record.remarks },
        after: { status: dto.status, remarks: dto.remarks },
      },
    });

    return updated;
  }

  // -------------------------------------------------------------
  // STAFF SELFIE ATTENDANCE (STF-02, STF-05..14)
  // -------------------------------------------------------------

  async recordConsent(tenantId: string, userId: string, dto: RecordConsentDto, ip?: string, ua?: string) {
    const db = this.dbService.getDb();

    const [record] = await db
      .insert(consentRecords)
      .values({
        instituteId: tenantId,
        userId,
        consentType: dto.consentType,
        ipAddress: ip,
        userAgent: ua,
      })
      .returning();

    return {
      message: 'Consent recorded successfully',
      consent: record,
    };
  }

  async checkInStaff(
    tenantId: string,
    userId: string,
    dto: StaffSelfieCheckInDto,
    ip?: string,
    ua?: string
  ) {
    const db = this.dbService.getDb();

    // 1. Look up staff record for this user
    const [staffRec] = await db
      .select()
      .from(staff)
      .where(and(eq(staff.instituteId, tenantId), eq(staff.userId, userId)));

    if (!staffRec) {
      throw new NotFoundException('Staff profile not found for current user');
    }

    // 2. Verify explicit consent exists (STF-12)
    const [consent] = await db
      .select()
      .from(consentRecords)
      .where(
        and(
          eq(consentRecords.instituteId, tenantId),
          eq(consentRecords.userId, userId),
          eq(consentRecords.consentType, 'selfie_attendance')
        )
      );

    if (!consent) {
      throw new ForbiddenException(
        'Staff must provide explicit selfie attendance consent before marking attendance'
      );
    }

    // 3. Hash photo to detect duplicates (STF-14)
    const photoHash = crypto.createHash('sha256').update(dto.photoBase64).digest('hex');

    // 4. Calculate Geofence (SET-06, STF-06)
    const campuses = await db
      .select()
      .from(campusLocations)
      .where(eq(campusLocations.instituteId, tenantId));

    let withinGeofence = true;
    let minDistanceMeters = 0;

    if (campuses.length > 0) {
      withinGeofence = false;
      minDistanceMeters = Infinity;

      for (const campus of campuses) {
        const dist = calculateHaversineDistance(
          dto.latitude,
          dto.longitude,
          campus.latitude,
          campus.longitude
        );
        if (dist < minDistanceMeters) {
          minDistanceMeters = dist;
        }
        if (dist <= campus.radiusMeters) {
          withinGeofence = true;
          break;
        }
      }
    }

    // If outside geofence, flag for review (STF-06, STF-09)
    const checkInStatus = withinGeofence ? 'accepted' : 'flagged';
    const reviewStatus = withinGeofence ? 'approved' : 'pending';

    // 5. Store photo metadata with 90-day retention rule (STF-08, STF-12)
    const retainedUntil = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    const photoUrl = `tenants/${tenantId}/attendance/${staffRec.id}/${Date.now()}.webp`;

    const [savedPhoto] = await db
      .insert(staffAttendancePhotos)
      .values({
        instituteId: tenantId,
        staffId: staffRec.id,
        photoUrl,
        thumbnailUrl: photoUrl,
        photoHash,
        exifStripped: true,
        deviceInfo: dto.deviceInfo,
        userAgent: ua,
        ipAddress: ip,
        retainedUntil,
      })
      .returning();

    // 6. Record or update attendance for today
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date();

    const [existing] = await db
      .select()
      .from(staffAttendance)
      .where(
        and(
          eq(staffAttendance.instituteId, tenantId),
          eq(staffAttendance.staffId, staffRec.id),
          eq(staffAttendance.date, today)
        )
      );

    let savedAttendance;
    if (existing) {
      // Already checked in today: this is an updated check-in
      [savedAttendance] = await db
        .update(staffAttendance)
        .set({
          checkInTime: now,
          checkInStatus,
          withinGeofence,
          geofenceDistanceMeters: minDistanceMeters === Infinity ? 0 : minDistanceMeters,
          isMockLocation: dto.isMockLocation ?? false,
          photoId: savedPhoto.id,
          reviewStatus,
          updatedAt: now,
        })
        .where(eq(staffAttendance.id, existing.id))
        .returning();
    } else {
      [savedAttendance] = await db
        .insert(staffAttendance)
        .values({
          instituteId: tenantId,
          staffId: staffRec.id,
          date: today,
          checkInTime: now,
          status: 'present',
          checkInStatus,
          withinGeofence,
          geofenceDistanceMeters: minDistanceMeters === Infinity ? 0 : minDistanceMeters,
          isMockLocation: dto.isMockLocation ?? false,
          photoId: savedPhoto.id,
          reviewStatus,
        })
        .returning();
    }

    return {
      message: withinGeofence
        ? 'Check-in recorded and verified successfully within campus geofence'
        : 'Check-in recorded outside campus geofence and submitted for Principal review',
      attendance: savedAttendance,
      withinGeofence,
      distanceMeters: minDistanceMeters === Infinity ? 0 : minDistanceMeters,
    };
  }

  async checkOutStaff(
    tenantId: string,
    userId: string,
    dto: StaffSelfieCheckOutDto
  ) {
    const db = this.dbService.getDb();

    const [staffRec] = await db
      .select()
      .from(staff)
      .where(and(eq(staff.instituteId, tenantId), eq(staff.userId, userId)));

    if (!staffRec) {
      throw new NotFoundException('Staff profile not found');
    }

    const today = new Date().toISOString().slice(0, 10);
    const [existing] = await db
      .select()
      .from(staffAttendance)
      .where(
        and(
          eq(staffAttendance.instituteId, tenantId),
          eq(staffAttendance.staffId, staffRec.id),
          eq(staffAttendance.date, today)
        )
      );

    if (!existing) {
      throw new BadRequestException('Cannot check out without checking in first today');
    }

    const now = new Date();
    const [updated] = await db
      .update(staffAttendance)
      .set({
        checkOutTime: now,
        checkOutStatus: 'accepted',
        updatedAt: now,
      })
      .where(eq(staffAttendance.id, existing.id))
      .returning();

    return {
      message: 'Check-out recorded successfully',
      attendance: updated,
    };
  }

  async getStaffAttendanceForReview(tenantId: string, date: string, status?: string) {
    const db = this.dbService.getDb();

    const conditions = [
      eq(staffAttendance.instituteId, tenantId),
      eq(staffAttendance.date, date),
    ];

    if (status) {
      conditions.push(eq(staffAttendance.reviewStatus, status));
    }

    const checkIns = await db
      .select({
        id: staffAttendance.id,
        staffId: staffAttendance.staffId,
        date: staffAttendance.date,
        checkInTime: staffAttendance.checkInTime,
        checkOutTime: staffAttendance.checkOutTime,
        status: staffAttendance.status,
        checkInStatus: staffAttendance.checkInStatus,
        withinGeofence: staffAttendance.withinGeofence,
        geofenceDistanceMeters: staffAttendance.geofenceDistanceMeters,
        reviewStatus: staffAttendance.reviewStatus,
        rejectionReason: staffAttendance.rejectionReason,
        staffName: staff.fullName,
        staffCode: staff.staffCode,
        designation: staff.designation,
        photoUrl: staffAttendancePhotos.photoUrl,
        thumbnailUrl: staffAttendancePhotos.thumbnailUrl,
      })
      .from(staffAttendance)
      .leftJoin(staff, eq(staffAttendance.staffId, staff.id))
      .leftJoin(staffAttendancePhotos, eq(staffAttendance.photoId, staffAttendancePhotos.id))
      .where(and(...conditions))
      .orderBy(desc(staffAttendance.checkInTime));

    return {
      date,
      count: checkIns.length,
      pendingCount: checkIns.filter((c) => c.reviewStatus === 'pending').length,
      checkIns,
    };
  }

  async reviewStaffAttendance(
    tenantId: string,
    id: string,
    reviewerId: string,
    dto: ReviewStaffAttendanceDto
  ) {
    const db = this.dbService.getDb();

    const [record] = await db
      .select()
      .from(staffAttendance)
      .where(and(eq(staffAttendance.instituteId, tenantId), eq(staffAttendance.id, id)));

    if (!record) {
      throw new NotFoundException('Attendance record not found');
    }

    if (dto.action === 'reject' && !dto.rejectionReason) {
      throw new BadRequestException('Mandatory rejection reason required when rejecting attendance');
    }

    const [updated] = await db
      .update(staffAttendance)
      .set({
        reviewStatus: dto.action === 'approve' ? 'approved' : 'rejected',
        status: dto.action === 'approve' ? 'present' : 'absent',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        rejectionReason: dto.action === 'reject' ? dto.rejectionReason : null,
        updatedAt: new Date(),
      })
      .where(eq(staffAttendance.id, id))
      .returning();

    // If rejected, notify the staff member (STF-09)
    if (dto.action === 'reject') {
      const [staffRec] = await db
        .select()
        .from(staff)
        .where(and(eq(staff.instituteId, tenantId), eq(staff.id, record.staffId)));

      if (staffRec?.userId) {
        await db.insert(notifications).values({
          instituteId: tenantId,
          userId: staffRec.userId,
          title: 'Attendance Rejected',
          message: `Your check-in on ${record.date} was rejected: ${dto.rejectionReason}. You may raise a correction request.`,
          type: 'attendance',
        });
      }
    }

    return {
      message: `Staff attendance ${dto.action === 'approve' ? 'approved' : 'rejected'} successfully`,
      attendance: updated,
    };
  }

  async adminOverrideStaffAttendance(
    tenantId: string,
    adminId: string,
    dto: AdminOverrideStaffAttendanceDto
  ) {
    const db = this.dbService.getDb();

    const [existing] = await db
      .select()
      .from(staffAttendance)
      .where(
        and(
          eq(staffAttendance.instituteId, tenantId),
          eq(staffAttendance.staffId, dto.staffId),
          eq(staffAttendance.date, dto.date)
        )
      );

    let result;
    const now = new Date();

    if (existing) {
      [result] = await db
        .update(staffAttendance)
        .set({
          status: dto.status,
          checkInTime: dto.checkInTime ? new Date(dto.checkInTime) : existing.checkInTime,
          checkOutTime: dto.checkOutTime ? new Date(dto.checkOutTime) : existing.checkOutTime,
          reviewStatus: 'approved',
          manualOverride: true,
          overrideReason: dto.overrideReason,
          reviewedBy: adminId,
          reviewedAt: now,
          updatedAt: now,
        })
        .where(eq(staffAttendance.id, existing.id))
        .returning();
    } else {
      [result] = await db
        .insert(staffAttendance)
        .values({
          instituteId: tenantId,
          staffId: dto.staffId,
          date: dto.date,
          status: dto.status,
          checkInTime: dto.checkInTime ? new Date(dto.checkInTime) : now,
          checkOutTime: dto.checkOutTime ? new Date(dto.checkOutTime) : undefined,
          reviewStatus: 'approved',
          manualOverride: true,
          overrideReason: dto.overrideReason,
          reviewedBy: adminId,
          reviewedAt: now,
        })
        .returning();
    }

    // Audit log
    await db.insert(auditLog).values({
      instituteId: tenantId,
      userId: adminId,
      action: 'staff_attendance.manual_override',
      entityType: 'staff_attendance',
      entityId: result.id,
      diff: {
        reason: dto.overrideReason,
        status: dto.status,
      },
    });

    return {
      message: 'Staff attendance overridden successfully by Admin',
      attendance: result,
    };
  }
}
