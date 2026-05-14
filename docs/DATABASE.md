# Database Schema Documentation
# ManuOS - Manufacturing Operating System

**Version**: 2.0
**Last Updated**: May 2026
**Database**: SQLite (Development) / PostgreSQL (Production)

---

## Overview

ManuOS uses Prisma ORM for database management. The schema supports multi-tenant architecture with comprehensive manufacturing workflows.

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ORGANIZATION LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Tenant ─────┬──── User ──── Role ──── Permission                               │
│              │                                                                   │
│              ├──── BusinessUnit                                                  │
│              │                                                                   │
│              ├──── Board                                                         │
│              │                                                                   │
│              └──── SystemSettings                                                │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ORDER MANAGEMENT                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Order ───── ManufacturingOrder ──── Recipe ──── RecipeIngredient               │
│              │                                                                   │
│              ├── Jobsheet ──── MachiningTask ──── ProductionOutput              │
│              │                     │                    │                        │
│              │                     │                    └── QualityCheck         │
│              │                     │                         │                   │
│              │                     └── MaterialHandoff ──────┘                   │
│              │                              │                                    │
│              │                              └── MaterialHandoffItem              │
│              │                                                                   │
│              ├── MaterialRequirement ──── JobsheetMaterial                       │
│              │                                             │                      │
│              │                                             └── TaskMaterialAllocation
│              │                                                                   │
│              ├── VendorOrder ──── VendorOrderItem                                │
│              │                                                                   │
│              └── ReworkOrder ──── ReworkOrderItem ──── ReworkTask                │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              INVENTORY LAYER                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Location ──── Shelf ──── Inventory ──── InventoryTransaction                   │
│                      │                                                           │
│                      └── InventoryReservation                                   │
│                                                                                 │
│  Supplier ──── PurchaseOrder ──── PurchaseOrderItem                             │
│                    │                                                             │
│                    └── PurchaseRequest ──── PurchaseRequestItem                 │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              EQUIPMENT LAYER                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Machine ──── Breakdown                                                         │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Tables

### Organization Tables

#### Tenant
Multi-tenant support table.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK | Unique identifier |
| name | String | Required | Tenant name |
| slug | String | Unique | URL-friendly identifier |
| logoUrl | String? | Optional | Logo URL |
| settings | Json? | Optional | Tenant settings |
| isActive | Boolean | Default: true | Active status |
| createdAt | DateTime | Default: now() | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Indexes:**
- `slug` (unique)

#### User
System users with role-based access.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK | Unique identifier |
| tenantId | String | FK → Tenant | Tenant reference |
| email | String | Required | Email address |
| name | String? | Optional | Display name |
| phone | String? | Optional | Phone number |
| roleId | String | FK → Role | Role reference |
| passwordHash | String | Required | Hashed password |
| employeeId | String? | Optional | Employee ID |
| avatarUrl | String? | Optional | Avatar URL |
| isActive | Boolean | Default: true | Active status |
| lastLoginAt | DateTime? | Optional | Last login |
| createdAt | DateTime | Default: now() | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Indexes:**
- `(tenantId, email)` (unique)
- `tenantId`
- `roleId`
- `email`

#### Role
User roles with permissions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK | Unique identifier |
| name | String | Required | Role name |
| code | String | Unique | Role code (ROLE_ADMIN, etc.) |
| description | String? | Optional | Role description |
| isSystem | Boolean | Default: false | System role flag |
| createdAt | DateTime | Default: now() | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Predefined Roles:**
- `ROLE_SUPER_ADMIN` - Full system access
- `ROLE_ADMIN` - Tenant admin
- `ROLE_PPIC` - Production planning
- `ROLE_MANAGER` - Approvals and oversight
- `ROLE_TECHNICIAN` - Shop floor execution
- `ROLE_WAREHOUSE` - Inventory management
- `ROLE_MARKETING` - Customer relations
- `ROLE_DRAFTER` - Technical documentation

