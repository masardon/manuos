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
              include: {
                machiningTasks: {
                  select: {
                    id: true,
                    taskNumber: true,
                    name: true,
                    status: true,
                    plannedHours: true,
                    actualHours: true,
                    progressPercent: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const orderData = orders.map((order) => {
      const allTasks = order.manufacturingOrders.flatMap(mo =>
        mo.jobsheets.flatMap(js => js.machiningTasks)
      )
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        status: order.status,
        progressPercent: order.progressPercent || 0,
        plannedStartDate: order.plannedStartDate,
        plannedEndDate: order.plannedEndDate,
        actualStartDate: order.actualStartDate,
        actualEndDate: order.actualEndDate,
        moCount: order.manufacturingOrders.length,
        jobsheetCount: order.manufacturingOrders.reduce((sum, mo) => sum + mo.jobsheets.length, 0),
        taskCount: allTasks.length,
        completedTasks: allTasks.filter(t => t.status === 'COMPLETED').length,
        totalPlannedHours: allTasks.reduce((sum, t) => sum + (t.plannedHours || 0), 0),
        totalActualHours: allTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0),
        manufacturingOrders: order.manufacturingOrders.map(mo => ({
          moNumber: mo.moNumber,
          name: mo.name,
          status: mo.status,
          progressPercent: mo.progressPercent,
          jobsheets: mo.jobsheets.map(js => ({
            jsNumber: js.jsNumber,
            name: js.name,
            status: js.status,
            tasks: js.machiningTasks.map(t => ({
              taskNumber: t.taskNumber,
              name: t.name,
              status: t.status,
              plannedHours: t.plannedHours,
              actualHours: t.actualHours,
            })),
          })),
        })),
      }
    })

    return NextResponse.json({
      success: true,
      reportType: 'production',
      generatedAt: new Date().toISOString(),
      dateRange: { startDate, endDate },
      orders: orderData,
      summary: {
        totalOrders: orders.length,
        totalMOs: orderData.reduce((sum, o) => sum + o.moCount, 0),
        totalJobsheets: orderData.reduce((sum, o) => sum + o.jobsheetCount, 0),
        totalTasks: orderData.reduce((sum, o) => sum + o.taskCount, 0),
        completedTasks: orderData.reduce((sum, o) => sum + o.completedTasks, 0),
        totalPlannedHours: orderData.reduce((sum, o) => sum + o.totalPlannedHours, 0),
        totalActualHours: orderData.reduce((sum, o) => sum + o.totalActualHours, 0),
      },
    })
  } catch (error) {
    console.error('Error generating production report:', error)
    return NextResponse.json(
      { error: 'Failed to generate production report' },
      { status: 500 }
    )
  }
}
