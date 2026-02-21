# Product Requirements Document (PRD)
# Kanban Board Feature

**Document Version**: 1.0
**Last Updated**: January 2025
**Product**: ManuOS - Manufacturing Orchestrator Platform
**Feature**: Kanban Board for Manufacturing Operations

---

## 1. Executive Summary

### 1.1 Overview
The Kanban Board feature provides a visual, drag-and-drop interface for managing manufacturing tasks by their status. It complements the existing Gantt Chart timeline view by offering a status-based perspective that enables quick task progression updates and real-time work-in-progress visibility.

### 1.2 Business Objectives
- **Increase Operational Efficiency**: Reduce time spent updating task statuses by 70% through drag-and-drop interface
- **Improve Visibility**: Provide real-time view of all tasks across the production floor
- **Enhance Decision Making**: Enable quick identification of bottlenecks and resource allocation issues
- **Reduce Errors**: Automate status transition validation and progress tracking
- **Support Agile Practices**: Enable rapid task status changes to support dynamic production environments

### 1.3 Success Metrics
- **Adoption Rate**: 90% of relevant users (Admins, PPIC, Managers, Technicians) using Kanban Board within 2 weeks
- **Task Update Efficiency**: Task status updates reduced from average 45 seconds to under 10 seconds
- **User Satisfaction**: NPS score of 8+ for usability and efficiency
- **Accuracy**: 99% reduction in status transition errors through validation
- **Daily Active Users**: 80% of target roles accessing Kanban Board daily

---

## 2. Target Users & Personas

### 2.1 Primary Users

#### Production Planning & Inventory Control (PPIC)
- **Responsibilities**: Assign tasks, monitor production flow, resolve bottlenecks
- **Pain Points**: Time-consuming task status updates, difficulty seeing WIP at a glance
- **Goals**: Quickly reassign tasks, identify blocked work, optimize resource allocation
- **Usage Frequency**: Multiple times per day

#### Manufacturing Managers
- **Responsibilities**: Oversee production operations, track progress, make strategic decisions
- **Pain Points**: Limited visibility into current task distribution, slow reporting
- **Goals**: Monitor team workload, identify process inefficiencies, make data-driven decisions
- **Usage Frequency**: Several times per day

#### Technicians
- **Responsibilities**: Execute assigned tasks, update progress, report issues
- **Pain Points**: Multi-step process to update task status, unclear priority
- **Goals**: Quickly report task completion, see upcoming work, access task details easily
- **Usage Frequency**: Throughout the workday

### 2.2 Secondary Users

#### Warehouse Staff
- **Responsibilities**: Monitor material availability, support production planning
- **Goals**: See task status to anticipate material needs
- **Usage Frequency**: Daily

### 2.3 User Access Matrix

| Role | Access Level | Primary Use Cases |
|------|--------------|------------------|
| Admin | Full | All use cases |
| Super Admin | Full | All use cases |
| PPIC | Full | Task assignment, status updates, filtering |
| Manager | Full | Monitoring, status updates, filtering |
| Technician | Read/Update Status | Own task updates, view others |
| Warehouse | Read-Only | Monitor task status for material planning |
| Customer | No Access | N/A |

---

## 3. User Stories

### 3.1 Core User Stories

#### US-1: View Task Board
**As a** Production Manager,
**I want to** see all manufacturing tasks organized by status columns,
**So that** I can quickly understand the current production status and identify bottlenecks.

**Acceptance Criteria:**
- View loads within 2 seconds
- All 7 status columns visible on screen
- Tasks display with key information (task number, name, progress, assignment)
- Column task counts are accurate
- Tasks are sorted within columns (most recent first)

**Priority:** P0 (Must Have)

---

#### US-2: Update Task Status via Drag and Drop
**As a** Technician,
**I want to** drag a task card from one status column to another,
**So that** I can quickly update my task progress without navigating away.

**Acceptance Criteria:**
- Drag gesture is smooth and responsive
- Drop zones are visually clear
- Invalid drops are prevented with visual feedback
- Status updates complete within 1 second
- Success toast notification appears after update
- Task card shows loading state during update

