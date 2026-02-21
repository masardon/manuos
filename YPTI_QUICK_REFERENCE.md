# 🏭 ManuOS - YPTI Demo Quick Reference

## 🔗 Direct Links to All Features

### Authentication
- **Login**: http://localhost:3000/login
  - Password: `demo123` (for all accounts)
  - Recommended: admin@ypti.com

---

## 📊 1. Production Overview

**Dashboard**: http://localhost:3000/dashboard

**Shows**:
- Active Orders: 5
- In Production: 2-3 orders
- Pending Tasks: Multiple tasks
- Machine Utilization: ~67% (4/6 machines active)
- Active Breakdowns: 1 (DRILL-001)

---

## 📋 2. Master Plan (Orders)

**Orders Page**: http://localhost:3000/orders

**Customer Orders**:
1. ORD-2025-001 - PT. Astra Honda Motor (65% - IN PRODUCTION)
2. ORD-2025-002 - PT. Yamaha Indonesia Motor (15% - PLANNING)
3. ORD-2025-003 - PT. Suzuki Indomobil Motor (30% - MATERIAL PREP)
4. ORD-2025-004 - PT. Kawasaki Motor Indonesia (0% - DRAFT)
5. ORD-2025-005 - PT. Toyota Astra Motor (85% - IN PRODUCTION)

---

## 📅 3. Manufacturing Plan (Gantt Chart)

**Gantt Chart**: http://localhost:3000/planning/gantt

**Features**:
- SVAR React Gantt component
- Week/Month view toggle
- Zoom controls
- Task dependencies
- Progress bars
- Today marker

**Data**:
- 5 Orders
- 7 Manufacturing Orders
- Multiple Jobsheets
- 10+ Tasks

---

## 🎯 4. Task Management (Kanban)

**Kanban Board**: http://localhost:3000/planning/kanban

**Columns**:
- Pending (PENDING)
- Assigned (ASSIGNED)
- In Progress (RUNNING) ← Active tasks here
- Paused (PAUSED)
- On Hold (ON_HOLD)
- Completed (COMPLETED)
- Cancelled (CANCELLED)

**Interactive**: Drag & drop tasks between columns!

---

## 🔧 5. Machine Management

**Machines List**: http://localhost:3000/machines

**6 Machines**:
| Code | Name | Type | Status | Location |
|------|------|------|--------|----------|
| CNC-001 | CNC Milling 1 | CNC Milling | IDLE | Workshop A |
| CNC-002 | CNC Lathe 1 | CNC Lathe | RUNNING | Workshop A |
| LATHE-001 | Conventional Lathe 1 | Conventional Lathe | IDLE | Workshop B |
| DRILL-001 | Drilling Machine 1 | Drilling | MAINTENANCE ⚠️ | Workshop B |
| WELD-001 | Welding Station 1 | Welding | IDLE | Assembly Area |
| PRESS-001 | Hydraulic Press 1 | Press Brake | RUNNING | Workshop C |

**Breakdowns**: http://localhost:3000/machines/breakdowns
- Active: DRILL-001 - Drill bit broken
- Affected Task: T-004-02-01 (PT. Suzuki order)

---

## 📦 6. Inventory Management

**Inventory**: http://localhost:3000/inventory

**10 Items**:

### Raw Materials (4)
- MAT-STL-001: Steel Plate 10mm - 150 sheets ✅
- MAT-STL-002: Steel Plate 20mm - 80 sheets ✅
- MAT-ALU-001: Aluminum Bar 50mm - 200 bars ✅
- MAT-ALU-002: Aluminum Sheet 5mm - 120 sheets ✅

### Tools (3)
- TOOL-DRILL-001: HSS Drill Bit 10mm - 50 pcs ⚠️ Low Stock
- TOOL-DRILL-002: HSS Drill Bit 12mm - 45 pcs ⚠️ Low Stock
- TOOL-INSERT-001: Carbide Insert CNMG - 100 pcs ✅

### WIP (2)
- PART-FRAME-001: Motorcycle Frame LH - 25 pcs
- PART-FRAME-002: Motorcycle Frame RH - 23 pcs

### Finished Goods (1)
- PART-BRACKET-001: Engine Bracket Set - 100 sets ✅

---

## 📈 7. Reports

**Reports**: http://localhost:3000/reports

**Available Reports**:
- Production Reports
- Efficiency Reports
- Breakdown Reports
- Inventory Reports

---

## 👥 Demo Accounts

All passwords: `demo123`

| Email | Role | Best For |
|-------|------|----------|
| admin@ypti.com | Admin | Full demo (recommended) |
| ppic@ypti.com | PPIC Staff | Planning & scheduling |
| manager@ypti.com | Manager | Overview & reports |
| tech1@ypti.com | Technician | Task execution |
| tech2@ypti.com | Technician | Task execution |

---

## 🎬 Recommended Demo Flow

### 1. Start at Login (2 min)
- Show credential display
- Login as admin@ypti.com
- Explain role-based access

### 2. Dashboard Overview (3 min)
- Show key metrics
- Highlight active breakdowns
- Point out machine utilization

### 3. Master Plan - Orders (5 min)
- Show 5 customer orders
- Explain hierarchy (Order → MO → JS → Task)
- Show order statuses

### 4. Manufacturing Plan - Gantt (5 min)
- Show timeline view
- Toggle week/month
- Show task dependencies
- Demonstrate zoom

### 5. Task Management - Kanban (5 min)
- Show board layout
- Drag & drop a task
- Apply filters
- Show breakdown alert

### 6. Machine Management (5 min)
- Show 6 machines
- Navigate to breakdowns
- Show DRILL-001 issue
- Explain maintenance workflow

### 7. Inventory (5 min)
- Show stock levels
- Point out low stock alerts
- Show warehouse locations
- Explain batch tracking

### 8. Reports (3 min)
- Show report categories
- Generate sample report
- Show export options

### 9. Q&A (5 min)
- Address questions
- Show additional features

**Total Time**: ~35-40 minutes

---

## 💡 Key Talking Points

### For YPTI Context:
1. **Local Relevance**: Indonesian company names, local manufacturing processes
2. **Automotive Focus**: Major Indonesian automotive manufacturers (Honda, Yamaha, Suzuki, etc.)
3. **Complete Traceability**: From order to finished product
4. **Real-time Monitoring**: Live status updates
5. **Proactive Maintenance**: Breakdown tracking and alerts
6. **Resource Optimization**: Machine utilization tracking
7. **Quality Control**: Progress tracking at each step

### Technical Highlights:
- Modern React stack (Next.js 16, React 19)
- Real-time updates
- Role-based access control
- Responsive design
- Interactive visualizations (Gantt, Kanban)
- Comprehensive audit trail

---

## 🆘 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Login fails | Verify password: `demo123` |
| Page not loading | Refresh browser (Ctrl+R) |
| Data not showing | Check if logged in |
| Server error | Check `/dev.log` |
| Need fresh data | Run: `bun run db:seed` |

---

**Demo Ready**: ✅ All features populated with YPTI data  
**Last Updated**: 2025-02-20  
**Status**: Ready for Client Presentation
