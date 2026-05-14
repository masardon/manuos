/**
 * COMPREHENSIVE MANUFACTURING SEED DATA
 * 
 * This seed creates realistic manufacturing scenarios with:
 * 1. Complete order → MO → Jobsheet → Task hierarchy
 * 2. Recipes/BOMs with material requirements
 * 3. MRP flow: Material Planning → Reservation → Purchase Request
 * 4. Material handoffs: Warehouse → PPIC → Production
 * 5. Vendor management and outsourcing
 * 6. Quality control workflows
 * 7. Machine breakdowns and maintenance
 * 8. Purchase requests and Odoo sync simulation
 * 
 * Run with: bun run db:seed-clean && bun run db:seed-comprehensive
 */

import { PrismaClient, OrderStatus, MOStatus, JobsheetStatus, TaskStatus, MachineStatus } from '@prisma/client'
import { addDays, subDays, addHours, subHours } from 'date-fns'

const prisma = new PrismaClient()
const TENANT_ID = 'tenant_ypti'
const BOARD_ID = 'board_main'

async function main() {
  console.log('🚀 Starting COMPREHENSIVE Manufacturing Seed...\n')
  console.log('=====================================================\n')

  // 0. CREATE USERS (required for handoffs and assignments)
  console.log('👥 Creating Users...')
  await createUsers()

  // 1. CREATE LOCATIONS (for material handoffs)
  console.log('\n📍 Creating Locations...')
  const locations = await createLocations()

  // 2. CREATE RECIPES/BOMs
  console.log('\n📋 Creating Recipes/BOMs...')
  const recipes = await createRecipes()

  // 3. CREATE INVENTORY (with realistic stock levels)
  console.log('\n📦 Creating Inventory...')
  const inventory = await createInventory()

  // 4. CREATE VENDORS
  console.log('\n🏭 Creating Vendors...')
  const vendors = await createVendors()

  // 5. CREATE MACHINES (with status variations)
  console.log('\n🔧 Creating Machines...')
  const machines = await createMachines()

  // 6. CREATE COMPREHENSIVE ORDER FLOW
  console.log('\n🛒 Creating Order Flow...')
  const orders = await createOrderFlow()

  // 7. CREATE MATERIAL REQUIREMENTS & MRP FLOW
  console.log('\n📊 Creating Material Requirements...')
  await createMaterialRequirements()

  // 8. CREATE PURCHASE REQUESTS (for materials out of stock)
  console.log('\n🛍️  Creating Purchase Requests...')
  await createPurchaseRequests()

  // 9. CREATE MATERIAL HANDOFFS
  console.log('\n🔄 Creating Material Handoffs...')
  await createMaterialHandoffs()

  // 10. CREATE QUALITY CONTROL SCENARIOS
  console.log('\n🔍 Creating Quality Control...')
  await createQualityControl()

  // 11. CREATE MACHINE BREAKDOWNS
  console.log('\n⚠️  Creating Machine Breakdowns...')
  await createMachineBreakdowns()

  // 12. CREATE SYSTEM SETTINGS
  console.log('\n⚙️  Creating System Settings...')
  await createSystemSettings()

  // 13. CREATE USER SETTINGS
  console.log('\n👤 Creating User Settings...')
  await createUserSettings()

  console.log('\n=====================================================')
  console.log('✅ COMPREHENSIVE SEED COMPLETED SUCCESSFULLY!')
  console.log('=====================================================\n')
  
  await printSummary()
}

async function createUsers() {
  // Create roles first
  const roles = {
    ROLE_ADMIN: await prisma.role.upsert({
      where: { code: 'ROLE_ADMIN' },
      update: {},
      create: { id: 'role-admin', name: 'Admin', code: 'ROLE_ADMIN', isSystem: false },
    }),
    ROLE_PPIC: await prisma.role.upsert({
      where: { code: 'ROLE_PPIC' },
      update: {},
      create: { id: 'role-ppic', name: 'PPIC Staff', code: 'ROLE_PPIC', isSystem: false },
    }),
    ROLE_MANAGER: await prisma.role.upsert({
      where: { code: 'ROLE_MANAGER' },
      update: {},
      create: { id: 'role-manager', name: 'Production Manager', code: 'ROLE_MANAGER', isSystem: false },
    }),
    ROLE_TECHNICIAN: await prisma.role.upsert({
      where: { code: 'ROLE_TECHNICIAN' },
      update: {},
      create: { id: 'role-technician', name: 'Technician', code: 'ROLE_TECHNICIAN', isSystem: false },
    }),
    ROLE_WAREHOUSE: await prisma.role.upsert({
      where: { code: 'ROLE_WAREHOUSE' },
      update: {},
      create: { id: 'role-warehouse', name: 'Warehouse Staff', code: 'ROLE_WAREHOUSE', isSystem: false },
    }),
  }

  const DEMO_PASSWORD = 'demo123'

  // Create users
  const users = [
    { id: 'user-admin', email: 'admin@ypti.com', name: 'Ahmad Hidayat', roleId: roles.ROLE_ADMIN.id, employeeId: 'EMP-001' },
    { id: 'user-ppic', email: 'ppic@ypti.com', name: 'Siti Nurhaliza', roleId: roles.ROLE_PPIC.id, employeeId: 'EMP-002' },
    { id: 'user-manager', email: 'manager@ypti.com', name: 'Budi Santoso', roleId: roles.ROLE_MANAGER.id, employeeId: 'EMP-003' },
    { id: 'user-tech1', email: 'tech1@ypti.com', name: 'Andi Wijaya', roleId: roles.ROLE_TECHNICIAN.id, employeeId: 'EMP-004' },
    { id: 'user-tech2', email: 'tech2@ypti.com', name: 'Dewi Lestari', roleId: roles.ROLE_TECHNICIAN.id, employeeId: 'EMP-005' },
    { id: 'user-warehouse', email: 'warehouse@ypti.com', name: 'Rudi Hermawan', roleId: roles.ROLE_WAREHOUSE.id, employeeId: 'EMP-006' },
  ]

  for (const userData of users) {
    await prisma.user.upsert({
      where: { tenantId_email: { tenantId: TENANT_ID, email: userData.email } },
      update: {},
      create: {
        ...userData,
        tenantId: TENANT_ID,
        phone: '+6281234567890',
        passwordHash: DEMO_PASSWORD,
        isActive: true,
      },
    })
  }

  console.log(`   ✅ Created ${users.length} users`)
  return users
}

async function createLocations() {
  const locationData = [
    { code: 'WH-01', name: 'Main Warehouse', type: 'WAREHOUSE', description: 'Raw materials storage' },
    { code: 'WH-02', name: 'Warehouse B', type: 'WAREHOUSE', description: 'Finished goods storage' },
    { code: 'PPIC-01', name: 'PPIC Rack', type: 'PPIC_RACK', description: 'Material preparation area' },
    { code: 'PROD-01', name: 'Production Floor', type: 'PRODUCTION_AREA', description: 'Main production area' },
    { code: 'WS-A1', name: 'CNC Milling Station', type: 'WORKSTATION', description: 'HAAS VF-2 workstation' },
    { code: 'WS-A2', name: 'CNC Lathe Station', type: 'WORKSTATION', description: 'HAAS ST-20 workstation' },
    { code: 'WS-B1', name: 'Conventional Workshop', type: 'WORKSTATION', description: 'Manual machining area' },
    { code: 'WS-C1', name: 'Welding Station', type: 'WORKSTATION', description: 'TIG/MIG welding area' },
    { code: 'QC-01', name: 'QC Inspection Area', type: 'QC_AREA', description: 'Quality control lab' },
    { code: 'SHIP-01', name: 'Shipping Dock', type: 'SHIPPING', description: 'Outbound logistics' },
    { code: 'RECV-01', name: 'Receiving Dock', type: 'RECEIVING', description: 'Inbound materials' },
    { code: 'TOOL-01', name: 'Tool Crib', type: 'TOOL_CRIB', description: 'Tools and consumables' },
  ]

  const createdLocations = []
  for (const loc of locationData) {
    const location = await prisma.location.upsert({
      where: { tenantId_code: { tenantId: TENANT_ID, code: loc.code } },
      update: {},
      create: {
        tenantId: TENANT_ID,
        ...loc,
        isActive: true,
      },
    })
    createdLocations.push(location)
  }

  // Create shelves for warehouse
  const warehouse = createdLocations.find(l => l.code === 'WH-01')
  if (warehouse) {
    const shelfCodes = ['A-01', 'A-02', 'A-03', 'B-01', 'B-02', 'B-03', 'C-01', 'C-02', 'C-03', 'D-01', 'D-02', 'E-01']
    for (const code of shelfCodes) {
      await prisma.shelf.upsert({
        where: { tenantId_locationId_code: { tenantId: TENANT_ID, locationId: warehouse.id, code } },
        update: {},
        create: {
          tenantId: TENANT_ID,
          locationId: warehouse.id,
          code,
          name: `Shelf ${code}`,
          capacity: 50,
        },
      })
    }
  }

  // Create shelves for PPIC rack
  const ppicRack = createdLocations.find(l => l.code === 'PPIC-01')
  if (ppicRack) {
    const shelfCodes = ['PPIC-A1', 'PPIC-A2', 'PPIC-B1', 'PPIC-B2', 'PPIC-C1']
    for (const code of shelfCodes) {
      await prisma.shelf.upsert({
        where: { tenantId_locationId_code: { tenantId: TENANT_ID, locationId: ppicRack.id, code } },
        update: {},
        create: {
          tenantId: TENANT_ID,
          locationId: ppicRack.id,
          code,
          name: `PPIC Rack ${code}`,
          capacity: 30,
        },
      })
    }
  }

  console.log(`   ✅ Created ${createdLocations.length} locations with shelves`)
  return createdLocations
}