**Priority:** P0 (Must Have)

---

#### US-3: Filter Tasks
**As a** PPIC,
**I want to** filter tasks by machine, technician, or status,
**So that** I can focus on specific areas of production or resource allocation.

**Acceptance Criteria:**
- Filter dropdowns available in header
- Multiple filters can be combined
- Filters apply instantly (no submit button needed)
- Search box filters by task number, name, MO number, or JS number
- Filtered results display within 1 second
- Clear all filters option available

**Priority:** P0 (Must Have)

---

#### US-4: View Task Details
**As a** Technician,
**I want to** click on a task card to see full details,
**So that** I can access all relevant information without leaving the board.

**Acceptance Criteria:**
- Task number is clickable link
- Opens task detail page in new tab or modal
- Quick actions menu available on card (View Details)
- Visual indication that card is clickable

**Priority:** P0 (Must Have)

---

#### US-5: See Task Progress
**As a** Manager,
**I want to** see progress percentage and progress bar on each task card,
**So that** I can quickly assess task completion status.

**Acceptance Criteria:**
- Progress percentage displayed numerically
- Visual progress bar shows completion
- Color coding indicates progress level (red <25%, yellow 25-50%, blue 50-75%, green 75-100%)
- Progress updates in real-time when status changes

**Priority:** P0 (Must Have)

---

#### US-6: Monitor Task Assignments
**As a** PPIC,
**I want to** see which machine and technician each task is assigned to,
**So that** I can understand resource utilization and reassign if needed.

**Acceptance Criteria:**
- Machine name displayed on task card
- Technician name displayed on task card
- Assignment info visible without card expansion
- Icons used for quick visual identification

**Priority:** P0 (Must Have)

---

#### US-7: Identify Breakdowns and Clock Status
**As a** Technician,
**I want to** see visual indicators for tasks with breakdowns or active clock-in,
**So that** I can quickly identify urgent or active work.

**Acceptance Criteria:**
- Breakdown indicator (red) shows when task has breakdown
- Clocked-in indicator (green) shows when task is actively running
- Indicators are prominent but don't clutter card
- Indicators update in real-time

**Priority:** P1 (Should Have)

---

#### US-8: Prevent Invalid Status Transitions
**As a** Technician,
**I want the system to** prevent me from moving tasks to invalid status columns,
**So that** I don't accidentally create invalid workflow states.

**Acceptance Criteria:**
- Invalid drop is rejected with visual feedback
- Error message explains why transition is invalid
- Valid transitions are documented in help
- Transition logic follows manufacturing best practices

**Priority:** P0 (Must Have)

---

#### US-9: Auto Clock-In/Out
**As a** Technician,
**I want the system to** automatically clock me in when moving to RUNNING and out when moving from RUNNING,
**So that** I don't have to manually track time.

**Acceptance Criteria:**
- Auto clock-in when task moves to RUNNING (if not already clocked in)
- Auto clock-out when task leaves RUNNING (if clocked in and not clocked out)
- Manual clock-in/out still available in task details
- Clock timestamps are accurate to the second

**Priority:** P1 (Should Have)

---

#### US-10: Real-time Statistics
**As a** Manager,
**I want to** see statistics cards showing task counts per status,
**So that** I can quickly understand overall production status.

**Acceptance Criteria:**
- Statistics cards at top of page
- Shows count for each status column
- Updates immediately when task status changes
- Color-coded to match status columns
- Summary total displayed

**Priority:** P1 (Should Have)

---

#### US-11: Mobile Accessibility
**As a** Technician,
**I want to** access the Kanban Board on a tablet or phone,
**So that** I can check my tasks even when away from my workstation.

**Acceptance Criteria:**
- Horizontal scrolling for columns on mobile
- Task cards remain readable on small screens
- Touch-friendly drag and drop
- No horizontal scrolling within task cards
- Responsive layout adapts to screen size

**Priority:** P2 (Nice to Have)

---

#### US-12: Refresh and Loading States
**As a** User,
**I want to** see loading states when data is being fetched,
**So that** I understand the system is working.

