// Material Handoff Service - Digital Handoffs for Material Movement
// Tracks material movement between locations and processes

import { db } from '@/lib/db'

export interface HandoffInput {
  fromLocationId: string
  toLocationId: string
  handedBy: string
  fromPicUserId?: string
  toPicUserId?: string
  handoffType?: 'STOCK_TRANSFER' | 'MATERIAL_REQUEST' | 'ISSUE_TO_PRODUCTION' | 'CONSUMPTION_RETURN' | 'QC_TRANSFER' | 'REWORK' | 'ADJUSTMENT'
  referenceType?: string
  referenceId?: string
  moId?: string
  jobsheetId?: string
  taskId?: string
  notes?: string
  deliveryNote?: string
  items: HandoffItemInput[]
}

export interface HandoffItemInput {
  inventoryId: string
  quantity: number
  unit?: string
  fromBatch?: string
  toBatch?: string
  fromShelf?: string
  toShelf?: string
  condition?: string
  materialRequirementId?: string
}

export interface LocationInput {
  code: string
  name: string
  type: 'WAREHOUSE' | 'PPIC_RACK' | 'PRODUCTION_AREA' | 'WORKSTATION' | 'QC_AREA' | 'TOOL_CRIB' | 'SHIPPING' | 'RECEIVING'
  description?: string
  parentLocationId?: string
  capacity?: number
  area?: number
  picUserId?: string
  building?: string
  floor?: string
  zone?: string
}

export interface ShelfInput {
  locationId: string
  code: string
  name: string
  description?: string
  row?: string
  column?: string
  level?: string
  capacity?: number
}

/**
 * Create a new location
 */
export async function createLocation(
  tenantId: string,
  data: LocationInput,
  createdBy: string
) {
  const location = await db.location.create({
    data: {
      tenantId,
      ...data,
      createdBy,
    }
  })
  
  return location
}

/**
 * Create a shelf in a location
 */
export async function createShelf(
  tenantId: string,
  data: ShelfInput,
  createdBy: string
) {
  const shelf = await db.shelf.create({
    data: {
      tenantId,
      ...data,
      createdBy,
    }
  })
  
  return shelf
}

/**
 * Create material handoff between locations
 */
export async function createMaterialHandoff(
  tenantId: string,
  data: HandoffInput
) {
  // Generate handoff number
  const handoffCount = await db.materialHandoff.count({ where: { tenantId } })
  const handoffNumber = `HO-${new Date().getFullYear()}-${String(handoffCount + 1).padStart(4, '0')}`
  
  // Validate locations exist
  const fromLocation = await db.location.findFirst({
    where: { id: data.fromLocationId, tenantId }
  })
  const toLocation = await db.location.findFirst({
    where: { id: data.toLocationId, tenantId }
  })
  
  if (!fromLocation || !toLocation) {
    throw new Error('Invalid location IDs')
  }
  
  // Create handoff with items in transaction
  const result = await db.$transaction(async (tx) => {
    // Create handoff
    const handoff = await tx.materialHandoff.create({
      data: {
        tenantId,
        handoffNumber,
        fromLocationId: data.fromLocationId,
        toLocationId: data.toLocationId,
        handedBy: data.handedBy,
        fromPicUserId: data.fromPicUserId,
        toPicUserId: data.toPicUserId,
        handoffType: data.handoffType || 'STOCK_TRANSFER',
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        moId: data.moId,
        jobsheetId: data.jobsheetId,
        taskId: data.taskId,
        status: 'PENDING',
        notes: data.notes,
        deliveryNote: data.deliveryNote,
        createdBy: data.handedBy,
      }
    })
    
    // Create handoff items and update inventory locations
    for (const item of data.items) {
      // Create handoff item
      await tx.materialHandoffItem.create({
        data: {
          tenantId,
          handoffId: handoff.id,
          inventoryId: item.inventoryId,
          materialRequirementId: item.materialRequirementId,
          partNumber: (await tx.inventory.findUnique({ where: { id: item.inventoryId } }))?.partNumber || '',
          name: (await tx.inventory.findUnique({ where: { id: item.inventoryId } }))?.name || '',
          quantity: item.quantity,
          unit: item.unit,
          fromBatch: item.fromBatch,
          toBatch: item.toBatch,
          fromShelf: item.fromShelf,
          toShelf: item.toShelf,
          condition: item.condition || 'GOOD',
        }
      })
      
      // Update inventory location
      await tx.inventory.update({
        where: { id: item.inventoryId },
        data: {
          locationId: data.toLocationId,
          currentProcess: toLocation.type,
        }
      })
      
      // Create transaction log
      await tx.inventoryTransaction.create({
        data: {
          tenantId,
          inventoryId: item.inventoryId,
          type: 'TRANSFER',
          quantity: 0, // No quantity change, just location
          balance: (await tx.inventory.findUnique({ where: { id: item.inventoryId } }))?.quantity || 0,
          fromLocation: fromLocation.name,
          toLocation: toLocation.name,
          referenceType: 'HANDOFF',
          referenceId: handoff.id,
          handoffStatus: 'PENDING',
          notes: `Handoff: ${handoffNumber}`,
          createdBy: data.handedBy,
        }
      })
    }
    
    return handoff
  })
  
  return result
}