---

### Order Management Tables

#### Order
Customer orders.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK | Unique identifier |
| tenantId | String | FK → Tenant | Tenant reference |
| orderNumber | String | Required | Order number (ORD-YYYY-NNN) |
| customerName | String | Required | Customer name |
| customerEmail | String? | Optional | Customer email |
| customerPhone | String? | Optional | Customer phone |
| status | OrderStatus | Default: DRAFT | Order status |
| boardId | String | FK → Board | Kanban board reference |
| priority | String | Default: MEDIUM | Priority level |
| plannedStartDate | DateTime? | Optional | Planned start |
| plannedEndDate | DateTime? | Optional | Planned end |
| actualStartDate | DateTime? | Optional | Actual start |
| actualEndDate | DateTime? | Optional | Actual end |
| progressPercent | Float | Default: 0 | Progress percentage |
| notes | String? | Optional | Notes |
| createdBy | String? | Optional | Creator user ID |
| createdAt | DateTime | Default: now() | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Status Values:**
- `DRAFT` - Initial state
- `PLANNING` - Being planned
- `MATERIAL_PREPARATION` - Materials being prepared
- `IN_PRODUCTION` - In production
- `QC` - Quality control
- `COMPLETED` - Completed
- `CANCELLED` - Cancelled

**Indexes:**
- `(tenantId, orderNumber)` (unique)
- `tenantId`
- `boardId`
- `status`

#### ManufacturingOrder
Production orders within customer orders.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK | Unique identifier |
| tenantId | String | FK → Tenant | Tenant reference |
| orderId | String | FK → Order | Parent order |
| moNumber | String | Required | MO number (MO-NNN) |
| name | String | Required | MO name |
| description | String? | Optional | Description |
| type | String | Default: STANDARD | MO type |
| isOutsourced | Boolean | Default: false | Outsourced flag |
| outsourcedType | String? | Optional | Outsourcing type |
| vendorId | String? | FK → Supplier | Vendor reference |
| vendorOrderNumber | String? | Optional | Vendor PO number |
| vendorQuoteNumber | String? | Optional | Vendor quote |
| vendorEstimatedCost | Float? | Optional | Estimated cost |
| vendorActualCost | Float? | Optional | Actual cost |
| vendorLeadTimeDays | Int? | Optional | Lead time |
| vendorNotes | String? | Optional | Vendor notes |
| workflowId | String? | FK → Workflow | Workflow reference |
| currentStateId | String? | FK → WorkflowState | Current state |
| status | MOStatus | Default: DRAFT | MO status |
| recipeId | String? | FK → Recipe | Recipe/BOM reference |
| plannedStartDate | DateTime? | Optional | Planned start |
| plannedEndDate | DateTime? | Optional | Planned end |
| actualStartDate | DateTime? | Optional | Actual start |
| actualEndDate | DateTime? | Optional | Actual end |
| progressPercent | Float | Default: 0 | Progress percentage |
| notes | String? | Optional | Notes |
| createdAt | DateTime | Default: now() | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Status Values:**
- `DRAFT` - Initial state
- `PLANNING` - Being planned
- `MATERIAL_PREPARATION` - Materials being prepared
- `IN_PRODUCTION` - In production
- `QC` - Quality control
- `COMPLETED` - Completed
- `CANCELLED` - Cancelled

**Indexes:**
- `(tenantId, orderId, moNumber)` (unique)
- `tenantId`
- `orderId`
- `vendorId`
- `recipeId`
- `status`
- `isOutsourced`