async function createRecipes() {
  // Recipe 1: Bearing Assembly (Finished Good)
  const bearingRecipe = await prisma.recipe.upsert({
    where: { tenantId_code_version: { tenantId: TENANT_ID, code: 'RCP-BRG-001', version: '1.0' } },
    update: {},
    create: {
      tenantId: TENANT_ID,
      code: 'RCP-BRG-001',
      name: 'Bearing Assembly XYZ-200',
      description: 'Standard bearing assembly with housing for automotive applications',
      outputPartNumber: 'FG-BRG-XYZ-200',
      outputName: 'Bearing Assembly XYZ-200',
      outputQuantity: 1,
      outputUnit: 'pcs',
      isActive: true,
      isApproved: true,
      approvedBy: 'user-admin',
      approvedAt: new Date('2025-01-15'),
    },
  })

  const bearingIngredients = [
    { partNumber: 'RM-STL-001', name: 'Steel Bearing Ring 50mm', quantity: 2, unit: 'pcs', isCritical: true, wastePercentage: 2 },
    { partNumber: 'RM-BRG-001', name: 'Ball Bearing Insert 6205', quantity: 1, unit: 'pcs', isCritical: true, wastePercentage: 0 },
    { partNumber: 'RM-GRS-001', name: 'Lithium Grease', quantity: 0.1, unit: 'kg', isCritical: false, wastePercentage: 5 },
    { partNumber: 'RM-SEL-001', name: 'Rubber Seal 50mm', quantity: 2, unit: 'pcs', isCritical: false, wastePercentage: 1 },
    { partNumber: 'RM-HSG-001', name: 'Housing Casting', quantity: 1, unit: 'pcs', isCritical: true, wastePercentage: 0 },
  ]

  for (const ing of bearingIngredients) {
    const inv = await prisma.inventory.findFirst({ where: { tenantId: TENANT_ID, partNumber: ing.partNumber } })
    
    const existing = await prisma.recipeIngredient.findFirst({
      where: {
        tenantId: TENANT_ID,
        recipeId: bearingRecipe.id,
        partNumber: ing.partNumber,
      }
    })
    
    if (existing) {
      await prisma.recipeIngredient.update({
        where: { id: existing.id },
        data: {
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          isCritical: ing.isCritical,
          wastePercentage: ing.wastePercentage,
          mixOrder: bearingIngredients.indexOf(ing) + 1,
        }
      })
    } else {
      await prisma.recipeIngredient.create({
        data: {
          tenantId: TENANT_ID,
          recipeId: bearingRecipe.id,
          inventoryId: inv?.id,
          partNumber: ing.partNumber,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          isCritical: ing.isCritical,
          wastePercentage: ing.wastePercentage,
          mixOrder: bearingIngredients.indexOf(ing) + 1,
        },
      })
    }
  }

  // Recipe 2: Aluminum Bracket Assembly
  const bracketRecipe = await prisma.recipe.upsert({
    where: { tenantId_code_version: { tenantId: TENANT_ID, code: 'RCP-BRK-001', version: '1.0' } },
    update: {},
    create: {
      tenantId: TENANT_ID,
      code: 'RCP-BRK-001',
      name: 'Aluminum Bracket Assembly',
      description: 'CNC machined aluminum bracket with fasteners',
      outputPartNumber: 'FG-BRK-ALU-100',
      outputName: 'Aluminum Bracket Assembly',
      outputQuantity: 1,
      outputUnit: 'pcs',
      isActive: true,
      isApproved: true,
      approvedBy: 'user-admin',
      approvedAt: new Date('2025-01-20'),
    },
  })

  const bracketIngredients = [
    { partNumber: 'RM-ALU-001', name: 'Aluminum Bar 50mm', quantity: 0.5, unit: 'kg', isCritical: true, wastePercentage: 15 },
    { partNumber: 'RM-BLT-001', name: 'M8 Bolt 20mm', quantity: 4, unit: 'pcs', isCritical: false, wastePercentage: 2 },
    { partNumber: 'RM-NUT-001', name: 'M8 Nut', quantity: 4, unit: 'pcs', isCritical: false, wastePercentage: 1 },
    { partNumber: 'RM-WSH-001', name: 'M8 Washer', quantity: 8, unit: 'pcs', isCritical: false, wastePercentage: 1 },
  ]

  for (const ing of bracketIngredients) {
    const inv = await prisma.inventory.findFirst({ where: { tenantId: TENANT_ID, partNumber: ing.partNumber } })
    
    const existing = await prisma.recipeIngredient.findFirst({
      where: {
        tenantId: TENANT_ID,
        recipeId: bracketRecipe.id,
        partNumber: ing.partNumber,
      }
    })
    
    if (existing) {
      await prisma.recipeIngredient.update({
        where: { id: existing.id },
        data: {
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          isCritical: ing.isCritical,
          wastePercentage: ing.wastePercentage,
          mixOrder: bracketIngredients.indexOf(ing) + 1,
        }
      })
    } else {
      await prisma.recipeIngredient.create({
        data: {
          tenantId: TENANT_ID,
          recipeId: bracketRecipe.id,
          inventoryId: inv?.id,
          partNumber: ing.partNumber,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          isCritical: ing.isCritical,
          wastePercentage: ing.wastePercentage,
          mixOrder: bracketIngredients.indexOf(ing) + 1,
        },
      })
    }
  }

  // Recipe 3: Engine Mount (Outsourced components)
  const engineMountRecipe = await prisma.recipe.upsert({
    where: { tenantId_code_version: { tenantId: TENANT_ID, code: 'RCP-EMT-001', version: '1.0' } },
    update: {},
    create: {
      tenantId: TENANT_ID,
      code: 'RCP-EMT-001',
      name: 'Engine Mount Assembly',
      description: 'Engine mounting bracket with vibration dampers',
      outputPartNumber: 'FG-EMT-001',
      outputName: 'Engine Mount Assembly',
      outputQuantity: 1,
      outputUnit: 'set',
      isActive: true,
      isApproved: true,
    },
  })

  const engineMountIngredients = [
    { partNumber: 'RM-STL-002', name: 'Steel Plate 10mm', quantity: 2, unit: 'pcs', isCritical: true, wastePercentage: 5 },
    { partNumber: 'RM-RUB-001', name: 'Rubber Damper', quantity: 4, unit: 'pcs', isCritical: true, wastePercentage: 0 },
    { partNumber: 'RM-BLT-002', name: 'M10 Bolt 40mm', quantity: 8, unit: 'pcs', isCritical: false, wastePercentage: 2 },
  ]

  for (const ing of engineMountIngredients) {
    const inv = await prisma.inventory.findFirst({ where: { tenantId: TENANT_ID, partNumber: ing.partNumber } })
    
    const existing = await prisma.recipeIngredient.findFirst({
      where: {
        tenantId: TENANT_ID,
        recipeId: engineMountRecipe.id,
        partNumber: ing.partNumber,
      }
    })
    
    if (existing) {
      await prisma.recipeIngredient.update({
        where: { id: existing.id },
        data: {
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          isCritical: ing.isCritical,
          wastePercentage: ing.wastePercentage,
          mixOrder: engineMountIngredients.indexOf(ing) + 1,
        }
      })
    } else {
      await prisma.recipeIngredient.create({
        data: {
          tenantId: TENANT_ID,
          recipeId: engineMountRecipe.id,
          inventoryId: inv?.id,
          partNumber: ing.partNumber,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          isCritical: ing.isCritical,
          wastePercentage: ing.wastePercentage,
          mixOrder: engineMountIngredients.indexOf(ing) + 1,
        },
      })
    }
  }

  console.log(`   ✅ Created 3 recipes with ${bearingIngredients.length + bracketIngredients.length + engineMountIngredients.length} ingredients`)
  return { bearingRecipe, bracketRecipe, engineMountRecipe }
}

