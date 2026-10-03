import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { institutes } from './global.js';
import { INSTITUTE_ROLES } from '@classo/config';

/**
 * Tenant-Owned Tables (PRD Section 9.2)
 * CRITICAL RULE (ISO-01):
 * Every tenant table MUST include:
 * 1. id UUID PRIMARY KEY DEFAULT gen_random_uuid()
 * 2. institute_id UUID NOT NULL REFERENCES institutes(id)
 * 3. Composite/leading index on (institute_id, ...)
 * 4. created_at, updated_at, deleted_at
 * 5. PostgreSQL Row-Level Security (RLS) policy
 */

// Users table (Identity per tenant)
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 20 }),
    passwordHash: text('password_hash'),
    fullName: varchar('full_name', { length: 255 }).notNull(),
    role: varchar('role', { length: 32, enum: INSTITUTE_ROLES }).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    failedLoginAttempts: jsonb('failed_login_attempts').$type<{
      count: number;
      lockedUntil?: string;
    }>().default({ count: 0 }),
    twoFactorSecret: text('two_factor_secret'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_users_institute_id').on(table.instituteId),
    index('idx_users_institute_email').on(table.instituteId, table.email),
    index('idx_users_institute_phone').on(table.instituteId, table.phone),
    index('idx_users_institute_role').on(table.instituteId, table.role),
  ]
);

// Roles table (PRD 8.1, USR-04: System and custom roles)
export const roles = pgTable(
  'roles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    code: varchar('code', { length: 50 }).notNull(),
    description: text('description'),
    isSystem: boolean('is_system').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_roles_institute_id').on(table.instituteId),
    uniqueIndex('idx_roles_institute_code').on(table.instituteId, table.code),
  ]
);

// Permissions table (PRD Section 8)
export const permissions = pgTable(
  'permissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    code: varchar('code', { length: 100 }).notNull(),
    module: varchar('module', { length: 50 }).notNull(),
    action: varchar('action', { length: 50 }).notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_permissions_institute_id').on(table.instituteId),
    uniqueIndex('idx_permissions_inst_code').on(table.instituteId, table.code),
  ]
);

// Role Permissions mapping
export const rolePermissions = pgTable(
  'role_permissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    roleId: uuid('role_id')
      .references(() => roles.id, { onDelete: 'cascade' })
      .notNull(),
    permissionId: uuid('permission_id')
      .references(() => permissions.id, { onDelete: 'cascade' })
      .notNull(),
    scope: varchar('scope', { length: 32 }).default('all').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_role_perms_institute_id').on(table.instituteId),
    uniqueIndex('idx_role_perm_unique').on(
      table.instituteId,
      table.roleId,
      table.permissionId
    ),
  ]
);

// User Sessions
export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('userId')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    refreshTokenHash: text('refresh_token_hash').notNull(),
    userAgent: text('user_agent'),
    ipAddress: varchar('ip_address', { length: 64 }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_sessions_institute_id').on(table.instituteId),
    index('idx_sessions_user_id').on(table.instituteId, table.userId),
  ]
);

// Invites table
export const invites = pgTable(
  'invites',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 20 }),
    role: varchar('role', { length: 32, enum: INSTITUTE_ROLES }).notNull(),
    tokenHash: text('token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_invites_institute_id').on(table.instituteId),
    index('idx_invites_expires').on(table.instituteId, table.expiresAt),
  ]
);

// OTP Requests
export const otpRequests = pgTable(
  'otp_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    identifier: varchar('identifier', { length: 255 }).notNull(),
    otpHash: text('otp_hash').notNull(),
    purpose: varchar('purpose', { length: 50 }).notNull(),
    attempts: jsonb('attempts').$type<{ count: number; max: number }>().default({
      count: 0,
      max: 5,
    }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    consumedAt: timestamp('consumed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_otp_institute_id').on(table.instituteId),
    index('idx_otp_identifier').on(table.instituteId, table.identifier),
  ]
);

// Departments (SET-05)
export const departments = pgTable(
  'departments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    headOfDepartmentId: uuid('head_of_department_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_departments_institute_id').on(table.instituteId),
    uniqueIndex('idx_departments_inst_name').on(table.instituteId, table.name),
  ]
);