**Acceptance Criteria:**
- Loading skeleton or spinner during initial load
- Refresh button available to manually reload
- Task card shows loading state during status update
- Global loading indicator for filter changes
- No flickering or jarring transitions

**Priority:** P0 (Must Have)

---

### 3.2 User Story Priority Matrix

| ID | Story | Priority | Story Points | Sprint |
|----|---------|---------------|---------|
| US-1 | View Task Board | P0 | 3 | Sprint 1 |
| US-2 | Drag and Drop Status Updates | P0 | 5 | Sprint 1 |
| US-3 | Filter Tasks | P0 | 5 | Sprint 1 |
| US-4 | View Task Details | P0 | 2 | Sprint 1 |
| US-5 | See Task Progress | P0 | 3 | Sprint 1 |
| US-6 | Monitor Task Assignments | P0 | 2 | Sprint 1 |
| US-7 | Identify Breakdowns & Clock Status | P1 | 3 | Sprint 2 |
| US-8 | Prevent Invalid Transitions | P0 | 5 | Sprint 1 |
| US-9 | Auto Clock-In/Out | P1 | 5 | Sprint 2 |
| US-10 | Real-time Statistics | P1 | 3 | Sprint 2 |
| US-11 | Mobile Accessibility | P2 | 5 | Sprint 3 |
| US-12 | Refresh & Loading States | P0 | 3 | Sprint 1 |

---

## 4. Functional Requirements

### 4.1 Core Features

#### FR-1: Task Display
**ID**: FR-1
**Priority**: P0
**Description**: Display manufacturing tasks in status-based columns

**Requirements**:
- Display tasks in 7 columns: Pending, Assigned, Running, Paused, On Hold, Completed, Cancelled
- Each task card shows: task number, name, description (truncated), progress, machine, technician
- Tasks sorted by creation date descending, then task number ascending
- Scrollable columns for tasks exceeding viewport height
- Minimum 80% vertical space utilization for task display

**Dependencies**: None
**Acceptance**: User can see all active tasks in appropriate status columns

---

#### FR-2: Drag and Drop
**ID**: FR-2
**Priority**: P0
**Description**: Enable task status updates via drag-and-drop

**Requirements**:
- Drag initiated on task card with 8px threshold (prevents accidental drags)
- Visual drag overlay shows task being moved
- Drop zones: status columns
- Invalid drops prevented with visual rejection
- Successful drops trigger status update API
- Loading state on task card during update
- Success notification on completion
- Error notification with details on failure

**Dependencies**: FR-8 (Status Validation)
**Acceptance**: User can successfully move tasks between valid status columns

---

#### FR-3: Filtering
**ID**: FR-3
**Priority**: P0
**Description**: Provide multiple filter options for task board

**Requirements**:
- **Search Filter**: Filter by task number, task name, MO number, JS number (case-insensitive)
- **Machine Filter**: Dropdown to filter by assigned machine
- **Technician Filter**: Dropdown to filter by assigned technician
- **Status Filter**: Dropdown to filter by status (shows single status or all)
- Filters work in combination (AND logic)
- Filters persist across page refresh (via URL query params)
- Clear filters button resets all filters
- Real-time filter application (no submit button)

**Dependencies**: None
**Acceptance**: User can quickly narrow down tasks to specific criteria

---

#### FR-4: Status Statistics
**ID**: FR-4
**Priority**: P1
**Description**: Display task count statistics for each status

**Requirements**:
- Statistics cards at top of page (one per status)
- Each card shows: status icon, status name, task count
- Color-coded to match status columns
- Updates immediately when task status changes
- Total count displayed separately
- Responsive grid layout (7 cards on desktop, 4 on tablet, 2 on mobile)

**Dependencies**: FR-2
**Acceptance**: User sees real-time task counts per status

---

#### FR-5: Task Details Access
**ID**: FR-5
**Priority**: P0
**Description**: Provide access to full task details from board

**Requirements**:
- Task number is clickable link
- Opens task detail page at `/tasks/[id]`
- Quick actions menu with "View Details" option
- Opens in same tab for consistency
- Back navigation from detail page returns to board

