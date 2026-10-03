# Classo — Product Requirements Document (PRD)

**Version:** 1.1 (Final, build kickoff) | **Date:** 2026-10-03 | **Audience:** AI coding agent + human reviewers
**Product:** Classo — multi-tenant SaaS to run Schools, Colleges and Coaching institutes
**Companion product:** Classo Control Center (company-side admin)

> **How to use this document (for the agent):** Build strictly phase by phase (Section 17). Every requirement has an ID (e.g. `FEE-03`). Reference IDs in commits and PRs. Do not start a phase until the previous phase's "Definition of Done" is met. Items marked **[CONFIRM]** are proposed defaults; if the owner has not confirmed them, use the default and record the decision in `/docs/decisions.md`. Never invent features outside this document without adding them to "Open Questions".

---

## 0. Change Log

| Version | Change |
|---|---|
| 1.0 | Initial draft |
| 1.1 | **Self-service institute registration + Control Center approval queue** (REG-01 to REG-14); principal account auto-created on approval; principal then adds departments and teachers (SET-05, STF-15). **Role-selector login** with institute resolution (USR-01, USR-07 to USR-11). **Staff selfie attendance** with camera-only capture, geofence, review, consent and retention rules (STF-02, STF-05 to STF-14). Roadmap, data model, permissions, flows, security and open questions updated to match. |

---

## 1. Vision, Goals, Non-Goals

### 1.1 Vision
One software where any school, college or coaching class can manage everything: admissions, students, staff, attendance, fees, salary, homework, tests, exams, communication. Hundreds of institutes use the same platform, each with fully isolated data and its own branding. The Classo company manages all institutes, subscriptions and releases from a separate Control Center.

### 1.2 Goals
- G1: Support **1,000+ institutes** on one platform with **zero cross-tenant data leakage**.
- G2: Cover three institute types (School, College, Coaching) from one codebase using feature flags and type-specific modules.
- G3: Automated **fee reminders** and **salary processing/reminders**.
- G4: Company-side control: onboard institutes, plans, subscriptions, staged releases, global announcements.
- G5: A UI with a **human, warm feel** (not generic "AI template" look) and friendly Hinglish microcopy.
- G6: Reliable under load: no single institute can slow down others.
- G7: **Self-service onboarding:** any institute can register itself on the web app; Classo staff only review and approve. No manual data entry by Classo to get an institute live.

### 1.3 Non-Goals (v1)
- Native mobile apps (web must be fully responsive; PWA allowed). Native apps are Phase 12.
- Live video classes built in (integrate Zoom/Meet links only).
- AI features (question generation, prediction) — Phase 12.
- Biometric / face attendance hardware integration — Phase 12 (design attendance API so it can be added).
- Face recognition / face matching (students or staff) — not in v1. v1 staff attendance = camera-only selfie + geofence + human review (STF-02). Student attendance stays manual/tap-based in v1.
- Government / university portal integrations.

### 1.4 Success Metrics
| Metric | Target |
|---|---|
| Cross-tenant leak incidents | 0 |
| API p95 latency (normal endpoints) | < 400 ms |
| Uptime | ≥ 99.9% monthly |
| Attendance marked per class | ≤ 3 taps / < 30 s |
| Fee reminder delivery success | ≥ 95% |
| Registration review turnaround (application to decision) | ≤ 48 hours |
| Approval to principal's first login | ≤ 5 minutes (automated invite) |

---

## 2. Personas and Roles

### 2.1 Institute-side roles
| Role | Description |
|---|---|
| Institute Admin | Principal / Director / Owner. Full control inside own institute. |
| Teacher / Faculty | Marks attendance, assigns homework, creates tests, enters marks. |
| Student | Views homework, takes tests, sees results, fees, notices. |
| Parent | Read-mostly access for linked child(ren); pays fees. One parent can link to multiple children (possibly in same institute). |
| Accountant | Fee collection, receipts, expenses, payroll processing. |
| Front Office | Inquiries (CRM), admissions, certificates, visitors. |

Custom roles: Institute Admin can create custom roles by combining permissions (Section 8).

### 2.2 Company-side (Control Center) roles
| Role | Access |
|---|---|
| Owner | Everything, including revenue and team management |
| Tech Admin | Releases, feature flags, monitoring, backups |
| Support | Tickets, institute info, "login as" (time-limited, audited) |
| Sales | Leads, demos, onboarding, plan assignment |
| Finance | Billing, invoices, refunds, revenue reports |

---

## 3. Product Surfaces (Panels)

| # | Surface | Users | Domain (example) |
|---|---|---|---|
| 1 | Classo Control Center | Company staff | `admin.classo.in` |
| 2 | Institute Admin panel | Institute Admin | `{slug}.classo.in` |
| 3 | Teacher panel | Teachers | `{slug}.classo.in` |
| 4 | Student panel | Students | `{slug}.classo.in` |
| 5 | Parent panel | Parents | `{slug}.classo.in` |
| 6 | Accounts panel | Accountants | `{slug}.classo.in` |
| 7 | Front Office panel | Reception | `{slug}.classo.in` |
| 8 | Public pages | Visitors / applicants | `classo.in` (marketing, pricing), `classo.in/register` (institute self-registration), `classo.in/login` (institute code entry), `{slug}.classo.in/apply` (student admission form), `{slug}.classo.in/pay` (fee payment) |

