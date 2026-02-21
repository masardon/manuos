# ManuOS - YPTI Demo Data Guide

## 🎯 Demo Overview

ManuOS has been populated with realistic manufacturing data for **YPTI (Yayasan Pendidikan dan Teknologi Indonesia)** demonstration purposes.

## 📊 Data Summary

### Organization Structure
- **Tenant**: YPTI Manufacturing
- **Business Unit**: Main Factory (Jakarta)
- **Board**: Production Board

### Users (5)
| Role | Email | Name | Employee ID |
|------|-------|------|-------------|
| Admin | admin@ypti.com | Ahmad Hidayat | EMP-001 |
| PPIC Staff | ppic@ypti.com | Siti Nurhaliza | EMP-002 |
| Production Manager | manager@ypti.com | Budi Santoso | EMP-003 |
| Technician 1 | tech1@ypti.com | Andi Wijaya | EMP-004 |
| Technician 2 | tech2@ypti.com | Dewi Lestari | EMP-005 |

### Machines (6)
| Code | Name | Type | Location | Status |
|------|------|------|----------|--------|
| CNC-001 | CNC Milling Machine 1 | CNC Milling | Workshop A | IDLE |
| CNC-002 | CNC Lathe Machine 1 | CNC Lathe | Workshop A | RUNNING |
| LATHE-001 | Conventional Lathe 1 | Conventional Lathe | Workshop B | IDLE |
| DRILL-001 | Drilling Machine 1 | Drilling | Workshop B | MAINTENANCE |
| WELD-001 | Welding Station 1 | Welding | Assembly Area | IDLE |
| PRESS-001 | Hydraulic Press 1 | Press Brake | Workshop C | RUNNING |

### Production Orders (5)

#### 1. ORD-2025-001 - PT. Astra Honda Motor
- **Status**: IN_PRODUCTION (65% complete)
- **Timeline**: 20 days ago → 10 days from now
- **Manufacturing Orders**: 2 (MO-001, MO-002)
- **Jobsheets**: 3
- **Tasks**: 4 (2 completed, 2 in progress)
- **Notes**: Motorcycle frame components - Priority order

#### 2. ORD-2025-002 - PT. Yamaha Indonesia Motor
- **Status**: PLANNING (15% complete)
- **Timeline**: 5 days ago → 25 days from now
- **Manufacturing Orders**: 1 (MO-003)
- **Jobsheets**: 1
- **Notes**: Engine mounting brackets - Standard priority

#### 3. ORD-2025-003 - PT. Suzuki Indomobil Motor
- **Status**: MATERIAL_PREPARATION (30% complete)
- **Timeline**: 10 days ago → 20 days from now
- **Manufacturing Orders**: 2 (MO-004, MO-005)
- **Jobsheets**: 2
- **Tasks**: 2 (1 completed, 1 paused - breakdown)
- **Notes**: Suspension components - High precision required
- **⚠️ Issue**: Task T-004-02-01 has machine breakdown (drill bit broken)

#### 4. ORD-2025-004 - PT. Kawasaki Motor Indonesia
- **Status**: DRAFT (0% complete)
- **Timeline**: 15 days → 45 days from now
- **Manufacturing Orders**: 1 (MO-006)
- **Notes**: Swingarm assembly - New product development

#### 5. ORD-2025-005 - PT. Toyota Astra Motor
- **Status**: IN_PRODUCTION (85% complete)
- **Timeline**: 30 days ago → 5 days ago (COMPLETED EARLY)
- **Manufacturing Orders**: 1 (MO-007)
- **Jobsheets**: 1
- **Tasks**: 1 (completed)
- **Notes**: Engine bracket set - Automotive quality standards

### Inventory Items (10)

#### Raw Materials (4)
- Steel Plate 10mm - 150 sheets (Warehouse A)
- Steel Plate 20mm - 80 sheets (Warehouse A)
- Aluminum Bar 50mm - 200 bars (Warehouse A)
- Aluminum Sheet 5mm - 120 sheets (Warehouse A)

