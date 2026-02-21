# ManuOS - YPTI Complete Demo Walkthrough

## 🎯 Demo Flow for YPTI Presentation

Follow this structured walkthrough to showcase all ManuOS features effectively.

---

## 1. 📊 Production Overview (Dashboard)

**URL**: http://localhost:3000/dashboard

### What to Show:
- **Active Orders**: 5 orders from automotive customers
- **In Production**: Orders currently in manufacturing
- **Pending Tasks**: Tasks waiting to be started
- **Machine Utilization**: Percentage of machines in use
- **Active Breakdowns**: Machines under maintenance (DRILL-001)

### Key Highlights:
✅ Real-time production metrics
✅ Quick overview of manufacturing status
✅ Alert indicators for issues

---

## 2. 📋 Orders (Master Plan)

**URL**: http://localhost:3000/orders

### What to Show:
- **5 Customer Orders** from major automotive companies:
  - PT. Astra Honda Motor (ORD-2025-001)
  - PT. Yamaha Indonesia Motor (ORD-2025-002)
  - PT. Suzuki Indomobil Motor (ORD-2025-003)
  - PT. Kawasaki Motor Indonesia (ORD-2025-004)
  - PT. Toyota Astra Motor (ORD-2025-005)

### Key Features:
✅ Order hierarchy view
✅ Status tracking (DRAFT → PLANNING → IN_PRODUCTION → COMPLETED)
✅ Progress percentages
✅ Customer information
✅ Timeline tracking

### Demo Script:
1. Show the orders table
2. Click "Refresh" to demonstrate real-time updates
3. Point out different order statuses
4. Highlight the hierarchy: Order → MO → Jobsheet → Task

---

## 3. 📅 Gantt Chart (Manufacturing Plan)

**URL**: http://localhost:3000/planning/gantt

### What to Show:
- **Timeline View** of all production orders
- **Week/Month View** toggle
- **Task Dependencies** and relationships
- **Progress Bars** showing completion percentage

### Key Features:
✅ Interactive SVAR React Gantt component
✅ Zoom in/out functionality
✅ Task filtering
✅ Color-coded by order type
✅ Today marker for reference
✅ Auto-scaling to fit data

### Demo Script:
1. Show the Gantt chart with all tasks
2. Toggle between Week and Month views
3. Use zoom controls to see details
4. Point out task dependencies (links between tasks)
5. Show progress bars on each task
6. Highlight the breakdown task (red indicator)

---

## 4. 🎯 Kanban Board (Task Management)

**URL**: http://localhost:3000/planning/kanban

### What to Show:
- **7 Status Columns**: Pending, Assigned, In Progress, Paused, On Hold, Completed, Cancelled
- **Task Cards** with progress bars
- **Drag & Drop** to change task status
- **Filters**: Machine, Technician, Status

### Key Features:
✅ Interactive drag-and-drop
✅ Real-time status updates
✅ Machine and technician assignment
✅ Progress tracking
✅ Breakdown alerts

### Demo Script:
1. Show all columns with task distribution
2. Demonstrate drag-and-drop (move a task between columns)
3. Apply filters (e.g., filter by machine)
4. Point out the breakdown task with alert icon
5. Show task details on hover

---

## 5. 🔧 Machines & Breakdowns

### Machines Page
**URL**: http://localhost:3000/machines

#### What to Show:
- **6 Machines** with different statuses:
  - CNC-001 (IDLE)
  - CNC-002 (RUNNING)
  - LATHE-001 (IDLE)
  - DRILL-001 (MAINTENANCE) ⚠️
  - WELD-001 (IDLE)
  - PRESS-001 (RUNNING)

#### Key Features:
✅ Machine status tracking
✅ Location information
✅ Type classification
✅ Capacity monitoring

### Breakdowns Page
**URL**: http://localhost:3000/machines/breakdowns

#### What to Show:
- **Active Breakdown**: DRILL-001 - Drill bit broken
- **Breakdown Details**:
  - Reported by
  - Description
  - Affected task
  - Resolution status

#### Demo Script:
1. Show machine list with status colors
2. Navigate to breakdowns
3. Show the active breakdown for DRILL-001
4. Demonstrate breakdown resolution workflow
5. Show how it affects task T-004-02-01

---

## 6. 📦 Inventory Management

**URL**: http://localhost:3000/inventory

### What to Show:
- **10 Inventory Items** across categories:
  - **Raw Materials** (4): Steel plates, Aluminum bars/sheets
  - **Tools** (3): Drill bits, Carbide inserts
  - **WIP** (2): Motorcycle frames
  - **Finished Goods** (1): Engine bracket sets