// Academic Years (CC-03)
export const academicYears = pgTable(
  'academic_years',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }).notNull(),
    isCurrent: boolean('is_current').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_academic_years_inst_id').on(table.instituteId),
    uniqueIndex('idx_academic_years_inst_name').on(table.instituteId, table.name),
  ]
);

// Campus Locations (SET-06)
export const campusLocations = pgTable(
  'campus_locations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    latitude: varchar('latitude', { length: 32 }).notNull(),
    longitude: varchar('longitude', { length: 32 }).notNull(),
    radiusMeters: varchar('radius_meters', { length: 16 }).default('150').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_campus_loc_inst_id').on(table.instituteId),
  ]
);

// Classes / Courses (SET-02: School Class / College Course)
export const classes = pgTable(
  'classes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    name: varchar('name', { length: 100 }).notNull(), // e.g. "Class 10", "B.Tech CSE"
    code: varchar('code', { length: 50 }).notNull(),
    departmentId: uuid('department_id').references(() => departments.id),
    academicYearId: uuid('academic_year_id').references(() => academicYears.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_classes_institute_id').on(table.instituteId),
    uniqueIndex('idx_classes_inst_code').on(table.instituteId, table.code),
  ]
);

// Sections (SET-02: School / College Section)
export const sections = pgTable(
  'sections',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    classId: uuid('class_id')
      .references(() => classes.id, { onDelete: 'cascade' })
      .notNull(),
    name: varchar('name', { length: 50 }).notNull(), // e.g. "Section A", "Section B"
    capacity: integer('capacity').default(40).notNull(),
    roomNumber: varchar('room_number', { length: 50 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_sections_institute_id').on(table.instituteId),
    index('idx_sections_class_id').on(table.instituteId, table.classId),
  ]
);

// Batches (SET-02: Coaching Batches)
export const batches = pgTable(
  'batches',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    name: varchar('name', { length: 100 }).notNull(), // e.g. "JEE Advanced Target 2027 Morning"
    code: varchar('code', { length: 50 }).notNull(),
    capacity: integer('capacity').default(60).notNull(),
    academicYearId: uuid('academic_year_id').references(() => academicYears.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_batches_institute_id').on(table.instituteId),
    uniqueIndex('idx_batches_inst_code').on(table.instituteId, table.code),
  ]
);

// Subjects (SET-02)
export const subjects = pgTable(
  'subjects',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    name: varchar('name', { length: 100 }).notNull(), // e.g. "Physics", "Mathematics"
    code: varchar('code', { length: 50 }).notNull(),
    departmentId: uuid('department_id').references(() => departments.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_subjects_institute_id').on(table.instituteId),
    uniqueIndex('idx_subjects_inst_code').on(table.instituteId, table.code),
  ]
);

// Students (STU-01..06)
export const students = pgTable(
  'students',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    admissionNo: varchar('admission_no', { length: 64 }).notNull(),
    rollNo: varchar('roll_no', { length: 64 }),
    fullName: varchar('full_name', { length: 255 }).notNull(),
    gender: varchar('gender', { length: 16 }),
    dob: timestamp('dob', { withTimezone: true }),
    bloodGroup: varchar('blood_group', { length: 10 }),
    status: varchar('status', { length: 32 }).default('active').notNull(), // active, inactive, alumni, transferred, dropped
    classId: uuid('class_id').references(() => classes.id),
    sectionId: uuid('section_id').references(() => sections.id),
    batchId: uuid('batch_id').references(() => batches.id),
    parentName: varchar('parent_name', { length: 255 }).notNull(),
    parentPhone: varchar('parent_phone', { length: 20 }).notNull(),
    parentEmail: varchar('parent_email', { length: 255 }),
    address: text('address'),
    medicalNotes: text('medical_notes'),
    photoUrl: text('photo_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_students_institute_id').on(table.instituteId),
    uniqueIndex('idx_students_admission_no').on(table.instituteId, table.admissionNo),
    index('idx_students_class_section').on(table.instituteId, table.classId, table.sectionId),
    index('idx_students_status').on(table.instituteId, table.status),
  ]
);

