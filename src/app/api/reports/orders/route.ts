import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const TENANT_ID = 'tenant_ypti'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const dateFilter: any = {}
    if (startDate) dateFilter.gte = new Date(startDate)
    if (endDate) dateFilter.lte = new Date(endDate)

    const where: any = { tenantId: TENANT_ID }
    if (startDate || endDate) {
      where.createdAt = dateFilter
    }

    const orders = await db.order.findMany({
      where,
      include: {
        manufacturingOrders: {
          include: {
            jobsheets: {
              select: {
                jsNumber: true,
                status: true,
                progressPercent: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const statusDistribution = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const totalProgress = orders.reduce((sum, order) => sum + (order.progressPercent || 0), 0)
    const avgProgress = orders.length > 0 ? totalProgress / orders.length : 0

    const orderData = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      status: order.status,
      progressPercent: order.progressPercent || 0,
      plannedStartDate: order.plannedStartDate,
      plannedEndDate: order.plannedEndDate,
      actualStartDate: order.actualStartDate,
      actualEndDate: order.actualEndDate,
      notes: order.notes,
      moCount: order.manufacturingOrders.length,
      totalJobsheets: order.manufacturingOrders.reduce((sum, mo) => sum + mo.jobsheets.length, 0),
      manufacturingOrders: order.manufacturingOrders.map(mo => ({
        moNumber: mo.moNumber,
        name: mo.name,
        status: mo.status,
        isOutsourced: mo.isOutsourced,
        progressPercent: mo.progressPercent,
        jobsheets: mo.jobsheets,
      })),
    }))

    return NextResponse.json({
      success: true,
      reportType: 'orders',
      generatedAt: new Date().toISOString(),
      dateRange: { startDate, endDate },
      orders: orderData,
      summary: {
        total: orders.length,
        avgProgress: avgProgress.toFixed(1),
        statusDistribution,
        customers: [...new Set(orders.map(o => o.customerName))],
        inProgress: orders.filter(o => ['IN_PRODUCTION', 'MATERIAL_PREPARATION'].includes(o.status)).length,
        completed: orders.filter(o => o.status === 'DELIVERED' || o.status === 'CLOSED').length,
      },
    })
  } catch (error) {
    console.error('Error generating orders report:', error)
    return NextResponse.json(
      { error: 'Failed to generate orders report' },
      { status: 500 }
    )
  }
}