async function createInventory() {
  const inventoryItems = [
    // Raw Materials (with realistic stock levels - some low!)
    { partNumber: 'RM-STL-001', name: 'Steel Bearing Ring 50mm', category: 'Raw Material', quantity: 200, unit: 'pcs', locationId: 'WH-01', batch: 'BATCH-2025-001', unitPrice: 15000 },
    { partNumber: 'RM-STL-002', name: 'Steel Plate 10mm', category: 'Raw Material', quantity: 50, unit: 'sheets', locationId: 'WH-01', batch: 'BATCH-2025-002', unitPrice: 250000 },
    { partNumber: 'RM-ALU-001', name: 'Aluminum Bar 50mm', category: 'Raw Material', quantity: 30, unit: 'kg', locationId: 'WH-01', batch: 'BATCH-2025-003', unitPrice: 120000 },
    { partNumber: 'RM-BRG-001', name: 'Ball Bearing Insert 6205', category: 'Raw Material', quantity: 100, unit: 'pcs', locationId: 'WH-01', batch: 'BATCH-2025-004', unitPrice: 75000 },
    { partNumber: 'RM-GRS-001', name: 'Lithium Grease', category: 'Raw Material', quantity: 10, unit: 'kg', locationId: 'WH-01', batch: 'BATCH-2025-005', unitPrice: 250000 },
    { partNumber: 'RM-SEL-001', name: 'Rubber Seal 50mm', category: 'Raw Material', quantity: 80, unit: 'pcs', locationId: 'WH-01', batch: 'BATCH-2025-006', unitPrice: 15000 },
    { partNumber: 'RM-HSG-001', name: 'Housing Casting', category: 'Raw Material', quantity: 45, unit: 'pcs', locationId: 'WH-01', batch: 'BATCH-2025-007', unitPrice: 350000 },
    { partNumber: 'RM-BLT-001', name: 'M8 Bolt 20mm', category: 'Raw Material', quantity: 500, unit: 'pcs', locationId: 'WH-01', batch: 'BATCH-2025-008', unitPrice: 500 },
    { partNumber: 'RM-NUT-001', name: 'M8 Nut', category: 'Raw Material', quantity: 500, unit: 'pcs', locationId: 'WH-01', batch: 'BATCH-2025-009', unitPrice: 200 },
    { partNumber: 'RM-WSH-001', name: 'M8 Washer', category: 'Raw Material', quantity: 1000, unit: 'pcs', locationId: 'WH-01', batch: 'BATCH-2025-010', unitPrice: 100 },
    { partNumber: 'RM-RUB-001', name: 'Rubber Damper', category: 'Raw Material', quantity: 25, unit: 'pcs', locationId: 'WH-01', batch: 'BATCH-2025-011', unitPrice: 45000 },
    { partNumber: 'RM-BLT-002', name: 'M10 Bolt 40mm', category: 'Raw Material', quantity: 300, unit: 'pcs', locationId: 'WH-01', batch: 'BATCH-2025-012', unitPrice: 1500 },
    
    // Tools (with low stock alerts)
    { partNumber: 'TOOL-DRILL-001', name: 'HSS Drill Bit 10mm', category: 'Tool', quantity: 15, unit: 'pcs', locationId: 'TOOL-01', batch: 'TOOL-001', unitPrice: 50000 },
    { partNumber: 'TOOL-DRILL-002', name: 'HSS Drill Bit 12mm', category: 'Tool', quantity: 8, unit: 'pcs', locationId: 'TOOL-01', batch: 'TOOL-002', unitPrice: 65000 },
    { partNumber: 'TOOL-INSERT-001', name: 'Carbide Insert CNMG 120408', category: 'Tool', quantity: 50, unit: 'pcs', locationId: 'TOOL-01', batch: 'TOOL-003', unitPrice: 35000 },
    { partNumber: 'TOOL-INSERT-002', name: 'Carbide Insert VNMG 160408', category: 'Tool', quantity: 40, unit: 'pcs', locationId: 'TOOL-01', batch: 'TOOL-004', unitPrice: 32000 },
    
    // WIP (Work In Progress)
    { partNumber: 'WIP-BRG-001', name: 'Bearing Assembly Semi-Finished', category: 'WIP', quantity: 15, unit: 'pcs', locationId: 'PROD-01', batch: 'WIP-2025-001' },
    { partNumber: 'WIP-BRK-001', name: 'Bracket Machined (No Fasteners)', category: 'WIP', quantity: 20, unit: 'pcs', locationId: 'PROD-01', batch: 'WIP-2025-002' },
    
    // Finished Goods
    { partNumber: 'FG-BRG-XYZ-200', name: 'Bearing Assembly XYZ-200', category: 'Finished Good', quantity: 50, unit: 'sets', locationId: 'WH-02', batch: 'FG-2025-001' },
    { partNumber: 'FG-BRK-ALU-100', name: 'Aluminum Bracket Assembly', category: 'Finished Good', quantity: 30, unit: 'pcs', locationId: 'WH-02', batch: 'FG-2025-002' },
  ]

  let createdCount = 0
  for (const item of inventoryItems) {
    // Find location by code
    const location = await prisma.location.findFirst({
      where: { tenantId: TENANT_ID, code: item.locationId }
    })
    
    // Find shelf for location
    const shelf = await prisma.shelf.findFirst({
      where: { tenantId: TENANT_ID, locationId: location?.id }
    })

    await prisma.inventory.upsert({
      where: { 
        tenantId_partNumber_batch: { 
          tenantId: TENANT_ID, 
          partNumber: item.partNumber, 
          batch: item.batch 
        } 
      },
      update: {
        quantity: item.quantity,
        availableQty: item.quantity,
        unitPrice: item.unitPrice,
      },
      create: {
        tenantId: TENANT_ID,
        partNumber: item.partNumber,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        availableQty: item.quantity,
        reservedQty: 0,
        unit: item.unit,
        locationId: location?.id,
        shelfId: shelf?.id,
        batch: item.batch,
        status: item.quantity > 0 ? 'AVAILABLE' : 'RESERVED',
        unitPrice: item.unitPrice,
        currency: 'IDR',
        receivedAt: new Date(),
      },
    })
    createdCount++
  }

  console.log(`   ✅ Created ${createdCount} inventory items with realistic stock levels`)
  return inventoryItems
}