**Dependencies**: Task Detail page (existing)
**Acceptance**: User can navigate from board to task details

---

#### FR-6: Progress Visualization
**ID**: FR-6
**Priority**: P0
**Description**: Show task progress on each card

**Requirements**:
- Numerical percentage displayed
- Visual progress bar (2px height, full card width)
- Color coding by percentage:
  - 0-24%: Red
  - 25-49%: Yellow
  - 50-74%: Blue
  - 75-99%: Green
  - 100%: Solid green
- Progress bar animates on load
- Progress updates reflect server state

**Dependencies**: Task.progressPercent field
**Acceptance**: User can visually assess task completion

---

#### FR-7: Assignment Display
**ID**: FR-7
**Priority**: P0
**Description**: Show machine and technician assignments

**Requirements**:
- Machine name displayed with wrench icon
- Technician name displayed with user icon
- Truncation for long names (max 80px width)
- Tooltips on hover showing full names
- Displayed in card footer with border separation

**Dependencies**: Task.machine and Task.assignedUser relations
**Acceptance**: User can see task assignments at a glance

---

#### FR-8: Status Transition Validation
**ID**: FR-8
**Priority**: P0
**Description**: Prevent invalid task status transitions

**Requirements**:
- Server-side validation of all status changes
- Valid transitions defined in configuration matrix
- Invalid transitions return 400 Bad Request
- Error message includes: error type, current status, attempted status, valid transitions
- Client prevents invalid drops with visual feedback
- Documentation available showing allowed transitions

**Dependencies**: FR-2
**Acceptance**: Invalid status changes are prevented

---

#### FR-9: Auto Clock Management
**ID**: FR-9
**Priority**: P1
**Description**: Automatically track time based on status changes

**Requirements**:
- When task moves to RUNNING:
  - If not clocked in: Set clockedInAt to current timestamp
  - If already clocked in: No change
- When task moves from RUNNING (to any status except RUNNING):
  - If clocked in and not clocked out: Set clockedOutAt to current timestamp
  - If already clocked out: No change
- When task moves to COMPLETED:
  - If clocked in and not clocked out: Auto clock out
  - Set progressPercent to 100
- Manual clock-in/out in task details still available

**Dependencies**: FR-2, FR-8
**Acceptance**: Time tracking is automated based on status changes

---

#### FR-10: Cascading Progress Updates
**ID**: FR-10
**Priority**: P1
**Description**: Automatically recalculate parent entity progress

**Requirements**:
- When task status changes:
  - Recalculate Jobsheet progress as average of all tasks
  - Recalculate MO progress as average of all jobsheets
  - Recalculate Order progress as average of all MOs
- Updates applied atomically (all or none)
- Progress percentages rounded to 2 decimal places
- Updates reflect immediately on board refresh

**Dependencies**: FR-2
**Acceptance**: Parent entities show accurate progress

---

#### FR-11: Visual Indicators
**ID**: FR-11
**Priority**: P1
**Description**: Show status indicators for special conditions

**Requirements**:
- **Breakdown Indicator**: Red "Breakdown" text with alert icon when task.breakdownAt is set
- **Clocked-In Indicator**: Green "Clocked In" text with clock icon when clockedInAt is set and clockedOutAt is null
- Indicators displayed below progress bar
- Small font (12px) for minimal space usage
- Icons: AlertCircle for breakdown, Clock for clocked in

**Dependencies**: Task.breakdownAt, Task.clockedInAt fields
**Acceptance**: Special conditions are visually prominent

---

#### FR-12: Data Refresh
**ID**: FR-12
**Priority**: P0
**Description**: Enable manual and automatic data refresh

**Requirements**:
- Refresh button in page header
- Auto-refresh on filter changes
- Loading states during refresh:
  - Spinner icon on refresh button
  - Task cards show opacity or skeleton
- Fetch latest data from API
- Preserve scroll position after refresh
- Error notification on refresh failure

**Dependencies**: All features
**Acceptance**: User can refresh board data

---

### 4.2 API Requirements

