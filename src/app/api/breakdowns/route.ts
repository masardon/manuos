import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/middleware/auth'
import { MachineStatus, BreakdownType, TaskStatus } from '@prisma/client'

const TENANT_ID = 'tenant_ypti'

// GET /api/breakdowns - List all breakdowns with affected tasks
export async function GET(request: NextRequest) {
  try {
    const breakdowns = await db.breakdown.findMany({
      where: { tenantId: TENANT_ID },
      include: {
        machine: {
          select: { id: true, code: true, name: true, type: true, status: true },
        },
        affectedTasks: {
          select: {
            id: true,
            taskNumber: true,
            name: true,
            status: true,
            breakdownAt: true,
            breakdownNote: true,
            estimatedRecoveryDate: true,
            plannedStartDate: true,
            plannedEndDate: true,
            jobsheet: {
              select: {
                jsNumber: true,
                name: true,
                manufacturingOrder: {
                  select: {
                    moNumber: true,
                    name: true,
                    order: { select: { orderNumber: true, customerName: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { reportedAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      breakdowns,
      count: breakdowns.length,
    })
  } catch (error) {
    console.error('Error fetching breakdowns:', error)
    return NextResponse.json({ error: 'Failed to fetch breakdowns' }, { status: 500 })
  }
}

// POST /api/breakdowns - Create new breakdown with production impact
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.machineId || !body.type || !body.description) {
      return NextResponse.json(
        { error: 'Machine ID, type, and description are required' },
        { status: 400 }
      )
    }

    const machine = await db.machine.findFirst({
      where: { id: body.machineId, tenantId: TENANT_ID },
    })

    if (!machine) {
      return NextResponse.json({ error: 'Machine not found' }, { status: 404 })
    }

    if (machine.status === MachineStatus.DOWN) {
      return NextResponse.json(
        { error: 'Machine is already marked as DOWN. Resolve the existing breakdown first.' },
        { status: 400 }
      )
    }

    const estimatedRecovery = body.estimatedRecoveryDate
      ? new Date(body.estimatedRecoveryDate)
      : null

    // Create breakdown
    const breakdown = await db.breakdown.create({
      data: {
        tenantId: TENANT_ID,
        machineId: body.machineId,
        reportedBy: body.reportedBy || 'system',
        type: body.type as BreakdownType,
        description: body.description,
        notes: body.notes || null,
        estimatedRecoveryDate: estimatedRecovery,
      },
    })

    // Update machine status to DOWN
    await db.machine.update({
      where: { id: body.machineId },
      data: {
        status: MachineStatus.DOWN,
        notes: `BREAKDOWN: ${body.description}${estimatedRecovery ? ` | Est. recovery: ${estimatedRecovery.toISOString()}` : ''}`,
      },
    })

    // Find all RUNNING or ASSIGNED tasks on this machine and pause them
    const activeTasks = await db.machiningTask.findMany({
      where: {
        tenantId: TENANT_ID,
        machineId: body.machineId,
        status: { in: [TaskStatus.RUNNING, TaskStatus.ASSIGNED] },
      },
    })

    const pausedTasks = []
    for (const task of activeTasks) {
      const updated = await db.machiningTask.update({
        where: { id: task.id },
        data: {
          status: TaskStatus.PAUSED,
          breakdownAt: new Date(),
          breakdownNote: body.description,
          breakdownId: breakdown.id,
          estimatedRecoveryDate: estimatedRecovery,
          // Extend planned end date by estimated recovery duration
          plannedEndDate: estimatedRecovery && task.plannedEndDate
            ? new Date(task.plannedEndDate.getTime() + (estimatedRecovery.getTime() - Date.now()))
            : task.plannedEndDate,
        },
      })
      pausedTasks.push(updated)
    }

    // Also link the specific affected task if provided (and not already paused)
    if (body.affectedTaskId && !activeTasks.find(t => t.id === body.affectedTaskId)) {
      try {
        await db.machiningTask.update({
          where: { id: body.affectedTaskId, tenantId: TENANT_ID },
          data: {
            breakdownAt: new Date(),
            breakdownNote: body.description,
            breakdownId: breakdown.id,
            estimatedRecoveryDate: estimatedRecovery,
          },
        })
      } catch {
        // Task might not exist, ignore
      }
    }

    return NextResponse.json({
      success: true,
      data: breakdown,
      pausedTasks: pausedTasks.length,
      affectedOrders: [...new Set(pausedTasks.map(t => t.jobsheetId))].length,
      message: `Breakdown reported. ${pausedTasks.length} task(s) paused automatically.`,
    })
  } catch (error) {
    console.error('Error creating breakdown:', error)
    return NextResponse.json({ error: 'Failed to report breakdown' }, { status: 500 })
  }
}