/**
 * Confirm handoff receipt
 */
export async function confirmHandoffReceipt(
  tenantId: string,
  handoffId: string,
  receivedBy: string,
  notes?: string
) {
  const handoff = await db.materialHandoff.findFirst({
    where: { id: handoffId, tenantId },
    include: {
      items: true,
      fromLocation: true,
      toLocation: true,
    }
  })
  
  if (!handoff) {
    throw new Error('Handoff not found')
  }
  
  if (handoff.status !== 'PENDING' && handoff.status !== 'IN_TRANSIT') {
    throw new Error(`Cannot confirm handoff with status ${handoff.status}`)
  }
  
  const result = await db.$transaction(async (tx) => {
    // Update handoff status
    const updatedHandoff = await tx.materialHandoff.update({
      where: { id: handoffId },
      data: {
        status: 'CONFIRMED',
        receivedBy,
        receivedAt: new Date(),
        notes: notes || handoff.notes,
      }
    })
    
    // Update transaction logs
    await tx.inventoryTransaction.updateMany({
      where: {
        referenceType: 'HANDOFF',
        referenceId: handoffId,
      },
      data: {
        handoffStatus: 'CONFIRMED',
      }
    })
    
    // Update material requirements if linked
    for (const item of handoff.items) {
      if (item.materialRequirementId) {
        // Update received quantity
        await tx.materialRequirement.update({
          where: { id: item.materialRequirementId },
          data: {
            receivedQty: { increment: item.quantity }
          }
        })
      }
    }
    
    return updatedHandoff
  })
  
  return result
}

/**
 * Issue materials from warehouse to production
 */
export async function issueToProduction(
  tenantId: string,
  moId: string,
  items: Array<{
    inventoryId: string
    quantity: number
    materialRequirementId?: string
  }>,
  issuedBy: string,
  toWorkstationId?: string
) {
  // Get warehouse location
  const warehouse = await db.location.findFirst({
    where: { tenantId, type: 'WAREHOUSE', isActive: true }
  })
  
  // Get production or workstation location
  const productionLocation = toWorkstationId 
    ? await db.location.findUnique({ where: { id: toWorkstationId } })
    : await db.location.findFirst({ where: { tenantId, type: 'PRODUCTION_AREA', isActive: true } })
  
  if (!warehouse || !productionLocation) {
    throw new Error('Warehouse or Production location not found')
  }
  
  // Create handoff
  const handoff = await createMaterialHandoff(tenantId, {
    fromLocationId: warehouse.id,
    toLocationId: productionLocation.id,
    handedBy: issuedBy,
    handoffType: 'ISSUE_TO_PRODUCTION',
    referenceType: 'MO',
    referenceId: moId,
    moId,
    notes: `Materials issued to production for MO`,
    items: items.map(item => ({
      inventoryId: item.inventoryId,
      quantity: item.quantity,
      materialRequirementId: item.materialRequirementId,
    }))
  })
  
  // Auto-confirm for immediate issue
  await confirmHandoffReceipt(tenantId, handoff.id, issuedBy, 'Materials received at production')
  
  return handoff
}

