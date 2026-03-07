# Field Service Suite User Manual

This manual is for daily users of the app: Admin, Manager, Dispatcher, Technician, and Client.

## 1. Accessing the App

1. Open your app URL in a browser.
2. For staff, go to `Login`.
3. For customers, go to `Client Portal`.

## 2. Login

### Staff Login

- Use your username and password.
- Demo accounts (if enabled):
  - `admin / 1111`
  - `manager / 1111`
  - `dispatcher / 1111`
  - `technician / 1111`

### Client Login

- Use customer email in Client Portal.
- Demo client login:
  - `contact@acme.com / client`
- After login, clients can see only their own jobs and invoices.

## 3. Navigation Overview

Main pages for staff:

1. `Dashboard` - KPI summary, recent activity, quick status view.
2. `Jobs` - create, assign, update, check in/out, attach photos.
3. `Schedule` - date-based view of scheduled jobs.
4. `Customers` - customer records and contact details.
5. `Invoices` - create invoices and update payment status.
6. `Projects` - project records and project tasks.
7. `Planner` - detailed project planning (table/timeline/calendar).
8. `Team` - technician management.
9. `Tools > Inventory` - stock items.
10. `Tools > Equipment` - customer equipment records.
11. `Tools > Quotes` - create/accept/reject/convert quotes.
12. `Tools > Export` - export jobs/customers CSV.

## 4. Role Permissions

### Admin

- Full access to all pages and actions.

### Dispatcher

- Can manage jobs, customers, projects/tasks, team, inventory, equipment, quotes, invoices, notifications.

### Manager

- Can manage day-to-day operations similarly to dispatcher.
- Cannot perform admin-only account governance actions.

### Technician

- Can view assigned work and update allowed job/task progress actions.
- Cannot perform admin-only actions (delete records, manage sensitive resources).

### Client

- Can access only client portal data related to their own account.

## 5. Core Workflows

### A. Create and Assign a Job

1. Go to `Jobs`.
2. Click create/new job.
3. Fill customer, title, priority, date, notes.
4. Assign technician.
5. Save.

### B. Technician Job Execution

1. Open assigned job.
2. Use check-in when work starts.
3. Add notes, parts/materials, photos.
4. Use check-out when done and add completion notes.

### C. Add Project Task (Projects Page)

1. Go to `Projects`.
2. Open a project.
3. Go to `Tasks` tab.
4. Click `Add Task`.
5. Fill task name/dates/status/progress.
6. Save.

### D. Planner Task Updates

1. Go to `Planner`.
2. Select project.
3. Edit task name, dates, progress directly in table.
4. Use timeline/calendar for schedule visibility.

### E. Notifications

1. Click the bell icon in top bar.
2. View unread/read notifications.
3. Mark notifications as read when done.

### F. Quotes to Job

1. Go to `Tools > Quotes`.
2. Create quote and send/track status.
3. Accept quote.
4. Convert accepted quote to job.

### G. Invoicing

1. Go to `Invoices`.
2. Create invoice for customer/job.
3. Update status (`pending`, `paid`).
4. Download invoice file when needed.

## 6. Client Portal

Clients can:

1. View their jobs and statuses.
2. View their invoices and payment status.
3. Download invoice files where available.

## 7. Search, Filters, and Status Tips

1. Use page filters/search first before editing to avoid changing wrong records.
2. Keep status values consistent:
   - Jobs: `new`, `assigned`, `in-progress`, `completed`
   - Tasks: `not_started`, `in_progress`, `completed`, `delayed`
3. Update progress and dates together for accurate planner metrics.

## 8. Troubleshooting

### Login fails

1. Verify username/password.
2. Confirm correct portal (Staff vs Client).
3. Retry after refresh.

### Data not loading

1. Refresh browser.
2. Check internet connection.
3. Contact admin to verify backend status.

### Changes not saved

1. Confirm no error message appears.
2. Re-open the same record to verify.
3. If still not saved, report page name + action + timestamp.

## 9. Best Practices

1. Keep notes short and clear.
2. Always check-in/check-out for field jobs.
3. Attach photos for proof of completion.
4. Update project tasks weekly for accurate reporting.
5. Mark notifications read after actioning.

## 10. Support Handoff Template

When reporting an issue, include:

1. User role and username.
2. Exact page (example: `Projects > Tasks`).
3. Steps performed.
4. Error message text.
5. Time the issue happened.
