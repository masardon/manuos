# Module Connection Map
# ManuOS - Manufacturing Operating System

**Version**: 1.0
**Last Updated**: May 2026

---

## Overview

This document maps all connections and data flows between ManuOS modules, ensuring the platform operates as a fully connected system.

---

## Core Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ORDER CREATION FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Marketing/Sales                                                            │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐               │
│  │ Order       │─────▶│ Mfg Order   │─────▶│ Jobsheet    │               │
│  │ Wizard      │      │ (MO)        │      │             │               │
│  │ (/orders/   │      │ (/mo/[id])  │      │ (/jobsheet/ │               │
│  │  wizard)    │      │             │      │  [id])      │               │
│  └─────────────┘      └─────────────┘      └──────┬──────┘               │
│                                                    │                       │
│                                                    ▼                       │
│                                            ┌─────────────┐                │
│                                            │ Task        │                │
│                                            │ (/mt/[id])  │                │
│                                            └──────┬──────┘                │
│                                                    │                       │
└────────────────────────────────────────────────────┼────────────────────────┘
                                                     │
                      ┌──────────────────────────────┼──────────────────────┐
                      │                              ▼                      │
                      │                  ┌─────────────────┐               │
                      │                  │ Production      │               │
                      │                  │ Output          │               │
                      │                  │ (/production-   │               │
                      │                  │  output)        │               │
                      │                  └────────┬────────┘               │
                      │                           │                         │
                      │                           ▼                         │
                      │               ┌─────────────────┐                  │
                      │               │ QC Inspection   │                  │
                      │               │ (Dialog)        │                  │
                      │               └────────┬────────┘                  │
                      │                        │                           │
                      │           ┌────────────┼────────────┐              │
                      │           │            │            │              │
                      │           ▼            ▼            ▼              │
                      │    ┌─────────┐  ┌──────────┐  ┌────────┐          │
                      │    │ PASS    │  │ FAIL     │  │ SCRAP  │          │
                      │    │         │  │          │  │        │          │
                      │    └────┬────┘  └────┬─────┘  └────────┘          │
                      │         │            │                             │
                      │         ▼            ▼                             │
                      │  ┌──────────┐  ┌──────────┐                       │
                      │  │Finished  │  │Rework    │                       │
                      │  │Goods     │  │Order     │                       │
                      │  │Inventory │  │(RW-XXX)  │                       │
                      │  └──────────┘  └──────────┘                       │
                      │                                                     │
                      └─────────────────────────────────────────────────────┘
```

---

## Module Connections

### 1. Order Wizard → Manufacturing Order

**Flow:**
```
Order Wizard (/orders/wizard)
    │
    ├── Step 1-3: Order Info
    │   └── POST /api/orders → Creates Order
    │
    ├── Step 4: Manufacturing Order
    │   └── POST /api/orders/{orderId}/mo → Creates MO
    │
    ├── Step 5: Jobsheets & Tasks
    │   └── POST /api/mo/{moId}/jobsheets → Creates Jobsheet
    │   └── POST /api/jobsheet/{jsId}/tasks → Creates Tasks
    │
    └── Step 6-7: Review & Submit
        └── Redirects to /orders/{orderId}
```

**API Endpoints:**
| Step | Endpoint | Method | Purpose |
|------|----------|--------|---------|
| Order Info | `/api/orders` | POST | Create customer order |
| MO Creation | `/api/orders/{orderId}/mo` | POST | Create MO linked to order |
| Jobsheet | `/api/mo/{moId}/jobsheets` | POST | Create jobsheet for MO |
| Task | `/api/jobsheet/{jsId}/tasks` | POST | Create task for jobsheet |

---

### 2. Order → Manufacturing Order → Jobsheet → Task (Hierarchy)

**Navigation Links:**
```
Order Detail (/orders/{id})
    │
    ├── Lists Manufacturing Orders
    │   └── Links to: /mo/{moId}
    │
    └── Timeline shows all children

Manufacturing Order (/mo/{id})
    │
    ├── Lists Jobsheets
    │   └── Links to: /jobsheet/{jsId}
    │
    ├── Material Requirements
    │   └── Links to: /material-requirements?moId={moId}
    │
    └── Gantt Chart entry point

Jobsheet (/jobsheet/{id})
    │
    ├── Lists Tasks
    │   └── Links to: /mt/{taskId}
    │
    └── Material allocations

Task Detail (/mt/{id})
    │
    ├── Clock In/Out
    │   └── PUT /api/tasks/{taskId}/clock
    │
    ├── View parent jobsheet info
    │
    └── Record Production Output
        └── Links to: /production-output?taskId={taskId}
