# Team/Technician Management Feature Plan

## Overview
Add a comprehensive team management system with skills, availability, and workload tracking that integrates with the existing planner and job assignment system.

## Features to Implement

### 1. Backend (server.js)
- [ ] **Technicians Data Model**
  - id, name, email, phone, role
  - skills (array of skill names)
  - hourly_rate, certifications
  - availability (working hours per day)
  - status (active, on_leave, unavailable)
  - avatar/color for identification

- [ ] **API Endpoints**
  - GET /api/technicians - List all technicians
  - POST /api/technicians - Create technician
  - PUT /api/technicians/:id - Update technician
  - DELETE /api/technicians/:id - Delete technician
  - PATCH /api/technicians/:id/availability - Update availability
  - GET /api/technicians/:id/workload - Get assigned jobs/tasks
  - GET /api/technicians/available?date=YYYY-MM-DD - Find available technicians

- [ ] **Smart Assignment Logic**
  - Filter by skill match
  - Check availability on date
  - Calculate workload (hours assigned)
  - Suggest best technician

### 2. Frontend (App.js + new component)
- [ ] **Team Page**
  - Grid view of all technicians
  - Skill tags display
  - Workload indicator (percentage bar)
  - Status badges (active, on_leave, unavailable)

- [ ] **Technician Detail Modal**
  - Full profile view
  - Skills management (add/remove)
  - Weekly availability calendar
  - Current assignments list

- [ ] **Integration with Jobs**
  - Assign technician to job
  - Show skill match indicators
  - Availability check before assignment

- [ ] **Integration with Planner**
  - Show technician workload in timeline
  - Filter tasks by technician
  - Smart assignment suggestions

### 3. Data Model
```
javascript
{
  id: 'tech-1',
  name: 'John Smith',
  email: 'john@example.com',
  phone: '555-1234',
  role: 'technician',
  skills: ['HVAC', 'Electrical', 'Plumbing'],
  hourly_rate: 75,
  certifications: ['EPA 608', 'OSHA 10'],
  availability: {
    monday: { start: '08:00', end: '17:00' },
    tuesday: { start: '08:00', end: '17:00' },
    wednesday: { start: '08:00', end: '17:00' },
    thursday: { start: '08:00', end: '17:00' },
    friday: { start: '08:00', end: '17:00' },
    saturday: null,
    sunday: null
  },
  status: 'active',
  color: '#0ea5e9',
  hire_date: '2023-01-15',
  notes: ''
}
```

## Implementation Order
1. Add technicians data to backend
2. Create API endpoints
3. Add team route to frontend
4. Create TeamPage component
5. Integrate with Jobs (assign dropdown)
6. Integrate with Planner (workload view)
7. Add smart assignment suggestions

## Example Data
- 5 sample technicians with different skills
- Various availability patterns
- Different workload levels
