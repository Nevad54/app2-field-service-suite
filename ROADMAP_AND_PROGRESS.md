# Field Service Suite Roadmap and Progress

Date: 2026-03-06

## Full Plan

### Sprint 1 (P0: Core Stabilization)
1. Fix Supabase runtime parity with frontend behavior.
2. Add missing job execution APIs in Supabase backend.
3. Replace weak checkout UX (`prompt`) with modal form.
4. Add API regression coverage for critical lifecycle paths.
5. Start modularization to reduce risk in large frontend file.

### Sprint 2 (P1: FSM Feature Gaps)
1. Add recurring/preventive maintenance in active Supabase stack.
2. Add recurring maintenance UI for operations use.
3. Add dispatch conflict and SLA risk visibility in Dashboard and Schedule.
4. Add configurable dispatch rules (capacity and SLA window) with persistence.

### Sprint 3 (P1: Customer and Field Mobility)
1. Add customer communication workflows (ETA/status update scaffolding).
2. Add completion proof flow (signature/evidence path).
3. Improve technician mobile execution flow and task closure ergonomics.

### Sprint 4 (P2: Advanced Ops)
1. Add route/capacity optimization heuristics.
2. Add SLA and operational KPI dashboards.
3. Add inventory reservation/consumption intelligence.

### Sprint 5 (P2: UI System and Hardening)
1. UI consistency pass and design-system cleanup.
2. Accessibility and interaction QA.
3. E2E workflow hardening and broader test coverage.

## Completed Work

### Sprint 1 Completed
1. Supabase job execution parity:
   - `POST /api/jobs/:id/checkin`
   - `POST /api/jobs/:id/checkout`
   - `PATCH /api/jobs/:id/worklog`
2. Supabase recurring maintenance backend:
   - `GET /api/recurring`
   - `GET /api/recurring/customer/:customerId`
   - `GET /api/recurring/:id`
   - `POST /api/recurring`
   - `PUT /api/recurring/:id`
   - `DELETE /api/recurring/:id`
3. Checkout UX improved from `prompt` to modal form.
4. Frontend modularization start:
   - `frontend/src/api.js`
   - `frontend/src/authStorage.js`
5. Regression test expansion:
   - lifecycle tests
   - recurring CRUD tests

### Sprint 2 Completed So Far
1. Recurring maintenance UI:
   - create/edit/pause/activate/delete
   - filtering and search
2. Recurring route/navigation wiring in app.
3. Dispatch and SLA risk visibility:
   - dashboard risk cards + risk board
   - schedule risk strip + per-job badges + calendar alerts
4. Configurable dispatch settings:
   - `GET /api/settings/dispatch`
   - `PUT /api/settings/dispatch`
   - persisted in `app_settings` table (with safe fallback behavior if table is missing)
5. Schedule dispatch settings editor:
   - max jobs per technician/day
   - SLA due-soon window (days)
6. Regression test expansion:
   - dispatch settings GET/PUT test
7. Interactive risk drill-down:
   - Dashboard risk board items now navigate to Jobs with focused filters
   - Schedule risk strip pills now navigate to Jobs with focused filters
   - Jobs page now supports URL drill-down filters (`riskType`, `technician`, `date`, `jobId`, `dueSoonDays`)
   - Jobs page shows active focus banner with clear action

### Sprint 3 Completed So Far
1. Customer communication workflow scaffolding:
   - Added job customer update send endpoint: `POST /api/jobs/:id/customer-update`
   - Added job customer update history endpoint: `GET /api/jobs/:id/customer-updates`
   - Added template-based update rendering (`eta_update`, `technician_enroute`, `work_started`, `work_completed`, `delay_notice`)
   - Added Jobs UI controls for sending customer updates (template/channel/ETA/custom override)
   - Added regression coverage for customer communication send + history flow
2. Completion proof flow (signature/evidence path):
   - Added completion proof endpoints: `POST /api/jobs/:id/completion-proof` and `GET /api/jobs/:id/completion-proof`
   - Added checkout integration to attach completion proof payload on job completion
   - Added Jobs checkout UI fields for signature name, evidence summary, and customer acceptance
   - Added Supabase schema scaffolding for `job_completion_proofs` table
   - Added regression coverage for completion proof persistence and retrieval
3. Technician mobile execution and closure ergonomics:
   - Added quick-close endpoint: `POST /api/jobs/:id/quick-close` (auto check-in + checkout for assigned technician)
   - Added technician-focused quick action panel in Jobs with compact mobile-friendly controls
   - Added quick filters (`Open`, `Check In`, `Check Out`, `Done`) for fast task targeting
   - Added one-tap `Quick Close` action alongside standard completion flow
   - Added regression coverage for quick-close lifecycle behavior