#### Jobsheet
Work instructions for manufacturing orders.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK | Unique identifier |
| tenantId | String | FK → Tenant | Tenant reference |
| moId | String | FK → ManufacturingOrder | Parent MO |
| jsNumber | String | Required | Jobsheet number |
| name | String | Required | Jobsheet name |
| description | String? | Optional | Description |
| status | JobsheetStatus | Default: PREPARING | Status |
| priority | String | Default: MEDIUM | Priority |
| plannedStartDate | DateTime? | Optional | Planned start |
| plannedEndDate | DateTime? | Optional | Planned end |
| actualStartDate | DateTime? | Optional | Actual start |
| actualEndDate | DateTime? | Optional | Actual end |
| progressPercent | Float | Default: 0 | Progress percentage |
| dependsOn | String? | FK → Jobsheet | Dependency |
| notes | String? | Optional | Notes |
| createdBy | String? | Optional | Creator |
| createdAt | DateTime | Default: now() | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Status Values:**
- `PREPARING` - Being prepared
- `READY` - Ready to start
- `IN_PROGRESS` - In progress
- `COMPLETED` - Completed
- `ON_HOLD` - On hold
- `CANCELLED` - Cancelled

**Indexes:**
- `(tenantId, moId, jsNumber)` (unique)
- `tenantId`
- `moId`
- `status`
- `dependsOn`

#### MachiningTask
Individual tasks within jobsheets.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK | Unique identifier |
| tenantId | String | FK → Tenant | Tenant reference |
| jobsheetId | String | FK → Jobsheet | Parent jobsheet |
| taskNumber | String | Required | Task number |
| name | String | Required | Task name |
| description | String? | Optional | Description |
| machineId | String? | FK → Machine | Assigned machine |
| status | TaskStatus | Default: PENDING | Status |
| priority | String | Default: MEDIUM | Priority |
| plannedHours | Float? | Optional | Planned hours |
| actualHours | Float? | Optional | Actual hours |
| clockedInAt | DateTime? | Optional | Clock in time |
| clockedOutAt | DateTime? | Optional | Clock out time |
| breakdownAt | DateTime? | Optional | Breakdown time |
| breakdownNote | String? | Optional | Breakdown notes |
| resolvedAt | DateTime? | Optional | Resolution time |
| assignedTo | String? | FK → User | Assigned technician |
| progressPercent | Float | Default: 0 | Progress percentage |
| dependsOn | String? | FK → MachiningTask | Dependency |
| notes | String? | Optional | Notes |
| createdAt | DateTime | Default: now() | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Status Values:**
- `PENDING` - Not started
- `ASSIGNED` - Assigned to technician
- `RUNNING` - In progress
- `PAUSED` - Paused
- `COMPLETED` - Completed
- `CANCELLED` - Cancelled

**Indexes:**
- `(tenantId, jobsheetId, taskNumber)` (unique)
- `tenantId`
- `jobsheetId`
- `machineId`
- `assignedTo`
- `status`
- `dependsOn`

---

### Material Management Tables

#### Recipe (BOM)
Bill of materials for products.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK | Unique identifier |
| tenantId | String | FK → Tenant | Tenant reference |
| code | String | Required | Recipe code |
| name | String | Required | Recipe name |
| description | String? | Optional | Description |
| version | String | Default: "1.0" | Version |
| outputPartNumber | String | Required | Output part number |
| outputName | String | Required | Output name |
| outputUnit | String | Required | Output unit |
| isActive | Boolean | Default: true | Active flag |
| approvedBy | String? | Optional | Approver |
| approvedAt | DateTime? | Optional | Approval date |
| createdAt | DateTime | Default: now() | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Indexes:**
- `(tenantId, code, version)` (unique)
- `tenantId`
- `outputPartNumber`

#### RecipeIngredient
Materials required for a recipe.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK | Unique identifier |
| tenantId | String | FK → Tenant | Tenant reference |
| recipeId | String | FK → Recipe | Parent recipe |
| partNumber | String | Required | Part number |
| name | String | Required | Material name |
| requiredQuantity | Float | Required | Required quantity |
| unit | String | Required | Unit of measure |
| inventoryId | String? | FK → Inventory | Linked inventory |
| notes | String? | Optional | Notes |
| createdAt | DateTime | Default: now() | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Indexes:**
- `tenantId`
- `recipeId`
- `inventoryId`

