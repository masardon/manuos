/**
 * Seed script to populate ManuOS with sample data for YPTI demonstration
 * Run with: bunx prisma db seed
 */

import { PrismaClient, OrderStatus, MOStatus, JobsheetStatus, TaskStatus, MachineStatus } from '@prisma/client'
import { addDays, subDays } from 'date-fns'

const prisma = new PrismaClient()

// Sample data for YPTI (Yayasan Pendidikan dan Teknologi Indonesia)
const TENANT_ID = 'tenant_ypti'
const BOARD_ID = 'board_main'

async function main() {
  console.log('🌱 Starting ManuOS seed for YPTI...')

  // 1. Create Tenant
  console.log('📦 Creating tenant...')
  await prisma.tenant.upsert({
    where: { slug: 'ypti' },
    update: {},
    create: {
      id: TENANT_ID,
      name: 'YPTI Manufacturing',
      slug: 'ypti',
      isActive: true,
    },
  })

  // 2. Create Business Unit
  console.log('🏭 Creating business unit...')
  const businessUnit = await prisma.businessUnit.upsert({
    where: { tenantId_code: { tenantId: TENANT_ID, code: 'FACTORY-01' } },
    update: {},
    create: {
      id: 'bu-001',
      tenantId: TENANT_ID,
      name: 'Main Factory',
      code: 'FACTORY-01',
      location: 'Jakarta',
      isActive: true,
    },
  })

  // 3. Create Board
  console.log('📋 Creating board...')
  await prisma.board.upsert({
    where: { tenantId_businessUnitId_code: { tenantId: TENANT_ID, businessUnitId: businessUnit.id, code: 'PROD-BOARD' } },
    update: {},
    create: {
      id: BOARD_ID,
      tenantId: TENANT_ID,
      businessUnitId: businessUnit.id,
      name: 'Production Board',
      code: 'PROD-BOARD',
      description: 'Main production planning board',
      isActive: true,
    },
  })

  // 4. Create Roles
  console.log('👥 Creating roles...')
  const adminRole = await prisma.role.upsert({
    where: { code: 'ROLE_ADMIN' },
    update: {},
    create: { id: 'role-admin', name: 'Admin', code: 'ROLE_ADMIN', isSystem: false },
  })
  const ppicRole = await prisma.role.upsert({
    where: { code: 'ROLE_PPIC' },
    update: {},
    create: { id: 'role-ppic', name: 'PPIC Staff', code: 'ROLE_PPIC', isSystem: false },
  })
  const managerRole = await prisma.role.upsert({
    where: { code: 'ROLE_MANAGER' },
    update: {},
    create: { id: 'role-manager', name: 'Production Manager', code: 'ROLE_MANAGER', isSystem: false },
  })
  const technicianRole = await prisma.role.upsert({
    where: { code: 'ROLE_TECHNICIAN' },
    update: {},
    create: { id: 'role-technician', name: 'Technician', code: 'ROLE_TECHNICIAN', isSystem: false },
  })
  const warehouseRole = await prisma.role.upsert({
    where: { code: 'ROLE_WAREHOUSE' },
    update: {},
    create: { id: 'role-warehouse', name: 'Warehouse Staff', code: 'ROLE_WAREHOUSE', isSystem: false },
  })

  // 5. Create Users
  console.log('👤 Creating users...')
  // For demo purposes, use plain text password 'demo123'
  // The login API does simple string comparison for demo
  const DEMO_PASSWORD = 'demo123'
  
  const users = await Promise.all([
    prisma.user.upsert({
      where: { tenantId_email: { tenantId: TENANT_ID, email: 'admin@ypti.com' } },
      update: {},
      create: {
        id: 'user-admin',
        tenantId: TENANT_ID,
        email: 'admin@ypti.com',
        name: 'Ahmad Hidayat',
        phone: '+6281234567890',
        roleId: adminRole.id,
        passwordHash: DEMO_PASSWORD,
        isActive: true,
        employeeId: 'EMP-001',
      },
    }),
    prisma.user.upsert({
      where: { tenantId_email: { tenantId: TENANT_ID, email: 'ppic@ypti.com' } },
      update: {},
      create: {
        id: 'user-ppic',
        tenantId: TENANT_ID,
        email: 'ppic@ypti.com',
        name: 'Siti Nurhaliza',
        phone: '+6281234567891',
        roleId: ppicRole.id,
        passwordHash: DEMO_PASSWORD,
        isActive: true,
        employeeId: 'EMP-002',
      },
    }),
    prisma.user.upsert({
      where: { tenantId_email: { tenantId: TENANT_ID, email: 'manager@ypti.com' } },
      update: {},
      create: {
        id: 'user-manager',
        tenantId: TENANT_ID,
        email: 'manager@ypti.com',
        name: 'Budi Santoso',
        phone: '+6281234567892',
        roleId: managerRole.id,
        passwordHash: DEMO_PASSWORD,
        isActive: true,
        employeeId: 'EMP-003',
      },
    }),
    prisma.user.upsert({
      where: { tenantId_email: { tenantId: TENANT_ID, email: 'tech1@ypti.com' } },
      update: {},
      create: {
        id: 'user-tech1',
        tenantId: TENANT_ID,
        email: 'tech1@ypti.com',
        name: 'Andi Wijaya',
        phone: '+6281234567893',
        roleId: technicianRole.id,
        passwordHash: DEMO_PASSWORD,
        isActive: true,
        employeeId: 'EMP-004',
      },
    }),
    prisma.user.upsert({
      where: { tenantId_email: { tenantId: TENANT_ID, email: 'tech2@ypti.com' } },
      update: {},
      create: {
        id: 'user-tech2',
        tenantId: TENANT_ID,
        email: 'tech2@ypti.com',
        name: 'Dewi Lestari',
        phone: '+6281234567894',
        roleId: technicianRole.id,
        passwordHash: DEMO_PASSWORD,
        isActive: true,
        employeeId: 'EMP-005',
      },
    }),
  ])

  // 6. Create Machines
  console.log('🔧 Creating machines...')
  const machines = await Promise.all([
    prisma.machine.upsert({
      where: { tenantId_code: { tenantId: TENANT_ID, code: 'CNC-001' } },
      update: {},
      create: {
        id: 'machine-cnc-001',
        tenantId: TENANT_ID,
        code: 'CNC-001',
        name: 'CNC Milling Machine 1',
        model: 'HAAS VF-2',
        location: 'Workshop A',
        type: 'CNC Milling',
        status: MachineStatus.IDLE,
        capacity: 8,
        isActive: true,
      },
    }),
    prisma.machine.upsert({
      where: { tenantId_code: { tenantId: TENANT_ID, code: 'CNC-002' } },
      update: {},
      create: {
        id: 'machine-cnc-002',
        tenantId: TENANT_ID,
        code: 'CNC-002',
        name: 'CNC Lathe Machine 1',
        model: 'HAAS ST-20',
        location: 'Workshop A',
        type: 'CNC Lathe',
        status: MachineStatus.RUNNING,
        capacity: 8,
        isActive: true,
      },
    }),
    prisma.machine.upsert({
      where: { tenantId_code: { tenantId: TENANT_ID, code: 'LATHE-001' } },
      update: {},
      create: {
        id: 'machine-lathe-001',
        tenantId: TENANT_ID,
        code: 'LATHE-001',
        name: 'Conventional Lathe 1',
        model: 'Yamazaki',
        location: 'Workshop B',
        type: 'Conventional Lathe',
        status: MachineStatus.IDLE,
        capacity: 8,
        isActive: true,
      },
    }),
    prisma.machine.upsert({
      where: { tenantId_code: { tenantId: TENANT_ID, code: 'DRILL-001' } },
      update: {},
      create: {
        id: 'machine-drill-001',
        tenantId: TENANT_ID,
        code: 'DRILL-001',
        name: 'Drilling Machine 1',
        model: 'Bosch PBD 40',
        location: 'Workshop B',
        type: 'Drilling',
        status: MachineStatus.MAINTENANCE,
        capacity: 8,
        isActive: true,
      },
    }),
    prisma.machine.upsert({
      where: { tenantId_code: { tenantId: TENANT_ID, code: 'WELD-001' } },
      update: {},
      create: {
        id: 'machine-weld-001',
        tenantId: TENANT_ID,
        code: 'WELD-001',
        name: 'Welding Station 1',
        model: 'Lincoln Electric',
        location: 'Assembly Area',
        type: 'Welding',
        status: MachineStatus.IDLE,
        capacity: 8,
        isActive: true,
      },
    }),
    prisma.machine.upsert({
      where: { tenantId_code: { tenantId: TENANT_ID, code: 'PRESS-001' } },
      update: {},
      create: {
        id: 'machine-press-001',
        tenantId: TENANT_ID,
        code: 'PRESS-001',
        name: 'Hydraulic Press 1',
        model: 'Yanmar 50T',
        location: 'Workshop C',
        type: 'Press Brake',
        status: MachineStatus.RUNNING,
        capacity: 8,
        isActive: true,
      },
    }),
  ])

  // 7. Create Orders with Manufacturing Orders, Jobsheets, and Tasks
  console.log('📋 Creating orders with hierarchy...')

  const ordersData = [
    {
      orderNumber: 'ORD-2025-001',
      customerName: 'PT. Astra Honda Motor',
      customerEmail: 'procurement@ahm.co.id',
      customerPhone: '+622112345678',
      status: OrderStatus.IN_PRODUCTION,
      progressPercent: 65,
      plannedStartDate: subDays(new Date(), 20),
      plannedEndDate: addDays(new Date(), 10),
      actualStartDate: subDays(new Date(), 18),
      notes: 'Motorcycle frame components - Priority order',
      mos: [
        {
          moNumber: 'MO-001',
          name: 'Frame Assembly - Left Side',
          status: MOStatus.IN_PRODUCTION,
          progressPercent: 70,
          plannedStartDate: subDays(new Date(), 18),
          plannedEndDate: addDays(new Date(), 5),
          jobsheets: [
            {
              jsNumber: 'JS-001-01',
              name: 'CNC Milling - Frame Mount',
              status: JobsheetStatus.COMPLETED,
              progressPercent: 100,
              plannedStartDate: subDays(new Date(), 18),
              plannedEndDate: subDays(new Date(), 12),
              actualStartDate: subDays(new Date(), 18),
              actualEndDate: subDays(new Date(), 13),
              tasks: [
                {
                  taskNumber: 'T-001-01-01',
                  name: 'Rough Milling Operation',
                  status: TaskStatus.COMPLETED,
                  progressPercent: 100,
                  plannedHours: 4,
                  actualHours: 3.5,
                  machineId: 'machine-cnc-001',
                  assignedTo: 'user-tech1',
                  clockedInAt: subDays(new Date(), 18),
                  clockedOutAt: subDays(new Date(), 18),
                },
                {
                  taskNumber: 'T-001-01-02',
                  name: 'Finish Milling Operation',
                  status: TaskStatus.COMPLETED,
                  progressPercent: 100,
                  plannedHours: 3,
                  actualHours: 3,
                  machineId: 'machine-cnc-001',
                  assignedTo: 'user-tech1',
                  clockedInAt: subDays(new Date(), 17),
                  clockedOutAt: subDays(new Date(), 17),
                },
              ],
            },
            {
              jsNumber: 'JS-001-02',
              name: 'Drilling & Tapping',
              status: JobsheetStatus.COMPLETED,
              progressPercent: 100,
              plannedStartDate: subDays(new Date(), 11),
              plannedEndDate: subDays(new Date(), 8),
              actualStartDate: subDays(new Date(), 11),
              actualEndDate: subDays(new Date(), 8),
              tasks: [
                {
                  taskNumber: 'T-001-02-01',
                  name: 'Drill Mounting Holes',
                  status: TaskStatus.COMPLETED,
                  progressPercent: 100,
                  plannedHours: 2,
                  actualHours: 2,
                  machineId: 'machine-drill-001',
                  assignedTo: 'user-tech2',
                  clockedInAt: subDays(new Date(), 11),
                  clockedOutAt: subDays(new Date(), 11),
                },
              ],
            },
            {
              jsNumber: 'JS-001-03',
              name: 'Welding Assembly',
              status: JobsheetStatus.IN_PROGRESS,
              progressPercent: 60,
              plannedStartDate: subDays(new Date(), 7),
              plannedEndDate: addDays(new Date(), 2),
              actualStartDate: subDays(new Date(), 6),
              tasks: [
                {
                  taskNumber: 'T-001-03-01',
                  name: 'TIG Welding - Main Joint',
                  status: TaskStatus.RUNNING,
                  progressPercent: 60,
                  plannedHours: 6,
                  actualHours: null,
                  machineId: 'machine-weld-001',
                  assignedTo: 'user-tech1',
                  clockedInAt: subDays(new Date(), 1),
                  clockedOutAt: null,
                },
              ],
            },
          ],
        },
        {
          moNumber: 'MO-002',
          name: 'Frame Assembly - Right Side',
          status: MOStatus.MATERIAL_PREPARATION,
          progressPercent: 40,
          plannedStartDate: subDays(new Date(), 10),
          plannedEndDate: addDays(new Date(), 8),
          jobsheets: [
            {
              jsNumber: 'JS-002-01',
              name: 'CNC Lathe - Tube Turning',
              status: JobsheetStatus.IN_PROGRESS,
              progressPercent: 50,
              plannedStartDate: subDays(new Date(), 8),
              plannedEndDate: addDays(new Date(), 2),
              actualStartDate: subDays(new Date(), 7),
              tasks: [
                {
                  taskNumber: 'T-002-01-01',
                  name: 'OD Turning Operation',
                  status: TaskStatus.RUNNING,
                  progressPercent: 50,
                  plannedHours: 5,
                  actualHours: null,
                  machineId: 'machine-cnc-002',
                  assignedTo: 'user-tech2',
                  clockedInAt: subDays(new Date(), 1),
                  clockedOutAt: null,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      orderNumber: 'ORD-2025-002',
      customerName: 'PT. Yamaha Indonesia Motor',
      customerEmail: 'parts@yamaha.co.id',
      customerPhone: '+622198765432',
      status: OrderStatus.PLANNING,
      progressPercent: 15,
      plannedStartDate: subDays(new Date(), 5),
      plannedEndDate: addDays(new Date(), 25),
      notes: 'Engine mounting brackets - Standard priority',
      mos: [
        {
          moNumber: 'MO-003',
          name: 'Mounting Bracket Set',
          status: MOStatus.PLANNING,
          progressPercent: 20,
          plannedStartDate: subDays(new Date(), 3),
          plannedEndDate: addDays(new Date(), 15),
          jobsheets: [
            {
              jsNumber: 'JS-003-01',
              name: 'Press Brake Forming',
              status: JobsheetStatus.PREPARING,
              progressPercent: 0,
              plannedStartDate: addDays(new Date(), 5),
              plannedEndDate: addDays(new Date(), 10),
              tasks: [],
            },
          ],
        },
      ],
    },
    {
      orderNumber: 'ORD-2025-003',
      customerName: 'PT. Suzuki Indomobil Motor',
      customerEmail: 'manufacturing@suzuki.co.id',
      customerPhone: '+6221555666777',
      status: OrderStatus.MATERIAL_PREPARATION,
      progressPercent: 30,
      plannedStartDate: subDays(new Date(), 10),
      plannedEndDate: addDays(new Date(), 20),
      actualStartDate: subDays(new Date(), 8),
      notes: 'Suspension components - High precision required',
      mos: [
        {
          moNumber: 'MO-004',
          name: 'Rear Suspension Arm',
          status: MOStatus.IN_PRODUCTION,
          progressPercent: 45,
          plannedStartDate: subDays(new Date(), 8),
          plannedEndDate: addDays(new Date(), 12),
          actualStartDate: subDays(new Date(), 7),
          jobsheets: [
            {
              jsNumber: 'JS-004-01',
              name: 'CNC Milling - Arm Body',
              status: JobsheetStatus.COMPLETED,
              progressPercent: 100,
              plannedStartDate: subDays(new Date(), 8),
              plannedEndDate: subDays(new Date(), 3),
              actualStartDate: subDays(new Date(), 7),
              actualEndDate: subDays(new Date(), 4),
              tasks: [
                {
                  taskNumber: 'T-004-01-01',
                  name: '5-Axis Milling',
                  status: TaskStatus.COMPLETED,
                  progressPercent: 100,
                  plannedHours: 8,
                  actualHours: 7.5,
                  machineId: 'machine-cnc-001',
                  assignedTo: 'user-tech1',
                  clockedInAt: subDays(new Date(), 7),
                  clockedOutAt: subDays(new Date(), 6),
                },
              ],
            },
            {
              jsNumber: 'JS-004-02',
              name: 'Drilling - Pivot Holes',
              status: JobsheetStatus.IN_PROGRESS,
              progressPercent: 30,
              plannedStartDate: subDays(new Date(), 2),
              plannedEndDate: addDays(new Date(), 3),
              actualStartDate: subDays(new Date(), 1),
              tasks: [
                {
                  taskNumber: 'T-004-02-01',
                  name: 'Precision Drilling',
                  status: TaskStatus.PAUSED,
                  progressPercent: 30,
                  plannedHours: 4,
                  actualHours: 1,
                  machineId: 'machine-drill-001',
                  assignedTo: 'user-tech2',
                  clockedInAt: subDays(new Date(), 1),
                  clockedOutAt: subDays(new Date(), 1),
                  breakdownAt: new Date(),
                  breakdownNote: 'Drill bit broken - waiting for replacement',
                },
              ],
            },
          ],
        },
        {
          moNumber: 'MO-005',
          name: 'Front Suspension Tube',
          status: MOStatus.PLANNING,
          progressPercent: 0,
          plannedStartDate: addDays(new Date(), 5),
          plannedEndDate: addDays(new Date(), 18),
          jobsheets: [],
        },
      ],
    },
    {
      orderNumber: 'ORD-2025-004',
      customerName: 'PT. Kawasaki Motor Indonesia',
      customerEmail: 'production@kawasaki.co.id',
      customerPhone: '+6221444555666',
      status: OrderStatus.DRAFT,
      progressPercent: 0,
      plannedStartDate: addDays(new Date(), 15),
      plannedEndDate: addDays(new Date(), 45),
      notes: 'Swingarm assembly - New product development',
      mos: [
        {
          moNumber: 'MO-006',
          name: 'Swingarm Prototype',
          status: MOStatus.DRAFT,
          progressPercent: 0,
          plannedStartDate: addDays(new Date(), 15),
          plannedEndDate: addDays(new Date(), 40),
          jobsheets: [],
        },
      ],
    },
    {
      orderNumber: 'ORD-2025-005',
      customerName: 'PT. Toyota Astra Motor',
      customerEmail: 'parts@toyota.co.id',
      customerPhone: '+6221333222111',
      status: OrderStatus.IN_PRODUCTION,
      progressPercent: 85,
      plannedStartDate: subDays(new Date(), 30),
      plannedEndDate: subDays(new Date(), 5),
      actualStartDate: subDays(new Date(), 28),
      actualEndDate: subDays(new Date(), 3),
      notes: 'Engine bracket set - Automotive quality standards',
      mos: [
        {
          moNumber: 'MO-007',
          name: 'Engine Bracket LH',
          status: MOStatus.QC,
          progressPercent: 95,
          plannedStartDate: subDays(new Date(), 28),
          plannedEndDate: subDays(new Date(), 5),
          actualStartDate: subDays(new Date(), 27),
          actualEndDate: subDays(new Date(), 4),
          jobsheets: [
            {
              jsNumber: 'JS-007-01',
              name: 'Complete Machining',
              status: JobsheetStatus.COMPLETED,
              progressPercent: 100,
              plannedStartDate: subDays(new Date(), 28),
              plannedEndDate: subDays(new Date(), 10),
              actualStartDate: subDays(new Date(), 27),
              actualEndDate: subDays(new Date(), 11),
              tasks: [
                {
                  taskNumber: 'T-007-01-01',
                  name: 'Complete CNC Machining',
                  status: TaskStatus.COMPLETED,
                  progressPercent: 100,
                  plannedHours: 12,
                  actualHours: 11,
                  machineId: 'machine-cnc-001',
                  assignedTo: 'user-tech1',
                  clockedInAt: subDays(new Date(), 27),
                  clockedOutAt: subDays(new Date(), 26),
                },
              ],
            },
          ],
        },
      ],
    },
  ]

  // Create the order hierarchy
  for (const orderData of ordersData) {
    const { mos, ...orderFields } = orderData

    const order = await prisma.order.create({
      data: {
        ...orderFields,
        tenantId: TENANT_ID,
        boardId: BOARD_ID,
      },
    })

    console.log(`  📦 Created Order: ${order.orderNumber}`)

    for (const moData of mos) {
      const { jobsheets, ...moFields } = moData

      const mo = await prisma.manufacturingOrder.create({
        data: {
          ...moFields,
          tenantId: TENANT_ID,
          orderId: order.id,
        },
      })

      console.log(`    🏭 Created MO: ${mo.moNumber}`)

      for (const jsData of jobsheets) {
        const { tasks, ...jsFields } = jsData

        const js = await prisma.jobsheet.create({
          data: {
            ...jsFields,
            tenantId: TENANT_ID,
            moId: mo.id,
          },
        })

        console.log(`      📋 Created JS: ${js.jsNumber}`)

        for (const taskData of tasks) {
          await prisma.machiningTask.create({
            data: {
              ...taskData,
              tenantId: TENANT_ID,
              jobsheetId: js.id,
              status: taskData.status as TaskStatus,
            },
          })
          console.log(`        ⚙️  Created Task: ${taskData.taskNumber}`)
        }
      }
    }
  }

  // 8. Create Inventory Items
  console.log('📦 Creating inventory...')
  const inventoryItems = [
    { partNumber: 'MAT-STL-001', name: 'Steel Plate 10mm', category: 'Raw Material', quantity: 150, unit: 'sheets', location: 'Warehouse A', shelf: 'A-01', batch: 'BATCH-001' },
    { partNumber: 'MAT-STL-002', name: 'Steel Plate 20mm', category: 'Raw Material', quantity: 80, unit: 'sheets', location: 'Warehouse A', shelf: 'A-02', batch: 'BATCH-002' },
    { partNumber: 'MAT-ALU-001', name: 'Aluminum Bar 50mm', category: 'Raw Material', quantity: 200, unit: 'bars', location: 'Warehouse A', shelf: 'B-01', batch: 'BATCH-003' },
    { partNumber: 'MAT-ALU-002', name: 'Aluminum Sheet 5mm', category: 'Raw Material', quantity: 120, unit: 'sheets', location: 'Warehouse A', shelf: 'B-02', batch: 'BATCH-004' },
    { partNumber: 'TOOL-DRILL-001', name: 'HSS Drill Bit 10mm', category: 'Tools', quantity: 50, unit: 'pcs', location: 'Tool Crib', shelf: 'T-01', batch: 'TOOL-001' },
    { partNumber: 'TOOL-DRILL-002', name: 'HSS Drill Bit 12mm', category: 'Tools', quantity: 45, unit: 'pcs', location: 'Tool Crib', shelf: 'T-01', batch: 'TOOL-002' },
    { partNumber: 'TOOL-INSERT-001', name: 'Carbide Insert CNMG', category: 'Tools', quantity: 100, unit: 'pcs', location: 'Tool Crib', shelf: 'T-02', batch: 'TOOL-003' },
    { partNumber: 'PART-FRAME-001', name: 'Motorcycle Frame LH', category: 'WIP', quantity: 25, unit: 'pcs', location: 'WIP Area', shelf: 'W-01', batch: 'WIP-001' },
    { partNumber: 'PART-FRAME-002', name: 'Motorcycle Frame RH', category: 'WIP', quantity: 23, unit: 'pcs', location: 'WIP Area', shelf: 'W-02', batch: 'WIP-002' },
    { partNumber: 'PART-BRACKET-001', name: 'Engine Bracket Set', category: 'Finished Goods', quantity: 100, unit: 'sets', location: 'Finished Goods', shelf: 'F-01', batch: 'FG-001' },
  ]

  for (const item of inventoryItems) {
    await prisma.inventory.upsert({
      where: { tenantId_partNumber_batch: { tenantId: TENANT_ID, partNumber: item.partNumber, batch: item.batch } },
      update: {},
      create: {
        ...item,
        tenantId: TENANT_ID,
        status: item.quantity < 50 ? 'RESERVED' : 'AVAILABLE',
      },
    })
  }

  // 9. Create System Settings
  console.log('⚙️  Creating system settings...')
  const settings = [
    { key: 'COMPANY_NAME', category: 'General', value: 'YPTI Manufacturing', type: 'string', description: 'Company name', isPublic: true },
    { key: 'WORK_HOURS_START', category: 'Operations', value: '08:00', type: 'string', description: 'Work start time', isPublic: true },
    { key: 'WORK_HOURS_END', category: 'Operations', value: '17:00', type: 'string', description: 'Work end time', isPublic: true },
    { key: 'QC_PASS_THRESHOLD', category: 'Quality', value: '95', type: 'string', description: 'QC pass threshold percentage', isPublic: false },
    { key: 'LOW_STOCK_ALERT', category: 'Inventory', value: '50', type: 'string', description: 'Low stock alert threshold', isPublic: false },
    { key: 'MAINTENANCE_INTERVAL', category: 'Maintenance', value: '30', type: 'string', description: 'Machine maintenance interval (days)', isPublic: false },
  ]

  for (const setting of settings) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    })
  }

  // 10. Create User Settings
  console.log('👤 Creating user settings...')
  for (const user of users) {
    await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        theme: 'light',
        language: 'id',
        timezone: 'Asia/Jakarta',
        emailNotifications: true,
        taskReminders: true,
        breakdownAlerts: true,
        inventoryAlerts: true,
        defaultView: 'kanban',
        showInactiveMachines: false,
        showCompletedTasks: true,
        rowsPerPage: 25,
      },
    })
  }

  console.log('✅ Seed completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`   - 1 Tenant (YPTI Manufacturing)`)
  console.log(`   - ${users.length} Users`)
  console.log(`   - ${machines.length} Machines`)
  console.log(`   - ${ordersData.length} Orders`)
  console.log(`   - ${inventoryItems.length} Inventory Items`)
  console.log('\n🔐 Demo Login Credentials:')
  console.log('   - Admin: admin@ypti.com')
  console.log('   - PPIC: ppic@ypti.com')
  console.log('   - Manager: manager@ypti.com')
  console.log('   - Technician 1: tech1@ypti.com')
  console.log('   - Technician 2: tech2@ypti.com')
  console.log('   (All passwords are set to a demo hash - implement proper auth for production)')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
