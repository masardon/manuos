/**
 * ManuOS Unified Seed Script
 * 
 * Creates fully connected manufacturing data where ALL modules are linked:
 * - Orders → MOs → Jobsheets → Tasks (Production Hierarchy)
 * - Recipes → Ingredients → Inventory (BOM Linkage)
 * - Material Requirements → Inventory Reservations (MRP)
 * - Handoffs → Inventory Location Updates (Material Flow)
 * - Inventory Transactions → Full Audit Trail (Ledger)
 * - Production Outputs → Quality Control (QC Integration)
 * - Purchase Requests → Material Shortages (Procurement)
 * 
 * Run with: bun run db:seed
 */

import { PrismaClient } from '@prisma/client'
import { addDays, subDays } from 'date-fns'

const prisma = new PrismaClient()

// Constants
const TENANT_ID = 'tenant_ypti'
const BOARD_ID = 'board_main'

// ================================================================
// HELPER FUNCTIONS
// ================================================================

async function cleanup() {
  console.log('  🗑️  Cleaning up existing data...')
  
  // Delete in correct order (respecting foreign keys)
  const deleteOrder = [
    'inventoryTransaction',
    'inventoryReservation',
    'materialHandoffItem',
    'materialHandoff',
    'productionOutput',
    'qualityCheckItem',
    'reworkOrder',
    'qualityCheck',
    'taskDependency',
    'taskMaterialAllocation',
    'jobsheetMaterial',
    'materialRequirement',
    'purchaseRequestItem',
    'purchaseRequest',
    'vendorOrderItem',
    'vendorOrder',
    'recipeIngredient',
    'recipe',
    'inventory',
    'machiningTask',
    'jobsheet',
    'manufacturingOrder',
    'order',
    'workflowState',
    'workflowTransition',
    'workflow',
    'shelf',
    'breakdown',
    'machine',
    'supplier',
    'userSettings',
    'user',
    'role',
    'location',
    'board',
    'businessUnit',
    'systemSettings',
    'tenant',
  ] as const

  for (const model of deleteOrder) {
    try {
      await (prisma as any)[model].deleteMany()
    } catch (e) {
      // Model might not exist in schema, skip
    }
  }
  
  console.log('  ✅ Cleanup complete')
}

// ================================================================
// STEP 1: FOUNDATIONAL DATA
// ================================================================

async function createTenant() {
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
}

async function createBusinessUnit() {
  const bu = await prisma.businessUnit.upsert({
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
  
  await prisma.board.upsert({
    where: { tenantId_businessUnitId_code: { tenantId: TENANT_ID, businessUnitId: bu.id, code: 'PROD-BOARD' } },
    update: {},
    create: {
      id: BOARD_ID,
      tenantId: TENANT_ID,
      businessUnitId: bu.id,
      name: 'Production Board',
      code: 'PROD-BOARD',
      isActive: true,
    },
  })
  
  return bu
}

async function createRoles() {
  const roles = [
    { id: 'role-admin', code: 'ROLE_ADMIN', name: 'Admin' },
    { id: 'role-ppic', code: 'ROLE_PPIC', name: 'PPIC Staff' },
    { id: 'role-manager', code: 'ROLE_MANAGER', name: 'Production Manager' },
    { id: 'role-technician', code: 'ROLE_TECHNICIAN', name: 'Technician' },
    { id: 'role-warehouse', code: 'ROLE_WAREHOUSE', name: 'Warehouse Staff' },
    { id: 'role-marketing', code: 'ROLE_MARKETING', name: 'Marketing' },
    { id: 'role-drafter', code: 'ROLE_DRAFTER', name: 'Drafter' },
  ]
  
  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: {},
      create: { ...role, isSystem: false },
    })
  }
}

async function createUsers() {
  const users = [
    { id: 'user-admin', email: 'admin@ypti.com', name: 'Ahmad Hidayat', roleId: 'role-admin' },
    { id: 'user-ppic', email: 'ppic@ypti.com', name: 'Siti Nurhaliza', roleId: 'role-ppic' },
    { id: 'user-manager', email: 'manager@ypti.com', name: 'Budi Santoso', roleId: 'role-manager' },
    { id: 'user-tech1', email: 'tech1@ypti.com', name: 'Andi Wijaya', roleId: 'role-technician' },
    { id: 'user-tech2', email: 'tech2@ypti.com', name: 'Dewi Lestari', roleId: 'role-technician' },
    { id: 'user-warehouse', email: 'warehouse@ypti.com', name: 'Rudi Hermawan', roleId: 'role-warehouse' },
  ]
  
  for (const user of users) {
    await prisma.user.upsert({
      where: { tenantId_email: { tenantId: TENANT_ID, email: user.email } },
      update: {},
      create: {
        ...user,
        tenantId: TENANT_ID,
        phone: '+6281234567890',
        passwordHash: 'demo123',
        isActive: true,
      },
    })
  }
}

async function createLocations() {
  // Main locations with capacity (in pallets) and area (in m²)
  const locations = [
    { id: 'loc-wh', code: 'WH-01', name: 'Main Warehouse', type: 'WAREHOUSE', capacity: 500, area: 450, building: 'Building A', floor: 'Ground', zone: 'Storage' },
    { id: 'loc-ppic', code: 'PPIC-01', name: 'PPIC Rack', type: 'PPIC_RACK', capacity: 50, area: 25, building: 'Building A', floor: 'Ground', zone: 'Office' },
    { id: 'loc-prod', code: 'PROD-01', name: 'Production Floor', type: 'PRODUCTION_AREA', capacity: 200, area: 800, building: 'Building B', floor: 'Ground', zone: 'Production' },
    { id: 'loc-qc', code: 'QC-01', name: 'QC Area', type: 'QC_AREA', capacity: 30, area: 50, building: 'Building B', floor: 'Ground', zone: 'Quality' },
  ]
  
  const createdLocations: Record<string, string> = {}
  
  for (const loc of locations) {
    const location = await prisma.location.upsert({
      where: { tenantId_code: { tenantId: TENANT_ID, code: loc.code } },
      update: {
        capacity: loc.capacity,
        area: loc.area,
        building: loc.building,
        floor: loc.floor,
        zone: loc.zone,
      },
      create: {
        id: loc.id,
        tenantId: TENANT_ID,
        code: loc.code,
        name: loc.name,
        type: loc.type as any,
        capacity: loc.capacity,
        area: loc.area,
        building: loc.building,
        floor: loc.floor,
        zone: loc.zone,
        isActive: true,
      },
    })
    createdLocations[loc.code] = location.id
  }
  
  // Create shelves for warehouse with row, column, level info
  const warehouseId = createdLocations['WH-01']
  const shelves = [
    { code: 'A-01', name: 'Shelf A-01', row: 'A', column: '01', level: '1', capacity: 100 },
    { code: 'A-02', name: 'Shelf A-02', row: 'A', column: '02', level: '1', capacity: 100 },
    { code: 'B-01', name: 'Shelf B-01', row: 'B', column: '01', level: '1', capacity: 100 },
    { code: 'B-02', name: 'Shelf B-02', row: 'B', column: '02', level: '1', capacity: 100 },
  ]
  
  for (const shelf of shelves) {
    await prisma.shelf.upsert({
      where: { tenantId_locationId_code: { tenantId: TENANT_ID, locationId: warehouseId, code: shelf.code } },
      update: {
        row: shelf.row,
        column: shelf.column,
        level: shelf.level,
        capacity: shelf.capacity,
      },
      create: {
        tenantId: TENANT_ID,
        locationId: warehouseId,
        code: shelf.code,
        name: shelf.name,
        row: shelf.row,
        column: shelf.column,
        level: shelf.level,
        capacity: shelf.capacity,
      },
    })
  }
  
  // Create shelves for PPIC Rack
  const ppicId = createdLocations['PPIC-01']
  const ppicShelves = [
    { code: 'P-01', name: 'PPIC Shelf 01', row: 'P', column: '01', level: '1', capacity: 50 },
  ]
  
  for (const shelf of ppicShelves) {
    await prisma.shelf.upsert({
      where: { tenantId_locationId_code: { tenantId: TENANT_ID, locationId: ppicId, code: shelf.code } },
      update: {
        row: shelf.row,
        column: shelf.column,
        level: shelf.level,
        capacity: shelf.capacity,
      },
      create: {
        tenantId: TENANT_ID,
        locationId: ppicId,
        code: shelf.code,
        name: shelf.name,
        row: shelf.row,
        column: shelf.column,
        level: shelf.level,
        capacity: shelf.capacity,
      },
    })
  }
  
  return createdLocations
}