#### MaterialRequirement
Calculated material requirements for MOs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK | Unique identifier |
| tenantId | String | FK → Tenant | Tenant reference |
| moId | String | FK → ManufacturingOrder | Parent MO |
| partNumber | String | Required | Part number |
| name | String | Required | Material name |
| requiredQuantity | Float | Required | Required quantity |
| unit | String | Required | Unit |
| status | RequirementStatus | Default: PENDING | Status |
| availableQuantity | Float | Default: 0 | Available stock |
| reservedQuantity | Float | Default: 0 | Reserved |
| requiredDate | DateTime? | Optional | Required by date |
| notes | String? | Optional | Notes |
| createdAt | DateTime | Default: now() | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Status Values:**
- `PENDING` - Not allocated
- `PARTIALLY_ALLOCATED` - Partially allocated
- `ALLOCATED` - Fully allocated
- `RESERVED` - Reserved from inventory
- `ORDERED` - Purchase order created
- `RECEIVED` - Received from vendor

**Indexes:**
- `(tenantId, moId, partNumber)` (unique)
- `tenantId`
- `moId`
- `partNumber`
- `status`
- `requiredDate`

#### JobsheetMaterial
Material requirements linked to jobsheets.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK | Unique identifier |
| tenantId | String | FK → Tenant | Tenant reference |
| jobsheetId | String | FK → Jobsheet | Parent jobsheet |
| materialRequirementId | String | FK → MaterialRequirement | Requirement reference |
| requiredQuantity | Float | Required | Required quantity |
| allocatedQuantity | Float | Default: 0 | Allocated quantity |
| status | AllocationStatus | Default: PENDING | Status |
| notes | String? | Optional | Notes |
| createdAt | DateTime | Default: now() | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Indexes:**
- `tenantId`
- `jobsheetId`
- `materialRequirementId`
- `status`

#### TaskMaterialAllocation
Material allocations to specific tasks.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK | Unique identifier |
| tenantId | String | FK → Tenant | Tenant reference |
| jobsheetMaterialId | String | FK → JobsheetMaterial | Material reference |
| inventoryId | String | FK → Inventory | Inventory item |
| quantity | Float | Required | Allocated quantity |
| allocatedBy | String | Required | Allocated by user |
| locationId | String? | FK → Location | Source location |
| shelfId | String? | FK → Shelf | Source shelf |
| status | AllocationStatus | Default: ALLOCATED | Status |
| notes | String? | Optional | Notes |
| allocatedAt | DateTime | Default: now() | Allocation time |
| releasedAt | DateTime? | Optional | Release time |
| createdAt | DateTime | Default: now() | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Indexes:**
- `tenantId`
- `jobsheetMaterialId`
- `inventoryId`
- `status`

---

### Inventory Tables

#### Location
Physical locations for inventory.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK | Unique identifier |
| tenantId | String | FK → Tenant | Tenant reference |
| code | String | Required | Location code |
| name | String | Required | Location name |
| type | LocationType | Required | Location type |
| description | String? | Optional | Description |
| parentLocationId | String? | FK → Location | Parent location |
| address | String? | Optional | Address |
| picUserId | String? | FK → User | Person in charge |
| isActive | Boolean | Default: true | Active flag |
| notes | String? | Optional | Notes |
| createdAt | DateTime | Default: now() | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Location Types:**
- `WAREHOUSE` - Main storage
- `PPIC_RACK` - Planning area
- `PRODUCTION_AREA` - Production floor
- `WORKSTATION` - Machine station
- `QC_AREA` - Quality control area
- `SHIPPING` - Outbound
- `RECEIVING` - Inbound
- `TOOL_CRIB` - Tool storage

**Indexes:**
- `(tenantId, code)` (unique)
- `tenantId`
- `type`
- `parentLocationId`
- `picUserId`