// Staff profiles (STF-01)
export const staff = pgTable(
  'staff',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    employeeCode: varchar('employee_code', { length: 64 }).notNull(),
    designation: varchar('designation', { length: 100 }).notNull(), // e.g. "Senior PGT Physics", "HOD"
    departmentId: uuid('department_id').references(() => departments.id),
    joiningDate: timestamp('joining_date', { withTimezone: true }).notNull(),
    qualification: varchar('qualification', { length: 255 }),
    bankDetailsEncrypted: text('bank_details_encrypted'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_staff_institute_id').on(table.instituteId),
    uniqueIndex('idx_staff_emp_code').on(table.instituteId, table.employeeCode),
  ]
);

// Teaching Assignments (STF-04: teacher <-> subject <-> class/section/batch)
export const teachingAssignments = pgTable(
  'teaching_assignments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    staffId: uuid('staff_id').references(() => staff.id, { onDelete: 'cascade' }).notNull(),
    subjectId: uuid('subject_id').references(() => subjects.id, { onDelete: 'cascade' }).notNull(),
    classId: uuid('class_id').references(() => classes.id),
    sectionId: uuid('section_id').references(() => sections.id),
    batchId: uuid('batch_id').references(() => batches.id),
    academicYearId: uuid('academic_year_id').references(() => academicYears.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_teaching_assign_inst').on(table.instituteId),
    index('idx_teaching_assign_staff').on(table.instituteId, table.staffId),
  ]
);

// Leave Types (STF-03)
export const leaveTypes = pgTable(
  'leave_types',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    name: varchar('name', { length: 100 }).notNull(), // e.g. "Casual Leave", "Sick Leave"
    daysAllowed: integer('days_allowed').notNull(),
    isPaid: boolean('is_paid').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_leave_types_inst').on(table.instituteId),
  ]
);

// Leave Requests (STF-03)
export const leaveRequests = pgTable(
  'leave_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    staffId: uuid('staff_id').references(() => staff.id, { onDelete: 'cascade' }).notNull(),
    leaveTypeId: uuid('leave_type_id').references(() => leaveTypes.id).notNull(),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }).notNull(),
    reason: text('reason').notNull(),
    status: varchar('status', { length: 32 }).default('pending').notNull(), // pending, approved, rejected
    reviewedBy: uuid('reviewed_by'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_leave_req_inst').on(table.instituteId),
    index('idx_leave_req_staff').on(table.instituteId, table.staffId),
  ]
);

// Inquiries / Leads CRM (ADM-02)
export const inquiries = pgTable(
  'inquiries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    studentName: varchar('student_name', { length: 255 }).notNull(),
    parentName: varchar('parent_name', { length: 255 }).notNull(),
    parentPhone: varchar('parent_phone', { length: 20 }).notNull(),
    parentEmail: varchar('parent_email', { length: 255 }),
    gradeApplyingFor: varchar('grade_applying_for', { length: 100 }).notNull(),
    source: varchar('source', { length: 50 }).default('direct').notNull(),
    status: varchar('status', { length: 32 }).default('new').notNull(), // new, contacted, demo_visit, applied, admitted, lost
    assignedStaffId: uuid('assigned_staff_id'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_inquiries_inst').on(table.instituteId),
    index('idx_inquiries_status').on(table.instituteId, table.status),
  ]
);

// Public Student Admission Applications (ADM-01, ADM-03, ADM-05)
export const studentApplications = pgTable(
  'student_applications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    applicationNo: varchar('application_no', { length: 64 }).notNull(),
    studentName: varchar('student_name', { length: 255 }).notNull(),
    dob: timestamp('dob', { withTimezone: true }).notNull(),
    gender: varchar('gender', { length: 16 }).notNull(),
    parentName: varchar('parent_name', { length: 255 }).notNull(),
    parentPhone: varchar('parent_phone', { length: 20 }).notNull(),
    parentEmail: varchar('parent_email', { length: 255 }).notNull(),
    gradeApplyingFor: varchar('grade_applying_for', { length: 100 }).notNull(),
    address: text('address'),
    status: varchar('status', { length: 32 }).default('pending').notNull(), // pending, approved, rejected
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_student_apps_inst').on(table.instituteId),
    uniqueIndex('idx_student_apps_no').on(table.instituteId, table.applicationNo),
  ]
);

