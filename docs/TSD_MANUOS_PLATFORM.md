# Technical Specifications Document (TSD)
# ManuOS - Manufacturing Orchestrator Platform

**Document Version**: 1.0
**Last Updated**: January 2025
**Product Name**: ManuOS
**Architecture Type**: Modern Web Application with Multi-Tenant SaaS

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Technology Stack](#2-technology-stack)
3. [Database Design](#3-database-design)
4. [API Specifications](#4-api-specifications)
5. [Security Architecture](#5-security-architecture)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Infrastructure & Deployment](#7-infrastructure--deployment)
8. [Performance & Scalability](#8-performance--scalability)
9. [Monitoring & Logging](#9-monitoring--logging)
10. [Testing Strategy](#10-testing-strategy)
11. [Development Workflow](#11-development-workflow)

---

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
├─────────────────────────────────────────────────────────────────────┤
│  Web Browser (Chrome, Firefox, Safari, Edge)                 │
│  Mobile Browser (iOS Safari, Chrome Mobile)                      │
│  Tablet Browser                                                 │
└───────────────────────┬─────────────────────────────────────────┘
                        │ HTTPS
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Application Layer                      │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Next.js 16   │  │ React 19     │  │ Tailwind CSS  │  │
│  │ App Router   │  │ Components   │  │ Styling      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ shadcn/ui    │  │ Zustand      │  │ Lucide Icons  │  │
│  │ Components   │  │ State Mgmt   │  │ Icon Library  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└───────────────────────┬─────────────────────────────────────────┘
                        │ API Calls (REST)
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    API Layer                       │
├─────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Route Handlers (App Router API Routes)                │  │
│  │ /api/orders, /api/tasks, /api/inventory, etc.     │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Middleware & Validation                                 │  │
│  │ - Authentication/Authorization                          │  │
│  │ - Request Validation (Zod)                              │  │
│  │ - Error Handling                                         │  │
│  └───────────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────────┘
                        │ Database Queries
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Data Access Layer                    │
├─────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Prisma ORM                                             │  │
│  │ - Type-safe database access                             │  │
│  │ - Automatic migrations                                   │  │
│  │ - Query optimization                                     │  │
│  └───────────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────────┘
                        │ SQL
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   Database Layer                          │
├─────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ SQLite (Development) / PostgreSQL (Production)             │  │
│  │ - Multi-tenant schema                                  │  │
│  │ - Indexed tables                                        │  │
│  │ - ACID transactions                                     │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Multi-Tenant Architecture

**Tenant Isolation Strategy**: Database-level isolation with tenant_id on all tables

**Benefits:**
- Strong data separation between organizations
- Shared infrastructure for cost efficiency
- Easy tenant onboarding
- Tenant-specific data backups

**Implementation:**
```prisma
model Order {
  id        String   @id @default(cuid())
  tenantId  String   // Foreign key for tenant isolation
  // ... other fields
  
  @@index([tenantId])
}
```

**Access Control:**
- All queries filter by `tenantId`
- Middleware ensures user can only access their tenant's data
- Tenant context derived from authenticated user session

---

### 1.3 Component Architecture

**Frontend Component Hierarchy:**

```
src/
├── app/                          # Next.js App Router pages
│   ├── (dashboard)/              # Dashboard group
│   ├── orders/                   # Order management pages
│   ├── planning/                 # Planning pages
│   │   ├── page.tsx           # Planning overview
│   │   ├── gantt/page.tsx     # Gantt chart
│   │   └── kanban/page.tsx    # Kanban board
│   ├── production/               # Production pages
│   ├── tasks/                   # Task detail pages
│   ├── inventory/                # Inventory pages
│   ├── machines/                # Machine pages
│   ├── users/                   # User management
│   ├── settings/                # System settings
│   └── layout.tsx             # Root layout
├── components/
│   ├── ui/                     # shadcn/ui components
│   └── layout/                 # Layout components
│       ├── app-layout.tsx       # Main layout
│       └── app-sidebar.tsx      # Sidebar navigation
├── lib/                        # Utilities and helpers
│   ├── db.ts                   # Prisma client
│   └── utils.ts                # Utility functions
└── stores/                     # State management
    └── authStore.ts            # Authentication state
```

---

## 2. Technology Stack

### 2.1 Core Technologies

| Layer | Technology | Version | Purpose |
|--------|-------------|----------|---------|
| **Frontend Framework** | Next.js | 16.1+ | React framework with server components and App Router |
| **UI Library** | React | 19.0+ | User interface library |
| **Styling** | Tailwind CSS | 4.0+ | Utility-first CSS framework |
| **UI Components** | shadcn/ui | Latest | Pre-built accessible components based on Radix UI |
| **Icons** | Lucide React | 0.525+ | Icon library |
| **State Management** | Zustand | 5.0+ | Client-side state management |
| **Server State** | TanStack Query | 5.82+ | Server state management and caching |
| **Forms** | React Hook Form | 7.60+ | Form handling with validation |
| **Validation** | Zod | 4.0+ | Schema validation |
| **Drag & Drop** | @dnd-kit/core | 6.3.1+ | Drag-and-drop functionality |
| **ORM** | Prisma | 6.11+ | Type-safe database client |
| **Database** | SQLite / PostgreSQL | Latest | Relational database |
| **Authentication** | NextAuth.js | 4.24+ | Authentication library (planned) |
| **Charts** | Recharts | 2.15+ | Charting library |
| **Date Handling** | date-fns | 4.1.0+ | Date manipulation |

### 2.2 Development Tools

| Tool | Purpose |
|------|---------|
| **TypeScript** 5+ | Type safety and developer experience |
| **ESLint** 9+ | Code linting and consistency |
| **Bun** | Fast JavaScript runtime and package manager |
| **Git** | Version control |

### 2.3 Technology Rationale

**Next.js 16**:
- Server Components for performance
- App Router for modern routing
- Built-in API routes
- Excellent developer experience
- Strong community and ecosystem

**TypeScript**:
- Catch errors at compile time
- Better IDE support with autocomplete
- Self-documenting code
- Easier refactoring

**Tailwind CSS**:
- Utility-first approach for rapid development
- Consistent design system
- Easy customization
- Small bundle size

**shadcn/ui**:
- Beautiful, accessible components
- Fully customizable (copy to your project)
- Built on Radix UI primitives
- TypeScript support

**Prisma ORM**:
- Type-safe database access
- Excellent TypeScript integration
- Auto-generated client
- Migration management
- Multiple database support

**Zustand**:
- Simple and lightweight
- TypeScript support
- Easy testing
- No boilerplate

---

## 3. Database Design

### 3.1 Database Overview

**Development**: SQLite (embedded, easy setup, local development)
**Production**: PostgreSQL (enterprise-grade, performance, reliability)

**ORM**: Prisma - Provides type-safe database access with auto-generated client

### 3.2 Schema Organization

**Data Hierarchy:**
```
Tenant (Organization)
  ├─ BusinessUnit
  ├─ Board
  ├─ Order (Customer Order)
  │   └─ ManufacturingOrder
  │       └─ Jobsheet
  │           └─ MachiningTask
  ├─ Machine
  │   └─ Breakdown
  ├─ User
  │   └─ UserSettings
  ├─ Role
  ├─ SystemSettings
  └─ Inventory
      └─ InventoryLog
```

### 3.3 Core Entities

#### Tenant
```prisma
model Tenant {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### Order
```prisma
model Order {
  id                String      @id @default(cuid())
  tenantId          String
  boardId           String
  orderNumber       String      @unique([tenantId])
  customerName      String
  customerEmail     String?
  customerPhone     String?
  status            OrderStatus @default(DRAFT)
  plannedStartDate  DateTime?
  plannedEndDate    DateTime?
  actualStartDate   DateTime?
  actualEndDate     DateTime?
  progressPercent   Float       @default(0)
  drawingUrl        String?
  notes             String?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
}
```

#### ManufacturingOrder
```prisma
model ManufacturingOrder {
  id               String    @id @default(cuid())
  tenantId         String
  orderId          String
  moNumber         String    @unique([tenantId, orderId])
  name             String
  description      String?
  type             MOType    @default(MAIN)
  status           MOStatus  @default(PLANNED)
  plannedStartDate DateTime?
  plannedEndDate   DateTime?
  actualStartDate  DateTime?
  actualEndDate    DateTime?
  progressPercent  Float      @default(0)
}
```

#### Jobsheet
```prisma
model Jobsheet {
  id               String        @id @default(cuid())
  tenantId         String
  moId             String
  jsNumber         String
  name             String
  description      String?
  type             JobsheetType @default(SINGLE_PART)
  status           JobsheetStatus @default(PREPARING)
  dependsOn        String?
  progressPercent  Float         @default(0)
}
```

#### MachiningTask
```prisma
model MachiningTask {
  id                String     @id @default(cuid())
  tenantId          String
  jobsheetId        String
  taskNumber        String
  name              String
  description       String?
  machineId         String?
  status            TaskStatus @default(PENDING)
  plannedHours      Float?
  actualHours       Float?
  clockedInAt        DateTime?
  clockedOutAt       DateTime?
  breakdownAt       DateTime?
  breakdownNote     String?
  assignedTo        String?
  progressPercent   Float      @default(0)
  dependsOn         String?
  notes             String?
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt
}
```

#### Machine
```prisma
model Machine {
  id                  String        @id @default(cuid())
  tenantId            String
  code                String        @unique([tenantId])
  name                String
  model               String?
  location            String?
  type                String?
  status              MachineStatus @default(IDLE)
  capacity            Float?
  lastMaintenanceAt   DateTime?
  nextMaintenanceAt   DateTime?
  isActive            Boolean       @default(true)
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt
}
```

#### Breakdown
```prisma
model Breakdown {
  id              String    @id @default(cuid())
  tenantId        String
  machineId       String
  reportedBy      String
  reportedAt      DateTime  @default(now())
  type            BreakdownType @default(MECHANICAL)
  description     String
  notes           String?
  resolved        Boolean   @default(false)
  resolvedAt      DateTime?
  resolvedBy      String?
  resolution      String?
  affectedTaskId  String?
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
}
```

#### Inventory
```prisma
model Inventory {
  id          String        @id @default(cuid())
  tenantId    String
  partNumber  String
  name        String
  description String?
  category    String?
  batch       String?
  quantity    Float         @default(0)
  unit        String?
  location    String?
  shelf       String?
  status      MaterialStatus @default(AVAILABLE)
  supplier    String?
  supplierRef String?
  receivedAt  DateTime?
  expiryDate  DateTime?
  notes       String?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}
```

#### User
```prisma
model User {
  id            String   @id @default(cuid())
  tenantId      String
  email         String   @unique([tenantId])
  name          String?
  phone         String?
  roleId        String
  passwordHash  String
  isActive      Boolean  @default(true)
  avatarUrl     String?
  employeeId    String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

#### Role
```prisma
model Role {
  id          String   @id @default(cuid())
  name        String
  code        String   @unique
  description String?
  isSystem    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 3.4 Database Indexes

**Strategic Indexes:**

```prisma
// Query Optimization
@@index([tenantId, orderNumber])        // Fast order lookup
@@index([tenantId, status])             // Filter by status
@@index([machineId, status])              // Machine status queries
@@index([assignedTo, status])             // User task queries
@@index([jobsheetId])                   // Task grouping
@@index([manufacturingOrderId])           // Jobsheet grouping
@@index([orderId])                      // MO grouping
@@index([partNumber, batch])             // Inventory lookup

// Performance Indexes
@@index([createdAt])                    // Recent items
@@index([updatedAt])                    // Modified items
@@index([plannedStartDate, plannedEndDate]) // Date range queries
@@index([reportedAt])                   // Breakdown timeline
```

### 3.5 Database Transactions

**Cascading Progress Updates:**
```typescript
// Atomic progress recalculation
await db.$transaction(async (tx) => {
  // Update jobsheet
  await tx.jobsheet.update({
    where: { id: jobsheetId },
    data: { progressPercent: newProgress }
  })
  
  // Update MO
  await tx.manufacturingOrder.update({
    where: { id: moId },
    data: { progressPercent: moProgress }
  })
  
  // Update Order
  await tx.order.update({
    where: { id: orderId },
    data: { progressPercent: orderProgress }
  })
})
```

**Material Reservation:**
```typescript
await db.$transaction(async (tx) => {
  // Check availability
  const inventory = await tx.inventory.findUnique({
    where: { id: materialId }
  })
  
  if (inventory!.quantity < quantity) {
    throw new Error('Insufficient quantity')
  }
  
  // Create reservation log
  await tx.inventoryLog.create({
    data: {
      inventoryId: materialId,
      type: 'RESERVATION',
      quantity: -quantity,
      reference: orderId
    }
  })
  
  // Update inventory
  await tx.inventory.update({
    where: { id: materialId },
    data: {
      quantity: inventory!.quantity - quantity,
      status: 'RESERVED'
    }
  })
})
```

---

## 4. API Specifications

### 4.1 API Architecture

**RESTful API Design** using Next.js App Router

**Base URL**: `/api`

**Content-Type**: `application/json`

**Authentication**: Session-based (NextAuth.js planned)

### 4.2 API Response Format

**Success Response:**
```json
{
  "data": {
    // Response data
  },
  "meta": {
    // Pagination, timestamps, etc.
  }
}
```

**Error Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### 4.3 Core API Endpoints

#### Order Management

```typescript
GET    /api/orders              // List orders with filtering
POST   /api/orders              // Create new order
GET    /api/orders/[id]         // Get order details
PUT    /api/orders/[id]         // Update order
DELETE /api/orders/[id]         // Delete order
```

#### Manufacturing Orders

```typescript
GET    /api/mos                 // List manufacturing orders
POST   /api/mos                 // Create manufacturing order
GET    /api/mos/[id]            // Get MO details
PUT    /api/mos/[id]            // Update MO
DELETE /api/mos/[id]            // Delete MO
```

#### Jobsheets

```typescript
GET    /api/jobsheets            // List jobsheets
POST   /api/jobsheets            // Create jobsheet
GET    /api/jobsheets/[id]       // Get jobsheet details
PUT    /api/jobsheets/[id]       // Update jobsheet
DELETE /api/jobsheets/[id]       // Delete jobsheet
```

#### Tasks

```typescript
GET    /api/tasks                // List tasks
POST   /api/tasks                // Create task
GET    /api/tasks/[id]           // Get task details
PUT    /api/tasks/[id]           // Update task
DELETE /api/tasks/[id]           // Delete task
POST   /api/tasks/[id]/clock     // Clock in/out
PUT    /api/tasks/[id]/status    // Update status (Kanban)
GET    /api/tasks/[id]/detail   // Full task with relations
```

#### Kanban Board

```typescript
GET    /api/kanban              // Get tasks for Kanban board
// Query params: machineId, assignedTo, moId, status
```

#### Gantt Chart

```typescript
GET    /api/orders/gantt         // Get timeline data
// Returns: Orders, MOs, Jobsheets, Tasks
```

#### Machines

```typescript
GET    /api/machines             // List machines
POST   /api/machines             // Register machine
GET    /api/machines/[id]        // Get machine details
PUT    /api/machines/[id]        // Update machine
DELETE /api/machines/[id]        // Delete machine
```

#### Breakdowns

```typescript
GET    /api/breakdowns           // List breakdowns
POST   /api/breakdowns           // Report breakdown
PUT    /api/breakdowns/[id]/resolve // Resolve breakdown
GET    /api/breakdowns/[id]      // Get breakdown details
```

#### Inventory

```typescript
GET    /api/inventory             // List materials
POST   /api/inventory             // Register material
GET    /api/inventory/[id]        // Get material details
PUT    /api/inventory/[id]        // Update material
DELETE /api/inventory/[id]        // Delete material
POST   /api/inventory/reserve   // Reserve materials
GET    /api/inventory/logs       // Get transaction history
```

#### Users & Roles

```typescript
GET    /api/users                // List users
POST   /api/users                // Create user
GET    /api/users/[id]           // Get user details
PUT    /api/users/[id]           // Update user
DELETE /api/users/[id]           // Delete user

GET    /api/roles                // List roles
POST   /api/roles                // Create role
GET    /api/roles/[id]           // Get role details
PUT    /api/roles/[id]           // Update role
DELETE /api/roles/[id]           // Delete role
```

#### Settings

```typescript
GET    /api/settings              // Get system settings
POST   /api/settings              // Create setting
GET    /api/settings/[id]         // Get setting details
PUT    /api/settings/[id]         // Update setting
DELETE /api/settings/[id]         // Delete setting

GET    /api/usersettings          // Get user settings
PUT    /api/usersettings          // Update user settings

GET    /api/init                 // Check initialization status
POST   /api/init                 // Initialize default data
```

#### Analytics

```typescript
GET    /api/analytics/production  // Production metrics
GET    /api/analytics/orders      // Order analytics
GET    /api/analytics/resources    // Resource utilization
GET    /api/reports               // Generate reports
GET    /api/reports/production    // Production reports
```

### 4.4 API Validation

**Zod Schemas for Input Validation:**

```typescript
// Order validation
const orderSchema = z.object({
  orderNumber: z.string().min(1).max(50),
  customerName: z.string().min(1).max(200),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  boardId: z.string(),
  plannedStartDate: z.coerce.date().optional(),
  plannedEndDate: z.coerce.date().optional(),
})

// Task status update validation
const taskStatusSchema = z.object({
  status: z.enum(['PENDING', 'ASSIGNED', 'RUNNING', 'PAUSED', 'COMPLETED', 'CANCELLED', 'ON_HOLD']),
  notes: z.string().optional(),
})

// User creation validation
const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100).optional(),
  roleId: z.string(),
  password: z.string().min(8),
  tenantId: z.string(),
})
```

### 4.5 Error Handling

**Error Types:**

| Error Code | HTTP Status | Description |
|------------|--------------|-------------|
| VALIDATION_ERROR | 400 | Input validation failed |
| NOT_FOUND | 404 | Resource not found |
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | Access denied |
| CONFLICT | 409 | Resource already exists |
| INTERNAL_ERROR | 500 | Server error |

**Error Response Structure:**
```typescript
{
  error: {
    code: string,
    message: string,
    details?: any[],
    stack?: string  // Only in development
  }
}
```

---

## 5. Security Architecture

### 5.1 Security Layers

```
┌─────────────────────────────────────────────────────────┐
│          Network Security Layer                   │
│  - HTTPS/TLS 1.3+                              │
│  - DDoS protection                                 │
│  - WAF (Web Application Firewall)                   │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│         Application Security Layer                 │
│  - Authentication (NextAuth.js)                     │
│  - Authorization (RBAC)                            │
│  - Input Validation (Zod)                           │
│  - Output Encoding                                   │
│  - CSRF Protection                                  │
│  - Rate Limiting                                    │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│           Data Security Layer                       │
│  - Encryption at rest                               │
│  - Password hashing (bcrypt/argon2)                    │
│  - SQL injection prevention                           │
│  - XSS protection                                   │
│  - Tenant isolation                                  │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Authentication & Authorization

**Authentication (Planned with NextAuth.js):**
```typescript
// Session-based authentication
export const authOptions: NextAuthOptions = {
  providers: [
    // Email/Password provider
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Validate credentials
        const user = await authenticateUser(credentials)
        return user ? user : null
      }
    })
  ],
  session: {
    strategy: "database",
    maxAge: 60 * 60, // 1 hour
  },
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/login',
  }
}
```

**Authorization (Role-Based Access Control):**

**Roles:**
1. ROLE_SUPER_ADMIN - Full system access
2. ROLE_ADMIN - Administrative access
3. ROLE_PPIC - Production Planning and Inventory Control
4. ROLE_MANAGER - Department manager
5. ROLE_TECHNICIAN - Production technician
6. ROLE_WAREHOUSE - Warehouse staff
7. ROLE_CUSTOMER - Customer (view only)

**Role Permissions Matrix:**

| Permission | Super Admin | Admin | PPIC | Manager | Technician | Warehouse | Customer |
|------------|-------------|--------|-------|---------|------------|------------|----------|
| Create Orders | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Update Orders | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Delete Orders | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Create Tasks | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Update Tasks | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Manage Inventory | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ |
| Manage Users | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Manage Settings | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |

### 5.3 Data Protection

**SQL Injection Prevention:**
```typescript
// Prisma ORM automatically parameterizes queries
// No raw SQL without validation

const user = await db.user.findMany({
  where: {
    // Prisma escapes parameters automatically
    email: userInput,
    tenantId: session.tenantId
  }
})
```

**XSS Protection:**
```typescript
// React automatically escapes output
// Additional sanitization for user content
import DOMPurify from 'dompurify'

const safeHTML = DOMPurify.sanitize(userContent)
```

**Password Hashing:**
```typescript
import bcrypt from 'bcrypt'

const saltRounds = 10
const hash = await bcrypt.hash(password, saltRounds)

const isValid = await bcrypt.compare(plainPassword, hash)
```

**Tenant Data Isolation:**
```typescript
// Middleware adds tenant filter to all queries
export async function GET(req: NextRequest) {
  const session = await getServerSession()
  
  const orders = await db.order.findMany({
    where: {
      tenantId: session.tenantId  // Always filter by tenant
    }
  })
}
```

### 5.4 Security Headers

```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
]
```

---

## 6. Frontend Architecture

### 6.1 Component Structure

**Page Components** (`src/app/`):
- Server Components (default): SEO, data fetching, initial render
- Client Components ('use client'): Interactivity, state, hooks

**UI Components** (`src/components/ui/`):
- Reusable shadcn/ui components
- Based on Radix UI primitives
- Fully accessible

**Layout Components** (`src/components/layout/`):
- AppLayout: Main application wrapper
- AppSidebar: Navigation sidebar
- Header: Page header with user info

### 6.2 State Management

**Zustand Store Structure:**

```typescript
// authStore.ts
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false }),
}))
```

**Server State (TanStack Query):**
```typescript
// Example: Fetch tasks
function useTasks(filters?: TaskFilters) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => fetch('/api/tasks?' + new URLSearchParams(filters)).then(r => r.json()),
    staleTime: 1000 * 60, // 1 minute
  })
}
```

### 6.3 Client-Side Routing

**Next.js App Router:**
```typescript
// File-based routing
src/app/
├── orders/
│   ├── page.tsx        // /orders
│   └── [id]/
│       └── page.tsx    // /orders/123
├── planning/
│   ├── kanban/
│   │   └── page.tsx    // /planning/kanban
│   └── gantt/
│       └── page.tsx    // /planning/gantt
```

### 6.4 Styling Strategy

**Tailwind CSS Configuration:**
```typescript
// tailwind.config.ts
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        // ... other colors
      }
    }
  },
  plugins: [tailwindAnimate],
}
```

**CSS Variables (Theme Support):**
```css
/* globals.css */
:root {
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
}

.dark {
  --primary: 217.2 32.6% 17.5%;
  --primary-foreground: 210 40% 98%;
}
```

### 6.5 Accessibility Features

**WCAG 2.1 AA Compliance:**

```typescript
// Semantic HTML
<main>
  <h1>Page Title</h1>
  <nav>Navigation</nav>
  <section>Content</section>
</main>

// ARIA Labels
<button aria-label="Close dialog">
  <X />
</button>

// Keyboard Navigation
<div onKeyDown={handleKeyDown}>
  {/* Content */}
</div>

// Focus Management
import { FocusTrap } from '@radix-ui/react-focus-traps'
```

---

## 7. Infrastructure & Deployment

### 7.1 Deployment Architecture

**Development Environment:**
- Local development with `bun run dev`
- SQLite database embedded in project
- Hot module replacement
- TypeScript compilation

**Production Environment:**

```
┌─────────────────────────────────────────────────────────┐
│               Load Balancer (AWS ALB)              │
└─────────────┬───────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│         Next.js Application Servers                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Server 1 │  │ Server 2 │  │ Server 3 │  │
│  └──────────┘  └──────────┘  └──────────┘  │
└─────────────┬───────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────┐
│          PostgreSQL (RDS)                        │
│  - Multi-tenant database                          │
│  - Automatic backups                              │
│  - Read replicas                                 │
└─────────────────────────────────────────────────────────┘
```

### 7.2 Cloud Infrastructure (AWS)

**Services:**

| Service | Purpose |
|---------|---------|
| **EC2 / Elastic Beanstalk** | Application servers |
| **RDS PostgreSQL** | Managed database |
| **S3** | Static assets, file storage |
| **CloudFront** | CDN for static assets |
| **ALB** | Load balancing |
| **Route 53** | DNS management |
| **ElastiCache** | Caching layer |
| **CloudWatch** | Monitoring and logging |

### 7.3 CI/CD Pipeline

**GitHub Actions Workflow:**

```yaml
name: ManuOS CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
      - name: Install dependencies
        run: bun install
      - name: Run linter
        run: bun run lint
      - name: Run tests
        run: bun test
  
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
      - name: Install dependencies
        run: bun install
      - name: Build application
        run: bun run build
      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: nextjs-app
          path: .next
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to AWS
        run: # AWS deployment script
```

### 7.4 Environment Configuration

**Environment Variables:**

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/manuos"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="https://app.manuos.com"

# App
NEXT_PUBLIC_APP_URL="https://app.manuos.com"
NEXT_PUBLIC_API_URL="https://api.manuos.com"

# SMTP (Email)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="noreply@manuos.com"
SMTP_PASSWORD="your-password"

# Storage
AWS_S3_BUCKET="manuos-uploads"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
```

---

## 8. Performance & Scalability

### 8.1 Performance Optimization

**Next.js Optimizations:**

```typescript
// Server Components for data fetching
async function OrdersPage() {
  const orders = await db.order.findMany()  // Server-side
  return <OrdersList orders={orders} />
}

// Image optimization
import Image from 'next/image'

<Image 
  src="/logo.png"
  alt="ManuOS"
  width={200}
  height={50}
  priority  // Above-the-fold images
/>

// Font optimization
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })
```

**Database Optimization:**

```typescript
// Select only needed fields
const orders = await db.order.findMany({
  select: {
    id: true,
    orderNumber: true,
    customerName: true,
    progressPercent: true,
    // Avoid fetching relations if not needed
  }
})

// Pagination
const orders = await db.order.findMany({
  skip: (page - 1) * limit,
  take: limit,
})

// Batch operations
await db.$transaction(async (tx) => {
  await Promise.all([
    tx.order.create({ data: order1 }),
    tx.order.create({ data: order2 }),
    tx.order.create({ data: order3 }),
  ])
})
```

**Caching Strategy:**

```typescript
// Server-side caching
const cachedOrders = await redis.get(`orders:${tenantId}`)

if (!cachedOrders) {
  const orders = await db.order.findMany({
    where: { tenantId }
  })
  await redis.setex(`orders:${tenantId}`, 300, JSON.stringify(orders))
}

// Client-side caching with TanStack Query
const { data } = useQuery({
  queryKey: ['orders'],
  queryFn: fetchOrders,
  staleTime: 1000 * 60,  // Cache for 1 minute
})
```

### 8.2 Scalability Strategy

**Horizontal Scaling:**

1. **Application Servers**
   - Auto-scaling group (2-10 servers)
   - Scale based on CPU/memory metrics
   - Blue-green deployments

2. **Database**
   - Read replicas for query scaling
   - Connection pooling
   - Database sharding if needed

3. **Caching Layer**
   - Redis cluster for session and data caching
   - CDN for static assets
   - Edge caching via CloudFront

**Capacity Planning:**

| Metric | Target | Scaling Trigger |
|--------|--------|----------------|
| CPU Utilization | < 70% | Scale up at 80% |
| Memory Usage | < 80% | Scale up at 90% |
| Response Time | < 1s | Scale up at 2s |
| Concurrent Users | 500 | Consider read replicas at 300 |

---

## 9. Monitoring & Logging

### 9.1 Application Logging

**Structured Logging:**

```typescript
import { pino } from 'pino'

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
  },
})

logger.info({
  event: 'task_completed',
  userId: session.user.id,
  taskId: taskId,
  duration: 3600  // seconds
})
```

**Log Levels:**
- `error`: Critical errors requiring attention
- `warn`: Warning conditions
- `info`: General informational messages
- `debug`: Detailed debugging info

### 9.2 Error Tracking

**Sentry Integration (Planned):**

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
})
```

### 9.3 Performance Monitoring

**Metrics to Track:**

```typescript
// Application Performance Monitoring (APM)
const metrics = {
  // Response times
  apiResponseTime: histogram('api_response_time_ms'),
  pageLoadTime: histogram('page_load_time_ms'),
  
  // Throughput
  requestsPerSecond: counter('requests_per_second'),
  activeUsers: gauge('active_users'),
  
  // Error rates
  errorRate: counter('errors_total'),
  apiErrors: counter('api_errors_total'),
  
  // Database
  dbQueryTime: histogram('db_query_time_ms'),
  dbConnections: gauge('db_connections'),
}
```

### 9.4 Health Checks

**Health Endpoint:**

```typescript
// GET /api/health
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    disk: await checkDiskSpace(),
    memory: await checkMemory(),
  }
  
  const healthy = Object.values(checks).every(c => c.healthy)
  
  return Response.json({
    status: healthy ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString(),
  }, { status: healthy ? 200 : 503 })
}
```

---

## 10. Testing Strategy

### 10.1 Testing Pyramid

```
          /\
         /  \
        /  E2E  \       ← End-to-End Tests (10%)
       /          \
      /   Integration \  ← Integration Tests (20%)
     /              \
    /    Unit Tests    \  ← Unit Tests (70%)
   /____________________\
```

### 10.2 Unit Testing

**Testing Framework**: Vitest

```typescript
// Example: Task status validation
import { describe, it, expect } from 'vitest'
import { validateTaskStatus } from '@/lib/validation'

describe('Task Status Validation', () => {
  it('should allow transition from PENDING to ASSIGNED', () => {
    const result = validateTaskStatus('PENDING', 'ASSIGNED')
    expect(result.valid).toBe(true)
  })
  
  it('should prevent transition from COMPLETED to PENDING', () => {
    const result = validateTaskStatus('COMPLETED', 'PENDING')
    expect(result.valid).toBe(false)
    expect(result.message).toContain('Invalid transition')
  })
})
```

### 10.3 Integration Testing

**API Endpoint Testing:**

```typescript
import { describe, it, expect } from 'vitest'
import { POST } from '@/app/api/tasks/route'

describe('POST /api/tasks', () => {
  it('should create a new task', async () => {
    const request = new Request('http://localhost:3000/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Task',
        jobsheetId: 'js-123',
        plannedHours: 8,
      }),
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(201)
    expect(data.task).toBeDefined()
    expect(data.task.name).toBe('Test Task')
  })
})
```

### 10.4 End-to-End Testing

**E2E Framework**: Playwright

```typescript
import { test, expect } from '@playwright/test'

test('Kanban board drag and drop', async ({ page }) => {
  await page.goto('/planning/kanban')
  
  // Get task card
  const taskCard = page.locator('[data-testid="task-123"]')
  
  // Get target column
  const completedColumn = page.locator('[data-testid="column-COMPLETED"]')
  
  // Drag and drop
  await taskCard.dragTo(completedColumn)
  
  // Verify task moved
  await expect(taskCard).toBeIn(completedColumn)
})
```

### 10.5 Test Coverage

**Target Coverage**: 80%

**Tools:**
- Vitest Coverage
- CodeCov for reporting

```bash
bun run test:coverage
```

---

## 11. Development Workflow

### 11.1 Git Workflow

**Branching Strategy:**

```
main (production)
  ↑
develop
  ↑
feature/kanban-board
feature/analytics-dashboard
bugfix/task-status-validation
hotfix/security-patch
```

**Commit Convention:**

```
feat: Add Kanban board feature
fix: Resolve task status validation error
docs: Update API documentation
style: Format code with Prettier
refactor: Optimize database queries
test: Add unit tests for validation
chore: Update dependencies
```

### 11.2 Code Review Process

**Pull Request Requirements:**
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console errors
- [ ] TypeScript compilation successful
- [ ] ESLint passing
- [ ] Manual testing performed

### 11.3 Release Process

**Versioning**: Semantic Versioning (SemVer)

```
MAJOR.MINOR.PATCH

1.0.0  → Initial release
1.1.0  → New feature (backward compatible)
1.1.1  → Bug fix (backward compatible)
2.0.0  → Breaking changes
```

**Release Checklist:**
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Changelog updated
- [ ] Version bumped
- [ ] Tagged in Git
- [ ] Deployed to staging
- [ ] Smoke tests on staging
- [ ] Deployed to production
- [ ] Production smoke tests
- [ ] Monitoring active

---

## 12. Appendix

### 12.1 API Rate Limiting

**Rate Limits:**

| Endpoint | Limit | Window |
|----------|-------|--------|
| API Requests | 1000 | 1 hour |
| Auth Attempts | 5 | 15 minutes |
| File Uploads | 10 | 1 hour |

### 12.2 Backup Strategy

**Database Backups:**
- Daily full backups (retained 30 days)
- Hourly incremental backups (retained 7 days)
- Point-in-time recovery capability
- Backups encrypted at rest

**Recovery Plan:**
- RTO (Recovery Time Objective): 4 hours
- RPO (Recovery Point Objective): 1 hour

### 12.3 Disaster Recovery

**Multi-Region Deployment:**
- Primary region: US-East-1
- Backup region: US-West-2
- Data replication with < 5 minutes lag

**Failover Process:**
1. Detect primary region failure
2. DNS failover to backup region
3. Notify operations team
4. Begin recovery of primary region

---

## Document Control

**Version History:**

| Version | Date | Author | Changes |
|---------|-------|--------|---------|
| 1.0 | Jan 2025 | Initial TSD for ManuOS Platform |

**Next Review**: March 2025

---

**Approved By**: _______________

**Date**: _______________
