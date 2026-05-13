// Enhanced Seed script for ManuOS Phase 1.5 - with Material Requirements
import { PrismaClient, OrderStatus, MOStatus, JobsheetStatus, TaskStatus, MachineStatus, WorkflowEntityType, MaterialRequirementStatus } from '@prisma/client'
import { addDays, subDays } from 'date-fns'

const prisma = new PrismaClient()

// Import permission definitions
import { PERMISSION_DEFINITIONS, ROLE_PERMISSIONS, ROLE_DESCRIPTIONS } from '../src/lib/auth/permissions'

const TENANT_ID = 'tenant_ypti'
const BOARD_ID = 'board_main'

async function main() {
  console.log('🌱 Starting ManuOS Phase 1.5 seed for YPTI...')

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

  // 4. Create Permissions
  console.log('🔐 Creating permissions...')
  for (const perm of PERMISSION_DEFINITIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: {
        code: perm.code,
        name: perm.name,
        description: perm.description,
        category: perm.category,
      },
    })
  }

  // 5. Create Roles (7 Role Types)
  console.log('👥 Creating 7 role types...')
  const roles: Record<string, string> = {}
  
  for (const [roleCode, roleInfo] of Object.entries(ROLE_DESCRIPTIONS)) {
    const role = await prisma.role.upsert({
      where: { code: roleCode },
      update: {},
      create: {
        code: roleCode,
        name: roleInfo.name,
        description: roleInfo.description,
        isSystem: true,
      },
    })
    roles[roleCode] = role.id
  }

  // 6. Assign Permissions to Roles
  console.log('🔗 Assigning permissions to roles...')
  for (const [roleCode, permissionCodes] of Object.entries(ROLE_PERMISSIONS)) {
    const roleId = roles[roleCode]
    if (!roleId) continue

    for (const permCode of permissionCodes) {
      const permission = await prisma.permission.findUnique({ where: { code: permCode } })
      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: { roleId, permissionId: permission.id }
          },
          update: {},
          create: {
            roleId,
            permissionId: permission.id,
            canRead: true,
            canWrite: !permCode.includes(':read'),
            canDelete: permCode.includes(':delete'),
            canApprove: permCode.includes(':approve'),
          },
        })
      }
    }
  }

  // 7. Create Default Workflow for Orders
  console.log('🔄 Creating default workflows...')
  const orderWorkflow = await prisma.workflow.upsert({
    where: { 
      tenantId_code_entityType: { 
        tenantId: TENANT_ID, 
        code: 'ORDER_DEFAULT', 
        entityType: WorkflowEntityType.ORDER 
      } 
    },
    update: {},
    create: {
      tenantId: TENANT_ID,
      code: 'ORDER_DEFAULT',
      name: 'Default Order Workflow',
      description: 'Standard order lifecycle workflow',
      entityType: WorkflowEntityType.ORDER,
      isDefault: true,
    },
  })

  // Create workflow states
  const orderStates = [
    { code: 'DRAFT', name: 'Draft', order: 0, color: '#gray', isInitial: true },
    { code: 'PLANNING', name: 'Planning', order: 1, color: '#blue' },
    { code: 'MATERIAL_PREPARATION', name: 'Material Preparation', order: 2, color: '#yellow' },
    { code: 'IN_PRODUCTION', name: 'In Production', order: 3, color: '#orange' },
    { code: 'ASSEMBLY', name: 'Assembly', order: 4, color: '#purple' },
    { code: 'QC', name: 'Quality Control', order: 5, color: '#cyan' },
    { code: 'READY_FOR_DELIVERY', name: 'Ready for Delivery', order: 6, color: '#green' },
    { code: 'DELIVERED', name: 'Delivered', order: 7, color: '#green', isFinal: true },
    { code: 'CLOSED', name: 'Closed', order: 8, color: '#gray', isFinal: true },
    { code: 'CANCELLED', name: 'Cancelled', order: 99, color: '#red', isFinal: true },
  ]

  for (const state of orderStates) {
    await prisma.workflowState.upsert({
      where: { workflowId_code: { workflowId: orderWorkflow.id, code: state.code } },
      update: {},
      create: {
        tenantId: TENANT_ID,
        workflowId: orderWorkflow.id,
        code: state.code,
        name: state.name,
        order: state.order,
        color: state.color,
        isInitial: state.isInitial || false,
        isFinal: state.isFinal || false,
      },
    })
  }

  // 8. Create Suppliers
  console.log('🏭 Creating suppliers...')
  const suppliers = [
    { code: 'SUP-001', name: 'PT. Steel Indo', contactPerson: 'Budi', email: 'budi@steelindo.co.id', phone: '+622112345678', city: 'Jakarta', odooPartnerId: '1' },
    { code: 'SUP-002', name: 'PT. Aluminum Jaya', contactPerson: 'Sari', email: 'sari@alumjaya.co.id', phone: '+622187654321', city: 'Surabaya', odooPartnerId: '2' },
    { code: 'SUP-003', name: 'PT. Toolindo Makmur', contactPerson: 'Agus', email: 'agus@toolindo.co.id', phone: '+622155556666', city: 'Bandung', odooPartnerId: '3' },
  ]

  for (const supplier of suppliers) {
    await prisma.supplier.upsert({
      where: { tenantId_code: { tenantId: TENANT_ID, code: supplier.code } },
      update: {},
      create: {
        tenantId: TENANT_ID,
        ...supplier,
        isActive: true,
      },
    })
  }

  // 9. Create Users
  console.log('👤 Creating users...')
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
        roleId: roles['ROLE_ADMIN'],
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
        roleId: roles['ROLE_PPIC'],
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
        roleId: roles['ROLE_MANAGER'],
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
        roleId: roles['ROLE_TECHNICIAN'],
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
        roleId: roles['ROLE_TECHNICIAN'],
        passwordHash: DEMO_PASSWORD,
        isActive: true,
        employeeId: 'EMP-005',
      },
    }),
    prisma.user.upsert({
      where: { tenantId_email: { tenantId: TENANT_ID, email: 'warehouse@ypti.com' } },
      update: {},
      create: {
        id: 'user-warehouse',
        tenantId: TENANT_ID,
        email: 'warehouse@ypti.com',
        name: 'Rina Marlina',
        phone: '+6281234567895',
        roleId: roles['ROLE_WAREHOUSE'],
        passwordHash: DEMO_PASSWORD,
        isActive: true,
        employeeId: 'EMP-006',
      },
    }),
  ])

  // 10. Create Machines
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
        status: MachineStatus.IDLE,
        capacity: 8,
        isActive: true,
      },
    }),
  ])

  // 11. Create Enhanced Inventory with Suppliers
  console.log('📦 Creating enhanced inventory...')
  
  const sup1 = await prisma.supplier.findUnique({ where: { tenantId_code: { tenantId: TENANT_ID, code: 'SUP-001' } } })
  const sup2 = await prisma.supplier.findUnique({ where: { tenantId_code: { tenantId: TENANT_ID, code: 'SUP-002' } } })
  const sup3 = await prisma.supplier.findUnique({ where: { tenantId_code: { tenantId: TENANT_ID, code: 'SUP-003' } } })
  
  const inventoryItems = [
    { partNumber: 'MAT-STL-001', name: 'Steel Plate 10mm', category: 'Raw Material', quantity: 150, reservedQty: 0, unit: 'sheets', location: 'Warehouse A', shelf: 'A-01', batch: 'BATCH-001', supplierId: sup1?.id, unitPrice: 150000, reorderPoint: 50, reorderQuantity: 100 },
    { partNumber: 'MAT-STL-002', name: 'Steel Plate 20mm', category: 'Raw Material', quantity: 80, reservedQty: 0, unit: 'sheets', location: 'Warehouse A', shelf: 'A-02', batch: 'BATCH-002', supplierId: sup1?.id, unitPrice: 280000, reorderPoint: 30, reorderQuantity: 50 },
    { partNumber: 'MAT-ALU-001', name: 'Aluminum Bar 50mm', category: 'Raw Material', quantity: 200, reservedQty: 0, unit: 'bars', location: 'Warehouse A', shelf: 'B-01', batch: 'BATCH-003', supplierId: sup2?.id, unitPrice: 75000, reorderPoint: 50, reorderQuantity: 100 },
    { partNumber: 'TOOL-DRILL-001', name: 'HSS Drill Bit 10mm', category: 'Tools', quantity: 50, reservedQty: 0, unit: 'pcs', location: 'Tool Crib', shelf: 'T-01', batch: 'TOOL-001', supplierId: sup3?.id, unitPrice: 45000, reorderPoint: 20, reorderQuantity: 30 },
    { partNumber: 'PART-BRACKET-001', name: 'Engine Bracket Set', category: 'Finished Goods', quantity: 100, reservedQty: 0, unit: 'sets', location: 'Finished Goods', shelf: 'F-01', batch: 'FG-001', unitPrice: 250000 },
  ]

  for (const item of inventoryItems) {
    const { supplierId, ...itemData } = item
    await prisma.inventory.upsert({
      where: { tenantId_partNumber_batch: { tenantId: TENANT_ID, partNumber: item.partNumber, batch: item.batch } },
      update: {},
      create: {
        ...itemData,
        tenantId: TENANT_ID,
        availableQty: item.quantity - item.reservedQty,
        status: 'AVAILABLE',
        currency: 'IDR',
        supplierId,
      },
    })
  }

  // 12. Create Orders with MOs for Material Requirements Demo
  console.log('📋 Creating orders with material requirements...')
  
  // Create Order 1 (use upsert)
  const order1 = await prisma.order.upsert({
    where: { 
      tenantId_orderNumber: { tenantId: TENANT_ID, orderNumber: 'ORD-2026-001' } 
    },
    update: {},
    create: {
      tenantId: TENANT_ID,
      boardId: BOARD_ID,
      orderNumber: 'ORD-2026-001',
      customerName: 'PT. Honda Prospect Motor',
      customerEmail: 'procurement@hpm.co.id',
      status: OrderStatus.MATERIAL_PREPARATION,
      plannedStartDate: subDays(new Date(), 5),
      plannedEndDate: addDays(new Date(), 30),
      progressPercent: 15,
    },
  })

  // Create MO for Order 1 (use upsert)
  const mo1 = await prisma.manufacturingOrder.upsert({
    where: { 
      tenantId_orderId_moNumber: { tenantId: TENANT_ID, orderId: order1.id, moNumber: 'MO-001' } 
    },
    update: {},
    create: {
      tenantId: TENANT_ID,
      orderId: order1.id,
      moNumber: 'MO-001',
      name: 'Front Fork Assembly',
      description: 'Complete front fork assembly for motorcycle',
      type: 'MAIN',
      status: MOStatus.PLANNED,
      plannedStartDate: subDays(new Date(), 3),
      plannedEndDate: addDays(new Date(), 25),
      progressPercent: 0,
    },
  })

  // Create Material Requirements for MO1
  console.log('📦 Creating material requirements...')
  
  const steelPlate = await prisma.inventory.findFirst({ where: { partNumber: 'MAT-STL-001' } })
  const aluminumBar = await prisma.inventory.findFirst({ where: { partNumber: 'MAT-ALU-001' } })
  
  const materialRequirements = [
    {
      partNumber: 'MAT-STL-001',
      name: 'Steel Plate 10mm',
      description: 'Main structural component',
      category: 'Raw Material',
      requiredQty: 50,
      unit: 'sheets',
      requiredDate: addDays(new Date(), 7),
      priority: 1,
      inventoryId: steelPlate?.id,
    },
    {
      partNumber: 'MAT-ALU-001',
      name: 'Aluminum Bar 50mm',
      description: 'Secondary component',
      category: 'Raw Material',
      requiredQty: 30,
      unit: 'bars',
      requiredDate: addDays(new Date(), 10),
      priority: 2,
      inventoryId: aluminumBar?.id,
    },
    {
      partNumber: 'MAT-STL-002',
      name: 'Steel Plate 20mm',
      description: 'Heavy duty bracket',
      category: 'Raw Material',
      requiredQty: 20,
      unit: 'sheets',
      requiredDate: addDays(new Date(), 12),
      priority: 3,
    },
    {
      partNumber: 'MAT-COP-001',
      name: 'Copper Wire 2mm',
      description: 'Wiring harness material',
      category: 'Raw Material',
      requiredQty: 1000,
      unit: 'meters',
      requiredDate: addDays(new Date(), 15),
      priority: 5,
    },
  ]

  for (const mat of materialRequirements) {
    const { inventoryId, ...matData } = mat
    await prisma.materialRequirement.upsert({
      where: {
        tenantId_moId_partNumber: { tenantId: TENANT_ID, moId: mo1.id, partNumber: mat.partNumber }
      },
      update: {},
      create: {
        tenantId: TENANT_ID,
        moId: mo1.id,
        ...matData,
        requiredQty: mat.requiredQty,
        reservedQty: 0,
        requestedQty: 0,
        receivedQty: 0,
        consumedQty: 0,
        status: MaterialRequirementStatus.PLANNED,
        priority: mat.priority,
        createdBy: 'user-ppic',
      },
    })
  }

  // Auto-reserve available materials
  console.log('🔒 Auto-reserving materials from stock...')
  
  // Reserve steel plates (50 needed, 150 available)
  if (steelPlate) {
    await prisma.inventoryReservation.create({
      data: {
        tenantId: TENANT_ID,
        inventoryId: steelPlate.id,
        moId: mo1.id,
        quantity: 50,
        status: 'ALLOCATED',
        notes: 'Reserved for MO-001',
        createdBy: 'user-ppic',
      },
    })
    await prisma.inventory.update({
      where: { id: steelPlate.id },
      data: {
        reservedQty: 50,
        availableQty: 100,
      },
    })
    await prisma.materialRequirement.updateMany({
      where: { tenantId: TENANT_ID, moId: mo1.id, partNumber: 'MAT-STL-001' },
      data: { reservedQty: 50, status: MaterialRequirementStatus.RESERVED },
    })
  }

  // Reserve aluminum bars (30 needed, 200 available)
  if (aluminumBar) {
    await prisma.inventoryReservation.create({
      data: {
        tenantId: TENANT_ID,
        inventoryId: aluminumBar.id,
        moId: mo1.id,
        quantity: 30,
        status: 'ALLOCATED',
        notes: 'Reserved for MO-001',
        createdBy: 'user-ppic',
      },
    })
    await prisma.inventory.update({
      where: { id: aluminumBar.id },
      data: {
        reservedQty: 30,
        availableQty: 170,
      },
    })
    await prisma.materialRequirement.updateMany({
      where: { tenantId: TENANT_ID, moId: mo1.id, partNumber: 'MAT-ALU-001' },
      data: { reservedQty: 30, status: MaterialRequirementStatus.RESERVED },
    })
  }

  // Create Purchase Request for items not in stock
  console.log('📝 Creating purchase request for missing materials...')
  const pr = await prisma.purchaseRequest.create({
    data: {
      tenantId: TENANT_ID,
      prNumber: 'PR-2026-001',
      title: 'Materials for MO-001',
      description: 'Purchase request for materials not in stock',
      status: 'DRAFT',
      priority: 3,
      sourceType: 'AUTO_MO',
      sourceMoId: mo1.id,
      requiredDate: addDays(new Date(), 12),
      totalItems: 2,
      estimatedAmount: 8500000,
      currency: 'IDR',
      createdBy: 'user-ppic',
    },
  })

  // Add PR items
  await prisma.purchaseRequestItem.create({
    data: {
      tenantId: TENANT_ID,
      purchaseRequestId: pr.id,
      partNumber: 'MAT-STL-002',
      name: 'Steel Plate 20mm',
      description: 'Heavy duty bracket material',
      quantity: 20,
      unitPrice: 280000,
      totalPrice: 5600000,
      unit: 'sheets',
      status: 'PENDING',
    },
  })

  await prisma.purchaseRequestItem.create({
    data: {
      tenantId: TENANT_ID,
      purchaseRequestId: pr.id,
      partNumber: 'MAT-COP-001',
      name: 'Copper Wire 2mm',
      description: 'Wiring harness material',
      quantity: 1000,
      unitPrice: 2900,
      totalPrice: 2900000,
      unit: 'meters',
      status: 'PENDING',
    },
  })

  // Update material requirement statuses
  await prisma.materialRequirement.updateMany({
    where: { tenantId: TENANT_ID, moId: mo1.id, partNumber: 'MAT-STL-002' },
    data: { requestedQty: 20, status: MaterialRequirementStatus.PURCHASE_REQUESTED },
  })
  await prisma.materialRequirement.updateMany({
    where: { tenantId: TENANT_ID, moId: mo1.id, partNumber: 'MAT-COP-001' },
    data: { requestedQty: 1000, status: MaterialRequirementStatus.PURCHASE_REQUESTED },
  })

  // 13. Create User Settings
  console.log('⚙️ Creating user settings...')
  for (const user of users) {
    await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        theme: 'light',
        language: 'en',
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

  // 14. Create System Settings
  console.log('🔧 Creating system settings...')
  const settings = [
    { key: 'COMPANY_NAME', category: 'General', value: 'YPTI Manufacturing', type: 'string', description: 'Company name', isPublic: true },
    { key: 'WORK_HOURS_START', category: 'Operations', value: '08:00', type: 'string', description: 'Work start time', isPublic: true },
    { key: 'WORK_HOURS_END', category: 'Operations', value: '17:00', type: 'string', description: 'Work end time', isPublic: true },
    { key: 'DEFAULT_CURRENCY', category: 'Inventory', value: 'IDR', type: 'string', description: 'Default currency for inventory', isPublic: true },
    { key: 'ODOO_ENABLED', category: 'Integration', value: 'false', type: 'boolean', description: 'Enable Odoo integration', isPublic: false },
  ]

  for (const setting of settings) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    })
  }

  console.log('✅ Seed completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`   - 1 Tenant (YPTI Manufacturing)`)
  console.log(`   - 7 Roles with ${PERMISSION_DEFINITIONS.length} Permissions`)
  console.log(`   - ${users.length} Users`)
  console.log(`   - ${machines.length} Machines`)
  console.log(`   - ${suppliers.length} Suppliers`)
  console.log(`   - ${inventoryItems.length} Inventory Items`)
  console.log(`   - 1 Manufacturing Order with 4 Material Requirements`)
  console.log(`   - 2 Materials reserved from stock`)
  console.log(`   - 1 Purchase Request for missing materials`)
  console.log('\n🔐 Demo Login Credentials:')
  console.log('   - Admin: admin@ypti.com / demo123')
  console.log('   - PPIC: ppic@ypti.com / demo123')
  console.log('   - Manager: manager@ypti.com / demo123')
  console.log('   - Technician: tech1@ypti.com / demo123')
  console.log('   - Warehouse: warehouse@ypti.com / demo123')
  console.log('\n🏭 Material Planning Demo:')
  console.log(`   - MO-001 (Front Fork Assembly) has 4 material requirements`)
  console.log(`   - 2 materials reserved from stock (Steel Plate 10mm, Aluminum Bar)`)
  console.log(`   - 2 materials need purchase (Steel Plate 20mm, Copper Wire)`)
  console.log(`   - PR-2026-001 created for missing materials (IDR 8,500,000)`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
