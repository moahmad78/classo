# Classo Implementation Plan

**PRD Version:** 1.1 | **Build Date:** 2026-10-03  
**Status:** In Progress (Phase 0: Foundation)

---

## 1. Roadmap Overview & Phased Execution

As mandated by Section 17 & 18 of the PRD, development proceeds strictly phase by phase. No phase is considered complete until its **Definition of Done** is fulfilled with all tests passing.

| Phase | Description | Key Requirement IDs | Status |
|---|---|---|---|
| **Phase 0** | **Foundation** (Monorepo, DB + RLS, Design System, Auth skeleton, i18n, Audit log, Isolation test harness) | ISO-01, ISO-02, ISO-05, CC-05, CC-07, SEC-01..04, Section 14 | **COMPLETED** |
| **Phase 1** | **Core & Control Center v0** (Self-registration, OTP, Approval Queue, Role-selector login, RBAC, Setup wizard, Basic flags) | REG-01..14, USR-01..11, SET-01..06, CTL-01..03, CTL-06 | **COMPLETED** |
| **Phase 2** | **People** (Students, Staff profiles & onboarding, Departments, Academic structure, Public inquiry & admission) | STU-01..06, STF-01, STF-03..04, STF-15, SET-02/05, ADM-01/03/05, CC-06 | **COMPLETED** |
| **Phase 3** | **Daily Ops** (Student attendance, Staff selfie attendance, Timetable & conflict detection, Notices) | ATT-01..06, STF-02, STF-05..14, TT-01..04, COM-01/05 | **COMPLETED** |
| **Phase 4** | **Money** (Fee structures, Dues, Razorpay integration, Receipts, Fee reminders, Message wallet) | FEE-01..10, REM-01..08, CTL-09 | **ACTIVE** |
| **Phase 5** | **Academics** (Homework, Weekly tests, Question bank, Exams, Report cards) | HW-01..05, TST-01..08, EXM-01..08 | Queued |
| **Phase 6** | **Payroll** (Salary structures, Attendance/LOP calculation, Payslips, Salary reminders) | PAY-01..09 | Queued |
| **Phase 7** | **Portals Polish** (Teacher/Student/Parent dashboards, Mobile UX, PWA) | CC-12, PERF-01..08, USR-11 | Queued |
| **Phase 8** | **Communication & Billing** (Bulk messaging, Announcements, Subscriptions, Invoices) | COM-02..05, CTL-04/05/08 | Queued |
| **Phase 9** | **Type-Specific Modules** (School Transport/Library/Hostel, College Credits/Placement, Coaching Batches/DPP) | TYP-S1..S4, TYP-C1..C4, TYP-K1..K6, ADM-02/04, EXM-07 | Queued |
| **Phase 10** | **Hardening & Security** (Load testing, Security drills, Monitoring, Backups) | SEC-05..14, PERF-01..08, CTL-12/14/17 | Queued |
| **Phase 11** | **Pilot & Launch** (Pilot institutes onboarding, Release manager, Support desk) | CTL-07, CTL-10 | Queued |

---

## 2. Phase 0: Foundation — Task Breakdown

### Task 0.1: Monorepo & Workspace Orchestration
- **Requirement IDs:** PRD Section 4.5, DEC-002
- **Deliverables:**
  - Root `package.json` with npm workspaces (`apps/*`, `packages/*`).
  - Base TypeScript config (`packages/config/tsconfig.base.json`).
  - Directory structure:
    - `/apps/api` (NestJS backend API)
    - `/apps/web` (Next.js institute app)
    - `/apps/control` (Next.js control center)
    - `/apps/worker` (BullMQ background workers)
    - `/packages/db` (Drizzle schema, RLS policies, migrations)
    - `/packages/ui` (Design system tokens and components)
    - `/packages/config` (Shared configs and constants)
    - `/packages/sdk` (API client types and contracts)

