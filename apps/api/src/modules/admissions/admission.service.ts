import { Injectable, NotFoundException } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import {
  inquiries,
  studentApplications,
  students,
  auditLog,
  getPool,
  createDrizzleClient,
} from '@classo/db';
import {
  CreateInquiryInput,
  UpdateInquiryStatusInput,
  SubmitStudentApplicationInput,
} from './admission.dto.js';

@Injectable()
export class AdmissionService {
  private getDb() {
    return createDrizzleClient(getPool());
  }

  // Inquiries CRM (ADM-02)
  async createInquiry(instituteId: string, input: CreateInquiryInput) {
    const db = this.getDb();
    const [inquiry] = await db
      .insert(inquiries)
      .values({
        instituteId,
        studentName: input.studentName,
        parentName: input.parentName,
        parentPhone: input.parentPhone,
        parentEmail: input.parentEmail,
        gradeApplyingFor: input.gradeApplyingFor,
        source: input.source,
        notes: input.notes,
        status: 'new',
      })
      .returning();
    return inquiry;
  }

  async listInquiries(instituteId: string, status?: string) {
    const db = this.getDb();
    if (status) {
      return db
        .select()
        .from(inquiries)
        .where(and(eq(inquiries.instituteId, instituteId), eq(inquiries.status, status)))
        .orderBy(desc(inquiries.createdAt));
    }
    return db
      .select()
      .from(inquiries)
      .where(eq(inquiries.instituteId, instituteId))
      .orderBy(desc(inquiries.createdAt));
  }

  async updateInquiryStatus(
    instituteId: string,
    id: string,
    input: UpdateInquiryStatusInput
  ) {
    const db = this.getDb();
    const [updated] = await db
      .update(inquiries)
      .set({
        status: input.status,
        notes: input.notes,
        updatedAt: new Date(),
      })
      .where(and(eq(inquiries.instituteId, instituteId), eq(inquiries.id, id)))
      .returning();

    if (!updated) {
      throw new NotFoundException({ code: 'INQUIRY_NOT_FOUND', message: 'Inquiry not found.' });
    }
    return updated;
  }

  // Public Student Admission Applications (ADM-01, ADM-05)
  async submitApplication(instituteId: string, input: SubmitStudentApplicationInput) {
    const db = this.getDb();
    const currentYear = new Date().getFullYear();

    // PRD ADM-05: Duplicate detection warning (same student name + parent phone)
    const existing = await db
      .select({ id: studentApplications.id, applicationNo: studentApplications.applicationNo })
      .from(studentApplications)
      .where(
        and(
          eq(studentApplications.instituteId, instituteId),
          eq(studentApplications.studentName, input.studentName),
          eq(studentApplications.parentPhone, input.parentPhone)
        )
      )
      .limit(1);

    const isDuplicate = existing.length > 0;

    const applicationNo = `APP-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`;

    const [app] = await db
      .insert(studentApplications)
      .values({
        instituteId,
        applicationNo,
        studentName: input.studentName,
        dob: new Date(input.dob),
        gender: input.gender,
        parentName: input.parentName,
        parentPhone: input.parentPhone,
        parentEmail: input.parentEmail,
        gradeApplyingFor: input.gradeApplyingFor,
        address: input.address,
        status: 'pending',
      })
      .returning();

    return {
      application: app,
      isDuplicateWarning: isDuplicate,
      message: isDuplicate
        ? 'Application submitted. Note: A previous application with this student and parent phone was found.'
        : 'Application submitted successfully! Your application number is ' + applicationNo,
    };
  }

  async listApplications(instituteId: string, status?: string) {
    const db = this.getDb();
    if (status) {
      return db
        .select()
        .from(studentApplications)
        .where(
          and(
            eq(studentApplications.instituteId, instituteId),
            eq(studentApplications.status, status)
          )
        )
        .orderBy(desc(studentApplications.createdAt));
    }
    return db
      .select()
      .from(studentApplications)
      .where(eq(studentApplications.instituteId, instituteId))
      .orderBy(desc(studentApplications.createdAt));
  }

  /**
   * PRD ADM-03: Approve application -> auto-generate student account + admission number
   */
  async approveApplication(instituteId: string, applicationId: string, actorId?: string) {
    const db = this.getDb();
    const currentYear = new Date().getFullYear();

    const [app] = await db
      .select()
      .from(studentApplications)
      .where(
        and(
          eq(studentApplications.instituteId, instituteId),
          eq(studentApplications.id, applicationId)
        )
      )
      .limit(1);

    if (!app) {
      throw new NotFoundException({ code: 'APPLICATION_NOT_FOUND', message: 'Application not found.' });
    }

    // 1. Mark application approved
    await db
      .update(studentApplications)
      .set({ status: 'approved', updatedAt: new Date() })
      .where(eq(studentApplications.id, applicationId));

    // 2. Create Student profile (STU-01, STU-02)
    const admissionNo = `ADM-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`;

    const [newStudent] = await db
      .insert(students)
      .values({
        instituteId,
        admissionNo,
        fullName: app.studentName,
        gender: app.gender,
        dob: app.dob,
        parentName: app.parentName,
        parentPhone: app.parentPhone,
        parentEmail: app.parentEmail,
        address: app.address,
        status: 'active',
      })
      .returning();

    // 3. Audit log (CC-05)
    await db.insert(auditLog).values({
      instituteId,
      userId: actorId,
      action: 'admission.approved',
      entityType: 'student_application',
      entityId: applicationId,
      diff: { after: { studentId: newStudent.id, admissionNo: newStudent.admissionNo } },
    });

    return {
      success: true,
      student: newStudent,
      message: `Application approved! Student enrolled with Admission No: ${newStudent.admissionNo}`,
    };
  }
}