async function createVendors() {
  const vendors = [
    {
      code: 'V-001',
      name: 'PT. Baja Sentosa Indonesia',
      supplierType: 'MATERIAL',
      vendorTier: 'TIER_1',
      contactPerson: 'Hendra Wijaya',
      email: 'hendra@bajasentosa.co.id',
      phone: '+62215551234',
      address: 'Jl. Industri Raya No. 15',
      city: 'Bekasi',
      country: 'Indonesia',
      capabilities: JSON.stringify(['Steel Supply', 'Bearing Supply', 'Fasteners']),
      certifications: 'ISO 9001:2015',
      leadTimeDays: 7,
      moq: 100,
      paymentTerms: 'NET15',
      qualityRating: 4.5,
      deliveryRating: 4.8,
      priceRating: 4.0,
      onTimeDelivery: 95,
    },
    {
      code: 'V-002',
      name: 'PT. Aluminium Prima',
      supplierType: 'MATERIAL',
      vendorTier: 'TIER_2',
      contactPerson: 'Dewi Anggraini',
      email: 'dewi@alumprima.co.id',
      phone: '+62215555678',
      address: 'Jl. Aluminium No. 8',
      city: 'Tangerang',
      country: 'Indonesia',
      capabilities: JSON.stringify(['Aluminum Supply', 'Custom Cutting']),
      certifications: 'ISO 9001:2015, IATF 16949',
      leadTimeDays: 5,
      moq: 50,
      paymentTerms: 'NET30',
      qualityRating: 4.7,
      deliveryRating: 4.5,
      priceRating: 4.2,
      onTimeDelivery: 92,
    },
    {
      code: 'V-003',
      name: 'PT. Jaya CNC Indonesia',
      supplierType: 'CONTRACT_MANUFACTURER',
      vendorTier: 'TIER_1',
      contactPerson: 'Budi Santoso',
      email: 'budi@jayacnc.com',
      phone: '+62215559012',
      address: 'Jl. Industri No. 123',
      city: 'Bekasi',
      country: 'Indonesia',
      capabilities: JSON.stringify(['CNC Milling', 'CNC Turning', '5-Axis Machining']),
      certifications: 'ISO 9001:2015, IATF 16949',
      leadTimeDays: 14,
      moq: 100,
      paymentTerms: 'NET30',
      qualityRating: 4.5,
      deliveryRating: 4.2,
      priceRating: 3.8,
      onTimeDelivery: 88,
    },
    {
      code: 'V-004',
      name: 'PT. Karet Indonesia',
      supplierType: 'MATERIAL',
      vendorTier: 'TIER_2',
      contactPerson: 'Rini Susanti',
      email: 'rini@karetindonesia.co.id',
      phone: '+62215557890',
      address: 'Jl. Karet No. 25',
      city: 'Jakarta',
      country: 'Indonesia',
      capabilities: JSON.stringify(['Rubber Components', 'Seals', 'Dampers']),
      certifications: 'ISO 9001:2015',
      leadTimeDays: 10,
      moq: 200,
      paymentTerms: 'NET30',
      qualityRating: 4.3,
      deliveryRating: 4.0,
      priceRating: 4.5,
      onTimeDelivery: 90,
    },
  ]

  for (const vendor of vendors) {
    await prisma.supplier.upsert({
      where: { tenantId_code: { tenantId: TENANT_ID, code: vendor.code } },
      update: {},
      create: {
        tenantId: TENANT_ID,
        ...vendor,
      },
    })
  }

  console.log(`   ✅ Created ${vendors.length} vendors (2 material, 1 contract manufacturer, 1 rubber)`)
  return vendors
}

async function createMachines() {
  const machines = [
    {
      code: 'CNC-001',
      name: 'CNC Milling Machine 1',
      model: 'HAAS VF-2',
      location: 'Workshop A',
      type: 'CNC Milling',
      status: MachineStatus.IDLE,
      capacity: 8,
    },
    {
      code: 'CNC-002',
      name: 'CNC Lathe Machine 1',
      model: 'HAAS ST-20',
      location: 'Workshop A',
      type: 'CNC Lathe',
      status: MachineStatus.RUNNING,
      capacity: 8,
    },
    {
      code: 'CNC-003',
      name: 'CNC Milling Machine 2',
      model: 'DMG MORI CMX 50U',
      location: 'Workshop A',
      type: 'CNC Milling',
      status: MachineStatus.IDLE,
      capacity: 8,
    },
    {
      code: 'LATHE-001',
      name: 'Conventional Lathe 1',
      model: 'Yamazaki MS-850',
      location: 'Workshop B',
      type: 'Conventional Lathe',
      status: MachineStatus.IDLE,
      capacity: 8,
    },
    {
      code: 'DRILL-001',
      name: 'Drilling Machine 1',
      model: 'Bosch PBD 40',
      location: 'Workshop B',
      type: 'Drilling',
      status: MachineStatus.MAINTENANCE,
      capacity: 8,
    },
    {
      code: 'WELD-001',
      name: 'TIG Welding Station 1',
      model: 'Lincoln Electric Aspect 400',
      location: 'Assembly Area',
      type: 'Welding',
      status: MachineStatus.IDLE,
      capacity: 8,
    },
    {
      code: 'PRESS-001',
      name: 'Hydraulic Press 1',
      model: 'Yanmar 50T',
      location: 'Workshop C',
      type: 'Press Brake',
      status: MachineStatus.RUNNING,
      capacity: 8,
    },
    {
      code: 'GRIND-001',
      name: 'Surface Grinder 1',
      model: 'Okamoto ACC-618',
      location: 'Workshop B',
      type: 'Grinding',
      status: MachineStatus.IDLE,
      capacity: 8,
    },
  ]

  for (const machine of machines) {
    await prisma.machine.upsert({
      where: { tenantId_code: { tenantId: TENANT_ID, code: machine.code } },
      update: {},
      create: {
        tenantId: TENANT_ID,
        ...machine,
        isActive: true,
      },
    })
  }

  console.log(`   ✅ Created ${machines.length} machines with varied statuses`)
  return machines
}

