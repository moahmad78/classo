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