#### FR-API-1: Fetch Tasks
**ID**: FR-API-1
**Priority**: P0
**Endpoint**: `GET /api/kanban`
**Parameters**:
- `machineId` (optional): Filter by assigned machine
- `assignedTo` (optional): Filter by assigned technician
- `moId` (optional): Filter by manufacturing order
- `orderId` (optional): Filter by order
- `status` (optional): Filter by status

**Response**:
```json
{
  "tasks": [
    {
      "id": "string",
      "taskNumber": "string",
      "name": "string",
      "status": "string",
      "progressPercent": "number",
      "machineId": "string | null",
      "assignedTo": "string | null",
      "clockedInAt": "string | null",
      "clockedOutAt": "string | null",
      "breakdownAt": "string | null",
      "jobsheet": {
        "id": "string",
        "jsNumber": "string",
        "name": "string",
        "manufacturingOrder": {
          "id": "string",
          "moNumber": "string",
          "order": {
            "id": "string",
            "orderNumber": "string",
            "customerName": "string"
          }
        }
      },
      "machine": {
        "id": "string",
        "code": "string",
        "name": "string"
      },
      "assignedUser": {
        "id": "string",
        "name": "string",
        "email": "string"
      }
    }
  ],
  "stats": {
    "pending": "number",
    "assigned": "number",
    "running": "number",
    "paused": "number",
    "completed": "number",
    "onHold": "number",
    "cancelled": "number"
  }
}
```

---

#### FR-API-2: Update Task Status
**ID**: FR-API-2
**Priority**: P0
**Endpoint**: `PUT /api/tasks/[id]/status`
**Body**:
```json
{
  "status": "PENDING | ASSIGNED | RUNNING | PAUSED | COMPLETED | CANCELLED | ON_HOLD",
  "notes": "string (optional)"
}
```

**Response**:
```json
{
  "task": {
    // Full task object with relations
  },
  "message": "Task status updated to RUNNING"
}
```

**Error Response** (400):
```json
{
  "error": "Invalid status transition",
  "message": "Cannot transition from PENDING to COMPLETED",
  "validTransitions": ["ASSIGNED", "CANCELLED", "ON_HOLD"]
}
```

---

### 4.3 UI/UX Requirements

#### FR-UI-1: Visual Design
- Color-coded columns for quick identification
- Consistent spacing and alignment (p-4 padding, gap-3 between cards)
- Shadow effects on hover
- Smooth transitions (300ms duration)
- Status icons for semantic meaning

#### FR-UI-2: Responsive Design
- Horizontal scroll on mobile
- Minimum column width: 320px
- Cards remain readable on screens ≥ 375px wide
- Touch-friendly drag zones (minimum 44px)

#### FR-UI-3: Accessibility
- Keyboard navigation support
- Screen reader friendly labels
- High contrast ratios (4.5:1 minimum)
- Focus indicators on interactive elements
- ARIA labels for drag and drop regions

#### FR-UI-4: Performance
- Initial page load < 2 seconds
- Filter application < 500ms
- Status update < 1 second
- Smooth 60fps animations
- No jank during drag operations

---

## 5. Non-Functional Requirements

### NFR-1: Performance
**Requirement**: System must respond quickly to user interactions
**Metrics**:
- Page load time: < 2 seconds (95th percentile)
- Filter application: < 500ms (95th percentile)
- Status update API: < 1 second (95th percentile)
- Drag and drop latency: < 100ms

---

### NFR-2: Scalability
**Requirement**: System must handle growing data volumes
**Metrics**:
- Support up to 500 tasks visible simultaneously
- Support up to 100 concurrent users
- Response time degradation < 20% with 2x data volume
- Memory usage: < 100MB for 500 tasks

---

### NFR-3: Reliability
**Requirement**: System must be dependable and consistent
**Metrics**:
- API uptime: 99.5%
- Successful status update rate: 99.9%
- Data consistency: 100% (no lost updates)
- Error recovery: Automatic retry on network failure

---

### NFR-4: Security
**Requirement**: Protect against unauthorized access and data corruption
**Measures**:
- Role-based access control (RBAC)
- SQL injection prevention (parameterized queries)
- XSS protection (React default + validation)
- CSRF protection (SameSite cookies)
- Audit logging for status changes

