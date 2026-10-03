import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
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
    code: varchar('code', { length: 50 }).notNull(), // e.g. 'admin', 'teacher', 'custom_coordinator'
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

// Permissions table (PRD Section 8: module.action strings)
export const permissions = pgTable(
  'permissions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    code: varchar('code', { length: 100 }).notNull(), // e.g. 'fees.collect', 'attendance.mark'
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
    scope: varchar('scope', { length: 32 }).default('all').notNull(), // 'all' | 'assigned' | 'own'
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

// User Sessions (PRD USR-05: view & revoke active sessions)
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

// Invites table (PRD USR-03, REG-08, STF-15: 72-hour one-time links)
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

// OTP Requests (PRD REG-03, USR-02)
export const otpRequests = pgTable(
  'otp_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    identifier: varchar('identifier', { length: 255 }).notNull(), // email or phone
    otpHash: text('otp_hash').notNull(),
    purpose: varchar('purpose', { length: 50 }).notNull(), // 'login' | 'reset_password' | 'parent_auth'
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

// Departments (PRD SET-05: Principal adds/edits/archives departments)
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

// Academic Years (PRD CC-03: Every academic record belongs to an academic year)
export const academicYears = pgTable(
  'academic_years',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    name: varchar('name', { length: 100 }).notNull(), // e.g. "2026-2027"
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

// Campus Locations (PRD SET-06: Geofence for staff selfie attendance)
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

// Immutable Tenant Audit Log (PRD CC-05, ISO-05)
export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteId: uuid('institute_id')
      .references(() => institutes.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id'),
    action: varchar('action', { length: 100 }).notNull(), // e.g. 'attendance.marked', 'fees.collected'
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
