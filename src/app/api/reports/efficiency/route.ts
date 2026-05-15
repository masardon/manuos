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

    const machines = await db.machine.findMany({
      where: {
        tenantId: TENANT_ID,
        isActive: true,
      },
      include: {
        machiningTasks: {
          where: startDate || endDate ? { createdAt: dateFilter } : undefined,
          select: {
            id: true,
            taskNumber: true,
            name: true,
            status: true,
            plannedHours: true,
            actualHours: true,
            clockedInAt: true,
            clockedOutAt: true,
            jobsheet: {
              select: {
                jsNumber: true,
                name: true,
                manufacturingOrder: {
                  select: {
                    moNumber: true,
                    name: true,
                    order: {
                      select: { orderNumber: true, customerName: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    const machineData = machines.map((machine) => {
      const plannedHours = machine.machiningTasks.reduce((sum, t) => sum + (t.plannedHours || 0), 0)
      const actualHours = machine.machiningTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0)
      const completedTasks = machine.machiningTasks.filter(t => t.status === 'COMPLETED').length
      const machineEfficiency = plannedHours > 0 ? (actualHours / plannedHours) * 100 : 0

      return {
        id: machine.id,
        code: machine.code,
        name: machine.name,
        type: machine.type || 'N/A',
        status: machine.status,
        taskCount: machine.machiningTasks.length,
        completedTasks,
        plannedHours: plannedHours.toFixed(2),
        actualHours: actualHours.toFixed(2),
        efficiency: machineEfficiency.toFixed(1),
        utilization: machine.machiningTasks.length > 0
          ? ((completedTasks / machine.machiningTasks.length) * 100).toFixed(1)
          : '0.0',
        tasks: machine.machiningTasks.map(t => ({
          taskNumber: t.taskNumber,
          name: t.name,
          status: t.status,
          plannedHours: t.plannedHours,
          actualHours: t.actualHours,
          jobsheet: t.jobsheet.jsNumber,
          mo: t.jobsheet.manufacturingOrder.moNumber,
          order: t.jobsheet.manufacturingOrder.order.orderNumber,
          customer: t.jobsheet.manufacturingOrder.order.customerName,
        })),
      }
    })

    const totalPlannedHours = machineData.reduce((sum, m) => sum + parseFloat(m.plannedHours), 0)
    const totalActualHours = machineData.reduce((sum, m) => sum + parseFloat(m.actualHours), 0)
    const totalTasks = machineData.reduce((sum, m) => sum + m.taskCount, 0)
    const totalCompleted = machineData.reduce((sum, m) => sum + m.completedTasks, 0)

    return NextResponse.json({
      success: true,
      reportType: 'efficiency',
      generatedAt: new Date().toISOString(),
      dateRange: { startDate, endDate },
      machines: machineData,
      summary: {
        totalMachines: machines.length,
        activeMachines: machineData.filter(m => m.status === 'RUNNING').length,
        idleMachines: machineData.filter(m => m.status === 'IDLE').length,
        totalTasks,
        completedTasks: totalCompleted,
        plannedHours: totalPlannedHours.toFixed(2),
        actualHours: totalActualHours.toFixed(2),
        overallEfficiency: totalPlannedHours > 0
          ? ((totalActualHours / totalPlannedHours) * 100).toFixed(1)
          : '0.0',
        overallUtilization: totalTasks > 0
          ? ((totalCompleted / totalTasks) * 100).toFixed(1)
          : '0.0',
      },
    })
  } catch (error) {
    console.error('Error generating efficiency report:', error)
    return NextResponse.json(
      { error: 'Failed to generate efficiency report' },
      { status: 500 }
    )
  }
}
