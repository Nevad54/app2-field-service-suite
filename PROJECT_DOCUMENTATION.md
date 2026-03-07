# Field Service Suite Project Documentation

## 1. Scope

Field Service Suite is an operations platform for service teams to plan, dispatch, execute, and close work with capability-based authorization and customer portal support.

## 2. Current Baseline (2026-03-08)

- Sprint 1 through Sprint 5 planned scope is implemented.
- Roles/accounts governance phases 1 through 10 are implemented.
- Next planned increment is phase 11 (remaining disabled-with-reason UX alignment and capability payload contract checks).

Reference: `ROADMAP_AND_PROGRESS.md`

## 3. Architecture

- Frontend: React 18 app (`frontend/`)
- Backend: Express API in Supabase-oriented runtime (`backend/server-supabase.js`)
- Root orchestration: `npm run dev` (frontend + backend)
- Startup helper: `start-app.ps1`

## 4. Auth and Authorization Model

- Staff auth endpoint: `POST /api/auth/login`
- Client auth endpoint: `POST /api/client/login`
- Auth context endpoint: `GET /api/auth/me`
- Capability endpoint: `GET /api/auth/capabilities`
- Backend access control: permission middleware (`requirePermission(...)`)
- Frontend access control: capability-based route and action gating
- Account lifecycle enforcement: `active`, `disabled`, `locked`, `invited`

## 5. Core Functional Areas

- Jobs, check-in/check-out, quick-close, completion proof
- Dispatch settings and optimization recommendations
- Dashboard KPIs and deadline risk visibility
- Recurring maintenance management
- Inventory reservation and consumption on completion
- Quotes lifecycle and quote-to-job conversion
- Customer, invoice, activity, team, equipment, project, and planner management
- Customer portal for scoped jobs/invoices access

## 6. Local Development

Install:

```bash
npm run install:all
```

Run:

```bash
npm run dev
```

or:

```powershell
.\start-app.ps1
```

Endpoints:

- Frontend: `http://localhost:3001`
- Backend: `http://localhost:3002`
- Status: `http://localhost:3002/api/status`

## 7. Testing and Release Gates

- Frontend build: `npm run build`
- Backend API regression: `npm run test:api`
- Frontend E2E: `npm run test:e2e`
- Headed E2E: `npm run test:e2e:headed`
- Flaky trend report: `npm run test:e2e:flaky-report`

CI workflow:

- `.github/workflows/ci-e2e.yml`

Release gate policy:

- `docs/QUALITY_GATES.md`

## 8. Demo Credentials

Staff login (`/login`):

- `admin / 1111`
- `manager / 1111`
- `dispatcher / 1111`
- `technician / 1111`

Client login (`/client-login`):

- `contact@acme.com / client`
