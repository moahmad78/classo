import { Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import {
  classes,
  sections,
  batches,
  subjects,
  getPool,
  createDrizzleClient,
} from '@classo/db';
import {
  CreateClassInput,
  CreateSectionInput,
  CreateBatchInput,
  CreateSubjectInput,
} from './structure.dto.js';

@Injectable()
export class StructureService {
  private getDb() {
    return createDrizzleClient(getPool());
  }

  // Classes (SET-02)
  async createClass(instituteId: string, input: CreateClassInput) {
    const db = this.getDb();
    const [newClass] = await db
      .insert(classes)
      .values({
        instituteId,
        name: input.name,
        code: input.code,
        departmentId: input.departmentId,
        academicYearId: input.academicYearId,
      })
      .returning();
    return newClass;
  }

  async listClasses(instituteId: string) {
    const db = this.getDb();
    return db.select().from(classes).where(eq(classes.instituteId, instituteId));
  }

  // Sections (SET-02)
  async createSection(instituteId: string, input: CreateSectionInput) {
    const db = this.getDb();
    const [newSection] = await db
      .insert(sections)
      .values({
        instituteId,
        classId: input.classId,
        name: input.name,
        capacity: input.capacity,
        roomNumber: input.roomNumber,
      })
      .returning();
    return newSection;
  }

  async listSections(instituteId: string, classId?: string) {
    const db = this.getDb();
    if (classId) {
      return db
        .select()
        .from(sections)
        .where(and(eq(sections.instituteId, instituteId), eq(sections.classId, classId)));
    }
    return db.select().from(sections).where(eq(sections.instituteId, instituteId));
  }

  // Batches (SET-02: Coaching)
  async createBatch(instituteId: string, input: CreateBatchInput) {
    const db = this.getDb();
    const [newBatch] = await db
      .insert(batches)
      .values({
        instituteId,
        name: input.name,
        code: input.code,
        capacity: input.capacity,
        academicYearId: input.academicYearId,
      })
      .returning();
    return newBatch;
  }

  async listBatches(instituteId: string) {
    const db = this.getDb();
    return db.select().from(batches).where(eq(batches.instituteId, instituteId));
  }

  // Subjects (SET-02)
  async createSubject(instituteId: string, input: CreateSubjectInput) {
    const db = this.getDb();
    const [newSubject] = await db
      .insert(subjects)
      .values({
        instituteId,
        name: input.name,
        code: input.code,
        departmentId: input.departmentId,
      })
      .returning();
    return newSubject;
  }

  async listSubjects(instituteId: string) {
    const db = this.getDb();
    return db.select().from(subjects).where(eq(subjects.instituteId, instituteId));
  }
}
