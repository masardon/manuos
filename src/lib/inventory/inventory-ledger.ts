// Inventory Ledger Service for ManuOS
// Central inventory tracking system - the core of all operations
// Every material movement, consumption, and production output is tracked here

import { db } from '@/lib/db'

// ============================================
// Types
// ============================================

export type InventoryTransactionType = 
  | 'RECEIPT'           // Goods received from supplier
  | 'ISSUE'             // Issued to production
  | 'RETURN'            // Returned from production
  | 'TRANSFER'          // Transferred between locations
  | 'ADJUSTMENT'        // Manual adjustment
  | 'CONSUMPTION'       // Consumed in task
  | 'RESERVATION'       // Reserved for MO

export interface InventoryMovement {
  tenantId: string
  inventoryId: string
  type: InventoryTransactionType
  quantity: number  // Positive for IN, negative for OUT
  referenceType: string  // MO, TASK, ORDER, QC, HANDOFF, etc.
  referenceId: string
  fromLocationId?: string
  fromShelfId?: string
  toLocationId?: string
  toShelfId?: string
  performedBy: string
  notes?: string
}

export interface InventoryBalance {
  inventoryId: string
  partNumber: string
  name: string
  totalReceived: number
  totalIssued: number
  totalConsumed: number
  totalWasted: number
  currentBalance: number
  reservedQuantity: number
  availableQuantity: number
  lastTransactionAt: Date | null
}

export interface InventoryMovementHistory {
  id: string
  type: InventoryTransactionType
  quantity: number
  balance: number
  referenceType: string
  referenceId: string
  performedBy: string
  notes: string | null
  createdAt: Date
}

// ============================================
// Core Inventory Operations
// ============================================

/**
 * Record an inventory movement - THE CENTRAL FUNCTION
 * Every inventory change must go through this function
 */