Panels 2–7 are **one frontend app**; the visible navigation and routes depend on the logged-in user's role/permissions. Each role's panel is a separate code-split bundle, so a user only receives the screens of the role they logged in with (USR-01, USR-11). **There is no pre-created list of institutes:** any institute registers itself (REG-*) and goes live only after company approval. Control Center is a **separate frontend app** sharing the backend API but with a separate auth realm.

---

## 4. Architecture

### 4.1 Proposed Tech Stack **[CONFIRM]**
| Layer | Choice |
|---|---|
| Frontend (institute app + control center) | Next.js (App Router) + TypeScript, Tailwind CSS, shadcn/ui as base (restyled — see Section 14) |
| Backend API | Node.js + NestJS + TypeScript (REST, OpenAPI documented) |
| Database | PostgreSQL 15+ with **Row Level Security (RLS)** |
| DB access | Drizzle ORM or Kysely (must support setting session variables per request; avoid ORMs that hide connection handling) |
| Cache / Queue | Redis + BullMQ |
| File storage | S3-compatible object storage (signed URLs only) |
| Payments | Razorpay (UPI, cards, netbanking) |
| Messaging | WhatsApp Business Cloud API, SMS (MSG91 or similar), Email (SES/Resend), Web push |
| Auth | Own JWT auth (access 15 min + refresh token rotation), argon2id hashing |
| PDF generation | Headless Chromium (Puppeteer) or `@react-pdf/renderer` via worker |
| Infra | Docker, CI/CD (GitHub Actions), cloud VM/Kubernetes; staging + production |
| Monitoring | Sentry, Prometheus/Grafana (or managed equivalent), uptime checks |

### 4.2 Multi-Tenancy Model
- **Shared database, shared schema, `institute_id` on every tenant-owned table.**
- **RLS enforced at DB level**: every tenant table has a policy `institute_id = current_setting('app.institute_id')::uuid`.
- On every request, backend middleware sets `SET LOCAL app.institute_id = '<uuid>'` inside the transaction. The app DB user must **not** be a superuser and must not bypass RLS.
- `institute_id` is derived **only** from the verified JWT (and matched with subdomain). Never accept `institute_id` from request body/query for tenant users.
- Control Center uses a separate DB role with explicit, audited cross-tenant access.
- **Hybrid option (future):** a large institute can be moved to a dedicated database; keep a `tenant_connection` abstraction so this is possible without rewriting modules.

### 4.3 Tenant Isolation Requirements
| ID | Requirement |
|---|---|
| ISO-01 | Every tenant table has `institute_id UUID NOT NULL` + index + RLS policy. A CI check fails if a new table lacks it (except documented global tables). |
| ISO-02 | Automated test suite: create Tenant A and B with data; for every API endpoint assert A can never read/write B's records (incl. by ID guessing). |
| ISO-03 | File paths: `/{institute_id}/{module}/{uuid}`; downloads only via short-lived signed URLs after permission check. |
| ISO-04 | Cache keys, queue jobs and search indexes are all prefixed/namespaced by `institute_id`. |
| ISO-05 | Logs must include `institute_id` and `user_id`; never log passwords, tokens, or full personal data. |
| ISO-06 | Per-tenant rate limits (requests, SMS/WhatsApp sends, file uploads) to prevent noisy-neighbor issues. |
| ISO-07 | Pre-login tenant resolution (subdomain or institute code) and public registration endpoints are **pre-auth and hostile-input**: rate-limited, CAPTCHA-protected where needed, and return generic errors so institutes/users cannot be enumerated. Registration data lives in global tables; no tenant rows exist until approval. |

### 4.4 Environments
`local` → `staging` (mirrors prod, seeded with 3 demo tenants) → `production`. All schema migrations run on staging first. Production deploys are zero-downtime (rolling or blue-green).

### 4.5 Repository Layout **[CONFIRM]**
```
/apps
  /web            # institute app (Next.js)
  /control        # control center (Next.js)
  /api            # NestJS backend
  /worker         # BullMQ workers (reminders, PDFs, messaging, scheduled jobs)
/packages
  /db             # migrations, schema, RLS policies, seeders
  /ui             # shared design system components
  /config         # eslint, tsconfig, shared constants
  /sdk            # generated API client from OpenAPI
/docs             # PRD, decisions.md, runbooks
```

---

## 5. Cross-Cutting Features

| ID | Feature | Requirement |
|---|---|---|
| CC-01 | Institute types | `institute.type ∈ {school, college, coaching}`; type decides default modules, terminology (Class/Section vs Course/Semester vs Batch), and grading. |
| CC-02 | Feature flags | Per-institute and per-plan flags. Module visibility, API access and background jobs must all respect flags. |
| CC-03 | Academic year | Every academic record belongs to an academic year; admin can create/rollover years (promote students, copy fee structures). |
| CC-04 | Soft delete | Business records are soft-deleted (`deleted_at`); hard delete only via data-erasure flow. |
| CC-05 | Audit log | Immutable log of create/update/delete/login/permission/payment events: who, when, entity, before/after. |
| CC-06 | Bulk import/export | CSV/Excel import (with validation report and dry-run) for students, staff, fees, marks. Export of every list to CSV/Excel/PDF. |
| CC-07 | Localization | English + Hindi UI; institute can choose default language; dates in `DD/MM/YYYY`; currency INR. Architecture ready for more languages. |
| CC-08 | Notifications | Central notification service (in-app, push, WhatsApp, SMS, email) with templates, per-institute channel settings, delivery status, retries. |
| CC-09 | Search | Global search (students, staff, receipts) scoped to tenant. |
| CC-10 | Branding | Per-institute logo, colors (from a limited palette), receipt/report card header, subdomain, later custom domain. |
| CC-11 | Timezone | Default `Asia/Kolkata`; store timestamps in UTC. |
| CC-12 | Accessibility | WCAG 2.1 AA basics: keyboard navigation, contrast, labels, tap targets ≥ 44px. |

