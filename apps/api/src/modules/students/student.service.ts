import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { eq, and, desc, sql, ilike, or } from 'drizzle-orm';
import { students, auditLog, getPool, createDrizzleClient } from '@classo/db';
import { CreateStudentInput, UpdateStudentStatusInput, BulkImportStudentRow } from './student.dto.js';

@Injectable()
export class StudentService {
  private getDb() {
    return createDrizzleClient(getPool());
  }

  /**
   * PRD STU-01, STU-02: Create student with unique admission number
   */
  async createStudent(instituteId: string, input: CreateStudentInput, actorId?: string) {
    const db = this.getDb();
    const currentYear = new Date().getFullYear();

    // Auto-generate admission number if omitted (STU-02)
    const admissionNo =
      input.admissionNo?.trim() ||
      `ADM-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Verify unique admission number per tenant (PRD 9.3)
    const existing = await db
      .select({ id: students.id })
      .from(students)
      .where(and(eq(students.instituteId, instituteId), eq(students.admissionNo, admissionNo)))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException({
        code: 'DUPLICATE_ADMISSION_NO',
        message: `Admission number '${admissionNo}' already exists in this institute.`,
      });
    }

    const [newStudent] = await db
      .insert(students)
      .values({
        instituteId,
        admissionNo,
        rollNo: input.rollNo,
        fullName: input.fullName,
        gender: input.gender,
        dob: input.dob ? new Date(input.dob) : undefined,
        bloodGroup: input.bloodGroup,
        classId: input.classId,
        sectionId: input.sectionId,
        batchId: input.batchId,
        parentName: input.parentName,
        parentPhone: input.parentPhone,
        parentEmail: input.parentEmail,
        address: input.address,
        medicalNotes: input.medicalNotes,
        status: 'active',
      })
      .returning();

    // Audit log (CC-05)
    await db.insert(auditLog).values({
      instituteId,
      userId: actorId,
      action: 'student.created',
      entityType: 'student',
      entityId: newStudent.id,
      diff: { after: { fullName: newStudent.fullName, admissionNo: newStudent.admissionNo } },
    });

    return newStudent;
  }

  /**
   * PRD STU-03, PERF-02: Paginated list with indexed filters
   */
  async listStudents(
    instituteId: string,
    filters: {
      classId?: string;
      sectionId?: string;
      batchId?: string;
      status?: string;
      search?: string;
      page?: number;
      pageSize?: number;
    }
  ) {
    const db = this.getDb();
    const page = Math.max(1, filters.page || 1);
    const pageSize = Math.min(100, Math.max(1, filters.pageSize || 20));
    const offset = (page - 1) * pageSize;

    const conditions = [eq(students.instituteId, instituteId)];

    if (filters.classId) conditions.push(eq(students.classId, filters.classId));
    if (filters.sectionId) conditions.push(eq(students.sectionId, filters.sectionId));
    if (filters.batchId) conditions.push(eq(students.batchId, filters.batchId));
    if (filters.status) conditions.push(eq(students.status, filters.status));
    if (filters.search) {
      conditions.push(
        or(
          ilike(students.fullName, `%${filters.search}%`),
          ilike(students.admissionNo, `%${filters.search}%`),
          ilike(students.parentPhone, `%${filters.search}%`)
        )!
      );
    }

    const whereClause = and(...conditions);

    const [totalRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(students)
      .where(whereClause);

    const data = await db
      .select()
      .from(students)
      .where(whereClause)
      .orderBy(desc(students.createdAt))
      .limit(pageSize)
      .offset(offset);

    const total = totalRes?.count || 0;
    return {
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * PRD STU-05: Update student status (active, alumni, transferred, dropped)
   */
  async updateStatus(
    instituteId: string,
    studentId: string,
    input: UpdateStudentStatusInput,
    actorId?: string
  ) {
    const db = this.getDb();
    const [updated] = await db
      .update(students)
      .set({ status: input.status, updatedAt: new Date() })
      .where(and(eq(students.instituteId, instituteId), eq(students.id, studentId)))
      .returning();

    if (!updated) {
      throw new NotFoundException({ code: 'STUDENT_NOT_FOUND', message: 'Student not found.' });
    }

    // Audit log
    await db.insert(auditLog).values({
      instituteId,
      userId: actorId,
      action: `student.status_changed.${input.status}`,
      entityType: 'student',
      entityId: studentId,
      diff: { after: { status: input.status, reason: input.reason } },
    });

    return updated;
  }

  /**
   * PRD STU-06, CC-06: Bulk import with validation & dry-run report
   */
  async bulkImport(
    instituteId: string,
    rows: BulkImportStudentRow[],
    classId?: string,
    sectionId?: string,
    dryRun = true
  ) {
    const errors: Array<{ rowNumber: number; studentName: string; error: string }> = [];
    const validRows: any[] = [];
    const currentYear = new Date().getFullYear();

    rows.forEach((row, index) => {
      const rowNum = index + 1;
      if (!row.fullName || row.fullName.trim().length < 2) {
        errors.push({ rowNumber: rowNum, studentName: row.fullName || 'Unknown', error: 'Full name is required' });
        return;
      }
      if (!row.parentPhone || row.parentPhone.trim().length < 10) {
        errors.push({ rowNumber: rowNum, studentName: row.fullName, error: 'Valid 10-digit parent phone is required' });
        return;
      }

      validRows.push({
        instituteId,
        admissionNo: `ADM-${currentYear}-${Math.floor(1000 + Math.random() * 90000)}`,
        fullName: row.fullName.trim(),
        rollNo: row.rollNo?.trim(),
        gender: row.gender?.toLowerCase() || 'other',
        classId,
        sectionId,
        parentName: row.parentName.trim(),
        parentPhone: row.parentPhone.trim(),
        parentEmail: row.parentEmail?.trim(),
        status: 'active',
      });
    });

    if (dryRun) {
      return {
        dryRun: true,
        totalRows: rows.length,
        validCount: validRows.length,
        errorCount: errors.length,
        errors,
        sampleValidPreview: validRows.slice(0, 3),
      };
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        code: 'IMPORT_VALIDATION_FAILED',
        message: `Validation failed for ${errors.length} rows. Please correct errors before importing.`,
        details: errors,
      });
    }

    const db = this.getDb();
    const inserted = await db.insert(students).values(validRows).returning();

    return {
      dryRun: false,
      importedCount: inserted.length,
      message: `Successfully imported ${inserted.length} students!`,
    };
  }
}