### Sprint 4 Completed So Far
1. Route/capacity optimization heuristics:
   - Added optimization endpoint: `GET /api/dispatch/optimize`
   - Added apply endpoint: `POST /api/dispatch/optimize/apply`
   - Implemented heuristic suggestions for:
     - unassigned job technician assignment balancing
     - overloaded technician/day reschedule recommendations
   - Added Schedule UI optimization panel with suggestion refresh + one-click apply
   - Added regression coverage for optimization suggest/apply flow
2. SLA and operational KPI dashboards:
   - Added KPI endpoint: `GET /api/dashboard/kpis`
   - Added SLA KPI metrics (overdue open, due soon, on-time completion rate, completion proof coverage)
   - Added operational KPI metrics (avg resolution hours, check-in compliance, quick-close trend, backlog aging)
   - Added Dashboard KPI card section for SLA and operational visibility
   - Added regression coverage for KPI payload contract
3. Inventory reservation/consumption intelligence:
   - Added job inventory intelligence endpoint: `GET /api/jobs/:id/inventory/intelligence`
   - Added inventory reservation endpoint: `POST /api/jobs/:id/inventory/reserve`
   - Added reservation consumption on `checkout` and `quick-close` flows
   - Added worklog-linked inventory hints (matched inventory + reservation sufficiency recommendations)
   - Added Jobs UI controls for per-job inventory reservation and intelligence summary
   - Added Supabase schema scaffolding for `job_inventory_reservations`
   - Added regression coverage for reserve + consume lifecycle

### Sprint 5 Completed So Far
1. UI consistency and design-system cleanup pass (phase 1):
   - Consolidated frontend API client usage on shared module (`frontend/src/api.js`) for:
     - `frontend/src/TeamPage.js`
     - `frontend/src/EquipmentPage.js`
     - `frontend/src/InventoryPage.js`
     - `frontend/src/QuotesPage.js`
   - Added shared UI utility classes and removed repeated inline style patterns:
     - `.stats-section`
     - `.inline-input-group`
     - line item layout utility classes for quote forms
   - Normalized warning stat-card styling to shared `.stat-card.pending` treatment on Equipment and Inventory pages
   - Replaced quote conversion `prompt` flow with modal-based date capture for stronger UX consistency
2. Accessibility and interaction QA pass (phase 1):
   - Added consistent keyboard focus-visible treatment for links, buttons, and form controls
   - Added accessibility labels to icon-only password visibility toggles (`show/hide password`)
   - Added accessibility labels and pressed/expanded states to topbar icon controls (dark mode and notifications)
   - Normalized modal close controls with explicit `type="button"` and `aria-label="Close dialog"` across major pages
   - Added search input labels on Team, Inventory, Equipment, Recurring, and Quotes pages
   - Added explicit per-row line-item field labels in Quotes forms for screen reader disambiguation
3. Accessibility and interaction QA pass (phase 2):
   - Added keyboard-state semantics (`aria-pressed`) for Schedule view toggles and Technician quick filter toggles
   - Added disclosure semantics (`aria-expanded`, `aria-controls`) for Jobs detail open/close controls
   - Added dialog semantics (`role="dialog"`, `aria-modal`, `aria-labelledby`) for Jobs create and checkout modals
   - Added Esc-key close behavior for Jobs create/checkout dialogs (while respecting in-flight checkout actions)
   - Added grouped risk-filter semantics and descriptive control labels on Schedule risk pills
   - Added descriptive labels for Jobs complex icon actions (inventory intelligence refresh, photo removal)
   - Added live-region semantics on Schedule and Jobs feedback banners for screen-reader announcement
4. E2E workflow hardening and broader test coverage (phase 1):
   - Expanded backend API regression suite from `11` to `14` passing tests
   - Added quote-to-job conversion E2E coverage:
     - convert blocked before accept
     - accept quote
     - convert accepted quote to job
     - verify quote `jobId` back-reference
   - Added lifecycle guardrail coverage:
     - checkout is rejected before check-in
   - Added dispatch optimization assignment coverage:
     - assign suggestion generation for unassigned scheduled jobs
     - apply assignment suggestion and verify status/assignee transition
