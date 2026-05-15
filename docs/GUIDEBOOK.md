# ManuOS Complete Guidebook
# Step-by-Step Operating Instructions

**Document Version**: 1.0
**Last Updated**: May 2026
**Purpose**: Complete step-by-step guide for all ManuOS operations

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Order-to-Delivery Complete Workflow](#2-order-to-delivery-complete-workflow)
3. [Material Flow Step-by-Step](#3-material-flow-step-by-step)
4. [Order Wizard Complete Guide](#4-order-wizard-complete-guide)
5. [Gantt Chart & Dependencies Guide](#5-gantt-chart--dependencies-guide)
6. [Production Execution Guide](#6-production-execution-guide)
7. [Quality Control Guide](#7-quality-control-guide)
8. [Inventory Management Guide](#8-inventory-management-guide)
9. [Troubleshooting & FAQs](#9-troubleshooting--faqs)
10. [Quick Reference Cards](#10-quick-reference-cards)

---

## 1. Getting Started

### 1.1 Accessing the System

```
URL: http://localhost:3000 (development)
URL: https://manuos.example.com (production)

Default Credentials:
├── Admin:       admin@ypti.com / demo123
├── PPIC:        ppic@ypti.com / demo123
├── Manager:     manager@ypti.com / demo123
├── Technician:  tech1@ypti.com / demo123
└── Warehouse:   warehouse@ypti.com / demo123
```

### 1.2 Dashboard Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MANUOS DASHBOARD                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │ Active Orders│ │   Tasks      │ │   Pending    │ │  Low Stock   │  │
│  │     12       │ │   Today: 8   │ │  QC: 5       │ │  Alerts: 3   │  │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Recent Activity                              │   │
│  │  - Order ORD-2026-001 status changed to APPROVED               │   │
│  │  - MO MO-2026-003 completed                                    │   │
│  │  - Handoff HAND-045 moved to PPIC rack                         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Quick Actions                                │   │
│  │  [New Order] [Create MO] [View Gantt] [Check Inventory]        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Order-to-Delivery Complete Workflow

### 2.1 Complete Process Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│              COMPLETE ORDER-TO-DELIVERY WORKFLOW                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  STEP 1: CREATE ORDER                                                   │
│  Marketing Staff → Orders → New Order → Fill Details → Submit           │
│                                │                                        │
│                                ▼                                        │
│  STEP 2: PLAN PRODUCTION                                                │
│  PPIC Staff → Order Detail → Create MO → Order Wizard (7 Steps)        │
│                                │                                        │
│                                ▼                                        │
│  STEP 3: CALCULATE MATERIALS                                            │
│  PPIC Staff → Material Requirements → Run MRP → Review                 │
│                                │                                        │
│                                ▼                                        │
│  STEP 4: RECEIVE MATERIALS (if needed)                                  │
│  Warehouse Staff → Receive Shipment → Inspect → Put Away               │
│                                │                                        │
│                                ▼                                        │
│  STEP 5: ALLOCATE MATERIALS                                             │
│  Warehouse Staff → Material Allocation → Select Jobsheet → Allocate    │
│                                │                                        │
│                                ▼                                        │
│  STEP 6: MOVE TO PPIC RACK                                              │
│  Warehouse Staff → Handoffs → New Handoff → Move to PPIC               │
│                                │                                        │
│                                ▼                                        │
│  STEP 7: ISSUE TO PRODUCTION                                            │
│  Warehouse Staff → Handoffs → Issue to Production                      │
│                                │                                        │
│                                ▼                                        │
│  STEP 8: EXECUTE TASKS                                                  │
│  Technician → Tasks → Clock In → Work → Record Output → Clock Out      │
│                                │                                        │
│                                ▼                                        │
│  STEP 9: QUALITY CONTROL                                                │
│  QC Inspector → QC Page → Inspect → Pass/Fail Decision                 │
│                                │                                        │
│                                ▼                                        │
│  STEP 10: COMPLETE ORDER                                                │
│  System → Mark Complete → Update Inventory → Notify Customer           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Material Flow Step-by-Step

### 3.1 Warehouse Receipt Flow

**Step-by-step instructions for receiving materials:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WAREHOUSE RECEIPT STEPS                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PREREQUISITES:                                                         │
│  ☐ Purchase Order exists (PO-YYYY-NNN)                                 │
│  ☐ Vendor has shipped materials                                         │
│  ☐ Shipment physically arrived                                          │
│                                                                         │
│  STEP 1: NAVIGATE TO RECEIVING                                          │
│  ├── Login as Warehouse Staff                                           │
│  ├── Click "Inventory" in sidebar                                       │
│  └── Click "Receive Shipment" button                                    │
│                                                                         │
│  STEP 2: SELECT PURCHASE ORDER                                          │
│  ├── Search for PO number                                               │
│  ├── Select matching PO from list                                       │
│  └── System displays expected items                                     │
│                                                                         │
│  STEP 3: RECORD RECEIVED QUANTITIES                                     │
│  ├── For each item:                                                     │
│  │   ├── Enter received quantity                                        │
│  │   ├── Enter batch/lot number (if applicable)                         │
│  │   ├── Record any damage/shortage                                     │
│  │   └── Add notes for discrepancies                                    │
│  └── Compare received vs expected                                       │
│                                                                         │
│  STEP 4: INSPECT GOODS                                                  │
│  ├── Perform visual inspection                                          │
│  ├── Check for damage                                                   │
│  ├── Verify specifications match                                        │
│  └── Record inspection results                                          │
│                                                                         │
│  STEP 5: PUT AWAY TO STORAGE                                            │
│  ├── Select storage location                                            │
│  │   ├── Main Warehouse                                                 │
│  │   └── Specific Shelf (e.g., SHELF-A1)                                │
│  ├── Scan/enter shelf code                                              │
│  └── System updates inventory                                           │
│                                                                         │
│  STEP 6: CONFIRM RECEIPT                                                │
│  ├── Review all entries                                                 │
│  ├── Click "Confirm Receipt"                                            │
│  └── System creates RECEIPT ledger entry                                │
│                                                                         │
│  RESULT:                                                                │
│  ☐ Inventory updated with new stock                                     │
│  ☐ PO status updated to "RECEIVED"                                      │
│  ☐ Ledger entry created (Type: RECEIPT)                                 │
│  ☐ Real-time update sent to all clients                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Material Allocation Flow

**Step-by-step instructions for allocating materials:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MATERIAL ALLOCATION STEPS                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PREREQUISITES:                                                         │
│  ☐ Jobsheet exists with material requirements                           │
│  ☐ Materials available in inventory                                     │
│                                                                         │
│  STEP 1: OPEN MATERIAL ALLOCATION PAGE                                  │
│  ├── Login as Warehouse Staff or PPIC                                   │
│  ├── Navigate to "Material Allocation"                                  │
│  └── System shows available jobsheets                                   │
│                                                                         │
│  STEP 2: SELECT JOBSHEET                                                │
│  ├── Filter jobsheets by MO                                             │
│  ├── Select target jobsheet                                             │
│  └── System displays required materials                                 │
│                                                                         │
│  STEP 3: REVIEW MATERIAL REQUIREMENTS                                   │
│  ├── Check required quantities                                          │
│  ├── Check available stock (color-coded):                               │
│  │   🟢 Green = Sufficient                                              │
│  │   🟡 Yellow = Partial                                                │
│  │   🔴 Red = Out of stock                                              │
│  └── Note any shortages                                                 │
│                                                                         │
│  STEP 4: SELECT INVENTORY ITEMS                                         │
│  ├── For each required material:                                        │
│  │   ├── Click "Allocate"                                               │
│  │   ├── Select inventory item (by part number)                         │
│  │   ├── Choose storage location/shelf                                  │
│  │   ├── Enter quantity to allocate                                     │
│  │   └── System reserves the quantity                                   │
│  └── Repeat for all materials                                           │
│                                                                         │
│  STEP 5: CONFIRM ALLOCATION                                             │
│  ├── Review allocation summary                                          │
│  ├── Check for any unallocated items                                    │
│  ├── Click "Confirm Allocation"                                         │
│  └── System creates allocation records                                  │
│                                                                         │
│  RESULT:                                                                │
│  ☐ Materials allocated to jobsheet                                      │
│  ☐ Stock marked as "Reserved"                                           │
│  ☐ Ready for handoff to PPIC rack                                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Material Handoff Flow

**Complete handoff process with 3 steps:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE HANDOFF PROCESS                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ═══════════════════════════════════════════════════════════════════   │
│  STEP 1: CREATE HANDOFF & MOVE TO PPIC RACK                            │
│  ═══════════════════════════════════════════════════════════════════   │
│                                                                         │
│  Location Flow: WAREHOUSE ──────────────▶ PPIC RACK                    │
│                                                                         │
│  Actions:                                                               │
│  1. Navigate to Handoffs page                                           │
│  2. Click "New Handoff"                                                 │
│  3. Fill in handoff details:                                            │
│     ├── Source: Main Warehouse                                          │
│     ├── Destination: PPIC Rack                                          │
│     ├── Select MO (optional but recommended)                            │
│     ├── Add materials and quantities                                    │
│     └── Assign handoff personnel                                        │
│  4. Click "Create"                                                      │
│  5. Status becomes: CREATED                                             │
│                                                                         │
│  6. Click "Move to PPIC Rack" button                                    │
│  7. System validates:                                                   │
│     ├── Stock availability ✓                                            │
│     ├── No duplicate handoff ✓                                          │
│     └── Correct status (CREATED) ✓                                      │
│  8. System updates:                                                     │
│     ├── Handoff status → MOVED                                          │
│     ├── Inventory TRANSFER entry created                                │
│     └── SSE event emitted                                               │
│                                                                         │
│  Result: Materials now in PPIC Rack                                     │
│                                                                         │
│  ═══════════════════════════════════════════════════════════════════   │
│  STEP 2: ISSUE TO PRODUCTION                                            │
│  ═══════════════════════════════════════════════════════════════════   │
│                                                                         │
│  Location Flow: PPIC RACK ──────────────▶ PRODUCTION FLOOR             │
│                                                                         │
│  Actions:                                                               │
│  1. Find handoff in "MOVED" status                                      │
│  2. Click "Issue to Production"                                         │
│  3. System validates:                                                   │
│     ├── Materials in PPIC rack ✓                                         │
│     └── Correct status (MOVED) ✓                                        │
│  4. System updates:                                                     │
│     ├── Handoff status → ISSUED                                         │
│     ├── Inventory ISSUE entry created                                   │
│     └── SSE event emitted                                               │
│                                                                         │
│  Result: Materials issued to production (pending confirmation)          │
│                                                                         │
│  ═══════════════════════════════════════════════════════════════════   │
│  STEP 3: CONFIRM RECEIPT AT PRODUCTION                                  │
│  ═══════════════════════════════════════════════════════════════════   │
│                                                                         │
│  Location Flow: PRODUCTION FLOOR (pending) → PRODUCTION FLOOR (confirmed)
│                                                                         │
│  Actions:                                                               │
│  1. Technician receives materials physically                            │
│  2. Open handoff in "ISSUED" status                                     │
│  3. Verify received quantities match                                    │
│  4. Click "Confirm Receipt"                                             │
│  5. System updates:                                                     │
│     ├── Handoff status → CONFIRMED                                      │
│     └── SSE event emitted                                               │
│                                                                         │
│  Result: Materials confirmed at production, ready for use               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.4 Production Output Recording

**Step-by-step for recording production output:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PRODUCTION OUTPUT RECORDING                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PREREQUISITES:                                                         │
│  ☐ Task assigned to you                                                 │
│  ☐ Materials received and confirmed                                     │
│  ☐ Work completed                                                       │
│                                                                         │
│  STEP 1: NAVIGATE TO PRODUCTION OUTPUT                                  │
│  ├── Login as Technician                                                │
│  ├── Navigate to "Production" → "Production Output"                     │
│  └── System shows tasks ready for output                                │
│                                                                         │
│  STEP 2: SELECT TASK                                                    │
│  ├── Filter tasks by your name                                          │
│  ├── Find the task you completed                                        │
│  └── Click "Record Output"                                              │
│                                                                         │
│  STEP 3: ENTER QUANTITIES                                               │
│  ├── Good Quantity: Units that passed quality                           │
│  ├── Rework Quantity: Units needing rework                              │
│  ├── Scrap Quantity: Units to be discarded                              │
│  └── Total should match input quantity                                  │
│                                                                         │
│  STEP 4: ADD NOTES (Optional)                                           │
│  ├── Production observations                                            │
│  ├── Issues encountered                                                 │
│  └── Special circumstances                                              │
│                                                                         │
│  STEP 5: SUBMIT OUTPUT                                                  │
│  ├── Review entered data                                                │
│  ├── Click "Submit"                                                     │
│  └── System creates Production Output record                            │
│                                                                         │
│  SYSTEM ACTIONS:                                                        │
│  1. Generates unique PO number: PO-YYYY-NNN                            │
│  2. Creates inventory entries:                                          │
│     ├── CONSUMPTION: Materials used                                     │
│     └── PRODUCTION_OUTPUT: New finished goods                           │
│  3. Sets QC status to PENDING                                           │
│  4. Emits SSE event                                                     │
│                                                                         │
│  RESULT:                                                                │
│  ☐ Production output recorded                                           │
│  ☐ Materials consumed from inventory                                    │
│  ☐ Good/Rework/Scrap quantities tracked                                 │
│  ☐ QC inspection pending                                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Order Wizard Complete Guide

### 4.1 Order Wizard Overview

The Order Wizard is a 7-step guided process for creating Manufacturing Orders:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ORDER WIZARD - 7 STEPS                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐         │
│  │ Step 1  │ │ Step 2  │ │ Step 3  │ │ Step 4  │ │ Step 5  │         │
│  │ Order   │ │Technical│ │   MO    │ │Material │ │Job-     │         │
│  │ Info    │ │ Specs   │ │ Details │ │Distrib. │ │sheets   │         │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘         │
│                                                                         │
│  ┌─────────┐ ┌─────────┐                                              │
│  │ Step 6  │ │ Step 7  │                                              │
│  │ Tasks   │ │Deps     │ ◄── NEW!                                     │
│  └─────────┘ └─────────┘                                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Step-by-Step Instructions

#### Step 1: Order Information

```
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 1: ORDER INFORMATION                                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Fill in:                                                               │
│  ├── Customer Name: [Enter customer name]                               │
│  ├── Order Number: [Auto-generated or manual]                           │
│  ├── Order Date: [Select date]                                          │
│  ├── Planned Start: [Select date]                                       │
│  ├── Planned End: [Select date]                                         │
│  └── Notes: [Additional information]                                    │
│                                                                         │
│  Click [Next] to proceed                                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Step 2: Technical Specifications

```
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 2: TECHNICAL SPECIFICATIONS                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Select Recipe/BOM (optional):                                          │
│  ├── Recipe dropdown                                                    │
│  ├── Or create new specification                                        │
│  └── Upload technical drawings                                          │
│                                                                         │
│  Product Details:                                                       │
│  ├── Product Name: [Name]                                               │
│  ├── Part Number: [PN-XXX]                                              │
│  ├── Specifications: [Details]                                          │
│  └── Quality Requirements: [Standards]                                  │
│                                                                         │
│  Click [Next] to proceed                                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Step 3: Manufacturing Order Details

```
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 3: MANUFACTURING ORDER DETAILS                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  MO Type:                                                               │
│  ├── ○ Internal (Manufactured in-house)                                 │
│  └── ○ External (Outsourced to vendor)                                  │
│                                                                         │
│  MO Details:                                                            │
│  ├── MO Name: [Descriptive name]                                        │
│  ├── Quantity: [Number of units]                                        │
│  ├── Unit: [pcs/kg/liters]                                              │
│  ├── Planned Start: [Date]                                              │
│  ├── Planned End: [Date]                                                │
│  └── Priority: [Low/Medium/High]                                        │
│                                                                         │
│  For External MOs:                                                      │
│  ├── Vendor: [Select from dropdown]                                     │
│  ├── Vendor Reference: [PO number]                                      │
│  └── Lead Time: [Days]                                                  │
│                                                                         │
│  Click [Next] to proceed                                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Step 4: Material Distribution

```
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 4: MATERIAL DISTRIBUTION                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  MRP Calculation Results:                                               │
│  ┌────────────┬─────────┬─────────┬─────────┬─────────────────────┐   │
│  │ Material   │Required │In Stock │ Short   │ Status              │   │
│  ├────────────┼─────────┼─────────┼─────────┼─────────────────────┤   │
│  │ Steel A    │ 100 kg  │ 150 kg  │ 0       │ 🟢 Sufficient       │   │
│  │ Aluminum B │ 50 kg   │ 30 kg   │ -20 kg  │ 🔴 Shortage         │   │
│  │ Paint C    │ 20 L    │ 20 L    │ 0       │ 🟢 Exact            │   │
│  │ Screws D   │ 500 pcs │ 100 pcs │ -400 pcs│ 🔴 Shortage         │   │
│  └────────────┴─────────┴─────────┴─────────┴─────────────────────┘   │
│                                                                         │
│  Actions:                                                               │
│  ├── Review material requirements                                       │
│  ├── For shortages: Create Purchase Request                             │
│  ├── Adjust quantities if needed                                        │
│  └── Save distribution plan                                             │
│                                                                         │
│  Click [Next] to proceed                                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Step 5: Jobsheets

```
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 5: JOBSHEETS                                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Create Jobsheets:                                                      │
│                                                                         │
│  Jobsheet 1: [Cutting]                                                  │
│  ├── Description: [Cut raw materials to size]                           │
│  ├── Estimated Hours: [4]                                               │
│  └── Work Instructions: [Detailed steps]                                │
│                                                                         │
│  Jobsheet 2: [Assembly]                                                 │
│  ├── Description: [Assemble components]                                 │
│  ├── Estimated Hours: [6]                                               │
│  └── Work Instructions: [Detailed steps]                                │
│                                                                         │
│  Jobsheet 3: [Finishing]                                                │
│  ├── Description: [Final finishing and inspection]                      │
│  ├── Estimated Hours: [2]                                               │
│  └── Work Instructions: [Detailed steps]                                │
│                                                                         │
│  [Add Jobsheet] [Remove]                                                │
│                                                                         │
│  Click [Next] to proceed                                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Step 6: Tasks

```
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 6: TASKS                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Jobsheet: Cutting                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Task 1: Cut Steel Sheets                                        │   │
│  │ ├── Machine: CNC Cutter (optional)                              │   │
│  │ ├── PIC: [Select technician] (optional)                         │   │
│  │ ├── Duration: [2 hours]                                         │   │
│  │ └── Instructions: [Steps]                                       │   │
│  │                                                                  │   │
│  │ Task 2: Cut Aluminum Plates                                     │   │
│  │ ├── Machine: Laser Cutter (optional)                            │   │
│  │ ├── PIC: [Select technician] (optional)                         │   │
│  │ ├── Duration: [2 hours]                                         │   │
│  │ └── Instructions: [Steps]                                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  [Add Task] [Remove]                                                    │
│                                                                         │
│  Note: Machine and PIC assignment is optional for QC/Assembly tasks     │
│                                                                         │
│  Click [Next] to proceed                                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Step 7: Dependencies (NEW!)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 7: DEPENDENCIES                                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Configure dependencies between MOs, Jobsheets, and Tasks:             │
│                                                                         │
│  Dependency Types:                                                      │
│  ├── FS: Finish-to-Start (Successor starts after predecessor finishes)  │
│  ├── SS: Start-to-Start (Successor starts when predecessor starts)      │
│  ├── FF: Finish-to-Finish (Successor finishes when pred. finishes)      │
│  └── SF: Start-to-Finish (Successor finishes when pred. starts)         │
│                                                                         │
│  Example Dependencies:                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Predecessor          │ Successor            │ Type │ Lag       │   │
│  ├──────────────────────┼──────────────────────┼──────┼───────────┤   │
│  │ MO-001: Cutting      │ MO-001: Assembly     │ FS   │ 0 days    │   │
│  │ Task 1: Cut Steel    │ Task 2: Cut Alum.    │ SS   │ 1 day     │   │
│  │ MO-001: Assembly     │ MO-002: Finishing    │ FS   │ 2 days    │   │
│  └──────────────────────┴──────────────────────┴──────┴───────────┘   │
│                                                                         │
│  Add Dependency:                                                        │
│  ├── Select Predecessor: [Dropdown - MO/JS/Task]                        │
│  ├── Select Successor: [Dropdown - MO/JS/Task]                          │
│  ├── Dependency Type: [FS/SS/FF/SF]                                     │
│  ├── Lag Days: [Number]                                                 │
│  └── [Add Dependency]                                                   │
│                                                                         │
│  Existing Dependencies:                                                 │
│  ├── ☑ MO-001 → MO-002 (FS, 0d)                                        │
│  ├── ☑ Task 1 → Task 2 (FS, 0d)                                        │
│  └── ☐ [Remove]                                                         │
│                                                                         │
│  Click [Submit Order] to complete wizard                                │
│                                                                         │
│  SYSTEM ACTIONS:                                                        │
│  1. Creates MO with all jobsheets and tasks                             │
│  2. Creates all dependency records                                      │
│  3. Maps local IDs to database IDs                                      │
│  4. Runs auto-schedule (CPM)                                            │
│  5. Displays Gantt chart with dependencies                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Gantt Chart & Dependencies Guide

### 5.1 Gantt Chart Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    GANTT CHART VIEW                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Header: Date scale (Week/Month view)                                   │
│  │───────────────┼───────────────┼───────────────┼───────────────│    │
│  │  Week 1       │  Week 2       │  Week 3       │  Week 4       │    │
│  │───────────────┼───────────────┼───────────────┼───────────────│    │
│                                                                         │
│  Rows: Order/MO/Job/Task hierarchy                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ► Order ORD-2026-001 [====================================]     │   │
│  │   ► MO-001 Cutting [===============]                            │   │
│  │     ├─ JS-Cutting [===========]                                 │   │
│  │     │  └─ Task 1 [=====] ◄── Critical (amber with ring)        │   │
│  │     │  └─ Task 2 [=====]                                        │   │
│  │     ├─────────────────────────────────▶ (Dependency arrow)      │   │
│  │   ► MO-002 Assembly [=================]                         │   │
│  │     ├─ JS-Assembly [=============]                              │   │
│  │     │  └─ Task 3 [=====]                                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Legend:                                                                │
│  ├── ████ = Bar (color by status)                                      │
│  ├── ░░░░ = Progress fill                                              │
│  ├── ────▶ = Dependency arrow (solid = FS, dashed = SS/FF)             │
│  ├── ╎╎╎╎╎ = Today marker (dashed vertical line)                       │
│  └── 🔴 Amber ring = Critical path                                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Using the Gantt Chart

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    GANTT CHART CONTROLS                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Navigation:                                                            │
│  ├── [◀ Week] [Week] [Month ▶]  - Change time scale                    │
│  ├── [Expand All] [Collapse All]  - Toggle hierarchy                    │
│  └── [◀ Prev] [Today] [Next ▶]  - Navigate dates                       │
│                                                                         │
│  View Options:                                                          │
│  ├── ☑ Show Dependencies  - Toggle dependency arrows                   │
│  ├── ☑ Show Critical Path  - Highlight critical tasks (amber)          │
│  ├── ☑ Show Progress  - Display task progress                          │
│  └── Filter: [All Orders ▼]  - Filter by order/MO                      │
│                                                                         │
│  Task Row Icons:                                                        │
│  ├── 🔗 Link2 icon  - Shows dependency count                           │
│  │   Click to view/edit dependencies                                    │
│  └── Status color  - Indicates task state                               │
│                                                                         │
│  Clicking on bars:                                                      │
│  ├── Single click  - Select task, show details in sidebar               │
│  ├── Double click  - Open task detail page                              │
│  └── Right click   - Context menu (Edit, Delete, etc.)                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Auto-Schedule (CPM) Usage

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    AUTO-SCHEDULE (CPM)                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PURPOSE:                                                               │
│  Calculate optimal task dates using Critical Path Method (CPM)          │
│  based on task durations and dependencies.                              │
│                                                                         │
│  STEPS TO RUN:                                                          │
│  1. Ensure all tasks have durations defined                             │
│  2. Configure dependencies (see Step 7 of Order Wizard)                 │
│  3. Open Gantt chart                                                    │
│  4. Click "Auto-Schedule" button                                        │
│  5. System runs CPM algorithm:                                          │
│     ├── Forward pass: Calculate early start/finish dates                │
│     ├── Backward pass: Calculate late start/finish dates                │
│     ├── Float calculation: Determine scheduling flexibility             │
│     └── Critical path identification: Zero float tasks                  │
│  6. System updates task dates in database                               │
│  7. System highlights critical path (amber bars with ring)              │
│  8. Gantt chart refreshes with new dates                                │
│                                                                         │
│  CPM FORMULA:                                                           │
│  ├── Early Start (ES) = MAX(EF of all predecessors) + lag              │
│  ├── Early Finish (EF) = ES + duration                                 │
│  ├── Late Finish (LF) = MIN(LS of all successors) - lag               │
│  ├── Late Start (LS) = LF - duration                                   │
│  ├── Float = LS - ES (or LF - EF)                                      │
│  └── Critical Path = Tasks with Float = 0                               │
│                                                                         │
│  DEPENDENCY TYPES AFFECTING SCHEDULE:                                   │
│  ├── FS: Successor ES = Predecessor EF + lag                           │
│  ├── SS: Successor ES = Predecessor ES + lag                           │
│  ├── FF: Successor EF = Predecessor EF + lag                           │
│  └── SF: Successor EF = Predecessor ES + lag                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.4 Managing Dependencies

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DEPENDENCY MANAGEMENT                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Navigation: Planning → Dependencies                                    │
│                                                                         │
│  Adding a Dependency:                                                   │
│  1. Select Predecessor item from dropdown                               │
│     ├── Options: MOs, Jobsheets, Tasks                                  │
│     └── Shows items with local IDs (e.g., "Cutting Task")              │
│  2. Select Successor item from dropdown                                 │
│     ├── Must be different from predecessor                              │
│     └── System validates no circular dependencies                       │
│  3. Select Dependency Type:                                             │
│     ├── FS (Finish-to-Start) - Most common                             │
│     ├── SS (Start-to-Start) - Parallel start                           │
│     ├── FF (Finish-to-Finish) - Parallel finish                        │
│     └── SF (Start-to-Finish) - Rare, reverse                           │
│  4. Enter Lag Days (optional)                                           │
│     ├── Positive = Delay after dependency                              │
│     └── Negative = Overlap before dependency                           │
│  5. Click "Add Dependency"                                              │
│  6. System validates and saves                                          │
│                                                                         │
│  Viewing Dependencies:                                                  │
│  ├── List view shows all dependencies                                   │
│  ├── Filter by: Predecessor, Successor, Type                           │
│  └── Edit/Delete buttons for each entry                                 │
│                                                                         │
│  Deleting Dependencies:                                                 │
│  ├── Select dependency from list                                        │
│  ├── Click "Delete" button                                              │
│  ├── Confirm deletion                                                   │
│  └── System removes from database (hard delete)                         │
│                                                                         │
│  Validation:                                                            │
│  ├── No circular dependencies allowed                                   │
│  │   (A→B, B→C, C→A is invalid)                                        │
│  ├── Cannot create dependency from item to itself                       │
│  └── Duplicate detection prevents same dependency twice                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Production Execution Guide

### 6.1 Task Execution

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    TASK EXECUTION - TECHNICIAN                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  DAILY WORKFLOW:                                                        │
│                                                                         │
│  1. VIEW TASKS                                                          │
│  ├── Login as Technician                                                │
│  ├── Navigate to "Production" → "Tasks"                                 │
│  ├── Tasks filtered by your assignment                                  │
│  ├── View task priority and due dates                                   │
│  └── Check jobsheet instructions                                        │
│                                                                         │
│  2. CLOCK IN                                                            │
│  ├── Select task to work on                                             │
│  ├── Click "Clock In" button                                            │
│  ├── System records start time                                          │
│  ├── Task status changes to "RUNNING"                                   │
│  └── Timer starts tracking                                              │
│                                                                         │
│  3. EXECUTE WORK                                                        │
│  ├── Follow jobsheet instructions                                       │
│  ├── Report any issues/breakdowns immediately                           │
│  ├── Update progress periodically                                       │
│  └── Check materials availability                                       │
│                                                                         │
│  4. RECORD OUTPUT                                                       │
│  ├── Click "Record Production Output"                                   │
│  ├── Enter quantities:                                                  │
│  │   ├── Good: Units that passed quality                               │
│  │   ├── Rework: Units needing rework                                  │
│  │   └── Scrap: Units to discard                                        │
│  ├── Add notes if needed                                                │
│  └── Submit output                                                      │
│                                                                         │
│  5. CLOCK OUT                                                           │
│  ├── Click "Clock Out" button                                           │
│  ├── System calculates duration                                         │
│  ├── Task status updates                                                │
│  └── Request QC inspection (automatic or manual)                        │
│                                                                         │
│  IMPORTANT:                                                             │
│  ├── Clock in/out promptly for accurate time tracking                   │
│  ├── Report breakdowns immediately                                      │
│  ├── Record actual quantities accurately                                │
│  └── Don't forget to clock out!                                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Machine Breakdown Reporting

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MACHINE BREAKDOWN REPORT                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  When machine breaks down:                                              │
│                                                                         │
│  1. Pause current task (optional)                                       │
│  2. Navigate to "Machines" or use quick action                          │
│  3. Select machine                                                      │
│  4. Click "Report Breakdown"                                            │
│  5. Fill in breakdown details:                                          │
│  ├── Issue description                                                  │
│  ├── Severity (Low/Medium/High/Critical)                                │
│  ├── Estimated downtime                                                 │
│  └── Immediate actions taken                                            │
│  6. Submit report                                                       │
│  7. System notifies maintenance/management                              │
│                                                                         │
│  After repair:                                                          │
│  ├── Update breakdown record                                            │
│  ├── Mark as resolved                                                   │
│  ├── Record actual downtime                                             │
│  └── Add resolution notes                                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Quality Control Guide

### 7.1 QC Inspection Process

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    QC INSPECTION PROCESS                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  RECEIVE QC REQUEST:                                                    │
│  ├── Notification received when production output recorded              │
│  ├── QC status: PENDING                                                 │
│  └── Navigate to "Quality Control" → "Inspections"                      │
│                                                                         │
│  PERFORM INSPECTION:                                                    │
│  1. Open inspection request                                             │
│  2. Review production output details:                                   │
│  ├── Production Output Number: PO-2026-001                             │
│  ├── Task: Cutting Task                                                 │
│  ├── Total Output: 100 units                                           │
│  └── Good/Rework/Scrap breakdown                                       │
│                                                                         │
│  3. Perform physical inspection:                                        │
│  ├── Check against specifications                                       │
│  ├── Measure critical dimensions                                        │
│  ├── Test functionality                                                 │
│  ├── Visual inspection                                                  │
│  └── Document findings                                                  │
│                                                                         │
│  4. Record inspection results:                                          │
│  ├── Good Quantity: [Enter number that passed]                         │
│  ├── Rework Quantity: [Enter number needing rework]                    │
│  ├── Scrap Quantity: [Enter number to reject]                          │
│  ├── Total must match original output                                   │
│  └── Add inspection notes                                               │
│                                                                         │
│  5. Make QC decision:                                                   │
│  ├── ✓ PASS: All good, no rework/scrap                                 │
│  ├── ⚠ PARTIAL PASS: Some good, some rework                           │
│  ├── ✗ FAIL: All need rework                                           │
│  └── ✗ SCRAP: All rejected                                             │
│                                                                         │
│  6. Submit inspection                                                   │
│                                                                         │
│  SYSTEM ACTIONS:                                                        │
│                                                                         │
│  IF PASS:                                                               │
│  ├── Creates QC_PASS inventory entry                                    │
│  ├── Good quantity → FINISHED_GOODS location                           │
│  ├── Production output status: COMPLETED                                │
│  └── QC status: PASS                                                    │
│                                                                         │
│  IF FAIL/PARTIAL:                                                       │
│  ├── Creates QC_FAIL inventory entry                                    │
│  ├── Rework quantity → REWORK location                                  │
│  ├── Creates Rework Order (RW-YYYY-NNN)                                │
│  ├── Rework order linked to original output                             │
│  ├── Production output QC status: FAIL                                  │
│  └── PPIC notified to schedule rework                                   │
│                                                                         │
│  SCRAP:                                                                 │
│  ├── Creates SCRAP inventory entry                                      │
│  ├── Scrap quantity removed from inventory                              │
│  └── Scrap logged for reporting                                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Rework Management

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    REWORK ORDER MANAGEMENT                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  REWORK ORDER CREATED:                                                  │
│  ├── Auto-generated when QC fails                                       │
│  ├── Rework Order Number: RW-YYYY-NNN                                  │
│  ├── Linked to original Production Output                               │
│  ├── Quantity: From QC fail quantity                                    │
│  └── Status: CREATED                                                    │
│                                                                         │
│  PROCESSING REWORK:                                                     │
│  1. PPIC opens rework order                                             │
│  2. Creates rework tasks:                                               │
│  ├── Define rework steps                                                │
│  ├── Assign technician                                                  │
│  └── Set estimated hours                                                │
│  3. Technician executes rework                                          │
│  4. Technician records rework output                                    │
│  5. QC re-inspects rework                                               │
│                                                                         │
│  RE-INSPECTION OUTCOMES:                                                │
│  ├── PASS → Move to finished goods                                      │
│  ├── PARTIAL → Remaining items reworked again                           │
│  └── FAIL → Another rework order OR scrap                               │
│                                                                         │
│  EXAMPLE:                                                               │
│  Original defect: 10 units                                              │
│  ├── First re-inspection: 8 pass, 2 still defective                    │
│  │   └── 8 → Finished Goods, 2 stay in Rework                          │
│  ├── Second re-inspection: 1 pass, 1 defective                         │
│  │   └── 1 → Finished Goods, 1 → Scrap                                 │
│  └── Final: 9 units good, 1 unit scrapped                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Inventory Management Guide

### 8.1 Daily Inventory Tasks

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DAILY INVENTORY TASKS                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  MORNING CHECKLIST:                                                     │
│  ☐ Check dashboard for low stock alerts                                 │
│  ☐ Review pending handoffs                                              │
│  ☐ Check incoming shipments scheduled                                   │
│  ☐ Verify PPIC rack materials for scheduled production                  │
│                                                                         │
│  DURING DAY:                                                            │
│  ☐ Process incoming shipments                                           │
│  ☐ Create and process handoffs                                          │
│  ☐ Monitor SSE updates for real-time inventory changes                  │
│  ☐ Respond to material requests                                         │
│                                                                         │
│  END OF DAY:                                                            │
│  ☐ Complete all pending handoffs                                        │
│  ☐ Update any discrepancies                                             │
│  ☐ Prepare for next day's production                                    │
│  ☐ Report any inventory issues                                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Inventory Transaction Types

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    INVENTORY TRANSACTION TYPES                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  RECEIPT                                                                 │
│  ├── When: Goods received from vendor                                   │
│  ├── Creates: Stock in location                                         │
│  └── Reference: PO number                                               │
│                                                                         │
│  ISSUE                                                                   │
│  ├── When: Materials issued to production                               │
│  ├── Creates: Stock move from PPIC to Production                        │
│  └── Reference: Handoff number                                          │
│                                                                         │
│  CONSUMPTION                                                            │
│  ├── When: Materials used in production                                 │
│  ├── Creates: Stock decrease                                            │
│  └── Reference: Task/Production Output                                  │
│                                                                         │
│  PRODUCTION_OUTPUT                                                      │
│  ├── When: Finished goods produced                                      │
│  ├── Creates: Stock in Finished Goods                                   │
│  └── Reference: Production Output number                                │
│                                                                         │
│  TRANSFER                                                               │
│  ├── When: Move between locations                                       │
│  ├── Creates: Stock move from A to B                                    │
│  └── Reference: Handoff number                                          │
│                                                                         │
│  QC_PASS                                                                │
│  ├── When: QC approves production                                       │
│  ├── Creates: Stock in Finished Goods                                   │
│  └── Reference: QC inspection number                                    │
│                                                                         │
│  QC_FAIL                                                                │
│  ├── When: QC rejects production                                        │
│  ├── Creates: Stock in Rework                                           │
│  └── Reference: QC inspection number                                    │
│                                                                         │
│  SCRAP                                                                  │
│  ├── When: Items scrapped                                               │
│  ├── Removes: Stock from inventory                                      │
│  └── Reference: QC inspection number                                    │
│                                                                         │
│  ADJUSTMENT                                                             │
│  ├── When: Manual correction                                            │
│  ├── Creates: Stock increase or decrease                                │
│  └── Reason: Required for audit                                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 8.3 Real-Time Inventory Updates (SSE)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    REAL-TIME INVENTORY UPDATES                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  HOW IT WORKS:                                                          │
│                                                                         │
│  1. Server-Sent Events (SSE) provide real-time updates                  │
│  2. All connected clients receive inventory changes instantly           │
│  3. No page refresh needed                                              │
│                                                                         │
│  WHEN UPDATES OCCUR:                                                    │
│  ├── Goods received (RECEIPT)                                           │
│  ├── Materials issued (ISSUE)                                           │
│  ├── Handoff status changed                                             │
│  ├── Production output recorded                                         │
│  ├── QC inspection completed                                            │
│  └── Stock adjustment made                                              │
│                                                                         │
│  WHAT CLIENTS SEE:                                                      │
│  ├── Inventory quantities update automatically                          │
│  ├── Handoff status changes reflected                                    │
│  ├── Dashboard metrics refresh                                          │
│  └── Low stock alerts appear/disappear                                  │
│                                                                         │
│  ENDPOINT: GET /api/inventory/events                                    │
│                                                                         │
│  CLIENT IMPLEMENTATION:                                                 │
│  const eventSource = new EventSource('/api/inventory/events');          │
│  eventSource.onmessage = (event) => {                                   │
│    const data = JSON.parse(event.data);                                 │
│    // Update UI with new inventory data                                 │
│  };                                                                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Troubleshooting & FAQs

### 9.1 Common Issues

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    COMMON ISSUES & SOLUTIONS                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ISSUE: "Dependency already exists" error                               │
│  SOLUTION:                                                              │
│  ├── Check if dependency was already created                            │
│  ├── Delete existing dependency first if needed                         │
│  └── Dependencies are hard-deleted (not soft)                           │
│                                                                         │
│  ISSUE: Select dropdown shows empty option error                        │
│  SOLUTION:                                                              │
│  ├── System has been fixed to prevent empty values                      │
│  ├── Refresh page if issue persists                                     │
│  └── Clear browser cache                                                │
│                                                                         │
│  ISSUE: Handoff creation times out                                      │
│  SOLUTION:                                                              │
│  ├── Database transactions optimized                                    │
│  ├── Try again with smaller batch                                       │
│  └── Check database connection                                          │
│                                                                         │
│  ISSUE: Duplicate handoff created                                       │
│  SOLUTION:                                                              │
│  ├── Duplicate detection now implemented                                │
│  ├── System checks existing handoffs before creating                    │
│  ├── Same MO + same materials = duplicate detected                      │
│  └── Error message shown if duplicate found                             │
│                                                                         │
│  ISSUE: Gantt chart bars not showing                                    │
│  SOLUTION:                                                              │
│  ├── Ensure tasks have plannedStartDate/endDate                        │
│  ├── Run auto-schedule to calculate dates                               │
│  └── Check task status filters                                          │
│                                                                         │
│  ISSUE: Dependency arrows not appearing                                 │
│  SOLUTION:                                                              │
│  ├── Ensure "Show Dependencies" checkbox is enabled                     │
│  ├── Check dependencies exist for visible tasks                         │
│  └── Refresh page (arrows drawn after 150ms delay)                      │
│                                                                         │
│  ISSUE: Profile page errors                                             │
│  SOLUTION:                                                              │
│  ├── Use valid user ID (user-admin, user-ppic, etc.)                    │
│  ├── demo-user-id does not exist                                        │
│  └── Settings null checks now implemented                               │
│                                                                         │
│  ISSUE: Location/Shelf creation fails                                   │
│  SOLUTION:                                                              │
│  ├── Use /api/locations with action: 'create_shelf'                     │
│  ├── /api/shelves endpoint does not exist                               │
│  └── Select dropdowns fixed for empty values                            │
│                                                                         │
│  ISSUE: Material allocation page errors                                 │
│  SOLUTION:                                                              │
│  ├── Jobsheet tasks may be null                                         │
│  ├── System now handles null task arrays                                │
│  └── Status value fixed (READY, not MATERIAL_ALLOCATED)                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 9.2 FAQ

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FREQUENTLY ASKED QUESTIONS                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Q: Can I have both internal and outsourced MOs in the same view?       │
│  A: Yes, use the unified view with filtering. Filter by:                │
│     - Internal vs External                                              │
│     - Vendor                                                            │
│     - Status                                                            │
│                                                                         │
│  Q: Is vendor selection required when creating an MO?                   │
│  A: No, vendor selection is optional. You can:                          │
│     - Create internal MO (no vendor needed)                             │
│     - Create external MO without vendor (assign later)                  │
│     - Create external MO with vendor                                    │
│                                                                         │
│  Q: Do I need to assign machine and PIC to every task?                  │
│  A: No, machine and PIC assignment is optional, especially for:         │
│     - QC tasks (inspector assigned separately)                          │
│     - Assembly tasks (team-based)                                       │
│     - General tasks without specific resources                          │
│                                                                         │
│  Q: What happens when QC fails?                                         │
│  A: System automatically:                                               │
│     1. Creates QC_FAIL inventory entry                                  │
│     2. Moves failed items to REWORK location                            │
│     3. Creates Rework Order (RW-YYYY-NNN)                              │
│     4. Links rework order to original production output                 │
│     5. PPIC can then assign rework tasks                                │
│                                                                         │
│  Q: How does auto-schedule (CPM) work?                                  │
│  A: Critical Path Method considers:                                     │
│     1. Task durations                                                   │
│     2. Dependencies (FS, SS, FF, SF)                                    │
│     3. Lag days                                                         │
│     4. Calculates optimal start/end dates                               │
│     5. Identifies critical path (zero float)                            │
│     6. Updates task dates in database                                   │
│                                                                         │
│  Q: Can I create dependencies between different MOs?                    │
│  A: Yes, MO-level dependencies are supported:                           │
│     - System connects last task of predecessor MO                       │
│     - To first task of successor MO                                     │
│     - Respects lag days                                                 │
│                                                                         │
│  Q: What are the 4 dependency types?                                    │
│  A: FS (Finish-to-Start): Most common, successor starts after           │
│     SS (Start-to-Start): Successor starts when predecessor starts       │
│     FF (Finish-to-Finish): Successor finishes when pred. finishes       │
│     SF (Start-to-Finish): Rare, successor finishes when pred. starts    │
│                                                                         │
│  Q: How do I prevent duplicate handoffs?                                │
│  A: System automatically checks:                                        │
│     - Same MO ID                                                        │
│     - Same inventory items/materials                                    │
│     - Status is CREATED (not yet moved)                                 │
│     - Returns error if duplicate found                                  │
│                                                                         │
│  Q: What user IDs are valid for profile testing?                        │
│  A: Valid user IDs:                                                     │
│     - user-admin                                                        │
│     - user-ppic                                                         │
│     - user-warehouse                                                    │
│     - user-technician                                                   │
│     - user-manager                                                      │
│     - demo-user-id does NOT exist                                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Quick Reference Cards

### 10.1 Status Workflows

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ORDER STATUS WORKFLOW                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PENDING → REVIEW → APPROVED → IN_PROGRESS → COMPLETED                 │
│     │         │          │           │                                  │
│     └─────────┴──────────┴───────────┴───────────▶ REJECTED/CANCELLED  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    HANDOFF STATUS WORKFLOW                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  CREATED → MOVED → ISSUED → CONFIRMED → COMPLETED                     │
│     │         │          │                                              │
│     └─────────┴──────────┴──────────────▶ CANCELLED                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    TASK STATUS WORKFLOW                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PENDING → ASSIGNED → RUNNING → COMPLETED                              │
│     │         │          │                                              │
│     └─────────┴──────────┴──────────────▶ PAUSED/CANCELLED             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Keyboard Shortcuts

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    KEYBOARD SHORTCUTS (Future)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Global:                                                                │
│  ├── Ctrl+K: Search                                                     │
│  ├── Ctrl+N: New Order                                                  │
│  └── Esc: Close dialog                                                  │
│                                                                         │
│  Gantt Chart:                                                           │
│  ├── +/-: Zoom in/out                                                  │
│  ├── Arrow keys: Navigate                                               │
│  └── Enter: Select/Expand                                               │
│                                                                         │
│  Tasks:                                                                 │
│  ├── Space: Clock in/out                                                │
│  └── R: Record output                                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 10.3 Inventory Locations Reference

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    INVENTORY LOCATIONS                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  MAIN_WAREHOUSE                                                         │
│  ├── Primary storage area                                               │
│  ├── Organized by shelves (SHELF-A1, SHELF-B2, etc.)                   │
│  └── Used for incoming goods and bulk storage                           │
│                                                                         │
│  PPIC_RACK                                                              │
│  ├── Materials allocated for production                                 │
│  ├── Staging area before production                                     │
│  └── PPIC manages this area                                             │
│                                                                         │
│  PRODUCTION_FLOOR                                                       │
│  ├── Materials in use                                                   │
│  ├── Active production area                                             │
│  └── Technicians confirm receipt here                                   │
│                                                                         │
│  FINISHED_GOODS                                                         │
│  ├── Completed products ready for shipping                              │
│  ├── After QC pass                                                      │
│  └── Marketing/Shipping manages                                         │
│                                                                         │
│  REWORK                                                                 │
│  ├── Items needing rework                                               │
│  ├── After QC fail                                                      │
│  └── PPIC schedules rework from here                                    │
│                                                                         │
│  SCRAP                                                                  │
│  ├── Rejected items                                                     │
│  ├── Awaiting disposal                                                  │
│  └── For reporting and analysis                                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 10.4 API Quick Reference

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    API ENDPOINTS QUICK REFERENCE                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ORDERS                                                                 │
│  ├── GET  /api/orders             - List orders                        │
│  ├── POST /api/orders             - Create order                       │
│  ├── GET  /api/orders/[id]        - Get order details                  │
│  └── PUT  /api/orders/[id]        - Update order                       │
│                                                                         │
│  MANUFACTURING ORDERS                                                   │
│  ├── GET  /api/mo                 - List MOs                           │
│  ├── POST /api/mo                 - Create MO                          │
│  ├── GET  /api/mo/[id]/materials  - Get MO materials                   │
│  └── POST /api/mo/[id]/materials/allocate - Allocate materials         │
│                                                                         │
│  HANDOFFS                                                               │
│  ├── GET  /api/handoffs           - List handoffs                      │
│  ├── POST /api/handoffs           - Create/handle handoff              │
│  └── GET  /api/handoffs/[id]      - Get handoff details                │
│                                                                         │
│  PRODUCTION                                                             │
│  ├── GET  /api/production-output/tasks - Get tasks for output          │
│  ├── POST /api/production-output       - Record output                 │
│  └── POST /api/production-output/[id]/qc - Submit QC                   │
│                                                                         │
│  INVENTORY                                                              │
│  ├── GET  /api/inventory          - List inventory                     │
│  ├── POST /api/inventory          - Update inventory                   │
│  └── GET  /api/inventory/events   - SSE endpoint (real-time)           │
│                                                                         │
│  DEPENDENCIES                                                           │
│  ├── GET  /api/dependencies       - List dependencies                  │
│  ├── POST /api/dependencies       - Create dependency                  │
│  └── DELETE /api/dependencies/[id] - Delete dependency                 │
│                                                                         │
│  EXECUTION PLAN                                                         │
│  ├── GET  /api/execution-plan     - Get execution plan                 │
│  └── POST /api/execution-plan     - Run auto-schedule                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Appendix: Glossary

| Term | Definition |
|------|------------|
| **MO** | Manufacturing Order - Production batch for a product |
| **Jobsheet** | Work instructions and material requirements for a production stage |
| **Task** | Individual work unit within a jobsheet |
| **MRP** | Material Requirements Planning - Calculates materials needed |
| **CPM** | Critical Path Method - Scheduling algorithm |
| **QC** | Quality Control - Inspection process |
| **PPIC** | Production Planning & Inventory Control department |
| **SSE** | Server-Sent Events - Real-time update protocol |
| **Ledger** | Complete transaction history for inventory |
| **Handoff** | Material transfer between locations |
| **Dependency** | Relationship between tasks affecting scheduling |
| **Critical Path** | Tasks with zero scheduling flexibility |
| **FS/SS/FF/SF** | Dependency types (Finish-to-Start, etc.) |

---

*ManuOS - Manufacturing Operating System*
*Complete Guidebook - Version 1.0*
*Last Updated: May 2026*