// Student Attendance (ATT-01..05)
export const studentAttendance = pgTable(
  'student_attendance',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    studentId: uuid('student_id')
      .references(() => students.id, { onDelete: 'cascade' })
      .notNull(),
    academicYearId: uuid('academic_year_id'),
    classId: uuid('class_id')
      .references(() => classes.id, { onDelete: 'set null' }),
    sectionId: uuid('section_id')
      .references(() => sections.id, { onDelete: 'set null' }),
    batchId: uuid('batch_id')
      .references(() => batches.id, { onDelete: 'set null' }),
    date: varchar('date', { length: 10 }).notNull(), // YYYY-MM-DD
    status: varchar('status', { length: 20 }).default('present').notNull(), // present, absent, late, leave, holiday
    remarks: text('remarks'),
    markedBy: uuid('marked_by'),
    editedBy: uuid('edited_by'),
    editedAt: timestamp('edited_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_stu_att_inst').on(table.instituteId),
    index('idx_stu_att_inst_class_date').on(
      table.instituteId,
      table.classId,
      table.sectionId,
      table.date
    ),
    uniqueIndex('idx_stu_att_inst_student_date').on(
      table.instituteId,
      table.studentId,
      table.date
    ),
  ]
);

// Staff Attendance (STF-02, STF-05..14)
export const staffAttendance = pgTable(
  'staff_attendance',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    staffId: uuid('staff_id')
      .references(() => staff.id, { onDelete: 'cascade' })
      .notNull(),
    date: varchar('date', { length: 10 }).notNull(), // YYYY-MM-DD
    checkInTime: timestamp('check_in_time', { withTimezone: true }),
    checkOutTime: timestamp('check_out_time', { withTimezone: true }),
    status: varchar('status', { length: 20 }).default('present').notNull(), // present, absent, late, half_day, leave, holiday
    checkInStatus: varchar('check_in_status', { length: 20 }).default('accepted').notNull(), // accepted, flagged, rejected
    checkOutStatus: varchar('check_out_status', { length: 20 }),
    withinGeofence: boolean('within_geofence').default(true).notNull(),
    geofenceDistanceMeters: integer('geofence_distance_meters'),
    isMockLocation: boolean('is_mock_location').default(false).notNull(),
    photoId: uuid('photo_id'),
    reviewStatus: varchar('review_status', { length: 20 }).default('approved').notNull(), // pending, approved, rejected
    reviewedBy: uuid('reviewed_by'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    rejectionReason: text('rejection_reason'),
    manualOverride: boolean('manual_override').default(false).notNull(),
    overrideReason: text('override_reason'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_staff_att_inst').on(table.instituteId),
    uniqueIndex('idx_staff_att_inst_staff_date').on(
      table.instituteId,
      table.staffId,
      table.date
    ),
    index('idx_staff_att_inst_review').on(
      table.instituteId,
      table.date,
      table.reviewStatus
    ),
  ]
);

// Staff Attendance Photos (STF-05, STF-08, STF-12, STF-14)
export const staffAttendancePhotos = pgTable(
  'staff_attendance_photos',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    staffId: uuid('staff_id')
      .references(() => staff.id, { onDelete: 'cascade' })
      .notNull(),
    photoUrl: text('photo_url').notNull(),
    thumbnailUrl: text('thumbnail_url'),
    photoHash: varchar('photo_hash', { length: 128 }).notNull(),
    exifStripped: boolean('exif_stripped').default(true).notNull(),
    capturedAt: timestamp('captured_at', { withTimezone: true }).defaultNow().notNull(),
    deviceInfo: text('device_info'),
    userAgent: text('user_agent'),
    ipAddress: varchar('ip_address', { length: 64 }),
    retainedUntil: timestamp('retained_until', { withTimezone: true }).notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_staff_photos_inst').on(table.instituteId),
    index('idx_staff_photos_staff').on(table.instituteId, table.staffId),
    index('idx_staff_photos_hash').on(table.instituteId, table.photoHash),
    index('idx_staff_photos_retained').on(table.instituteId, table.retainedUntil),
  ]
);

// Consent Records (STF-12, DPDP Act)
export const consentRecords = pgTable(
  'consent_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    consentType: varchar('consent_type', { length: 64 }).notNull(), // selfie_attendance, terms, privacy
    consentedAt: timestamp('consented_at', { withTimezone: true }).defaultNow().notNull(),
    ipAddress: varchar('ip_address', { length: 64 }),
    userAgent: text('user_agent'),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_consent_inst').on(table.instituteId),
    index('idx_consent_user').on(table.instituteId, table.userId, table.consentType),
  ]
);

