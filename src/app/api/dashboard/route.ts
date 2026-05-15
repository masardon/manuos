import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const TENANT_ID = 'tenant_ypti'

export async function GET(request: NextRequest) {
  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const [
      activeOrders,
      inProduction,
      pendingTasks,
      completedToday,
      activeBreakdowns,
      machines,
      recentTasks,
      recentBreakdowns,
      recentHandoffs,
    ] = await Promise.all([
      // Active orders
      db.order.count({
        where: {
          tenantId: TENANT_ID,
          status: { in: ['IN_PRODUCTION', 'MATERIAL_PREPARATION', 'ASSEMBLY', 'QC'] },
        },
      }),

      // In production (MOs)
      db.manufacturingOrder.count({
        where: {
          tenantId: TENANT_ID,
          status: { in: ['IN_PROGRESS', 'SCHEDULED'] },
        },
      }),

      // Pending tasks
      db.machiningTask.count({
        where: {
          tenantId: TENANT_ID,
          status: { in: ['PENDING', 'ASSIGNED'] },
        },
      }),

      // Completed today
      db.machiningTask.count({
        where: {
          tenantId: TENANT_ID,
          status: 'COMPLETED',
          updatedAt: { gte: todayStart },
        },
      }),

      // Active breakdowns
      db.breakdown.count({
        where: {
          tenantId: TENANT_ID,
          resolved: false,
        },
      }),

      // Machines for utilization
      db.machine.findMany({
        where: { tenantId: TENANT_ID, isActive: true },
        select: { id: true, status: true },
      }),

      // Recent tasks (last 10)
      db.machiningTask.findMany({
        where: { tenantId: TENANT_ID },
        select: {
          id: true,
          taskNumber: true,
          name: true,
          status: true,
          updatedAt: true,
          machine: { select: { code: true, name: true } },
          jobsheet: {
            select: {
              jsNumber: true,
              manufacturingOrder: {
                select: {
                  moNumber: true,
                  order: { select: { orderNumber: true, customerName: true } },
                },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),

      // Recent breakdowns (last 5)
      db.breakdown.findMany({
        where: { tenantId: TENANT_ID },
        select: {
          id: true,
          type: true,
          description: true,
          resolved: true,
          reportedAt: true,
          resolvedAt: true,
          machine: { select: { code: true, name: true } },
        },
        orderBy: { reportedAt: 'desc' },
        take: 5,
      }),

      // Recent handoffs (last 5)
      db.materialHandoff.findMany({
        where: { tenantId: TENANT_ID },
        select: {
          id: true,
          handoffNumber: true,
          handoffType: true,
          status: true,
          createdAt: true,
          fromLocation: { select: { code: true, name: true } },
          toLocation: { select: { code: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ])

    // Calculate utilization
    const busyMachines = machines.filter(m => m.status === 'BUSY' || m.status === 'RUNNING').length
    const machineUtilization = machines.length > 0
      ? Math.round((busyMachines / machines.length) * 100)
      : 0

    // Build recent activity feed
    const activities: {
      id: string
      type: 'task' | 'breakdown' | 'handoff'
      icon: string
      message: string
      detail: string
      timestamp: Date
      status: string
    }[] = []

    // Add task activities
    for (const task of recentTasks) {
      const orderNum = task.jobsheet?.manufacturingOrder?.order?.orderNumber || ''
      const customer = task.jobsheet?.manufacturingOrder?.order?.customerName || ''
      const moNum = task.jobsheet?.manufacturingOrder?.moNumber || ''
      const machineName = task.machine?.code || 'Unassigned'

      let message = ''
      let icon = 'task'

      switch (task.status) {
        case 'COMPLETED':
          message = `Task ${task.taskNumber} completed`
          icon = 'check'
          break
        case 'RUNNING':
          message = `Task ${task.taskNumber} started`
          icon = 'play'
          break
        case 'PAUSED':
          message = `Task ${task.taskNumber} paused`
          icon = 'pause'
          break
        case 'PENDING':
          message = `Task ${task.taskNumber} pending`
          icon = 'clock'
          break
        case 'ASSIGNED':
          message = `Task ${task.taskNumber} assigned`
          icon = 'user'
          break
        default:
          message = `Task ${task.taskNumber} - ${task.status}`
          icon = 'task'
      }

      activities.push({
        id: `task-${task.id}`,
        type: 'task',
        icon,
        message,
        detail: `${task.name} | ${machineName} | ${orderNum} ${customer}`,
        timestamp: task.updatedAt,
        status: task.status,
      })
    }

    // Add breakdown activities
    for (const bd of recentBreakdowns) {
      activities.push({
        id: `bd-${bd.id}`,
        type: 'breakdown',
        icon: bd.resolved ? 'check' : 'alert',
        message: bd.resolved
          ? `Breakdown resolved: ${bd.machine.code}`
          : `Breakdown: ${bd.machine.code} - ${bd.machine.name}`,
        detail: bd.description,
        timestamp: bd.resolvedAt || bd.reportedAt,
        status: bd.resolved ? 'RESOLVED' : 'ACTIVE',
      })
    }

    // Add handoff activities
    for (const hf of recentHandoffs) {
      activities.push({
        id: `hf-${hf.id}`,
        type: 'handoff',
        icon: 'transfer',
        message: `Handoff ${hf.handoffNumber}`,
        detail: `${hf.fromLocation?.code || '?'} → ${hf.toLocation?.code || '?'} | ${hf.handoffType}`,
        timestamp: hf.createdAt,
        status: hf.status,
      })
    }

    // Sort by timestamp descending
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({
      activeOrders,
      inProduction,
      pendingTasks,
      completedToday,
      machineUtilization,
      activeBreakdowns,
      recentActivity: activities.slice(0, 15),
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
  }
}