---

### NFR-5: Usability
**Requirement**: Interface must be intuitive for target users
**Metrics**:
- Task completion time for new users: < 30 seconds
- Error rate: < 2% of operations
- User satisfaction (NPS): > 8
- Help requests: < 1 per 100 operations

---

### NFR-6: Compatibility
**Requirement**: System must work across modern browsers
**Support**:
- Chrome 120+
- Firefox 121+
- Safari 17+
- Edge 120+
- Mobile browsers (iOS Safari, Chrome Mobile)

---

### NFR-7: Accessibility
**Requirement**: Comply with WCAG 2.1 Level AA
**Metrics**:
- Keyboard navigable: Yes
- Screen reader compatible: Yes
- Color contrast: > 4.5:1
- Touch target size: ≥ 44x44px

---

## 6. Use Cases

### UC-1: Technician Updates Task Status

**Actor**: Technician
**Preconditions**: User is logged in, has Technician role

**Flow**:
1. User navigates to Kanban Board
2. User locates their task in "Running" column
3. User drags task to "Completed" column
4. System validates transition (Running → Completed is valid)
5. System auto-sets clockedOutAt timestamp
6. System updates progress to 100%
7. System recalculates Jobsheet, MO, and Order progress
8. User sees success notification
9. Task card displays in "Completed" column

**Postconditions**: Task status is COMPLETED, time is tracked, parent progress is updated

---

### UC-2: PPIC Filters Tasks by Machine

**Actor**: PPIC
**Preconditions**: User is logged in, has PPIC role

**Flow**:
1. User navigates to Kanban Board
2. User clicks Machine filter dropdown
3. User selects "CNC Lathe M-001"
4. System filters tasks to show only assigned to M-001
5. Column task counts update to reflect filtered set
6. User identifies all tasks for M-001 across statuses
7. User clears filter to see all tasks again

**Postconditions**: Only M-001 tasks are displayed

---

### UC-3: Manager Identifies Bottleneck

**Actor**: Manager
**Preconditions**: User is logged in, has Manager role

**Flow**:
1. User navigates to Kanban Board
2. User reviews statistics cards
3. User notices "Running" column has 45 tasks
4. User notices "Paused" column has 23 tasks
5. User filters by "Running" status
6. User scans paused tasks for common machines or technicians
7. User identifies several tasks on M-003 are paused
7. User navigates to Machine Management to check M-003 status

**Postconditions**: Manager identifies M-003 as potential bottleneck

---

### UC-4: Technician Attempts Invalid Transition

**Actor**: Technician
**Preconditions**: User is logged in, has Technician role

**Flow**:
1. User navigates to Kanban Board
2. User attempts to drag task from "Completed" to "Pending"
3. System rejects the drop
4. User sees error toast: "Cannot transition from COMPLETED to PENDING"
5. User drags task to "Running" instead
6. System accepts the drop
7. Task status updates to RUNNING

**Postconditions**: Invalid transition prevented, valid transition succeeded

---

### UC-5: Admin Monitors Production Status

**Actor**: Admin
**Preconditions**: User is logged in, has Admin role

**Flow**:
1. User navigates to Kanban Board
2. User reviews statistics cards at top
3. User notes: 15 Pending, 23 Running, 12 Completed today
4. User checks breakdown indicators
5. User sees 3 tasks with active breakdowns
6. User navigates to Breakdowns page for details
7. User refreshes Kanban Board to see latest status

**Postconditions**: Admin has comprehensive view of production status

---

## 7. UI Mockups & Wireframes

### 7.1 Desktop Layout (1920x1080)

