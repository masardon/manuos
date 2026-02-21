import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, getTenantId } from '@/lib/middleware/auth'
import { OrderStatus, MOStatus, JobsheetStatus, TaskStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request.headers)
    // For demo purposes, use YPTI tenant even without auth
    const tenantId = user?.tenantId || 'tenant_ypti'

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID required' },
        { status: 400 }
      )
    }

    // Get all orders with their MOs, jobsheets, and tasks
    const orders = await db.order.findMany({
      where: {
        tenantId,
        status: {
          notIn: [OrderStatus.DELIVERED, OrderStatus.CANCELLED, OrderStatus.CLOSED],
        },
      },
      include: {
        manufacturingOrders: {
          include: {
            jobsheets: {
              include: {
                machiningTasks: {
                  orderBy: {
                    plannedHours: 'asc',
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        plannedStartDate: 'asc',
      },
    })

    // Transform data into Gantt task format
    const ganttTasks: any[] = []

    // Add order-level tasks
    orders.forEach((order) => {
      if (order.plannedStartDate && order.plannedEndDate) {
        ganttTasks.push({
          id: `order-${order.id}`,
          name: `${order.orderNumber} - ${order.customerName}`,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          startDate: new Date(order.plannedStartDate),
          endDate: new Date(order.plannedEndDate),
          progressPercent: order.progressPercent || 0,
          status: order.status,
          type: 'order',
          level: 0,
          color: 'bg-blue-500 border-blue-600',
          // Preserve ID for hierarchy
          orderId: order.id,
        })
      }

      // Add MO-level tasks
      order.manufacturingOrders.forEach((mo) => {
        if (mo.plannedStartDate && mo.plannedEndDate) {
          ganttTasks.push({
            id: `mo-${mo.id}`,
            name: `${mo.moNumber} - ${mo.name}`,
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            startDate: new Date(mo.plannedStartDate),
            endDate: new Date(mo.plannedEndDate),
            progressPercent: mo.progressPercent || 0,
            status: mo.status,
            type: 'mo',
            level: 1,
            color: 'bg-purple-500 border-purple-600',
            // Preserve IDs for hierarchy
            orderId: order.id,
            moId: mo.id,
            moNumber: mo.moNumber,
          })
        }

        // Add jobsheet-level tasks
        mo.jobsheets.forEach((js) => {
          if (js.plannedStartDate && js.plannedEndDate) {
            ganttTasks.push({
              id: `js-${js.id}`,
              name: `${js.jsNumber} - ${js.name}`,
              orderNumber: order.orderNumber,
              customerName: order.customerName,
              startDate: new Date(js.plannedStartDate),
              endDate: new Date(js.plannedEndDate),
              progressPercent: js.progressPercent || 0,
              status: js.status,
              type: 'jobsheet',
              level: 2,
              color: 'bg-green-500 border-green-600',
              // Preserve IDs for hierarchy
              orderId: order.id,
              moId: mo.id,
              jsId: js.id,
              moNumber: mo.moNumber,
              jsNumber: js.jsNumber,
            })
          }

          // Add task-level items
          js.machiningTasks.forEach((task) => {
            const startTime = task.clockedInAt || task.plannedStartDate || js.plannedStartDate
            const endTime = task.clockedOutAt || task.plannedEndDate || js.plannedEndDate
            
            if (startTime && endTime) {
              ganttTasks.push({
                id: `task-${task.id}`,
                name: `${task.taskNumber} - ${task.name}`,
                orderNumber: order.orderNumber,
                customerName: order.customerName,
                startDate: new Date(startTime),
                endDate: new Date(endTime),
                progressPercent: task.progressPercent || 0,
                status: task.status,
                type: 'task',
                level: 3,
                color: 'bg-orange-500 border-orange-600',
                // Preserve ALL IDs for hierarchy
                orderId: order.id,
                moId: mo.id,
                jsId: js.id,
                taskId: task.id,
                moNumber: mo.moNumber,
                jsNumber: js.jsNumber,
                taskNumber: task.taskNumber,
                machineId: task.machineId,
                machine: task.machine,
              })
            }
          })
        })
      })
    })

    // Sort tasks by start date
    ganttTasks.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())

    return NextResponse.json({
      success: true,
      tasks: ganttTasks,
      count: ganttTasks.length,
      ordersCount: orders.length,
    })
  } catch (error) {
    console.error('Error fetching Gantt data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Gantt data' },
      { status: 500 }
    )
  }
}
