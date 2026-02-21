import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Get statistics from database
    const [
      activeOrders,
      inProduction,
      pendingTasks,
      completedToday,
      machines,
      activeBreakdowns,
    ] = await Promise.all([
      // Active orders (not delivered or closed)
      db.order.count({
        where: {
          status: {
            in: ['PLANNING', 'MATERIAL_PREPARATION', 'IN_PRODUCTION', 'ASSEMBLY', 'QC', 'READY_FOR_DELIVERY'],
          },
        },
      }),
      // Orders in production
      db.order.count({
        where: {
          status: 'IN_PRODUCTION',
        },
      }),
      // Pending tasks
      db.machiningTask.count({
        where: {
          status: {
            in: ['PENDING', 'ASSIGNED'],
          },
        },
      }),
      // Completed today
      db.machiningTask.count({
        where: {
          status: 'COMPLETED',
          updatedAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      // All machines
      db.machine.findMany({
        where: {
          isActive: true,
        },
      }),
      // Active breakdowns
      db.breakdown.count({
        where: {
          resolved: false,
        },
      }),
    ])

    // Calculate machine utilization
    const busyMachines = machines.filter((m) => m.status === 'BUSY' || m.status === 'DOWN').length
    const utilization = machines.length > 0 
      ? Math.round((busyMachines / machines.length) * 100)
      : 0

    return NextResponse.json({
      activeOrders,
      inProduction,
      pendingTasks,
      completedToday,
      machineUtilization: utilization,
      activeBreakdowns,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    // Return default values if database is not ready
    return NextResponse.json({
      activeOrders: 0,
      inProduction: 0,
      pendingTasks: 0,
      completedToday: 0,
      machineUtilization: 0,
      activeBreakdowns: 0,
    })
  }
}