---

## 6. Institute App — Module Requirements

> Roles legend: **A**=Admin, **T**=Teacher, **S**=Student, **P**=Parent, **AC**=Accountant, **FO**=Front Office.

### 6.0 Institute Self-Registration & Approval (Public + Control Center)

**Flow:** Institute opens `classo.in/register` → fills form → verifies email/phone by OTP → application is `submitted` → Classo team reviews in the Approval Queue (CTL-02) → **Approve** → institute, subdomain and **Principal account are auto-created** and invite sent → Principal sets password → setup wizard (SET-01) → Principal adds departments (SET-05) and teachers (STF-15).

| ID | Requirement | Acceptance criteria |
|---|---|---|
| REG-01 | Public registration page; no pre-created institute list. Any institute can apply. | Page works without login; mobile friendly; available in English/Hindi. |
| REG-02 | Form fields: institute name, type (school/college/coaching), address (state, city, PIN), official phone and email, principal name/phone/email, affiliation or registration number (UDISE / board / university / coaching registration), approximate student count, preferred subdomain, documents (registration certificate, principal ID proof, optional logo), consent to Terms and Privacy Policy. | Required fields validated; documents limited by type/size and virus-scanned. |
| REG-03 | Email OTP and phone OTP verification before the application is accepted. | Wrong/expired OTP handled; resend limits enforced. |
| REG-04 | Anti-abuse: CAPTCHA, rate limit per IP/phone/email, duplicate detection (same phone/email or name+PIN), disposable-email blocking. | Duplicate applications flagged for reviewer, not silently rejected. |
| REG-05 | Subdomain: lowercase letters, digits, hyphen; 3 to 30 chars; reserved words blocked (admin, api, www, app, support, etc.); unique. Reserved for 14 days on submit; permanently assigned only at approval. | Availability check live in form; released on rejection or expiry. |
| REG-06 | Application states: `submitted` → `under_review` → `needs_info` → `approved` / `rejected`. Applicant can track status via a tracking link + OTP and can edit and resubmit when `needs_info`. | Every state change timestamped and visible to the applicant. |
| REG-07 | **Approval Queue** in Control Center: list with filters (state, type, state/city), SLA timer (target 48 h), document viewer, verification checklist, internal notes, assignee. Actions: Approve, Reject (reason mandatory), Request more info (message to applicant). | Only Support/Sales/Owner roles can decide; all actions audited. |
| REG-08 | **On approval (single idempotent transaction):** create institute (status `trial`, default plan and trial length from settings), assign subdomain and institute code, apply default settings for the institute type, create **Principal user (role Admin)**, send invite by email + SMS with one-time link (valid 72 h, resendable) to set password, send welcome message. | Re-running approval never creates duplicates; failure rolls back fully. |
| REG-09 | **On rejection:** email/SMS with reason; applicant can edit and reapply; subdomain released; rejected application data purged after a configurable period (default 90 days). | |
| REG-10 | Principal's first login: forced password set, optional 2FA prompt, then setup wizard. | Wizard resumable. |
| REG-11 | Notify Classo team of new applications (email and Slack/WhatsApp). Overdue-SLA alerts to Owner. | |
| REG-12 | Abandoned unverified drafts purged after 30 days. | |
| REG-13 | Optional auto-approval rules (e.g., verified affiliation number) exist as a setting, **off by default**. | |
| REG-14 | Manual "Create institute" in Control Center remains as a secondary path for sales-assisted onboarding; it follows the same creation routine as REG-08. | |

### 6.1 Onboarding & Institute Setup (Admin)
| ID | Requirement | Acceptance criteria |
|---|---|---|
| SET-01 | First-login setup wizard, in this order: confirm institute profile and logo → academic year → **departments** (SET-05) → **teachers/staff invites** (STF-15) → classes/courses/batches → grading scheme → working days and holidays → **campus location and staff attendance policy** (STF-06, STF-07) → fee setup shortcut. | Wizard completes with sensible defaults per institute type; can be resumed; each step skippable except profile and academic year. |
| SET-02 | Structure builder. School: Class → Section → Subject. College: Department → Course → Semester → Subject. Coaching: Course → Batch → Subject. | Admin can create/edit/archive structure; students can only be assigned to valid nodes. |
| SET-03 | Holiday calendar and events. | Attendance and reminders skip holidays. |
| SET-04 | Communication settings: sender name, enabled channels, templates, quiet hours. | Messages are not sent during quiet hours (queued). |
| SET-05 | **Departments:** Principal creates/edits/archives departments (name, optional head of department, description) for all institute types (e.g., school: Primary, Secondary, Administration; college: academic departments; coaching: Physics, Chemistry, Maths, Administration). Staff and subjects link to a department. | Department can be created inline from the teacher form; archiving blocked while active staff are assigned. |
| SET-06 | Campus locations: one or more locations (name, map pin, radius) used for staff selfie attendance geofence. | Default radius 150 m; editable per campus. |