async function createOrderFlow() {
  const recipes = await prisma.recipe.findMany({ where: { tenantId: TENANT_ID } })
  const bearingRecipe = recipes.find(r => r.code === 'RCP-BRG-001')
  const bracketRecipe = recipes.find(r => r.code === 'RCP-BRK-001')
  const engineMountRecipe = recipes.find(r => r.code === 'RCP-EMT-001')

  // Scenario 1: Complete order flow (marketing → drafter → PPIC → production → QC)
  console.log('   📦 Creating Scenario 1: Complete Order Flow (PT. Astra Honda Motor)')
  
  const order1 = await prisma.order.upsert({
    where: { tenantId_orderNumber: { tenantId: TENANT_ID, orderNumber: 'ORD-2026-001' } },
    update: {},
    create: {
      tenantId: TENANT_ID,
      boardId: BOARD_ID,
      orderNumber: 'ORD-2026-001',
      customerName: 'PT. Astra Honda Motor',
      customerEmail: 'procurement@ahm.co.id',
      customerPhone: '+62215081111',
      status: OrderStatus.IN_PRODUCTION,
      plannedStartDate: subDays(new Date(), 10),
      plannedEndDate: addDays(new Date(), 20),
      actualStartDate: subDays(new Date(), 8),
      progressPercent: 45,
      notes: 'Motorcycle bearing assemblies - Priority order for new model launch',
      drawingUrl: 'https://example.com/drawings/AHM-BRG-001.pdf',
    },
  })

  // MO 1: Bearing Assembly (in production, using recipe)
  const mo1 = await prisma.manufacturingOrder.upsert({
    where: { 
      tenantId_orderId_moNumber: { 
        tenantId: TENANT_ID, 
        orderId: order1.id,
        moNumber: 'MO-2026-001' 
      } 
    },
    update: {},
    create: {
      tenantId: TENANT_ID,
      orderId: order1.id,
      moNumber: 'MO-2026-001',
      name: 'Bearing Assembly XYZ-200 (50 pcs)',
      description: 'Production batch for AHM bearing assemblies',
      status: MOStatus.IN_PROGRESS,
      plannedStartDate: subDays(new Date(), 8),
      plannedEndDate: addDays(new Date(), 15),
      actualStartDate: subDays(new Date(), 7),
      progressPercent: 60,
      recipeId: bearingRecipe?.id,
      notes: 'Using recipe RCP-BRG-001 for material requirements',
    },
  })

  // Jobsheet 1: CNC Milling (completed)
  const js1 = await prisma.jobsheet.upsert({
    where: { 
      tenantId_moId_jsNumber: { 
        tenantId: TENANT_ID, 
        moId: mo1.id,
        jsNumber: 'JS-2026-001' 
      } 
    },
    update: {},
    create: {
      tenantId: TENANT_ID,
      moId: mo1.id,
      jsNumber: 'JS-2026-001',
      name: 'CNC Milling - Housing',
      status: JobsheetStatus.COMPLETED,
      plannedStartDate: subDays(new Date(), 8),
      plannedEndDate: subDays(new Date(), 5),
      actualStartDate: subDays(new Date(), 7),
      actualEndDate: subDays(new Date(), 4),
      progressPercent: 100,
      drawingUrl: 'https://example.com/drawings/JS-2026-001-CNC.pdf',
    },
  })

// Tasks for JS1
const task1 = await prisma.machiningTask.findFirst({
  where: { tenantId: TENANT_ID, jobsheetId: js1.id, taskNumber: 'MT-2026-001' }
})

if (!task1) {
  await prisma.machiningTask.create({
    data: {
      tenantId: TENANT_ID,
      jobsheetId: js1.id,
      taskNumber: 'MT-2026-001',
      name: 'Setup & Fixturing',
      status: TaskStatus.COMPLETED,
      plannedHours: 1,
      actualHours: 1,
      machineId: (await prisma.machine.findFirst({ where: { code: 'CNC-001' } }))?.id,
      assignedTo: (await prisma.user.findFirst({ where: { email: 'tech1@ypti.com' } }))?.id,
      clockedInAt: subDays(new Date(), 7),
      clockedOutAt: subDays(new Date(), 7),
      progressPercent: 100,
    },
  })
}

const task2 = await prisma.machiningTask.findFirst({
  where: { tenantId: TENANT_ID, jobsheetId: js1.id, taskNumber: 'MT-2026-002' }
})

if (!task2) {
  await prisma.machiningTask.create({
    data: {
      tenantId: TENANT_ID,
      jobsheetId: js1.id,
      taskNumber: 'MT-2026-002',
      name: 'CNC Milling Operation',
      status: TaskStatus.COMPLETED,
      plannedHours: 4,
      actualHours: 3.5,
      machineId: (await prisma.machine.findFirst({ where: { code: 'CNC-001' } }))?.id,
      assignedTo: (await prisma.user.findFirst({ where: { email: 'tech1@ypti.com' } }))?.id,
      clockedInAt: subDays(new Date(), 7),
      clockedOutAt: subDays(new Date(), 6),
      progressPercent: 100,
    },
  })
}

  // Jobsheet 2: Assembly (in progress)
  const js2 = await prisma.jobsheet.upsert({
    where: { 
      tenantId_moId_jsNumber: { 
        tenantId: TENANT_ID, 
        moId: mo1.id,
        jsNumber: 'JS-2026-002' 
      } 
    },
    update: {},
    create: {
      tenantId: TENANT_ID,
      moId: mo1.id,
      jsNumber: 'JS-2026-002',
      name: 'Assembly & Greasing',
      status: JobsheetStatus.IN_PROGRESS,
      plannedStartDate: subDays(new Date(), 4),
      plannedEndDate: addDays(new Date(), 5),
      actualStartDate: subDays(new Date(), 3),
      progressPercent: 40,
    },
  })

const task3 = await prisma.machiningTask.findFirst({
  where: { tenantId: TENANT_ID, jobsheetId: js2.id, taskNumber: 'MT-2026-003' }
})

if (!task3) {
  await prisma.machiningTask.create({
    data: {
      tenantId: TENANT_ID,
      jobsheetId: js2.id,
      taskNumber: 'MT-2026-003',
      name: 'Bearing Assembly',
      status: TaskStatus.RUNNING,
      plannedHours: 6,
      actualHours: null,
      machineId: (await prisma.machine.findFirst({ where: { code: 'WELD-001' } }))?.id,
      assignedTo: (await prisma.user.findFirst({ where: { email: 'tech2@ypti.com' } }))?.id,
      clockedInAt: subDays(new Date(), 2),
      progressPercent: 30,
    },
  })
}

  // MO 2: Engine Mount (planning, outsourced)
  const mo2 = await prisma.manufacturingOrder.upsert({
    where: { 
      tenantId_orderId_moNumber: { 
        tenantId: TENANT_ID, 
        orderId: order1.id,
        moNumber: 'MO-2026-002' 
      } 
    },
    update: {},
    create: {
      tenantId: TENANT_ID,
      orderId: order1.id,
      moNumber: 'MO-2026-002',
      name: 'Engine Mount Assembly (Outsourced)',
      description: 'CNC machining outsourced to PT. Jaya CNC',
      status: MOStatus.PLANNING,
      plannedStartDate: addDays(new Date(), 5),
      plannedEndDate: addDays(new Date(), 20),
      progressPercent: 10,
      recipeId: engineMountRecipe?.id,
      isOutsourced: true,
      outsourcedType: 'PARTIAL',
      vendorId: (await prisma.supplier.findFirst({ where: { code: 'V-003' } }))?.id,
      vendorEstimatedCost: 7500000,
      vendorLeadTimeDays: 14,
      notes: 'CNC machining only, assembly in-house',
    },
  })

  // Scenario 2: Order with material shortage (triggers PR)
  console.log('   📦 Creating Scenario 2: Order with Material Shortage (PT. Yamaha Indonesia)')
  
  const order2 = await prisma.order.upsert({
    where: { tenantId_orderNumber: { tenantId: TENANT_ID, orderNumber: 'ORD-2026-002' } },
    update: {},
    create: {
      tenantId: TENANT_ID,
      boardId: BOARD_ID,
      orderNumber: 'ORD-2026-002',
      customerName: 'PT. Yamaha Indonesia Motor',
      customerEmail: 'parts@yamaha.co.id',
      customerPhone: '+62212501111',
      status: OrderStatus.PLANNING,
      plannedStartDate: addDays(new Date(), 3),
      plannedEndDate: addDays(new Date(), 30),
      progressPercent: 15,
      notes: 'Engine mounting brackets - Standard priority',
      drawingUrl: 'https://example.com/drawings/YAMAHA-BRK-001.pdf',
    },
  })

  const mo3 = await prisma.manufacturingOrder.upsert({
    where: { 
      tenantId_orderId_moNumber: { 
        tenantId: TENANT_ID, 
        orderId: order2.id,
        moNumber: 'MO-2026-003' 
      } 
    },
    update: {},
    create: {
      tenantId: TENANT_ID,
      orderId: order2.id,
      moNumber: 'MO-2026-003',
      name: 'Aluminum Bracket Assembly (100 pcs)',
      description: 'CNC machined aluminum brackets',
      status: MOStatus.MATERIAL_PREPARATION,
      plannedStartDate: addDays(new Date(), 3),
      plannedEndDate: addDays(new Date(), 25),
      progressPercent: 5,
      recipeId: bracketRecipe?.id,
      notes: 'Material shortage detected - aluminum bars only 30kg, need 50kg',
    },
  })

  // Scenario 3: Completed order
  console.log('   📦 Creating Scenario 3: Completed Order (PT. Toyota Astra Motor)')
  
  const order3 = await prisma.order.upsert({
    where: { tenantId_orderNumber: { tenantId: TENANT_ID, orderNumber: 'ORD-2026-003' } },
    update: {},
    create: {
      tenantId: TENANT_ID,
      boardId: BOARD_ID,
      orderNumber: 'ORD-2026-003',
      customerName: 'PT. Toyota Astra Motor',
      customerEmail: 'parts@toyota.co.id',
      customerPhone: '+62213456789',
      status: OrderStatus.DELIVERED,
      plannedStartDate: subDays(new Date(), 30),
      plannedEndDate: subDays(new Date(), 5),
      actualStartDate: subDays(new Date(), 28),
      actualEndDate: subDays(new Date(), 7),
      progressPercent: 100,
      notes: 'Engine bracket set - Completed ahead of schedule',
    },
  })

  console.log(`   ✅ Created 3 orders with complete hierarchy`)
  return { order1, order2, order3 }
}

