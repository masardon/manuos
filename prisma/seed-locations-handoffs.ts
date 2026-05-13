// Seed script for Locations and Material Handoffs demo
import { PrismaClient, LocationType } from '@prisma/client'
import { addDays, subDays } from 'date-fns'

const prisma = new PrismaClient()

const TENANT_ID = 'tenant_ypti'

async function main() {
  console.log('🏭 Seeding Locations and Handoff demo...')

  // Create default locations
  console.log('📍 Creating locations...')
  const locations = [
    { code: 'WH-01', name: 'Main Warehouse', type: 'WAREHOUSE' as const, description: 'Central warehouse', building: 'Building A', floor: '1', zone: 'Storage' },
    { code: 'RECV-01', name: 'Receiving Dock', type: 'RECEIVING' as const, description: 'Goods receiving area', building: 'Building A', floor: '1', zone: 'Dock' },
    { code: 'PPIC-01', name: 'PPIC Rack', type: 'PPIC_RACK' as const, description: 'Material preparation for production', building: 'Building A', floor: '1', zone: 'PPIC' },
    { code: 'PROD-01', name: 'Production Area', type: 'PRODUCTION_AREA' as const, description: 'Main production floor', building: 'Building B', floor: '1', zone: 'Production' },
    { code: 'WS-A1', name: 'Workstation A1 - CNC', type: 'WORKSTATION' as const, description: 'CNC Milling workstation', building: 'Building B', floor: '1', zone: 'Workshop A' },
    { code: 'WS-A2', name: 'Workstation A2 - Lathe', type: 'WORKSTATION' as const, description: 'CNC Lathe workstation', building: 'Building B', floor: '1', zone: 'Workshop A' },
    { code: 'WS-B1', name: 'Workstation B1 - Drill', type: 'WORKSTATION' as const, description: 'Drilling workstation', building: 'Building B', floor: '1', zone: 'Workshop B' },
    { code: 'WS-C1', name: 'Workstation C1 - Welding', type: 'WORKSTATION' as const, description: 'Welding station', building: 'Building B', floor: '1', zone: 'Assembly' },
    { code: 'QC-01', name: 'QC Area', type: 'QC_AREA' as const, description: 'Quality control inspection', building: 'Building C', floor: '1', zone: 'QC' },
    { code: 'TOOL-01', name: 'Tool Crib', type: 'TOOL_CRIB' as const, description: 'Tool storage', building: 'Building A', floor: '1', zone: 'Tools' },
    { code: 'SHIP-01', name: 'Shipping Area', type: 'SHIPPING' as const, description: 'Finished goods shipping', building: 'Building A', floor: '1', zone: 'Shipping' },
  ]

  for (const loc of locations) {
    await prisma.location.upsert({
      where: { tenantId_code: { tenantId: TENANT_ID, code: loc.code } },
      update: {},
      create: { tenantId: TENANT_ID, ...loc, isActive: true }
    })
  }

  // Create shelves for warehouse
  console.log('🗃️ Creating shelves...')
  const warehouse = await prisma.location.findUnique({ where: { tenantId_code: { tenantId: TENANT_ID, code: 'WH-01' } } })
  if (warehouse) {
    const shelves = ['A-01', 'A-02', 'A-03', 'B-01', 'B-02', 'B-03', 'C-01', 'C-02', 'C-03']
    for (const code of shelves) {
      await prisma.shelf.upsert({
        where: { tenantId_locationId_code: { tenantId: TENANT_ID, locationId: warehouse.id, code } },
        update: {},
        create: { tenantId: TENANT_ID, locationId: warehouse.id, code, name: `Shelf ${code}`, capacity: 50 }
      })
    }
  }

  const ppicRack = await prisma.location.findUnique({ where: { tenantId_code: { tenantId: TENANT_ID, code: 'PPIC-01' } } })
  if (ppicRack) {
    const shelves = ['P-A1', 'P-A2', 'P-B1', 'P-B2']
    for (const code of shelves) {
      await prisma.shelf.upsert({
        where: { tenantId_locationId_code: { tenantId: TENANT_ID, locationId: ppicRack.id, code } },
        update: {},
        create: { tenantId: TENANT_ID, locationId: ppicRack.id, code, name: `PPIC ${code}`, capacity: 20 }
      })
    }
  }

  // Update existing inventory with locations
  console.log('📦 Linking inventory to locations...')
  const inventoryItems = await prisma.inventory.findMany({ where: { tenantId: TENANT_ID } })
  
  for (const item of inventoryItems) {
    let locationId = warehouse?.id
    let shelfId = null
    
    // Assign to appropriate location based on category
    if (item.category === 'Tools') {
      const toolCrib = await prisma.location.findUnique({ where: { tenantId_code: { tenantId: TENANT_ID, code: 'TOOL-01' } } })
      locationId = toolCrib?.id
    } else if (item.location?.includes('WIP')) {
      const prodArea = await prisma.location.findUnique({ where: { tenantId_code: { tenantId: TENANT_ID, code: 'PROD-01' } } })
      locationId = prodArea?.id
    } else if (item.location?.includes('Finished')) {
      const shipping = await prisma.location.findUnique({ where: { tenantId_code: { tenantId: TENANT_ID, code: 'SHIP-01' } } })
      locationId = shipping?.id
    }
    
    // Get shelf for warehouse items
    if (locationId === warehouse?.id && item.shelf) {
      const shelf = await prisma.shelf.findUnique({
        where: { tenantId_locationId_code: { tenantId: TENANT_ID, locationId: warehouse.id, code: item.shelf } }
      })
      shelfId = shelf?.id
    }
    
    await prisma.inventory.update({
      where: { id: item.id },
      data: {
        locationId,
        shelfId,
        currentProcess: locationId === warehouse?.id ? 'WAREHOUSE' : 
                       locationId === ppicRack?.id ? 'PPIC' : 'PRODUCTION'
      }
    })
  }

  // Create a sample handoff: Warehouse → PPIC Rack
  console.log('🔄 Creating sample handoffs...')
  
  // Get some inventory to move
  const steelPlate = await prisma.inventory.findFirst({ 
    where: { tenantId: TENANT_ID, partNumber: 'MAT-STL-001' } 
  })
  
  // Get actual user IDs
  const warehouseUser = await prisma.user.findFirst({ where: { tenantId: TENANT_ID, email: 'warehouse@ypti.com' } })
  const ppicUser = await prisma.user.findFirst({ where: { tenantId: TENANT_ID, email: 'ppic@ypti.com' } })
  const adminUser = await prisma.user.findFirst({ where: { tenantId: TENANT_ID, email: 'admin@ypti.com' } })
  const handedByUser = warehouseUser?.id || adminUser?.id
  const receivedByUser = ppicUser?.id || adminUser?.id
  
  // Get MO
  const mo = await prisma.manufacturingOrder.findFirst({ where: { tenantId: TENANT_ID } })
  
  if (steelPlate && warehouse && ppicRack && handedByUser) {
    // Create handoff from Warehouse to PPIC
    const handoff = await prisma.materialHandoff.upsert({
      where: { tenantId_handoffNumber: { tenantId: TENANT_ID, handoffNumber: 'HO-2026-001' } },
      update: {},
      create: {
        tenantId: TENANT_ID,
        handoffNumber: 'HO-2026-001',
        fromLocationId: warehouse.id,
        toLocationId: ppicRack.id,
        handedBy: handedByUser,
        fromPicUserId: handedByUser,
        toPicUserId: receivedByUser,
        handoffType: 'MATERIAL_REQUEST',
        referenceType: 'MO',
        moId: mo?.id,
        status: 'CONFIRMED',
        handedAt: subDays(new Date(), 2),
        receivedAt: subDays(new Date(), 2),
        receivedBy: receivedByUser,
        notes: 'Steel plates moved to PPIC for production preparation',
      }
    })

    // Create handoff item
    await prisma.materialHandoffItem.create({
      data: {
        tenantId: TENANT_ID,
        handoffId: handoff.id,
        inventoryId: steelPlate.id,
        partNumber: steelPlate.partNumber,
        name: steelPlate.name,
        quantity: 20,
        unit: steelPlate.unit || 'sheets',
        fromShelf: 'A-01',
        toShelf: 'P-A1',
        condition: 'GOOD',
      }
    })

    // Create transaction log
    await prisma.inventoryTransaction.create({
      data: {
        tenantId: TENANT_ID,
        inventoryId: steelPlate.id,
        type: 'TRANSFER',
        quantity: 0,
        balance: steelPlate.quantity,
        fromLocation: 'Main Warehouse',
        toLocation: 'PPIC Rack',
        referenceType: 'HANDOFF',
        referenceId: handoff.id,
        handoffStatus: 'CONFIRMED',
        notes: 'Handoff HO-2026-001',
        createdBy: 'user-warehouse',
      }
    })

    // Update inventory location
    await prisma.inventory.update({
      where: { id: steelPlate.id },
      data: {
        locationId: ppicRack.id,
        currentProcess: 'PPIC',
      }
    })
  }

  // Create second handoff: PPIC → Workstation (pending)
  const aluminumBar = await prisma.inventory.findFirst({ 
    where: { tenantId: TENANT_ID, partNumber: 'MAT-ALU-001' } 
  })
  
  const workstation = await prisma.location.findUnique({ 
    where: { tenantId_code: { tenantId: TENANT_ID, code: 'WS-A1' } } 
  })
  
  if (aluminumBar && ppicRack && workstation && ppicUser) {
    const handoff2 = await prisma.materialHandoff.upsert({
      where: { tenantId_handoffNumber: { tenantId: TENANT_ID, handoffNumber: 'HO-2026-002' } },
      update: {},
      create: {
        tenantId: TENANT_ID,
        handoffNumber: 'HO-2026-002',
        fromLocationId: ppicRack.id,
        toLocationId: workstation.id,
        handedBy: ppicUser.id,
        fromPicUserId: ppicUser.id,
        handoffType: 'ISSUE_TO_PRODUCTION',
        referenceType: 'MO',
        moId: mo?.id,
        status: 'IN_TRANSIT', // In transit - awaiting confirmation
        handedAt: new Date(),
        notes: 'Aluminum bars issued to CNC workstation for production',
      }
    })

    await prisma.materialHandoffItem.create({
      data: {
        tenantId: TENANT_ID,
        handoffId: handoff2.id,
        inventoryId: aluminumBar.id,
        partNumber: aluminumBar.partNumber,
        name: aluminumBar.name,
        quantity: 15,
        unit: aluminumBar.unit || 'bars',
        fromShelf: 'P-B1',
        condition: 'GOOD',
      }
    })
  }

  console.log('✅ Locations and handoffs seeded successfully!')
  console.log('\n📍 Locations:')
  console.log(`   - ${locations.length} locations created`)
  console.log(`   - Warehouse: WH-01 (9 shelves)`)
  console.log(`   - PPIC Rack: PPIC-01 (4 shelves)`)
  console.log(`   - ${locations.filter(l => l.type === 'WORKSTATION').length} Workstations`)
  console.log('\n🔄 Handoffs:')
  console.log(`   - HO-2026-001: Warehouse → PPIC Rack (CONFIRMED)`)
  console.log(`   - HO-2026-002: PPIC Rack → Workstation A1 (IN_TRANSIT)`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