### 6.2 Users, Roles, Permissions
| ID | Requirement |
|---|---|
| USR-01 | **Login flow:** (1) institute is resolved from the subdomain (`abcschool.classo.in`) or from an institute code entered on `classo.in/login`; the institute-branded screen loads. (2) **Role selector:** cards for Principal/Admin, Teacher, Student, Parent, Accountant, Front Office (only roles enabled for that institute). (3) Credentials form for the chosen role (password; OTP option for parents/students). (4) Server verifies credentials **and** that the user actually holds the chosen role. (5) Redirect to that role's panel only. |
| USR-02 | Forgot password via OTP/email link; account lock after 5 failed attempts (15 min). |
| USR-03 | Invite users via link/SMS; forced password change on first login. |
| USR-04 | Role-based and permission-based access (Section 8). Admin can create custom roles. |
| USR-05 | Session management: view and revoke active sessions; optional 2FA for Admin and Accountant (TOTP). |
| USR-06 | Parent ↔ student linking (multiple children, multiple guardians per child). |
| USR-07 | The role selector is a **UI convenience only**. Authorization always comes from the database; a role mismatch returns a generic error and is rate-limited and logged. |
| USR-08 | Users with more than one role (e.g., teacher + parent) get a role switcher after login; the JWT carries the active role and switching re-issues the token. |
| USR-09 | Pre-login states: unknown, pending, rejected or suspended institutes show a friendly page; no information that allows institute or user enumeration. |
| USR-10 | Role-specific identifiers (configurable): staff by email/phone, students by admission number or phone, parents by phone + OTP. |
| USR-11 | Panel isolation: each role's frontend bundle is code-split and served only after authentication as that role; API enforces the same boundaries (SEC-04). |

### 6.3 Admissions & Inquiry (FO, A)
| ID | Requirement |
|---|---|
| ADM-01 | Public online admission form (per institute, configurable fields, document upload). Optional application fee via Razorpay. |
| ADM-02 | Inquiry/lead CRM: source, status (new → contacted → demo/visit → applied → admitted/lost), follow-up reminders, notes, assigned staff. (Mandatory for Coaching; optional for others.) |
| ADM-03 | Admission workflow: application → review → approve/reject → generate admission number → create student + parent accounts → assign class/batch → generate fee plan. |
| ADM-04 | Merit list / counselling support for colleges (rank-based seat allotment). **Phase 9.** |
| ADM-05 | Duplicate detection (same name + DOB + parent phone) warning. |

### 6.4 Student Management
| ID | Requirement |
|---|---|
| STU-01 | Student profile: personal info, photo, guardians, address, previous school, medical notes (restricted), documents. |
| STU-02 | Unique admission number and roll number generation rules configurable per institute. |
| STU-03 | Class/section/batch assignment and history; promotion/rollover at year end with bulk tools. |
| STU-04 | ID card generation (PDF, printable sheet) and certificates (bonafide, TC, character) from templates with approval and unique serial numbers. |
| STU-05 | Status lifecycle: active, inactive, alumni, transferred, dropped (with reasons). |
| STU-06 | Bulk import with validation. |

### 6.5 Staff Management
| ID | Requirement |
|---|---|
| STF-01 | Staff profile, designation, department, joining date, documents, bank details (encrypted), subjects/classes assigned. |
| STF-02 | **Staff selfie attendance:** teachers and other staff mark their own attendance (check-in / check-out) by capturing a live photo in the web app (mobile browser/PWA). Admin can also mark manually. API stays ready for biometric devices (ATT-06). Details in STF-05 to STF-14. |
| STF-03 | Leave types, leave requests, approval workflow, leave balance. |
| STF-04 | Teaching assignment: teacher ↔ subject ↔ class/section/batch. Drives timetable, attendance, homework permissions. |
| STF-05 | **Camera-only capture:** photo is taken live via the browser camera; no gallery/file upload is offered. Server time is authoritative; client time, device info and user agent are stored as supporting data. |
| STF-06 | **Location check:** GPS coordinates are captured and compared with the institute's campus geofence(s) (SET-06). Institute policy chooses `flag` (accept but send for review) or `block` (reject) for outside-geofence attempts. Poor GPS accuracy and suspected mock location (best effort) are flagged. |
| STF-07 | **Check-in / check-out rules:** first capture of the day = check-in, later capture = check-out. Late, half-day and early-leave are computed from the attendance policy (shift timings, grace minutes, minimum hours). Holidays and approved leave respected. |
| STF-08 | **Photo handling:** server-side resize and compression, EXIF stripped, stored in private tenant-scoped storage, thumbnails for review; access only for the staff member, Admin and roles with explicit permission; every view logged. |
| STF-09 | **Review screen:** Principal/Admin sees the day's check-ins with photo thumbnail, time, and location status; can approve, reject or mark manually. Within-geofence check-ins are auto-accepted by default (configurable). Rejection notifies the staff member, who can raise a correction request. |
| STF-10 | **Manual override and corrections:** Admin can mark/correct attendance with a mandatory reason; full audit log; staff correction-request workflow with approval. Fallback when camera or GPS fails. |
| STF-11 | **Liveness / face match: not in v1.** v1 relies on live capture, geofence, duplicate-photo detection and human review. The data model keeps a disabled hook for future face matching (needs explicit consent and a separate decision). |
| STF-12 | **Consent and retention:** staff explicitly consent on first use (stored in `consent_records`). Photos are retained for a configurable period (default 90 days, range 30–365) then auto-deleted; only the attendance fact (date, time, status, location check result) is kept permanently. Photos are never used for any other purpose. |
| STF-13 | **Payroll link:** reviewed/accepted selfie attendance feeds payroll (PAY-02); rejected or flagged records are not counted until resolved. |
| STF-14 | **Anti-abuse signals:** minimum gap between captures; same photo hash reused is flagged; one device used by several staff is a soft flag; rate limiting. Flags appear in the review screen. |
| STF-15 | **Teacher onboarding by Principal:** add teachers one by one (form) or by CSV, choosing department and role; system sends invite by email/SMS/WhatsApp (valid 72 h, resendable); teacher sets password, adds profile photo and gives selfie-attendance consent on first login. Teacher cannot access the panel until the invite is accepted. |

