# 🏭 ManuOS - Manufacturing Operating System

A modern, production-ready manufacturing management system built with cutting-edge web technologies. ManuOS provides complete production planning, scheduling, and execution capabilities for modern manufacturing operations.

## ✨ Technology Stack

ManuOS is built on a robust, scalable foundation:

### 🎯 Core Framework
- **⚡ Next.js 16** - The React framework for production with App Router
- **📘 TypeScript 5** - Type-safe JavaScript for better developer experience
- **🎨 Tailwind CSS 4** - Utility-first CSS framework for rapid UI development

### 🧩 UI Components & Styling
- **🧩 shadcn/ui** - High-quality, accessible components built on Radix UI
- **🎯 Lucide React** - Beautiful & consistent icon library
- **🌈 Framer Motion** - Production-ready motion library for React
- **🎨 Next Themes** - Perfect dark mode support

### 📋 Forms & Validation
- **🎣 React Hook Form** - Performant forms with easy validation
- **✅ Zod** - TypeScript-first schema validation

### 🔄 State Management & Data Fetching
- **🐻 Zustand** - Simple, scalable state management
- **🔄 TanStack Query** - Powerful data synchronization for React
- **🌐 Fetch** - Promise-based HTTP request

### 🗄️ Database & Backend
- **🗄️ Prisma** - Next-generation TypeScript ORM
- **🔐 NextAuth.js** - Complete open-source authentication solution

### 🎨 Advanced UI Features
- **📊 TanStack Table** - Headless UI for building tables and datagrids
- **🖱️ DND Kit** - Modern drag and drop toolkit for React
- **📊 Recharts** - Redefined chart library built with React and D3
- **🖼️ Sharp** - High performance image processing

### 🌍 Internationalization & Utilities
- **🌍 Next Intl** - Internationalization library for Next.js
- **📅 Date-fns** - Modern JavaScript date utility library
- **🪝 ReactUse** - Collection of essential React hooks

## 🎯 Why ManuOS?

- **🏭 Manufacturing Focused** - Built specifically for manufacturing operations
- **📅 Production Planning** - Gantt charts and Kanban boards for scheduling
- **📊 Real-time Tracking** - Live production status and progress monitoring
- **🔧 Machine Management** - Track machines, maintenance, and breakdowns
- **📦 Inventory Control** - Material tracking with low-stock alerts
- **👥 Role-based Access** - Different views for different user roles
- **📈 Analytics & Reports** - Production efficiency and performance metrics
- **🌐 Modern UI** - Clean, intuitive interface with dark mode support
- **🔒 Type Safe** - Full TypeScript with Zod validation
- **🚀 Production Ready** - Optimized for deployment and scale

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Start production server
bun start
```

Open [http://localhost:3000](http://localhost:3000) to see ManuOS running.

## 🏭 Manufacturing Features

ManuOS provides comprehensive manufacturing management:

### 📅 Production Planning
- **Gantt Charts** - Visual timeline with hierarchy (Order → MO → Jobsheet → Task)
- **Kanban Boards** - Drag-and-drop task management by status
- **Resource Allocation** - Machine and technician assignment
- **Timeline View** - Week/Month views with expandable hierarchy

### 🏗️ Order Management
- **Customer Orders** - Track from order to delivery
- **Manufacturing Orders** - Break down orders into production batches
- **Jobsheets** - Detailed work instructions for each operation
- **Task Tracking** - Individual machining tasks with progress

### 🔧 Machine Management
- **Machine Registry** - Complete machine database with specifications
- **Status Tracking** - Real-time machine status (Idle, Running, Maintenance)
- **Breakdown Management** - Report and track machine breakdowns
- **Maintenance Scheduling** - Plan preventive maintenance

### 📦 Inventory Management
- **Material Tracking** - Raw materials, WIP, and finished goods
- **Stock Levels** - Real-time quantity tracking
- **Low Stock Alerts** - Automatic notifications for reorder points
- **Location Management** - Warehouse and shelf tracking

### 👥 User Management
- **Role-based Access** - Admin, PPIC, Manager, Technician, Warehouse
- **User Profiles** - Individual settings and preferences
- **Time Tracking** - Clock in/out for tasks
- **Performance Metrics** - Individual and team efficiency

### 📊 Reports & Analytics
- **Production Reports** - Order completion rates
- **Efficiency Reports** - Machine and labor utilization
- **Breakdown Reports** - Downtime analysis
- **Inventory Reports** - Stock levels and trends

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── api/            # API routes
│   ├── dashboard/      # Dashboard page
│   ├── orders/         # Order management
│   ├── planning/       # Planning (Gantt, Kanban)
│   ├── production/     # Production execution
│   ├── machines/       # Machine management
│   ├── inventory/      # Inventory management
│   └── reports/        # Reports and analytics
├── components/          # Reusable React components
│   ├── ui/             # shadcn/ui components
│   └── layout/         # Layout components (sidebar, etc.)
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and configurations
└── stores/             # Zustand state stores
```

## 🎨 Key Features

### 📅 Gantt Chart
- **4-Level Hierarchy** - Order → MO → Jobsheet → Task
- **Visual Timeline** - Actual duration bars based on dates
- **Expand/Collapse** - Drill down to any level
- **Today Marker** - See current position in timeline
- **Progress Tracking** - Visual progress on each bar
- **Status Colors** - Completed (green), Delayed (red), Running (pulsing)

### 🎯 Kanban Board
- **7 Status Columns** - Pending, Assigned, Running, Paused, On Hold, Completed, Cancelled
- **Drag & Drop** - Move tasks between statuses
- **Filters** - Filter by machine, technician, or status
- **Progress Bars** - Visual progress on each card
- **Real-time Updates** - Live status synchronization

### 🔧 Production Tracking
- **Running Tasks** - See active production in real-time
- **Machine Assignment** - Which machine is working on what
- **Technician Assignment** - Who is working on each task
- **Time Tracking** - Planned vs actual hours
- **Breakdown Alerts** - Immediate notification of machine issues

### 📦 Inventory Control
- **Stock Levels** - Real-time quantity tracking
- **Categories** - Raw materials, Tools, WIP, Finished goods
- **Location Tracking** - Warehouse and shelf locations
- **Batch Tracking** - Trace materials by batch number
- **Low Stock Alerts** - Automatic warnings for reorder points

## 🔐 Demo Credentials

For demonstration purposes, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ypti.com | demo123 |
| PPIC | ppic@ypti.com | demo123 |
| Manager | manager@ypti.com | demo123 |
| Technician | tech1@ypti.com | demo123 |

## 🌍 Deployment

ManuOS is production-ready and can be deployed anywhere Next.js is supported:

```bash
# Build for production
bun run build

# Start production server
bun start
```

### Docker Deployment
```bash
docker build -t manuos .
docker run -p 3000:3000 manuos
```

## 🤝 Contributing

ManuOS is built for the manufacturing community. Contributions, issues, and feature requests are welcome!

## 📄 License

Built with ❤️ for the manufacturing industry. 

---

**ManuOS** - Manufacturing Operating System 🏭
