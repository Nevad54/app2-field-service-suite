# Field Service Suite - Complete Project Documentation

## 1. Project Structure

```text
app2-field-service-suite/
+-- backend/                     # Express.js API (port 3002)
|   +-- package.json
|   +-- package-lock.json
|   \-- server.js               # Auth, jobs, projects, planner, attendance APIs
+-- frontend/                    # React 18 app (port 3001)
|   +-- package.json
|   +-- public/
|   |   \-- index.html
|   \-- src/
|       +-- App.js              # Routing, auth state, role-based UI
|       +-- styles.css          # Theme + planner timeline styles
|       +-- ProjectsPage.js     # Project + task management
|       \-- ProjectPlanner.js   # Time-based hourly planner + attendance controls
+-- FIELD_SERVICE_SUITE_DOCS.md
+-- PROJECT_DOCUMENTATION.md
\-- docs/
```

## 2. Architecture

- Frontend: React 18 with React Router 6.
- Backend: Express.js REST API.
- Data: In-memory collections (demo mode fallback).
- Auth: bearer token session model (`/api/auth/login` returns token, stored in `localStorage`).
- Scheduling model: centralized planner where tasks belong to projects.

## 3. User Roles

| Role | Access |
|------|--------|
| Admin | Full access, schedule + attendance control |
| Dispatcher | Schedule + attendance control |
| Technician | View tasks, attendance actions on assigned tasks |
| Client | Read-only client portal (own jobs + invoices) |

## 4. Main Frontend Routes

- `/login`
- `/dashboard`
- `/jobs`
- `/schedule`
- `/customers`
- `/invoices`
- `/activity`
- `/projects`
- `/project-planner`
- `/project-planner/:projectId`
- `/client-portal`

## 5. Planner Task Model

```js
{
  id: string,
  projectId: string,
  name: string,
  assignedUserId: string,

  plannedStart: ISODateString,
  plannedEnd: ISODateString,

  actualStart: ISODateString | null,
  actualEnd: ISODateString | null,

  status: "scheduled" | "in_progress" | "paused" | "completed",

  // returned in enhanced API payloads
  plannedDurationHours: number,
  actualDurationHours: number,
  varianceHours: number | null
}
```

## 6. API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login and return token + user |
| GET | `/api/auth/me` | Resolve current user from token |
| POST | `/api/auth/logout` | Logout current token |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/summary` | Dashboard stats |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs` | List jobs |
| POST | `/api/jobs` | Create job |
| PUT | `/api/jobs/:id` | Update job |
| PATCH | `/api/jobs/:id/status` | Update job status |
| POST | `/api/jobs/:id/checkin` | Technician check-in |
| POST | `/api/jobs/:id/checkout` | Technician check-out |
| PATCH | `/api/jobs/:id/notes` | Update notes |
| POST | `/api/jobs/:id/photos` | Add photo |
| DELETE | `/api/jobs/:id/photos` | Remove photo |

### Customers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers` | List customers |
| POST | `/api/customers` | Create customer |
| PUT | `/api/customers/:id` | Update customer |
| DELETE | `/api/customers/:id` | Delete customer |

### Invoices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/invoices` | List invoices |
| POST | `/api/invoices` | Create invoice |
| PATCH | `/api/invoices/:id/status` | Update invoice status |
| GET | `/api/invoices/:id/pdf` | Generate invoice PDF |

### Projects and Planner
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| GET | `/api/projects/:projectId/tasks` | List enhanced project tasks |
| GET | `/api/projects/:projectId/timeline` | Timeline payload + window |
| POST | `/api/projects/:projectId/tasks` | Create task with planned range |
| PUT | `/api/tasks/:id` | Update task |
| PATCH | `/api/tasks/:id/dates` | Update task planned range |
| PATCH | `/api/tasks/:id/progress` | Update task progress |
| DELETE | `/api/tasks/:id` | Delete task |
| GET | `/api/tasks/:id/activity` | Task activity log |

### Attendance Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tasks/:id/start` | Set `actualStart=now`, status `in_progress` |
| POST | `/api/tasks/:id/pause` | Set status `paused` |
| POST | `/api/tasks/:id/resume` | Set status `in_progress` |
| POST | `/api/tasks/:id/finish` | Set `actualEnd=now`, status `completed` |

## 7. Validation and Access Rules

- `plannedStart` and `plannedEnd` are required for planner tasks.
- `plannedStart` must be before `plannedEnd`.
- Attendance updates are allowed only for:
  - `admin` or `dispatcher`, or
  - assigned technician (`assignedUserId` match).
- Soft warning is attached when `actualStart` is earlier than `plannedStart`.

## 8. Planner UX Behavior

- Excel-like horizontal hourly timeline (`HOUR_WIDTH` fixed unit).
- Timeline covers past + future and auto-expands near scroll edges.
- Current time vertical indicator line.
- Task bars positioned by planned time and width.
- Visual states: scheduled, in-progress, paused, completed.
- Per-task attendance buttons by status:
  - scheduled: Start
  - in_progress: Pause, Finish
  - paused: Resume, Finish
  - completed: read-only
- Optimistic UI updates with rollback on API failure.

## 9. Demo Accounts

| Username | Password | Role |
|----------|----------|------|
| admin | 1111 | Admin |
| dispatcher | 1111 | Dispatcher |
| technician | 1111 | Technician |
| client | 1111 | Client |

## 10. Running the App

### Install
```bash
npm run install:all
```

### Start
```bash
npm run dev
```

Or separately:
```bash
# Terminal 1
cd backend && node server.js

# Terminal 2
cd frontend && npm start
```

### Access
- Frontend: `http://localhost:3001`
- Backend status: `http://localhost:3002/api/status`

## 11. Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, React Router 6 |
| Styling | CSS variables + custom timeline styles |
| Backend | Express.js |
| Auth | Bearer token session model |
| Data | In-memory fallback |