#### Shelf
Storage locations within locations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK | Unique identifier |
| tenantId | String | FK → Tenant | Tenant reference |
| locationId | String | FK → Location | Parent location |
| code | String | Required | Shelf code (A-01, B-02) |
| name | String | Required | Shelf name |
| description | String? | Optional | Description |
| row | String? | Optional | Row position |
| column | String? | Optional | Column position |
| level | String? | Optional | Level position |
| capacity | Int? | Optional | Max items |
| currentCount | Int | Default: 0 | Current count |
| isActive | Boolean | Default: true | Active flag |
| notes | String? | Optional | Notes |
| createdAt | DateTime | Default: now() | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Indexes:**
- `(tenantId, locationId, code)` (unique)
- `tenantId`
- `locationId`

#### Inventory
Stock items.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK | Unique identifier |
| tenantId | String | FK → Tenant | Tenant reference |
| partNumber | String | Required | Part number |
| name | String | Required | Item name |
| description | String? | Optional | Description |
| currentQuantity | Float | Required | Current quantity |
| minimumQuantity | Float | Default: 0 | Minimum stock level |
| unit | String | Required | Unit of measure |
| category | InventoryCategory | Required | Category |
| status | InventoryStatus | Default: AVAILABLE | Status |
| currentProcess | String? | Optional | Current process |
| locationId | String | FK → Location | Location |
| shelfId | String? | FK → Shelf | Shelf |
| batch | String? | Optional | Batch number |
| supplierId | String? | FK → Supplier | Supplier |
| receivedDate | DateTime? | Optional | Receipt date |
| expiryDate | DateTime? | Optional | Expiry date |
| costPrice | Float? | Optional | Cost price |
| notes | String? | Optional | Notes |
| createdBy | String? | Optional | Creator |
| createdAt | DateTime | Default: now() | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Categories:**
- `RAW_MATERIAL` - Raw materials
- `FINISHED_GOODS` - Finished products
- `WIP` - Work in progress
- `TOOLS` - Tools and consumables
- `MISC` - Miscellaneous

**Status Values:**
- `AVAILABLE` - Available for use
- `RESERVED` - Reserved for allocation
- `ALLOCATED` - Allocated to task
- `IN_TRANSIT` - In transit
- `QUARANTINE` - Quality hold
- `SCRAPPED` - Scrapped

**Indexes:**
- `(tenantId, partNumber, batch)` (unique)
- `tenantId`
- `category`
- `status`
- `locationId`
- `shelfId`
- `supplierId`
- `currentProcess`

#### InventoryTransaction
Audit trail for inventory movements.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK | Unique identifier |
| tenantId | String | FK → Tenant | Tenant reference |
| transactionNumber | String | Required | Transaction number |
| inventoryId | String | FK → Inventory | Inventory item |
| type | TransactionType | Required | Transaction type |
| quantity | Float | Required | Quantity (negative for out) |
| balance | Float? | Optional | Balance after transaction |
| fromLocationId | String? | FK → Location | From location |
| fromShelfId | String? | FK → Shelf | From shelf |
| toLocationId | String? | FK → Location | To location |
| toShelfId | String? | FK → Shelf | To shelf |
| referenceType | String? | Optional | Reference type |
| referenceId | String? | Optional | Reference ID |
| moId | String? | FK → ManufacturingOrder | MO reference |
| orderId | String? | FK → Order | Order reference |
| productionOutputId | String? | FK → ProductionOutput | Output reference |
| performedBy | String? | Optional | Performed by |
| handoffStatus | String? | Optional | Handoff status |
| notes | String? | Optional | Notes |
| createdBy | String? | Optional | Creator |
| createdAt | DateTime | Default: now() | Creation timestamp |

