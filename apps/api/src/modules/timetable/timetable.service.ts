import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  timetables,
  timetableSlots,
  substitutions,
  staff,
  subjects,
  classes,
  sections,
  notifications,
  auditLog,
} from '@classo/db';
import { eq, and, sql, desc, asc } from 'drizzle-orm';
import type {
  CreateTimetableDto,
  CreateTimetableSlotDto,
  CreateSubstitutionDto,
} from './timetable.dto';

@Injectable()
export class TimetableService {
  constructor(private readonly dbService: DatabaseService) {}

  async createTimetable(tenantId: string, userId: string, dto: CreateTimetableDto) {
    const db = this.dbService.getDb();

    const [created] = await db
      .insert(timetables)
      .values({
        instituteId: tenantId,
        academicYearId: dto.academicYearId,
        classId: dto.classId,
        sectionId: dto.sectionId,
        batchId: dto.batchId,
        name: dto.name,
      })
      .returning();

    await db.insert(auditLog).values({
      instituteId: tenantId,
      userId,
      action: 'timetable.created',
      entityType: 'timetables',
      entityId: created.id,
      diff: { name: dto.name, classId: dto.classId },
    });

    return created;
  }

  async getTimetables(tenantId: string, classId?: string, sectionId?: string) {
    const db = this.dbService.getDb();

    const conditions = [eq(timetables.instituteId, tenantId)];
    if (classId) conditions.push(eq(timetables.classId, classId));
    if (sectionId) conditions.push(eq(timetables.sectionId, sectionId));

    return db
      .select({
        id: timetables.id,
        name: timetables.name,
        status: timetables.status,
        classId: timetables.classId,
        sectionId: timetables.sectionId,
        className: classes.name,
        sectionName: sections.name,
        createdAt: timetables.createdAt,
      })
      .from(timetables)
      .leftJoin(classes, eq(timetables.classId, classes.id))
      .leftJoin(sections, eq(timetables.sectionId, sections.id))
      .where(and(...conditions));
  }

  async getTimetableDetails(tenantId: string, timetableId: string) {
    const db = this.dbService.getDb();

    const [tt] = await db
      .select()
      .from(timetables)
      .where(and(eq(timetables.instituteId, tenantId), eq(timetables.id, timetableId)));

    if (!tt) {
      throw new NotFoundException('Timetable not found');
    }

    const slots = await db
      .select({
        id: timetableSlots.id,
        dayOfWeek: timetableSlots.dayOfWeek,
        periodNumber: timetableSlots.periodNumber,
        startTime: timetableSlots.startTime,
        endTime: timetableSlots.endTime,
        subjectId: timetableSlots.subjectId,
        subjectName: subjects.name,
        teacherId: timetableSlots.teacherId,
        teacherName: staff.fullName,
        roomNumber: timetableSlots.roomNumber,
      })
      .from(timetableSlots)
      .leftJoin(subjects, eq(timetableSlots.subjectId, subjects.id))
      .leftJoin(staff, eq(timetableSlots.teacherId, staff.id))
      .where(
        and(
          eq(timetableSlots.instituteId, tenantId),
          eq(timetableSlots.timetableId, timetableId)
        )
      )
      .orderBy(asc(timetableSlots.dayOfWeek), asc(timetableSlots.periodNumber));

    return {
      timetable: tt,
      slots,
    };
  }

  async addSlot(tenantId: string, timetableId: string, dto: CreateTimetableSlotDto) {
    const db = this.dbService.getDb();

    // Verify timetable exists
    const [tt] = await db
      .select()
      .from(timetables)
      .where(and(eq(timetables.instituteId, tenantId), eq(timetables.id, timetableId)));

    if (!tt) {
      throw new NotFoundException('Timetable not found');
    }

    // CONFLICT DETECTION 1: Teacher double-booking (TT-02)
    const [teacherConflict] = await db
      .select({
        id: timetableSlots.id,
        periodNumber: timetableSlots.periodNumber,
        timetableId: timetableSlots.timetableId,
        teacherName: staff.fullName,
      })
      .from(timetableSlots)
      .leftJoin(staff, eq(timetableSlots.teacherId, staff.id))
      .where(
        and(
          eq(timetableSlots.instituteId, tenantId),
          eq(timetableSlots.teacherId, dto.teacherId),
          eq(timetableSlots.dayOfWeek, dto.dayOfWeek),
          eq(timetableSlots.periodNumber, dto.periodNumber)
        )
      );

    if (teacherConflict) {
      throw new BadRequestException(
        `Teacher conflict: ${teacherConflict.teacherName || 'Teacher'} is already scheduled for Period ${dto.periodNumber} on this day in another class timetable.`
      );
    }

    // CONFLICT DETECTION 2: Room double-booking (TT-02)
    if (dto.roomNumber) {
      const [roomConflict] = await db
        .select()
        .from(timetableSlots)
        .where(
          and(
            eq(timetableSlots.instituteId, tenantId),
            eq(timetableSlots.roomNumber, dto.roomNumber),
            eq(timetableSlots.dayOfWeek, dto.dayOfWeek),
            eq(timetableSlots.periodNumber, dto.periodNumber)
          )
        );

      if (roomConflict) {
        throw new BadRequestException(
          `Room conflict: Room ${dto.roomNumber} is already occupied during Period ${dto.periodNumber} on this day.`
        );
      }
    }

    const [slot] = await db
      .insert(timetableSlots)
      .values({
        instituteId: tenantId,
        timetableId,
        dayOfWeek: dto.dayOfWeek,
        periodNumber: dto.periodNumber,
        startTime: dto.startTime,
        endTime: dto.endTime,
        subjectId: dto.subjectId,
        teacherId: dto.teacherId,
        roomNumber: dto.roomNumber,
      })
      .returning();

    return slot;
  }

