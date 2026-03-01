# 🚀 Field Service Suite

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-screenshots">Screenshots</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-api-documentation">API</a> •
  <a href="#-demo-accounts">Demo Accounts</a>
</p>

---

## 📋 Overview

**Field Service Suite** is a comprehensive field service management application built with React and Node.js. It provides complete control over jobs, customers, projects, scheduling, invoicing, and team management — all in one powerful platform.

Perfect for HVAC companies, construction crews, maintenance teams, and any field service organization looking to digitize their operations.

![Field Service Dashboard](https://via.placeholder.com/800x400?text=Field+Service+Suite+Dashboard)

---

## ✨ Features

### 🏠 Dashboard
- Real-time overview of all operations
- Job status counts (New, Assigned, In Progress, Completed)
- Revenue tracking (Paid vs Pending Invoices)
- Customer metrics
- Recent activity feed

### 📋 Job Management
- Create, assign, and track service jobs
- Priority levels (Low, Medium, High, Urgent)
- Job categories (Maintenance, Repair, Installation, Inspection, etc.)
- Mobile-friendly check-in/checkout system
- Technician notes and work logging
- Photo documentation for each job
- Parts and materials tracking

### 👥 Customer Management
- Full customer database with contact details
- Customer-specific job history
- Location management
- Account-based pricing

### 📅 Scheduling
- Visual calendar view
- Drag-and-drop job scheduling
- Technician assignment
- Date-based filtering

### 💰 Invoicing
- Automatic invoice generation from jobs
- Multiple status tracking (Pending, Paid)
- Payment tracking
- Customer invoice portal

### 📊 Project Planning (NEW!)
Spreadsheet-based project scheduler with Excel-like functionality:

- **Table View** - Edit tasks like a spreadsheet
- **Timeline View** - Gantt chart visualization
- **Calendar View** - Monthly overview
- **Automatic Calculations:**
  - Duration = End Date − Start Date
  - Status auto-updates based on progress and dates
  - Weighted progress tracking
  - Overall project progress calculation

### 👨‍💼 Role-Based Access
- **Admin** - Full system access
- **Dispatcher** - Schedule and job management
- **Technician** - View and update assigned jobs
- **Client** - Read-only customer portal

### 📱 Client Portal
- View your jobs and service history
- Access and pay invoices
- Request new service

---

## 🖥 Screenshots

### Dashboard
```
┌─────────────────────────────────────────────────────────────┐
│  🏠 Dashboard                              Admin ▼         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│  │   12    │ │    3    │ │    5    │ │    8    │        │
│  │  Total  │ │  New    │ │ In Prog  │ │Complete │        │
│  │  Jobs   │ │  Jobs   │ │  Jobs    │ │  Jobs   │        │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
│                                                             │
│  💰 Revenue: $12,450 paid │ $2,100 pending               │
│  👥 8 Customers │ 📄 6 Invoices                            │
└─────────────────────────────────────────────────────────────┘
```

### Project Planner - Spreadsheet View
```
┌────────────────────────────────────────────────────────────────────┐
│  📊 Project Planner                              [+ Add Task]     │
├────────────────────────────────────────────────────────────────────┤
│  Task/Phase        │ Start    │ End      │ Dur │ Wt │ Prog │ Contrib │
│  ──────────────────┼──────────┼──────────┼─────┼─────┼──────┼────────│
│  Phase 1: Design   │ 01/15    │ 02/15    │ 32d │ 10  │ 100% │ 10.00  │
│  ↳ Architectural   │ 01/15    │ 01/30    │ 16d │  1  │ 100% │  1.00  │
│  ↳ Structural     │ 02/01    │ 02/15    │ 15d │  1  │ 100% │  1.00  │
│  Phase 2: HVAC    │ 02/16    │ 04/30    │ 74d │ 10  │ 45%  │  4.50  │
│  Phase 3: Electric│ 03/01    │ 05/31    │ 92d │ 20  │ 20%  │  4.00  │
└────────────────────────────────────────────────────────────────────┘
```

### Project Planner - Timeline View
```
┌────────────────────────────────────────────────────────────────────┐
│  📊 Timeline View  [Weekly] [Daily] [Hourly]                      │
├────────────────────────────────────────────────────────────────────┤
│        Jan   Feb   Mar   Apr   May   Jun   Jul   Aug              │
│        ────  ───   ───   ───   ───   ───   ───   ───            │
│  Phase1 ████████████████████████████████████ (100%)                │
│  HVAC   ░░░░░░░░████████████████░░░░░░░░░░░░░░ (45%)            │
│  Electr ░░░░░░░░░░░░░░░░░████████████████░░░░░░░░░░ (20%)         │
│  Plum   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ (0%)         │
└────────────────────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | React 18, React Router 6 |
| **Styling** | CSS Variables, Custom CSS |
| **Backend** | Node.js, Express.js |
| **Authentication** | Bearer Token (JWT-style) |
| **Data Storage** | In-Memory (Demo Mode) |
| **API Style** | RESTful |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```
bash
# Clone the repository
git clone https://github.com/Nevad54/app2-field-service-suite.git
cd app2-field-service-suite

# Install all dependencies
npm run install:all

# Or install separately
cd backend && npm install
cd ../frontend && npm install
```

### Running the Application

```
bash
# Start both frontend and backend
npm run dev

# Or run separately:
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend
cd frontend && npm start
```

### Access the Application
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3002/api/status

---

## 📖 API Documentation

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login and get token |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs` | List all jobs |
| POST | `/api/jobs` | Create new job |
| PUT | `/api/jobs/:id` | Update job |
| PATCH | `/api/jobs/:id/status` | Update job status |
| POST | `/api/jobs/:id/checkin` | Check in to job |
| POST | `/api/jobs/:id/checkout` | Complete job |
| POST | `/api/jobs/:id/photos` | Upload job photo |

### Projects & Planner
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id/tasks` | Get project tasks |
| GET | `/api/projects/:id/planner` | Get planner data |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| PATCH | `/api/tasks/:id/progress` | Update progress |
| PATCH | `/api/tasks/:id/dates` | Update dates |

### Other Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers` | List customers |
| GET | `/api/invoices` | List invoices |
| GET | `/api/schedule` | Get schedule |
| GET | `/api/dashboard/summary` | Dashboard stats |
| GET | `/api/activity` | Activity logs |

---

## 👤 Demo Accounts

| Username | Password | Role | Access Level |
|----------|----------|------|--------------|
| admin | 1111 | Admin | Full system access |
| dispatcher | 1111 | Dispatcher | Schedule & job management |
| technician | 1111 | Technician | View/update assigned jobs |
| client | 1111 | Client | Customer portal only |

---

## 📁 Project Structure

```
app2-field-service-suite/
├── backend/                    # Express.js API Server
│   ├── server.js              # Main server file
│   ├── package.json
│   └── uploads/               # File uploads
├── frontend/                   # React 18 Application
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js            # Main app component
│   │   ├── ProjectPlanner.js  # Project planning module
│   │   ├── ProjectsPage.js    # Projects management
│   │   └── styles.css         # Global styles
│   └── package.json
├── docs/                       # Documentation
├── FIELD_SERVICE_SUITE_DOCS.md
└── PROJECT_DOCUMENTATION.md
```

---

## 🔧 Key Features Explained

### Project Planner Calculations

**Duration:**
```
javascript
Duration = End Date - Start Date (in days)
```

**Status Auto-Calculation:**
```
javascript
if (progress === 0) return 'not_started'
if (progress === 100) return 'completed'
if (endDate < today && progress < 100) return 'delayed'
return 'in_progress'
```

**Weighted Progress:**
```
javascript
Task Contribution = (Progress % × Weight) / 100
Project Overall = Sum(Contributions) / Sum(Weights)
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is available for educational and demonstration purposes.

---

## 👨‍💻 Author

**Carl Daven Quimoyog**  
Full-Stack Web Systems Developer • AI Automation Builder

- GitHub: [@Nevad54](https://github.com/Nevad54)
- LinkedIn: [carl-daven](https://linkedin.com/in/carl-daven)

---

## ⭐ Show Your Support

If you find this project useful, please give it a star on GitHub!

---

<p align="center">
  Built with ❤️ using React + Node.js
</p>