async function createMachines() {
  const machines = [
    { id: 'machine-cnc', code: 'CNC-001', name: 'CNC Milling Machine', type: 'CNC Milling' },
    { id: 'machine-lathe', code: 'LATHE-001', name: 'CNC Lathe', type: 'CNC Lathe' },
    { id: 'machine-weld', code: 'WELD-001', name: 'TIG Welding Station', type: 'Welding' },
    { id: 'machine-drill', code: 'DRILL-001', name: 'Drilling Machine', type: 'Drilling' },
    { id: 'machine-assembly', code: 'ASM-001', name: 'Assembly Station', type: 'Assembly' },
  ]
  
  for (const machine of machines) {
    await prisma.machine.upsert({
      where: { tenantId_code: { tenantId: TENANT_ID, code: machine.code } },
      update: {},
      create: {
        ...machine,
        tenantId: TENANT_ID,
        model: 'Standard Model',
        location: 'Workshop A',
        capacity: 8,
        status: 'IDLE' as any,
        isActive: true,
      },
    })
  }
}

async function createVendors() {
  const vendors = [
    { 
      id: 'vendor-steel', code: 'V-001', name: 'PT. Baja Sentosa', supplierType: 'MATERIAL',
      vendorTier: 'TIER_1', leadTimeDays: 7, qualityRating: 4.5, deliveryRating: 4.8, priceRating: 4.0,
      onTimeDelivery: 95, totalOrders: 45, capabilities: 'Steel plates, bars, coils',
      certifications: 'ISO 9001, ISO 14001', paymentTerms: 'Net 30', moq: 100
    },
    { 
      id: 'vendor-cnc', code: 'CM-BDG-001', name: 'CV. Bandung Precision Works', supplierType: 'CONTRACT_MANUFACTURER',
      vendorTier: 'TIER_1', leadTimeDays: 14, qualityRating: 4.8, deliveryRating: 4.5, priceRating: 4.2,
      onTimeDelivery: 92, totalOrders: 28, capabilities: 'CNC Milling, CNC Turning, EDM',
      certifications: 'ISO 9001, AS9100', paymentTerms: 'Net 45', moq: 1
    },
    { 
      id: 'vendor-anodize', code: 'V-003', name: 'PT. Anodize Jaya', supplierType: 'CONTRACT_MANUFACTURER',
      vendorTier: 'TIER_2', leadTimeDays: 5, qualityRating: 4.3, deliveryRating: 4.6, priceRating: 4.5,
      onTimeDelivery: 88, totalOrders: 15, capabilities: 'Anodizing, Surface Treatment',
      certifications: 'ISO 9001', paymentTerms: 'Net 30', moq: 10
    },
    { 
      id: 'vendor-powder', code: 'V-004', name: 'PT. Powder Coating Indonesia', supplierType: 'CONTRACT_MANUFACTURER',
      vendorTier: 'TIER_2', leadTimeDays: 3, qualityRating: 4.6, deliveryRating: 4.7, priceRating: 4.3,
      onTimeDelivery: 94, totalOrders: 22, capabilities: 'Powder Coating, Wet Painting',
      certifications: 'ISO 9001', paymentTerms: 'Net 30', moq: 5
    },
    { 
      id: 'vendor-plating', code: 'V-005', name: 'PT. Chrome Plating Nusantara', supplierType: 'CONTRACT_MANUFACTURER',
      vendorTier: 'TIER_3', leadTimeDays: 10, qualityRating: 4.2, deliveryRating: 4.0, priceRating: 4.6,
      onTimeDelivery: 85, totalOrders: 12, capabilities: 'Chrome Plating, Nickel Plating, Zinc Plating',
      certifications: 'ISO 9001, RoHS', paymentTerms: 'Net 30', moq: 20
    },
  ]
  
  for (const vendor of vendors) {
    await prisma.supplier.upsert({
      where: { tenantId_code: { tenantId: TENANT_ID, code: vendor.code } },
      update: {},
      create: {
        id: vendor.id,
        tenantId: TENANT_ID,
        code: vendor.code,
        name: vendor.name,
        supplierType: vendor.supplierType as any,
        vendorTier: vendor.vendorTier,
        leadTimeDays: vendor.leadTimeDays,
        qualityRating: vendor.qualityRating,
        deliveryRating: vendor.deliveryRating,
        priceRating: vendor.priceRating,
        onTimeDelivery: vendor.onTimeDelivery,
        totalOrders: vendor.totalOrders,
        capabilities: JSON.stringify(vendor.capabilities.split(', ')),
        certifications: vendor.certifications,
        paymentTerms: vendor.paymentTerms,
        moq: vendor.moq,
        contactPerson: `Contact ${vendor.name}`,
        email: `contact@${vendor.code.toLowerCase().replace(/-/g, '')}.co.id`,
        phone: '+62215551234',
        address: 'Jl. Industri No. 123',
        city: vendor.code === 'CM-BDG-001' ? 'Bandung' : 'Jakarta',
        country: 'Indonesia',
        currency: 'IDR',
        isActive: true,
      },
    })
  }
}

// ================================================================
// STEP 1C: WORKFLOWS
// ================================================================

async function createWorkflows() {
  // Create Manufacturing Order Workflow
  const moWorkflow = await prisma.workflow.upsert({
    where: { tenantId_code_entityType: { tenantId: TENANT_ID, code: 'MO_WORKFLOW', entityType: 'MO' } },
    update: {},
    create: {
      tenantId: TENANT_ID,
      code: 'MO_WORKFLOW',
      name: 'Manufacturing Order Workflow',
      description: 'Standard workflow for manufacturing orders',
      entityType: 'MO',
      isActive: true,
      isDefault: true,
      createdBy: 'user-admin',
    },
  })

  // Create Order Workflow
  const orderWorkflow = await prisma.workflow.upsert({
    where: { tenantId_code_entityType: { tenantId: TENANT_ID, code: 'ORDER_WORKFLOW', entityType: 'ORDER' } },
    update: {},
    create: {
      tenantId: TENANT_ID,
      code: 'ORDER_WORKFLOW',
      name: 'Order Workflow',
      description: 'Standard workflow for customer orders',
      entityType: 'ORDER',
      isActive: true,
      isDefault: true,
      createdBy: 'user-admin',
    },
  })

  return { moWorkflow, orderWorkflow }
}

// ================================================================
// STEP 2: INVENTORY (with realistic quantities)
// ================================================================

async function createInventory(locations: Record<string, string>) {
  const warehouseId = locations['WH-01']
  
  const items = [
    { id: 'inv-steel', partNumber: 'RM-STEEL-001', name: 'Steel Plate 10mm', quantity: 80, unit: 'pcs', category: 'Raw Material', reorderPoint: 20, reorderQuantity: 50 },
    { id: 'inv-bearing', partNumber: 'RM-BEARING-001', name: 'Ball Bearing 6205', quantity: 180, unit: 'pcs', category: 'Raw Material', reorderPoint: 50, reorderQuantity: 100 },
    { id: 'inv-aluminum', partNumber: 'RM-ALU-001', name: 'Aluminum Bar 50mm', quantity: 50, unit: 'kg', category: 'Raw Material', reorderPoint: 30, reorderQuantity: 100 },
    { id: 'inv-bolt', partNumber: 'RM-BOLT-001', name: 'M8 Bolt 20mm', quantity: 850, unit: 'pcs', category: 'Raw Material', reorderPoint: 200, reorderQuantity: 500 },
    { id: 'inv-bracket', partNumber: 'FG-BRACKET-001', name: 'Finished Bracket', quantity: 45, unit: 'pcs', category: 'Finished Good', reorderPoint: 10, reorderQuantity: 100 },
    { id: 'inv-cast', partNumber: 'MAT-007', name: 'Cast Iron Housing', quantity: 8, unit: 'pcs', category: 'Raw Material', reorderPoint: 10, reorderQuantity: 20 },
    { id: 'inv-bearing2', partNumber: 'MAT-008', name: 'Bearing 6205', quantity: 96, unit: 'pcs', category: 'Raw Material', reorderPoint: 20, reorderQuantity: 50 },
    { id: 'inv-gear', partNumber: 'MAT-009', name: 'Gear Shaft', quantity: 28, unit: 'pcs', category: 'Raw Material', reorderPoint: 10, reorderQuantity: 20 },
    { id: 'inv-seal', partNumber: 'MAT-010', name: 'Seal Ring', quantity: 196, unit: 'pcs', category: 'Raw Material', reorderPoint: 50, reorderQuantity: 100 },
  ]
  
  const created = []
  for (const item of items) {
    // Check if inventory exists
    const existing = await prisma.inventory.findFirst({
      where: { tenantId: TENANT_ID, partNumber: item.partNumber, batch: null }
    })
    
    let inv
    if (existing) {
      inv = await prisma.inventory.update({
        where: { id: existing.id },
        data: {
          quantity: item.quantity,
          availableQty: item.quantity,
          reorderPoint: item.reorderPoint,
          reorderQuantity: item.reorderQuantity,
        },
      })
    } else {
      inv = await prisma.inventory.create({
        data: {
          ...item,
          tenantId: TENANT_ID,
          locationId: warehouseId,
          status: 'AVAILABLE',
          availableQty: item.quantity,
          reservedQty: 0,
        },
      })
    }
    created.push(inv)
  }
  return created
}