**Transaction Types:**
- `RECEIPT` - Goods received
- `ISSUE` - Issued to production
- `RETURN` - Returned from production
- `TRANSFER` - Transferred between locations
- `ADJUSTMENT` - Manual adjustment
- `PRODUCTION_OUTPUT` - From production
- `CONSUMPTION` - Consumed in allocation
- `SCRAP` - Scrapped

**Indexes:**
- `tenantId`
- `inventoryId`
- `type`
- `(referenceType, referenceId)`
- `createdAt`

#### MaterialHandoff
Material transfers between locations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK | Unique identifier |
| tenantId | String | FK → Tenant | Tenant reference |
| handoffNumber | String | Required | Handoff number |
| fromLocationId | String | FK → Location | From location |
| toLocationId | String | FK → Location | To location |
| handedBy | String | FK → User | Handed by |
| receivedBy | String? | FK → User | Received by |
| fromPicUserId | String? | FK → User | From PIC |
| toPicUserId | String? | FK → User | To PIC |
| handoffType | HandoffType | Default: STOCK_TRANSFER | Type |
| referenceType | String? | Optional | Reference type |
| referenceId | String? | Optional | Reference ID |
| moId | String? | FK → ManufacturingOrder | MO reference |
| jobsheetId | String? | FK → Jobsheet | Jobsheet reference |
| taskId | String? | FK → MachiningTask | Task reference |
| status | HandoffStatus | Default: PENDING | Status |
| requestedAt | DateTime | Default: now() | Request time |
| handedAt | DateTime? | Optional | Hand time |
| receivedAt | DateTime? | Optional | Receive time |
| notes | String? | Optional | Notes |
| deliveryNote | String? | Optional | Delivery note |
| trackingNumber | String? | Optional | Tracking number |
| createdBy | String? | Optional | Creator |
| createdAt | DateTime | Default: now() | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Handoff Types:**
- `STOCK_TRANSFER` - Stock movement
- `MATERIAL_REQUEST` - Material request
- `ISSUE_TO_PRODUCTION` - Issue to production
- `RETURN_FROM_PRODUCTION` - Return from production

**Status Values:**
- `PENDING` - Awaiting confirmation
- `CONFIRMED` - Confirmed
- `HANDED` - Handed over
- `RECEIVED` - Received
- `CANCELLED` - Cancelled

**Indexes:**
- `(tenantId, handoffNumber)` (unique)
- `tenantId`
- `fromLocationId`
- `toLocationId`
- `moId`
- `status`
- `(referenceType, referenceId)`

---

### Production Output & Quality Tables

#### ProductionOutput
Production output records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK | Unique identifier |
| tenantId | String | FK → Tenant | Tenant reference |
| outputNumber | String | Required | Output number (PO-YYYY-NNN) |
| taskId | String | FK → MachiningTask | Task reference |
| jobsheetId | String | FK → Jobsheet | Jobsheet reference |
| moId | String | FK → ManufacturingOrder | MO reference |
| orderId | String | FK → Order | Order reference |
| partNumber | String | Required | Part number |
| productName | String | Required | Product name |
| plannedQuantity | Int | Required | Planned quantity |
| goodQuantity | Int | Required | Good quantity |
| reworkQuantity | Int | Default: 0 | Rework quantity |
| scrapQuantity | Int | Default: 0 | Scrap quantity |
| batch | String? | Optional | Batch number |
| outputLocationId | String? | FK → Location | Output location |
| outputShelfId | String? | FK → Shelf | Output shelf |
| qcCheckedBy | String? | FK → User | QC inspector |
| qcCheckedAt | DateTime? | Optional | QC check time |
| qcResult | QCResult? | Optional | QC result |
| status | ProductionOutputStatus | Default: PENDING_QC | Status |
| defectNotes | String? | Optional | Defect notes |
| notes | String? | Optional | Notes |
| createdBy | String? | Optional | Creator |
| createdAt | DateTime | Default: now() | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Status Values:**
- `PENDING_QC` - Awaiting QC
- `QC_PASSED` - QC passed
- `QC_FAILED` - QC failed
- `REWORK_IN_PROGRESS` - Rework in progress
- `COMPLETED` - Completed
- `CANCELLED` - Cancelled