export async function recordInventoryMovement(movement: InventoryMovement) {
  const { tenantId, inventoryId, type, quantity, referenceType, referenceId, 
          fromLocationId, fromShelfId, toLocationId, toShelfId, performedBy, notes } = movement

  return await db.$transaction(async (tx) => {
    // Get current inventory
    const inventory = await tx.inventory.findFirst({
      where: { id: inventoryId, tenantId }
    })

    if (!inventory) {
      throw new Error(`Inventory item not found: ${inventoryId}`)
    }

    const previousBalance = inventory.quantity
    const newBalance = previousBalance + quantity

    // Validate no negative balance
    if (newBalance < 0) {
      throw new Error(`Insufficient inventory. Current: ${previousBalance}, Attempted: ${quantity}`)
    }

    // Update inventory quantity
    await tx.inventory.update({
      where: { id: inventoryId },
      data: {
        quantity: newBalance,
        availableQty: Math.max(0, newBalance - inventory.reservedQty),
      }
    })

    // Create inventory transaction record
    const transactionNumber = `ITX-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
    const transaction = await tx.inventoryTransaction.create({
      data: {
        tenantId,
        inventoryId,
        type: type as any,
        quantity,
        balance: newBalance,
        fromLocation: fromLocationId,
        toLocation: toLocationId,
        referenceType,
        referenceId,
        createdBy: performedBy,
        notes,
      }
    })

    // Update inventory status based on quantity
    let newStatus = inventory.status
    if (newBalance <= 0) {
      newStatus = 'USED' // Closest to OUT_OF_STOCK
    } else if (newBalance <= (inventory.reorderPoint || 0)) {
      newStatus = 'AVAILABLE' // Keep as available
    } else if (inventory.status === 'USED') {
      newStatus = 'AVAILABLE'
    }

    if (newStatus !== inventory.status) {
      await tx.inventory.update({
        where: { id: inventoryId },
        data: { status: newStatus as any }
      })
    }

    // Emit SSE event for real-time updates
    emitInventoryEvent({
      type: 'INVENTORY_UPDATE',
      inventoryId,
      partNumber: inventory.partNumber,
      previousBalance,
      newBalance,
      change: quantity,
      transactionType: type,
      tenantId,
    })

    return { transaction, newBalance }
  })
}

/**
 * Get current inventory balance for an item
 */
export async function getInventoryBalance(
  tenantId: string,
  inventoryId: string
): Promise<InventoryBalance> {
  const inventory = await db.inventory.findFirst({
    where: { id: inventoryId, tenantId }
  })

  if (!inventory) {
    throw new Error(`Inventory item not found: ${inventoryId}`)
  }

  // Calculate totals from transactions
  const transactions = await db.inventoryTransaction.aggregate({
    where: { tenantId, inventoryId },
    _sum: { quantity: true }
  })

  // Get reserved quantity from active reservations
  const reservations = await db.inventoryReservation.aggregate({
    where: {
      tenantId,
      inventoryId,
      status: { in: ['ALLOCATED', 'CONFIRMED'] }
    },
    _sum: { quantity: true }
  })

  const totalMovement = transactions._sum.quantity || 0
  const reserved = reservations._sum.quantity || 0

  return {
    inventoryId,
    partNumber: inventory.partNumber,
    name: inventory.name,
    totalReceived: 0, // Calculated separately if needed
    totalIssued: 0,
    totalConsumed: 0,
    totalWasted: 0,
    currentBalance: inventory.quantity,
    reservedQuantity: reserved,
    availableQuantity: inventory.quantity - reserved,
    lastTransactionAt: inventory.receivedAt,
  }
}

/**
 * Get inventory movement history
 */
export async function getInventoryMovementHistory(
  tenantId: string,
  inventoryId: string,
  options?: {
    startDate?: Date
    endDate?: Date
    type?: InventoryTransactionType
    limit?: number
  }
): Promise<InventoryMovementHistory[]> {
  const where: any = { tenantId, inventoryId }

  if (options?.startDate) {
    where.createdAt = { ...where.createdAt, gte: options.startDate }
  }
  if (options?.endDate) {
    where.createdAt = { ...where.createdAt, lte: options.endDate }
  }
  if (options?.type) {
    where.type = options.type
  }

  const transactions = await db.inventoryTransaction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 100,
  })

  return transactions.map(t => ({
    id: t.id,
    type: t.type as InventoryTransactionType,
    quantity: t.quantity,
    balance: t.balance || 0,
    referenceType: t.referenceType || '',
    referenceId: t.referenceId || '',
    performedBy: t.createdBy || '',
    notes: t.notes,
    createdAt: t.createdAt,
  }))
}

// ============================================
// Production → Inventory Integration
// ============================================

/**
 * Record production output and update inventory atomically
 */
export async function recordProductionOutputToInventory(params: {
  tenantId: string
  productionOutputId: string
  partNumber: string
  productName: string
  goodQuantity: number
  reworkQuantity: number
  scrapQuantity: number
  locationId: string
  shelfId?: string
  batch?: string
  moId: string
  orderId: string
  performedBy: string
}) {
  const {
    tenantId, productionOutputId, partNumber, productName,
    goodQuantity, reworkQuantity, scrapQuantity,
    locationId, shelfId, batch, moId, orderId, performedBy
  } = params

  return await db.$transaction(async (tx) => {
    const results = {
      goodInventory: null as any,
      reworkInventory: null as any,
      scrapTransactions: [] as any[],
    }

    // 1. Handle GOOD quantity → Create/update finished goods inventory
    if (goodQuantity > 0) {
      // Find existing finished goods inventory or create new
      let finishedGoods = await tx.inventory.findFirst({
        where: {
          tenantId,
          partNumber,
          category: 'FINISHED_GOODS',
          locationId,
          status: { in: ['AVAILABLE'] }
        }
      })

      if (finishedGoods) {
        // Update existing
        const prevQty = finishedGoods.quantity
        finishedGoods = await tx.inventory.update({
          where: { id: finishedGoods.id },
          data: {
            quantity: { increment: goodQuantity },
            availableQty: { increment: goodQuantity },
          }
        })

        // Record transaction
        await tx.inventoryTransaction.create({
          data: {
            tenantId,
            inventoryId: finishedGoods.id,
            type: 'RECEIPT',
            quantity: goodQuantity,
            balance: finishedGoods.quantity,
            toLocation: locationId,
            referenceType: 'PRODUCTION_OUTPUT',
            referenceId: productionOutputId,
            createdBy: performedBy,
            notes: `Production output: ${goodQuantity} good units`,
          }
        })
      } else {
        // Create new finished goods inventory
        finishedGoods = await tx.inventory.create({
          data: {
            tenantId,
            partNumber,
            name: productName,
            quantity: goodQuantity,
            availableQty: goodQuantity,
            reservedQty: 0,
            reorderPoint: 10,
            unit: 'pcs',
            category: 'FINISHED_GOODS',
            status: 'AVAILABLE',
            locationId,
            shelfId,
            batch,
          }
        })

        // Record initial transaction
        await tx.inventoryTransaction.create({
          data: {
            tenantId,
            inventoryId: finishedGoods.id,
            type: 'RECEIPT',
            quantity: goodQuantity,
            balance: goodQuantity,
            toLocation: locationId,
            referenceType: 'PRODUCTION_OUTPUT',
            referenceId: productionOutputId,
            createdBy: performedBy,
            notes: `Production output: ${goodQuantity} good units (new item created)`,
          }
        })
      }

      results.goodInventory = finishedGoods
    }

    // 2. Handle REWORK quantity → Create rework inventory
    if (reworkQuantity > 0) {
      let reworkInventory = await tx.inventory.findFirst({
        where: {
          tenantId,
          partNumber,
          category: 'WIP',
          status: 'WIP'
        }
      })

      if (reworkInventory) {
        reworkInventory = await tx.inventory.update({
          where: { id: reworkInventory.id },
          data: { 
            quantity: { increment: reworkQuantity },
            availableQty: { increment: reworkQuantity }
          }
        })
      } else {
        reworkInventory = await tx.inventory.create({
          data: {
            tenantId,
            partNumber: `${partNumber}-REWORK`,
            name: `${productName} (Rework)`,
            quantity: reworkQuantity,
            availableQty: reworkQuantity,
            reservedQty: 0,
            reorderPoint: 0,
            unit: 'pcs',
            category: 'WIP',
            status: 'WIP',
            locationId,
            batch,
            notes: 'Requires rework before shipping',
          }
        })
      }

      // Record rework transaction
      await tx.inventoryTransaction.create({
        data: {
          tenantId,
          inventoryId: reworkInventory.id,
          type: 'RECEIPT',
          quantity: reworkQuantity,
          balance: reworkInventory.quantity,
          toLocation: locationId,
          referenceType: 'PRODUCTION_OUTPUT',
          referenceId: productionOutputId,
          createdBy: performedBy,
          notes: `QC failed: ${reworkQuantity} units marked for rework`,
        }
      })

      results.reworkInventory = reworkInventory
    }

    // 3. Handle SCRAP quantity → Record waste transaction
    if (scrapQuantity > 0) {
      // Create scrap transaction against a waste account
      const scrapTransaction = await tx.inventoryTransaction.create({
        data: {
          tenantId,
          inventoryId: 'SCRAP_ACCOUNT',  // Virtual account for scrap
          type: 'ADJUSTMENT',
          quantity: -scrapQuantity,
          balance: 0,
          referenceType: 'PRODUCTION_OUTPUT',
          referenceId: productionOutputId,
          createdBy: performedBy,
          notes: `Scrap: ${scrapQuantity} units`,
        }
      })

      results.scrapTransactions.push(scrapTransaction)
    }

    // 4. CONSUME raw materials from production
    // This should be called separately when task is completed
    // But we can create a record here for traceability
    await tx.inventoryTransaction.create({
      data: {
        tenantId,
        inventoryId: 'MATERIAL_CONSUMPTION',  // Virtual, actual consumption happens at task level
        type: 'CONSUMPTION',
        quantity: -(goodQuantity + reworkQuantity + scrapQuantity),
        balance: 0,
        referenceType: 'PRODUCTION_OUTPUT',
        referenceId: productionOutputId,
        createdBy: performedBy,
        notes: `Material consumption for ${goodQuantity + reworkQuantity + scrapQuantity} output units`,
      }
    })

    return results
  })
}

/**
 * Handle QC inspection and update inventory
 */
export async function handleQCInspectionAndUpdateInventory(params: {
  tenantId: string
  qualityCheckId: string
  productionOutputId: string
  result: 'PASS' | 'FAIL'
  goodQty: number
  reworkQty: number
  scrapQty: number
  inspectorId: string
  outputLocationId?: string
}) {
  const { tenantId, qualityCheckId, productionOutputId, result, goodQty, reworkQty, scrapQty, inspectorId, outputLocationId } = params

  return await db.$transaction(async (tx) => {
    // Get production output
    const output = await tx.productionOutput.findFirst({
      where: { id: productionOutputId, tenantId }
    })

    if (!output) {
      throw new Error('Production output not found')
    }

    const locationId = outputLocationId || output.outputLocationId || ''

    if (result === 'PASS') {
      // Move good units to finished goods inventory
      if (goodQty > 0) {
        await recordProductionOutputToInventory({
          tenantId,
          productionOutputId,
          partNumber: output.partNumber,
          productName: output.productName,
          goodQuantity: goodQty,
          reworkQuantity: 0,
          scrapQuantity: 0,
          locationId,
          moId: output.moId,
          orderId: output.orderId,
          performedBy: inspectorId,
        })
      }
    } else {
      // QC Failed - move rework to quarantine, record scrap
      if (reworkQty > 0 || scrapQty > 0) {
        await recordProductionOutputToInventory({
          tenantId,
          productionOutputId,
          partNumber: output.partNumber,
          productName: output.productName,
          goodQuantity: 0,
          reworkQuantity: reworkQty,
          scrapQuantity: scrapQty,
          locationId,
          moId: output.moId,
          orderId: output.orderId,
          performedBy: inspectorId,
        })
      }

      // Create rework order if rework quantity > 0
      if (reworkQty > 0) {
        const reworkNumber = `RW-${new Date().getFullYear()}-${String(Date.now()).slice(-3).padStart(3, '0')}`
        
        const reworkOrder = await tx.reworkOrder.create({
          data: {
            tenantId,
            reworkNumber,
            qualityCheckId,
            moId: output.moId,
            reworkType: 'REWORK',
            status: 'PENDING',
            priority: 'HIGH',
            partNumber: output.partNumber,
            productName: output.productName,
            quantity: reworkQty,
            defectDescription: `QC Failed: ${reworkQty} units require rework`,
            assignedToId: null,
          }
        })

        return { reworkOrder }
      }
    }

    return { success: true }
  })
}

// ============================================
// Material Issue to Production
// ============================================

/**
 * Issue materials from warehouse to production
 * This is called when materials are handed off to production floor
 */
export async function issueMaterialsToProduction(params: {
  tenantId: string
  inventoryId: string
  quantity: number
  toLocationId: string
  toShelfId?: string
  moId: string
  taskId?: string
  issuedBy: string
  notes?: string
}) {
  const { tenantId, inventoryId, quantity, toLocationId, toShelfId, moId, taskId, issuedBy, notes } = params

  return await recordInventoryMovement({
    tenantId,
    inventoryId,
    type: 'ISSUE',
    quantity: -quantity,  // Negative because leaving inventory
    referenceType: taskId ? 'TASK' : 'MO',
    referenceId: taskId || moId,
    toLocationId,
    toShelfId,
    performedBy: issuedBy,
    notes: notes || `Issued ${quantity} units to production`,
  })
}

/**
 * Return unused materials from production to warehouse
 */
export async function returnMaterialsToWarehouse(params: {
  tenantId: string
  inventoryId: string
  quantity: number
  fromLocationId: string
  fromShelfId?: string
  toLocationId: string
  toShelfId?: string
  moId: string
  returnedBy: string
  reason?: string
}) {
  const { tenantId, inventoryId, quantity, fromLocationId, fromShelfId, toLocationId, toShelfId, moId, returnedBy, reason } = params

  return await recordInventoryMovement({
    tenantId,
    inventoryId,
    type: 'RETURN',
    quantity: quantity,  // Positive because returning to inventory
    referenceType: 'MO',
    referenceId: moId,
    fromLocationId,
    fromShelfId,
    toLocationId,
    toShelfId,
    performedBy: returnedBy,
    notes: reason || `Returned ${quantity} units from production`,
  })
}

// ============================================
// Purchase Receipt → Inventory
// ============================================

/**
 * Receive purchased goods into inventory
 */
export async function receivePurchaseOrder(params: {
  tenantId: string
  purchaseOrderId: string
  items: {
    partNumber: string
    name: string
    quantity: number
    unit: string
    locationId: string
    shelfId?: string
    batch?: string
    costPrice?: number
  }[]
  receivedBy: string
}) {
  const { tenantId, purchaseOrderId, items, receivedBy } = params

  return await db.$transaction(async (tx) => {
    const results: any[] = []

    for (const item of items) {
      // Find existing inventory or create new
      let inventory = await tx.inventory.findFirst({
        where: {
          tenantId,
          partNumber: item.partNumber,
          locationId: item.locationId,
          status: { in: ['AVAILABLE'] }
        }
      })

      if (inventory) {
        // Update existing
        inventory = await tx.inventory.update({
          where: { id: inventory.id },
          data: {
            quantity: { increment: item.quantity },
            availableQty: { increment: item.quantity },
          }
        })
      } else {
        // Create new inventory
        inventory = await tx.inventory.create({
          data: {
            tenantId,
            partNumber: item.partNumber,
            name: item.name,
            quantity: item.quantity,
            availableQty: item.quantity,
            reservedQty: 0,
            reorderPoint: 10,
            unit: item.unit,
            category: 'RAW_MATERIAL',
            status: 'AVAILABLE',
            locationId: item.locationId,
            shelfId: item.shelfId,
            batch: item.batch,
            unitPrice: item.costPrice,
          }
        })
      }

      // Record receipt transaction
      await tx.inventoryTransaction.create({
        data: {
          tenantId,
          inventoryId: inventory.id,
          type: 'RECEIPT',
          quantity: item.quantity,
          balance: inventory.quantity,
          toLocation: item.locationId,
          referenceType: 'PURCHASE_ORDER',
          referenceId: purchaseOrderId,
          createdBy: receivedBy,
          notes: `Received from PO: ${item.quantity} ${item.unit}`,
        }
      })

      results.push(inventory)
    }

    // Update PO status
    await tx.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data: { status: 'RECEIVED' }
    })

    return results
  })
}

// ============================================
// Reservation System
// ============================================

/**
 * Reserve inventory for MO
 */
export async function reserveInventoryForMO(params: {
  tenantId: string
  inventoryId: string
  moId: string
  quantity: number
  reservedBy: string
}) {
  const { tenantId, inventoryId, moId, quantity, reservedBy } = params

  return await db.$transaction(async (tx) => {
    // Check available quantity
    const inventory = await tx.inventory.findFirst({
      where: { id: inventoryId, tenantId }
    })

    if (!inventory) {
      throw new Error('Inventory item not found')
    }

    // Check existing reservations
    const existingReservations = await tx.inventoryReservation.aggregate({
      where: {
        tenantId,
        inventoryId,
        status: { in: ['ALLOCATED', 'CONFIRMED'] }
      },
      _sum: { quantity: true }
    })

    const alreadyReserved = existingReservations._sum.quantity || 0
    const available = inventory.quantity - alreadyReserved

    if (quantity > available) {
      throw new Error(`Insufficient available quantity. Available: ${available}, Requested: ${quantity}`)
    }

    // Create reservation
    const reservation = await tx.inventoryReservation.create({
      data: {
        tenantId,
        inventoryId,
        moId,
        quantity,
        status: 'ALLOCATED',
        createdBy: reservedBy,
      }
    })

    // Update inventory quantities
    await tx.inventory.update({
      where: { id: inventoryId },
      data: {
        reservedQty: { increment: quantity },
        availableQty: { decrement: quantity },
        status: 'RESERVED'
      }
    })

    // Record reservation transaction
    await tx.inventoryTransaction.create({
      data: {
        tenantId,
        inventoryId,
        type: 'RESERVATION',
        quantity: 0,  // No quantity change, just reservation
        balance: inventory.quantity,
        referenceType: 'MO',
        referenceId: moId,
        createdBy: reservedBy,
        notes: `Reserved ${quantity} units for MO`,
      }
    })

    return reservation
  })
}

// ============================================
// Inventory Dashboard Data
// ============================================

/**
 * Get comprehensive inventory dashboard data
 */
export async function getInventoryDashboardData(tenantId: string) {
  const [
    totalItems,
    lowStockItems,
    outOfStockItems,
    totalValue,
    recentTransactions,
    byCategory,
    byLocation,
    pendingHandoffs,
    activeReservations,
  ] = await Promise.all([
    // Total inventory items
    db.inventory.count({
      where: { tenantId, status: { not: 'USED' } }
    }),

    // Low stock items
    db.inventory.findMany({
      where: {
        tenantId,
        status: 'AVAILABLE',
        quantity: { lte: db.inventory.fields.reorderPoint }
      },
      select: { partNumber: true, name: true, quantity: true, reorderPoint: true }
    }),

    // Out of stock items
    db.inventory.count({
      where: { tenantId, status: 'USED' }
    }),

    // Total inventory value
    db.inventory.aggregate({
      where: { tenantId },
      _sum: {
        quantity: true,
      }
    }),

    // Recent transactions (last 24 hours)
    db.inventoryTransaction.findMany({
      where: {
        tenantId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      },
      include: {
        inventory: {
          select: { partNumber: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),

    // Inventory by category
    db.inventory.groupBy({
      by: ['category'],
      where: { tenantId },
      _count: true,
      _sum: { quantity: true }
    }),

    // Inventory by location
    db.inventory.groupBy({
      by: ['locationId'],
      where: { tenantId },
      _count: true,
      _sum: { quantity: true }
    }),

    // Pending handoffs
    db.materialHandoff.count({
      where: { tenantId, status: { in: ['PENDING', 'CONFIRMED', 'IN_TRANSIT'] } }
    }),

    // Active reservations
    db.inventoryReservation.findMany({
      where: {
        tenantId,
        status: { in: ['ALLOCATED', 'CONFIRMED'] }
      },
      include: {
        inventory: {
          select: { partNumber: true, name: true }
        },
        mo: {
          select: { moNumber: true, name: true }
        }
      },
      take: 10,
    }),
  ])

  return {
    totalItems,
    lowStockItems,
    outOfStockItems,
    totalQuantity: totalItems > 0 ? totalValue._sum.quantity || 0 : 0,
    recentTransactions,
    byCategory,
    byLocation,
    pendingHandoffs,
    activeReservations,
  }
}

// ============================================
// SSE Event Emission
// ============================================

function emitInventoryEvent(event: {
  type: string
  inventoryId: string
  partNumber: string
  previousBalance: number
  newBalance: number
  change: number
  transactionType: string
  tenantId: string
}) {
  // This will be picked up by the SSE system
  // Using dynamic import to avoid circular dependency
  try {
    const { inventoryEventEmitter } = require('@/lib/events/inventory-events')
    inventoryEventEmitter.emitInventoryUpdate({
      inventoryId: event.inventoryId,
      partNumber: event.partNumber,
      previousQuantity: event.previousBalance,
      newQuantity: event.newBalance,
      changeType: event.transactionType as any,
      tenantId: event.tenantId,
    })
  } catch (e) {
    // SSE system not available, silently continue
    console.log('SSE event not emitted:', event.type)
  }
}

// ============================================
// Inventory Query Helpers
// ============================================

/**
 * Get inventory with full details
 */
export async function getInventoryWithDetails(tenantId: string, inventoryId: string) {
  return await db.inventory.findFirst({
    where: { id: inventoryId, tenantId },
    include: {
      locationRel: true,
      shelfRel: true,
      supplier: true,
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      reservations: {
        where: { status: { in: ['ALLOCATED', 'CONFIRMED'] } },
        include: { mo: { select: { moNumber: true } } },
      },
    }
  })
}

/**
 * Get all inventory for a specific part number
 */
export async function getInventoryByPartNumber(tenantId: string, partNumber: string) {
  return await db.inventory.findMany({
    where: { tenantId, partNumber },
    include: {
      locationRel: { select: { name: true, type: true } },
      shelfRel: { select: { name: true } },
    },
    orderBy: { quantity: 'desc' }
  })
}

/**
 * Check stock availability for a part number
 */
export async function checkStockAvailability(
  tenantId: string,
  partNumber: string,
  requiredQuantity: number
) {
  const inventoryItems = await db.inventory.findMany({
    where: {
      tenantId,
      partNumber,
      status: { in: ['AVAILABLE'] },
      quantity: { gt: 0 }
    },
    include: {
      reservations: {
        where: { status: { in: ['ALLOCATED', 'CONFIRMED'] } },
      }
    }
  })

  let totalAvailable = 0
  for (const item of inventoryItems) {
    const reserved = item.reservations.reduce((sum, r) => sum + (r.quantity || 0), 0)
    totalAvailable += Math.max(0, item.quantity - reserved)
  }

  return {
    partNumber,
    requiredQuantity,
    availableQuantity: totalAvailable,
    hasEnough: totalAvailable >= requiredQuantity,
    shortage: Math.max(0, requiredQuantity - totalAvailable),
    inventoryItems: inventoryItems.map(i => ({
      id: i.id,
      location: i.location,
      shelf: i.shelf,
      currentQuantity: i.quantity,
      batch: i.batch,
    }))
  }
}
