# Material Flow Diagrams & Process Documentation
# ManuOS - Manufacturing Operating System

**Document Version**: 1.0
**Last Updated**: May 2026
**Purpose**: Complete documentation of material flows, handoffs, and inventory transitions

---

## Table of Contents

1. [Overview](#1-overview)
2. [Core Material Flow States](#2-core-material-flow-states)
3. [Warehouse Receipt Process](#3-warehouse-receipt-process)
4. [Material Allocation Process](#4-material-allocation-process)
5. [Material Handoff Process](#5-material-handoff-process)
6. [Production Execution Flow](#6-production-execution-flow)
7. [Quality Control Flow](#7-quality-control-flow)
8. [Inventory Ledger Operations](#8-inventory-ledger-operations)
9. [Complete End-to-End Flow](#9-complete-end-to-end-flow)
10. [Edge Cases & Error Handling](#10-edge-cases--error-handling)

---

## 1. Overview

### 1.1 Purpose

This document describes the complete material flow through ManuOS, from warehouse receipt to finished goods. Every material movement is tracked in the inventory ledger for full traceability.

### 1.2 Key Concepts

- **Inventory Ledger**: Central tracking system for all material movements
- **Material Handoff**: Transfer of materials between locations/people
- **Production Output**: Recording of production results (good/rework/scrap)
- **QC Integration**: Automatic inventory updates based on quality decisions

---

## 2. Core Material Flow States

### 2.1 Inventory Location States

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      INVENTORY LOCATION FLOW                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│    ┌──────────────┐         ┌──────────────┐         ┌──────────────┐  │
│    │   RECEIVING  │────────▶│  MAIN STOCK  │────────▶│   PPIC RACK  │  │
│    │   (Dock)     │  Issue  │  (Warehouse) │ Allocate│  (Planning)  │  │
│    └──────────────┘         └──────────────┘         └───────┬──────┘  │
│                                                    Issue    │         │
│                                                             ▼         │
│    ┌──────────────┐         ┌──────────────┐         ┌──────────────┐  │
│    │   FINISHED   │◀────────│  PRODUCTION  │◀────────│  PRODUCTION  │  │
│    │    GOODS     │  QC Pass │    FLOOR     │  Receipt│    FLOOR     │  │
│    │  (Shipping)  │         │  (Material)  │         │   (Output)   │  │
│    └──────────────┘         └───────┬──────┘         └──────────────┘  │
│                                     │                                   │
│                                     │ QC Fail                          │
│                                     ▼                                   │
│                            ┌──────────────┐                            │
│                            │   REWORK     │                            │
│                            │   STORAGE    │                            │
│                            └──────────────┘                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Inventory Transaction Types

| Transaction Type | Description | Source | Destination |
|-----------------|-------------|--------|-------------|
| `RECEIPT` | Goods received from vendor | External | Inventory |
| `ISSUE` | Material issued from stock | Inventory | Production |
| `CONSUMPTION` | Material consumed in production | Production | WIP |
| `PRODUCTION_OUTPUT` | Finished goods produced | WIP | Finished Goods |
| `TRANSFER` | Move between locations | Location A | Location B |
| `ADJUSTMENT` | Manual inventory adjustment | - | - |
| `QC_PASS` | QC approved items | WIP | Finished Goods |
| `QC_FAIL` | QC rejected items | WIP | Rework |
| `REWORK_CONSUMPTION` | Material used in rework | Rework | WIP |
| `SCRAP` | Scrapped items | WIP | Scrap |

---

## 3. Warehouse Receipt Process

### 3.1 Process Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WAREHOUSE RECEIPT PROCESS                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌──────────┐ │
│  │  Purchase   │    │  Receive    │    │  Inspect    │    │ Put Away │ │
│  │   Order     │───▶│  Shipment   │───▶│   Goods     │───▶│  Stock   │ │
│  │  (PO-XXX)   │    │             │    │             │    │          │ │
│  └─────────────┘    └─────────────┘    └─────────────┘    └──────────┘ │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Inventory Ledger Entry                                         │   │
│  │  Type: RECEIPT                                                  │   │
│  │  From: VENDOR                                                   │   │
│  │  To: WAREHOUSE (Location/Shelf)                                 │   │
│  │  Reference: PO-XXX, Delivery Note                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Step-by-Step Procedure

| Step | Action | User | System |
|------|--------|------|--------|
| 1 | Purchase Order created | PPIC | PO number generated |
| 2 | Vendor ships materials | Vendor | - |
| 3 | Receive shipment at dock | Warehouse | Create receipt record |
| 4 | Inspect goods quality | Warehouse | Record inspection results |
| 5 | Update PO status to Received | Warehouse | Status updated |
| 6 | Put away to storage location | Warehouse | Inventory updated via ledger |
| 7 | SSE event emitted | System | Real-time update to all clients |

### 3.3 Inventory Ledger Entry Example

```typescript
{
  type: 'RECEIPT',
  materialId: 'mat-001',
  quantity: 100,
  fromLocation: null, // External vendor
  toLocation: 'shelf-A1',
  reference: 'PO-2026-001',
  notes: 'Steel sheets from Vendor XYZ',
  performedBy: 'user-warehouse',
  tenantId: 'tenant_ypti'
}
```

---

## 4. Material Allocation Process

### 4.1 Process Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MATERIAL ALLOCATION PROCESS                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌──────────┐ │
│  │  Calculate  │    │  Check      │    │  Allocate   │    │ Reserve  │ │
│  │  MRP        │───▶│  Stock      │───▶│  to         │───▶│ Materials│ │
│  │             │    │  Availability│    │  Jobsheet   │    │          │ │
│  └─────────────┘    └─────────────┘    └─────────────┘    └──────────┘ │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Inventory Ledger Entry                                         │   │
│  │  Type: ALLOCATION                                               │   │
│  │  From: WAREHOUSE                                                │   │
│  │  To: JOBSHEET (Allocated)                                       │   │
│  │  Reference: JS-XXX                                              │   │
│  │  Status: Reserved (not yet issued)                              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 MRP Calculation Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         MRP CALCULATION FLOW                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐                                                   │
│  │  Manufacturing  │                                                   │
│  │  Order (MO)     │                                                   │
│  └────────┬────────┘                                                   │
│           │                                                             │
│           ▼                                                             │
│  ┌─────────────────┐                                                   │
│  │    Recipe/BOM   │                                                   │
│  │  - Material A   │                                                   │
│  │  - Material B   │                                                   │
│  │  - Material C   │                                                   │
│  └────────┬────────┘                                                   │
│           │                                                             │
│           ▼                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    │
│  │  Calculate Qty  │───▶│  Check Stock    │───▶│  Generate       │    │
│  │  Required       │    │  Availability   │    │  Requirements   │    │
│  │  (Qty × Order)  │    │                 │    │                 │    │
│  └─────────────────┘    └────────┬────────┘    └────────┬────────┘    │
│                                  │                      │              │
│                    ┌─────────────┴──────────────┐       │              │
│                    ▼                            ▼       │              │
│           ┌─────────────┐              ┌─────────────┐ │              │
│           │   In Stock  │              │  Need to    │ │              │
│           │   (Green)   │              │  Order      │ │              │
│           │             │              │  (Red)      │ │              │
│           └─────────────┘              └─────────────┘ │              │
│                                                         │              │
│                                                          ▼              │
│                                                  ┌─────────────┐       │
│                                                  │  Purchase   │       │
│                                                  │  Request    │       │
│                                                  └─────────────┘       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Allocation Status Flow

```
Material Allocation Status:

PENDING ──────────▶ ALLOCATED ──────────▶ ISSUED ──────────▶ CONSUMED
   │                    │                    │                    │
   │ (Reserved)         │ (Allocated)        │ (To Production)   │ (Used)
   │                    │                    │                    │
   ▼                    ▼                    ▼                    ▼
┌─────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│ Stock   │      │ Allocated   │      │ In Transit  │      │ WIP         │
│ Reserved│      │ to Jobsheet │      │ to Floor    │      │ (Consumed)  │
└─────────┘      └─────────────┘      └─────────────┘      └─────────────┘
```

---

## 5. Material Handoff Process

### 5.1 Handoff Types

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      MATERIAL HANDOFF TYPES                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. MOVE_TO_PPIC                                                       │
│     WAREHOUSE ──────────────────────────────────────────▶ PPIC RACK    │
│                                                                         │
│  2. ISSUE_TO_PRODUCTION                                                │
│     PPIC RACK ─────────────────────────────────────────▶ PRODUCTION   │
│                                                                         │
│  3. CONFIRM_RECEIPT                                                    │
│     PRODUCTION (Pending) ──────────────────────────────▶ PRODUCTION    │
│     (Confirm materials received at production floor)        (Confirmed)│
│                                                                         │
│  4. MOVE_TO_PRODUCTION                                                 │
│     WAREHOUSE ──────────────────────────────────────────▶ PRODUCTION   │
│     (Direct issuance, skips PPIC rack)                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Complete Handoff Lifecycle

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    HANDOFF LIFECYCLE                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐                                                       │
│  │   CREATED   │                                                       │
│  │  (Pending)  │                                                       │
│  └──────┬──────┘                                                       │
│         │                                                               │
│         ▼                                                               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                 │
│  │   MOVED     │───▶│   ISSUED    │───▶│  CONFIRMED  │                 │
│  │  to PPIC    │    │  to PROD    │    │   Receipt   │                 │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘                 │
│         │                  │                  │                         │
│         │                  │                  ▼                         │
│         │                  │          ┌─────────────┐                  │
│         │                  │          │  COMPLETED  │                  │
│         │                  │          │  (Done)     │                  │
│         │                  │          └─────────────┘                  │
│         │                  │                                            │
│         └──────────────────┴────────────────────────────────────────────│
│                            │                                            │
│                            ▼                                            │
│                   ┌─────────────────┐                                   │
│                   │   CANCELLED     │                                   │
│                   │  (At any step)  │                                   │
│                   └─────────────────┘                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Handoff Actions & Inventory Updates

| Action | From Location | To Location | Ledger Entry | Status Change |
|--------|---------------|-------------|--------------|---------------|
| `move_to_ppic` | WAREHOUSE | PPIC_RACK | TRANSFER | CREATED → MOVED |
| `issue_to_production` | PPIC_RACK | PRODUCTION_FLOOR | ISSUE | MOVED → ISSUED |
| `confirm_receipt` | PRODUCTION_FLOOR (pending) | PRODUCTION_FLOOR (confirmed) | - | ISSUED → CONFIRMED |
| `cancel` | - | - | - | Any → CANCELLED |

### 5.4 Handoff API Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    HANDOFF API REQUEST FLOW                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  POST /api/handoffs                                                    │
│  {                                                                      │
│    "action": "move_to_ppic",                                           │
│    "handoffId": "handoff-001"                                          │
│  }                                                                      │
│         │                                                               │
│         ▼                                                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  1. Validate handoff exists and is in correct status            │   │
│  │  2. Check for duplicate handoff (same materials, same MO)       │   │
│  │  3. Update handoff status                                        │   │
│  │  4. Create inventory transfer entry (if location changes)       │   │
│  │  5. Emit SSE event for real-time update                         │   │
│  │  6. Return updated handoff                                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│         │                                                               │
│         ▼                                                               │
│  SSE /api/inventory/events                                             │
│  {                                                                      │
│    "type": "handoff_update",                                           │
│    "handoffId": "handoff-001",                                         │
│    "status": "MOVED",                                                  │
│    "inventoryUpdates": [...]                                            │
│  }                                                                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Production Execution Flow

### 6.1 Task Execution Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    TASK EXECUTION FLOW                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌──────────┐ │
│  │  Clock In   │    │  Execute    │    │  Record     │    │ Complete │ │
│  │  to Task    │───▶│  Work       │───▶│  Output     │───▶│  Task    │ │
│  │             │    │             │    │             │    │          │ │
│  └─────────────┘    └─────────────┘    └─────────────┘    └──────────┘ │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Production Output Entry                                        │   │
│  │  Type: PRODUCTION_OUTPUT                                        │   │
│  │  Good: 85                                                       │   │
│  │  Rework: 10                                                     │   │
│  │  Scrap: 5                                                       │   │
│  │  Reference: TASK-XXX                                            │   │
│  │  QC Status: PENDING                                             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Production Output Recording

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PRODUCTION OUTPUT PROCESS                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐                                                   │
│  │  Technician     │                                                   │
│  │  Records Output │                                                   │
│  └────────┬────────┘                                                   │
│           │                                                             │
│           ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  POST /api/production-output                                    │   │
│  │  {                                                              │   │
│  │    "taskId": "task-001",                                        │   │
│  │    "goodQuantity": 85,                                          │   │
│  │    "reworkQuantity": 10,                                        │   │
│  │    "scrapQuantity": 5,                                          │   │
│  │    "notes": "Production run for order XYZ"                      │   │
│  │  }                                                              │   │
│  └────────┬────────────────────────────────────────────────────────┘   │
│           │                                                             │
│           ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  System Creates ProductionOutput Record                         │   │
│  │  - Generates unique PO number (PO-YYYY-NNN)                    │   │
│  │  - Links to task, jobsheet, MO, order                           │   │
│  │  - Sets QC status to PENDING                                    │   │
│  └────────┬────────────────────────────────────────────────────────┘   │
│           │                                                             │
│           ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Inventory Ledger Entry (CONSUMPTION)                           │   │
│  │  - Materials consumed from production floor                     │   │
│  │  - Type: CONSUMPTION                                            │   │
│  │  - Quantity: Total input quantity                               │   │
│  └────────┬────────────────────────────────────────────────────────┘   │
│           │                                                             │
│           ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Inventory Ledger Entry (PRODUCTION_OUTPUT)                     │   │
│  │  - Finished goods created                                       │   │
│  │  - Type: PRODUCTION_OUTPUT                                      │   │
│  │  - Quantities: Good, Rework, Scrap tracked separately           │   │
│  │  - Status: PENDING_QC                                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Quality Control Flow

### 7.1 QC Inspection Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    QUALITY CONTROL FLOW                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                 │
│  │  QC Request │    │  Perform    │    │  Record     │                 │
│  │  Received   │───▶│  Inspection │───▶│  Results    │                 │
│  │             │    │             │    │             │                 │
│  └─────────────┘    └─────────────┘    └──────┬──────┘                 │
│                                               │                        │
│                                               │                        │
│                    ┌──────────────────────────┴─────────────────────┐  │
│                    │                                                │  │
│                    ▼                                                ▼  │
│           ┌─────────────┐                                  ┌──────────┐ │
│           │  QC PASS    │                                  │ QC FAIL  │ │
│           └──────┬──────┘                                  └────┬─────┘ │
│                  │                                               │      │
│                  ▼                                               ▼      │
│  ┌──────────────────────────┐                    ┌────────────────────┐ │
│  │  FINISHED GOODS INVENTORY│                    │  REWORK ORDER      │ │
│  │  - Good quantity added   │                    │  - Auto-created    │ │
│  │  - Rework moved to WIP   │                    │  - Linked to orig  │ │
│  │  - Scrap removed         │                    │  - New tasks       │ │
│  └──────────────────────────┘                    └────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.2 QC Decision Matrix

| QC Result | Good Qty | Rework Qty | Scrap Qty | Inventory Action | Order Action |
|-----------|----------|------------|-----------|------------------|--------------|
| **PASS** | X | 0 | 0 | Good → FG, no rework | - |
| **PARTIAL PASS** | X | Y | 0 | Good → FG, Rework → WIP | Rework order created |
| **FAIL** | 0 | X | 0 | All → WIP | Rework order created |
| **SCRAP** | 0 | 0 | X | All → Scrap | - |

### 7.3 QC Inventory Updates

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    QC INVENTORY UPDATES                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  BEFORE QC:                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Production Output (PO-2026-001)                                │   │
│  │  - Good: 85 (in WIP)                                            │   │
│  │  - Rework: 10 (in WIP)                                          │   │
│  │  - QC Status: PENDING                                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  AFTER QC (PASS):                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Inventory Ledger Entries:                                      │   │
│  │  1. QC_PASS: 85 units WIP → FINISHED_GOODS                     │   │
│  │  2. Type: QC_PASS                                               │   │
│  │  3. Reference: PO-2026-001, QC-001                             │   │
│  │                                                                  │   │
│  │  Production Output Status: COMPLETED                             │   │
│  │  QC Status: PASS                                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  AFTER QC (PARTIAL PASS - 70 good, 10 rework, 5 scrap):               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Inventory Ledger Entries:                                      │   │
│  │  1. QC_PASS: 70 units WIP → FINISHED_GOODS                     │   │
│  │  2. QC_FAIL: 10 units WIP → REWORK                             │   │
│  │  3. SCRAP: 5 units WIP → SCRAP                                  │   │
│  │  4. Reference: PO-2026-001, QC-001                             │   │
│  │                                                                  │   │
│  │  Rework Order Created: RW-2026-001                              │   │
│  │  - Quantity: 10                                                 │   │
│  │  - Linked to: PO-2026-001                                       │   │
│  │  - Status: CREATED                                              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.4 Rework Order Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    REWORK ORDER FLOW                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌──────────┐ │
│  │  Rework     │    │  Assign     │    │  Execute    │    │  QC      │ │
│  │  Order      │───▶│  Tasks      │───▶│  Rework     │───▶│  Re-inspect│
│  │  Created    │    │             │    │             │    │          │ │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────┬────┘ │
│                                                                  │      │
│                         ┌────────────────────────────────────────┴──┐  │
│                         │                                          │  │
│                         ▼                                          ▼  │
│                  ┌─────────────┐                            ┌─────────┐│
│                  │  QC PASS    │                            │ QC FAIL ││
│                  └──────┬──────┘                            └────┬────┘│
│                         │                                        │     │
│                         ▼                                        ▼     │
│            ┌───────────────────────┐                ┌─────────────────┐│
│            │ FINISHED GOODS INVENTORY│               │ ANOTHER REWORK  ││
│            │ OR BACK TO PRODUCTION  │               │ ORDER CREATED   ││
│            └───────────────────────┘                └─────────────────┘│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Inventory Ledger Operations

### 8.1 Ledger Entry Structure

```typescript
interface InventoryLedgerEntry {
  id: string;
  type: InventoryTransactionType;
  materialId: string;
  quantity: number;
  unit: string;
  fromLocation: string | null;
  toLocation: string | null;
  reference: string; // PO, MO, Task, Handoff reference
  notes: string;
  performedBy: string;
  tenantId: string;
  createdAt: Date;
  
  // Calculated fields
  runningBalance: number;
  isVoid: boolean;
  voidReason: string | null;
}
```

### 8.2 Transaction Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    INVENTORY LEDGER TRANSACTION FLOW                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         API REQUEST                             │   │
│  │                    (POST /api/inventory)                        │   │
│  └────────────────────────────────┬────────────────────────────────┘   │
│                                   │                                     │
│                                   ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    VALIDATE REQUEST                             │   │
│  │  - Check material exists                                        │   │
│  │  - Check location exists                                        │   │
│  │  - Validate quantities                                          │   │
│  │  - Check permissions                                            │   │
│  └────────────────────────────────┬────────────────────────────────┘   │
│                                   │                                     │
│                                   ▼                                     │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    BEGIN TRANSACTION                            │   │
│  │  - Atomic database operation                                    │   │
│  │  - Create ledger entry                                          │   │
│  │  - Update inventory balances                                    │   │
│  │  - Update stock levels                                          │   │
│  └────────────────────────────────┬────────────────────────────────┘   │
│                                   │                                     │
│                    ┌──────────────┴──────────────┐                      │
│                    │                             │                      │
│                    ▼                             ▼                      │
│           ┌─────────────┐               ┌─────────────┐                │
│           │  SUCCESS    │               │   FAILURE   │                │
│           │  - Commit   │               │  - Rollback │                │
│           │  - Emit SSE │               │  - Return   │                │
│           │  - Return   │               │    Error    │                │
│           └─────────────┘               └─────────────┘                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 8.3 Stock Level Calculation

```
Current Stock = Opening Balance
              + SUM(RECEIPT)
              - SUM(ISSUE)
              - SUM(CONSUMPTION)
              + SUM(PRODUCTION_OUTPUT)
              + SUM(ADJUSTMENT positive)
              - SUM(ADJUSTMENT negative)
              + SUM(QC_PASS to this location)
              - SUM(QC_FAIL from this location)
```

---

## 9. Complete End-to-End Flow

### 9.1 Full Order-to-Delivery Material Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE ORDER-TO-DELIVERY FLOW                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PHASE 1: ORDER CREATION                                                │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Customer Order ──▶ Manufacturing Order ──▶ Jobsheet ──▶ Tasks  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                   │                                     │
│                                   ▼                                     │
│  PHASE 2: MATERIAL PLANNING                                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  MRP Calculation ──▶ Check Stock ──▶ Purchase Request ──▶ PO   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                   │                                     │
│                                   ▼                                     │
│  PHASE 3: WAREHOUSE RECEIPT                                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Vendor Delivery ──▶ Receive ──▶ Inspect ──▶ Put Away          │   │
│  │                                                                    │   │
│  │  [LEDGER: RECEIPT]                                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                   │                                     │
│                                   ▼                                     │
│  PHASE 4: MATERIAL ALLOCATION                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Allocate to Jobsheet ──▶ Reserve Materials                     │   │
│  │                                                                    │   │
│  │  [LEDGER: ALLOCATION]                                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                   │                                     │
│                                   ▼                                     │
│  PHASE 5: MATERIAL HANDOFF                                              │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Move to PPIC Rack ──▶ Issue to Production ──▶ Confirm Receipt  │   │
│  │                                                                    │   │
│  │  [LEDGER: TRANSFER, ISSUE]                                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                   │                                     │
│                                   ▼                                     │
│  PHASE 6: PRODUCTION EXECUTION                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Task Clock In ──▶ Execute ──▶ Record Output ──▶ Clock Out     │   │
│  │                                                                    │   │
│  │  [LEDGER: CONSUMPTION, PRODUCTION_OUTPUT]                        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                   │                                     │
│                                   ▼                                     │
│  PHASE 7: QUALITY CONTROL                                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  QC Inspection ──▶ Pass/Fail Decision                           │   │
│  │                                                                    │   │
│  │  PASS: [LEDGER: QC_PASS → FINISHED_GOODS]                       │   │
│  │  FAIL: [LEDGER: QC_FAIL → REWORK] + Create Rework Order         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                   │                                     │
│                                   ▼                                     │
│  PHASE 8: REWORK (if needed)                                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Rework Order ──▶ Execute ──▶ QC Re-inspect ──▶ Pass/Scrap     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Real-Time Updates Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    REAL-TIME UPDATE FLOW                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Client A (Warehouse)                                           │   │
│  │  - Creates handoff                                              │   │
│  └────────────────────────┬────────────────────────────────────────┘   │
│                           │                                             │
│                           ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  POST /api/handoffs                                             │   │
│  │  { action: "move_to_ppic", ... }                                │   │
│  └────────────────────────┬────────────────────────────────────────┘   │
│                           │                                             │
│                           ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Server Processing                                              │   │
│  │  1. Update handoff status                                       │   │
│  │  2. Update inventory ledger                                     │   │
│  │  3. Update stock levels                                         │   │
│  └────────────────────────┬────────────────────────────────────────┘   │
│                           │                                             │
│                           ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  SSE Event Emission                                             │   │
│  │  GET /api/inventory/events                                      │   │
│  │  Event: { type: "handoff_update", ... }                         │   │
│  └────────────────────────┬────────────────────────────────────────┘   │
│                           │                                             │
│            ┌──────────────┴──────────────┐                             │
│            │                             │                             │
│            ▼                             ▼                             │
│  ┌──────────────────────┐    ┌──────────────────────┐                  │
│  │  Client B (PPIC)     │    │  Client C (Manager)  │                  │
│  │  - Receives event    │    │  - Receives event    │                  │
│  │  - Updates UI        │    │  - Updates dashboard │                  │
│  └──────────────────────┘    └──────────────────────┘                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Edge Cases & Error Handling

### 10.1 Duplicate Handoff Prevention

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DUPLICATE HANDOFF DETECTION                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Scenario: User clicks "Move to PPIC" multiple times                   │
│                                                                         │
│  ┌─────────────────┐                                                   │
│  │  First Click    │                                                   │
│  │  - moId: "001"  │                                                   │
│  │  - materials:   │                                                   │
│  │    ["A", "B"]   │                                                   │
│  └────────┬────────┘                                                   │
│           │                                                             │
│           ▼                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Check for existing handoff:                                    │   │
│  │  - Same moId                                                    │   │
│  │  - Same materials (compare inventory items)                     │   │
│  │  - Status: CREATED (not yet moved)                              │   │
│  │  - Action: move_to_ppic                                         │   │
│  └────────┬────────────────────────────────────────────────────────┘   │
│           │                                                             │
│           ▼                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                            │
│  │  Found Existing │    │  Not Found      │                            │
│  │  - Return error │    │  - Create new   │                            │
│  │  - "Already     │    │  handoff        │                            │
│  │    exists"      │    │                 │                            │
│  └─────────────────┘    └─────────────────┘                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Stock Availability Check

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    STOCK AVAILABILITY CHECK                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Before issuing material to production:                                │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Available Stock = Current Stock                               │   │
│  │                    - Allocated (to other jobsheets)             │   │
│  │                    - In Transit (pending handoffs)              │   │
│  │                    - Reserved (for other orders)                │   │
│  └────────────────────────┬────────────────────────────────────────┘   │
│                           │                                             │
│                           ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  IF Available >= Required                                       │   │
│  │    - Proceed with handoff                                       │   │
│  │  ELSE                                                           │   │
│  │    - Show insufficient stock error                              │   │
│  │    - Suggest alternatives:                                      │   │
│  │      1. Wait for incoming stock                                 │   │
│  │      2. Request purchase                                        │   │
│  │      3. Reduce order quantity                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 10.3 QC Re-inspection Handling

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    QC RE-INSPECTION HANDLING                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Rework Order: RW-2026-001                                             │
│  Original Defect: 10 units                                             │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  First Re-inspection:                                           │   │
│  │  - 8 units pass                                                 │   │
│  │  - 2 units still defective                                      │   │
│  │                                                                  │   │
│  │  Actions:                                                       │   │
│  │  - 8 units → FINISHED_GOODS (QC_PASS)                          │   │
│  │  - 2 units stay in REWORK                                       │   │
│  │  - RW-2026-001 status: PARTIALLY_COMPLETED                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Second Re-inspection:                                          │   │
│  │  - 1 unit passes                                                │   │
│  │  - 1 unit still defective                                       │   │
│  │                                                                  │   │
│  │  Actions:                                                       │   │
│  │  - 1 unit → FINISHED_GOODS (QC_PASS)                           │   │
│  │  - 1 unit → SCRAP (decided to scrap remaining)                  │   │
│  │  - RW-2026-001 status: COMPLETED                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Appendix A: API Endpoints Reference

### Inventory & Handoff APIs

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/inventory` | GET | List inventory items |
| `/api/inventory` | POST | Create/update inventory (ledger entry) |
| `/api/inventory/events` | GET | SSE endpoint for real-time updates |
| `/api/handoffs` | GET | List handoffs |
| `/api/handoffs` | POST | Create/handle handoff action |
| `/api/handoffs/[id]` | GET | Get handoff details |
| `/api/mo/[id]/materials` | GET | Get MO material requirements |
| `/api/mo/[id]/materials/allocate` | POST | Allocate materials |
| `/api/production-output` | POST | Record production output |
| `/api/production-output/tasks/[id]/qc` | POST | Submit QC inspection |

---

## Appendix B: Status Enumerations

### Handoff Status

```typescript
enum HandoffStatus {
  CREATED = 'CREATED',      // Initial state
  MOVED = 'MOVED',          // Moved to PPIC rack
  ISSUED = 'ISSUED',        // Issued to production
  CONFIRMED = 'CONFIRMED',  // Receipt confirmed
  COMPLETED = 'COMPLETED',  // Handoff complete
  CANCELLED = 'CANCELLED'   // Handoff cancelled
}
```

### Inventory Transaction Type

```typescript
enum InventoryTransactionType {
  RECEIPT = 'RECEIPT',
  ISSUE = 'ISSUE',
  CONSUMPTION = 'CONSUMPTION',
  PRODUCTION_OUTPUT = 'PRODUCTION_OUTPUT',
  TRANSFER = 'TRANSFER',
  ADJUSTMENT = 'ADJUSTMENT',
  QC_PASS = 'QC_PASS',
  QC_FAIL = 'QC_FAIL',
  REWORK_CONSUMPTION = 'REWORK_CONSUMPTION',
  SCRAP = 'SCRAP'
}
```

---

**Document End**
