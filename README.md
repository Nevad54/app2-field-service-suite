# App 2 - Field Service Suite

A full-stack field service management app for scheduling jobs, dispatching technicians, tracking work orders, and generating service reports.

## Quick Start

1. Install dependencies:

```bash
npm run install:all
```

2. Start frontend + backend:

```bash
npm run dev
```

- Frontend: `http://localhost:3001`
- Backend: `http://localhost:3002/api/status`

## Routes (Sprint 2)

- `/`
- `/login`
- `/dashboard`
- `/jobs`

## Backend APIs (Sprint 2)

- `GET /api/status`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/dashboard/summary` (auth required)
- `GET /api/jobs` (auth required)

## Demo Accounts

- `admin` / `1111`
- `dispatcher` / `1111`
- `technician` / `1111`
- `client` / `1111`

## Planned Core Features

- Role-based auth (`admin`, `dispatcher`, `technician`, `client`)
- Job scheduling calendar
- Work order lifecycle (new -> assigned -> in-progress -> completed)
- Technician mobile-friendly dashboard
- Client portal for job status and service history
- Report exports (PDF/CSV)

## Status

- [x] Repository initialized
- [x] Frontend scaffold
- [x] Backend scaffold
- [x] Sprint 2 auth + protected routes MVP
- [ ] First release (`v0.1.0`)
