import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/middleware/auth'
import { OrderStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request)
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
                  include: {
                    machine: {
                      select: {
                        id: true,
                        name: true,
                        code: true,
                      },
                    },
                    // Include dependencies for tasks
                    successorDependencies: {
                      where: { isActive: true },
                      include: {
                        successorTask: {
                          select: { id: true, taskNumber: true, name: true }
                        }
                      }
                    },
                    predecessorDependencies: {
                      where: { isActive: true },
                      include: {
                        predecessorTask: {
                          select: { id: true, taskNumber: true, name: true }
                        }
                      }
                    }
                  },
                  orderBy: {
                    createdAt: 'asc',
                  },
                },
                // Include dependencies for jobsheets
                successorDependencies: {
                  where: { isActive: true },
                  include: {
                    successorJobsheet: {
                      select: { id: true, jsNumber: true, name: true }
                    }
                  }
                },
                predecessorDependencies: {
                  where: { isActive: true },
                  include: {
                    predecessorJobsheet: {
                      select: { id: true, jsNumber: true, name: true }
                    }
                  }
                }
              },
            },
            // Include dependencies for MOs
            successorDependencies: {
              where: { isActive: true },
              include: {
                successorMO: {
                  select: { id: true, moNumber: true, name: true }
                }
              }
            },
            predecessorDependencies: {
              where: { isActive: true },
              include: {
                predecessorMO: {
                  select: { id: true, moNumber: true, name: true }
                }
              }
            }
          },
        },
      },
      orderBy: {
        plannedStartDate: 'asc',
      },
    })

    // Transform data into Gantt task format
    const ganttTasks: any[] = []
    const dependencies: any[] = []

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
          dependencies: [], // Orders don't have dependencies
        })
      }

      // Add MO-level tasks
      order.manufacturingOrders.forEach((mo) => {
        if (mo.plannedStartDate && mo.plannedEndDate) {
          // Collect dependencies for this MO
          const moDependencies: string[] = []
          
          mo.predecessorDependencies.forEach(dep => {
            if (dep.predecessorMO) {
              moDependencies.push(`mo-${dep.predecessorMO.id}`)
              dependencies.push({
                id: dep.id,
                from: `mo-${dep.predecessorMO.id}`,
                to: `mo-${mo.id}`,
                type: dep.dependencyType,
                lagDays: dep.lagDays
              })
            }
          })

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
            dependencies: moDependencies,
          })

          // Add jobsheet-level tasks
          mo.jobsheets.forEach((js) => {
            if (js.plannedStartDate && js.plannedEndDate) {
              // Collect dependencies for this jobsheet
              const jsDependencies: string[] = []
              
              js.predecessorDependencies.forEach(dep => {
                if (dep.predecessorJobsheet) {
                  jsDependencies.push(`js-${dep.predecessorJobsheet.id}`)
                  dependencies.push({
                    id: dep.id,
                    from: `js-${dep.predecessorJobsheet.id}`,
                    to: `js-${js.id}`,
                    type: dep.dependencyType,
                    lagDays: dep.lagDays
                  })
                }
              })

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
                dependencies: jsDependencies,
              })

              // Add task-level items
              js.machiningTasks.forEach((task) => {
                // Tasks use clockedInAt/clockedOutAt or fall back to jobsheet dates
                const startTime = task.clockedInAt || js.plannedStartDate
                const endTime = task.clockedOutAt || js.plannedEndDate
                
                if (startTime && endTime) {
                  // Collect dependencies for this task
                  const taskDependencies: string[] = []
                  
                  // Check legacy dependsOn field
                  if (task.dependsOn) {
                    taskDependencies.push(`task-${task.dependsOn}`)
                  }
                  
                  // Check new dependency relations
                  task.predecessorDependencies.forEach(dep => {
                    if (dep.predecessorTask) {
                      taskDependencies.push(`task-${dep.predecessorTask.id}`)
                      dependencies.push({
                        id: dep.id,
                        from: `task-${dep.predecessorTask.id}`,
                        to: `task-${task.id}`,
                        type: dep.dependencyType,
                        lagDays: dep.lagDays
                      })
                    }
                  })

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
                    dependencies: taskDependencies,
                  })
                }
              })
            }
          })
        }
      })
    })

    // Sort tasks by start date
    ganttTasks.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())

    return NextResponse.json({
      success: true,
      tasks: ganttTasks,
      dependencies: dependencies,
      count: ganttTasks.length,
      ordersCount: orders.length,
      dependenciesCount: dependencies.length,
    })
  } catch (error) {
    console.error('Error fetching Gantt data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Gantt data' },
      { status: 500 }
    )
  }
}
