/**
 * Classo Core Constants
 * Derived strictly from PRD v1.1
 */

export const INSTITUTE_TYPES = ['school', 'college', 'coaching'] as const;
export type InstituteType = (typeof INSTITUTE_TYPES)[number];

export const INSTITUTE_ROLES = [
  'admin',
  'teacher',
  'student',
  'parent',
  'accountant',
  'front_office',
] as const;
export type InstituteRole = (typeof INSTITUTE_ROLES)[number];

export const COMPANY_ROLES = [
  'owner',
  'tech_admin',
  'support',
  'sales',
  'finance',
] as const;
export type CompanyRole = (typeof COMPANY_ROLES)[number];

export const APPLICATION_STATES = [
  'submitted',
  'under_review',
  'needs_info',
  'approved',
  'rejected',
] as const;
export type ApplicationState = (typeof APPLICATION_STATES)[number];

export const INSTITUTE_STATUSES = [
  'trial',
  'active',
  'grace',
  'read_only',
  'suspended',
  'churned',
] as const;
export type InstituteStatus = (typeof INSTITUTE_STATUSES)[number];

export const ATTENDANCE_STATUSES = [
  'present',
  'absent',
  'late',
  'leave',
  'holiday',
] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const ASSESSMENT_TYPES = [
  'homework',
  'weekly_test',
  'unit_test',
  'midterm',
  'final',
  'mock_test',
  'practical',
] as const;
export type AssessmentType = (typeof ASSESSMENT_TYPES)[number];

export const RESERVED_SUBDOMAINS = [
  'admin',
  'api',
  'www',
  'app',
  'support',
  'billing',
  'status',
  'mail',
  'auth',
  'control',
  'dev',
  'stage',
  'staging',
  'prod',
  'test',
] as const;

/**
 * UI Color Tokens from PRD Section 14.3
 */
export const COLOR_TOKENS = {
  primary: '#0F766E', // deep teal
  accent: '#F59E0B',  // marigold
  bg: '#FAF7F2',      // warm cream
  surface: '#FFFFFF', // pure white card/table
  text: '#1F2937',    // charcoal
  muted: '#6B7280',   // slate grey
  success: '#15803D', // forest green
  danger: '#B91C1C',  // rich red
  warning: '#B45309', // amber
} as const;

/**
 * Typography Tokens from PRD Section 14.4
 */
export const TYPOGRAPHY = {
  fontHeading: 'Plus Jakarta Sans, sans-serif',
  fontBody: 'Nunito Sans, sans-serif',
  fontHindi: 'Noto Sans Devanagari, sans-serif',
} as const;

export const DEFAULT_TRIAL_DAYS = 14;
export const DEFAULT_SELFIE_RETENTION_DAYS = 90;
export const DEFAULT_GEOFENCE_RADIUS_METERS = 150;
export const INVITE_EXPIRY_HOURS = 72;
export const ACCESS_TOKEN_EXPIRY_MINUTES = 15;
export const REFRESH_TOKEN_EXPIRY_DAYS = 7;
