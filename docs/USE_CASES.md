# Use Cases Document
# ManuOS - Manufacturing Operating System

**Document Version**: 1.0
**Last Updated**: May 2026
**Purpose**: Complete use case specifications for all ManuOS functionality

---

## Table of Contents

1. [Overview](#1-overview)
2. [Order Management Use Cases](#2-order-management-use-cases)
3. [Material Management Use Cases](#3-material-management-use-cases)
4. [Production Execution Use Cases](#4-production-execution-use-cases)
5. [Quality Control Use Cases](#5-quality-control-use-cases)
6. [Planning & Scheduling Use Cases](#6-planning--scheduling-use-cases)
7. [Inventory Management Use Cases](#7-inventory-management-use-cases)
8. [Vendor Management Use Cases](#8-vendor-management-use-cases)
9. [System Administration Use Cases](#9-system-administration-use-cases)
10. [Reporting & Analytics Use Cases](#10-reporting--analytics-use-cases)

---

## 1. Overview

### 1.1 Purpose

This document defines all use cases for ManuOS, describing interactions between users (actors) and the system to achieve specific goals.

### 1.2 Actor Definitions

| Actor | Description | Primary Role |
|-------|-------------|--------------|
| **Admin** | System administrator | Configure system, manage users |
| **PPIC Staff** | Production Planning & Inventory Control | Plan production, manage materials |
| **Production Manager** | Production oversight | Approve orders, monitor progress |
| **Technician** | Shop floor operator | Execute tasks, record output |
| **Warehouse Staff** | Warehouse operations | Manage inventory, handle handoffs |
| **QC Inspector** | Quality control | Perform inspections, make pass/fail decisions |
| **Marketing Staff** | Customer relations | Create orders, communicate with customers |
| **Drafter** | Engineering/Technical | Create recipes, technical specs |

### 1.3 System Boundary

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          ManuOS System                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │   Order      │ │  Production  │ │  Material    │ │  Quality     │  │
│  │  Management  │ │  Planning    │ │  Management  │ │  Control     │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │
│                                                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │  Inventory   │ │   Vendor     │ │   System     │ │  Reporting   │  │
│  │  Management  │ │  Management  │ │Administration│ │  & Analytics │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │
│                                                                         │
│                    ┌──────────────────────────────┐                     │
│                    │      Odoo ERP Integration    │                     │
│                    └──────────────────────────────┘                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Order Management Use Cases

### UC-OM-01: Create Customer Order

**Actor**: Marketing Staff / PPIC Staff

**Goal**: Create a new customer order with all required details

**Preconditions**:
- User is authenticated
- Customer information is available

**Main Flow**:
1. User navigates to Orders page
2. User clicks "New Order"
3. System displays order creation form
4. User enters:
   - Customer name
   - Order number (or auto-generate)
   - Planned start date
   - Planned end date
   - Product specifications
5. User submits order
6. System validates input
7. System creates order with status "PENDING"
8. System displays confirmation

**Alternative Flows**:
- **4a**: User uploads product specifications as attachment
- **7a**: Validation fails → Display error messages

**Postconditions**:
- Order created with unique order number
- Order appears in Orders list with "PENDING" status

---

### UC-OM-02: Create Manufacturing Order

**Actor**: PPIC Staff

**Goal**: Create manufacturing order(s) from customer order

**Preconditions**:
- Customer order exists
- Recipe/BOM is available (optional)

**Main Flow**:
1. User opens customer order detail page
2. User clicks "Create MO"
3. System displays MO creation wizard (Step 1 of 7)
4. User fills in MO details:
   - MO name
   - Manufacturing type (Internal/External)
   - Quantity
   - Recipe selection (optional)
5. User proceeds to Step 2: Technical Specs
6. User reviews/adds technical specifications
7. User proceeds to Step 3: MO Details
8. User adds vendor (if external MO)
9. User sets planned dates
10. User proceeds to Step 4: Material Distribution
11. System calculates material requirements (MRP)
12. User reviews material availability
13. User proceeds to Step 5: Jobsheets
14. User creates/defines jobsheets
15. User proceeds to Step 6: Tasks
16. User creates tasks for each jobsheet
17. User proceeds to Step 7: Dependencies (NEW)
18. User configures task dependencies:
    - MO-level dependencies
    - Jobsheet-level dependencies
    - Task-level dependencies
    - Dependency types (FS, SS, FF, SF)
    - Lag days
19. User submits MO
20. System creates MO with status "CREATED"
21. System creates associated jobsheets and tasks

**Alternative Flows**:
- **11a**: Insufficient stock → System highlights shortage
- **12a**: User can proceed with partial materials
- **18a**: No dependencies → Skip dependencies step

**Postconditions**:
- MO created with status "CREATED"
- Jobsheets and tasks created
- Dependencies configured
- Material requirements calculated

---

### UC-OM-03: Manage Order Status

**Actor**: PPIC Staff / Manager

**Goal**: Update order status through workflow

**Preconditions**:
- Order exists

**Main Flow**:
1. User views order detail page
2. User selects next status from available transitions
3. System validates status transition
4. System updates order status
5. System logs status change
6. System notifies relevant stakeholders

**Status Workflow**:
```
PENDING → REVIEW → APPROVED → IN_PROGRESS → COMPLETED
   │         │          │           │
   └─────────┴──────────┴───────────┴───▶ REJECTED/CANCELLED
```

---

### UC-OM-04: View Order Gantt Chart

**Actor**: PPIC Staff / Manager

**Goal**: Visualize order timeline with dependencies

**Preconditions**:
- Orders with MOs, jobsheets, and tasks exist

**Main Flow**:
1. User navigates to Planning → Gantt
2. System displays Gantt chart with:
   - Orders hierarchy
   - MO bars (color-coded by status)
   - Jobsheet bars
   - Task bars
   - Dependency arrows
   - Today marker
3. User can:
   - Expand/collapse hierarchy
   - Toggle dependency arrows
   - View critical path (amber highlighted)
   - Zoom in/out
   - Filter by order/MO
4. User clicks on bar to view details

**Visual Elements**:
- Dependency arrows: Solid (FS), Dashed (SS/FF)
- Critical path: Amber bars with ring
- Progress: Filled portion of bar

---

## 3. Material Management Use Cases

### UC-MM-01: Calculate Material Requirements (MRP)

**Actor**: PPIC Staff

**Goal**: Calculate materials needed for manufacturing order

**Preconditions**:
- MO exists with recipe/BOM

**Main Flow**:
1. User opens MO detail page
2. User navigates to Material Requirements section
3. System displays recipe ingredients
4. User clicks "Run MRP"
5. System calculates:
   - Required quantity per unit
   - Total required quantity
   - Current stock availability
   - Shortage/surplus
6. System displays color-coded results:
   - **Green**: Sufficient stock
   - **Yellow**: Partial stock
   - **Red**: Out of stock
7. System generates purchase recommendations for shortages

**Postconditions**:
- Material requirements calculated
- Purchase requests generated (if needed)

---

### UC-MM-02: Allocate Materials to Jobsheet

**Actor**: Warehouse Staff / PPIC

**Goal**: Reserve materials for specific jobsheet

**Preconditions**:
- Jobsheet exists
- Materials available in stock

**Main Flow**:
1. User navigates to Material Allocation page
2. User selects jobsheet
3. System displays required materials
4. User selects inventory items to allocate
5. User enters allocation quantities
6. User confirms allocation
7. System creates allocation records
8. System updates inventory (reserved quantity)

**Alternative Flows**:
- **4a**: Insufficient stock → System warns user
- **5a**: User can allocate partial quantities

**Postconditions**:
- Materials allocated to jobsheet
- Inventory shows reserved status

---

### UC-MM-03: Create Material Handoff

**Actor**: Warehouse Staff

**Goal**: Transfer materials between locations

**Preconditions**:
- Materials exist in source location
- Handoff request exists

**Main Flow**:
1. User navigates to Handoffs page
2. User clicks "New Handoff"
3. System displays handoff form
4. User selects:
   - Source location
   - Destination location
   - Materials and quantities
   - Associated MO (optional)
5. User submits handoff
6. System creates handoff with status "CREATED"
7. System displays handoff details

**Postconditions**:
- Handoff created with "CREATED" status
- Handoff appears in handoffs list

---

### UC-MM-04: Move Materials to PPIC Rack

**Actor**: Warehouse Staff

**Goal**: Move materials from warehouse to PPIC rack for planning

**Preconditions**:
- Handoff exists in "CREATED" status
- Materials available in warehouse

**Main Flow**:
1. User opens pending handoff
2. User clicks "Move to PPIC Rack"
3. System validates:
   - Stock availability
   - No duplicate handoff exists
4. System updates handoff status to "MOVED"
5. System creates inventory transfer:
   - From: WAREHOUSE
   - To: PPIC_RACK
   - Type: TRANSFER
6. System emits SSE event
7. System displays success message

**Duplicate Prevention**:
- System checks for existing handoff with same MO and materials
- Returns error if duplicate found

---

### UC-MM-05: Issue Materials to Production

**Actor**: Warehouse Staff / PPIC

**Goal**: Issue materials from PPIC rack to production floor

**Preconditions**:
- Handoff in "MOVED" status
- Materials available in PPIC rack

**Main Flow**:
1. User opens handoff in "MOVED" status
2. User clicks "Issue to Production"
3. System validates stock availability
4. System updates handoff status to "ISSUED"
5. System creates inventory entry:
   - From: PPIC_RACK
   - To: PRODUCTION_FLOOR
   - Type: ISSUE
6. System emits SSE event
7. System displays confirmation

---

### UC-MM-06: Confirm Material Receipt at Production

**Actor**: Technician / Warehouse Staff

**Goal**: Confirm materials received at production floor

**Preconditions**:
- Handoff in "ISSUED" status
- Materials physically received

**Main Flow**:
1. User opens handoff in "ISSUED" status
2. User reviews material list
3. User confirms quantities received
4. User clicks "Confirm Receipt"
5. System updates handoff status to "CONFIRMED"
6. System updates inventory location
7. System emits SSE event

---

## 4. Production Execution Use Cases

### UC-PE-01: Execute Task (Clock In/Out)

**Actor**: Technician

**Goal**: Track time spent on task

**Preconditions**:
- Task assigned to technician
- Task in "PENDING" or "ASSIGNED" status

**Main Flow**:
1. Technician opens Tasks page
2. Technician filters assigned tasks
3. Technician selects task
4. Technician clicks "Clock In"
5. System records start time
6. System updates task status to "RUNNING"
7. Technician executes work
8. Technician clicks "Clock Out"
9. System calculates duration
10. System updates task with actual hours

**Postconditions**:
- Task time tracked
- Actual hours recorded

---

### UC-PE-02: Record Production Output

**Actor**: Technician

**Goal**: Record production quantities (good/rework/scrap)

**Preconditions**:
- Task in "RUNNING" or "COMPLETED" status

**Main Flow**:
1. Technician completes work
2. Technician opens production output form
3. Technician enters:
   - Good quantity
   - Rework quantity
   - Scrap quantity
   - Notes (optional)
4. Technician submits output
5. System generates unique PO number (PO-YYYY-NNN)
6. System creates production output record
7. System creates inventory ledger entries:
   - CONSUMPTION: Materials used
   - PRODUCTION_OUTPUT: Output quantities
8. System sets QC status to "PENDING"
9. System emits SSE event

**Postconditions**:
- Production output recorded
- Materials consumed
- QC inspection pending

---

### UC-PE-03: Request QC Inspection

**Actor**: Technician / System

**Goal**: Request quality control inspection

**Preconditions**:
- Production output recorded

**Main Flow**:
1. Technician clicks "Request QC" on production output
2. System updates QC status to "REQUESTED"
3. System notifies QC inspector
4. QC inspector receives notification

**Alternative Flow**:
- **1a**: Automatic QC request after production output recorded

---

## 5. Quality Control Use Cases

### UC-QC-01: Perform QC Inspection

**Actor**: QC Inspector

**Goal**: Inspect production output and record results

**Preconditions**:
- QC request exists
- Production output available

**Main Flow**:
1. QC inspector opens QC inspection page
2. System displays production output details
3. Inspector performs inspection
4. Inspector records results:
   - Good quantity (pass)
   - Rework quantity (needs rework)
   - Scrap quantity (reject)
5. Inspector adds inspection notes
6. Inspector submits results
7. System processes QC decision:

**QC PASS Path**:
- System creates QC_PASS inventory entry
- Good quantity → FINISHED_GOODS
- Production output status → COMPLETED
- QC status → PASS

**QC FAIL Path**:
- System creates QC_FAIL inventory entry
- Rework quantity → REWORK
- System creates rework order (RW-YYYY-NNN)
- Rework order linked to original production output
- Production output QC status → FAIL

**Mixed Results**:
- Each quantity type processed separately
- Rework order created only if rework quantity > 0

---

### UC-QC-02: Handle Rework Order

**Actor**: PPIC Staff / Technician

**Goal**: Process and complete rework order

**Preconditions**:
- Rework order exists

**Main Flow**:
1. PPIC staff opens rework order
2. PPIC staff creates rework tasks
3. PPIC staff assigns technician
4. Technician executes rework
5. Technician records rework output
6. QC inspector re-inspects
7. If pass → Move to finished goods
8. If fail → Create another rework or scrap

---

## 6. Planning & Scheduling Use Cases

### UC-PS-01: Configure Task Dependencies

**Actor**: PPIC Staff

**Goal**: Set up dependencies between tasks/MOs/jobsheets

**Preconditions**:
- Tasks/MOs/jobsheets exist

**Main Flow**:
1. User navigates to Planning → Dependencies
2. System displays available items
3. User selects predecessor item
4. User selects successor item
5. User chooses dependency type:
   - **Finish-to-Start (FS)**: Successor starts after predecessor finishes
   - **Start-to-Start (SS)**: Successor starts when predecessor starts
   - **Finish-to-Finish (FF)**: Successor finishes when predecessor finishes
   - **Start-to-Finish (SF)**: Successor finishes when predecessor starts
6. User enters lag days (optional)
7. User saves dependency
8. System validates no circular dependencies
9. System creates dependency record

**Alternative Flow**:
- **9a**: Circular dependency detected → Error message

---

### UC-PS-02: Run Auto-Schedule (CPM)

**Actor**: PPIC Staff / Manager

**Goal**: Calculate optimal task schedule using Critical Path Method

**Preconditions**:
- Tasks with dependencies exist
- Task durations defined

**Main Flow**:
1. User opens Gantt chart
2. User clicks "Auto-Schedule"
3. System runs CPM algorithm:
   - Forward pass: Calculate early start/finish
   - Backward pass: Calculate late start/finish
   - Identify critical path (zero float)
4. System updates task dates:
   - plannedStartDate
   - plannedEndDate
5. System highlights critical path (amber)
6. System displays updated Gantt chart

**CPM Calculation**:
```
For each task:
  Early Start (ES) = MAX(EF of predecessors) + lag
  Early Finish (EF) = ES + duration
  
  Late Finish (LF) = MIN(LS of successors) - lag
  Late Start (LS) = LF - duration
  
  Float = LS - ES (or LF - EF)
  
  Critical Path: Tasks with Float = 0
```

---

### UC-PS-03: Add Dependency via Gantt Chart

**Actor**: PPIC Staff

**Goal**: Create dependency visually on Gantt chart

**Preconditions**:
- Gantt chart view open
- Multiple tasks visible

**Main Flow**:
1. User hovers over predecessor task bar
2. User sees Link2 icon with dependency count
3. User clicks to view existing dependencies
4. User can add new dependency via Dependencies page
5. System displays dependency arrows on Gantt:
   - Curved paths
   - Arrowhead markers
   - Color-coded by type
   - Dashed for SS/FF types

---

## 7. Inventory Management Use Cases

### UC-IM-01: Add Inventory Item

**Actor**: Warehouse Staff

**Goal**: Add new inventory item to system

**Preconditions**:
- User has inventory management permissions

**Main Flow**:
1. User navigates to Inventory page
2. User clicks "Add Item"
3. User enters:
   - Part number
   - Name
   - Category
   - Unit of measure
   - Initial quantity
   - Location/Shelf
   - Minimum stock level
4. User submits
5. System creates inventory record
6. System creates initial RECEIPT ledger entry

---

### UC-IM-02: Adjust Stock Level

**Actor**: Warehouse Staff / Admin

**Goal**: Adjust inventory quantity (correction, damage, etc.)

**Preconditions**:
- Inventory item exists

**Main Flow**:
1. User finds inventory item
2. User clicks "Adjust"
3. User enters new quantity
4. User provides adjustment reason
5. System calculates difference
6. System creates ADJUSTMENT ledger entry
7. System updates stock level

---

### UC-IM-03: Transfer Stock Between Locations

**Actor**: Warehouse Staff

**Goal**: Move inventory from one location to another

**Preconditions**:
- Source and destination locations exist

**Main Flow**:
1. User selects inventory item
2. User clicks "Transfer"
3. User enters:
   - Source location
   - Destination location
   - Quantity to transfer
4. System validates availability
5. System creates TRANSFER ledger entry
6. System updates both location quantities

---

### UC-IM-04: Monitor Low Stock Alerts

**Actor**: PPIC Staff / Manager

**Goal**: View and respond to low stock alerts

**Preconditions**:
- Inventory items with minimum stock levels defined

**Main Flow**:
1. System monitors stock levels continuously
2. When stock falls below minimum:
   - System creates alert
   - Alert appears on dashboard
   - SSE event emitted
3. User views alerts
4. User takes action:
   - Create purchase request
   - Adjust minimum level
   - Dismiss alert

---

## 8. Vendor Management Use Cases

### UC-VM-01: Create Vendor Order

**Actor**: PPIC Staff / Manager

**Goal**: Create order for outsourced manufacturing

**Preconditions**:
- Outsourced MO exists
- Vendor selected

**Main Flow**:
1. User opens outsourced MO
2. User clicks "Create Vendor Order"
3. System generates vendor order
4. System syncs to Odoo (if configured)
5. User sends order to vendor

---

### UC-VM-02: Receive Vendor Shipment

**Actor**: Warehouse Staff

**Goal**: Receive and process vendor delivery

**Preconditions**:
- Vendor order exists
- Shipment received

**Main Flow**:
1. User opens vendor order
2. User clicks "Receive Shipment"
3. User enters received quantities
4. User records quality inspection
5. System creates RECEIPT inventory entry
6. System updates PO status
7. System syncs receipt to Odoo

---

## 9. System Administration Use Cases

### UC-SA-01: Manage Users

**Actor**: Admin

**Goal**: Create and manage system users

**Main Flow**:
1. Admin navigates to Settings → Users
2. Admin clicks "Add User"
3. Admin enters:
   - Email
   - Name
   - Role
   - Department
4. System creates user
5. System sends welcome email (if configured)

---

### UC-SA-02: Configure System Settings

**Actor**: Admin

**Goal**: Configure system-wide settings

**Main Flow**:
1. Admin navigates to Settings
2. Admin modifies:
   - Tenant information
   - Business units
   - Location definitions
   - Odoo integration settings
3. System saves changes
4. System applies new settings

---

### UC-SA-03: Manage Roles and Permissions

**Actor**: Admin

**Goal**: Configure user roles and permissions

**Main Flow**:
1. Admin navigates to Settings → Roles
2. Admin selects role to modify
3. Admin toggles permissions:
   - Order management
   - Production planning
   - Material management
   - Quality control
   - Inventory management
   - Reporting
   - Administration
4. System saves permission changes

---

## 10. Reporting & Analytics Use Cases

### UC-RA-01: View Production Dashboard

**Actor**: Manager / PPIC Staff

**Goal**: Monitor production status and KPIs

**Main Flow**:
1. User navigates to Dashboard
2. System displays:
   - Active orders count
   - Production status summary
   - Material stock levels
   - QC pending count
   - Machine availability
   - Low stock alerts
3. User can drill down into details

---

### UC-RA-02: Generate Production Report

**Actor**: Manager

**Goal**: Generate production performance report

**Main Flow**:
1. User navigates to Reports
2. User selects report type:
   - Production output
   - Quality metrics
   - Material consumption
   - Time tracking
3. User sets date range
4. User applies filters
5. System generates report
6. User exports (PDF/Excel)

---

### UC-RA-03: View Inventory Ledger

**Actor**: Manager / PPIC / Warehouse

**Goal**: View complete inventory transaction history

**Main Flow**:
1. User navigates to Inventory Ledger
2. User filters by:
   - Date range
   - Material
   - Transaction type
   - Location
   - User
3. System displays transaction list
4. User can view details of each entry
5. User can export to CSV

---

## Appendix A: Use Case Summary Matrix

| ID | Use Case | Primary Actor | Priority |
|----|----------|---------------|----------|
| UC-OM-01 | Create Customer Order | Marketing/PPIC | P0 |
| UC-OM-02 | Create Manufacturing Order | PPIC | P0 |
| UC-OM-03 | Manage Order Status | PPIC/Manager | P0 |
| UC-OM-04 | View Order Gantt Chart | PPIC/Manager | P0 |
| UC-MM-01 | Calculate MRP | PPIC | P0 |
| UC-MM-02 | Allocate Materials | Warehouse/PPIC | P0 |
| UC-MM-03 | Create Material Handoff | Warehouse | P0 |
| UC-MM-04 | Move to PPIC Rack | Warehouse | P0 |
| UC-MM-05 | Issue to Production | Warehouse/PPIC | P0 |
| UC-MM-06 | Confirm Receipt | Technician/Warehouse | P0 |
| UC-PE-01 | Execute Task | Technician | P0 |
| UC-PE-02 | Record Production Output | Technician | P0 |
| UC-PE-03 | Request QC Inspection | Technician | P0 |
| UC-QC-01 | Perform QC Inspection | QC Inspector | P0 |
| UC-QC-02 | Handle Rework Order | PPIC/Technician | P0 |
| UC-PS-01 | Configure Dependencies | PPIC | P0 |
| UC-PS-02 | Run Auto-Schedule | PPIC/Manager | P0 |
| UC-PS-03 | Add Dependency via Gantt | PPIC | P1 |
| UC-IM-01 | Add Inventory Item | Warehouse | P0 |
| UC-IM-02 | Adjust Stock Level | Warehouse/Admin | P0 |
| UC-IM-03 | Transfer Stock | Warehouse | P0 |
| UC-IM-04 | Monitor Low Stock | PPIC/Manager | P1 |
| UC-VM-01 | Create Vendor Order | PPIC/Manager | P1 |
| UC-VM-02 | Receive Vendor Shipment | Warehouse | P1 |
| UC-SA-01 | Manage Users | Admin | P0 |
| UC-SA-02 | Configure Settings | Admin | P0 |
| UC-SA-03 | Manage Roles | Admin | P1 |
| UC-RA-01 | View Dashboard | Manager/PPIC | P0 |
| UC-RA-02 | Generate Report | Manager | P1 |
| UC-RA-03 | View Inventory Ledger | Manager/PPIC | P0 |

---

## Appendix B: Dependency Types

| Type | Code | Description | Use Case |
|------|------|-------------|----------|
| Finish-to-Start | FS | Successor starts after predecessor finishes | Most common |
| Start-to-Start | SS | Successor starts when predecessor starts | Parallel tasks |
| Finish-to-Finish | FF | Successor finishes when predecessor finishes | Coordinated completion |
| Start-to-Finish | SF | Successor finishes when predecessor starts | Rare, reverse dependency |

---

**Document End**
