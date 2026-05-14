# Technical Specification Document (TSD)
# ManuOS - Manufacturing Operating System

**Document Version**: 2.0
**Last Updated**: May 2026
**Product Name**: ManuOS
**Architecture**: Multi-Tenant SaaS with Real-Time Capabilities

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Technology Stack](#2-technology-stack)
3. [Database Schema](#3-database-schema)
4. [API Specifications](#4-api-specifications)
5. [Real-Time System](#5-real-time-system)
6. [Integration Architecture](#6-integration-architecture)
7. [Security Architecture](#7-security-architecture)
8. [Deployment Architecture](#8-deployment-architecture)
9. [Performance Considerations](#9-performance-considerations)
10. [Development Guidelines](#10-development-guidelines)

---

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Client Layer                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │
│  │ Web Browser     │  │ Mobile Browser  │  │ SSE Client      │        │
│  │ (Desktop)       │  │ (Responsive)    │  │ (Real-time)     │        │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘        │
│           │                    │                    │                   │
└───────────┼────────────────────┼────────────────────┼───────────────────┘
            │ HTTPS              │ HTTPS              │ SSE
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Next.js Application Layer                          │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        App Router                                │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐  │   │
│  │  │ Pages      │  │ API Routes │  │ Middleware │  │ layouts  │  │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └──────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      Business Logic Layer                        │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐  │   │
│  │  │ Services   │  │ Validators │  │ Auth       │  │ Events   │  │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └──────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ Prisma Client
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Data Layer                                       │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         Prisma ORM                               │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐                │   │
│  │  │ Migrations │  │ Queries    │  │ Relations  │                │   │
│  │  └────────────┘  └────────────┘  └────────────┘                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ SQL
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       Database Layer                                     │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐                    ┌─────────────────┐            │
│  │ SQLite          │                    │ PostgreSQL      │            │
│  │ (Development)   │                    │ (Production)    │            │
│  └─────────────────┘                    └─────────────────┘            │
└─────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    External Integrations                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │
│  │ Odoo ERP        │  │ Email Service   │  │ File Storage    │        │
│  │ (XML-RPC)       │  │ (Future)        │  │ (Future)        │        │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘        │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Component Architecture

#### Frontend Architecture
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard layout
│   ├── api/               # API route handlers
│   ├── orders/            # Order management
│   ├── mo/                # Manufacturing orders
│   ├── production/        # Production execution
│   ├── inventory/         # Inventory management
│   ├── machines/          # Machine management
│   ├── reports/           # Reports & analytics
│   └── settings/          # System settings
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── layout/            # Layout components
│   ├── gantt/             # Gantt chart components
│   ├── kanban/            # Kanban board components
│   └── production/        # Production-specific components
├── lib/
│   ├── db.ts              # Prisma client
│   ├── auth/              # Authentication utilities
│   ├── inventory/         # Inventory services
│   ├── mrp/               # MRP calculation
│   ├── events/            # SSE event system
│   └── integrations/      # External integrations
├── hooks/                 # Custom React hooks
├── stores/                # Zustand state stores
└── types/                 # TypeScript type definitions
```

#### Backend Architecture
```
src/app/api/
├── orders/                # Order CRUD operations
├── mo/                    # Manufacturing order operations
│   └── [id]/
│       ├── materials/     # Material requirements
│       └── materials/
│           └── allocate/  # Material allocation
├── jobsheets/             # Jobsheet operations
├── tasks/                 # Task operations
├── production-output/     # Production output recording
│   ├── tasks/            # Tasks for output
│   └── [id]/
│       └── qc/           # QC inspection
├── inventory/             # Inventory operations
│   └── events/           # SSE endpoint
├── handoffs/              # Material handoff operations
├── machines/              # Machine operations
├── users/                 # User management
└── settings/              # System settings
```

---

## 2. Technology Stack

### 2.1 Core Technologies

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| Runtime | Node.js | 18+ | Server runtime |
| Framework | Next.js | 16.x | Full-stack framework |
| Language | TypeScript | 5.x | Type safety |
| UI Framework | React | 18.x | Component model |
| Styling | Tailwind CSS | 4.x | Utility-first CSS |
| Component Library | shadcn/ui | Latest | Accessible components |

### 2.2 Data Layer

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| ORM | Prisma | 6.x | Database access |
| Dev Database | SQLite | 3.x | Local development |
| Prod Database | PostgreSQL | 15+ | Production database |
| State Management | Zustand | 4.x | Client state |
| Data Fetching | TanStack Query | 5.x | Server state |

### 2.3 Integration Technologies

| Component | Technology | Purpose |
|-----------|------------|---------|
| ERP Integration | XML-RPC | Odoo communication |
| Real-Time | SSE | Server-Sent Events |
| Authentication | Cookies/JWT | User sessions |
| Validation | Zod | Schema validation |

### 2.4 Build & Dev Tools

| Tool | Purpose |
|------|---------|
| ESLint | Code linting |
| TypeScript | Type checking |
| Bun | Package manager & runtime |
| Turbopack | Fast bundling |

---

## 3. Database Schema

### 3.1 Core Tables

#### Organization
```
Tenant
  - id: String (PK)
  - name: String
  - slug: String (unique)
  - isActive: Boolean

BusinessUnit
  - id: String (PK)
  - tenantId: String (FK)
  - name: String
  - code: String
  - location: String

User
  - id: String (PK)
  - tenantId: String (FK)
  - email: String
  - name: String
  - roleId: String (FK)
  - passwordHash: String
  - isActive: Boolean

Role
  - id: String (PK)
  - code: String (unique)
  - name: String
  - isSystem: Boolean
```

#### Order Management
```
Order
  - id: String (PK)
  - tenantId: String (FK)
  - orderNumber: String
  - customerName: String
  - status: OrderStatus
  - plannedStartDate: DateTime
  - plannedEndDate: DateTime
  - boardId: String (FK)

ManufacturingOrder
  - id: String (PK)
  - tenantId: String (FK)
  - orderId: String (FK)
  - moNumber: String
  - name: String
  - isOutsourced: Boolean
  - vendorId: String? (FK)
  - status: MOStatus
  - recipeId: String? (FK)

Jobsheet
  - id: String (PK)
  - tenantId: String (FK)
  - moId: String (FK)
  - jsNumber: String
  - name: String
  - status: JobsheetStatus

MachiningTask
  - id: String (PK)
  - tenantId: String (FK)
  - jobsheetId: String (FK)
  - taskNumber: String
  - name: String
  - machineId: String? (FK)
  - assignedTo: String? (FK)
  - status: TaskStatus
  - plannedHours: Float?
  - actualHours: Float?
```

#### Material Management
```
Recipe
  - id: String (PK)
  - tenantId: String (FK)
  - code: String
  - name: String
  - outputPartNumber: String

RecipeIngredient
  - id: String (PK)
  - tenantId: String (FK)
  - recipeId: String (FK)
  - partNumber: String
  - requiredQuantity: Float
  - unit: String

MaterialRequirement
  - id: String (PK)
  - tenantId: String (FK)
  - moId: String (FK)
  - partNumber: String
  - requiredQuantity: Float
  - status: RequirementStatus

JobsheetMaterial
  - id: String (PK)
  - tenantId: String (FK)
  - jobsheetId: String (FK)
  - materialRequirementId: String (FK)
  - status: AllocationStatus

TaskMaterialAllocation
  - id: String (PK)
  - tenantId: String (FK)
  - jobsheetMaterialId: String (FK)
  - inventoryId: String (FK)
  - quantity: Float
  - status: AllocationStatus
```

#### Inventory
```
Inventory
  - id: String (PK)
  - tenantId: String (FK)
  - partNumber: String
  - name: String
  - currentQuantity: Float
  - category: InventoryCategory
  - status: InventoryStatus
  - locationId: String (FK)
  - shelfId: String? (FK)
  - batch: String?

Location
  - id: String (PK)
  - tenantId: String (FK)
  - code: String
  - name: String
  - type: LocationType

Shelf
  - id: String (PK)
  - tenantId: String (FK)
  - locationId: String (FK)
  - code: String
  - name: String

InventoryTransaction
  - id: String (PK)
  - tenantId: String (FK)
  - inventoryId: String (FK)
  - type: TransactionType
  - quantity: Float
  - referenceType: String?
  - referenceId: String?

MaterialHandoff
  - id: String (PK)
  - tenantId: String (FK)
  - handoffNumber: String
  - fromLocationId: String (FK)
  - toLocationId: String (FK)
  - handedBy: String (FK)
  - status: HandoffStatus
```

#### Production Output & Quality
```
ProductionOutput
  - id: String (PK)
  - tenantId: String (FK)
  - outputNumber: String
  - taskId: String (FK)
  - jobsheetId: String (FK)
  - moId: String (FK)
  - partNumber: String
  - goodQuantity: Int
  - reworkQuantity: Int
  - scrapQuantity: Int
  - status: ProductionOutputStatus

QualityCheck
  - id: String (PK)
  - tenantId: String (FK)
  - qcNumber: String
  - referenceType: String
  - referenceId: String
  - status: QCStatus
  - result: QCResult?
  - inspectorId: String (FK)

ReworkOrder
  - id: String (PK)
  - tenantId: String (FK)
  - reworkNumber: String
  - qualityCheckId: String (FK)
  - status: ReworkStatus
```

### 3.2 Indexes

```sql
-- Performance indexes
CREATE INDEX idx_order_tenant ON Order(tenantId);
CREATE INDEX idx_mo_order ON ManufacturingOrder(orderId);
CREATE INDEX idx_jobsheet_mo ON Jobsheet(moId);
CREATE INDEX idx_task_jobsheet ON MachiningTask(jobsheetId);
CREATE INDEX idx_inventory_tenant_part ON Inventory(tenantId, partNumber);
CREATE INDEX idx_handoff_status ON MaterialHandoff(status);
CREATE INDEX idx_output_task ON ProductionOutput(taskId);
```

---

## 4. API Specifications

### 4.1 API Design Principles

- RESTful endpoints
- Consistent response format
- Proper HTTP status codes
- Tenant isolation via headers/cookies
- Request validation with Zod

### 4.2 Response Format

```typescript
// Success Response
{
  success: true,
  data: T,
  timestamp: string
}

// Error Response
{
  success: false,
  error: string,
  details?: unknown
}
```

### 4.3 Core API Endpoints

#### Orders
```
GET    /api/orders              List orders
POST   /api/orders              Create order
GET    /api/orders/[id]         Get order details
PUT    /api/orders/[id]         Update order
DELETE /api/orders/[id]         Delete order
```

#### Manufacturing Orders
```
GET    /api/mo                  List MOs
POST   /api/mo                  Create MO
GET    /api/mo/[id]             Get MO details
PUT    /api/mo/[id]             Update MO
DELETE /api/mo/[id]             Delete MO
GET    /api/mo/[id]/materials   Get MO materials
```

#### Material Allocation
```
POST   /api/mo/[id]/materials/allocate    Allocate material
DELETE /api/mo/[id]/materials/allocate    Deallocate material
```

#### Production Output
```
GET    /api/production-output/tasks       Get tasks for output
POST   /api/production-output             Record output
POST   /api/production-output/[id]/qc     Submit QC inspection
```

#### Inventory
```
GET    /api/inventory                     List inventory
POST   /api/inventory                     Create inventory item
GET    /api/inventory/events              SSE endpoint
```

#### Handoffs
```
GET    /api/handoffs                      List handoffs
POST   /api/handoffs                      Create handoff
PUT    /api/handoffs/[id]                 Update handoff
```

### 4.4 Authentication

```typescript
// Cookie-based (Development)
Set-Cookie: manos-user={JSON}; Path=/; HttpOnly

// JWT-based (Production)
Authorization: Bearer <token>
```

### 4.5 Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Validation error |
| 401 | Unauthorized - Not authenticated |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource conflict |
| 500 | Internal Server Error |

---

## 5. Real-Time System

### 5.1 Server-Sent Events (SSE)

ManuOS uses SSE for real-time inventory and production updates.

#### Event Types
```typescript
interface InventoryEvent {
  type: 'INVENTORY_UPDATE' | 'RESERVATION_UPDATE' | 
        'ALLOCATION_UPDATE' | 'HANDOFF_UPDATE'
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  data: {
    id: string
    partNumber?: string
    quantity?: number
    status?: string
    tenantId: string
  }
  timestamp: Date
}
```

#### SSE Endpoint
```
GET /api/inventory/events
```

#### Client Implementation
```javascript
const eventSource = new EventSource('/api/inventory/events');

eventSource.addEventListener('INVENTORY_UPDATE', (e) => {
  const event = JSON.parse(e.data);
  // Update UI
});

eventSource.addEventListener('HEARTBEAT', (e) => {
  // Keep connection alive
});
```

### 5.2 Event Emission

Events are emitted by:
1. Material allocation API (`/api/mo/[id]/materials/allocate`)
2. Production output API (`/api/production-output`)
3. Inventory transaction service

### 5.3 Connection Management

- Heartbeat every 30 seconds
- Automatic reconnection on disconnect
- Tenant-filtered events
- Connection count tracking

---

## 6. Integration Architecture

### 6.1 Odoo ERP Integration

#### XML-RPC Client
```typescript
class OdooClient {
  private commonClient: Client  // /xmlrpc/2/common
  private objectClient: Client  // /xmlrpc/2/object
  
  async authenticate(): Promise<number>
  async create(model: string, values: object): Promise<number>
  async searchRead(model: string, domain: unknown[][], fields: string[]): Promise<unknown[]>
  async write(model: string, ids: number[], values: object): Promise<boolean>
}
```

#### Supported Operations
| Operation | Model | Method |
|-----------|-------|--------|
| Create PO | purchase.order | create |
| Confirm Receipt | stock.picking | button_validate |
| Get Partner | res.partner | search_read |
| Get Product | product.product | search_read |

#### Configuration
```typescript
interface OdooConfig {
  baseUrl: string    // ODOO_URL
  db: string         // ODOO_DB
  username: string   // ODOO_USER
  password: string   // ODOO_PASSWORD
  enabled: boolean   // ODOO_ENABLED
}
```

### 6.2 Sync Flow

```
ManuOS PO Approved
       ↓
Map to Odoo format
       ↓
Get/Create Partner
       ↓
Get/Create Products
       ↓
Create PO in Odoo
       ↓
Update ManuOS with Odoo ID
       ↓
Log sync result
```

---

## 7. Security Architecture

### 7.1 Authentication

#### Development (Cookie-based)
```typescript
// Simple demo authentication
const user = JSON.parse(decodeURIComponent(cookie))
```

#### Production (JWT-based - Recommended)
```typescript
// JWT token with expiration
const token = jwt.sign(
  { userId, tenantId, role },
  SECRET_KEY,
  { expiresIn: '24h' }
)
```

### 7.2 Authorization

```typescript
// Role-based access check
function checkRole(requiredRoles: string[], user: AuthUser): boolean {
  return requiredRoles.includes(user.roleCode)
}

// Permission-based check
function hasPermission(permission: string, user: AuthUser): boolean {
  return ROLE_PERMISSIONS[user.roleCode]?.includes(permission)
}
```

### 7.3 Data Security

1. **Tenant Isolation**: All queries include `tenantId` filter
2. **SQL Injection**: Prevented via Prisma parameterized queries
3. **XSS**: React auto-escapes output
4. **CSRF**: Next.js built-in protection
5. **Password Storage**: Hashed with bcrypt (production)

### 7.4 API Security

```typescript
// Middleware example
export async function middleware(request: NextRequest) {
  const user = requireAuth(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // Check permissions...
}
```

---

## 8. Deployment Architecture

### 8.1 Development
```bash
# Local development
npm run dev

# Database
SQLite (prisma/dev.db)

# Features
- Hot reload
- Debug logging
- CORS enabled
```

### 8.2 Production
```bash
# Build
npm run build

# Start
npm start

# Database
PostgreSQL (managed)

# Features
- Server-side rendering
- API rate limiting
- Error tracking
```

### 8.3 Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### 8.4 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | Database connection | file:./dev.db |
| NEXT_PUBLIC_APP_URL | App URL | http://localhost:3000 |
| ODOO_URL | Odoo instance URL | https://demo.odoo.com |
| ODOO_DB | Odoo database | demo |
| ODOO_USER | Odoo username | admin |
| ODOO_PASSWORD | Odoo password | admin |
| ODOO_ENABLED | Enable Odoo sync | false |

---

## 9. Performance Considerations

### 9.1 Database Optimization

1. **Indexes**: Added on foreign keys and frequently queried columns
2. **Pagination**: All list endpoints support pagination
3. **Eager Loading**: Relations loaded only when needed
4. **Connection Pooling**: Prisma manages connection pool

### 9.2 Frontend Optimization

1. **Code Splitting**: Automatic with Next.js App Router
2. **Image Optimization**: Using Next.js Image component
3. **Caching**: TanStack Query for data caching
4. **Lazy Loading**: Components loaded on demand

### 9.3 API Optimization

1. **Batch Operations**: Bulk create/update where possible
2. **Selective Fields**: Return only needed fields
3. **Compression**: Gzip enabled
4. **Rate Limiting**: Prevent abuse

---

## 10. Development Guidelines

### 10.1 Code Style

```typescript
// TypeScript strict mode enabled
// ESLint with custom rules

// Naming conventions
- PascalCase: Components, Types, Interfaces
- camelCase: Functions, Variables, Props
- kebab-case: File names, CSS classes
- UPPER_SNAKE_CASE: Constants, Enums
```

### 10.2 File Structure

```
ComponentName/
├── ComponentName.tsx         # Main component
├── ComponentName.test.tsx    # Tests
├── ComponentName.stories.tsx # Storybook stories
├── types.ts                  # Type definitions
└── index.ts                  # Exports
```

### 10.3 Git Workflow

```bash
# Feature branch
git checkout -b feature/feature-name

# Commit format
feat: add new feature
fix: fix bug
docs: update documentation
refactor: refactor code
test: add tests

# Pull request
- Description
- Screenshots
- Test instructions
```

### 10.4 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Type checking
npm run typecheck

# Linting
npm run lint
```

---

## Appendix

### A. Type Definitions

```typescript
// Core Types
type OrderStatus = 'DRAFT' | 'PLANNING' | 'MATERIAL_PREPARATION' | 
                   'IN_PRODUCTION' | 'QC' | 'COMPLETED' | 'CANCELLED'

type MOStatus = 'DRAFT' | 'PLANNING' | 'MATERIAL_PREPARATION' | 
                'IN_PRODUCTION' | 'QC' | 'COMPLETED' | 'CANCELLED'

type TaskStatus = 'PENDING' | 'ASSIGNED' | 'RUNNING' | 'PAUSED' | 
                  'COMPLETED' | 'CANCELLED'

// Event Types
type InventoryEventType = 'INVENTORY_UPDATE' | 'RESERVATION_UPDATE' | 
                          'ALLOCATION_UPDATE' | 'HANDOFF_UPDATE'
```

### B. Configuration Files

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}

// next.config.ts
{
  "typescript": {
    "ignoreBuildErrors": false
  },
  "eslint": {
    "ignoreDuringBuilds": false
  }
}
```

### C. Useful Commands

```bash
# Database
npx prisma migrate dev      # Run migrations
npx prisma generate         # Generate client
npx prisma studio           # Visual editor
npm run db:seed             # Seed database

# Development
npm run dev                 # Start dev server
npm run build               # Build for production
npm run lint                # Run linter
npm run typecheck           # Type checking
```

---

*ManuOS - Manufacturing Operating System*
*Technical Specification Document v2.0 - May 2026*
