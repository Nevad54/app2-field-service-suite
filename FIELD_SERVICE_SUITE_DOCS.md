# Field Service Suite Documentation Snapshot

This file is a compact product and API snapshot aligned with the current implementation.

For active delivery history and validation logs, use [ROADMAP_AND_PROGRESS.md](./ROADMAP_AND_PROGRESS.md).
For setup and day-to-day commands, use [README.md](./README.md).

## Product Summary

Field Service Suite is a React + Express platform for field operations with:

- job lifecycle execution (check-in, checkout, quick-close)
- dispatch planning, optimization, and deadline-risk visibility
- recurring maintenance workflows
- quotes, invoices, customers, projects, and planner workflows
- inventory reservation/consumption support linked to jobs
- staff and customer portal auth separation
- role/capability-based access controls with account lifecycle enforcement

## Runtime Overview

- Frontend: `http://localhost:3001`
- Backend: `http://localhost:3002`
- Health check: `GET /api/status`
- Backend entry: `backend/server-supabase.js`

## Authentication and Roles

- Staff login: `POST /api/auth/login`
- Client login: `POST /api/client/login`
- Auth profile: `GET /api/auth/me`
- Capability payload: `GET /api/auth/capabilities`

Roles:

- `admin`
- `manager`
- `dispatcher`
- `technician`
- `client`

Account statuses:

- `active`
- `disabled`
- `locked`
- `invited`

## Key API Areas

- Auth and capabilities: `/api/auth/*`, `/api/client/*`
- Jobs and execution: `/api/jobs/*`
- Schedule and dispatch: `/api/schedule`, `/api/settings/dispatch`, `/api/dispatch/optimize*`
- Dashboard metrics: `/api/dashboard/*`
- Recurring maintenance: `/api/recurring*`
- Projects/planner/tasks: `/api/projects*`, `/api/tasks*`
- Quotes and conversion: `/api/quotes*`
- Inventory and equipment: `/api/inventory*`, `/api/equipment*`
- Team and user administration: `/api/technicians*`, `/api/users*`

## Demo Credentials

Staff login (`/login`):

- `admin / 1111`
- `manager / 1111`
- `dispatcher / 1111`
- `technician / 1111`

Client login (`/client-login`):

- `contact@acme.com / client`

## Validation and CI

- Backend API regression: `npm run test:api`
- Frontend E2E: `npm run test:e2e`
- Frontend build: `npm run build`
- CI pipeline: `.github/workflows/ci-e2e.yml`
- Quality policy: `docs/QUALITY_GATES.md`
