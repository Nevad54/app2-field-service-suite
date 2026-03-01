# Project Planning Feature Enhancement - TODO

## Task Overview
Enhance the existing ProjectPlanner to be a full spreadsheet-based scheduler with:
- Excel-like inline editing
- Timeline/Gantt visualization
- Automatic calculations
- Weight-based progress tracking

## Backend Enhancements (server.js)
- [x] 1. Add `weight` field to task model (default: 1)
- [x] 2. Enhance calculation functions for weighted progress
- [x] 3. Add progress contribution calculation
- [x] 4. Update API endpoints to support new fields

## Frontend Enhancements (ProjectPlanner.js)
- [x] 1. Add Weight column to spreadsheet view
- [x] 2. Add Actual Progress Contribution column
- [x] 3. Add sorting functionality (by date, progress, status)
- [x] 4. Enhance spreadsheet with Excel-like behavior
- [x] 5. Improve timeline visualization
- [x] 6. Add keyboard navigation support
- [x] 7. Enhance project summary panel

## Styling (styles.css)
- [x] 1. Add styles for new columns (Weight, Contribution)
- [x] 2. Enhance spreadsheet table appearance
- [x] 3. Add sorting indicators
- [x] 4. Improve timeline bar styles

## Views Implemented
- [x] 1. **Spreadsheet Table View** - Primary interface with all columns
- [x] 2. **Timeline/Gantt View** - Visual bar representation
- [x] 3. **Project Summary Panel** - Overall progress stats
- [x] 4. **Calendar View** - Monthly calendar with task display

## Calculation Logic Implemented
- [x] Duration = End Date - Start Date
- [x] Status:
  - Progress = 0 → Not Started
  - 0 < Progress < 100 → In Progress
  - Progress = 100 → Completed
  - End Date passed AND Progress < 100 → Delayed
- [x] Weighted Task Contribution = Progress % × Weight
- [x] Project Overall Progress = Sum(contributions) ÷ Sum(weights)

## Example Data
- [x] Seed database with example projects and tasks

## Testing
- [x] Verify all calculations work correctly
- [x] Test inline editing
- [x] Test date changes trigger recalculation
- [x] Test sorting functionality