### 6.6 Attendance
| ID | Requirement | Acceptance criteria |
|---|---|---|
| ATT-01 | Student attendance by class/section/batch (daily) or by subject/period. Statuses: present, absent, late, leave, holiday. | Default all present; teacher taps exceptions; submit in ≤ 3 taps. |
| ATT-02 | Edit window: teachers can edit same-day; later edits need Admin permission and are audited. | |
| ATT-03 | Auto notification to parent on absence (configurable delay/time). | Message sent once per absence; respects quiet hours. |
| ATT-04 | Reports: daily, monthly, student-wise percentage, defaulters (< threshold). Export. | |
| ATT-05 | Leave application by parent/student → teacher/admin approval → attendance auto-marked "leave". | |
| ATT-06 | Attendance ingestion API for QR/biometric devices (device token per institute). **Phase 12 enable; design now.** | |

### 6.7 Timetable
| ID | Requirement |
|---|---|
| TT-01 | Period structure (periods, timings, breaks) configurable per institute/class. |
| TT-02 | Timetable builder per class/section/batch with teacher and room; **conflict detection** (teacher/room double booking). |
| TT-03 | Teacher view, student view, substitution/adjustment for absent teacher with notification. |
| TT-04 | Print/export PDF. |

### 6.8 Fees (AC, A, P)
| ID | Requirement | Acceptance criteria |
|---|---|---|
| FEE-01 | Fee heads (tuition, transport, hostel, exam, etc.), fee structures per class/course/batch/academic year. | |
| FEE-02 | Plans: one-time, monthly, quarterly, custom installments; due dates; late fine rules (fixed/per-day, capped). | Late fine auto-calculated on due-date breach. |
| FEE-03 | Discounts/scholarships/concessions (percentage/fixed, per student, with approval and reason). | Applied amounts visible on receipt. |
| FEE-04 | Collection: cash, cheque, UPI, card, bank transfer, online (Razorpay). Partial payments supported. | Payment updates ledger atomically. |
| FEE-05 | Receipts: sequential, institute-configurable numbering, PDF, WhatsApp/email to parent, duplicate receipt reprint with "DUPLICATE" mark. | Receipt numbers never repeat or skip silently. |
| FEE-06 | Online payment link (per student/per due), Razorpay webhook handling with signature verification and idempotency. | Duplicate webhooks do not double-credit. |
| FEE-07 | Refunds/adjustments with approval and audit. | |
| FEE-08 | Dashboards: collected today/month, pending, overdue, defaulters, mode-wise collection, class-wise dues. | |
| FEE-09 | Student fee ledger (all charges, payments, balance) visible to Parent/Student. | |
| FEE-10 | Day-end closing report for Accountant. | |

### 6.9 Fee Reminders (Notification rules)
| ID | Requirement |
|---|---|
| REM-01 | Rule engine per institute: trigger offsets relative to due date (default: −3 days, 0, +1, +3, +7 days) and max reminders per due. |
| REM-02 | Channels per rule: WhatsApp, SMS, email, push; fallback chain (e.g., WhatsApp fails → SMS). |
| REM-03 | Editable templates with variables (`{student_name}`, `{amount}`, `{due_date}`, `{pay_link}`), pre-approved WhatsApp templates managed in Control Center. |
| REM-04 | Scheduler (daily job + per-tenant timezone) enqueues reminders; skip if paid; skip holidays/quiet hours if configured. |
| REM-05 | Each message stored with status (queued/sent/delivered/failed), cost, and retry count; visible in a delivery log. |
| REM-06 | Credits: sending deducts from the institute's message wallet; block and alert when balance is low (Section 7). |
| REM-07 | Manual "send reminder now" for selected defaulters. |
| REM-08 | Parent opt-out handling per channel where legally required. |

### 6.10 Payroll & Salary Reminders (AC, A)
| ID | Requirement | Acceptance criteria |
|---|---|---|
| PAY-01 | Salary structure per staff: basic, allowances, deductions (PF, ESI, TDS, advance). Configurable components. | |
| PAY-02 | Monthly payroll run: pulls attendance and approved leave; computes LOP (loss of pay), overtime; allows manual adjustments. | Run can be previewed, locked, and reverted before approval. |
| PAY-03 | Coaching/visiting faculty: per-lecture or per-batch payout computed from conducted classes/hours. | |
| PAY-04 | Approval flow: Accountant prepares → Admin approves → marked paid (with mode/reference). | |
| PAY-05 | Salary slip PDF per staff; staff can view/download in own panel; notification on credit. | |
| PAY-06 | Bank transfer export (CSV/NEFT-format) for the month. | |
| PAY-07 | Advances/loans with EMI-style recovery over months. | |
| PAY-08 | **Salary reminders:** (a) to Accountant/Admin: payroll due soon / not processed by configured date; (b) to staff: salary credited with slip link. | |
| PAY-09 | Payroll reports: month summary, department-wise, statutory summary. | |