async function createMaterialRequirements() {
  // Get MOs that need material requirements
  const mo1 = await prisma.manufacturingOrder.findFirst({ where: { moNumber: 'MO-2026-001' } })
  const mo3 = await prisma.manufacturingOrder.findFirst({ where: { moNumber: 'MO-2026-003' } })

  if (mo1) {
    // Material requirements for Bearing Assembly MO
    const materials = [
      { partNumber: 'RM-STL-001', name: 'Steel Bearing Ring 50mm', requiredQty: 100, reservedQty: 80 },
      { partNumber: 'RM-BRG-001', name: 'Ball Bearing Insert 6205', requiredQty: 50, reservedQty: 50 },
      { partNumber: 'RM-GRS-001', name: 'Lithium Grease', requiredQty: 5, reservedQty: 5 },
      { partNumber: 'RM-SEL-001', name: 'Rubber Seal 50mm', requiredQty: 100, reservedQty: 60 },
      { partNumber: 'RM-HSG-001', name: 'Housing Casting', requiredQty: 50, reservedQty: 45 },
    ]

    for (const mat of materials) {
      const inventory = await prisma.inventory.findFirst({ where: { tenantId: TENANT_ID, partNumber: mat.partNumber } })
      
      await prisma.materialRequirement.upsert({
        where: { 
          tenantId_moId_partNumber: { 
            tenantId: TENANT_ID, 
            moId: mo1.id, 
            partNumber: mat.partNumber 
          } 
        },
        update: {},
        create: {
          tenantId: TENANT_ID,
          moId: mo1.id,
          partNumber: mat.partNumber,
          name: mat.name,
          requiredQty: mat.requiredQty,
          reservedQty: mat.reservedQty,
          receivedQty: mat.reservedQty,
          consumedQty: mat.partNumber === 'RM-BRG-001' ? 30 : 0,
          status: mat.reservedQty >= mat.requiredQty ? 'RESERVED' : 
                  mat.reservedQty > 0 ? 'PARTIALLY_RESERVED' : 'PLANNED',
          requiredDate: addDays(new Date(), 10),
          priority: mat.partNumber === 'RM-HSG-001' ? 1 : 5,
          inventoryId: inventory?.id,
        },
      })
    }
  }

  if (mo3) {
    // Material requirements for Aluminum Bracket MO (with shortage!)
    const materials = [
      { partNumber: 'RM-ALU-001', name: 'Aluminum Bar 50mm', requiredQty: 50, reservedQty: 30, neededPurchase: 20 },
      { partNumber: 'RM-BLT-001', name: 'M8 Bolt 20mm', requiredQty: 400, reservedQty: 400 },
      { partNumber: 'RM-NUT-001', name: 'M8 Nut', requiredQty: 400, reservedQty: 400 },
      { partNumber: 'RM-WSH-001', name: 'M8 Washer', requiredQty: 800, reservedQty: 800 },
    ]

    for (const mat of materials) {
      const inventory = await prisma.inventory.findFirst({ where: { tenantId: TENANT_ID, partNumber: mat.partNumber } })
      
      await prisma.materialRequirement.upsert({
        where: { 
          tenantId_moId_partNumber: { 
            tenantId: TENANT_ID, 
            moId: mo3.id, 
            partNumber: mat.partNumber 
          } 
        },
        update: {},
        create: {
          tenantId: TENANT_ID,
          moId: mo3.id,
          partNumber: mat.partNumber,
          name: mat.name,
          requiredQty: mat.requiredQty,
          reservedQty: mat.reservedQty,
          requestedQty: (mat as any).neededPurchase || 0,
          status: (mat as any).neededPurchase ? 'PURCHASE_REQUESTED' : 
                  mat.reservedQty >= mat.requiredQty ? 'RESERVED' : 'PARTIALLY_RESERVED',
          requiredDate: addDays(new Date(), 5),
          priority: (mat as any).neededPurchase ? 1 : 5,
          inventoryId: inventory?.id,
        },
      })
    }
  }

  console.log(`   ✅ Created material requirements with MRP status`)
}

async function createPurchaseRequests() {
  // Get material requirements that need purchase
  const mo3 = await prisma.manufacturingOrder.findFirst({ where: { moNumber: 'MO-2026-003' } })
  
  if (mo3) {
    const aluReq = await prisma.materialRequirement.findFirst({
      where: { moId: mo3.id, partNumber: 'RM-ALU-001' }
    })

    if (aluReq) {
      // Create Purchase Request for aluminum shortage
  const supplier = await prisma.supplier.findFirst({ where: { code: 'V-002' } })
  
  const pr = await prisma.purchaseRequest.upsert({
    where: { tenantId_prNumber: { tenantId: TENANT_ID, prNumber: 'PR-2026-001' } },
    update: {},
    create: {
      tenantId: TENANT_ID,
      prNumber: 'PR-2026-001',
      title: 'Aluminum Bar 50mm for MO-2026-003',
      description: 'Auto-generated PR for material shortage in Yamaha bracket order',
      status: 'SUBMITTED',
      priority: 1,
      sourceType: 'AUTO_MO',
      sourceMoId: mo3.id,
      requiredDate: addDays(new Date(), 3),
      totalItems: 1,
      estimatedAmount: 2400000, // 20kg * 120,000 IDR/kg
      currency: 'IDR',
      createdBy: 'user-ppic',
      odooPrId: 'ODOO-PO-2026-001', // Simulated Odoo sync
      odooSyncedAt: new Date(),
      supplier: supplier ? { connect: { id: supplier.id } } : undefined,
    },
  })

      // Create PR item
      const existingPrItem = await prisma.purchaseRequestItem.findFirst({
        where: {
          tenantId: TENANT_ID,
          purchaseRequestId: pr.id,
          partNumber: 'RM-ALU-001',
        }
      })
      
      if (existingPrItem) {
        await prisma.purchaseRequestItem.update({
          where: { id: existingPrItem.id },
          data: {
            quantity: 20,
            unitPrice: 120000,
            totalPrice: 2400000,
            unit: 'kg',
            supplierId: (await prisma.supplier.findFirst({ where: { code: 'V-002' } }))?.id,
            status: 'ORDERED',
          }
        })
      } else {
        await prisma.purchaseRequestItem.create({
          data: {
            tenantId: TENANT_ID,
            purchaseRequestId: pr.id,
            materialRequirementId: aluReq.id,
          partNumber: 'RM-ALU-001',
          name: 'Aluminum Bar 50mm',
          quantity: 20,
          unitPrice: 120000,
          totalPrice: 2400000,
          unit: 'kg',
          supplierId: (await prisma.supplier.findFirst({ where: { code: 'V-002' } }))?.id,
          status: 'ORDERED',
        },
      })
      }

      console.log(`   ✅ Created PR-2026-001 for aluminum shortage (synced to Odoo)`)
    }
  }

  // Create vendor order for outsourced MO
  const mo2 = await prisma.manufacturingOrder.findFirst({ where: { moNumber: 'MO-2026-002' } })
  if (mo2) {
    const vendor = await prisma.supplier.findFirst({ where: { code: 'V-003' } })
    
    if (vendor) {
      await prisma.vendorOrder.upsert({
        where: { tenantId_vendorOrderId: { tenantId: TENANT_ID, vendorOrderId: 'VO-2026-001' } },
        update: {},
        create: {
          tenantId: TENANT_ID,
          vendorOrderId: 'VO-2026-001',
          vendorId: vendor.id,
          moId: mo2.id,
          title: 'CNC Machining for Engine Mount',
          description: 'Outsourced CNC milling operations',
          outsourceType: 'PARTIAL',
          workDescription: 'CNC machining of steel plates and drilling',
          quantity: 50,
          unit: 'pcs',
          unitPrice: 150000,
          totalPrice: 7500000,
          currency: 'IDR',
          paymentTerms: 'NET30',
          promisedDate: addDays(new Date(), 14),
          vendorLeadTimeDays: 14,
          status: 'ORDERED',
          qualityRequired: true,
          notes: 'Waiting for material delivery from PR-2026-001',
        },
      })

      // Update MO with vendor info
      await prisma.manufacturingOrder.update({
        where: { id: mo2.id },
        data: {
          vendorOrderNumber: 'VO-2026-001',
          vendorQuoteNumber: 'QUOTE-JCNC-2026-001',
        },
      })

      console.log(`   ✅ Created VO-2026-001 for outsourced machining`)
    }
  }
}

