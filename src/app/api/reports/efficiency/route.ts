import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/reports/efficiency - Get efficiency data
export async function GET(request: NextRequest) {
  try {
    const machines = await db.machine.findMany({
      where: {
        tenantId: 'tenant_default',
      },
      include: {
        tasks: true,
      },
    })

    const totalPlannedHours = machines.reduce((sum, m) =>
      sum + m.tasks.reduce((s, t) => s + (t.plannedHours || 0), 0), 0
    )
    const totalActualHours = machines.reduce((sum, m) =>
      sum + m.tasks.reduce((s, t) => s + (t.actualHours || 0), 0), 0
    )
    const efficiency = totalPlannedHours > 0
      ? (totalActualHours / totalPlannedHours) * 100
      : 100

    return NextResponse.json({
      success: true,
      machines: machines.map((machine) => {
        const plannedHours = machine.tasks.reduce((sum, t) => sum + (t.plannedHours || 0), 0)
        const actualHours = machine.tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0)
        const machineEfficiency = plannedHours > 0 ? (actualHours / plannedHours) * 100 : 0

        return {
          id: machine.id,
          code: machine.code,
          name: machine.name,
          type: machine.type || 'N/A',
          status: machine.status,
          taskCount: machine.tasks.length,
          plannedHours: plannedHours.toFixed(2),
          actualHours: actualHours.toFixed(2),
          efficiency: machineEfficiency.toFixed(1),
        }
      }),
      overall: {
        totalMachines: machines.length,
        totalTasks: machines.reduce((sum, m) => sum + m.tasks.length, 0),
        plannedHours: totalPlannedHours.toFixed(2),
        actualHours: totalActualHours.toFixed(2),
        efficiency: efficiency.toFixed(1),
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