#### Tools (3)
- HSS Drill Bit 10mm - 50 pcs (Tool Crib) ⚠️ Low Stock
- HSS Drill Bit 12mm - 45 pcs (Tool Crib) ⚠️ Low Stock
- Carbide Insert CNMG - 100 pcs (Tool Crib)

#### WIP (2)
- Motorcycle Frame LH - 25 pcs (WIP Area)
- Motorcycle Frame RH - 23 pcs (WIP Area)

#### Finished Goods (1)
- Engine Bracket Set - 100 sets (Finished Goods)

## 🎬 Demo Scenarios

### Scenario 1: Production Planning (Gantt Chart)
1. Navigate to **Planning → Gantt Chart**
2. Show the timeline view of all 5 orders
3. Demonstrate week/month view toggle
4. Show task dependencies and progress

### Scenario 2: Task Management (Kanban Board)
1. Navigate to **Planning → Kanban Board**
2. Show tasks organized by status
3. Demonstrate drag-and-drop to change task status
4. Show filters (Machine, Technician, Status)
5. Highlight the breakdown task (T-004-02-01)

### Scenario 3: Machine Management
1. Navigate to **Machines**
2. Show 6 machines with different statuses
3. Highlight DRILL-001 under maintenance
4. Show machine utilization in dashboard

### Scenario 4: Inventory Management
1. Navigate to **Inventory**
2. Show 10 inventory items across categories
3. Highlight low stock alerts (Drill Bits)
4. Show warehouse locations and shelves

### Scenario 5: Order Tracking
1. Navigate to **Orders**
2. Show 5 customer orders from automotive companies
3. Demonstrate order hierarchy (Order → MO → Jobsheet → Task)
4. Show progress percentages and status

### Scenario 6: Dashboard Overview
1. Navigate to **Dashboard**
2. Show key metrics:
   - Active Orders
   - In Production
   - Pending Tasks
   - Machine Utilization
   - Active Breakdowns

## 🔐 Login Instructions

**Password for ALL accounts**: `demo123`

**Recommended login for demo:**
- **Email**: admin@ypti.com
- **Role**: Admin (full access to all features)

**Alternative logins:**
- ppic@ypti.com (Production Planning & Control)
- manager@ypti.com (Production Manager)
- tech1@ypti.com (Technician - limited access)
- tech2@ypti.com (Technician - limited access)

💡 **Tip**: All credentials are displayed on the login page for easy access during your presentation!

## 📱 Key Features to Demonstrate

1. **Multi-level Production Hierarchy**
   - Order → Manufacturing Order → Jobsheet → Task

2. **Real-time Status Tracking**
   - Task progress percentages
   - Status changes (PENDING → ASSIGNED → RUNNING → COMPLETED)

3. **Machine Management**
   - Machine assignment to tasks
   - Breakdown tracking
   - Maintenance scheduling

4. **Inventory Control**
   - Raw materials tracking
   - Tool management
   - Low stock alerts

5. **Visual Planning**
   - Gantt chart timeline
   - Kanban board for task management
   - Dashboard with KPIs

6. **Role-based Access**
   - Different views for different roles
   - Admin: Full access
   - PPIC: Planning & scheduling
   - Manager: Overview & reports
   - Technician: Task execution

## 🎯 Demo Tips

1. **Start with Dashboard** - Give overview of entire operation
2. **Show Order Hierarchy** - Demonstrate data relationships
3. **Use Kanban for Task Management** - Interactive drag-and-drop
4. **Highlight Issues** - Show breakdown alert on task T-004-02-01
5. **End with Reports** - Show insights and analytics

## 📞 Support

For technical support during the demo:
- Check browser console for any errors
- Refresh page if data doesn't load
- Verify database has data: `bunx prisma studio`

---

**Generated**: 2025-02-20
**Client**: YPTI (Yayasan Pendidikan dan Teknologi Indonesia)
**Environment**: Development/Demo
