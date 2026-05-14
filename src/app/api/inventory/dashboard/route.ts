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
        where: { tenantId, status: { not: 'SCRAPPED' } }
      }),

      // Low stock items
      db.inventory.findMany({
        where: {
          tenantId,
          status: 'LOW_STOCK',
        },
        select: { partNumber: true, name: true, currentQuantity: true, minimumQuantity: true },
        take: 20,
      }),

      // Out of stock items
      db.inventory.count({
        where: { tenantId, status: 'OUT_OF_STOCK' }
      }),

      // Total inventory quantity
      db.inventory.aggregate({
        where: { tenantId },
        _sum: { currentQuantity: true }
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
        _sum: { currentQuantity: true }
      }),

      // Inventory by location
      db.inventory.groupBy({
        by: ['locationId'],
        where: { tenantId },
        _count: true,
        _sum: { currentQuantity: true }
      }),

      // Pending handoffs
      db.materialHandoff.count({
        where: { tenantId, status: { in: ['PENDING', 'CONFIRMED', 'HANDED'] } }
      }),

      // Active reservations
      db.inventoryReservation.findMany({
        where: {
          tenantId,
          status: { in: ['ACTIVE', 'PARTIALLY_FULFILLED'] }
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

    return NextResponse.json({
      totalItems,
      lowStockItems,
      outOfStockItems,
      totalQuantity: totalQuantity._sum.currentQuantity || 0,
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