### 6.11 Academics — Homework, Weekly Tests, Exams (T, S, P, A)

**Unified assessment model:** one engine with `assessment_type ∈ {homework, weekly_test, unit_test, midterm, final, mock_test, practical}`, each with marks, weightage, subject, class/section/batch, academic year. Final results are computed from weightage rules set by the institute.

#### Homework
| ID | Requirement |
|---|---|
| HW-01 | Teacher assigns homework to class/section/batch/subject: title, description, attachments (PDF/image/link), due date. |
| HW-02 | Student submits online (photo/PDF/text) or teacher marks "done/not done" for offline. |
| HW-03 | Teacher checks: marks and remarks; may request resubmission. |
| HW-04 | Notifications: new homework, due-soon, overdue (to student and parent). |
| HW-05 | Reports: pending homework by student/class; completion rate by teacher. |

#### Weekly / Unit tests
| ID | Requirement |
|---|---|
| TST-01 | Schedule tests (subject, topics/syllabus, date, duration, max marks). Offline mode: marks entry only. |
| TST-02 | Online mode: question bank (MCQ single/multiple, true/false, numeric, short answer manual-graded); timer; shuffle; auto-submit at time end; autosave answers; one attempt by default. |
| TST-03 | Question bank organized by subject → chapter → topic → difficulty; import via CSV/Word template; reuse across tests. |
| TST-04 | Negative marking and sectional marks (coaching-focused, configurable). |
| TST-05 | Instant result for auto-graded tests: score, rank, correct/incorrect/unattempted, topic-wise analysis. |
| TST-06 | Weak-topic analytics per student and class; progress trend graph. |
| TST-07 | Absentee re-test scheduling. |
| TST-08 | Basic anti-cheat for online tests: tab-switch warning/count, one active session per student, IP/session logging. (No proctoring in v1.) |

#### Exams & Results
| ID | Requirement |
|---|---|
| EXM-01 | Exam types and terms defined per institute (UT-1, Half Yearly, Annual, Semester, etc.) with weightage. |
| EXM-02 | Exam timetable and admit card/hall ticket PDF; seating plan and invigilation duty allotment. |
| EXM-03 | Marks entry by subject teacher (theory/practical/internal/external split) with lock after submission; Admin can unlock with audit. |
| EXM-04 | Grading: School → percentage/grade bands (configurable); College → credits + SGPA/CGPA; Coaching → percentile/rank. |
| EXM-05 | Report card / marksheet PDF using institute-specific templates; bulk generate by class. |
| EXM-06 | Result publishing controlled by Admin; parents/students see only published results. |
| EXM-07 | Revaluation/re-exam request flow (college). **Phase 9.** |
| EXM-08 | Remarks, co-scholastic/behavior grades for schools. |

### 6.12 Communication
| ID | Requirement |
|---|---|
| COM-01 | Notice board: audience targeting (all, role, class/section/batch, individuals), attachments, scheduled publish, read receipts (optional). |
| COM-02 | Bulk messaging via WhatsApp/SMS/email/push using templates; delivery reports; credit deduction. |
| COM-03 | Teacher ↔ Parent messaging (optional, can be disabled per institute; moderated: Admin can view). |
| COM-04 | Event calendar and PTM (parent-teacher meeting) slot booking. |
| COM-05 | In-app notification center with unread count. |

### 6.13 Type-Specific Modules (Phase 9)
| ID | Type | Module | Key requirements |
|---|---|---|---|
| TYP-S1 | School | Transport | Routes, stops, vehicles, drivers, student allocation, transport fee link |
| TYP-S2 | School | Library | Catalogue, issue/return, fines, member cards |
| TYP-S3 | School | Diary/Remarks & discipline | Daily diary, behavior notes (restricted visibility) |
| TYP-S4 | School | Hostel (optional) | Rooms, allocation, mess, hostel fee link |
| TYP-C1 | College | Credits/CGPA engine | Credit-based courses, internal/external marks, electives |
| TYP-C2 | College | Placement cell | Companies, drives, eligibility, applications, outcomes |
| TYP-C3 | College | Alumni | Alumni directory and updates |
| TYP-C4 | College | Lecture plan & syllabus coverage | Faculty plans vs actual coverage |
| TYP-K1 | Coaching | Batch manager | Batch timings, capacity, shifting, per-batch fee plans |
| TYP-K2 | Coaching | Study material & recorded lectures | Upload/link by batch/subject with access control |
| TYP-K3 | Coaching | Doubt-solving | Student posts doubt (text/image) → teacher answers; status tracking |
| TYP-K4 | Coaching | DPP (Daily Practice Problems) | Daily problem sets, streaks, leaderboard |
| TYP-K5 | Coaching | Live class links | Schedule with Zoom/Meet link, attendance via join log (manual) |
| TYP-K6 | Coaching | Referral & offers | Referral codes, discounts applied in fee plan |

