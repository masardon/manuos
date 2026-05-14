# ManuOS Operation Guide

Complete guide for operating ManuOS - Manufacturing Operating System.

## Table of Contents

1. [Getting Started](#getting-started)
2. [System Architecture](#system-architecture)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Daily Operations](#daily-operations)
5. [Order Management Workflow](#order-management-workflow)
6. [Production Planning](#production-planning)
7. [Material Management](#material-management)
8. [Quality Control](#quality-control)
9. [Inventory Management](#inventory-management)
10. [Vendor Management](#vendor-management)
11. [System Administration](#system-administration)
12. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- SQLite (development) / PostgreSQL (production)

### Installation

```bash
# Install dependencies
npm install

# Set up database
npx prisma migrate dev

# Seed sample data
npm run db:seed

# Start development server
npm run dev
```

### Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ypti.com | demo123 |
| PPIC | ppic@ypti.com | demo123 |
| Manager | manager@ypti.com | demo123 |
| Technician | tech1@ypti.com | demo123 |
| Warehouse | warehouse@ypti.com | demo123 |

---

## System Architecture

### Technology Stack

- **Frontend**: Next.js 16, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (dev), PostgreSQL (prod)
- **Integrations**: Odoo ERP (XML-RPC)

### Data Flow

```
Customer Order → Manufacturing Order → Jobsheet → Task → Production Output
                         ↓
                   Material Requirements → MRP → Purchase Request → Vendor Order
                         ↓
                   Material Handoff → Inventory Allocation → Task Execution
```

---

## User Roles & Permissions

### Role Hierarchy

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| ROLE_SUPER_ADMIN | System-wide access | All permissions |
| ROLE_ADMIN | Tenant admin | Most permissions |
| ROLE_PPIC | Production Planning | Create/manage MOs, jobsheets, tasks |
| ROLE_MANAGER | Approvals & oversight | Approve orders, jobsheets, reports |
| ROLE_TECHNICIAN | Shop floor execution | View/execute tasks, clock in/out |
| ROLE_WAREHOUSE | Inventory management | Manage inventory, goods receipt |
| ROLE_MARKETING | Customer relations | Manage orders, customer communication |
| ROLE_DRAFTER | Technical documentation | Create recipes, drawings |

### Role-Based Dashboards

- **Admin**: Full system overview, user management, settings
- **PPIC**: Order management, production planning, material requirements
- **Manager**: Approvals, reports, resource allocation
- **Technician**: Task list, machine status, time tracking
- **Warehouse**: Inventory, handoffs, goods receipt

---

## Daily Operations

### Morning Routine (PPIC/Manager)

1. **Check Dashboard**
   - Review overnight production status
   - Check machine availability
   - Note any pending approvals

2. **Review Production Schedule**
   - Open Gantt chart view
   - Check today's planned tasks
   - Identify any resource conflicts

3. **Material Status Check**
   - Review material requirements
   - Check for low stock alerts
   - Verify pending handoffs

### Production Floor (Technician)

1. **Clock In**
   - Navigate to Tasks page
   - Select assigned task
   - Click "Clock In" to start timer

2. **Execute Task**
   - Follow jobsheet instructions
   - Report any issues/breakdowns
   - Update progress as you work

3. **Complete Task**
   - Record actual hours
   - Log production output
   - Request QC inspection

### End of Day

1. **Update Status**
   - Complete any finished tasks
   - Pause tasks that need continuation
   - Log any machine issues

2. **Material Handoff**
   - Transfer materials to next station
   - Record handoff in system
   - Update inventory locations

---

## Order Management Workflow

### Creating a Customer Order

1. Navigate to **Orders** → **New Order**
2. Fill in customer details:
   - Customer name and contact
   - Order number (auto-generated or manual)
   - Planned start/end dates
3. Add order notes/specifications
4. Submit for review

### Creating Manufacturing Orders (MOs)

1. From Order detail, click **Create MO**
2. Select Recipe/BOM (optional)
3. Choose manufacturing type:
   - **Internal**: Manufactured in-house
   - **External**: Outsourced to vendor
4. For external MOs, select vendor
5. Set planned dates
6. Submit for approval

### Jobsheet Creation

1. Open MO detail page
2. Click **Create Jobsheet**
3. Define work instructions
4. Add material requirements
5. Set up tasks with:
   - Machine assignment (optional)
   - Technician assignment (optional)
   - Planned hours
6. Submit for PPIC review

### Task Execution

1. Technician opens Tasks page
2. Filters for assigned tasks
3. Clock in when starting
4. Follow jobsheet instructions
5. Log progress periodically
6. Clock out when complete
7. Record production output

---

## Production Planning

### Gantt Chart Usage

1. Navigate to **Planning** → **Gantt**
2. View options:
   - **Week/Month** view
   - **Expand/Collapse** hierarchy
3. Understanding the view:
   - Bars show duration
   - Color indicates status
   - Today marker (dashed line)
   - Progress shown as fill

### Kanban Board

1. Navigate to **Planning** → **Kanban**
2. Columns represent task status:
   - Pending → Assigned → Running → Completed
3. Drag cards to update status
4. Click card for details

### Resource Allocation

1. **Machine Assignment**
   - Check machine availability
   - Assign during jobsheet creation
   - View on Machine Management page

2. **Technician Assignment**
   - Check technician workload
   - Assign from jobsheet or task view
   - Balance across team

---

## Material Management

### Material Requirements Planning (MRP)

1. Navigate to **Material Requirements**
2. Select Manufacturing Order
3. Review recipe ingredients
4. Check stock availability:
   - **Green**: Sufficient stock
   - **Yellow**: Partial stock
   - **Red**: Out of stock
5. Click **Run MRP** to generate requirements

### Material Distribution

1. Navigate to **Material Allocation**
2. Select jobsheet to allocate to
3. Choose inventory item
4. Specify quantity
5. Confirm allocation

### Material Handoffs

1. **Create Handoff**
   - Navigate to Handoffs page
   - Click **New Handoff**
   - Select source/destination locations
   - Add items and quantities
   - Assign handoff personnel

2. **Receive Handoff**
   - Open pending handoff
   - Verify items received
   - Confirm receipt
   - Update inventory location

---

## Quality Control

### QC Inspection Workflow

1. **Request Inspection**
   - Technician completes task
   - Clicks "Request QC" on production output
   - System notifies QC inspector

2. **Perform Inspection**
   - QC opens inspection page
   - Records inspection results:
     - **Good Quantity**: Pass
     - **Rework Quantity**: Needs rework
     - **Scrap Quantity**: Reject
   - Add inspection notes

3. **QC Results**
   - **QC Pass**: Items move to finished goods inventory
   - **QC Fail**: Rework order created automatically

### Rework Process

1. Rework order appears in Rework Management
2. Assign rework tasks
3. Execute rework
4. Request re-inspection
5. Pass → Move to finished goods

---

## Inventory Management

### Inventory Categories

- **RAW_MATERIAL**: Raw materials for production
- **FINISHED_GOODS**: Completed products
- **WIP**: Work in progress
- **TOOLS**: Tooling and consumables
- **MISC**: Miscellaneous items

### Stock Operations

1. **Add Stock**
   - Navigate to Inventory → Add Item
   - Enter part number, name, quantity
   - Assign location/shelf
   - Set minimum stock level

2. **Adjust Stock**
   - Find inventory item
   - Click Adjust
   - Enter new quantity
   - Provide adjustment reason

3. **Transfer Stock**
   - Select item
   - Click Transfer
   - Choose destination location
   - Confirm transfer

### Low Stock Alerts

- System monitors stock levels automatically
- Alerts appear on dashboard when below minimum
- Configure thresholds in Settings

---

## Vendor Management

### Outsourced Manufacturing

1. **Create Vendor Order**
   - Select outsourced MO
   - Click **Create Vendor Order**
   - Review scope and pricing
   - Submit to vendor

2. **Track Progress**
   - Monitor vendor order status
   - Request updates
   - Record vendor shipments

3. **Receive Goods**
   - Record goods receipt
   - Perform incoming QC
   - Update inventory

### Vendor Communication

- Use notes field for communication log
- Upload documents (quotes, specs)
- Track vendor performance metrics

---

## System Administration

### User Management

1. **Add User**
   - Navigate to Settings → Users
   - Click **Add User**
   - Enter details and assign role
   - User receives login credentials

2. **Modify User**
   - Find user in list
   - Click Edit
   - Update details/role
   - Save changes

### System Settings

Access via Settings → System:

- **Company Information**: Name, address, logo
- **Work Hours**: Shift schedules
- **QC Settings**: Inspection thresholds
- **Inventory**: Low stock alerts
- **Maintenance**: Machine intervals

### Odoo Integration

1. **Configure Connection**
   - Go to Settings → Integrations → Odoo
   - Enter Odoo URL, database, credentials
   - Test connection

2. **Sync Operations**
   - POs auto-sync when approved
   - View sync status in logs
   - Manual sync available

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Login fails | Verify credentials, check user status |
| Task won't start | Check machine availability, user assignment |
| Can't create MO | Verify order status is approved |
| Material unavailable | Run MRP, check inventory levels |
| Sync to Odoo failed | Verify Odoo connection, check logs |

### Database Issues

```bash
# Reset database (CAUTION: loses data)
npx prisma migrate reset

# Regenerate client
npx prisma generate

# Check migrations status
npx prisma migrate status
```

### Development Commands

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Seed database
npm run db:seed

# Open Prisma Studio
npx prisma studio
```

### Log Files

- Application logs: Check console output
- Database queries: Prisma query logging enabled
- Odoo sync: Check OdooSyncLog table

---

## API Reference

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/orders` | GET/POST | List/create orders |
| `/api/mo` | GET/POST | List/create manufacturing orders |
| `/api/production-output` | POST | Record production output |
| `/api/production-output/tasks` | GET | Get tasks for output recording |
| `/api/production-output/[id]/qc` | POST | Submit QC inspection |
| `/api/mo/[id]/materials` | GET | Get MO materials |
| `/api/mo/[id]/materials/allocate` | POST/DELETE | Allocate/deallocate materials |
| `/api/inventory/events` | GET | SSE endpoint for real-time updates |

### Real-time Events

Subscribe to `/api/inventory/events` for real-time inventory updates:

```javascript
const eventSource = new EventSource('/api/inventory/events');
eventSource.addEventListener('INVENTORY_UPDATE', (e) => {
  const data = JSON.parse(e.data);
  console.log('Inventory updated:', data);
});
```

---

## Best Practices

### Data Entry

1. Always verify dates before saving
2. Use consistent naming conventions
3. Record actual quantities accurately
4. Add notes for non-standard situations

### Production

1. Clock in/out promptly
2. Report breakdowns immediately
3. Request QC at task completion
4. Complete handoffs before shift end

### Inventory

1. Perform regular cycle counts
2. Report discrepancies immediately
3. Keep locations updated
4. Review low stock alerts daily

### Security

1. Never share credentials
2. Log out when finished
3. Report suspicious activity
4. Keep system updated

---

## Support

For issues or questions:
- Check this documentation first
- Review system logs
- Contact system administrator
- Submit issues to project repository

---

*ManuOS - Manufacturing Operating System*
*Last Updated: 2026*