```

---

### 3. Kanban Board → Task Execution

**Flow:**
```
Kanban Board (/planning/kanban)
    │
    ├── Fetches all tasks: GET /api/kanban
    │
    ├── Displays in columns by status:
    │   ├── Pending
    │   ├── Assigned
    │   ├── Running (In Progress)
    │   ├── Paused
    │   ├── On Hold
    │   ├── Completed
    │   └── Cancelled
    │
    ├── Drag & Drop → Updates status
    │   └── PUT /api/tasks/{taskId}/status
    │
    └── Click task → Opens /mt/{taskId}
```

**Data Refresh:**
- Kanban auto-refreshes after status update
- Statistics update in real-time

---

### 4. Gantt Chart → Planning View

**Flow:**
```
Gantt Chart (/planning/gantt)
    │
    ├── Fetches hierarchical data: GET /api/orders/gantt
    │
    ├── Displays 4-level hierarchy:
    │   ├── Order (blue)
    │   ├── Manufacturing Order (purple)
    │   ├── Jobsheet (green)
    │   └── Task (orange)
    │
    ├── Expand/Collapse groups
    │
    └── Shows timeline bars based on:
        ├── plannedStartDate / plannedEndDate
        ├── Progress percentage
        └── Today marker
```

---

### 5. Production Output → QC → Inventory

**Flow:**
```
Production Output (/production-output)
    │
    ├── Fetches tasks: GET /api/production-output/tasks
    │
    ├── Records output: POST /api/production-output
    │   └── Creates ProductionOutput record
    │
    ├── QC Inspection Dialog
    │   └── POST /api/production-output/{id}/qc
    │
    └── QC Results:
        │
        ├── PASS (qcPassed: true)
        │   └── Creates/Updates Finished Goods Inventory
        │       └── POST /api/inventory
        │
        └── FAIL (qcPassed: false)
            └── Creates Rework Order
                └── ReworkOrder record created
                └── Status: QC_FAILED on output
```

**QC Data Flow:**
```
QC Form → QC API → Update Output Status
                      │
                      ├── Good Qty → Finished Goods Inventory
                      ├── Rework Qty → Rework Order
                      └── Scrap Qty → Wasted
```

---

### 6. Material Requirements → Allocation

**Flow:**
```
Material Requirements (/material-requirements)
    │
    ├── Fetches requirements: GET /api/material-requirements
    │
    ├── For each MO:
    │   ├── Recipe ingredients
    │   ├── Required quantities
    │   └── Available stock status
    │
    └── Allocation Actions:
        ├── View available inventory
        └── Allocate to jobsheet
            └── POST /api/mo/{moId}/materials/allocate
```

---

### 7. Machine Management → Task Assignment

**Flow:**
```
Machine Management (/machines)
    │
    ├── Lists all machines with status
    │
    ├── Machine Status:
    │   ├── IDLE (available)
    │   ├── RUNNING (in use)
    │   ├── MAINTENANCE (unavailable)
    │   └── BROKEN (unavailable)
    │
    └── Task Assignment:
        ├── View assigned tasks
        └── Machine availability affects task scheduling
```

---

### 8. Reports & Analytics

**Data Sources:**
```
Reports (/reports)
    │
    ├── Production Reports
    │   ├── Orders completed
    │   ├── MOs progress
    │   └── Task completion rates
    │
    ├── Efficiency Reports
    │   ├── Machine utilization
    │   ├── Technician productivity
    │   └── Planned vs actual hours
    │
    └── Inventory Reports
        ├── Stock levels
        ├── Material usage
        └── Handoff history
```

---

## Navigation Map

### Sidebar Navigation
```
Dashboard (/dashboard)
    │
    ├── Orders (/orders)
    │   ├── Order List
    │   ├── Order Detail (/orders/{id})
    │   └── New Order (/orders/wizard)
    │
    ├── Manufacturing (/mo)
    │   ├── MO List
    │   └── MO Detail (/mo/{id})
    │
    ├── Planning (/planning)
    │   ├── Overview
    │   ├── Gantt Chart (/planning/gantt)
    │   └── Kanban Board (/planning/kanban)
    │
    ├── Production (/production)
    │   ├── Production Output
    │   └── Shop Floor View
    │
    ├── Inventory (/inventory)
    │   ├── Stock List
    │   ├── Material Requirements
    │   ├── Handoffs
    │   └── Material Allocation
    │
    ├── Machines (/machines)
    │   └── Machine Management
    │
    ├── Quality (/quality)
    │   ├── QC Queue
    │   └── Rework Orders
    │
    └── Reports (/reports)
        └── Analytics Dashboard
