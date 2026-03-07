# Field Service Suite

Field teams lose time and revenue when dispatch, technician updates, customer communication, and billing are split across spreadsheets, chat threads, and disconnected tools.

Field Service Suite solves that by putting the full service lifecycle in one platform: schedule work, execute in the field, track proof/completion, manage quotes/invoices, and enforce role-based operations safely.

Live app: https://fieldservice-suite.netlify.app/

Try it now: sign in as `admin / 1111` or `manager / 1111` at `/login`.

## The Problem

- Jobs get delayed because dispatch and technician execution are not connected.
- Managers lack real-time risk visibility for overdue and due-soon work.
- Teams miss accountability when check-in/checkout and completion proof are inconsistent.
- Back-office handoff breaks when quotes, inventory, and invoices live in separate systems.

## The Solution

- One workflow from job creation to completion and billing.
- Built-in dispatch controls, deadline-risk views, and optimization suggestions.
- Field-ready execution with check-in/checkout, worklogs, photos, and completion proof.
- Capability-based access model so each role sees the right actions with clear guardrails.

## Who It's For

- HVAC, electrical, plumbing, and general field service businesses.
- Dispatch-heavy teams coordinating multiple technicians daily.
- Operations managers who need deadline-risk visibility and tighter execution control.
- Service organizations moving from spreadsheet/manual workflows to one system.

## Business Outcomes

- Faster dispatch-to-completion cycle time.
- Better on-time performance with due-soon and overdue risk visibility.
- Stronger accountability through check-in/check-out and completion evidence.
- Cleaner handoffs between field teams and back office (quotes, inventory, invoices).
- Lower permission and access risk with capability-based controls.

## Current Status

As of 2026-03-08:

- Sprint 1 to Sprint 5 planned scope is implemented.
- Roles/accounts governance phases 1 to 10 are implemented.
- Current next task is roles/accounts phase 11 (remaining action-level authorization UX alignment + capability payload contract checks).

Source of truth: [ROADMAP_AND_PROGRESS.md](./ROADMAP_AND_PROGRESS.md)

## What You Can Do

- Dispatch + job lifecycle: create, assign, check-in, checkout, quick-close.
- Recurring maintenance: create/edit/pause/activate/delete, schedule visibility.
- Deadline risk operations: dashboard risk board, schedule risk strip, drill-down links.
- Dispatch controls: settings persistence, optimization suggestions, one-click apply.
- Technician execution: mobile-friendly quick actions, worklogs, completion proof capture.
- Inventory intelligence: reservation + consume at checkout/quick-close.
- Quotes + conversion: quote flow with conversion guardrails and job back-reference.
- Project planning: project/task management with planner views.
- Exports, activity logs, invoices, customers, team, equipment management.
- Customer portal: separate login flow and scoped customer data access.

## Roles and Permissions

- Roles: `admin`, `manager`, `dispatcher`, `technician`, `client`.
- Staff login is separated from client login:
  - Staff: `POST /api/auth/login`
  - Client: `POST /api/client/login`
- Backend is permission-driven (`requirePermission(...)`) with frontend capability-aware route/action gating.
- Account lifecycle statuses are enforced (`active`, `disabled`, `locked`, `invited`), including session invalidation for non-active accounts.

## Tech Stack

- Frontend: React 18, React Router 6, custom CSS.
- Backend: Node.js, Express.
- Data layer: Supabase PostgreSQL support with fallback behavior in supported flows.
- Auth: token-based API auth with server-driven permission payloads.
- Testing: Node test runner for API regression + Playwright for E2E.

## Quick Start

### Prerequisites

- Node.js 18+ (Node 20 is used in CI).
- npm.
- Windows PowerShell (for helper scripts in this repo).

### Install

```bash
npm run install:all
```

### Run (recommended)

```powershell
.\start-app.ps1
```

This starts:

- Frontend: `http://localhost:3001`
- Backend: `http://localhost:3002`
- Backend status: `http://localhost:3002/api/status`

### Run (manual)

```bash
# from repo root
npm run dev
```

or run each app separately:

```bash
cd backend
npm run start

cd ../frontend
npm start
```

## Demo Accounts

Staff login (`/login`):

- `admin / 1111`
- `manager / 1111`
- `dispatcher / 1111`
- `technician / 1111`

Client portal login (`/client-login`):

- `contact@acme.com / client`

## Testing and Quality Gates

### Local Commands

```bash
# frontend build
npm run build

# backend API regression
npm run test:api

# frontend E2E
npm run test:e2e

# headed E2E
npm run test:e2e:headed

# flaky trend report
npm run test:e2e:flaky-report
```

### CI

- Workflow: [ci-e2e.yml](./.github/workflows/ci-e2e.yml)
- Runs on push/PR/manual dispatch.
- Executes API regression + Playwright E2E.
- Uploads `playwright-report`, `test-results`, and flaky trend artifacts.

Quality policy details: [docs/QUALITY_GATES.md](./docs/QUALITY_GATES.md)

## Supabase Setup (Optional)

For persistent backend storage:

1. Create a Supabase project.
2. Apply schema from `backend/supabase-schema-complete.sql` (or upgrade script when applicable).
3. Add `backend/.env.supabase` with:

```env
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_STORAGE_BUCKET=job-photos
SUPABASE_SIGNED_URL_TTL=3600
```

4. Start backend with `npm run start` in `backend/`.

## Repository Layout

```text
app2-field-service-suite/
|- backend/                    # API server and regression tests
|- frontend/                   # React application
|- docs/                       # quality gates and documentation
|- scripts/                    # CI/report utilities
|- tests/                      # Playwright E2E specs
|- .github/workflows/          # CI pipelines
|- ROADMAP_AND_PROGRESS.md     # delivery roadmap and progress log
|- start-app.ps1               # local startup helper (Windows)
```

## Additional Documentation

- [ROADMAP_AND_PROGRESS.md](./ROADMAP_AND_PROGRESS.md)
- [docs/QUALITY_GATES.md](./docs/QUALITY_GATES.md)
- [DEPLOYMENT.md](./DEPLOYMENT.md)
- [USER_MANUAL.md](./USER_MANUAL.md)

## License

Educational and demonstration use.