// ================================================================
// STEP 3: RECIPES
// ================================================================

async function createRecipes(inventory: any[]) {
  // Create Recipe for Bracket (FG-BRACKET-001)
  const bracketRecipe = await prisma.recipe.upsert({
    where: { tenantId_code_version: { tenantId: TENANT_ID, code: 'ASM-BRACKET-001', version: '1.0' } },
    update: {},
    create: {
      tenantId: TENANT_ID,
      code: 'ASM-BRACKET-001',
      name: 'Bracket Assembly Recipe',
      description: 'Standard bracket assembly from steel plate',
      category: 'ASSEMBLY',
      outputPartNumber: 'FG-BRACKET-001',
      outputName: 'Finished Bracket',
      outputQuantity: 1,
      outputUnit: 'pcs',
      isActive: true,
      isApproved: true,
      approvedBy: 'user-admin',
      approvedAt: subDays(new Date(), 30),
      createdBy: 'user-ppic',
    },
  })

  // Create Recipe Ingredients for Bracket
  const steelInv = inventory.find(i => i.partNumber === 'RM-STEEL-001')
  const boltInv = inventory.find(i => i.partNumber === 'RM-BOLT-001')

  const bracketIngredients = [
    { partNumber: 'RM-STEEL-001', name: 'Steel Plate 10mm', quantity: 1, unit: 'pcs', inventoryId: steelInv?.id },
    { partNumber: 'RM-BOLT-001', name: 'M8 Bolt 20mm', quantity: 4, unit: 'pcs', inventoryId: boltInv?.id },
  ]

  for (const ingredient of bracketIngredients) {
    const existingIngredient = await prisma.recipeIngredient.findFirst({
      where: {
        tenantId: TENANT_ID,
        recipeId: bracketRecipe.id,
        partNumber: ingredient.partNumber,
      },
    })

          if (!existingIngredient) {
      await prisma.recipeIngredient.create({
        data: {
          tenantId: TENANT_ID,
          recipeId: bracketRecipe.id,
          inventoryId: ingredient.inventoryId,
          partNumber: ingredient.partNumber,
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          wastePercentage: 5,
        },
      })
    }
  }

  // Create Recipe for Gearbox (MAT-007 to MAT-010)
  const gearboxRecipe = await prisma.recipe.upsert({
    where: { tenantId_code_version: { tenantId: TENANT_ID, code: 'ASM-GEARBOX-001', version: '1.0' } },
    update: {},
    create: {
      tenantId: TENANT_ID,
      code: 'ASM-GEARBOX-001',
      name: 'Gearbox Sub-assembly Recipe',
      description: 'Gearbox housing and shaft assembly',
      category: 'SUB_ASSEMBLY',
      outputPartNumber: 'SUB-GEARBOX-001',
      outputName: 'Gearbox Sub-assembly',
      outputQuantity: 1,
      outputUnit: 'pcs',
      isActive: true,
      isApproved: true,
      approvedBy: 'user-admin',
      approvedAt: subDays(new Date(), 20),
      createdBy: 'user-ppic',
    },
  })

  // Create Recipe Ingredients for Gearbox
  const castInv = inventory.find(i => i.partNumber === 'MAT-007')
  const bearingInv = inventory.find(i => i.partNumber === 'MAT-008')
  const gearInv = inventory.find(i => i.partNumber === 'MAT-009')
  const sealInv = inventory.find(i => i.partNumber === 'MAT-010')

  const gearboxIngredients = [
    { partNumber: 'MAT-007', name: 'Cast Iron Housing', quantity: 1, unit: 'pcs', inventoryId: castInv?.id },
    { partNumber: 'MAT-008', name: 'Bearing 6205', quantity: 2, unit: 'pcs', inventoryId: bearingInv?.id },
    { partNumber: 'MAT-009', name: 'Gear Shaft', quantity: 1, unit: 'pcs', inventoryId: gearInv?.id },
    { partNumber: 'MAT-010', name: 'Seal Ring', quantity: 2, unit: 'pcs', inventoryId: sealInv?.id },
  ]

  for (const ingredient of gearboxIngredients) {
    const existingIngredient = await prisma.recipeIngredient.findFirst({
      where: {
        tenantId: TENANT_ID,
        recipeId: gearboxRecipe.id,
        partNumber: ingredient.partNumber,
      },
    })

      if (!existingIngredient) {
      await prisma.recipeIngredient.create({
        data: {
          tenantId: TENANT_ID,
          recipeId: gearboxRecipe.id,
          inventoryId: ingredient.inventoryId,
          partNumber: ingredient.partNumber,
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          wastePercentage: 3,
        },
      })
    }
  }

  return {
    bracket: bracketRecipe,
    gearbox: gearboxRecipe,
  }
}

// ================================================================
// STEP 4: ORDERS
// ================================================================