### Key Features:
✅ Stock level tracking
✅ Low stock alerts (< 50 units)
✅ Warehouse location management
✅ Batch tracking
✅ Status management (AVAILABLE, RESERVED, WIP, USED)

### Demo Script:
1. Show inventory table with all items
2. Point out low stock alerts (Drill Bits - 50 and 45 pcs)
3. Show warehouse locations and shelves
4. Demonstrate filtering by category
5. Show batch tracking for traceability

---

## 7. 📈 Reports & Analytics

**URL**: http://localhost:3000/reports

### What to Show:
- **Production Reports**: Order completion rates
- **Efficiency Reports**: Machine utilization
- **Breakdown Reports**: Downtime analysis
- **Inventory Reports**: Stock levels and trends

### Key Features:
✅ Multiple report types
✅ Date range filtering
✅ Export functionality
✅ Visual charts and graphs
✅ KPI tracking

### Demo Script:
1. Show available report categories
2. Generate a production report
3. Show machine utilization metrics
4. Demonstrate breakdown analysis
5. Export report to PDF/Excel

---

## 8. 🎯 Additional Features to Showcase

### Production Page
**URL**: http://localhost:3000/production
- Real-time production monitoring
- Task execution tracking
- Clock in/out functionality

### Settings
**URL**: http://localhost:3000/settings
- System configuration
- Category-based settings
- Public vs private settings

### Profile
**URL**: http://localhost:3000/profile
- User preferences
- Notification settings
- Theme selection (Light/Dark/System)
- Default view configuration

---

## 🎬 Complete Demo Sequence (Recommended)

### Phase 1: Overview (5 minutes)
1. **Login** - Show credential display
2. **Dashboard** - Production overview
3. **Key Metrics** - Highlight important KPIs

### Phase 2: Planning (10 minutes)
4. **Orders** - Master plan demonstration
5. **Gantt Chart** - Manufacturing timeline
6. **Kanban Board** - Interactive task management

### Phase 3: Execution (10 minutes)
7. **Machines** - Resource management
8. **Breakdowns** - Issue tracking
9. **Production** - Real-time monitoring

### Phase 4: Support (10 minutes)
10. **Inventory** - Material management
11. **Reports** - Analytics and insights
12. **Settings/Profile** - System configuration

### Phase 5: Q&A (5 minutes)
- Address specific questions
- Show additional features as requested

---

## 🔐 Login Credentials (Display on Login Page)

**Password for ALL accounts**: `demo123`

| Role | Email | Access Level |
|------|-------|--------------|
| 🔴 Admin | admin@ypti.com | Full Access |
| 🔵 PPIC | ppic@ypti.com | Planning & Control |
| 🟣 Manager | manager@ypti.com | Overview & Reports |
| 🟢 Tech 1 | tech1@ypti.com | Task Execution |
| 🟠 Tech 2 | tech2@ypti.com | Task Execution |

---

## 💡 Demo Tips

### Before Presentation:
1. ✅ Verify all pages load correctly
2. ✅ Test login with all accounts
3. ✅ Check data is populated (5 orders, 6 machines, 10 inventory items)
4. ✅ Open browser DevTools to show API calls if needed
5. ✅ Have backup screenshots ready

### During Presentation:
1. 🎯 Start with the big picture (Dashboard)
2. 🎯 Show real interactions (drag-drop, filters)
3. 🎯 Highlight Indonesian context (local company names)
4. 🎯 Point out pain points being solved
5. 🎯 Demonstrate mobile responsiveness if relevant

### Key Selling Points:
- ✨ **Integrated System**: All modules connected
- ✨ **Real-time Updates**: Live data synchronization
- ✨ **Visual Planning**: Gantt + Kanban views
- ✨ **Local Context**: Indonesian manufacturing focus
- ✨ **Role-based Access**: Proper permission management
- ✨ **Breakdown Tracking**: Proactive maintenance
- ✨ **Inventory Control**: Material traceability

---

## 📞 Technical Support

If issues occur during demo:

1. **Page not loading**: Refresh browser (Ctrl+R)
2. **Login failing**: Verify password is `demo123`
3. **Data not showing**: Check database with `bunx prisma studio`
4. **Server error**: Restart with `bun run dev`
5. **API errors**: Check `/dev.log` for details

### Quick Data Reset:
```bash
cd /home/masardon/manuos
rm -f db/dev.db
bun run db:push
bun run db:seed
```

---

**Generated**: 2025-02-20  
**Client**: YPTI (Yayasan Pendidikan dan Teknologi Indonesia)  
**Environment**: Development/Demo  
**Version**: ManuOS v1.0
