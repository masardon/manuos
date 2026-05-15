import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEMO_TENANT_ID = 'tenant_ypti'

// GET /api/inventory/dashboard - Get inventory dashboard data
export async function GET(request: NextRequest) {
  try {
    const tenantId = DEMO_TENANT_ID

    const [
      totalItems,
      lowStockItems,
      outOfStockItems,
      totalQuantity,
      recentTransactions,
      byCategory,
      byLocation,
      pendingHandoffs,
      activeReservations,
    ] = await Promise.all([
      // Total inventory items
      db.inventory.count({
        where: { tenantId, status: { notIn: ['USED', 'EXPIRED'] } }
      }),

      // Low stock items - fetch items with reorderPoint and filter
      db.inventory.findMany({
        where: {
          tenantId,
          availableQty: { gt: 0 },
          reorderPoint: { not: null, gt: 0 },
        },
        select: { partNumber: true, name: true, quantity: true, reorderPoint: true },
        orderBy: { quantity: 'asc' },
        take: 50,
      }),

      // Out of stock items
      db.inventory.count({
        where: { tenantId, quantity: { equals: 0 } }
      }),

      // Total inventory quantity
      db.inventory.aggregate({
        where: { tenantId },
        _sum: { quantity: true }
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
        where: { tenantId, category: { not: null } },
        _count: true,
        _sum: { quantity: true }
      }),

      // Inventory by location
      db.inventory.groupBy({
        by: ['locationId'],
        where: { tenantId, locationId: { not: null } },
        _count: true,
        _sum: { quantity: true }
      }),

      // Pending handoffs
      db.materialHandoff.count({
        where: { tenantId, status: { in: ['PENDING', 'IN_TRANSIT'] } }
      }),

      // Active reservations
      db.inventoryReservation.findMany({
        where: {
          tenantId,
          status: { in: ['ALLOCATED', 'CONFIRMED', 'PARTIALLY_CONSUMED'] }
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

    // Filter low stock items where quantity <= reorderPoint
    const filteredLowStockItems = lowStockItems.filter(
      item => item.reorderPoint !== null && item.reorderPoint > 0 && item.quantity <= item.reorderPoint
    )

    return NextResponse.json({
      totalItems,
      lowStockItems: filteredLowStockItems,
      outOfStockItems,
      totalQuantity: totalQuantity._sum.quantity || 0,
      recentTransactions,
      byCategory,
      byLocation,
      pendingHandoffs,
      activeReservations,
    })
  } catch (error) {
    console.error('Error fetching inventory dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory dashboard data' },
      { status: 500 }
    )
  }
}