async function createOrders(recipes: any) {
  // Get board for manufacturing orders
  const board = await prisma.board.findFirst({
    where: { tenantId: TENANT_ID, code: 'PROD-BOARD' },
  })

  if (!board) {
    console.log('  ⚠️ Production board not found, skipping orders')
    return {}
  }

  // Get workflow for orders
  const workflow = await prisma.workflow.findFirst({
    where: { tenantId: TENANT_ID, code: 'MO_WORKFLOW' },
  })

  // Create Order 1: Yamaha Bracket (PRIORITY)
  const order1 = await prisma.order.upsert({
    where: { tenantId_orderNumber: { tenantId: TENANT_ID, orderNumber: 'ORD-2026-001' } },
    update: {},
    create: {
      tenantId: TENANT_ID,
      boardId: board.id,
      orderNumber: 'ORD-2026-001',
      customerName: 'PT Yamaha Motor Indonesia',
      customerEmail: 'procurement@yamaha-motor.co.id',
      customerPhone: '+62-21-5555-0001',
      workflowId: workflow?.id,
      status: 'IN_PRODUCTION',
      plannedStartDate: subDays(new Date(), 10),
      plannedEndDate: addDays(new Date(), 15),
      actualStartDate: subDays(new Date(), 10),
      progressPercent: 65,
      drawingUrl: '/drawings/bracket-001.pdf',
      notes: 'Urgent order for Yamaha motorcycle assembly line',
      createdBy: 'user-sales',
    },
  })

  // Create MO-001: Bracket Manufacturing
  const mo1 = await prisma.manufacturingOrder.upsert({
    where: { tenantId_orderId_moNumber: { tenantId: TENANT_ID, orderId: order1.id, moNumber: 'MO-2026-001' } },
    update: {},
    create: {
      tenantId: TENANT_ID,
      orderId: order1.id,
      moNumber: 'MO-2026-001',
      name: 'Bracket Manufacturing',
      description: 'Manufacture 50 bracket units for Yamaha order',
      type: 'MAIN',
      isOutsourced: false,
      status: 'IN_PROGRESS',
      plannedStartDate: subDays(new Date(), 8),
      plannedEndDate: addDays(new Date(), 10),
      actualStartDate: subDays(new Date(), 8),
      progressPercent: 70,
      recipeId: recipes.bracket.id,
      workflowId: workflow?.id,
      notes: 'High priority for Yamaha customer',
    },
  })

  // Create Jobsheet for MO-001
  const js1 = await prisma.jobsheet.upsert({
    where: { tenantId_moId_jsNumber: { tenantId: TENANT_ID, moId: mo1.id, jsNumber: 'JS-2026-001' } },
    update: {},
    create: {
      tenantId: TENANT_ID,
      moId: mo1.id,
      jsNumber: 'JS-2026-001',
      name: 'Bracket Cutting & Drilling',
      description: 'Cut steel plates and drill bolt holes for brackets',
      type: 'SINGLE_PART',
      preparedBy: 'user-ppic',
      checkedBy: 'user-qac',
      approvedBy: 'user-admin',
      status: 'IN_PROGRESS',
      plannedStartDate: subDays(new Date(), 7),
      plannedEndDate: addDays(new Date(), 8),
      actualStartDate: subDays(new Date(), 7),
      progressPercent: 75,
      notes: 'Cutting operation 80% complete',
    },
  })

  // Create Machining Task for JS-001
  const task1 = await prisma.machiningTask.upsert({
    where: { tenantId_jobsheetId_taskNumber: { tenantId: TENANT_ID, jobsheetId: js1.id, taskNumber: 'TSK-2026-001' } },
    update: {},
    create: {
      tenantId: TENANT_ID,
      jobsheetId: js1.id,
      taskNumber: 'TSK-2026-001',
      name: 'CNC Cutting - Steel Plate',
      description: 'Cut steel plates to 100x50mm dimensions',
      machineId: 'machine-cnc',
      status: 'RUNNING',
      plannedHours: 8,
      actualHours: 6,
      clockedInAt: subDays(new Date(), 6),
      assignedTo: 'user-tech1',
      progressPercent: 75,
      plannedStartDate: subDays(new Date(), 7),
      plannedEndDate: addDays(new Date(), 6),
      notes: 'Cutting 40 of 50 pieces completed',
    },
  })

  // Create Order 2: Honda Bracket (PENDING)
  const order2 = await prisma.order.upsert({
    where: { tenantId_orderNumber: { tenantId: TENANT_ID, orderNumber: 'ORD-2026-002' } },
    update: {},
    create: {
      tenantId: TENANT_ID,
      boardId: board.id,
      orderNumber: 'ORD-2026-002',
      customerName: 'PT Astra Honda Motor',
      customerEmail: 'supply-chain@ahm.co.id',
      customerPhone: '+62-21-6555-0002',
      workflowId: workflow?.id,
      status: 'MATERIAL_PREPARATION',
      plannedStartDate: addDays(new Date(), 5),
      plannedEndDate: addDays(new Date(), 20),
      progressPercent: 0,
      notes: 'Regular order for Honda motorcycle production',
      createdBy: 'user-sales',
    },
  })

  // Create MO-002: Gearbox Sub-assembly (Outsourced)
  const mo2 = await prisma.manufacturingOrder.upsert({
    where: { tenantId_orderId_moNumber: { tenantId: TENANT_ID, orderId: order2.id, moNumber: 'MO-2026-002' } },
    update: {},
    create: {
      tenantId: TENANT_ID,
      orderId: order2.id,
      moNumber: 'MO-2026-002',
      name: 'Gearbox Sub-assembly',
      description: 'Gearbox housing and shaft assembly - partially outsourced',
      type: 'MAIN',
      isOutsourced: true,
      outsourcedType: 'SUBCONTRACT',
      vendorId: 'vendor-cnc',
      status: 'PLANNED',
      plannedStartDate: addDays(new Date(), 5),
      plannedEndDate: addDays(new Date(), 18),
      progressPercent: 0,
      recipeId: recipes.gearbox.id,
      workflowId: workflow?.id,
      notes: 'CNC machining outsourced to CV. Bandung Precision Works',
    },
  })

  // Create Jobsheet for MO-002
  const js2 = await prisma.jobsheet.upsert({
    where: { tenantId_moId_jsNumber: { tenantId: TENANT_ID, moId: mo2.id, jsNumber: 'JS-2026-002' } },
    update: {},
    create: {
      tenantId: TENANT_ID,
      moId: mo2.id,
      jsNumber: 'JS-2026-002',
      name: 'Gearbox Assembly',
      description: 'Assemble gearbox sub-assembly from CNC machined parts',
      type: 'ASSEMBLY',
      preparedBy: 'user-ppic',
      status: 'PREPARING',
      plannedStartDate: addDays(new Date(), 15),
      plannedEndDate: addDays(new Date(), 18),
      notes: 'Wait for CNC parts from vendor',
    },
  })

  // Create Machining Task for JS-002
  const task2 = await prisma.machiningTask.upsert({
    where: { tenantId_jobsheetId_taskNumber: { tenantId: TENANT_ID, jobsheetId: js2.id, taskNumber: 'TSK-2026-002' } },
    update: {},
    create: {
      tenantId: TENANT_ID,
      jobsheetId: js2.id,
      taskNumber: 'TSK-2026-002',
      name: 'Gearbox Assembly',
      description: 'Assemble gearbox housing, bearings, shaft, and seals',
      machineId: 'machine-assembly',
      status: 'PENDING',
      plannedHours: 4,
      assignedTo: 'user-tech2',
      plannedStartDate: addDays(new Date(), 15),
      plannedEndDate: addDays(new Date(), 16),
      notes: 'Assembly after receiving CNC parts',
    },
  })

  // Create Jobsheet for MO-001 - COMPLETED jobsheet (JS-2026-003)
  const js3 = await prisma.jobsheet.upsert({
    where: { tenantId_moId_jsNumber: { tenantId: TENANT_ID, moId: mo1.id, jsNumber: 'JS-2026-003' } },
    update: {},
    create: {
      tenantId: TENANT_ID,
      moId: mo1.id,
      jsNumber: 'JS-2026-003',
      name: 'Bracket Finishing & Inspection',
      description: 'Deburring, surface finishing, and final inspection of brackets',
      type: 'QC_TEST',
      preparedBy: 'user-ppic',
      checkedBy: 'user-qac',
      approvedBy: 'user-admin',
      status: 'COMPLETED',
      plannedStartDate: subDays(new Date(), 3),
      plannedEndDate: subDays(new Date(), 1),
      actualStartDate: subDays(new Date(), 3),
      actualEndDate: subDays(new Date(), 1),
      progressPercent: 100,
      notes: 'All 45 brackets passed quality inspection',
    },
  })

  // Create Tasks for JS-2026-003 (all completed)
  const task3a = await prisma.machiningTask.upsert({
    where: { tenantId_jobsheetId_taskNumber: { tenantId: TENANT_ID, jobsheetId: js3.id, taskNumber: 'TSK-2026-003' } },
    update: {},
    create: {
      tenantId: TENANT_ID,
      jobsheetId: js3.id,
      taskNumber: 'TSK-2026-003',
      name: 'Deburring - Bracket Edges',
      description: 'Remove burrs and sharp edges from cut brackets',
      machineId: 'machine-drill',
      status: 'COMPLETED',
      plannedHours: 3,
      actualHours: 2.5,
      clockedInAt: subDays(new Date(), 3),
      clockedOutAt: subDays(new Date(), 2),
      assignedTo: 'user-tech2',
      progressPercent: 100,
      plannedStartDate: subDays(new Date(), 3),
      plannedEndDate: subDays(new Date(), 2),
      notes: 'All 45 brackets deburred successfully',
    },
  })

  const task3b = await prisma.machiningTask.upsert({
    where: { tenantId_jobsheetId_taskNumber: { tenantId: TENANT_ID, jobsheetId: js3.id, taskNumber: 'TSK-2026-004' } },
    update: {},
    create: {
      tenantId: TENANT_ID,
      jobsheetId: js3.id,
      taskNumber: 'TSK-2026-004',
      name: 'Surface Inspection & Measurement',
      description: 'Final dimensional inspection and surface quality check',
      status: 'COMPLETED',
      plannedHours: 2,
      actualHours: 1.5,
      clockedInAt: subDays(new Date(), 2),
      clockedOutAt: subDays(new Date(), 1),
      assignedTo: 'user-tech1',
      progressPercent: 100,
      plannedStartDate: subDays(new Date(), 2),
      plannedEndDate: subDays(new Date(), 1),
      notes: '42 passed, 3 sent to rework for dimensional issues',
    },
  })

  return {
    order1,
    order2,
    mo1,
    mo2,
    js1,
    js2,
    js3,
    task1,
    task2,
    task3a,
    task3b,
  }
}

// ================================================================
// STEP 5: MATERIAL REQUIREMENTS
// ================================================================

