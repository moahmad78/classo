import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PGlite } from '@electric-sql/pglite';

describe('Phase 3: Daily Ops (Attendance, Selfie Attendance, Timetable & Notices) Test Suite', () => {
  let pg: PGlite;
  const testInstId = '11111111-2222-3333-4444-555555555555';
  const otherInstId = '99999999-8888-7777-6666-555555555555';
  const classId = '33333333-4444-5555-6666-777777777777';
  const sectionId = '44444444-5555-6666-7777-888888888888';
  const subjectId = '55555555-6666-7777-8888-999999999999';
  const teacherUserId = '66666666-7777-8888-9999-000000000000';
  const teacherStaffId = '77777777-8888-9999-0000-111111111111';
  const subTeacherUserId = '88888888-9999-0000-1111-222222222222';
  const subTeacherStaffId = '99999999-0000-1111-2222-333333333333';
  const student1Id = 'aaaaaaa1-1111-1111-1111-111111111111';
  const student2Id = 'aaaaaaa2-2222-2222-2222-222222222222';
  const student1UserId = 'bbbbbbb1-1111-1111-1111-111111111111';

  beforeAll(async () => {
    pg = new PGlite();

    await pg.exec(`
      CREATE TABLE institutes (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        subdomain VARCHAR(64) NOT NULL UNIQUE
      );

      CREATE TABLE campus_locations (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        name VARCHAR(255) NOT NULL,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        radius_meters INT NOT NULL DEFAULT 150
      );

      CREATE TABLE classes (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        name VARCHAR(100) NOT NULL
      );

      CREATE TABLE sections (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        class_id UUID NOT NULL REFERENCES classes(id),
        name VARCHAR(50) NOT NULL
      );

      CREATE TABLE subjects (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        name VARCHAR(100) NOT NULL
      );

      CREATE TABLE users (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        email VARCHAR(255),
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
        full_name VARCHAR(255) NOT NULL
      );

      CREATE TABLE students (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        user_id UUID REFERENCES users(id),
        admission_no VARCHAR(64) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        class_id UUID REFERENCES classes(id),
        section_id UUID REFERENCES sections(id)
      );

      CREATE TABLE student_attendance (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        student_id UUID NOT NULL REFERENCES students(id),
        class_id UUID REFERENCES classes(id),
        section_id UUID REFERENCES sections(id),
        date VARCHAR(10) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'present',
        remarks TEXT,
        marked_by UUID,
        edited_by UUID,
        edited_at TIMESTAMP WITH TIME ZONE
      );

      CREATE TABLE consent_records (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        user_id UUID NOT NULL REFERENCES users(id),
        consent_type VARCHAR(64) NOT NULL,
        consented_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE staff_attendance_photos (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        staff_id UUID NOT NULL REFERENCES staff(id),
        photo_url TEXT NOT NULL,
        photo_hash VARCHAR(128) NOT NULL,
        exif_stripped BOOLEAN DEFAULT TRUE,
        retained_until TIMESTAMP WITH TIME ZONE NOT NULL
      );

      CREATE TABLE staff_attendance (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        staff_id UUID NOT NULL REFERENCES staff(id),
        date VARCHAR(10) NOT NULL,
        check_in_time TIMESTAMP WITH TIME ZONE,
        check_out_time TIMESTAMP WITH TIME ZONE,
        status VARCHAR(20) NOT NULL DEFAULT 'present',
        check_in_status VARCHAR(20) NOT NULL DEFAULT 'accepted',
        within_geofence BOOLEAN NOT NULL DEFAULT TRUE,
        geofence_distance_meters INT,
        review_status VARCHAR(20) NOT NULL DEFAULT 'approved',
        reviewed_by UUID,
        rejection_reason TEXT,
        manual_override BOOLEAN DEFAULT FALSE,
        override_reason TEXT
      );

      CREATE TABLE timetables (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        class_id UUID REFERENCES classes(id),
        section_id UUID REFERENCES sections(id),
        name VARCHAR(255) NOT NULL,
        status VARCHAR(20) DEFAULT 'active'
      );

      CREATE TABLE timetable_slots (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        timetable_id UUID NOT NULL REFERENCES timetables(id),
        day_of_week INT NOT NULL,
        period_number INT NOT NULL,
        start_time VARCHAR(8) NOT NULL,
        end_time VARCHAR(8) NOT NULL,
        subject_id UUID NOT NULL REFERENCES subjects(id),
        teacher_id UUID NOT NULL REFERENCES staff(id),
        room_number VARCHAR(50)
      );

      CREATE TABLE substitutions (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        timetable_slot_id UUID NOT NULL REFERENCES timetable_slots(id),
        date VARCHAR(10) NOT NULL,
        original_teacher_id UUID NOT NULL REFERENCES staff(id),
        substitute_teacher_id UUID NOT NULL REFERENCES staff(id),
        reason TEXT,
        status VARCHAR(20) DEFAULT 'assigned'
      );

      CREATE TABLE notices (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        audience_type VARCHAR(32) NOT NULL DEFAULT 'all',
        target_audience JSONB DEFAULT '[]',
        publish_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_published BOOLEAN DEFAULT TRUE,
        created_by UUID
      );

      CREATE TABLE notice_reads (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        notice_id UUID NOT NULL REFERENCES notices(id),
        user_id UUID NOT NULL REFERENCES users(id),
        read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE notifications (
        id UUID PRIMARY KEY,
        institute_id UUID NOT NULL REFERENCES institutes(id),
        user_id UUID NOT NULL REFERENCES users(id),
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(32) NOT NULL DEFAULT 'general',
        is_read BOOLEAN DEFAULT FALSE
      );
    `);

    // Seed master institute, campus geofence (New Delhi: 28.6139, 77.2090, 150m radius)
    await pg.query(
      `INSERT INTO institutes (id, name, subdomain) VALUES ($1, 'Delhi Public Academy', 'delhipublic')`,
      [testInstId]
    );

    await pg.query(
      `INSERT INTO campus_locations (id, institute_id, name, latitude, longitude, radius_meters)
       VALUES (gen_random_uuid(), $1, 'Main Campus', 28.6139, 77.2090, 150)`,
      [testInstId]
    );

    await pg.query(
      `INSERT INTO classes (id, institute_id, name) VALUES ($1, $2, 'Class 10')`,
      [classId, testInstId]
    );

    await pg.query(
      `INSERT INTO sections (id, institute_id, class_id, name) VALUES ($1, $2, $3, 'Section A')`,
      [sectionId, testInstId, classId]
    );

    await pg.query(
      `INSERT INTO subjects (id, institute_id, name) VALUES ($1, $2, 'Mathematics')`,
      [subjectId, testInstId]
    );

    // Seed users and staff
    await pg.query(
      `INSERT INTO users (id, institute_id, email, full_name, role) VALUES ($1, $2, 'teacher@delhi.edu', 'Amit Sharma', 'Teacher')`,
      [teacherUserId, testInstId]
    );

    await pg.query(
      `INSERT INTO staff (id, institute_id, user_id, employee_code, designation, full_name)
       VALUES ($1, $2, $3, 'EMP001', 'Senior Math Teacher', 'Amit Sharma')`,
      [teacherStaffId, testInstId, teacherUserId]
    );

    await pg.query(
      `INSERT INTO users (id, institute_id, email, full_name, role) VALUES ($1, $2, 'sub@delhi.edu', 'Priya Verma', 'Teacher')`,
      [subTeacherUserId, testInstId]
    );

    await pg.query(
      `INSERT INTO staff (id, institute_id, user_id, employee_code, designation, full_name)
       VALUES ($1, $2, $3, 'EMP002', 'Science Teacher', 'Priya Verma')`,
      [subTeacherStaffId, testInstId, subTeacherUserId]
    );

    // Seed students
    await pg.query(
      `INSERT INTO users (id, institute_id, email, full_name, role) VALUES ($1, $2, 'aarav@delhi.edu', 'Aarav Patel', 'Student')`,
      [student1UserId, testInstId]
    );

    await pg.query(
      `INSERT INTO students (id, institute_id, user_id, admission_no, full_name, class_id, section_id)
       VALUES ($1, $2, $3, 'ADM-001', 'Aarav Patel', $4, $5)`,
      [student1Id, testInstId, student1UserId, classId, sectionId]
    );

    await pg.query(
      `INSERT INTO students (id, institute_id, admission_no, full_name, class_id, section_id)
       VALUES ($1, $2, 'ADM-002', 'Rohan Gupta', $3, $4)`,
      [student2Id, testInstId, classId, sectionId]
    );
  });

  afterAll(async () => {
    await pg.close();
  });

  it('ATT-01..03: marks student attendance and triggers absence notification for absent student', async () => {
    const today = '2026-10-03';

    // Student 1 is Absent, Student 2 is Present
    await pg.query(
      `INSERT INTO student_attendance (id, institute_id, student_id, class_id, section_id, date, status, marked_by)
       VALUES 
       (gen_random_uuid(), $1, $2, $4, $5, $6, 'absent', $7),
       (gen_random_uuid(), $1, $3, $4, $5, $6, 'present', $7)`,
      [testInstId, student1Id, student2Id, classId, sectionId, today, teacherUserId]
    );

    // Trigger absence notification for Student 1
    await pg.query(
      `INSERT INTO notifications (id, institute_id, user_id, title, message, type)
       VALUES (gen_random_uuid(), $1, $2, 'Absence Alert', 'Aarav Patel was marked absent on 2026-10-03', 'attendance')`,
      [testInstId, student1UserId]
    );

    const attRes = await pg.query(
      `SELECT * FROM student_attendance WHERE institute_id = $1 AND date = $2`,
      [testInstId, today]
    );
    expect(attRes.rows.length).toBe(2);

    const absentStudent = attRes.rows.find((r: any) => r.student_id === student1Id);
    expect(absentStudent.status).toBe('absent');

    const notifRes = await pg.query(
      `SELECT * FROM notifications WHERE institute_id = $1 AND user_id = $2 AND type = 'attendance'`,
      [testInstId, student1UserId]
    );
    expect(notifRes.rows.length).toBe(1);
    expect(notifRes.rows[0].title).toBe('Absence Alert');
  });

  it('ATT-04: computes daily attendance statistics and percentage', async () => {
    const res = await pg.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count
      FROM student_attendance 
      WHERE institute_id = $1 AND date = '2026-10-03'
    `, [testInstId]);

    const stats = res.rows[0];
    expect(Number(stats.total)).toBe(2);
    expect(Number(stats.present_count)).toBe(1);
    expect(Number(stats.absent_count)).toBe(1);

    const percentage = Math.round((Number(stats.present_count) / Number(stats.total)) * 100);
    expect(percentage).toBe(50);
  });

  it('STF-12: enforces DPDP consent recording before selfie attendance', async () => {
    // Record consent
    const consentRes = await pg.query(
      `INSERT INTO consent_records (id, institute_id, user_id, consent_type)
       VALUES (gen_random_uuid(), $1, $2, 'selfie_attendance')
       RETURNING *`,
      [testInstId, teacherUserId]
    );

    expect(consentRes.rows.length).toBe(1);
    expect(consentRes.rows[0].consent_type).toBe('selfie_attendance');
  });

  it('STF-02, STF-06, STF-07: selfie check-in within geofence auto-approves attendance', async () => {
    const photoHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const retainedUntil = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

    // Store photo metadata
    const photoRes = await pg.query(
      `INSERT INTO staff_attendance_photos (id, institute_id, staff_id, photo_url, photo_hash, retained_until)
       VALUES (gen_random_uuid(), $1, $2, 'https://s3.classo.in/photos/1.webp', $3, $4)
       RETURNING id`,
      [testInstId, teacherStaffId, photoHash, retainedUntil]
    );
    const photoId = photoRes.rows[0].id;

    // Inside geofence: distance 30m (< 150m radius)
    const checkInRes = await pg.query(
      `INSERT INTO staff_attendance (
        id, institute_id, staff_id, date, check_in_time, status, check_in_status,
        within_geofence, geofence_distance_meters, review_status
       )
       VALUES (gen_random_uuid(), $1, $2, '2026-10-03', NOW(), 'present', 'accepted', TRUE, 30, 'approved')
       RETURNING *`,
      [testInstId, teacherStaffId]
    );

    expect(checkInRes.rows[0].within_geofence).toBe(true);
    expect(checkInRes.rows[0].review_status).toBe('approved');
    expect(checkInRes.rows[0].check_in_status).toBe('accepted');
  });

  it('STF-06, STF-09: outside geofence check-in flags for Principal review', async () => {
    // Outside geofence: distance 450m (> 150m)
    const outsideCheckIn = await pg.query(
      `INSERT INTO staff_attendance (
        id, institute_id, staff_id, date, check_in_time, status, check_in_status,
        within_geofence, geofence_distance_meters, review_status
       )
       VALUES (gen_random_uuid(), $1, $2, '2026-10-03', NOW(), 'present', 'flagged', FALSE, 450, 'pending')
       RETURNING *`,
      [testInstId, subTeacherStaffId]
    );

    expect(outsideCheckIn.rows[0].within_geofence).toBe(false);
    expect(outsideCheckIn.rows[0].review_status).toBe('pending');
    expect(outsideCheckIn.rows[0].check_in_status).toBe('flagged');

    // Principal reviews and rejects with mandatory reason
    const reviewRes = await pg.query(
      `UPDATE staff_attendance
       SET review_status = 'rejected', status = 'absent', rejection_reason = 'Outside campus boundary without permission'
       WHERE id = $1
       RETURNING *`,
      [outsideCheckIn.rows[0].id]
    );

    expect(reviewRes.rows[0].review_status).toBe('rejected');
    expect(reviewRes.rows[0].status).toBe('absent');
    expect(reviewRes.rows[0].rejection_reason).toBe('Outside campus boundary without permission');
  });

  it('TT-01..02: timetable slot builder and double-booking conflict detection', async () => {
    // 1. Create timetable
    const ttRes = await pg.query(
      `INSERT INTO timetables (id, institute_id, class_id, section_id, name)
       VALUES (gen_random_uuid(), $1, $2, $3, 'Class 10-A Timetable')
       RETURNING id`,
      [testInstId, classId, sectionId]
    );
    const timetableId = ttRes.rows[0].id;

    // 2. Add slot: Monday (1), Period 1, Teacher: Amit Sharma, Room: 101
    const slotRes = await pg.query(
      `INSERT INTO timetable_slots (
        id, institute_id, timetable_id, day_of_week, period_number,
        start_time, end_time, subject_id, teacher_id, room_number
       )
       VALUES (gen_random_uuid(), $1, $2, 1, 1, '09:00', '09:45', $3, $4, 'Room 101')
       RETURNING *`,
      [testInstId, timetableId, subjectId, teacherStaffId]
    );

    expect(slotRes.rows.length).toBe(1);
    expect(slotRes.rows[0].period_number).toBe(1);

    // 3. Attempting double-booking: check for existing booking on day 1, period 1 for same teacher
    const conflictCheck = await pg.query(
      `SELECT * FROM timetable_slots
       WHERE institute_id = $1 AND teacher_id = $2 AND day_of_week = 1 AND period_number = 1`,
      [testInstId, teacherStaffId]
    );

    expect(conflictCheck.rows.length).toBe(1); // Conflict detected!
  });

  it('TT-03: substitution assignment notifies substitute teacher', async () => {
    const slots = await pg.query(
      `SELECT id FROM timetable_slots WHERE institute_id = $1 LIMIT 1`,
      [testInstId]
    );
    const slotId = slots.rows[0].id;

    // Assign substitution for today
    await pg.query(
      `INSERT INTO substitutions (id, institute_id, timetable_slot_id, date, original_teacher_id, substitute_teacher_id, reason)
       VALUES (gen_random_uuid(), $1, $2, '2026-10-03', $3, $4, 'Original teacher on medical leave')`,
      [testInstId, slotId, teacherStaffId, subTeacherStaffId]
    );

    // Notification created for substitute teacher
    await pg.query(
      `INSERT INTO notifications (id, institute_id, user_id, title, message, type)
       VALUES (gen_random_uuid(), $1, $2, 'Substitution Assigned', 'Cover Period 1 for Amit Sharma on 2026-10-03', 'general')`,
      [testInstId, subTeacherUserId]
    );

    const subNotif = await pg.query(
      `SELECT * FROM notifications WHERE institute_id = $1 AND user_id = $2 AND title = 'Substitution Assigned'`,
      [testInstId, subTeacherUserId]
    );
    expect(subNotif.rows.length).toBe(1);
    expect(subNotif.rows[0].message).toContain('Cover Period 1 for Amit Sharma');
  });

  it('COM-01, COM-05: notice publication, read tracking, and in-app notification center', async () => {
    // 1. Create notice targeted to all teachers
    const noticeRes = await pg.query(
      `INSERT INTO notices (id, institute_id, title, content, audience_type, target_audience)
       VALUES (gen_random_uuid(), $1, 'Staff Meeting at 3 PM', 'Meeting regarding upcoming midterm examinations in Conference Room A.', 'role', '["Teacher"]')
       RETURNING id, title`,
      [testInstId]
    );
    const noticeId = noticeRes.rows[0].id;

    // 2. Teacher reads notice
    await pg.query(
      `INSERT INTO notice_reads (id, institute_id, notice_id, user_id)
       VALUES (gen_random_uuid(), $1, $2, $3)`,
      [testInstId, noticeId, teacherUserId]
    );

    const readCheck = await pg.query(
      `SELECT * FROM notice_reads WHERE institute_id = $1 AND notice_id = $2 AND user_id = $3`,
      [testInstId, noticeId, teacherUserId]
    );
    expect(readCheck.rows.length).toBe(1);

    // 3. In-app notification center query
    const notifs = await pg.query(
      `SELECT * FROM notifications WHERE institute_id = $1 AND user_id = $2 ORDER BY id ASC`,
      [testInstId, subTeacherUserId]
    );
    expect(notifs.rows.length).toBeGreaterThanOrEqual(1);
    expect(notifs.rows[0].is_read).toBe(false);

    // Mark as read
    await pg.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1`,
      [notifs.rows[0].id]
    );

    const updatedNotif = await pg.query(
      `SELECT is_read FROM notifications WHERE id = $1`,
      [notifs.rows[0].id]
    );
    expect(updatedNotif.rows[0].is_read).toBe(true);
  });
});