5. E2E workflow hardening and broader test coverage (phase 2):
   - Added Playwright frontend-integrated E2E harness:
     - `playwright.config.js`
     - root scripts: `test:e2e`, `test:e2e:headed`
   - Added critical UI workflow specs:
     - jobs lifecycle checkout completion proof
     - quote create/accept/convert flow
     - recurring CRUD + schedule optimization apply
   - Added negative/error-path UI workflow specs:
     - dispatcher blocked from admin-only quote delete (UI error surfaced)
     - Jobs create dialog closes on Escape key
     - recurring delete cancel path preserves item
   - Verified test discovery (`3` tests listed)
   - Installed Playwright Chromium runtime and executed full suite successfully (`3/3` passing)
   - Expanded Playwright suite to `6` total tests (`6/6` passing)
6. CI hardening:
   - Added GitHub Actions workflow for API + Playwright execution:
     - `.github/workflows/ci-e2e.yml`
     - Runs on `windows-latest` to match current npm script environment
     - Executes backend API regression and frontend E2E suite in one pipeline
   - Added CI pipeline hardening controls:
     - workflow dispatch trigger
     - per-ref concurrency cancellation
     - job timeout guardrail
   - Added always-on Playwright artifact uploads in CI:
     - `playwright-report`
     - `test-results`
7. Release gate policy:
   - Added quality-gate documentation: `docs/QUALITY_GATES.md`
   - Defined required pre-merge checks (backend API regression, frontend build, frontend E2E)
   - Defined failure-handling policy for flaky/infra-incident scenarios
8. E2E hardening and sustained quality (phase 3):
   - Added outage simulation coverage in frontend E2E:
     - team technicians endpoint unreachable path surfaces UI error state
   - Added latency simulation coverage in frontend E2E:
     - delayed technicians endpoint keeps loading state visible then resolves
   - Increased Playwright suite depth from `6` to `8` tests
   - Added Playwright JSON reporter output:
     - `test-results/playwright-report.json`
   - Added flaky trend report generator:
     - `scripts/ci/flaky-trend-report.js`
     - `npm run test:e2e:flaky-report`
     - emits `test-results/flaky-trend.json` and `test-results/flaky-trend.md`
   - Wired flaky trend reporting into CI with always-on artifact upload:
     - `flaky-trend-report`
9. Roles/accounts hardening (phase 1):
   - Split staff/client authentication paths:
     - `/api/auth/login` now rejects `client` role accounts and directs to client portal login
     - `/api/client/login` remains the client entry path
   - Added user account lifecycle field support:
     - `users.account_status` (`active`, `disabled`, `locked`, `invited`)
     - staff login now blocks non-active accounts
   - Added password storage hardening with backward compatibility:
     - Added `bcryptjs` verification for hashed passwords
     - Legacy plaintext demo passwords auto-upgrade to bcrypt hash on successful login
   - Added regression coverage for auth path separation:
     - client-role account cannot authenticate via staff login route (`403`)
   - Added schema upgrade support:
     - `ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active'`
10. Roles/accounts governance (phase 2):
   - Added `manager` staff role in backend seed users and frontend demo account list.
   - Added permission-flag layer in backend:
     - `ROLE_PERMISSIONS` map and `requirePermission(...)` middleware
   - Applied permission middleware to sensitive routes:
     - dispatch settings update (`dispatch.manage`)
     - dispatch optimize suggest/apply (`dispatch.manage`)
     - exports (`exports.view`)
     - quote delete (`quotes.delete.any`)
   - Expanded role parity for manager across existing operational role checks (admin/dispatcher scopes now include manager for non-admin-only actions).
   - Added regression coverage:
     - manager can update dispatch settings
     - manager is still forbidden to delete quotes
11. Roles/accounts governance (phase 3):
   - Completed permission middleware migration for mutating backend endpoints:
     - replaced route-level `requireRoles(...)` guards with permission flags (`requirePermission(...)`)
     - covered core CRUD operations across customers, jobs, projects, tasks, technicians, inventory, equipment, quotes, recurring, invoices
   - Added account-admin lifecycle APIs (admin-only):
     - `GET /api/users`
     - `PATCH /api/users/:id/account-status`
   - Added enforced lifecycle state at request time:
     - non-active staff accounts (`disabled`, `locked`, `invited`) now invalidate active sessions and are blocked by `requireAuth`
   - Added session revocation on account-status changes to prevent stale elevated sessions after lock/disable.
   - Expanded regression coverage:
     - manager is forbidden from account-admin APIs
     - admin can disable/reactivate technician account
     - disabled technician cannot authenticate
