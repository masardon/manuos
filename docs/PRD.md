# Product Requirements Document (PRD)
# ManuOS - Manufacturing Operating System

**Document Version**: 2.1
**Last Updated**: May 2026
**Product Name**: ManuOS
**Type**: Manufacturing Execution System (MES) with ERP Integration

---

## Related Documentation

| Document | Description |
|----------|-------------|
| [MATERIAL_FLOW.md](./MATERIAL_FLOW.md) | Complete material flow diagrams and process documentation |
| [USE_CASES.md](./USE_CASES.md) | Comprehensive use cases for all ManuOS functionality |
| [GUIDEBOOK.md](./GUIDEBOOK.md) | Step-by-step user guide and operating instructions |
| [TSD.md](./TSD.md) | Technical specification document |
| [DATABASE.md](./DATABASE.md) | Database schema documentation |
| [API.md](./API.md) | API endpoint documentation |
| [CONNECTION_MAP.md](./CONNECTION_MAP.md) | System connection and dependency map |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
3. [Target Users & Personas](#3-target-users--personas)
4. [Core Features](#4-core-features)
5. [User Stories](#5-user-stories)
6. [Functional Requirements](#6-functional-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [System Architecture](#8-system-system-architecture)
9. [Data Model](#9-data-model)
10. [Integration Requirements](#10-integration-requirements)
11. [Security Requirements](#11-security-requirements)
12. [Roadmap](#12-roadmap)
13. [Success Metrics](#13-success-metrics)

---

## 1. Executive Summary

### 1.1 Problem Statement

Manufacturing companies face critical operational challenges:

- **Fragmented Systems**: Production data scattered across spreadsheets, paper forms, and legacy systems
- **Poor Visibility**: Real-time production status is unavailable, leading to reactive decision-making
- **Communication Gaps**: Planning, production, and warehouse teams operate in silos
- **Inefficient Workflows**: Manual task tracking, material allocation, and quality control processes
- **Limited Traceability**: Difficult to trace materials from receipt through production to finished goods
- **Integration Challenges**: No seamless connection between MES and ERP systems

### 1.2 Solution Overview

**ManuOS** is a comprehensive Manufacturing Execution System that provides:

- **End-to-End Order Management**: From customer order to finished goods delivery
- **Production Planning & Control**: Gantt charts, Kanban boards, task management
- **Material Requirements Planning (MRP)**: Automatic material calculation and allocation
- **Real-Time Inventory Tracking**: Live updates via Server-Sent Events (SSE)
- **Quality Control Integration**: QC workflows with automatic rework order creation
- **Vendor Management**: Outsourced manufacturing and purchase order management
- **ERP Integration**: Odoo XML-RPC integration for seamless data flow

### 1.3 Value Proposition

| Stakeholder | Value Proposition |
|-------------|-------------------|
| **Production Managers** | Real-time visibility, bottleneck identification, data-driven decisions |
| **PPIC Teams** | Efficient planning, automatic MRP, optimized resource allocation |
| **Technicians** | Simple task updates, clear assignments, mobile-friendly interface |
| **Warehouse Staff** | Material tracking, handoff management, inventory accuracy |
| **Quality Control** | Streamlined inspections, automatic rework creation, traceability |
| **Management** | Production analytics, KPI dashboards, comprehensive reporting |

---

## 2. Product Overview

### 2.1 Product Vision

ManuOS aims to be the modern manufacturing operations platform that connects planning, execution, and quality control in real-time, enabling manufacturers to achieve operational excellence.

### 2.2 Core Modules

| Module | Description |
|--------|-------------|
| **Order Management** | Customer orders, manufacturing orders, vendor orders |
| **Production Planning** | Gantt charts, Kanban boards, resource scheduling |
| **Material Management** | MRP, material allocation, handoffs, inventory |
| **Production Execution** | Tasks, time tracking, production output recording |
| **Quality Control** | QC inspections, pass/fail handling, rework management |
| **Inventory Management** | Stock levels, locations, transactions, alerts |
| **Vendor Management** | Vendor orders, shipments, invoices, performance |
| **Reporting & Analytics** | Production reports, efficiency metrics, dashboards |

### 2.3 Key Differentiators

1. **Real-Time Updates**: SSE-based live inventory and production status
2. **Integrated Quality Control**: Automatic rework order creation on QC failure
3. **Material Traceability**: Full trace from warehouse receipt to finished goods
4. **ERP Integration**: Native Odoo XML-RPC integration
5. **Unified Interface**: Single platform for planning, execution, and quality

---

## 3. Target Users & Personas

### 3.1 User Roles

| Role | Description | Primary Functions |
|------|-------------|-------------------|
| **Admin** | System administrator | User management, system configuration |
| **Super Admin** | Multi-tenant administrator | Tenant management, global settings |
| **PPIC** | Production Planning & Inventory Control | MO creation, jobsheets, MRP, material allocation |
| **Manager** | Production manager | Approvals, reports, resource allocation |
| **Technician** | Shop floor operator | Task execution, time tracking, output recording |
| **Warehouse** | Warehouse staff | Inventory management, handoffs, goods receipt |
| **Marketing** | Customer relations | Order management, customer communication |
| **Drafter** | Engineering/Technical | Recipe/BOM creation, technical specifications |

### 3.2 Persona Details

#### PPIC Staff (Primary User)
- **Goals**: Efficient planning, accurate material requirements, smooth production flow
- **Pain Points**: Manual calculations, disconnected systems, material shortages
- **Needs**: Visual planning tools, automated MRP, real-time inventory visibility

#### Technician
- **Goals**: Clear task instructions, easy status updates, minimal admin work
- **Pain Points**: Complex systems, unclear priorities, manual time tracking
- **Needs**: Simple interface, mobile access, one-click actions

#### Production Manager
- **Goals**: Production visibility, on-time delivery, resource optimization
- **Pain Points**: Delayed information, lack of metrics, reactive management
- **Needs**: Real-time dashboards, alerts, comprehensive reports

---

## 4. Core Features

### 4.1 Order Management

| Feature | Description | Priority |
|---------|-------------|----------|
| Customer Order Creation | Create and track customer orders | P0 |
| Manufacturing Order (MO) | Break orders into production batches | P0 |
| MO Type Support | Internal and outsourced manufacturing | P0 |
| Order Wizard | 7-step guided order creation | P0 |
| Order Status Tracking | Real-time status with workflow states | P0 |

### 4.2 Production Planning

| Feature | Description | Priority |
|---------|-------------|----------|
| Gantt Chart | 4-level hierarchy timeline view | P0 |
| Kanban Board | Drag-and-drop task management | P0 |
| Jobsheet Management | Work instructions and material requirements | P0 |
| Task Assignment | Machine and technician assignment | P0 |
| Resource Scheduling | Machine and technician availability | P1 |

### 4.3 Material Management

| Feature | Description | Priority |
|---------|-------------|----------|
| Material Requirements Planning | Automatic material calculation from recipes | P0 |
| Material Allocation | Allocate materials to jobsheets/tasks | P0 |
| Material Handoffs | Transfer materials between locations | P0 |
| Inventory Tracking | Real-time stock levels with SSE updates | P0 |
| Low Stock Alerts | Automatic reorder notifications | P1 |

### 4.4 Production Execution

| Feature | Description | Priority |
|---------|-------------|----------|
| Task Clock In/Out | Time tracking for tasks | P0 |
| Production Output Recording | Record good/rework/scrap quantities | P0 |
| Breakdown Reporting | Report and track machine issues | P1 |
| Task Progress Updates | Real-time progress tracking | P0 |

### 4.5 Quality Control

| Feature | Description | Priority |
|---------|-------------|----------|
| QC Inspection Workflow | Structured QC process | P0 |
| Pass/Fail Handling | QC pass → finished goods, QC fail → rework | P0 |
| Rework Order Creation | Automatic rework order on QC failure | P0 |
| QC History | Track inspection results over time | P1 |

### 4.6 Inventory Management

| Feature | Description | Priority |
|---------|-------------|----------|
| Multi-Location Support | Warehouse, PPIC rack, production floor | P0 |
| Shelf-Level Tracking | Granular location management | P1 |
| Inventory Transactions | Full audit trail of all movements | P0 |
| Category Management | Raw materials, WIP, finished goods, tools | P0 |
| Batch Tracking | Track materials by batch number | P1 |

### 4.7 Vendor Management

| Feature | Description | Priority |
|---------|-------------|----------|
| Vendor Order Management | Track outsourced manufacturing | P0 |
| Vendor Shipment Tracking | Receive and track vendor shipments | P1 |
| Vendor Invoice Management | Process vendor invoices | P2 |
| Vendor Performance Metrics | Track vendor delivery and quality | P2 |

### 4.8 ERP Integration (Odoo)

| Feature | Description | Priority |
|---------|-------------|----------|
| Purchase Order Sync | Push POs to Odoo | P1 |
| Goods Receipt Sync | Confirm receipts in Odoo | P1 |
| Bidirectional Sync | Import POs from Odoo | P2 |
| Supplier Synchronization | Sync supplier data | P2 |

---

## 5. User Stories

### 5.1 Order Management Stories

**US-OM-01**: As a PPIC staff, I want to create a customer order with all details so that production can be planned.

**US-OM-02**: As a PPIC staff, I want to break down an order into manufacturing orders so that production can be scheduled.

**US-OM-03**: As a PPIC staff, I want to create outsourced MOs with vendor selection so that I can manage subcontracting.

**US-OM-04**: As a manager, I want to view all orders with filters so that I can prioritize production.

### 5.2 Production Planning Stories

**US-PP-01**: As a PPIC staff, I want to create jobsheets with task breakdown so that technicians know what to do.

**US-PP-02**: As a PPIC staff, I want to view production on a Gantt chart so that I can identify scheduling conflicts.

**US-PP-03**: As a technician, I want to see my tasks on a Kanban board so that I know what to work on.

**US-PP-04**: As a manager, I want to assign machines and technicians to tasks so that resources are allocated efficiently.

### 5.3 Material Management Stories

**US-MM-01**: As a PPIC staff, I want to run MRP to calculate material requirements so that I know what to order.

**US-MM-02**: As a warehouse staff, I want to allocate materials to jobsheets so that production has what it needs.

**US-MM-03**: As a warehouse staff, I want to create material handoffs so that materials move to the right location.

**US-MM-04**: As a PPIC staff, I want to see real-time inventory levels so that I can plan production accurately.

### 5.4 Production Execution Stories

**US-PE-01**: As a technician, I want to clock in/out of tasks so that my time is tracked accurately.

**US-PE-02**: As a technician, I want to record production output (good/rework/scrap) so that quantities are tracked.

**US-PE-03**: As a technician, I want to report machine breakdowns so that maintenance can be arranged.

**US-PE-04**: As a manager, I want to see real-time production status so that I can make informed decisions.

### 5.5 Quality Control Stories

**US-QC-01**: As a QC inspector, I want to perform inspections and record results so that quality is maintained.

**US-QC-02**: As a QC inspector, I want to mark items as pass/fail so that the correct workflow is triggered.

**US-QC-03**: As a PPIC staff, I want rework orders to be created automatically on QC failure so that rework can be scheduled.

**US-QC-04**: As a manager, I want to see QC history so that I can track quality trends.

---

## 6. Functional Requirements

### 6.1 Order Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-OM-01 | System shall support creating customer orders with unique order numbers | P0 |
| FR-OM-02 | System shall support 7-step order wizard (Order Info → Technical Specs → MO → Material Distribution → Jobsheets → Tasks → Review) | P0 |
| FR-OM-03 | System shall support both internal and outsourced manufacturing orders | P0 |
| FR-OM-04 | System shall allow optional vendor selection for outsourced MOs | P0 |
| FR-OM-05 | System shall track order status through defined workflow states | P0 |

### 6.2 Production Planning

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-PP-01 | System shall provide Gantt chart with 4-level hierarchy (Order → MO → Jobsheet → Task) | P0 |
| FR-PP-02 | System shall provide Kanban board with drag-and-drop status updates | P0 |
| FR-PP-03 | System shall support machine and technician assignment (optional for QC/Assembly) | P0 |
| FR-PP-04 | System shall track task progress with planned vs actual hours | P0 |

### 6.3 Material Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-MM-01 | System shall calculate material requirements from recipe/BOM | P0 |
| FR-MM-02 | System shall support material allocation to jobsheets and tasks | P0 |
| FR-MM-03 | System shall track material handoffs between locations | P0 |
| FR-MM-04 | System shall provide real-time inventory updates via SSE | P0 |
| FR-MM-05 | System shall alert when stock falls below minimum levels | P1 |

### 6.4 Production Execution

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-PE-01 | System shall support task clock in/out for time tracking | P0 |
| FR-PE-02 | System shall record production output with good/rework/scrap quantities | P0 |
| FR-PE-03 | System shall generate unique production output numbers (PO-YYYY-NNN) | P0 |
| FR-PE-04 | System shall track machine breakdowns with resolution status | P1 |

### 6.5 Quality Control

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-QC-01 | System shall provide QC inspection workflow with pass/fail | P0 |
| FR-QC-02 | System shall auto-create finished goods inventory on QC pass | P0 |
| FR-QC-03 | System shall auto-create rework order on QC fail | P0 |
| FR-QC-04 | System shall generate unique rework order numbers (RW-YYYY-NNN) | P0 |

### 6.6 Inventory Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-IM-01 | System shall track inventory at location and shelf level | P0 |
| FR-IM-02 | System shall support multiple inventory categories | P0 |
| FR-IM-03 | System shall maintain full transaction audit trail | P0 |
| FR-IM-04 | System shall emit SSE events on inventory changes | P0 |

### 6.7 ERP Integration

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-ERP-01 | System shall sync purchase orders to Odoo via XML-RPC | P1 |
| FR-ERP-02 | System shall confirm goods receipts in Odoo | P1 |
| FR-ERP-03 | System shall support Odoo connection configuration | P1 |
| FR-ERP-04 | System shall log all sync operations | P1 |

---

## 7. Non-Functional Requirements

### 7.1 Performance

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-P-01 | Page load time | < 2 seconds |
| NFR-P-02 | API response time | < 500ms |
| NFR-P-03 | SSE event delivery | < 100ms |
| NFR-P-04 | Concurrent users | 100+ per tenant |

### 7.2 Scalability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-S-01 | Multi-tenant support | Unlimited tenants |
| NFR-S-02 | Database scalability | PostgreSQL for production |
| NFR-S-03 | Horizontal scaling | Stateless API design |

### 7.3 Availability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-A-01 | System uptime | 99.5% |
| NFR-A-02 | Data backup | Daily automated backups |
| NFR-A-03 | Recovery time | < 4 hours |

### 7.4 Security

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-SEC-01 | Authentication | Role-based access control |
| NFR-SEC-02 | Data encryption | TLS 1.3 in transit, AES at rest |
| NFR-SEC-03 | Password security | Hashed storage |
| NFR-SEC-04 | Audit logging | All data modifications logged |

### 7.5 Usability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-U-01 | Mobile responsive | All pages responsive |
| NFR-U-02 | Dark mode | Supported via Next Themes |
| NFR-U-03 | Accessibility | WCAG 2.1 AA compliance |
| NFR-U-04 | Browser support | Chrome, Firefox, Safari, Edge |

---

## 8. System Architecture

### 8.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer                              │
│  Web Browser (Chrome, Firefox, Safari, Edge)                │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Application                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ App Router   │  │ React 18     │  │ Tailwind CSS │      │
│  │ API Routes   │  │ Components   │  │ shadcn/ui    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Zustand      │  │ TanStack     │  │ SSE Events   │      │
│  │ State Mgmt   │  │ Query        │  │ Real-time    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────────────────────┬─────────────────────────────────────┘
                        │ Prisma ORM
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                            │
│  SQLite (Development) / PostgreSQL (Production)             │
└─────────────────────────────────────────────────────────────┘
                        │ XML-RPC
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    Odoo ERP Integration                      │
│  Purchase Orders, Goods Receipt, Suppliers                  │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Next.js | 16.x |
| Language | TypeScript | 5.x |
| UI Library | React | 18.x |
| Styling | Tailwind CSS | 4.x |
| Components | shadcn/ui | Latest |
| State Management | Zustand | 4.x |
| Data Fetching | TanStack Query | 5.x |
| Database ORM | Prisma | 6.x |
| Icons | Lucide React | Latest |
| Charts | Recharts | 2.x |

---

## 9. Data Model

### 9.1 Core Entities

```
Order
  ├── ManufacturingOrder
  │     ├── Recipe (BOM)
  │     ├── MaterialRequirement
  │     │     └── JobsheetMaterial
  │     │           └── TaskMaterialAllocation
  │     ├── Jobsheet
  │     │     └── MachiningTask
  │     │           └── ProductionOutput
  │     │                 └── QualityCheck (via QC workflow)
  │     └── VendorOrder (if outsourced)
  └── PurchaseOrder
        └── PurchaseOrderItem

Inventory
  ├── Location
  │     └── Shelf
  ├── InventoryTransaction
  └── InventoryReservation

MaterialHandoff
  ├── MaterialHandoffItem
  └── QualityCheck

User
  └── Role
        └── Permission

Machine
  └── Breakdown
```

### 9.2 Key Relationships

- Order → ManufacturingOrder: 1:N
- ManufacturingOrder → Jobsheet: 1:N
- Jobsheet → MachiningTask: 1:N
- MachiningTask → ProductionOutput: 1:N
- ProductionOutput → QualityCheck: 1:1 (via QC workflow)
- MaterialRequirement → JobsheetMaterial: 1:N
- JobsheetMaterial → TaskMaterialAllocation: 1:N

---

## 10. Integration Requirements

### 10.1 Odoo ERP Integration

| Feature | Method | Direction |
|---------|--------|-----------|
| Purchase Order Sync | XML-RPC | Push to Odoo |
| Goods Receipt Confirm | XML-RPC | Push to Odoo |
| Supplier Sync | XML-RPC | Bidirectional |
| Product Sync | XML-RPC | Push to Odoo |

### 10.2 Integration Endpoints

```
Odoo Common: /xmlrpc/2/common
  - authenticate()

Odoo Object: /xmlrpc/2/object
  - create()
  - search_read()
  - write()
  - execute_kw()
```

---

## 11. Security Requirements

### 11.1 Authentication

- Cookie-based authentication (development)
- JWT-based authentication (production)
- Password hashing with bcrypt

### 11.2 Authorization

- Role-based access control (RBAC)
- Permission-based route protection
- Multi-tenant data isolation

### 11.3 Data Security

- Tenant ID filtering on all queries
- SQL injection prevention via Prisma
- XSS prevention via React
- CSRF protection

---

## 12. Roadmap

### Phase 1: Core MES (Complete)
- ✅ Order management
- ✅ Production planning (Gantt, Kanban)
- ✅ Task management
- ✅ Basic inventory

### Phase 2: Material & Quality (Complete)
- ✅ MRP system
- ✅ Material allocation
- ✅ Production output tracking
- ✅ QC workflow
- ✅ Rework management

### Phase 3: Integration (In Progress)
- ✅ Odoo XML-RPC integration
- ✅ SSE real-time updates
- ⏳ WebSocket support (future)
- ⏳ Advanced analytics (future)

### Phase 4: Advanced Features (Future)
- ⏳ Predictive maintenance
- ⏳ AI-powered scheduling
- ⏳ Multi-site support
- ⏳ Mobile app

---

## 13. Success Metrics

### 13.1 Adoption Metrics
- User adoption rate: > 90% within 3 months
- Daily active users: > 80% of registered users
- Task completion rate: > 95%

### 13.2 Operational Metrics
- Planning efficiency: +30% improvement
- On-time delivery: +15% improvement
- Material shortage reduction: -50%
- Quality pass rate: > 95%

### 13.3 Technical Metrics
- System uptime: > 99.5%
- API response time: < 500ms
- Page load time: < 2 seconds
- Data accuracy: > 99%

---

## Appendix

### A. Glossary

| Term | Definition |
|------|------------|
| MO | Manufacturing Order |
| PPIC | Production Planning & Inventory Control |
| QC | Quality Control |
| MRP | Material Requirements Planning |
| BOM | Bill of Materials |
| OEE | Overall Equipment Effectiveness |
| SSE | Server-Sent Events |
| XML-RPC | XML Remote Procedure Call |
| CPM | Critical Path Method |
| FS/SS/FF/SF | Dependency Types (Finish-to-Start, Start-to-Start, Finish-to-Finish, Start-to-Finish) |

### B. References

- Prisma Documentation: https://www.prisma.io/docs
- Next.js Documentation: https://nextjs.org/docs
- Odoo XML-RPC Documentation: https://www.odoo.com/documentation

### C. Material Flow Architecture

#### C.1 Inventory Ledger System

The inventory ledger is the central tracking system for all material movements in ManuOS. Every material movement is recorded as a ledger entry with full traceability.

**Key Features:**
- **Atomic Transactions**: All inventory updates are transactional
- **Complete Audit Trail**: Every movement recorded with user, timestamp, reference
- **Real-Time Updates**: SSE-based notifications for instant UI updates
- **Multi-Location Support**: Track materials across warehouse, PPIC rack, production floor, finished goods

**Transaction Types:**
| Type | Description | Example |
|------|-------------|---------|
| RECEIPT | Goods received from vendor | PO delivery received |
| ISSUE | Materials issued to production | Handoff to production |
| CONSUMPTION | Materials consumed in task | Task uses materials |
| PRODUCTION_OUTPUT | Finished goods produced | Task completes with output |
| TRANSFER | Move between locations | Move to PPIC rack |
| QC_PASS | QC approved items | Good quantity after QC |
| QC_FAIL | QC rejected items | Rework quantity after QC |
| SCRAP | Scrapped items | Rejected after QC |
| ADJUSTMENT | Manual correction | Inventory count adjustment |

#### C.2 Material Flow States

Materials move through the following locations:
```
RECEIVING → MAIN STOCK → PPIC RACK → PRODUCTION FLOOR → FINISHED GOODS
                              │              │
                              └──────────────┴──→ REWORK → PRODUCTION FLOOR
```

**Location Definitions:**
- **RECEIVING**: Dock area for incoming shipments
- **MAIN STOCK (WAREHOUSE)**: Primary storage location
- **PPIC RACK**: Staging area for allocated materials
- **PRODUCTION FLOOR**: Materials in active production
- **FINISHED GOODS**: Completed products after QC pass
- **REWORK**: Items needing rework after QC fail
- **SCRAP**: Rejected items for disposal

#### C.3 Handoff Workflow

Material handoffs follow a 3-step process:
1. **Move to PPIC Rack**: WAREHOUSE → PPIC_RACK (status: CREATED → MOVED)
2. **Issue to Production**: PPIC_RACK → PRODUCTION_FLOOR (status: MOVED → ISSUED)
3. **Confirm Receipt**: Confirm at production floor (status: ISSUED → CONFIRMED)

**Duplicate Prevention:**
- System checks for existing handoffs with same MO and materials
- Prevents duplicate creation when clicking move button repeatedly

#### C.4 QC Integration

Quality Control automatically updates inventory:
- **QC Pass**: Items move to FINISHED_GOODS
- **QC Fail**: Items move to REWORK + Rework Order created
- **Mixed Results**: Each quantity type (good/rework/scrap) processed separately

### D. Dependency System

#### D.1 Task Dependencies

ManuOS supports dependency-aware scheduling with 4 dependency types:
- **Finish-to-Start (FS)**: Most common, successor starts after predecessor finishes
- **Start-to-Start (SS)**: Successor starts when predecessor starts
- **Finish-to-Finish (FF)**: Successor finishes when predecessor finishes
- **Start-to-Finish (SF)**: Rare, reverse dependency

#### D.2 Critical Path Method (CPM)

The execution plan API uses CPM to calculate optimal task dates:
- **Forward Pass**: Calculate early start/finish dates
- **Backward Pass**: Calculate late start/finish dates
- **Float Calculation**: Determine scheduling flexibility
- **Critical Path**: Tasks with zero float (highlighted in amber on Gantt)

#### D.3 MO-Level Dependencies

Dependencies can be configured at multiple levels:
- **MO-level**: Connects last task of predecessor MO to first task of successor MO
- **Jobsheet-level**: Connects jobsheets within or across MOs
- **Task-level**: Connects individual tasks

### E. Order Wizard Dependencies Step

The Order Wizard includes a new Step 7 for configuring dependencies:
- Select predecessor and successor items (MO, Jobsheet, or Task)
- Choose dependency type (FS, SS, FF, SF)
- Enter lag days (positive for delay, negative for overlap)
- System validates no circular dependencies
- Creates all dependency records on submission

---

*ManuOS - Manufacturing Operating System*
*Document Version 2.1 - May 2026*
*Added: Material Flow Architecture, Dependency System, Order Wizard Dependencies*