```

---

## API Endpoint Map

### Order Management
| Endpoint | Method | Connected To |
|----------|--------|--------------|
| `/api/orders` | GET, POST | Order List, Wizard |
| `/api/orders/{id}` | GET, PUT, DELETE | Order Detail |
| `/api/orders/{id}/mo` | POST | Wizard Step 4 |
| `/api/orders/gantt` | GET | Gantt Chart |

### Manufacturing Orders
| Endpoint | Method | Connected To |
|----------|--------|--------------|
| `/api/mo` | GET, POST | MO List, Wizard |
| `/api/mo/{id}` | GET, PUT, DELETE | MO Detail |
| `/api/mo/{id}/jobsheets` | POST | Wizard Step 5 |
| `/api/mo/{id}/materials` | GET | Material Requirements |
| `/api/mo/{id}/materials/allocate` | POST, DELETE | Material Allocation |
| `/api/mo/{id}/mrp` | POST | MRP Run |

### Jobsheets
| Endpoint | Method | Connected To |
|----------|--------|--------------|
| `/api/jobsheet/{id}` | GET, PUT | Jobsheet Detail |
| `/api/jobsheet/{id}/tasks` | POST | Wizard Step 5 |
| `/api/jobsheet/{id}/materials` | GET | Material Requirements |

### Tasks
| Endpoint | Method | Connected To |
|----------|--------|--------------|
| `/api/tasks/{id}/status` | PUT | Kanban Drag & Drop |
| `/api/kanban` | GET | Kanban Board |

### Production Output
| Endpoint | Method | Connected To |
|----------|--------|--------------|
| `/api/production-output/tasks` | GET | Production Output Page |
| `/api/production-output` | POST | Record Output |
| `/api/production-output/{id}/qc` | POST | QC Inspection |

### Inventory
| Endpoint | Method | Connected To |
|----------|--------|--------------|
| `/api/inventory` | GET, POST | Inventory List |
| `/api/inventory/events` | GET (SSE) | Real-time Updates |
| `/api/handoffs` | GET, POST | Handoffs |

---

## User Flow Examples

### Example 1: Complete Order to Delivery Flow

1. **Create Order** (Marketing)
   - Navigate to `/orders/wizard`
   - Fill order details
   - Create MO with recipe
   - Add jobsheets with tasks
   - Submit

2. **Plan Production** (PPIC)
   - View on Gantt Chart `/planning/gantt`
   - Adjust schedules if needed
   - Run MRP for materials
   - Allocate materials to jobsheets

3. **Execute Tasks** (Technician)
   - View Kanban Board `/planning/kanban`
   - Drag task to "Running"
   - Clock in to task `/mt/{id}`
   - Complete work
   - Record production output
   - Clock out

4. **Quality Control** (QC Inspector)
   - Review production output
   - Perform inspection
   - Mark PASS or FAIL
   - If PASS: Goods to inventory
   - If FAIL: Create rework order

5. **Complete Order** (PPIC/Manager)
   - Monitor progress on Gantt/Kanban
   - Verify all tasks completed
   - Confirm delivery

### Example 2: Rework Flow

1. **QC Failure Detected**
   - Production output marked QC_FAILED
   - Rework order created automatically

2. **Rework Execution**
   - Technician sees rework in task list
   - Execute rework tasks
   - Record rework output

3. **Re-Inspection**
   - QC re-inspects rework
   - PASS → Move to finished goods
   - FAIL → Additional rework or scrap

---

## Data Synchronization

### Real-time Updates (SSE)
- Inventory changes trigger SSE events
- Dashboard widgets update automatically
- Kanban board can refresh on events

### Status Propagation
- Task completion updates jobsheet progress
- Jobsheet completion updates MO progress
- MO completion updates order progress
- Progress cascades upward in hierarchy

### Material Flow
- MRP calculates requirements from recipes
- Allocation reserves inventory
- Production output consumes materials
- QC pass creates finished goods
- Handoffs track material movement

---

## Troubleshooting Connections

### Issue: Wizard not creating MOs
**Check:**
- `/api/orders/{id}/mo` endpoint exists
- Order ID is valid
- Request body includes required fields

### Issue: Kanban not showing tasks
**Check:**
- `/api/kanban` endpoint returns data
- Tasks have valid status values
- Jobsheet and MO relations exist

### Issue: Gantt chart empty
**Check:**
- `/api/orders/gantt` returns data
- Orders have planned start/end dates
- MOs and jobsheets have dates

### Issue: Production output not appearing
**Check:**
- Task status is COMPLETED or RUNNING
- `/api/production-output/tasks` returns data
- Task has jobsheet and MO relations

### Issue: QC not creating rework order
**Check:**
- QC API receives `qcPassed: false`
- Rework order model exists in database
- Quality check record created

---

## Summary of Connections

### All modules are connected via:

1. **Database Relations**
   - Order → MO → Jobsheet → Task
   - Task → ProductionOutput → QualityCheck
   - MaterialRequirement → JobsheetMaterial → Allocation
   - Inventory → Transactions → Handoffs

2. **API Endpoints**
   - RESTful APIs for CRUD operations
   - SSE for real-time updates
   - Hierarchical data fetching

3. **Navigation Links**
   - Cross-references between detail pages
   - Breadcrumb navigation
   - Back links

4. **Status Updates**
   - Drag-and-drop status changes
   - Cascading progress updates
   - Real-time refresh

---

*ManuOS Connection Map v1.0 - May 2026*