### 6.14 Reports & Dashboards
| Panel | Dashboard content |
|---|---|
| Admin | Today attendance %, staff selfie check-ins awaiting review, fee collected vs pending, upcoming exams, admissions funnel, staff on leave, alerts (low credits, plan limits) |
| Teacher | Today's classes, attendance pending, homework to check, tests to grade |
| Student | Today's timetable, pending homework, upcoming tests, latest result, dues |
| Parent | Child switcher; attendance, homework, results, fee dues and pay button, notices |
| Accountant | Collection today, pending, payroll status, day-end |
| Front Office | New inquiries, follow-ups due today, admissions in progress |

All reports: filter by academic year/class/date, export to CSV/Excel/PDF, and are paginated server-side.

---

## 7. Classo Control Center (Company Side)

| ID | Module | Requirements |
|---|---|---|
| CTL-01 | Institute management | Create/edit/suspend/reactivate institutes; fields: name, type, slug/subdomain, contact, address, GSTIN, plan, status (`trial`, `active`, `grace`, `read_only`, `suspended`, `churned`). Search, filter, export. |
| CTL-02 | **Registration Approval Queue** and onboarding | Receives applications from REG-*; reviewer checks documents, then Approve / Reject / Request info (REG-07). Approval auto-creates institute, subdomain, institute code and Principal account and sends the invite (REG-08). Manual "Create institute" stays as a secondary path (REG-14). Optional starter-data import and plan/trial assignment. |
| CTL-03 | Plans & limits | Plans (Basic/Pro/Premium) with price (monthly/annual), limits (students, staff, storage GB, message credits), included modules. Enforced by backend; soft warning at 80%, hard block at 100% (configurable). |
| CTL-04 | Subscriptions | Lifecycle: lead → trial (default 14 days) → paid → renewal → grace (5–7 days) → read-only → suspended. Upgrade/downgrade with proration. Coupons. Add-ons (extra SMS pack, storage, custom domain). |
| CTL-05 | Billing | Auto invoices (GST-compliant PDF), Razorpay subscriptions/payment links, failed-payment retries, credit notes, refunds, revenue reports (MRR, ARR, churn). |
| CTL-06 | Feature flags | Flags with scopes: global, plan, institute-type, specific institutes, percentage rollout. UI to toggle, schedule, and see who has what. Audit-logged. |
| CTL-07 | Release manager | Create release records (version, changelog); staged rollout via flags (internal → pilot institutes → 10% → 50% → 100%); health metrics per stage; one-click rollback (flag off). |
| CTL-08 | Global announcements | Banner/popup/message to all or targeted institutes (by plan/type/list); schedule; "What's new" feed shown in institute app. |
| CTL-09 | Message wallet | Per-institute credit balance for SMS/WhatsApp/email; recharge via payment; usage ledger; low-balance alerts; WhatsApp template approval status management. |
| CTL-10 | Support desk | Tickets from institutes (created in-app), priority, assignee, SLA timers, internal notes, status, canned responses. |
| CTL-11 | Impersonation ("Login as") | Support/Tech roles only; requires reason; time-boxed (max 30 min); institute admin notified (configurable); full audit log; banner shown while impersonating; destructive actions blocked by default. |
| CTL-12 | Monitoring | Per-institute usage (active users, API calls, storage, jobs), error rates, slow endpoints, queue health, uptime. Alerts to Slack/WhatsApp/email. |
| CTL-13 | Usage analytics | Active institutes, student counts, module adoption, retention, health score per institute. |
| CTL-14 | Backups & data | View backup status; per-institute export (all data, JSON/CSV zip); restore workflow (Tech Admin, approval needed); data-erasure workflow for DPDP requests. |
| CTL-15 | Sales CRM | Leads, demo scheduling, pipeline stages, referral/partner commissions. |
| CTL-16 | Internal team & roles | Manage company users and roles (Section 2.2), mandatory 2FA for all company users. |
| CTL-17 | Audit log | All Control Center actions; immutable; searchable. |

---

## 8. Permissions (RBAC)

Permissions are `module.action` strings (e.g., `fees.collect`, `attendance.mark`, `students.view`). Roles are sets of permissions; scope qualifiers: `own` (own records), `assigned` (assigned classes/batches), `all` (institute-wide).

---

## 9. Data Model (Core Entities)

All tenant tables include: `id UUID PK`, `institute_id UUID NOT NULL`, `created_at`, `updated_at`, `created_by`, `deleted_at`.

### 9.1 Global (non-tenant) tables
`institutes`, `plans`, `plan_limits`, `subscriptions`, `invoices`, `invoice_items`, `payments_platform`, `feature_flags`, `feature_flag_rules`, `releases`, `release_stages`, `announcements`, `support_tickets`, `ticket_messages`, `company_users`, `company_roles`, `message_wallets`, `wallet_transactions`, `platform_audit_log`, `leads`, `whatsapp_templates`, `institute_applications`, `institute_application_documents`, `institute_application_events`, `subdomain_reservations`.

