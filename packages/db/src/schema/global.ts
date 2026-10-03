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
import {
  INSTITUTE_TYPES,
  APPLICATION_STATES,
  INSTITUTE_STATUSES,
  COMPANY_ROLES,
} from '@classo/config';

/**
 * Global Non-Tenant Tables (PRD Section 9.1)
 * These tables do not belong to any single institute and are managed
 * by Classo Control Center or public registration/auth flows.
 */

// Institutes table (Core tenant directory)
export const institutes = pgTable(
  'institutes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    type: varchar('type', { length: 32, enum: INSTITUTE_TYPES }).notNull(),
    subdomain: varchar('subdomain', { length: 64 }).notNull().unique(),
    code: varchar('code', { length: 32 }).notNull().unique(), // e.g. "DPS001" for classo.in/login resolution
    status: varchar('status', { length: 32, enum: INSTITUTE_STATUSES })
      .default('trial')
      .notNull(),
    contactPhone: varchar('contact_phone', { length: 20 }).notNull(),
    contactEmail: varchar('contact_email', { length: 255 }).notNull(),
    address: text('address'),
    city: varchar('city', { length: 100 }),
    state: varchar('state', { length: 100 }),
    pinCode: varchar('pin_code', { length: 10 }),
    logoUrl: text('logo_url'),
    brandingColors: jsonb('branding_colors').$type<{
      primary?: string;
      accent?: string;
    }>(),
    settings: jsonb('settings').$type<Record<string, unknown>>().default({}),
    trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('idx_institutes_subdomain').on(table.subdomain),
    uniqueIndex('idx_institutes_code').on(table.code),
    index('idx_institutes_status').on(table.status),
  ]
);

// Plans table (PRD CTL-03)
export const plans = pgTable('plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(), // 'Basic', 'Pro', 'Premium'
  monthlyPricePaise: integer('monthly_price_paise').notNull(),
  annualPricePaise: integer('annual_price_paise').notNull(),
  maxStudents: integer('max_students').notNull(),
  maxStaff: integer('max_staff').notNull(),
  storageGb: integer('storage_gb').notNull(),
  monthlyMessageCredits: integer('monthly_message_credits').notNull(),
  features: jsonb('features').$type<string[]>().default([]).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Institute Applications (Self-Registration: PRD REG-01 to REG-14)
export const instituteApplications = pgTable(
  'institute_applications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    instituteName: varchar('institute_name', { length: 255 }).notNull(),
    instituteType: varchar('institute_type', {
      length: 32,
      enum: INSTITUTE_TYPES,
    }).notNull(),
    state: varchar('state', { length: 100 }).notNull(),
    city: varchar('city', { length: 100 }).notNull(),
    pinCode: varchar('pin_code', { length: 10 }).notNull(),
    address: text('address').notNull(),
    officialPhone: varchar('official_phone', { length: 20 }).notNull(),
    officialEmail: varchar('official_email', { length: 255 }).notNull(),
    principalName: varchar('principal_name', { length: 255 }).notNull(),
    principalPhone: varchar('principal_phone', { length: 20 }).notNull(),
    principalEmail: varchar('principal_email', { length: 255 }).notNull(),
    affiliationNumber: varchar('affiliation_number', { length: 100 }),
    approxStudentCount: integer('approx_student_count').default(100).notNull(),
    preferredSubdomain: varchar('preferred_subdomain', { length: 64 }).notNull(),
    applicationStatus: varchar('application_status', {
      length: 32,
      enum: APPLICATION_STATES,
    })
      .default('submitted')
      .notNull(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    phoneVerified: boolean('phone_verified').default(false).notNull(),
    rejectionReason: text('rejection_reason'),
    notes: text('notes'),
    reviewedBy: uuid('reviewed_by'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_applications_status').on(table.applicationStatus),
    index('idx_applications_subdomain').on(table.preferredSubdomain),
    index('idx_applications_created_at').on(table.createdAt),
  ]
);

// Subdomain reservations (PRD REG-05: 14-day reservation)
export const subdomainReservations = pgTable(
  'subdomain_reservations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    subdomain: varchar('subdomain', { length: 64 }).notNull().unique(),
    applicationId: uuid('application_id').references(
      () => instituteApplications.id,
      { onDelete: 'cascade' }
    ),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('idx_subdomain_res_name').on(table.subdomain),
    index('idx_subdomain_res_expires').on(table.expiresAt),
  ]
);

// Platform Audit Log (Global audit for Control Center, PRD CTL-17)
export const platformAuditLog = pgTable(
  'platform_audit_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    actorId: uuid('actor_id'),
    actorType: varchar('actor_type', { length: 32 }).notNull(), // 'company_user' | 'system'
    action: varchar('action', { length: 100 }).notNull(), // e.g. 'application.approved'
    entityType: varchar('entity_type', { length: 64 }).notNull(),
    entityId: varchar('entity_id', { length: 64 }).notNull(),
    details: jsonb('details').$type<Record<string, unknown>>().default({}),
    ipAddress: varchar('ip_address', { length: 64 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_platform_audit_created').on(table.createdAt),
    index('idx_platform_audit_entity').on(table.entityType, table.entityId),
  ]
);

// Company Users (Control Center staff, PRD 2.2)
export const companyUsers = pgTable('company_users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 20 }),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 32, enum: COMPANY_ROLES }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  twoFactorSecret: text('two_factor_secret'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Feature Flags (PRD CTL-06)
export const featureFlags = pgTable('feature_flags', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  description: text('description'),
  isEnabledGlobally: boolean('is_enabled_globally').default(false).notNull(),
  rules: jsonb('rules').$type<Array<{
    scope: 'plan' | 'institute_type' | 'institute_ids' | 'percentage';
    value: unknown;
  }>>().default([]).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