async function createMaterialRequirements(orders: any, inventory: any[]) {
  if (!orders.mo1 || !orders.mo2) {
    console.log('  ⚠️ MOs not found, skipping material requirements')
    return
  }

  // Material Requirements for MO-001 (Bracket)
  const mo1Requirements = [
    { partNumber: 'RM-STEEL-001', name: 'Steel Plate 10mm', requiredQty: 50, unit: 'pcs' },
    { partNumber: 'RM-BOLT-001', name: 'M8 Bolt 20mm', requiredQty: 200, unit: 'pcs' },
  ]

  for (const req of mo1Requirements) {
    const inv = inventory.find(i => i.partNumber === req.partNumber)
    
    const existingReq = await prisma.materialRequirement.findFirst({
      where: {
        tenantId: TENANT_ID,
        moId: orders.mo1.id,
        partNumber: req.partNumber,
      },
    })

    if (!existingReq) {
      await prisma.materialRequirement.create({
        data: {
          tenantId: TENANT_ID,
          moId: orders.mo1.id,
          partNumber: req.partNumber,
          name: req.name,
          requiredQty: req.requiredQty,
          reservedQty: req.partNumber === 'RM-STEEL-001' ? 50 : 200,
          status: 'RESERVED',
          priority: 1,
          requiredDate: subDays(new Date(), 5),
          unit: req.unit,
          inventoryId: inv?.id,
          createdBy: 'user-ppic',
        },
      })
    }
  }

  // Material Requirements for MO-002 (Gearbox)
  const mo2Requirements = [
    { partNumber: 'MAT-007', name: 'Cast Iron Housing', requiredQty: 20, unit: 'pcs' },
    { partNumber: 'MAT-008', name: 'Bearing 6205', requiredQty: 40, unit: 'pcs' },
    { partNumber: 'MAT-009', name: 'Gear Shaft', requiredQty: 20, unit: 'pcs' },
    { partNumber: 'MAT-010', name: 'Seal Ring', requiredQty: 40, unit: 'pcs' },
    { partNumber: 'RM-ALU-001', name: 'Aluminum Bar 50mm', requiredQty: 100, unit: 'kg' },
  ]

  for (const req of mo2Requirements) {
    const inv = inventory.find(i => i.partNumber === req.partNumber)
    
    const existingReq = await prisma.materialRequirement.findFirst({
      where: {
        tenantId: TENANT_ID,
        moId: orders.mo2.id,
        partNumber: req.partNumber,
      },
    })

    if (!existingReq) {
      await prisma.materialRequirement.create({
        data: {
          tenantId: TENANT_ID,
          moId: orders.mo2.id,
          partNumber: req.partNumber,
          name: req.name,
          requiredQty: req.requiredQty,
          reservedQty: req.partNumber === 'RM-ALU-001' ? 0 : req.requiredQty,
          requestedQty: req.partNumber === 'RM-ALU-001' ? 100 : 0,
          status: req.partNumber === 'RM-ALU-001' ? 'PURCHASE_REQUESTED' : 'RESERVED',
          priority: 2,
          requiredDate: addDays(new Date(), 3),
          unit: req.unit,
          inventoryId: inv?.id,
          createdBy: 'user-ppic',
        },
      })
    }
  }
}

// ================================================================
// STEP 4B: SUBCONTRACT ORDERS (outsourced processes)
// ================================================================

async function createSubcontractOrders() {
  // Get the existing MO-002 (Gearbox Sub-assembly)
  const mo2 = await prisma.manufacturingOrder.findFirst({
    where: { tenantId: TENANT_ID, moNumber: 'MO-2026-002' },
    include: { order: true }
  })
  
  if (!mo2) {
    console.log('  ⚠️ MO-002 not found, skipping subcontract orders')
    return {}
  }
  
  const order2 = mo2.order
  
  // Vendor Order for Gearbox (already in progress)
  await prisma.vendorOrder.upsert({
    where: { tenantId_vendorOrderId: { tenantId: TENANT_ID, vendorOrderId: 'VPO-2026-001' } },
    update: {},
    create: {
      id: 'vorder-001',
      tenantId: TENANT_ID,
      vendorOrderId: 'VPO-2026-001',
      vendorId: 'vendor-cnc',
      orderId: order2.id,
      moId: mo2.id,
      title: 'Gearbox Sub-assembly - Subcontract',
      description: 'Gearbox housing assembly outsourcing',
      vendorQuoteNumber: 'QT-CMBDG-001',
      outsourceType: 'SUBCONTRACT' as any,
      workDescription: 'CNC, Milling, Turning for gearbox housing',
      quantity: 1,
      unit: 'pcs',
      unitPrice: 24000000,
      totalPrice: 24000000,
      currency: 'IDR',
      paymentTerms: 'Net 30',
      orderDate: subDays(new Date(), 5),
      promisedDate: addDays(new Date(), 10),
      vendorLeadTimeDays: 14,
      status: 'IN_PROGRESS' as any,
      qualityRequired: true,
      notes: 'Outsourced to CV. Bandung Precision Works - CNC, MILLING, TURNING',
    },
  })
  
  // Vendor Order Items for Gearbox
  await prisma.vendorOrderItem.create({
    data: {
      id: 'vitem-001',
      tenantId: TENANT_ID,
      vendorOrderId: 'vorder-001',
      partNumber: 'FG-GEARBOX-001',
      name: 'Gearbox Housing Assembly',
      description: 'Gearbox Housing Assembly - Subcontracted',
      quantity: 1,
      unit: 'pcs',
      unitPrice: 24000000,
      totalPrice: 24000000,
      notes: 'Outsourced to CV. Bandung Precision Works',
    },
  })
  
  return {}
}

// ================================================================
// STEP 5B: INVENTORY RESERVATIONS
// ================================================================

async function createInventoryReservations(orders: any, inventory: any[]) {
  // Create reservations for MO-001 materials
  const reservations1 = [
    { partNumber: 'RM-STEEL-001', quantity: 80 },
    { partNumber: 'RM-BEARING-001', quantity: 50 },
    { partNumber: 'RM-BOLT-001', quantity: 150 },
  ]
  
  for (const res of reservations1) {
    const inv = inventory.find(i => i.partNumber === res.partNumber)
    if (inv) {
      await prisma.inventoryReservation.create({
        data: {
          tenantId: TENANT_ID,
          inventoryId: inv.id,
          moId: orders.mo1.id,
          quantity: res.quantity,
          status: 'ALLOCATED',
          notes: `Reserved for MO-2026-001`,
          createdBy: 'user-ppic',
        },
      })
    }
  }
  
  // Create reservations for MO-002 materials (only items with reservedQty > 0)
  const reservations2 = [
    { partNumber: 'MAT-007', quantity: 1 },
    { partNumber: 'MAT-008', quantity: 2 },
  ]
  
  for (const res of reservations2) {
    const inv = inventory.find(i => i.partNumber === res.partNumber)
    if (inv) {
      await prisma.inventoryReservation.create({
        data: {
          tenantId: TENANT_ID,
          inventoryId: inv.id,
          moId: orders.mo2.id,
          quantity: res.quantity,
          status: 'ALLOCATED',
          notes: `Reserved for MO-2026-002`,
          createdBy: 'user-ppic',
        },
      })
    }
  }
}

// ================================================================
// STEP 6: HANDOFFS (with inventory location updates)
// ================================================================

async function createHandoffs(orders: any, locations: Record<string, string>, inventory: any[]) {
  const warehouseId = locations['WH-01']
  const ppicId = locations['PPIC-01']
  const prodId = locations['PROD-01']
  
  // Handoff 1: Warehouse → PPIC Rack
  const handoff1 = await prisma.materialHandoff.upsert({
    where: { tenantId_handoffNumber: { tenantId: TENANT_ID, handoffNumber: 'HO-2026-001' } },
    update: {},
    create: {
      id: 'handoff-001',
      tenantId: TENANT_ID,
      handoffNumber: 'HO-2026-001',
      fromLocationId: warehouseId,
      toLocationId: ppicId,
      handedBy: 'user-warehouse',
      receivedBy: 'user-ppic',
      handoffType: 'STOCK_TRANSFER' as any,
      referenceType: 'MO',
      referenceId: orders.mo1.id,
      moId: orders.mo1.id,
      status: 'CONFIRMED' as any,
      requestedAt: subDays(new Date(), 6),
      handedAt: subDays(new Date(), 6),
      receivedAt: subDays(new Date(), 6),
    },
  })
  
  // Handoff items
  const handoffItems1 = [
    { partNumber: 'RM-STEEL-001', quantity: 50 },
    { partNumber: 'RM-BEARING-001', quantity: 25 },
  ]
  
  for (const item of handoffItems1) {
    const inv = inventory.find(i => i.partNumber === item.partNumber)
    if (inv) {
      await prisma.materialHandoffItem.create({
        data: {
          tenantId: TENANT_ID,
          handoffId: handoff1.id,
          inventoryId: inv.id,
          materialRequirementId: null,
          partNumber: item.partNumber,
          name: inv.name,
          quantity: item.quantity,
          unit: inv.unit,
          condition: 'GOOD' as any,
        },
      })
      
      // CRITICAL: Update inventory location to PPIC rack
      await prisma.inventory.update({
        where: { id: inv.id },
        data: { locationId: ppicId },
      })
      
      // Create transaction for the move
      await prisma.inventoryTransaction.create({
        data: {
          tenantId: TENANT_ID,
          inventoryId: inv.id,
          type: 'TRANSFER' as any,
          quantity: item.quantity,
          balance: (inv.quantity || 0) - item.quantity,
          fromLocation: warehouseId,
          toLocation: ppicId,
          referenceType: 'HANDOFF',
          referenceId: handoff1.id,
          notes: 'Moved to PPIC rack',
          createdBy: 'user-warehouse',
        },
      })
    }
  }
  
  // Handoff 2: PPIC Rack → Production Floor
  const handoff2 = await prisma.materialHandoff.upsert({
    where: { tenantId_handoffNumber: { tenantId: TENANT_ID, handoffNumber: 'HO-2026-002' } },
    update: {},
    create: {
      id: 'handoff-002',
      tenantId: TENANT_ID,
      handoffNumber: 'HO-2026-002',
      fromLocationId: ppicId,
      toLocationId: prodId,
      handedBy: 'user-ppic',
      receivedBy: 'user-tech1',
      handoffType: 'STOCK_TRANSFER' as any,
      referenceType: 'MO',
      referenceId: orders.mo1.id,
      moId: orders.mo1.id,
      status: 'CONFIRMED' as any,
      requestedAt: subDays(new Date(), 5),
      handedAt: subDays(new Date(), 5),
      receivedAt: subDays(new Date(), 5),
    },
  })
  
  const handoffItems2 = [
    { partNumber: 'RM-STEEL-001', quantity: 30 },
    { partNumber: 'RM-BEARING-001', quantity: 15 },
  ]
  
  for (const item of handoffItems2) {
    const inv = inventory.find(i => i.partNumber === item.partNumber)
    if (inv) {
      await prisma.materialHandoffItem.create({
        data: {
          tenantId: TENANT_ID,
          handoffId: handoff2.id,
          inventoryId: inv.id,
          partNumber: item.partNumber,
          name: inv.name,
          quantity: item.quantity,
          unit: inv.unit,
          condition: 'GOOD' as any,
        },
      })
      
      // CRITICAL: Update inventory location to production floor
      await prisma.inventory.update({
        where: { id: inv.id },
        data: { locationId: prodId },
      })
      
      await prisma.inventoryTransaction.create({
        data: {
          tenantId: TENANT_ID,
          inventoryId: inv.id,
          type: 'TRANSFER' as any,
          quantity: item.quantity,
          balance: (inv.quantity || 0) - item.quantity,
          fromLocation: ppicId,
          toLocation: prodId,
          referenceType: 'HANDOFF',
          referenceId: handoff2.id,
          notes: 'Issued to production floor',
          createdBy: 'user-ppic',
        },
      })
    }
  }
}