// Timetables (TT-01..04)
export const timetables = pgTable(
  'timetables',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    academicYearId: uuid('academic_year_id'),
    classId: uuid('class_id')
      .references(() => classes.id, { onDelete: 'cascade' }),
    sectionId: uuid('section_id')
      .references(() => sections.id, { onDelete: 'cascade' }),
    batchId: uuid('batch_id')
      .references(() => batches.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    status: varchar('status', { length: 20 }).default('active').notNull(), // draft, active, archived
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_timetables_inst').on(table.instituteId),
    index('idx_timetables_class').on(table.instituteId, table.classId, table.sectionId),
  ]
);

// Timetable Slots (TT-01..04)
export const timetableSlots = pgTable(
  'timetable_slots',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    timetableId: uuid('timetable_id')
      .references(() => timetables.id, { onDelete: 'cascade' })
      .notNull(),
    dayOfWeek: integer('day_of_week').notNull(), // 1 (Mon) .. 7 (Sun)
    periodNumber: integer('period_number').notNull(),
    startTime: varchar('start_time', { length: 8 }).notNull(), // HH:mm
    endTime: varchar('end_time', { length: 8 }).notNull(), // HH:mm
    subjectId: uuid('subject_id')
      .references(() => subjects.id, { onDelete: 'cascade' })
      .notNull(),
    teacherId: uuid('teacher_id')
      .references(() => staff.id, { onDelete: 'cascade' })
      .notNull(),
    roomNumber: varchar('room_number', { length: 50 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_slots_inst').on(table.instituteId),
    index('idx_slots_timetable').on(table.instituteId, table.timetableId),
    index('idx_slots_teacher_conflict').on(
      table.instituteId,
      table.teacherId,
      table.dayOfWeek,
      table.periodNumber
    ),
    index('idx_slots_room_conflict').on(
      table.instituteId,
      table.roomNumber,
      table.dayOfWeek,
      table.periodNumber
    ),
  ]
);

// Timetable Substitutions (TT-03)
export const substitutions = pgTable(
  'substitutions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    timetableSlotId: uuid('timetable_slot_id')
      .references(() => timetableSlots.id, { onDelete: 'cascade' })
      .notNull(),
    date: varchar('date', { length: 10 }).notNull(), // YYYY-MM-DD
    originalTeacherId: uuid('original_teacher_id')
      .references(() => staff.id, { onDelete: 'cascade' })
      .notNull(),
    substituteTeacherId: uuid('substitute_teacher_id')
      .references(() => staff.id, { onDelete: 'cascade' })
      .notNull(),
    reason: text('reason'),
    status: varchar('status', { length: 20 }).default('assigned').notNull(), // assigned, notified, completed
    notifiedAt: timestamp('notified_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_substitutions_inst').on(table.instituteId),
    index('idx_substitutions_date_sub').on(
      table.instituteId,
      table.date,
      table.substituteTeacherId
    ),
  ]
);

// Notices (COM-01)
export const notices = pgTable(
  'notices',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    content: text('content').notNull(),
    audienceType: varchar('audience_type', { length: 32 }).default('all').notNull(), // all, role, class, individual
    targetAudience: jsonb('target_audience').$type<string[]>().default([]),
    publishAt: timestamp('publish_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    isPublished: boolean('is_published').default(true).notNull(),
    attachments: jsonb('attachments').$type<{ name: string; url: string; size?: number }[]>().default([]),
    readReceiptsEnabled: boolean('read_receipts_enabled').default(false).notNull(),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_notices_inst').on(table.instituteId),
    index('idx_notices_published').on(table.instituteId, table.isPublished, table.publishAt),
  ]
);

// Notice Reads (COM-01)
export const noticeReads = pgTable(
  'notice_reads',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    noticeId: uuid('notice_id')
      .references(() => notices.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    readAt: timestamp('read_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_notice_reads_inst').on(table.instituteId),
    uniqueIndex('idx_notice_reads_user').on(table.instituteId, table.noticeId, table.userId),
  ]
);