### 9.2 Tenant tables (by domain)
- Identity: `users`, `user_roles`, `roles`, `role_permissions`, `sessions`, `invites`, `otp_requests`
- Structure: `academic_years`, `departments`, `courses`, `classes`, `sections`, `batches`, `semesters`, `subjects`, `class_subjects`, `holidays`, `periods`
- People: `students`, `guardians`, `student_guardians`, `student_enrollments`, `student_documents`, `staff`, `staff_documents`, `teaching_assignments`
- Admissions: `inquiries`, `inquiry_followups`, `applications`, `application_documents`, `admission_settings`
- Attendance: `student_attendance`, `staff_attendance`, `staff_attendance_photos`, `campus_locations`, `attendance_policies`, `attendance_corrections`, `consent_records`, `leave_types`, `leave_requests`, `leave_balances`, `attendance_devices`
- Timetable: `timetables`, `timetable_slots`, `rooms`, `substitutions`
- Fees: `fee_heads`, `fee_structures`, `fee_structure_items`, `student_fee_plans`, `student_dues`, `discounts`, `payments`, `payment_allocations`, `receipts`, `refunds`, `fine_rules`, `online_payment_attempts`
- Reminders: `reminder_rules`, `message_templates`, `message_queue`, `message_logs`, `opt_outs`
- Payroll: `salary_components`, `staff_salary_structures`, `payroll_runs`, `payroll_items`, `payslips`, `staff_advances`, `advance_recoveries`, `lecture_payouts`
- Academics: `assessments`, `assessment_scores`, `assignments_homework`, `homework_submissions`, `question_bank_questions`, `question_options`, `test_papers`, `test_paper_questions`, `test_attempts`, `test_answers`, `exams`, `exam_schedules`, `exam_marks`, `grade_scales`, `result_rules`, `report_cards`
- Communication: `notices`, `notice_audiences`, `notice_reads`, `notifications`, `events`, `ptm_slots`, `ptm_bookings`, `conversations`, `conversation_messages`
- Type modules: `transport_routes`, `transport_stops`, `vehicles`, `student_transport`, `library_books`, `library_issues`, `hostel_rooms`, `hostel_allocations`, `placement_drives`, `placement_applications`, `study_materials`, `doubts`, `doubt_replies`, `dpp_sets`, `live_classes`, `referral_codes`
- System: `audit_log`, `files`, `settings`, `feature_overrides_cache`, `import_jobs`, `export_jobs`

---

## 10. Background Jobs & Scheduling
- Fee reminder scan (daily)
- Message sender workers (continuous)
- Payroll reminders (daily)
- Subscription lifecycle (daily)
- Late fine calculation (daily)
- PDF generation (on demand, worker)
- Bulk import/export (on demand, worker)
- Backups (daily)
- Usage metering (hourly)
- Result computation (on demand)

---

## 11. Integrations
- Razorpay
- WhatsApp Business Cloud API
- SMS gateway (DLT-compliant)
- Email (SES / Resend)
- Web Push
- S3-compatible Object Storage

---

## 12. Non-Functional Requirements
- Security (SEC-01 to SEC-14)
- DPDP Act 2023 compliance, data retention & privacy
- Performance (PERF-01 to PERF-08): p95 < 400ms, 1,000 institutes target
- Reliability: 99.9% uptime, RPO <= 5m, RTO <= 1h

---

## 13. API Conventions
- REST `/api/v1/...`
- Bearer JWT Auth with tenant context derived strictly from token & verified against subdomain
- Pagination: `page`, `page_size` (max 100) or cursor
- Standardized error shape `{ "error": { "code": "...", "message": "...", "details": [] } }`
- Money stored as integer paise (`BIGINT`)
- Audit logging on every mutating endpoint

---

## 14. UI / UX Guidelines
- Human, warm, and trustworthy (Indian education product, not generic SaaS)
- Palette: Primary `#0F766E` (deep teal), Accent `#F59E0B` (marigold), Bg `#FAF7F2` (warm cream), Surface `#FFFFFF`, Text `#1F2937`, Muted `#6B7280`, Success `#15803D`, Danger `#B91C1C`, Warning `#B45309`
- Typography: Plus Jakarta Sans / Nunito Sans / Noto Sans Devanagari
- Microcopy: Warm Hinglish/English/Hindi options with i18n
- Fast daily tasks: attendance <= 3 taps; receipt < 20s

---

## 15. Key User Flows
1. Institute onboarding (self-service) & approval
1a. Role-selector login with institute code or subdomain resolution
2. Daily student attendance
3. Fee cycle (plan -> dues -> reminders -> online payment -> receipt)
4. Monthly payroll
5. Weekly tests & online assessments
6. Exams & report cards
7. Subscription lifecycle
8. Staged releases
9. Teacher selfie attendance (camera-only + GPS geofence + review)

---

## 16. Testing and Quality
- Unit tests >= 80% coverage
- Integration tests with RLS enabled
- Tenant isolation tests (ISO-02) blocking PRs
- Playwright E2E tests

---

## 17. Phased Roadmap
- Phase 0: Foundation
- Phase 1: Core & Control Center v0 (Multi-tenancy, REG-*, USR-*, RBAC, SET-*, CTL-01/02/03/06)
- Phase 2: People (STU-*, STF-01/03/04/15, SET-02/05, ADM-01/03/05, CC-06)
- Phase 3: Daily Ops (ATT-*, STF-02/05..14, TT-*, COM-01/05)
- Phase 4: Money (FEE-*, REM-*, Razorpay, receipts, CTL-09)
- Phase 5: Academics (HW-*, TST-*, EXM-*, report cards)
- Phase 6: Payroll (PAY-*)
- Phase 7: Portals polish
- Phase 8: Communication & Billing
- Phase 9: Type modules
- Phase 10: Hardening
- Phase 11: Pilot & Launch
- Phase 12: Growth