// ================================================================
// STEP 6B: JOBSHEET MATERIALS (material allocation to jobsheets)
// ================================================================

async function createJobsheetMaterials(orders: any, inventory: any[]) {
  // Get material requirements for MO-001
  const materialReqs = await prisma.materialRequirement.findMany({
    where: { tenantId: TENANT_ID, moId: orders.mo1.id }
  })
  
  // ============================================================
  // JS-2026-001: CNC Milling jobsheet (IN_PROGRESS)
  // ============================================================
  const js1 = await prisma.jobsheet.findFirst({
    where: { tenantId: TENANT_ID, jsNumber: 'JS-2026-001' }
  })
  
  if (js1) {
    const js1Allocations = [
      { partNumber: 'RM-STEEL-001', qty: 30, consumed: 12, wasted: 2, source: 'loc-wh', shelf: 'A-01', batch: 'B-2026-001' },
      { partNumber: 'RM-BEARING-001', qty: 15, consumed: 6, wasted: 1, source: 'loc-wh', shelf: 'A-02', batch: 'B-2026-002' },
    ]
    
    for (const alloc of js1Allocations) {
      const req = materialReqs.find(r => r.partNumber === alloc.partNumber)
      const inv = inventory.find(i => i.partNumber === alloc.partNumber)
      
      if (req && inv) {
        const existingJm = await prisma.jobsheetMaterial.findFirst({
          where: { tenantId: TENANT_ID, jobsheetId: js1.id, partNumber: alloc.partNumber }
        })
        
        let jm
        if (existingJm) {
          jm = existingJm
        } else {
          jm = await prisma.jobsheetMaterial.create({
            data: {
              id: `jm-js1-${alloc.partNumber.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
              tenantId: TENANT_ID,
              jobsheetId: js1.id,
              materialRequirementId: req.id,
              partNumber: alloc.partNumber,
              name: inv.name,
              description: `${inv.name} allocated for CNC cutting operation`,
              allocatedQty: alloc.qty,
              availableQty: alloc.qty - alloc.consumed - alloc.wasted,
              consumedQty: alloc.consumed,
              unit: inv.unit,
              sourceBatch: alloc.batch,
              sourceShelf: alloc.shelf,
              sourceLocation: alloc.source,
              status: 'IN_USE',
              notes: `CNC cutting in progress. ${alloc.consumed} consumed, ${alloc.wasted} wasted.`,
              allocatedBy: 'user-ppic',
            },
          })
        }
        
        // Create task allocation for task1
        const task1 = orders.task1
        if (task1) {
          const existingTma = await prisma.taskMaterialAllocation.findFirst({
            where: { tenantId: TENANT_ID, jobsheetMaterialId: jm.id, taskId: task1.id }
          })
          
          if (!existingTma) {
            await prisma.taskMaterialAllocation.create({
              data: {
                id: `tma-${jm.id}-task1`,
                tenantId: TENANT_ID,
                jobsheetMaterialId: jm.id,
                taskId: task1.id,
                allocatedQty: alloc.qty * 0.8,
                consumedQty: alloc.consumed,
                wastedQty: alloc.wasted,
                remainingQty: alloc.qty * 0.8 - alloc.consumed - alloc.wasted,
                unit: inv.unit,
              status: 'IN_USE',
                notes: `Task in progress - CNC cutting operation`,
              },
            })
          }
        }
      }
    }
  }
  
  // ============================================================
  // JS-2026-002: Gearbox Assembly jobsheet (PREPARING)
  // ============================================================
  const js2 = await prisma.jobsheet.findFirst({
    where: { tenantId: TENANT_ID, jsNumber: 'JS-2026-002' }
  })
  
  if (js2) {
    const js2Allocations = [
      { partNumber: 'RM-BOLT-001', qty: 50, consumed: 0, wasted: 0, source: 'loc-wh', shelf: 'B-01', batch: 'B-2026-003' },
    ]
    
    for (const alloc of js2Allocations) {
      const inv = inventory.find(i => i.partNumber === alloc.partNumber)
      const req = materialReqs.find(r => r.partNumber === alloc.partNumber) ||
                  await prisma.materialRequirement.findFirst({
                    where: { tenantId: TENANT_ID, moId: orders.mo2?.id, partNumber: alloc.partNumber }
                  })
      
      if (inv) {
        const existingJm = await prisma.jobsheetMaterial.findFirst({
          where: { tenantId: TENANT_ID, jobsheetId: js2.id, partNumber: alloc.partNumber }
        })
        
        if (!existingJm) {
          await prisma.jobsheetMaterial.create({
            data: {
              id: `jm-js2-${alloc.partNumber.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
              tenantId: TENANT_ID,
              jobsheetId: js2.id,
              materialRequirementId: req?.id,
              partNumber: alloc.partNumber,
              name: inv.name,
              description: `${inv.name} allocated for gearbox assembly`,
              allocatedQty: alloc.qty,
              availableQty: alloc.qty,
              consumedQty: 0,
              unit: inv.unit,
              sourceBatch: alloc.batch,
              sourceShelf: alloc.shelf,
              sourceLocation: alloc.source,
              status: 'ALLOCATED' as any,
              notes: 'Waiting for assembly operation to start',
              allocatedBy: 'user-ppic',
            },
          })
        }
      }
    }
  }
  
  // ============================================================
  // JS-2026-003: Bracket Finishing & Inspection (COMPLETED)
  // ============================================================
  const js3 = await prisma.jobsheet.findFirst({
    where: { tenantId: TENANT_ID, jsNumber: 'JS-2026-003' }
  })
  
  if (js3 && orders.task3a && orders.task3b) {
    // Materials consumed during finishing operations
    const js3Allocations = [
      { partNumber: 'RM-STEEL-001', qty: 20, consumed: 20, wasted: 0, source: 'loc-prod', shelf: 'WIP-01', batch: 'B-2026-001' },
      { partNumber: 'RM-BOLT-001', qty: 180, consumed: 168, wasted: 12, source: 'loc-prod', shelf: 'WIP-02', batch: 'B-2026-003' },
    ]
    
    for (const alloc of js3Allocations) {
      const req = materialReqs.find(r => r.partNumber === alloc.partNumber)
      const inv = inventory.find(i => i.partNumber === alloc.partNumber)
      
      if (req && inv) {
        const existingJm = await prisma.jobsheetMaterial.findFirst({
          where: { tenantId: TENANT_ID, jobsheetId: js3.id, partNumber: alloc.partNumber }
        })
        
        let jm
        if (existingJm) {
          jm = existingJm
        } else {
          jm = await prisma.jobsheetMaterial.create({
            data: {
              id: `jm-js3-${alloc.partNumber.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
              tenantId: TENANT_ID,
              jobsheetId: js3.id,
              materialRequirementId: req.id,
              partNumber: alloc.partNumber,
              name: inv.name,
              description: `${inv.name} used in deburring and finishing operation`,
              allocatedQty: alloc.qty,
              availableQty: 0,
              consumedQty: alloc.consumed,
              unit: inv.unit,
              sourceBatch: alloc.batch,
              sourceShelf: alloc.shelf,
              sourceLocation: alloc.source,
              status: 'CONSUMED' as any,
              notes: `All materials consumed. ${alloc.wasted} units wasted during finishing.`,
              allocatedBy: 'user-ppic',
              allocatedAt: subDays(new Date(), 4),
            },
          })
        }
        
        // Task allocations for completed tasks
        // Task3a: Deburring - consumed 60% of materials
        const existingTma3a = await prisma.taskMaterialAllocation.findFirst({
          where: { tenantId: TENANT_ID, jobsheetMaterialId: jm.id, taskId: orders.task3a.id }
        })
        
        if (!existingTma3a) {
          await prisma.taskMaterialAllocation.create({
            data: {
              id: `tma-${jm.id}-task3a`,
              tenantId: TENANT_ID,
              jobsheetMaterialId: jm.id,
              taskId: orders.task3a.id,
              allocatedQty: alloc.qty * 0.6,
              consumedQty: alloc.consumed * 0.6,
              wastedQty: alloc.wasted * 0.6,
              remainingQty: 0,
              unit: inv.unit,
              status: 'CONSUMED' as any,
              notes: 'Deburring operation completed - all allocated materials consumed',
            },
          })
        }
        
        // Task3b: Inspection - consumed 40% of materials
        const existingTma3b = await prisma.taskMaterialAllocation.findFirst({
          where: { tenantId: TENANT_ID, jobsheetMaterialId: jm.id, taskId: orders.task3b.id }
        })
        
        if (!existingTma3b) {
          await prisma.taskMaterialAllocation.create({
            data: {
              id: `tma-${jm.id}-task3b`,
              tenantId: TENANT_ID,
              jobsheetMaterialId: jm.id,
              taskId: orders.task3b.id,
              allocatedQty: alloc.qty * 0.4,
              consumedQty: alloc.consumed * 0.4,
              wastedQty: alloc.wasted * 0.4,
              remainingQty: 0,
              unit: inv.unit,
              status: 'CONSUMED' as any,
              notes: 'Inspection completed - materials consumed',
            },
          })
        }
        
        // Update inventory consumption for completed jobsheet
        const invItem = inventory.find(i => i.partNumber === alloc.partNumber)
        if (invItem) {
          await prisma.inventory.update({
            where: { id: invItem.id },
            data: {
              quantity: { decrement: alloc.consumed + alloc.wasted },
            },
          })
          
          // Create inventory transaction for consumption
          await prisma.inventoryTransaction.create({
            data: {
              tenantId: TENANT_ID,
              inventoryId: invItem.id,
              type: 'CONSUMPTION' as any,
              quantity: -(alloc.consumed + alloc.wasted),
              balance: invItem.quantity - alloc.consumed - alloc.wasted,
              fromLocation: alloc.source,
              toLocation: 'FINISHED_GOODS',
              referenceType: 'JOBSHEET',
              referenceId: js3.id,
              notes: `JS-2026-003 completed: ${alloc.consumed} consumed, ${alloc.wasted} wasted`,
              createdBy: 'user-tech2',
            },
          })
        }
      }
    }
  }
}

// ================================================================
// STEP 7: PRODUCTION OUTPUT
// ================================================================

async function createProductionOutput(orders: any) {
  const task1 = await prisma.machiningTask.findFirst({
    where: { tenantId: TENANT_ID, taskNumber: 'T-2026-001' }
  })
  
  if (task1) {
    await prisma.productionOutput.upsert({
      where: { tenantId_outputNumber: { tenantId: TENANT_ID, outputNumber: 'PO-2026-001' } },
      update: {},
      create: {
        tenantId: TENANT_ID,
        outputNumber: 'PO-2026-001',
        taskId: task1.id,
        jobsheetId: orders.js1.id,
        moId: orders.mo1.id,
        orderId: orders.order1.id,
        partNumber: 'FG-BRACKET-001',
        productName: 'Finished Bracket',
        plannedQty: 50,
        actualQty: 50,
        goodQty: 45,
        reworkQty: 3,
        scrapQty: 2,
        status: 'QC_PASSED' as any,
        qcPassed: true,
        qcCheckedAt: subDays(new Date(), 4),
        qcCheckedBy: 'user-tech1',
        createdBy: 'user-tech1',
        startedAt: subDays(new Date(), 7),
        completedAt: subDays(new Date(), 5),
      },
    })
  }
}

// ================================================================
// STEP 8: QUALITY CONTROL
// ================================================================

async function createQualityControl(orders: any) {
  const qc = await prisma.qualityCheck.upsert({
    where: { tenantId_qcNumber: { tenantId: TENANT_ID, qcNumber: 'QC-2026-001' } },
    update: {},
    create: {
      tenantId: TENANT_ID,
      qcNumber: 'QC-2026-001',
      referenceType: 'MO',
      referenceId: orders.mo1.id,
      moId: orders.mo1.id,
      orderId: orders.order1.id,
      checkType: 'IN_PROCESS' as any,
      inspectionStage: 'DURING_PRODUCTION',
      partNumber: 'FG-BRACKET-001',
      productName: 'Finished Bracket',
      quantity: 45,
      unit: 'pcs',
      status: 'PASSED' as any,
      passQuantity: 42,
      failQuantity: 3,
      reworkQuantity: 3,
      scrapQuantity: 0,
      inspectorId: 'user-tech1',
      inspectedAt: subDays(new Date(), 4),
      completedAt: subDays(new Date(), 4),
    },
  })
  
  // Rework order for failed items
  await prisma.reworkOrder.upsert({
    where: { tenantId_reworkNumber: { tenantId: TENANT_ID, reworkNumber: 'RW-2026-001' } },
    update: {},
    create: {
      tenantId: TENANT_ID,
      reworkNumber: 'RW-2026-001',
      qualityCheckId: qc.id,
      moId: orders.mo1.id,
      orderId: orders.order1.id,
      reworkType: 'REPAIR' as any,
      priority: 'MEDIUM',
      partNumber: 'FG-BRACKET-001',
      productName: 'Finished Bracket',
      quantity: 3,
      unit: 'pcs',
      defectCode: 'DF-001',
      defectDescription: 'Dimensional tolerance issue',
      status: 'IN_PROGRESS' as any,
      completionPercentage: 30,
      assignedToId: 'user-tech2',
    },
  })
}

// ================================================================
// STEP 9: PURCHASE REQUEST (for material shortage)
// ================================================================

async function createPurchaseRequest(orders: any, inventory: any[]) {
  const aluInv = inventory.find(i => i.partNumber === 'RM-ALU-001')
  
  // PR for aluminum shortage in MO-002
  const pr = await prisma.purchaseRequest.upsert({
    where: { tenantId_prNumber: { tenantId: TENANT_ID, prNumber: 'PR-2026-001' } },
    update: {},
    create: {
      tenantId: TENANT_ID,
      prNumber: 'PR-2026-001',
      title: 'Aluminum Bar for MO-2026-002',
      description: 'Material shortage for Yamaha order',
      status: 'SUBMITTED' as any,
      priority: 1,
      sourceType: 'AUTO_MO',
      sourceMoId: orders.mo2.id,
      requiredDate: addDays(new Date(), 5),
      totalItems: 1,
      estimatedAmount: 6000000,
      currency: 'IDR',
      createdBy: 'user-ppic',
      preparedBy: 'PPIC User',
      supplierId: 'vendor-steel',
    },
  })
  
  // PR Item
  const existingPrItem = await prisma.purchaseRequestItem.findFirst({
    where: {
      tenantId: TENANT_ID,
      purchaseRequestId: pr.id,
      partNumber: 'RM-ALU-001',
    },
  })
  
  if (existingPrItem) {
    await prisma.purchaseRequestItem.update({
      where: { id: existingPrItem.id },
      data: {
        quantity: 50,
        unitPrice: 120000,
        totalPrice: 6000000,
        unit: 'kg',
        supplierId: 'vendor-steel',
        status: 'ORDERED' as any,
      },
    })
  } else {
    await prisma.purchaseRequestItem.create({
      data: {
        tenantId: TENANT_ID,
        purchaseRequestId: pr.id,
        partNumber: 'RM-ALU-001',
        name: 'Aluminum Bar 50mm',
        quantity: 50,
        unitPrice: 120000,
        totalPrice: 6000000,
        unit: 'kg',
        supplierId: 'vendor-steel',
        status: 'ORDERED' as any,
      },
    })
  }
}

// ================================================================
// STEP 10: BREAKDOWN (active, affecting production)
// ================================================================

async function createBreakdown(orders: any) {
  // Get the CNC machine (has an active task TSK-2026-001)
  const cncMachine = await prisma.machine.findFirst({
    where: { tenantId: TENANT_ID, code: 'CNC-001' },
  })

  if (!cncMachine) {
    console.log('  ⚠️ CNC machine not found, skipping breakdown')
    return
  }

  // Get the active task on CNC machine
  const activeTask = await prisma.machiningTask.findFirst({
    where: {
      tenantId: TENANT_ID,
      machineId: cncMachine.id,
      status: 'RUNNING',
    },
  })

  // Create an active breakdown with estimated recovery
  const breakdown = await prisma.breakdown.create({
    data: {
      tenantId: TENANT_ID,
      machineId: cncMachine.id,
      reportedBy: 'user-tech1',
      type: 'MECHANICAL',
      description: 'CNC spindle bearing failure - unusual vibration detected during cutting operation',
      notes: 'Replacement bearing ordered from supplier, expected delivery tomorrow',
      estimatedRecoveryDate: addDays(new Date(), 2),
      resolved: false,
      affectedTaskId: activeTask?.id || null,
    },
  })

  // Update machine status to DOWN
  await prisma.machine.update({
    where: { id: cncMachine.id },
    data: {
      status: 'DOWN',
      notes: 'BREAKDOWN: CNC spindle bearing failure',
    },
  })

  // Pause the active task and link to breakdown
  if (activeTask) {
    await prisma.machiningTask.update({
      where: { id: activeTask.id },
      data: {
        status: 'PAUSED',
        breakdownAt: new Date(),
        breakdownNote: 'CNC spindle bearing failure - machine DOWN',
        breakdownId: breakdown.id,
        estimatedRecoveryDate: addDays(new Date(), 2),
        // Extend planned end date by 2 days
        plannedEndDate: activeTask.plannedEndDate
          ? addDays(new Date(activeTask.plannedEndDate), 2)
          : addDays(new Date(), 5),
      },
    })
  }

  console.log(`  ⚠️ Active breakdown on ${cncMachine.code}: ${breakdown.description}`)
  if (activeTask) {
    console.log(`  ⏸️ Task ${activeTask.taskNumber} paused due to breakdown`)
  }
}

// ================================================================
// STEP 11: SYSTEM SETTINGS
// ================================================================

async function createSettings() {
  const settings = [
    { key: 'COMPANY_NAME', category: 'General', value: 'YPTI Manufacturing', type: 'string', description: 'Company name' },
    { key: 'LOW_STOCK_THRESHOLD', category: 'Inventory', value: '10', type: 'number', description: 'Low stock threshold' },
  ]
  
  for (const setting of settings) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      update: {},
      create: { ...setting, isPublic: true },
    })
  }
  
  // User settings
  const users = await prisma.user.findMany({ where: { tenantId: TENANT_ID } })
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
        defaultView: 'dashboard',
        showInactiveMachines: false,
        showCompletedTasks: true,
        rowsPerPage: 25,
      },
    })
  }
}

// ================================================================
// MAIN SEED FUNCTION
// ================================================================

async function main() {
  console.log('🌱 Starting ManuOS Unified Seed...\n')
  console.log('='.repeat(60))
  
  try {
    // Cleanup existing data
    await cleanup()
    
    // Step 1: Foundational data
    console.log('\n📦 Step 1: Creating foundational data...')
    await createTenant()
    const bu = await createBusinessUnit()
    await createRoles()
    await createUsers()
    const locations = await createLocations()
    await createMachines()
    await createVendors()
    await createWorkflows()
    console.log('  ✅ Foundational data created')
    
    // Step 2: Inventory
    console.log('\n📦 Step 2: Creating inventory...')
    const inventory = await createInventory(locations)
    console.log('  ✅ Inventory created with quantities')
    
    // Step 3: Recipes
    console.log('\n📦 Step 3: Creating recipes...')
    const recipes = await createRecipes(inventory)
    console.log('  ✅ Recipes created with inventory linkage')
    
    // Step 4: Orders
    console.log('\n📦 Step 4: Creating orders...')
    const orders = await createOrders(recipes)
    console.log('  ✅ Orders created with hierarchy')
    
    // Step 4B: Subcontract Orders
    console.log('\n📦 Step 4B: Creating subcontract orders...')
    await createSubcontractOrders()
    console.log('  ✅ Subcontract orders created with vendor orders')
    
    // Step 5: Material Requirements
    console.log('\n📦 Step 5: Creating material requirements...')
    await createMaterialRequirements(orders, inventory)
    console.log('  ✅ Material requirements created with inventory reservations')
    
    // Step 5B: Inventory Reservations
    console.log('\n📦 Step 5B: creating inventory reservations...')
    await createInventoryReservations(orders, inventory)
    console.log('  ✅ Inventory reservations created')
    
    // Step 6: Handoffs
    console.log('\n📦 Step 6: creating handoffs...')
    await createHandoffs(orders, locations, inventory)
    console.log('  ✅ Handoffs created with inventory location updates')
    
    // Step 6B: Jobsheet Materials
    console.log('\n📦 Step 6B: creating jobsheet materials...')
    await createJobsheetMaterials(orders, inventory)
    console.log('  ✅ Jobsheet materials created with task allocations')
    
    // Step 7: Production Output
    console.log('\n📦 Step 7: Creating production output...')
    await createProductionOutput(orders)
    console.log('  ✅ Production output created')
    
    // Step 8: Quality Control
    console.log('\n📦 Step 8: Creating quality control...')
    await createQualityControl(orders)
    console.log('  ✅ Quality control created with rework order')
    
    // Step 9: Purchase Request
    console.log('\n📦 Step 9: Creating purchase request...')
    await createPurchaseRequest(orders, inventory)
    console.log('  ✅ Purchase request created')
    
    // Step 10: Breakdown (active, affecting CNC machine)
    console.log('\n📦 Step 10: Creating sample breakdown...')
    await createBreakdown(orders)
    console.log('  ✅ Breakdown created with affected tasks')
    
    // Step 11: Settings
    console.log('\n📦 Step 11: Creating settings...')
    await createSettings()
    console.log('  ✅ Settings created')
    
    // Print summary
    console.log('\n' + '='.repeat(60))
    console.log('✅ SEED COMPLETED SUCCESSFULLY!')
    console.log('='.repeat(60))
    
    // Verify data
    console.log('\n📊 Data Summary:')
    console.log(`   Orders: ${await prisma.order.count()}`)
    console.log(`   Manufacturing Orders: ${await prisma.manufacturingOrder.count()}`)
    console.log(`   Jobsheets: ${await prisma.jobsheet.count()}`)
    console.log(`   Tasks: ${await prisma.machiningTask.count()}`)
    console.log(`   Recipes: ${await prisma.recipe.count()}`)
    console.log(`   Recipe Ingredients: ${await prisma.recipeIngredient.count()}`)
    console.log(`   Inventory Items: ${await prisma.inventory.count()}`)
    console.log(`   Material Requirements: ${await prisma.materialRequirement.count()}`)
    console.log(`   Handoffs: ${await prisma.materialHandoff.count()}`)
    console.log(`   Handoff Items: ${await prisma.materialHandoffItem.count()}`)
    console.log(`   Inventory Transactions: ${await prisma.inventoryTransaction.count()}`)
    console.log(`   Production Outputs: ${await prisma.productionOutput.count()}`)
    console.log(`   Quality Checks: ${await prisma.qualityCheck.count()}`)
    console.log(`   Rework Orders: ${await prisma.reworkOrder.count()}`)
    console.log(`   Purchase Requests: ${await prisma.purchaseRequest.count()}`)
    console.log(`   Vendor Orders: ${await prisma.vendorOrder.count()}`)
    console.log(`   Vendor Order Items: ${await prisma.vendorOrderItem.count()}`)
    console.log(`   Suppliers/Vendors: ${await prisma.supplier.count()}`)
    console.log(`   Breakdowns: ${await prisma.breakdown.count()}`)
    
    console.log('\n🔐 Demo Login Credentials:')
    console.log('   Admin:      admin@ypti.com / demo123')
    console.log('   PPIC:       ppic@ypti.com / demo123')
    console.log('   Manager:    manager@ypti.com / demo123')
    console.log('   Technician: tech1@ypti.com / demo123')
    console.log('   Warehouse:  warehouse@ypti.com / demo123')
    
  } catch (error) {
    console.error('❌ Seed failed:', error)
    throw error
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })
