import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import {
  staff,
  users,
  invites,
  teachingAssignments,
  leaveTypes,
  leaveRequests,
  auditLog,
  getPool,
  createDrizzleClient,
} from '@classo/db';
import {
  InviteTeacherInput,
  AssignTeachingInput,
  CreateLeaveTypeInput,
  SubmitLeaveRequestInput,
  ReviewLeaveRequestInput,
} from './staff.dto.js';
import crypto from 'crypto';
import { INVITE_EXPIRY_HOURS } from '@classo/config';

@Injectable()
export class StaffService {
  private getDb() {
    return createDrizzleClient(getPool());
  }

  /**
   * PRD STF-15: Teacher onboarding by Principal
   * Creates user, staff profile, and generates a 72-hour one-time invite link
   */
  async inviteTeacher(instituteId: string, input: InviteTeacherInput, actorId?: string) {
    const db = this.getDb();

    // Check duplicate email
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.instituteId, instituteId), eq(users.email, input.email)))
      .limit(1);

    if (existingUser.length > 0) {
      throw new ConflictException({
        code: 'USER_EXISTS',
        message: 'A staff member with this email is already registered in your institute.',
      });
    }

    // 1. Create User account with role 'teacher'
    const [newUser] = await db
      .insert(users)
      .values({
        instituteId,
        email: input.email,
        phone: input.phone,
        fullName: input.fullName,
        role: 'teacher',
        isActive: true, // Will activate password upon accepting invite
      })
      .returning();

    // 2. Create Staff Profile (STF-01)
    const employeeCode = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
    const [newStaff] = await db
      .insert(staff)
      .values({
        instituteId,
        userId: newUser.id,
        employeeCode,
        designation: input.designation,
        departmentId: input.departmentId,
        joiningDate: input.joiningDate ? new Date(input.joiningDate) : new Date(),
        qualification: input.qualification,
      })
      .returning();

    // 3. Generate 72-hour one-time invite token (STF-15, USR-03)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + INVITE_EXPIRY_HOURS);

    await db.insert(invites).values({
      instituteId,
      email: input.email,
      phone: input.phone,
      role: 'teacher',
      tokenHash,
      expiresAt,
    });

    // 4. Audit Log (CC-05)
    await db.insert(auditLog).values({
      instituteId,
      userId: actorId,
      action: 'staff.invited',
      entityType: 'staff',
      entityId: newStaff.id,
      diff: { after: { fullName: input.fullName, designation: input.designation } },
    });

    const inviteLink = `https://app.classo.in/set-password?token=${rawToken}`;

    return {
      staff: newStaff,
      user: newUser,
      inviteLink,
      expiresAt,
      message: `Teacher ${input.fullName} invited successfully! One-time invite link generated (valid 72h).`,
    };
  }

  /**
   * PRD STF-01: List staff profiles
   */
  async listStaff(instituteId: string, departmentId?: string) {
    const db = this.getDb();
    if (departmentId) {
      return db
        .select()
        .from(staff)
        .where(and(eq(staff.instituteId, instituteId), eq(staff.departmentId, departmentId)));
    }
    return db.select().from(staff).where(eq(staff.instituteId, instituteId));
  }

  /**
   * PRD STF-04: Teaching Assignment
   */
  async assignTeaching(instituteId: string, input: AssignTeachingInput) {
    const db = this.getDb();
    const [assignment] = await db
      .insert(teachingAssignments)
      .values({
        instituteId,
        staffId: input.staffId,
        subjectId: input.subjectId,
        classId: input.classId,
        sectionId: input.sectionId,
        batchId: input.batchId,
        academicYearId: input.academicYearId,
      })
      .returning();

    return assignment;
  }

  async listTeachingAssignments(instituteId: string, staffId?: string) {
    const db = this.getDb();
    if (staffId) {
      return db
        .select()
        .from(teachingAssignments)
        .where(
          and(
            eq(teachingAssignments.instituteId, instituteId),
            eq(teachingAssignments.staffId, staffId)
          )
        );
    }
    return db
      .select()
      .from(teachingAssignments)
      .where(eq(teachingAssignments.instituteId, instituteId));
  }

  /**
   * PRD STF-03: Leave Management
   */
  async createLeaveType(instituteId: string, input: CreateLeaveTypeInput) {
    const db = this.getDb();
    const [type] = await db
      .insert(leaveTypes)
      .values({
        instituteId,
        name: input.name,
        daysAllowed: input.daysAllowed,
        isPaid: input.isPaid,
      })
      .returning();
    return type;
  }

  async listLeaveTypes(instituteId: string) {
    const db = this.getDb();
    return db.select().from(leaveTypes).where(eq(leaveTypes.instituteId, instituteId));
  }

  async submitLeaveRequest(
    instituteId: string,
    staffId: string,
    input: SubmitLeaveRequestInput
  ) {
    const db = this.getDb();
    const [req] = await db
      .insert(leaveRequests)
      .values({
        instituteId,
        staffId,
        leaveTypeId: input.leaveTypeId,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        reason: input.reason,
        status: 'pending',
      })
      .returning();
    return req;
  }

  async reviewLeaveRequest(
    instituteId: string,
    requestId: string,
    input: ReviewLeaveRequestInput,
    reviewerId?: string
  ) {
    const db = this.getDb();
    const [updated] = await db
      .update(leaveRequests)
      .set({
        status: input.status,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      })
      .where(
        and(eq(leaveRequests.instituteId, instituteId), eq(leaveRequests.id, requestId))
      )
      .returning();

    if (!updated) {
      throw new NotFoundException({ code: 'REQUEST_NOT_FOUND', message: 'Leave request not found.' });
    }
    return updated;
  }
}