12. Roles/accounts governance (phase 4):
   - Added frontend permission map (`hasFrontendPermission`) to align route/component gating with backend permission model.
   - Added admin-only account management page in frontend:
     - route: `/users`
     - lists users via `GET /api/users`
     - updates account lifecycle status via `PATCH /api/users/:id/account-status`
   - Added Users navigation entry visibility for account administrators only.
   - Updated frontend role gates to use permission checks for key surfaces:
     - dispatch settings/editor access
     - job management controls
     - back-office navigation grouping
13. Roles/accounts governance (phase 5):
   - Added granular frontend action-level permission gating:
     - admin-only job delete action visibility in Jobs page
     - admin-only quote delete action visibility in Quotes page
     - export action/page visibility now controlled by explicit `exports.view` permission
   - Added quote-action permission alignment in UI:
     - create/edit/accept/reject/convert quote controls hidden for non-quote-manage roles
   - Added account lifecycle-focused activity filtering in Activity page:
     - new `Accounts` filter for `account_status` lifecycle events
     - account activity icon mapping for improved audit scanning
   - Added frontend access guardrails for Activity and Export pages when permission is missing (clear empty-state messaging).

## Validation Status

1. Frontend build passes (2026-03-06) after Sprint 5 phase-2 accessibility work.
2. Backend API regression tests pass (`17/17`, 2026-03-06) after roles/accounts governance phase 3.
3. Frontend build passes (2026-03-06) after roles/accounts governance phase 4 (permission-map + users admin page).
4. Frontend build and backend API regression pass after roles/accounts governance phase 5 (`17/17` API, 2026-03-06).
3. Runtime startup check passes with healthy ports and route validation (`start-app.ps1`, 2026-03-06):
   - `GET /api/status` responds
   - `GET /api/settings/dispatch` responds after auth
4. Frontend E2E harness discovery passes (`npm run test:e2e -- --list`, 2026-03-06) with `6` specs.
5. Frontend E2E full run passes (`npm run test:e2e`, `6/6`, 2026-03-06).
6. Frontend E2E full run remains green after CI/reporting hardening (`npm run test:e2e`, `6/6`, 2026-03-06).
7. Frontend E2E resilience simulation coverage passes (`npm run test:e2e`, `8/8`, 2026-03-06).
8. Flaky trend report generation passes (`npm run test:e2e:flaky-report`, 2026-03-06).

## Current Status Summary

1. Sprint 1 is complete.
2. Sprint 2 core items are implemented, including risk drill-down actions.
3. Sprint 3 items 1-3 are implemented (customer communication + completion proof + technician mobile ergonomics).
4. Sprint 4 items 1-3 are implemented (optimization heuristics + KPI dashboards + inventory intelligence).
5. App startup reliability improved by hardening launcher script to clear stale port listeners and verify critical backend routes.
6. Sprint 5 item 1 has started and phase 1 is complete (API/client consolidation + shared UI pattern cleanup + modal conversion flow).
7. Sprint 5 item 2 has started and phase 1 is complete (focus visibility, labels, modal semantics, icon-control accessibility states).
8. Sprint 5 item 2 phase 2 is complete (Jobs/Schedule keyboard and screen-reader semantic hardening).
9. Sprint 5 item 3 has started and phase 1 is complete (critical backend E2E coverage expanded and passing).
10. Sprint 5 item 3 phase 2 is complete (frontend-integrated E2E harness + execution passing).
11. Sprint 5 item 3 (E2E hardening) is complete for initial critical-path scope.
12. Sprint 5 hardening follow-up is complete for initial CI + negative-path scope (workflow + expanded E2E depth).
13. Sprint 5 hardening follow-up now includes CI artifact capture and explicit release-gate policy.
14. Sprint 5 sustained quality follow-up now includes outage/latency E2E simulation coverage and flaky trend reporting.
15. Sprint 5 sustained quality follow-up now includes roles/accounts hardening phase 1 (staff/client auth split + account status + password hashing upgrade path).
16. Roles/accounts governance phase 2 is complete (`manager` role + permission middleware on sensitive operations).
17. Roles/accounts governance phase 3 is complete (full mutating-route permission migration + account lifecycle APIs + session invalidation for non-active accounts).
18. Roles/accounts governance phase 4 is complete (frontend admin user-management UI + permission-aligned visibility gates).
19. Roles/accounts governance phase 5 is complete (granular frontend permission gating + account lifecycle activity filtering).
20. Next value is role governance phase 6: expose backend permission catalog via API and drive frontend permissions dynamically from server-provided capabilities.

## Suggested Next Task

1. Implement roles/accounts phase 6: add server-driven permission capability payload and consume it in frontend for dynamic access control.