**Indexes:**
- `(tenantId, outputNumber)` (unique)
- `tenantId`
- `taskId`
- `jobsheetId`
- `moId`
- `status`
- `partNumber`

#### QualityCheck
QC inspection records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK | Unique identifier |
| tenantId | String | FK → Tenant | Tenant reference |
| qcNumber | String | Required | QC number |
| referenceType | String | Required | Reference type |
| referenceId | String | Required | Reference ID |
| checkType | QCCheckType | Default: FINAL | Check type |
| status | QCStatus | Default: PENDING | Status |
| result | QCResult? | Optional | Result |
| inspectorId | String | FK → User | Inspector |
| inspectionDate | DateTime? | Optional | Inspection date |
| notes | String? | Optional | Notes |
| createdBy | String? | Optional | Creator |
| createdAt | DateTime | Default: now() | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Status Values:**
- `PENDING` - Awaiting inspection
- `IN_PROGRESS` - In progress
- `PASSED` - Passed
- `FAILED` - Failed

**Result Values:**
- `PASS` - All good
- `FAIL` - Failed
- `CONDITIONAL_PASS` - Pass with conditions

**Indexes:**
- `tenantId`
- `qcNumber` (unique)
- `(referenceType, referenceId)`
- `status`
- `moId`
- `orderId`

#### ReworkOrder
Orders for rework work.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK | Unique identifier |
| tenantId | String | FK → Tenant | Tenant reference |
| reworkNumber | String | Required | Rework number (RW-YYYY-NNN) |
| qualityCheckId | String | FK → QualityCheck | QC reference |
| productionOutputId | String? | FK → ProductionOutput | Output reference |
| moId | String? | FK → ManufacturingOrder | MO reference |
| reworkType | ReworkType | Default: INTERNAL | Rework type |
| status | ReworkStatus | Default: CREATED | Status |
| priority | String | Default: HIGH | Priority |
| reason | String | Required | Rework reason |
| correctiveAction | String? | Optional | Corrective action |
| assignedToId | String? | FK → User | Assigned to |
| startDate | DateTime? | Optional | Start date |
| completedDate | DateTime? | Optional | Completion date |
| notes | String? | Optional | Notes |
| createdBy | String? | Optional | Creator |
| createdAt | DateTime | Default: now() | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Status Values:**
- `CREATED` - Created
- `ASSIGNED` - Assigned
- `IN_PROGRESS` - In progress
- `COMPLETED` - Completed
- `CANCELLED` - Cancelled

**Indexes:**
- `(tenantId, reworkNumber)` (unique)
- `tenantId`
- `qualityCheckId` (unique)
- `status`

---

### Equipment Tables

#### Machine
Production machines.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK | Unique identifier |
| tenantId | String | FK → Tenant | Tenant reference |
| code | String | Required | Machine code |
| name | String | Required | Machine name |
| model | String? | Optional | Model |
| type | String | Required | Machine type |
| location | String? | Optional | Location |
| status | MachineStatus | Default: IDLE | Status |
| capacity | Int? | Optional | Capacity |
| installDate | DateTime? | Optional | Install date |
| lastMaintenanceDate | DateTime? | Optional | Last maintenance |
| nextMaintenanceDate | DateTime? | Optional | Next maintenance |
| maintenanceIntervalDays | Int? | Optional | Maintenance interval |
| isActive | Boolean | Default: true | Active flag |
| notes | String? | Optional | Notes |
| createdBy | String? | Optional | Creator |
| createdAt | DateTime | Default: now() | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Status Values:**
- `IDLE` - Available but not running
- `RUNNING` - Currently running
- `MAINTENANCE` - Under maintenance
- `BREAKDOWN` - Broken down

**Indexes:**
- `(tenantId, code)` (unique)
- `tenantId`
- `status`