async function createMaterialHandoffs() {
  // Get locations
  const warehouse = await prisma.location.findFirst({ where: { code: 'WH-01' } })
  const ppicRack = await prisma.location.findFirst({ where: { code: 'PPIC-01' } })
  const production = await prisma.location.findFirst({ where: { code: 'PROD-01' } })

  if (warehouse && ppicRack && production) {
    // Get MO 1
    const mo1 = await prisma.manufacturingOrder.findFirst({ where: { moNumber: 'MO-2026-001' } })
    
    if (mo1) {
      // Get inventory items for handoff
      const items = await prisma.inventory.findMany({
        where: {
          tenantId: TENANT_ID,
          partNumber: { in: ['RM-STL-001', 'RM-BRG-001', 'RM-GRS-001'] },
        },
      })

      if (items.length > 0) {
        // Get users for handoff
        const tech1User = await prisma.user.findFirst({ where: { email: 'tech1@ypti.com' } })
        const ppicUser = await prisma.user.findFirst({ where: { email: 'ppic@ypti.com' } })
        const tech2User = await prisma.user.findFirst({ where: { email: 'tech2@ypti.com' } })
        
        // Only create handoff if users exist
        if (tech1User && ppicUser) {
          // Create handoff from Warehouse to PPIC Rack
          const handoff = await prisma.materialHandoff.upsert({
            where: { tenantId_handoffNumber: { tenantId: TENANT_ID, handoffNumber: 'HO-2026-001' } },
            update: {},
            create: {
              tenantId: TENANT_ID,
              handoffNumber: 'HO-2026-001',
              fromLocationId: warehouse.id,
              toLocationId: ppicRack.id,
              handedBy: tech1User.id,
              receivedBy: ppicUser.id,
              fromPicUserId: tech1User.id,
              toPicUserId: ppicUser.id,
              handoffType: 'MATERIAL_REQUEST',
              referenceType: 'MO',
              referenceId: mo1.id,
              moId: mo1.id,
              status: 'CONFIRMED',
              handedAt: subDays(new Date(), 6),
              receivedAt: subDays(new Date(), 6),
              notes: 'Materials moved to PPIC for preparation',
            },
          })

          // Create handoff items
          for (const item of items) {
            await prisma.materialHandoffItem.create({
              data: {
                tenantId: TENANT_ID,
                handoffId: handoff.id,
                inventoryId: item.id,
                partNumber: item.partNumber,
                name: item.name,
                quantity: item.partNumber === 'RM-STL-001' ? 50 : 
                         item.partNumber === 'RM-BRG-001' ? 25 : 2,
                unit: item.unit,
                condition: 'GOOD',
              },
            })
          }

          // Create second handoff from PPIC to Production (only if users exist)
          if (ppicUser && tech2User) {
            const handoff2 = await prisma.materialHandoff.upsert({
              where: { tenantId_handoffNumber: { tenantId: TENANT_ID, handoffNumber: 'HO-2026-002' } },
              update: {},
              create: {
                tenantId: TENANT_ID,
                handoffNumber: 'HO-2026-002',
                fromLocationId: ppicRack.id,
                toLocationId: production.id,
                handedBy: ppicUser.id,
                receivedBy: tech2User.id,
                handoffType: 'ISSUE_TO_PRODUCTION',
                referenceType: 'MO',
                referenceId: mo1.id,
                moId: mo1.id,
                status: 'CONFIRMED',
                handedAt: subDays(new Date(), 5),
                receivedAt: subDays(new Date(), 5),
                notes: 'Materials issued to production floor',
              },
            })

            // Create items for second handoff
            for (const item of items) {
              await prisma.materialHandoffItem.create({
                data: {
                  tenantId: TENANT_ID,
                  handoffId: handoff2.id,
                  inventoryId: item.id,
                  partNumber: item.partNumber,
                  name: item.name,
                  quantity: item.partNumber === 'RM-STL-001' ? 30 : 
                           item.partNumber === 'RM-BRG-001' ? 15 : 1,
                  unit: item.unit,
                  condition: 'GOOD',
                },
              })
            }

            console.log(`   ✅ Created 2 material handoffs (Warehouse → PPIC → Production)`)
          }
        }
      }
    }
  }
}

async function createQualityControl() {
  const mo1 = await prisma.manufacturingOrder.findFirst({ where: { moNumber: 'MO-2026-001' } })
  const order3 = await prisma.order.findFirst({ where: { orderNumber: 'ORD-2026-003' } })

  if (mo1) {
    // QC for Bearing Assembly
    let qc
    try {
      qc = await prisma.qualityCheck.findFirst({
        where: { tenantId: TENANT_ID, qcNumber: 'QC-2026-001' }
      })
    } catch (e) {
      qc = null
    }
    
    if (!qc) {
      try {
        qc = await prisma.qualityCheck.create({
          data: {
            tenantId: TENANT_ID,
            qcNumber: 'QC-2026-001',
            referenceType: 'MO',
            referenceId: mo1.id,
            moId: mo1.id,
            checkType: 'IN_PROCESS',
            inspectionStage: 'DURING_PRODUCTION',
            partNumber: 'FG-BRG-XYZ-200',
            productName: 'Bearing Assembly XYZ-200',
            quantity: 30,
            unit: 'pcs',
            status: 'PASSED',
            passQuantity: 28,
            failQuantity: 2,
            reworkQuantity: 2,
            scrapQuantity: 0,
            inspectorId: (await prisma.user.findFirst({ where: { email: 'tech1@ypti.com' } }))?.id,
            inspectedAt: subDays(new Date(), 4),
            completedAt: subDays(new Date(), 4),
            notes: '2 items failed dimensional tolerance, sent for rework',
          },
        })
      } catch (error) {
        // Record might already exist, try to find it again
        qc = await prisma.qualityCheck.findFirst({
          where: { tenantId: TENANT_ID, qcNumber: 'QC-2026-001' }
        })
      }
    }

    if (!qc) {
      console.log('⚠️  QC-2026-001 already exists, skipping creation')
      return
    }

    // QC Items
    const qcItems = [
      { criteriaCode: 'DIM-001', criteriaName: 'Outer Diameter', result: 'PASS', actualValue: 50.02, targetValue: 50.0 },
      { criteriaCode: 'DIM-002', criteriaName: 'Inner Diameter', result: 'PASS', actualValue: 24.98, targetValue: 25.0 },
      { criteriaCode: 'DIM-003', criteriaName: 'Width', result: 'PASS', actualValue: 14.95, targetValue: 15.0 },
      { criteriaCode: 'VIS-001', criteriaName: 'Surface Finish', result: 'PASS', actualText: 'Smooth, no visible defects' },
      { criteriaCode: 'FUNC-001', criteriaName: 'Bearing Rotation', result: 'FAIL', defectCode: 'DF-001', defectNotes: 'Slight roughness in rotation' },
    ]

    for (const item of qcItems) {
      await prisma.qualityCheckItem.create({
        data: {
          tenantId: TENANT_ID,
          qualityCheckId: qc.id,
          criteriaCode: item.criteriaCode,
          criteriaName: item.criteriaName,
          category: item.criteriaCode.startsWith('DIM') ? 'DIMENSIONAL' : 
                   item.criteriaCode.startsWith('VIS') ? 'VISUAL' : 'FUNCTIONAL',
          result: item.result as any,
          actualValue: item.actualValue,
          targetValue: item.targetValue,
          defectCode: item.defectCode,
          defectNotes: item.defectNotes,
          actualText: item.actualText,
          order: qcItems.indexOf(item),
        },
      })
    }

    // Create Rework Order for failed items
    const existingRework = await prisma.reworkOrder.findFirst({
      where: { tenantId: TENANT_ID, reworkNumber: 'RW-2026-001' }
    })
    
    if (!existingRework) {
      await prisma.reworkOrder.create({
        data: {
        tenantId: TENANT_ID,
        reworkNumber: 'RW-2026-001',
        qualityCheckId: qc.id,
        moId: mo1.id,
        reworkType: 'REPAIR',
        priority: 'MEDIUM',
        partNumber: 'FG-BRG-XYZ-200',
        productName: 'Bearing Assembly XYZ-200',
        quantity: 2,
        unit: 'pcs',
        defectCode: 'DF-001',
        defectDescription: 'Bearing rotation roughness',
        instructions: 'Disassemble, clean, re-grease, and reassemble bearing',
        estimatedCost: 50000,
        estimatedHours: 2,
        status: 'IN_PROGRESS',
        completionPercentage: 30,
        assignedToId: (await prisma.user.findFirst({ where: { email: 'tech2@ypti.com' } }))?.id,
        requiresReinspection: true,
      },
      })
    }
  }

  if (order3) {
    // QC for Completed Order (Toyota)
    const existingQc2 = await prisma.qualityCheck.findFirst({
      where: { tenantId: TENANT_ID, qcNumber: 'QC-2026-002' }
    })
    
    if (!existingQc2) {
      await prisma.qualityCheck.create({
        data: {
        tenantId: TENANT_ID,
        qcNumber: 'QC-2026-002',
        referenceType: 'ORDER',
        referenceId: order3.id,
        orderId: order3.id,
        checkType: 'FINAL',
        inspectionStage: 'POST_PRODUCTION',
        partNumber: 'FG-BRK-ALU-100',
        productName: 'Aluminum Bracket Assembly',
        quantity: 100,
        unit: 'pcs',
        status: 'PASSED',
        passQuantity: 100,
        failQuantity: 0,
        inspectorId: (await prisma.user.findFirst({ where: { email: 'tech1@ypti.com' } }))?.id,
        inspectedAt: subDays(new Date(), 8),
        completedAt: subDays(new Date(), 8),
        customerApprovalRequired: true,
        customerApproved: true,
        customerApprovedAt: subDays(new Date(), 7),
        customerApprovedBy: 'Toyota QA Team',
        notes: 'All items passed final inspection. Customer approved shipment.',
      },
      })
    }
  }

  console.log(`   ✅ Created QC checks, items, and rework orders`)
}

