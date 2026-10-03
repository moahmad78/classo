# Architecture & Product Decisions

This file records decisions made during development, particularly for items marked **[CONFIRM]** in the PRD (Section 0, Section 4.1, Section 4.5, Section 14.3, Section 19).

---

## DEC-001: Proposed Technology Stack (PRD Section 4.1 [CONFIRM])

- **Date:** 2026-10-03
- **Status:** Accepted (Default as proposed in PRD 4.1)
- **Decision:**
  - **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS with custom theme system respecting Section 14 tokens.
  - **Backend API:** Node.js + NestJS/TypeScript (REST, OpenAPI / Swagger documented).
  - **Database:** PostgreSQL 15+ with PostgreSQL Row Level Security (RLS) as the primary tenant-isolation guarantee.
  - **DB Access:** Drizzle ORM configured with per-transaction session variables (`SET LOCAL app.institute_id = ...`) to prevent ORM-level bypass of RLS.
  - **Cache & Queues:** Redis + BullMQ for background jobs (reminders, notifications, PDF generation, bulk import/export).
  - **Object Storage:** S3-compatible (MinIO for local dev/testing, AWS S3 / Cloudflare R2 for staging/production), accessed exclusively via short-lived signed URLs.
  - **Auth:** Custom stateless JWT (15-min access token + rotating refresh tokens with reuse detection) with argon2id password hashing.
  - **Payments:** Razorpay (UPI, Netbanking, Cards) with webhook signature verification and idempotency ledger.

---

## DEC-002: Repository Layout & Monorepo Tooling (PRD Section 4.5 [CONFIRM])

- **Date:** 2026-10-03
- **Status:** Accepted (Default as proposed in PRD 4.5)
- **Decision:**
  - Standard monorepo layout using `npm workspaces` (supported natively by Node v22 and npm v10):
    ```
    /apps
      /web            # Institute app (Next.js - Admin, Teacher, Student, Parent, Accountant, Front Office)
      /control        # Classo Control Center (Next.js - Company staff)
      /api            # Backend API (NestJS + OpenAPI)
      /worker         # BullMQ async workers
    /packages
      /db             # Drizzle schemas, migrations, RLS policies, seeds
      /ui             # Shared design system components & styles (Section 14 tokens)
      /config         # Shared TypeScript, ESLint, constants
      /sdk            # Generated API client from OpenAPI spec
    /docs             # PRD, decisions.md, plan.md, runbooks
    ```

---

## DEC-003: Design System & Color Tokens (PRD Section 14.3 [CONFIRM])

- **Date:** 2026-10-03
- **Status:** Accepted
- **Decision:**
  - The design system implements the warm, human Indian education aesthetic specified in Section 14.
  - Core Tokens:
    - Primary: `#0F766E` (Deep Teal)
    - Accent: `#F59E0B` (Warm Marigold)
    - Background: `#FAF7F2` (Warm Cream, avoiding sterile pure white for app background)
    - Surface: `#FFFFFF` (Card/Table background)
    - Text: `#1F2937` (Charcoal primary text)
    - Muted: `#6B7280` (Neutral grey)
    - Success: `#15803D` (Forest green)
    - Danger: `#B91C1C` (Deep red)
    - Warning: `#B45309` (Amber)
  - Typography: Plus Jakarta Sans for headings, Nunito Sans for body, Noto Sans Devanagari for Hindi.
  - Strictly avoid generic AI/SaaS gradients, blue-purple glow, and glassmorphism.

---

## DEC-004: Tenant Isolation via PostgreSQL Row Level Security (RLS) (PRD Section 4.2, 4.3)

- **Date:** 2026-10-03
- **Status:** Accepted
- **Decision:**
  - Every tenant table contains `institute_id UUID NOT NULL REFERENCES institutes(id)`.
  - An RLS policy is enabled on every tenant table:
    `CREATE POLICY tenant_isolation_policy ON <table> FOR ALL USING (institute_id = NULLIF(current_setting('app.institute_id', true), '')::uuid);`
  - In application transactions, middleware executes `SET LOCAL app.institute_id = '<uuid>'`.
  - The application connects via a non-superuser database role (`classo_app`) that has `NOBYPASSRLS`.
  - Control Center connects via an audited separate role (`classo_control`) with explicit cross-tenant logging.

---

## DEC-005: Testing Framework and In-Memory / PGlite Test Harness (ISO-02)

- **Date:** 2026-10-03
- **Status:** Accepted
- **Decision:**
  - For rapid CI and local development without requiring external Docker setup, integration and tenant isolation tests use PGlite (WebAssembly full PostgreSQL engine supporting Postgres 16 with full RLS support) or local Postgres instance.
  - An automated test harness systematically validates that Tenant A authenticated sessions receive 0 rows or 403/404 when querying Tenant B data (ISO-02).