### Task 0.2: Database & PostgreSQL RLS Framework
- **Requirement IDs:** ISO-01, ISO-02, PRD Section 4.2, 9.1, 9.2
- **Deliverables:**
  - Database connection pool manager supporting tenant context injection (`SET LOCAL app.institute_id = '<uuid>'`).
  - Base schemas:
    - **Global tables:** `institutes`, `plans`, `feature_flags`, `institute_applications`, `platform_audit_log`.
    - **Tenant tables (base):** `users`, `roles`, `permissions`, `audit_log`, `departments`, `academic_years`.
  - Automated SQL generator / migration check ensuring every tenant table has:
    1. `institute_id UUID NOT NULL REFERENCES institutes(id)`
    2. Index on `(institute_id, ...)`
    3. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
    4. `CREATE POLICY ... USING (institute_id = NULLIF(current_setting('app.institute_id', true), '')::uuid);`
  - Automated test script validating ISO-01 across all schema definitions.

### Task 0.3: Tenant Isolation Test Suite (ISO-02)
- **Requirement IDs:** ISO-02, ISO-04, ISO-05
- **Deliverables:**
  - Automated test suite using PostgreSQL (local or PGlite).
  - Creates two tenants: Tenant A and Tenant B with seeded sample records.
  - Verifies that:
    1. Tenant A credentials / context can NEVER read Tenant B records.
    2. Tenant A cannot insert, update, or delete records belonging to Tenant B.
    3. Attempts to tamper or access another tenant fail silently with empty results (or 404/403 at API layer).
    4. Direct ID guessing (`/api/v1/users/:id_from_tenant_b`) returns 404 Not Found.

### Task 0.4: Shared Design System (`@classo/ui`)
- **Requirement IDs:** PRD Section 14.1–14.5, DEC-003
- **Deliverables:**
  - Tailwind CSS configuration & tokens matching PRD 14.3:
    - Primary Teal (`#0F766E`), Marigold Accent (`#F59E0B`), Warm Cream BG (`#FAF7F2`), Charcoal Text (`#1F2937`), etc.
  - Core primitives: Button, Card, Input, Badge/Chip, Modal/Dialog, Skeleton loaders.
  - Visual styling avoiding generic AI templates, pure neon glow, or excessive blur.

### Task 0.5: Localization & Warm Microcopy Framework
- **Requirement IDs:** CC-07, PRD Section 14.6
- **Deliverables:**
  - Translation catalogs for `en` (English) and `hi-en` (Hinglish).
  - Microcopy examples from PRD 14.6 implemented (e.g. attendance saved, fee due notices, errors).
  - Localization provider and formatter for currency (`INR`, formatted in rupees/paise) and dates (`DD/MM/YYYY`).

### Task 0.6: Auth Skeleton & Security Utilities
- **Requirement IDs:** SEC-01..04, USR-01, USR-07
- **Deliverables:**
  - Password hashing via `argon2id` (RFC 9106 compliant).
  - Stateless JWT token generator with:
    - Access token (15 min lifespan, includes `sub`, `institute_id`, `role`, `permissions`).
    - Refresh token rotation with reuse detection.
  - Middleware for tenant extraction from verified JWT (matching subdomain).

### Task 0.7: Audit Logging & Structured Telemetry
- **Requirement IDs:** CC-05, ISO-05, PRD Section 13
- **Deliverables:**
  - Structured logger formatting logs as JSON with `request_id`, `institute_id`, `user_id` while scrubbing passwords, tokens, and PII.
  - Immutable audit log repository (`audit_log` table) recording actor, action, entity, timestamp, and diff.

---

## 3. Phase 0 Definition of Done

- [ ] Monorepo builds cleanly with shared configs and packages.
- [ ] Database migrations execute cleanly with RLS enabled on all tenant tables.
- [ ] CI validation passes: ISO-01 rule verified on all schemas.
- [ ] Automated isolation test suite (ISO-02) runs and passes 100%.
- [ ] Design system tokens and foundational components render with authentic Classo warm palette.
- [ ] Auth utilities (argon2id + JWT) pass unit test coverage >= 80%.
- [ ] Localization and audit logging are fully tested.