/**
 * Get handoff history for a location
 */
export async function getLocationHandoffHistory(
  tenantId: string,
  locationId: string,
  days: number = 30
) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  const handoffs = await db.materialHandoff.findMany({
    where: {
      tenantId,
      OR: [
        { fromLocationId: locationId },
        { toLocationId: locationId }
      ],
      createdAt: { gte: startDate }
    },
    include: {
      fromLocation: { select: { name: true, type: true } },
      toLocation: { select: { name: true, type: true } },
      handedByUser: { select: { name: true } },
      receivedByUser: { select: { name: true } },
      items: {
        include: {
          inventory: { select: { partNumber: true, name: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
  
  return handoffs
}

/**
 * Get handoff history for a specific MO
 */
export async function getMOHandoffHistory(
  tenantId: string,
  moId: string
) {
  const handoffs = await db.materialHandoff.findMany({
    where: {
      tenantId,
      moId
    },
    include: {
      fromLocation: { select: { name: true, type: true } },
      toLocation: { select: { name: true, type: true } },
      handedByUser: { select: { name: true } },
      receivedByUser: { select: { name: true } },
      items: {
        include: {
          inventory: { select: { partNumber: true, name: true, location: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
  
  return handoffs
}

/**
 * Get material tracking summary for MO
 * Shows full journey of materials from warehouse to consumption
 */
export async function getMaterialTrackingSummary(
  tenantId: string,
  moId: string
) {
  // Get material requirements
  const requirements = await db.materialRequirement.findMany({
    where: { tenantId, moId },
    include: {
      inventory: { select: { id: true, partNumber: true, name: true, location: true } },
      reservations: true,
      handoffItems: {
        include: {
          handoff: {
            include: {
              fromLocation: { select: { name: true } },
              toLocation: { select: { name: true } },
              handedByUser: { select: { name: true } },
              receivedByUser: { select: { name: true } },
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  })
  
  // Build tracking timeline for each requirement
  const tracking = requirements.map(req => {
    const timeline = req.handoffItems.map(hi => ({
      date: hi.handoff.requestedAt,
      from: hi.handoff.fromLocation.name,
      to: hi.handoff.toLocation.name,
      quantity: hi.quantity,
      status: hi.handoff.status,
      handedBy: hi.handoff.handedByUser?.name,
      receivedBy: hi.handoff.receivedByUser?.name,
    }))
    
    return {
      partNumber: req.partNumber,
      name: req.name,
      requiredQty: req.requiredQty,
      reservedQty: req.reservedQty,
      receivedQty: req.receivedQty,
      consumedQty: req.consumedQty,
      status: req.status,
      currentLocation: req.inventory?.location,
      timeline,
    }
  })
  
  return tracking
}

/**
 * Initialize default locations for a tenant
 */
export async function initializeDefaultLocations(
  tenantId: string,
  createdBy: string
) {
  const locations = [
    { code: 'WH-01', name: 'Main Warehouse', type: 'WAREHOUSE' as const, description: 'Central warehouse for raw materials and finished goods' },
    { code: 'PPIC-01', name: 'PPIC Rack', type: 'PPIC_RACK' as const, description: 'Material preparation area for PPIC' },
    { code: 'PROD-01', name: 'Production Area', type: 'PRODUCTION_AREA' as const, description: 'Main production floor' },
    { code: 'WS-A1', name: 'Workstation A1', type: 'WORKSTATION' as const, description: 'CNC Milling workstation', parentLocationId: undefined },
    { code: 'WS-A2', name: 'Workstation A2', type: 'WORKSTATION' as const, description: 'CNC Lathe workstation' },
    { code: 'QC-01', name: 'QC Area', type: 'QC_AREA' as const, description: 'Quality control inspection area' },
    { code: 'TOOL-01', name: 'Tool Crib', type: 'TOOL_CRIB' as const, description: 'Tool and consumable storage' },
    { code: 'SHIP-01', name: 'Shipping Area', type: 'SHIPPING' as const, description: 'Finished goods staging for delivery' },
    { code: 'RECV-01', name: 'Receiving Dock', type: 'RECEIVING' as const, description: 'Incoming goods receiving area' },
  ]
  
  const createdLocations = []
  for (const loc of locations) {
    const location = await db.location.upsert({
      where: { tenantId_code: { tenantId, code: loc.code } },
      update: {},
      create: {
        tenantId,
        ...loc,
        isActive: true,
      }
    })
    createdLocations.push(location)
  }
  
  // Create shelves for warehouse and PPIC rack
  const warehouse = createdLocations.find(l => l.code === 'WH-01')
  if (warehouse) {
    const shelves = ['A-01', 'A-02', 'A-03', 'B-01', 'B-02', 'B-03', 'C-01', 'C-02']
    for (const shelfCode of shelves) {
      await db.shelf.upsert({
        where: { tenantId_locationId_code: { tenantId, locationId: warehouse.id, code: shelfCode } },
        update: {},
        create: {
          tenantId,
          locationId: warehouse.id,
          code: shelfCode,
          name: `Shelf ${shelfCode}`,
          capacity: 50,
        }
      })
    }
  }
  
  const ppicRack = createdLocations.find(l => l.code === 'PPIC-01')
  if (ppicRack) {
    const shelves = ['PPIC-A1', 'PPIC-A2', 'PPIC-B1', 'PPIC-B2']
    for (const shelfCode of shelves) {
      await db.shelf.upsert({
        where: { tenantId_locationId_code: { tenantId, locationId: ppicRack.id, code: shelfCode } },
        update: {},
        create: {
          tenantId,
          locationId: ppicRack.id,
          code: shelfCode,
          name: `PPIC Rack ${shelfCode}`,
          capacity: 30,
        }
      })
    }
  }
  
  return createdLocations
}

/**
 * Move materials from Warehouse to PPIC Rack
 */
export async function moveToPPICRack(
  tenantId: string,
  moId: string,
  items: Array<{
    inventoryId: string
    quantity: number
    materialRequirementId?: string
  }>,
  movedBy: string
) {
  const warehouse = await db.location.findFirst({
    where: { tenantId, code: 'WH-01' }
  })
  
  const ppicRack = await db.location.findFirst({
    where: { tenantId, code: 'PPIC-01' }
  })
  
  if (!warehouse || !ppicRack) {
    throw new Error('Default locations not found. Run initializeDefaultLocations first.')
  }
  
  return createMaterialHandoff(tenantId, {
    fromLocationId: warehouse.id,
    toLocationId: ppicRack.id,
    handedBy: movedBy,
    handoffType: 'MATERIAL_REQUEST',
    referenceType: 'MO',
    referenceId: moId,
    moId,
    notes: `Materials moved to PPIC Rack for MO preparation`,
    items: items.map(item => ({
      inventoryId: item.inventoryId,
      quantity: item.quantity,
      materialRequirementId: item.materialRequirementId,
    }))
  })
}

/**
 * Distribute from PPIC Rack to Workstation
 */
export async function distributeToWorkstation(
  tenantId: string,
  moId: string,
  jobsheetId: string,
  workstationId: string,
  items: Array<{
    inventoryId: string
    quantity: number
    taskId?: string
  }>,
  distributedBy: string
) {
  const ppicRack = await db.location.findFirst({
    where: { tenantId, code: 'PPIC-01' }
  })
  
  const workstation = await db.location.findUnique({
    where: { id: workstationId }
  })
  
  if (!ppicRack || !workstation) {
    throw new Error('Locations not found')
  }
  
  return createMaterialHandoff(tenantId, {
    fromLocationId: ppicRack.id,
    toLocationId: workstationId,
    handedBy: distributedBy,
    handoffType: 'ISSUE_TO_PRODUCTION',
    referenceType: 'JOBSHEET',
    referenceId: jobsheetId,
    moId,
    jobsheetId,
    notes: `Materials distributed to workstation for jobsheet execution`,
    items: items.map(item => ({
      inventoryId: item.inventoryId,
      quantity: item.quantity,
    }))
  })
}