```
┌─────────────────────────────────────────────────────────────────────┐
│ ManuOS │ [🔍 Search...] [Machine ▼] [Tech ▼] [Status ▼] [🔄]│
├────────────┬────────────┬────────────┬────────────┬────────────┤
│ PENDING    │ ASSIGNED   │  RUNNING   │  PAUSED    │  ON HOLD    │
│ [⚠️] 5    │ [👤] 12   │ [🕐] 23   │ [⏸️] 8    │ [⚙️] 3    │
├────────────┼────────────┼────────────┼────────────┼────────────┤
│ [Card]     │ [Card]     │ [Card]     │ [Card]     │ [Card]     │
│ [Card]     │ [Card]     │ [Card]     │ [Card]     │             │
│            │ [Card]     │ [Card]     │            │             │
├────────────┴────────────┴────────────┴────────────┴────────────┤
│ COMPLETED   │ CANCELLED                                    │
│ [✅] 45    │ [❌] 2                                      │
├────────────┴────────────────────────────────────────────────────┤
│ [Card]     │ [Card]                                        │
│ [Card]     │                                                │
│ [Card]     │                                                │
└────────────┴────────────────────────────────────────────────────┘
```

### 7.2 Task Card Detail

```
┌─────────────────────────────┐
│ TS-001            [⋮]  │
├─────────────────────────────┤
│ Mill shaft machining       │
│                         │
│ [ORD-001] [JS-001]     │
│                         │
│ Progress: 67%           │
│ ████████░░░░░░░░░░░░░░░ │
│                         │
│ 🔧 CNC Lathe  👤 John D │
│                         │
│ [⚠️] Breakdown         │
└─────────────────────────────┘
```

### 7.3 Status Colors

| Status | Primary Color | Border Color | Icon |
|--------|--------------|--------------|------|
| Pending | Slate-100 | Slate-200 | AlertCircle |
| Assigned | Blue-50 | Blue-200 | User |
| Running | Emerald-50 | Emerald-200 | Clock (animated) |
| Paused | Amber-50 | Amber-200 | PauseCircle |
| On Hold | Purple-50 | Purple-200 | Settings |
| Completed | Green-50 | Green-200 | CheckCircle2 |
| Cancelled | Red-50 | Red-200 | XCircle |

---

## 8. Dependencies & Assumptions

### 8.1 External Dependencies

1. **@dnd-kit/core** - Drag and drop functionality
   - Already installed in project
   - Provides smooth, performant drag and drop
   - Supports touch devices

2. **@radix-ui components** - UI components
   - Card, Dialog, Select, Badge, ScrollArea
   - Already available via shadcn/ui
   - Accessible by default

3. **Lucide React** - Icons
   - Already installed
   - Provides all required icons

4. **Prisma ORM** - Database access
   - Already configured
   - SQLite database (development)
   - PostgreSQL (production recommended)

### 8.2 Internal Dependencies

1. **Authentication System**
   - User must be authenticated
   - Role-based access control enforced
   - Session management via cookies

2. **Task Data Model**
   - MachiningTask model exists
   - Relations: machine, assignedUser, jobsheet
   - Nested relations: jobsheet → MO → Order

3. **Task Detail Page**
   - `/tasks/[id]` page exists
   - Provides full task information
   - Supports clock in/out functionality

### 8.3 Assumptions

1. Users have basic familiarity with drag-and-drop interfaces
2. Internet connection is stable (API calls expected < 1 second)
3. Modern web browser used (Chrome, Firefox, Safari, Edge)
4. Maximum 500 active tasks expected at any time
5. Role assignments are managed separately (User Management feature)

---

## 9. Risks & Mitigation

### 9.1 Risk: Performance Degradation with Large Task Counts

**Probability**: Medium
**Impact**: High

**Mitigation**:
- Implement pagination for tasks (P2)
- Use virtual scrolling for long columns (P2)
- Implement server-side filtering to reduce data transfer
- Cache API responses locally

---

### 9.2 Risk: Invalid Status Transitions Causing User Frustration

**Probability**: Low
**Impact**: Medium

**Mitigation**:
- Clear error messages explaining why transition is invalid
- Visual indication of valid drop zones during drag
- Documentation of valid transitions in help
- Allow users to override with admin permission

---

### 9.3 Risk: Data Inconsistency During Concurrent Updates

**Probability**: Low
**Impact**: High

**Mitigation**:
- Database transactions for cascading updates
- Optimistic locking on task status
- Timestamp-based conflict detection
- Automatic retry with warning on conflict