async function createMachineBreakdowns() {
  // Create breakdown for drill machine (already in MAINTENANCE status)
  const drillMachine = await prisma.machine.findFirst({ where: { code: 'DRILL-001' } })
  
  if (drillMachine) {
    const existingBreakdown = await prisma.breakdown.findFirst({
      where: { 
        tenantId: TENANT_ID, 
        machineId: drillMachine.id,
        reportedAt: subDays(new Date(), 1)
      }
    })
    
    if (!existingBreakdown) {
      await prisma.breakdown.create({
        data: {
        tenantId: TENANT_ID,
        machineId: drillMachine.id,
        reportedBy: 'user-tech2',
        reportedAt: subDays(new Date(), 1),
        type: 'MECHANICAL',
        description: 'Drill bit broken during precision drilling operation',
        notes: 'Drill bit snapped while drilling pivot holes. Need to replace bit and check spindle alignment.',
        resolved: false,
        affectedTaskId: (await prisma.machiningTask.findFirst({ 
          where: { name: 'Precision Drilling' } 
        }))?.id,
      },
      })
    }

    // Update machine status
    await prisma.machine.update({
      where: { id: drillMachine.id },
      data: { status: MachineStatus.MAINTENANCE },
    })
  }

  // Create resolved breakdown history
  const latheMachine = await prisma.machine.findFirst({ where: { code: 'LATHE-001' } })
  
  if (latheMachine) {
    const existingBreakdown2 = await prisma.breakdown.findFirst({
      where: { 
        tenantId: TENANT_ID, 
        machineId: latheMachine.id,
        reportedAt: subDays(new Date(), 7)
      }
    })
    
    if (!existingBreakdown2) {
      await prisma.breakdown.create({
        data: {
        tenantId: TENANT_ID,
        machineId: latheMachine.id,
        reportedBy: 'user-tech1',
        reportedAt: subDays(new Date(), 7),
        type: 'ELECTRICAL',
        description: 'Spindle motor overheating',
        notes: 'Motor overheating after 4 hours of continuous operation. Cooling system issue.',
        resolved: true,
        resolvedAt: subDays(new Date(), 7),
        resolvedBy: 'user-admin',
        resolution: 'Replaced cooling fan and cleaned air filters. Motor now operating normally.',
        affectedTaskId: null,
      },
      })
    }
  }

  console.log(`   ✅ Created machine breakdowns (1 active, 1 resolved)`)
}

async function createSystemSettings() {
  const settings = [
    { key: 'COMPANY_NAME', category: 'General', value: 'YPTI Manufacturing', type: 'string', description: 'Company name', isPublic: true },
    { key: 'WORK_HOURS_START', category: 'Operations', value: '08:00', type: 'string', description: 'Work start time', isPublic: true },
    { key: 'WORK_HOURS_END', category: 'Operations', value: '17:00', type: 'string', description: 'Work end time', isPublic: true },
    { key: 'QC_PASS_THRESHOLD', category: 'Quality', value: '95', type: 'number', description: 'QC pass threshold percentage', isPublic: false },
    { key: 'LOW_STOCK_THRESHOLD', category: 'Inventory', value: '10', type: 'number', description: 'Low stock alert threshold', isPublic: false },
    { key: 'AUTO_MRP_ENABLED', category: 'Planning', value: 'true', type: 'boolean', description: 'Auto-run MRP on MO creation', isPublic: false },
    { key: 'ODOO_AUTO_SYNC', category: 'Integration', value: 'true', type: 'boolean', description: 'Auto-sync with Odoo', isPublic: false },
    { key: 'MATERIAL_HANDOFF_REQUIRED', category: 'Operations', value: 'true', type: 'boolean', description: 'Require handoff confirmation', isPublic: false },
  ]

  for (const setting of settings) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    })
  }

  console.log(`   ✅ Created ${settings.length} system settings`)
}

async function createUserSettings() {
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
        defaultView: user.roleId === 'role-technician' ? 'kanban' : 'dashboard',
        showInactiveMachines: false,
        showCompletedTasks: user.roleId === 'role-manager' || user.roleId === 'role-admin',
        rowsPerPage: 25,
      },
    })
  }

  console.log(`   ✅ Created user settings for ${users.length} users`)
}

async function printSummary() {
  console.log('📊 DATA SUMMARY:')
  console.log('=====================================================')
  
  const orders = await prisma.order.count({ where: { tenantId: TENANT_ID } })
  const mos = await prisma.manufacturingOrder.count({ where: { tenantId: TENANT_ID } })
  const jobsheets = await prisma.jobsheet.count({ where: { tenantId: TENANT_ID } })
  const tasks = await prisma.machiningTask.count({ where: { tenantId: TENANT_ID } })
  const recipes = await prisma.recipe.count({ where: { tenantId: TENANT_ID } })
  const inventory = await prisma.inventory.count({ where: { tenantId: TENANT_ID } })
  const handoffs = await prisma.materialHandoff.count({ where: { tenantId: TENANT_ID } })
  const qcs = await prisma.qualityCheck.count({ where: { tenantId: TENANT_ID } })
  const prs = await prisma.purchaseRequest.count({ where: { tenantId: TENANT_ID } })
  const vendors = await prisma.supplier.count({ where: { tenantId: TENANT_ID } })
  
  console.log(`   Orders: ${orders}`)
  console.log(`   Manufacturing Orders: ${mos}`)
  console.log(`   Jobsheets: ${jobsheets}`)
  console.log(`   Tasks: ${tasks}`)
  console.log(`   Recipes/BOMs: ${recipes}`)
  console.log(`   Inventory Items: ${inventory}`)
  console.log(`   Material Handoffs: ${handoffs}`)
  console.log(`   Quality Checks: ${qcs}`)
  console.log(`   Purchase Requests: ${prs}`)
  console.log(`   Vendors: ${vendors}`)
  
  console.log('\n🔐 DEMO LOGIN CREDENTIALS:')
  console.log('   - Admin: admin@ypti.com / demo123')
  console.log('   - PPIC: ppic@ypti.com / demo123')
  console.log('   - Manager: manager@ypti.com / demo123')
  console.log('   - Technician 1: tech1@ypti.com / demo123')
  console.log('   - Technician 2: tech2@ypti.com / demo123')
  
  console.log('\n🎯 KEY WORKFLOWS TO DEMONSTRATE:')
  console.log('   1. Complete Order Flow: ORD-2026-001 (AHM)')
  console.log('   2. Material Shortage: ORD-2026-002 (Yamaha) → PR-2026-001')
  console.log('   3. Outsourced Manufacturing: MO-2026-002 → VO-2026-001')
  console.log('   4. MRP Workflow: Run MRP on MO-2026-001 or MO-2026-003')
  console.log('   5. Material Handoffs: HO-2026-001, HO-2026-002')
  console.log('   6. Quality Control: QC-2026-001 with rework RW-2026-001')
  console.log('   7. Machine Breakdown: DRILL-001 (active breakdown)')
  console.log('=====================================================')
}

main()
  .catch((e) => {
    console.error('❌ COMPREHENSIVE SEED FAILED:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })