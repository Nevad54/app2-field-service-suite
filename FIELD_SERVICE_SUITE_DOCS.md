# Field Service Suite - Complete Documentation

## Project Structure
app2-field-service-suite/
├── backend/           # Express.js API (Port 3002)
│   └── server.js     # API routes, middleware, in-memory data
├── frontend/         # React 18 App (Port 3001)
│   ├── src/
│   │   ├── App.js           # Main app with routing & auth
│   │   ├── styles.css       # CSS (light/dark theme)
│   │   ├── ProjectsPage.js  # Projects & tasks CRUD
│   │   └── ProjectPlanner.js # Spreadsheet-style planner
│   └── public/index.html
└── docs/


## How It Works
- **Frontend**: React 18 with React Router for navigation
- **Backend**: Express.js REST API
- **Data**: In-memory storage (demo mode)
- **Auth**: JWT tokens in localStorage

## 4 User Roles
| Role | Access |
|------|--------|
| Admin | Full access |
| Dispatcher | Schedule jobs, manage technicians |
| Technician | View/update assigned jobs |
| Client | View own jobs via portal |

## Main Routes
- /login - Authentication
- /dashboard - Stats overview
- /jobs - Work orders
- /schedule - Calendar view
- /customers - Customer database
- /invoices - Invoice tracking
- /activity - Activity log
- /projects - Project management
- /project-planner - Task timeline/spreadsheet
- /client-portal - Client self-service

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | User login |
| GET | /api/auth/me | Get current user |
| POST | /api/auth/logout | User logout |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/dashboard/summary | Get dashboard statistics |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/jobs | List all jobs |
| POST | /api/jobs | Create new job |
| PUT | /api/jobs/:id | Update job |
| PATCH | /api/jobs/:id/status | Update job status |

### Customers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/customers | List customers |
| POST | /api/customers | Create customer |
| PUT | /api/customers/:id | Update customer |
| DELETE | /api/customers/:id | Delete customer |

### Invoices
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/invoices | List invoices |
| POST | /api/invoices | Create invoice |
| PUT | /api/invoices/:id | Update invoice |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects | List projects |
| POST | /api/projects | Create project |
| PUT | /api/projects/:id | Update project |
| DELETE | /api/projects/:id | Delete project |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects/:id/tasks | List project tasks |
| POST | /api/projects/:id/tasks | Create task |
| PUT | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task |

## Demo Accounts
| Username | Password | Role |
|----------|----------|------|
| admin | 1111 | Admin |
| dispatcher | 1111 | Dispatcher |
| technician | 1111 | Technician |
| client | 1111 | Client |

## Running the Application

### Installation
bash
npm run install:all


### Start Development
bash
npm run dev


Or separately:
bash
# Terminal 1 - Backend
cd backend && node server.js

# Terminal 2 - Frontend
cd frontend && npm start


### Access Points
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3002/api/status

## Technology Stack
| Layer | Technology |
|-------|------------|
| Frontend | React 18, React Router 6 |
| Styling | CSS3 with Variables |
| Backend | Express.js |
| Auth | JWT (JSON Web Tokens) |
| Data | In-memory (demo) |

## UI Changes Made
- Updated ProjectPlanner.js with datetime-local inputs for task scheduling
- Added plannedStart and plannedEnd fields for precise scheduling
- App is running successfully at http://localhost:3001