---

### 9.4 Risk: Mobile Drag and Drop Complexity

**Probability**: Medium
**Impact**: Medium

**Mitigation**:
- Touch-optimized drag thresholds (minimum 8px)
- Larger touch targets (minimum 44px)
- Support alternative tap-to-select interface (P2)
- Extensive mobile testing

---

## 10. Future Enhancements

### Phase 2 (Future)

1. **Swimlanes**: Organize tasks by machine or technician within status columns
2. **Task Creation**: Create new tasks directly from board
3. **Bulk Operations**: Move multiple tasks at once
4. **Task History**: View timeline of task status changes
5. **Comments**: Add comments to task cards
6. **Attachments**: Show file attachments on cards
7. **Labels/Tags**: Color-coded labels for categorization
8. **Keyboard Shortcuts**: Keyboard navigation for power users
9. **Export**: Export current board state to PDF/CSV
10. **Reorder Tasks**: Manually reorder tasks within columns
11. **Real-time Updates**: WebSocket integration for live updates
12. **Time Tracking**: Show total time spent on task

### Phase 3 (Long-term)

1. **Custom Views**: Save and load custom board configurations
2. **Automation**: Auto-move tasks based on rules or time
3. **Integration**: Link to MES/ERP systems
4. **Analytics**: Board-specific analytics and reports
5. **Multi-tenancy**: Separate boards per tenant or facility

---

## 11. Success Criteria

### 11.1 Minimum Viable Product (MVP)

**Definition**: Core functionality allowing users to manage tasks via Kanban board

**Checklist**:
- ✅ Task board displays tasks in status columns
- ✅ Drag and drop updates task status
- ✅ Basic filtering available
- ✅ Task cards show key information
- ✅ Status transition validation in place
- ✅ Auto clock-in/clock-out functional
- ✅ Progress recalculation working
- ✅ Real-time statistics displayed
- ✅ Responsive design implemented
- ✅ Loading states and error handling

### 11.2 Release Criteria

**Definition**: Feature ready for production deployment

**Checklist**:
- ✅ All MVP criteria met
- ✅ All P0 user stories completed
- ✅ 90%+ P1 user stories completed
- ✅ Performance requirements met (load < 2s, update < 1s)
- ✅ Security requirements met (RBAC, input validation)
- ✅ Accessibility requirements met (WCAG 2.1 AA)
- ✅ Browser compatibility verified
- ✅ Testing coverage > 80%
- ✅ Documentation complete
- ✅ User acceptance testing passed

---

## 12. Open Questions

1. **Q**: Should we support swimlanes in Phase 1?
   - **A**: No, defer to Phase 2 for MVP simplicity

2. **Q**: What is the maximum expected task count?
   - **A**: Estimate 500 active tasks, monitor actual usage

3. **Q**: Should tasks auto-move based on time?
   - **A**: No, manual control preferred initially, consider automation later

4. **Q**: Should we support task cloning on the board?
   - **A**: No, defer to Phase 2

5. **Q**: Should real-time updates be implemented in MVP?
   - **A**: No, refresh-based approach sufficient for MVP, consider WebSocket for Phase 2

---

## 13. Glossary

| Term | Definition |
|------|------------|
| **PPIC** | Production Planning and Inventory Control |
| **MO** | Manufacturing Order |
| **JS** | Jobsheet |
| **WIP** | Work In Progress |
| **RBAC** | Role-Based Access Control |
| **MVP** | Minimum Viable Product |
| **NPS** | Net Promoter Score |
| **WCAG** | Web Content Accessibility Guidelines |
| **P0/P1/P2** | Priority levels: P0=Must Have, P1=Should Have, P2=Nice to Have |

---

## 14. References

1. Existing ManuOS features (Orders, Tasks, Gantt Chart)
2. Manufacturing workflow documentation
3. @dnd-kit library documentation
4. shadcn/ui component library
5. Kanban methodology best practices

---

## Appendix: Approval

**Document Owner**: Product Team
**Approved By**: [To be filled]
**Review Date**: [To be filled]
**Next Review Date**: [To be filled]