// Notifications (COM-05)
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    message: text('message').notNull(),
    type: varchar('type', { length: 32 }).default('general').notNull(), // attendance, notice, reminder, general
    link: varchar('link', { length: 255 }),
    isRead: boolean('is_read').default(false).notNull(),
    readAt: timestamp('read_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_notifications_inst').on(table.instituteId),
    index('idx_notifications_user_read').on(table.instituteId, table.userId, table.isRead),
  ]
);

// Fee Heads (FEE-01)
export const feeHeads = pgTable(
  'fee_heads',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    name: varchar('name', { length: 255 }).notNull(), // Tuition, Transport, Hostel, Exam, Lab
    code: varchar('code', { length: 50 }).notNull(),
    description: text('description'),
    isRefundable: boolean('is_refundable').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_fee_heads_inst').on(table.instituteId),
    uniqueIndex('idx_fee_heads_inst_code').on(table.instituteId, table.code),
  ]
);

// Fee Structures (FEE-01)
export const feeStructures = pgTable(
  'fee_structures',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    academicYearId: uuid('academic_year_id'),
    classId: uuid('class_id').references(() => classes.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(), // e.g. "Class 10 Annual Fee 2026-27"
    totalAmountPaise: integer('total_amount_paise').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_fee_structures_inst').on(table.instituteId),
    index('idx_fee_structures_class').on(table.instituteId, table.classId),
  ]
);

// Fee Structure Items (FEE-01)
export const feeStructureItems = pgTable(
  'fee_structure_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    feeStructureId: uuid('fee_structure_id')
      .references(() => feeStructures.id, { onDelete: 'cascade' })
      .notNull(),
    feeHeadId: uuid('fee_head_id')
      .references(() => feeHeads.id, { onDelete: 'cascade' })
      .notNull(),
    amountPaise: integer('amount_paise').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_fee_struct_items_inst').on(table.instituteId),
    index('idx_fee_struct_items_struct').on(table.instituteId, table.feeStructureId),
  ]
);

// Student Fee Plans (FEE-02, FEE-03)
export const studentFeePlans = pgTable(
  'student_fee_plans',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    studentId: uuid('student_id')
      .references(() => students.id, { onDelete: 'cascade' })
      .notNull(),
    academicYearId: uuid('academic_year_id'),
    feeStructureId: uuid('fee_structure_id')
      .references(() => feeStructures.id, { onDelete: 'cascade' })
      .notNull(),
    planType: varchar('plan_type', { length: 32 }).default('monthly').notNull(), // one_time, monthly, quarterly, custom
    totalBasePaise: integer('total_base_paise').notNull(),
    discountPaise: integer('discount_paise').default(0).notNull(),
    discountReason: text('discount_reason'),
    discountApprovedBy: uuid('discount_approved_by'),
    netPayablePaise: integer('net_payable_paise').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_student_fee_plans_inst').on(table.instituteId),
    index('idx_student_fee_plans_stu').on(table.instituteId, table.studentId),
  ]
);

// Student Dues (FEE-02, FEE-06)
export const studentDues = pgTable(
  'student_dues',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    studentId: uuid('student_id')
      .references(() => students.id, { onDelete: 'cascade' })
      .notNull(),
    studentFeePlanId: uuid('student_fee_plan_id')
      .references(() => studentFeePlans.id, { onDelete: 'cascade' })
      .notNull(),
    installmentNumber: integer('installment_number').notNull(),
    title: varchar('title', { length: 255 }).notNull(), // e.g. "Term 1 Tuition Due"
    dueDate: varchar('due_date', { length: 10 }).notNull(), // YYYY-MM-DD
    amountPaise: integer('amount_paise').notNull(),
    finePaise: integer('fine_paise').default(0).notNull(),
    paidAmountPaise: integer('paid_amount_paise').default(0).notNull(),
    status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, partial, paid, overdue
    paymentLinkId: varchar('payment_link_id', { length: 100 }), // Razorpay payment link
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_student_dues_inst').on(table.instituteId),
    index('idx_student_dues_stu').on(table.instituteId, table.studentId),
    index('idx_student_dues_status').on(table.instituteId, table.status, table.dueDate),
  ]
);