#### Breakdown
Machine breakdown records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK | Unique identifier |
| tenantId | String | FK → Tenant | Tenant reference |
| machineId | String | FK → Machine | Machine reference |
| taskId | String? | FK → MachiningTask | Related task |
| description | String | Required | Description |
| reportedBy | String | FK → User | Reported by |
| reportedAt | DateTime | Default: now() | Report time |
| severity | BreakdownSeverity | Required | Severity level |
| status | BreakdownStatus | Default: ACTIVE | Status |
| resolvedBy | String? | FK → User | Resolved by |
| resolvedAt | DateTime? | Optional | Resolution time |
| resolutionNotes | String? | Optional | Resolution notes |
| downtimeMinutes | Int? | Optional | Downtime |
| notes | String? | Optional | Notes |
| createdAt | DateTime | Default: now() | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

**Indexes:**
- `tenantId`
- `machineId`
- `reportedAt`
- `resolved`

---

## Enums

```typescript
// Order Management
enum OrderStatus {
  DRAFT
  PLANNING
  MATERIAL_PREPARATION
  IN_PRODUCTION
  QC
  COMPLETED
  CANCELLED
}

enum MOStatus {
  DRAFT
  PLANNING
  MATERIAL_PREPARATION
  IN_PRODUCTION
  QC
  COMPLETED
  CANCELLED
}

enum JobsheetStatus {
  PREPARING
  READY
  IN_PROGRESS
  COMPLETED
  ON_HOLD
  CANCELLED
}

enum TaskStatus {
  PENDING
  ASSIGNED
  RUNNING
  PAUSED
  COMPLETED
  CANCELLED
}

// Inventory
enum InventoryCategory {
  RAW_MATERIAL
  FINISHED_GOODS
  WIP
  TOOLS
  MISC
}

enum InventoryStatus {
  AVAILABLE
  RESERVED
  ALLOCATED
  IN_TRANSIT
  QUARANTINE
  SCRAPPED
}

enum TransactionType {
  RECEIPT
  ISSUE
  RETURN
  TRANSFER
  ADJUSTMENT
  PRODUCTION_OUTPUT
  CONSUMPTION
  SCRAP
}

enum LocationType {
  WAREHOUSE
  PPIC_RACK
  PRODUCTION_AREA
  WORKSTATION
  QC_AREA
  SHIPPING
  RECEIVING
  TOOL_CRIB
}

// Material
enum HandoffType {
  STOCK_TRANSFER
  MATERIAL_REQUEST
  ISSUE_TO_PRODUCTION
  RETURN_FROM_PRODUCTION
}

enum HandoffStatus {
  PENDING
  CONFIRMED
  HANDED
  RECEIVED
  CANCELLED
}

// Production
enum ProductionOutputStatus {
  PENDING_QC
  QC_PASSED
  QC_FAILED
  REWORK_IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum QCStatus {
  PENDING
  IN_PROGRESS
  PASSED
  FAILED
}

enum QCResult {
  PASS
  FAIL
  CONDITIONAL_PASS
}

enum ReworkStatus {
  CREATED
  ASSIGNED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

// Equipment
enum MachineStatus {
  IDLE
  RUNNING
  MAINTENANCE
  BREAKDOWN
}

enum BreakdownSeverity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum BreakdownStatus {
  ACTIVE
  RESOLVED
}
```

---

## Migration Commands

```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database (CAUTION: loses data)
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio
npx prisma studio
```

---

## Performance Optimization

### Recommended Indexes

Already defined in schema:
- All foreign keys
- Frequently queried columns
- Unique constraints

### Query Optimization Tips

1. Use `select` to limit returned fields
2. Use `include` only when relations are needed
3. Use pagination for large datasets
4. Use `where` clauses efficiently
5. Consider composite indexes for common queries

---

*ManuOS Database Schema Documentation v2.0 - May 2026*
