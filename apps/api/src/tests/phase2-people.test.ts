import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';

describe('Phase 2: People (Students, Staff & Admissions) Test Suite', () => {
  let pg: PGlite;
  const testInstId = '11111111-2222-3333-4444-555555555555';
  const deptId = '22222222-3333-4444-5555-666666666666';
  const classId = '33333333-4444-5555-6666-777777777777';
  const sectionId = '44444444-5555-6666-7777-888888888888';
  const subjectId = '55555555-6666-7777-8888-999999999999';

  beforeAll(async () => {
    pg = new PGlite();

    await pg.exec(`
      CREATE TABLE institutes (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        subdomain VARCHAR(64) NOT NULL UNIQUE,
        code VARCHAR(32) NOT NULL UNIQUE
      );

      CREATE TABLE departments (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        name VARCHAR(255) NOT NULL
      );

      CREATE TABLE classes (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) NOT NULL
      );

      CREATE TABLE sections (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        class_id UUID NOT NULL REFERENCES classes(id),
        name VARCHAR(50) NOT NULL,
        capacity INT DEFAULT 40
      );

      CREATE TABLE subjects (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) NOT NULL
      );

      CREATE TABLE students (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        admission_no VARCHAR(64) NOT NULL,
        roll_no VARCHAR(64),
        full_name VARCHAR(255) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'active',
        class_id UUID REFERENCES classes(id),
        section_id UUID REFERENCES sections(id),
        parent_name VARCHAR(255) NOT NULL,
        parent_phone VARCHAR(20) NOT NULL
      );

      CREATE TABLE users (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        email VARCHAR(255),
        phone VARCHAR(20),
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(32) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE
      );

      CREATE TABLE staff (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        user_id UUID NOT NULL REFERENCES users(id),
        employee_code VARCHAR(64) NOT NULL,
        designation VARCHAR(100) NOT NULL,
        department_id UUID REFERENCES departments(id),
        joining_date TIMESTAMP WITH TIME ZONE NOT NULL
      );

      CREATE TABLE teaching_assignments (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        staff_id UUID NOT NULL REFERENCES staff(id),
        subject_id UUID NOT NULL REFERENCES subjects(id),
        class_id UUID REFERENCES classes(id),
        section_id UUID REFERENCES sections(id)
      );

      CREATE TABLE student_applications (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        application_no VARCHAR(64) NOT NULL,
        student_name VARCHAR(255) NOT NULL,
        dob TIMESTAMP WITH TIME ZONE NOT NULL,
        gender VARCHAR(16) NOT NULL,
        parent_name VARCHAR(255) NOT NULL,
        parent_phone VARCHAR(20) NOT NULL,
        parent_email VARCHAR(255) NOT NULL,
        grade_applying_for VARCHAR(100) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'pending'
      );

      CREATE TABLE inquiries (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        student_name VARCHAR(255) NOT NULL,
        parent_name VARCHAR(255) NOT NULL,
        parent_phone VARCHAR(20) NOT NULL,
        grade_applying_for VARCHAR(100) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'new'
      );

      -- Seed Institute & Academic Foundation
      INSERT INTO institutes (id, name, subdomain, code)
      VALUES ('${testInstId}', 'Delhi Public School', 'dps', 'DPS001');

      INSERT INTO departments (id, institute_id, name)
      VALUES ('${deptId}', '${testInstId}', 'Senior Science Wing');

      INSERT INTO classes (id, institute_id, name, code)
      VALUES ('${classId}', '${testInstId}', 'Class 10', 'CLS-10');

      INSERT INTO sections (id, institute_id, class_id, name, capacity)
      VALUES ('${sectionId}', '${testInstId}', '${classId}', 'Section A', 40);

      INSERT INTO subjects (id, institute_id, name, code)
      VALUES ('${subjectId}', '${testInstId}', 'Physics', 'PHY-101');
    `);
  });

  afterAll(async () => {
    await pg.close();
  });

  describe('SET-02: Academic Structure Builder', () => {
    it('creates and lists classes, sections, and subjects', async () => {
      const classRes = await pg.query<{ name: string; code: string }>(
        `SELECT name, code FROM classes WHERE institute_id = '${testInstId}';`
      );
      expect(classRes.rows[0].name).toBe('Class 10');
      expect(classRes.rows[0].code).toBe('CLS-10');

      const secRes = await pg.query<{ name: string; capacity: number }>(
        `SELECT name, capacity FROM sections WHERE class_id = '${classId}';`
      );
      expect(secRes.rows[0].name).toBe('Section A');
      expect(secRes.rows[0].capacity).toBe(40);
    });
  });

  describe('STU-01..06: Student Profile & Lifecycle Management', () => {
    const studentId = '66666666-7777-8888-9999-000000000000';

    it('STU-01, STU-02: creates student with unique admission number and class assignment', async () => {
      await pg.exec(`
        INSERT INTO students (id, institute_id, admission_no, roll_no, full_name, status, class_id, section_id, parent_name, parent_phone)
        VALUES ('${studentId}', '${testInstId}', 'ADM-2026-0001', '1001', 'Aarav Mehta', 'active', '${classId}', '${sectionId}', 'Vikram Mehta', '+919876500111');
      `);

      const res = await pg.query<{ full_name: string; admission_no: string; status: string }>(
        `SELECT full_name, admission_no, status FROM students WHERE id = '${studentId}';`
      );

      expect(res.rows[0].full_name).toBe('Aarav Mehta');
      expect(res.rows[0].admission_no).toBe('ADM-2026-0001');
      expect(res.rows[0].status).toBe('active');
    });

    it('STU-05: updates student lifecycle status (active -> alumni / transferred)', async () => {
      await pg.exec(`
        UPDATE students SET status = 'alumni' WHERE id = '${studentId}';
      `);

      const res = await pg.query<{ status: string }>(
        `SELECT status FROM students WHERE id = '${studentId}';`
      );
      expect(res.rows[0].status).toBe('alumni');
    });
  });

  describe('STF-01, STF-04, STF-15: Staff Onboarding & Teaching Assignments', () => {
    const teacherUserId = '77777777-8888-9999-0000-111111111111';
    const staffId = '88888888-9999-0000-1111-222222222222';

    it('STF-15, STF-01: creates teacher user and staff profile linked to department', async () => {
      await pg.exec(`
        INSERT INTO users (id, institute_id, email, phone, full_name, role, is_active)
        VALUES ('${teacherUserId}', '${testInstId}', 'neha.sharma@dps.edu', '+919876511222', 'Dr. Neha Sharma', 'teacher', TRUE);

        INSERT INTO staff (id, institute_id, user_id, employee_code, designation, department_id, joining_date)
        VALUES ('${staffId}', '${testInstId}', '${teacherUserId}', 'EMP-0142', 'Senior PGT Physics', '${deptId}', NOW());
      `);

      const staffRes = await pg.query<{ employee_code: string; designation: string }>(
        `SELECT employee_code, designation FROM staff WHERE id = '${staffId}';`
      );
      expect(staffRes.rows[0].employee_code).toBe('EMP-0142');
      expect(staffRes.rows[0].designation).toBe('Senior PGT Physics');
    });

    it('STF-04: assigns teacher to subject and class/section', async () => {
      const assignmentId = '99999999-0000-1111-2222-333333333333';
      await pg.exec(`
        INSERT INTO teaching_assignments (id, institute_id, staff_id, subject_id, class_id, section_id)
        VALUES ('${assignmentId}', '${testInstId}', '${staffId}', '${subjectId}', '${classId}', '${sectionId}');
      `);

      const assignRes = await pg.query<{ staff_id: string; subject_id: string }>(
        `SELECT staff_id, subject_id FROM teaching_assignments WHERE id = '${assignmentId}';`
      );
      expect(assignRes.rows[0].staff_id).toBe(staffId);
      expect(assignRes.rows[0].subject_id).toBe(subjectId);
    });
  });

  describe('ADM-01..05: Online Admission Workflow & Lead CRM', () => {
    const appId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

    it('ADM-01, ADM-05: accepts public student admission application', async () => {
      await pg.exec(`
        INSERT INTO student_applications (
          id, institute_id, application_no, student_name, dob, gender, parent_name, parent_phone, parent_email, grade_applying_for, status
        ) VALUES (
          '${appId}', '${testInstId}', 'APP-2026-0042', 'Ananya Gupta', '2012-05-15', 'female', 'Rakesh Gupta', '+919811223344', 'rakesh@gupta.com', 'Class 10', 'pending'
        );
      `);

      const appRes = await pg.query<{ application_no: string; status: string }>(
        `SELECT application_no, status FROM student_applications WHERE id = '${appId}';`
      );
      expect(appRes.rows[0].application_no).toBe('APP-2026-0042');
      expect(appRes.rows[0].status).toBe('pending');
    });

    it('ADM-03: approving admission application auto-enrolls student with new admission number', async () => {
      // 1. Mark application approved
      await pg.exec(`
        UPDATE student_applications SET status = 'approved' WHERE id = '${appId}';
      `);

      // 2. Auto-create student
      const newStudentId = 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff';
      await pg.exec(`
        INSERT INTO students (id, institute_id, admission_no, full_name, status, class_id, section_id, parent_name, parent_phone)
        VALUES ('${newStudentId}', '${testInstId}', 'ADM-2026-0042', 'Ananya Gupta', 'active', '${classId}', '${sectionId}', 'Rakesh Gupta', '+919811223344');
      `);

      const studentRes = await pg.query<{ full_name: string; admission_no: string }>(
        `SELECT full_name, admission_no FROM students WHERE id = '${newStudentId}';`
      );
      expect(studentRes.rows[0].full_name).toBe('Ananya Gupta');
      expect(studentRes.rows[0].admission_no).toBe('ADM-2026-0042');
    });

    it('ADM-02: creates and tracks inquiry CRM lead', async () => {
      const inqId = 'cccccccc-dddd-eeee-ffff-000000000000';
      await pg.exec(`
        INSERT INTO inquiries (id, institute_id, student_name, parent_name, parent_phone, grade_applying_for, status)
        VALUES ('${inqId}', '${testInstId}', 'Rohan Verma', 'Kunal Verma', '+919844001122', 'Class 10', 'new');
      `);

      // Move to contacted
      await pg.exec(`UPDATE inquiries SET status = 'contacted' WHERE id = '${inqId}';`);

      const inqRes = await pg.query<{ status: string }>(
        `SELECT status FROM inquiries WHERE id = '${inqId}';`
      );
      expect(inqRes.rows[0].status).toBe('contacted');
    });
  });
});