// Payments (FEE-04, FEE-06)
export const payments = pgTable(
  'payments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    studentId: uuid('student_id')
      .references(() => students.id, { onDelete: 'cascade' })
      .notNull(),
    studentDueId: uuid('student_due_id')
      .references(() => studentDues.id, { onDelete: 'set null' }),
    receiptNo: varchar('receipt_no', { length: 64 }).notNull(),
    amountPaidPaise: integer('amount_paid_paise').notNull(),
    paymentMode: varchar('payment_mode', { length: 32 }).notNull(), // cash, cheque, upi, card, bank_transfer, razorpay
    referenceNo: varchar('reference_no', { length: 100 }), // Cheque no, UTR, Bank transaction ref
    paymentDate: timestamp('payment_date', { withTimezone: true }).defaultNow().notNull(),
    collectedBy: uuid('collected_by'),
    status: varchar('status', { length: 20 }).default('success').notNull(), // success, pending, failed, refunded
    razorpayPaymentId: varchar('razorpay_payment_id', { length: 100 }),
    razorpayOrderId: varchar('razorpay_order_id', { length: 100 }),
    razorpaySignature: varchar('razorpay_signature', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_payments_inst').on(table.instituteId),
    uniqueIndex('idx_payments_receipt_no').on(table.instituteId, table.receiptNo),
    index('idx_payments_student').on(table.instituteId, table.studentId),
  ]
);

// Receipts (FEE-05)
export const receipts = pgTable(
  'receipts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    paymentId: uuid('payment_id')
      .references(() => payments.id, { onDelete: 'cascade' })
      .notNull(),
    receiptNumber: varchar('receipt_number', { length: 64 }).notNull(),
    isDuplicate: boolean('is_duplicate').default(false).notNull(),
    reprintCount: integer('reprint_count').default(0).notNull(),
    issuedAt: timestamp('issued_at', { withTimezone: true }).defaultNow().notNull(),
    issuedBy: uuid('issued_by'),
    pdfUrl: text('pdf_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_receipts_inst').on(table.instituteId),
    uniqueIndex('idx_receipts_inst_number').on(table.instituteId, table.receiptNumber),
  ]
);

// Reminder Rules (REM-01..04)
export const reminderRules = pgTable(
  'reminder_rules',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    offsetDays: integer('offset_days').notNull(), // -3, 0, 1, 3, 7
    channels: jsonb('channels').$type<string[]>().default(['whatsapp', 'sms']).notNull(),
    templateText: text('template_text').notNull(),
    maxReminders: integer('max_reminders').default(3).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_reminder_rules_inst').on(table.instituteId),
  ]
);

// Reminder Logs (REM-05, CTL-09)
export const reminderLogs = pgTable(
  'reminder_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    studentDueId: uuid('student_due_id')
      .references(() => studentDues.id, { onDelete: 'cascade' })
      .notNull(),
    studentId: uuid('student_id')
      .references(() => students.id, { onDelete: 'cascade' })
      .notNull(),
    channel: varchar('channel', { length: 32 }).notNull(), // 'whatsapp' | 'sms' | 'email'
    recipientPhone: varchar('recipient_phone', { length: 20 }),
    recipientEmail: varchar('recipient_email', { length: 255 }),
    messageText: text('message_text').notNull(),
    status: varchar('status', { length: 20 }).default('sent').notNull(), // queued, sent, delivered, failed
    costCredits: integer('cost_credits').default(1).notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_reminder_logs_inst').on(table.instituteId),
    index('idx_reminder_logs_due').on(table.instituteId, table.studentDueId),
  ]
);

// Immutable Tenant Audit Log (PRD CC-05, ISO-05)
export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id'),
    action: varchar('action', { length: 100 }).notNull(),
    entityType: varchar('entity_type', { length: 64 }).notNull(),
    entityId: varchar('entity_id', { length: 64 }).notNull(),
    diff: jsonb('diff').$type<{
      before?: Record<string, unknown>;
      after?: Record<string, unknown>;
    }>(),
    ipAddress: varchar('ip_address', { length: 64 }),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_audit_log_institute_id').on(table.instituteId),
    index('idx_audit_log_entity').on(
      table.instituteId,
      table.entityType,
      table.entityId
    ),
    index('idx_audit_log_created_at').on(table.instituteId, table.createdAt),
  ]
);
