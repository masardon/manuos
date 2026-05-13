/**
 * Enhanced Seed script for ManuOS Phase 1.5
 * Includes: Multi-tenant IAM, 7 roles, permissions, workflows, inventory enhancements
 * Run with: bun prisma/seed.ts
 */

import { PrismaClient, OrderStatus, MOStatus, JobsheetStatus, TaskStatus, MachineStatus, WorkflowEntityType } from '@prisma/client'
import { addDays, subDays } from 'date-fns'

const prisma = new PrismaClient()

// Import permission definitions
import { PERMISSION_DEFINITIONS, ROLE_PERMISSIONS, ROLE_DESCRIPTIONS } from '../src/lib/auth/permissions'

// Sample data for YPTI
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
    { code: 'SUP-001', name: 'PT. Steel Indo', contactPerson: 'Budi', email: 'budi@steelindo.co.id', phone: '+622112345678', city: 'Jakarta' },
    { code: 'SUP-002', name: 'PT. Aluminum Jaya', contactPerson: 'Sari', email: 'sari@alumjaya.co.id', phone: '+622187654321', city: 'Surabaya' },
    { code: 'SUP-003', name: 'PT. Toolindo Makmur', contactPerson: 'Agus', email: 'agus@toolindo.co.id', phone: '+622155556666', city: 'Bandung' },
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
        status: MachineStatus.IDLE,
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
  ])

  // 11. Create Enhanced Inventory with Suppliers
  console.log('📦 Creating enhanced inventory...')
  
  // Get supplier IDs
  const sup1 = await prisma.supplier.findUnique({ where: { tenantId_code: { tenantId: TENANT_ID, code: 'SUP-001' } } })
  const sup2 = await prisma.supplier.findUnique({ where: { tenantId_code: { tenantId: TENANT_ID, code: 'SUP-002' } } })
  const sup3 = await prisma.supplier.findUnique({ where: { tenantId_code: { tenantId: TENANT_ID, code: 'SUP-003' } } })
  
  const inventoryItems = [
    { partNumber: 'MAT-STL-001', name: 'Steel Plate 10mm', category: 'Raw Material', quantity: 150, reservedQty: 20, unit: 'sheets', location: 'Warehouse A', shelf: 'A-01', batch: 'BATCH-001', supplierId: sup1?.id, unitPrice: 150000, reorderPoint: 50, reorderQuantity: 100 },
    { partNumber: 'MAT-STL-002', name: 'Steel Plate 20mm', category: 'Raw Material', quantity: 80, reservedQty: 0, unit: 'sheets', location: 'Warehouse A', shelf: 'A-02', batch: 'BATCH-002', supplierId: sup1?.id, unitPrice: 280000, reorderPoint: 30, reorderQuantity: 50 },
    { partNumber: 'MAT-ALU-001', name: 'Aluminum Bar 50mm', category: 'Raw Material', quantity: 200, reservedQty: 30, unit: 'bars', location: 'Warehouse A', shelf: 'B-01', batch: 'BATCH-003', supplierId: sup2?.id, unitPrice: 75000, reorderPoint: 50, reorderQuantity: 100 },
    { partNumber: 'MAT-ALU-002', name: 'Aluminum Sheet 5mm', category: 'Raw Material', quantity: 120, reservedQty: 0, unit: 'sheets', location: 'Warehouse A', shelf: 'B-02', batch: 'BATCH-004', supplierId: sup2?.id, unitPrice: 180000, reorderPoint: 40, reorderQuantity: 60 },
    { partNumber: 'TOOL-DRILL-001', name: 'HSS Drill Bit 10mm', category: 'Tools', quantity: 50, reservedQty: 0, unit: 'pcs', location: 'Tool Crib', shelf: 'T-01', batch: 'TOOL-001', supplierId: sup3?.id, unitPrice: 45000, reorderPoint: 20, reorderQuantity: 30 },
    { partNumber: 'TOOL-DRILL-002', name: 'HSS Drill Bit 12mm', category: 'Tools', quantity: 45, reservedQty: 0, unit: 'pcs', location: 'Tool Crib', shelf: 'T-01', batch: 'TOOL-002', supplierId: sup3?.id, unitPrice: 55000, reorderPoint: 20, reorderQuantity: 30 },
    { partNumber: 'TOOL-INSERT-001', name: 'Carbide Insert CNMG', category: 'Tools', quantity: 100, reservedQty: 0, unit: 'pcs', location: 'Tool Crib', shelf: 'T-02', batch: 'TOOL-003', supplierId: sup3?.id, unitPrice: 35000, reorderPoint: 30, reorderQuantity: 50 },
    { partNumber: 'PART-FRAME-001', name: 'Motorcycle Frame LH', category: 'WIP', quantity: 25, reservedQty: 0, unit: 'pcs', location: 'WIP Area', shelf: 'W-01', batch: 'WIP-001' },
    { partNumber: 'PART-FRAME-002', name: 'Motorcycle Frame RH', category: 'WIP', quantity: 23, reservedQty: 0, unit: 'pcs', location: 'WIP Area', shelf: 'W-02', batch: 'WIP-002' },
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
        status: item.quantity < 50 ? 'RESERVED' : 'AVAILABLE',
        currency: 'IDR',
      },
    })
  }

  // 12. Create Inventory Reservations
  console.log('🔒 Creating inventory reservations...')
  const steelPlateInv = await prisma.inventory.findFirst({ 
    where: { tenantId: TENANT_ID, partNumber: 'MAT-STL-001' } 
  })
  
  if (steelPlateInv) {
    await prisma.inventoryReservation.create({
      data: {
        tenantId: TENANT_ID,
        inventoryId: steelPlateInv.id,
        quantity: 20,
        status: 'ALLOCATED',
        notes: 'Reserved for future order',
        createdBy: 'user-ppic',
      },
    })
  }

  // 13. Create Sample Purchase Orders
  console.log('📝 Creating sample purchase orders...')
  const supplier1 = await prisma.supplier.findUnique({ where: { tenantId_code: { tenantId: TENANT_ID, code: 'SUP-001' } } })
  
  if (supplier1) {
    const po = await prisma.purchaseOrder.create({
      data: {
        tenantId: TENANT_ID,
        supplierId: supplier1.id,
        poNumber: 'PO-2025-001',
        status: 'APPROVED',
        totalAmount: 7500000,
        expectedDate: addDays(new Date(), 7),
      },
    })

    // Add PO items
    await prisma.purchaseOrderItem.create({
      data: {
        tenantId: TENANT_ID,
        purchaseOrderId: po.id,
        partNumber: 'MAT-STL-001',
        name: 'Steel Plate 10mm',
        quantity: 50,
        unitPrice: 150000,
        totalPrice: 7500000,
        unit: 'sheets',
      },
    })
  }

  // 14. Create Recipes/BOMs
  console.log('🍳 Creating sample recipes...')
  const frameRecipe = await prisma.recipe.upsert({
    where: { tenantId_code_version: { tenantId: TENANT_ID, code: 'REC-FRAME-001', version: '1.0' } },
    update: {},
    create: {
      tenantId: TENANT_ID,
      code: 'REC-FRAME-001',
      name: 'Motorcycle Frame Assembly',
      description: 'BOM for motorcycle frame production',
      category: 'Assembly',
      outputPartNumber: 'PART-FRAME-001',
      outputName: 'Motorcycle Frame LH',
      outputQuantity: 1,
      outputUnit: 'pcs',
      isApproved: true,
      approvedBy: 'user-manager',
      approvedAt: new Date(),
    },
  })

  // Add recipe ingredients
  const steelPlate = await prisma.inventory.findFirst({ where: { partNumber: 'MAT-STL-001' } })
  if (steelPlate) {
    await prisma.recipeIngredient.create({
      data: {
        tenantId: TENANT_ID,
        recipeId: frameRecipe.id,
        inventoryId: steelPlate.id,
        partNumber: 'MAT-STL-001',
        name: 'Steel Plate 10mm',
        quantity: 2,
        unit: 'sheets',
        mixOrder: 1,
        isCritical: true,
        wastePercentage: 5,
      },
    })
  }

  // 15. Create User Settings for all users
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

  // 16. Create System Settings
  console.log('🔧 Creating system settings...')
  const settings = [
    { key: 'COMPANY_NAME', category: 'General', value: 'YPTI Manufacturing', type: 'string', description: 'Company name', isPublic: true },
    { key: 'WORK_HOURS_START', category: 'Operations', value: '08:00', type: 'string', description: 'Work start time', isPublic: true },
    { key: 'WORK_HOURS_END', category: 'Operations', value: '17:00', type: 'string', description: 'Work end time', isPublic: true },
    { key: 'QC_PASS_THRESHOLD', category: 'Quality', value: '95', type: 'number', description: 'QC pass threshold percentage', isPublic: false },
    { key: 'LOW_STOCK_ALERT', category: 'Inventory', value: '50', type: 'number', description: 'Low stock alert threshold', isPublic: false },
    { key: 'MAINTENANCE_INTERVAL', category: 'Maintenance', value: '30', type: 'number', description: 'Machine maintenance interval (days)', isPublic: false },
    { key: 'DEFAULT_CURRENCY', category: 'Inventory', value: 'IDR', type: 'string', description: 'Default currency for inventory', isPublic: true },
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
  console.log(`   - ${Object.keys(roles).length} Roles with ${PERMISSION_DEFINITIONS.length} Permissions`)
  console.log(`   - ${users.length} Users`)
  console.log(`   - ${machines.length} Machines`)
  console.log(`   - ${suppliers.length} Suppliers`)
  console.log(`   - ${inventoryItems.length} Inventory Items`)
  console.log(`   - 1 Default Order Workflow`)
  console.log(`   - 1 Recipe/BOM`)
  console.log(`   - 1 Sample Purchase Order`)
  console.log('\n🔐 Demo Login Credentials:')
  console.log('   - Admin: admin@ypti.com / demo123')
  console.log('   - PPIC: ppic@ypti.com / demo123')
  console.log('   - Manager: manager@ypti.com / demo123')
  console.log('   - Technician: tech1@ypti.com / demo123')
  console.log('   - Warehouse: warehouse@ypti.com / demo123')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