  async assignSubstitution(
    tenantId: string,
    assignedByUserId: string,
    dto: CreateSubstitutionDto
  ) {
    const db = this.dbService.getDb();

    // Look up original slot
    const [slot] = await db
      .select({
        id: timetableSlots.id,
        teacherId: timetableSlots.teacherId,
        periodNumber: timetableSlots.periodNumber,
        startTime: timetableSlots.startTime,
        endTime: timetableSlots.endTime,
        dayOfWeek: timetableSlots.dayOfWeek,
        originalTeacherName: staff.fullName,
      })
      .from(timetableSlots)
      .leftJoin(staff, eq(timetableSlots.teacherId, staff.id))
      .where(
        and(
          eq(timetableSlots.instituteId, tenantId),
          eq(timetableSlots.id, dto.timetableSlotId)
        )
      );

    if (!slot) {
      throw new NotFoundException('Timetable slot not found');
    }

    const [sub] = await db
      .insert(substitutions)
      .values({
        instituteId: tenantId,
        timetableSlotId: dto.timetableSlotId,
        date: dto.date,
        originalTeacherId: slot.teacherId,
        substituteTeacherId: dto.substituteTeacherId,
        reason: dto.reason,
        status: 'notified',
        notifiedAt: new Date(),
      })
      .returning();

    // Notification to substitute teacher (TT-03, COM-05)
    const [subTeacher] = await db
      .select()
      .from(staff)
      .where(and(eq(staff.instituteId, tenantId), eq(staff.id, dto.substituteTeacherId)));

    if (subTeacher?.userId) {
      await db.insert(notifications).values({
        instituteId: tenantId,
        userId: subTeacher.userId,
        title: 'Substitution Assigned',
        message: `You have been assigned to cover Period ${slot.periodNumber} (${slot.startTime}-${slot.endTime}) on ${dto.date} for ${slot.originalTeacherName || 'absent teacher'}.`,
        type: 'general',
      });
    }

    return {
      message: 'Substitution assigned and teacher notified successfully',
      substitution: sub,
    };
  }

  async getTeacherSchedule(tenantId: string, userId: string) {
    const db = this.dbService.getDb();

    const [staffRec] = await db
      .select()
      .from(staff)
      .where(and(eq(staff.instituteId, tenantId), eq(staff.userId, userId)));

    if (!staffRec) {
      return { slots: [], substitutions: [] };
    }

    const slots = await db
      .select({
        id: timetableSlots.id,
        dayOfWeek: timetableSlots.dayOfWeek,
        periodNumber: timetableSlots.periodNumber,
        startTime: timetableSlots.startTime,
        endTime: timetableSlots.endTime,
        subjectName: subjects.name,
        roomNumber: timetableSlots.roomNumber,
        className: classes.name,
        sectionName: sections.name,
      })
      .from(timetableSlots)
      .leftJoin(subjects, eq(timetableSlots.subjectId, subjects.id))
      .leftJoin(timetables, eq(timetableSlots.timetableId, timetables.id))
      .leftJoin(classes, eq(timetables.classId, classes.id))
      .leftJoin(sections, eq(timetables.sectionId, sections.id))
      .where(
        and(
          eq(timetableSlots.instituteId, tenantId),
          eq(timetableSlots.teacherId, staffRec.id)
        )
      )
      .orderBy(asc(timetableSlots.dayOfWeek), asc(timetableSlots.periodNumber));

    const today = new Date().toISOString().slice(0, 10);
    const subList = await db
      .select({
        id: substitutions.id,
        date: substitutions.date,
        reason: substitutions.reason,
        status: substitutions.status,
        originalTeacherName: staff.fullName,
      })
      .from(substitutions)
      .leftJoin(staff, eq(substitutions.originalTeacherId, staff.id))
      .where(
        and(
          eq(substitutions.instituteId, tenantId),
          eq(substitutions.substituteTeacherId, staffRec.id),
          eq(substitutions.date, today)
        )
      );

    return {
      staff: staffRec,
      slots,
      substitutions: subList,
    };
  }
}
