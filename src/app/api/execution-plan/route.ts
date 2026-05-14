// Execution Plan API - Recalculate dates based on dependencies
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth/middleware'
import { z } from 'zod'

const recalculatePlanSchema = z.object({
  orderId: z.string().optional(),
  moId: z.string().optional(),
  startDate: z.string().datetime().optional(), // Override start date
  respectExistingDates: z.boolean().default(true), // Don't move tasks that are already scheduled earlier
})

interface TaskInfo {
  id: string
  type: 'task' | 'jobsheet' | 'mo' | 'order'
  startDate: Date
  endDate: Date
  duration: number // in days
  predecessors: Array<{ id: string; lagDays: number }>
}

// POST /api/execution-plan - Recalculate execution plan
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    const data = recalculatePlanSchema.parse(body)

    // Get all tasks with dependencies
    const where: any = { tenantId: user.tenantId, isActive: true }
    
    if (data.moId) {
      where.OR = [
        { predecessorMoId: data.moId },
        { successorMoId: data.moId }
      ]
    } else if (data.orderId) {
      where.OR = [
        { predecessorOrderId: data.orderId },
        { successorOrderId: data.orderId }
      ]
    }

    const dependencies = await db.taskDependency.findMany({
      where,
      include: {
        predecessorTask: true,
        successorTask: true,
        predecessorJobsheet: true,
        successorJobsheet: true,
        predecessorMO: true,
        successorMO: true,
      }
    })

    // Build dependency graph
    const taskMap: Map<string, TaskInfo> = new Map()
    const adjacencyList: Map<string, string[]> = new Map()

    // Get all relevant tasks
    const tasks = await db.machiningTask.findMany({
      where: { tenantId: user.tenantId },
      include: {
        jobsheet: {
          include: {
            manufacturingOrder: true
          }
        }
      }
    })

    // Initialize task map - use planned dates first (set by execution planning), then clocked times, then jobsheet dates
    for (const task of tasks) {
      const startDate = task.plannedStartDate || task.clockedInAt || task.jobsheet.plannedStartDate || new Date()
      const endDate = task.plannedEndDate || task.clockedOutAt || task.jobsheet.plannedEndDate || new Date()
      const duration = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
      
      taskMap.set(`task-${task.id}`, {
        id: task.id,
        type: 'task',
        startDate,
        endDate,
        duration,
        predecessors: []
      })
      adjacencyList.set(`task-${task.id}`, [])
    }
    
    // Map to store lag days for each dependency
    const lagDaysMap: Map<string, Map<string, number>> = new Map()

    // Build adjacency list from dependencies
    for (const dep of dependencies) {
      // Task-level dependencies
      if (dep.predecessorTaskId && dep.successorTaskId) {
        const predKey = `task-${dep.predecessorTaskId}`
        const succKey = `task-${dep.successorTaskId}`
        
        if (taskMap.has(predKey) && taskMap.has(succKey)) {
          taskMap.get(succKey)!.predecessors.push({ id: predKey, lagDays: dep.lagDays })
          adjacencyList.get(predKey)!.push(succKey)
          
          // Store lag days for this dependency
          if (!lagDaysMap.has(succKey)) {
            lagDaysMap.set(succKey, new Map())
          }
          lagDaysMap.get(succKey)!.set(predKey, dep.lagDays)
        }
      }
      // MO-level dependencies - connect all tasks in successor MO to all tasks in predecessor MO
      else if (dep.predecessorMoId && dep.successorMoId) {
        const predTasks = tasks.filter(t => t.jobsheet?.manufacturingOrder?.id === dep.predecessorMoId)
        const succTasks = tasks.filter(t => t.jobsheet?.manufacturingOrder?.id === dep.successorMoId)
        
        // Connect the last task(s) of predecessor MO to first task(s) of successor MO
        const lastPredTasks = predTasks.filter(t => {
          // Check if this task has no successors in the same MO
          const hasSuccessor = predTasks.some(other => 
            other.id !== t.id && other.jobsheet?.plannedStartDate && t.jobsheet?.plannedEndDate &&
            other.jobsheet.plannedStartDate >= t.jobsheet.plannedEndDate
          )
          return !hasSuccessor
        })
        
        const firstSuccTasks = succTasks.filter(t => {
          // Check if this task has no predecessors in the same MO
          const hasPredecessor = succTasks.some(other => 
            other.id !== t.id && other.jobsheet?.plannedStartDate && t.jobsheet?.plannedEndDate &&
            t.jobsheet.plannedStartDate >= other.jobsheet.plannedEndDate
          )
          return !hasPredecessor
        })
        
        // If we can't determine specific tasks, connect all to all
        const predTaskIds = lastPredTasks.length > 0 ? lastPredTasks.map(t => t.id) : predTasks.map(t => t.id)
        const succTaskIds = firstSuccTasks.length > 0 ? firstSuccTasks.map(t => t.id) : succTasks.map(t => t.id)
        
        for (const predId of predTaskIds) {
          const predKey = `task-${predId}`
          if (!taskMap.has(predKey)) continue
          
          for (const succId of succTaskIds) {
            const succKey = `task-${succId}`
            if (!taskMap.has(succKey) || predId === succId) continue
            
            taskMap.get(succKey)!.predecessors.push({ id: predKey, lagDays: dep.lagDays })
            adjacencyList.get(predKey)!.push(succKey)
            
            // Store lag days for this dependency
            if (!lagDaysMap.has(succKey)) {
              lagDaysMap.set(succKey, new Map())
            }
            lagDaysMap.get(succKey)!.set(predKey, dep.lagDays)
          }
        }
      }
      // Jobsheet-level dependencies - connect all tasks in successor jobsheet to all tasks in predecessor jobsheet
      else if (dep.predecessorJobsheetId && dep.successorJobsheetId) {
        const predTasks = tasks.filter(t => t.jobsheetId === dep.predecessorJobsheetId)
        const succTasks = tasks.filter(t => t.jobsheetId === dep.successorJobsheetId)
        
        // Connect all tasks in predecessor jobsheet to all tasks in successor jobsheet
        for (const pred of predTasks) {
          const predKey = `task-${pred.id}`
          if (!taskMap.has(predKey)) continue
          
          for (const succ of succTasks) {
            const succKey = `task-${succ.id}`
            if (!taskMap.has(succKey) || pred.id === succ.id) continue
            
            taskMap.get(succKey)!.predecessors.push({ id: predKey, lagDays: dep.lagDays })
            adjacencyList.get(predKey)!.push(succKey)
            
            // Store lag days for this dependency
            if (!lagDaysMap.has(succKey)) {
              lagDaysMap.set(succKey, new Map())
            }
            lagDaysMap.get(succKey)!.set(predKey, dep.lagDays)
          }
        }
      }
    }

    // Topological sort (Kahn's algorithm)
    const inDegree: Map<string, number> = new Map()
    const queue: string[] = []
    const sortedOrder: string[] = []

    // Initialize in-degrees
    for (const [taskId] of taskMap) {
      inDegree.set(taskId, 0)
    }

    // Calculate in-degrees
    for (const [taskId, successors] of adjacencyList) {
      for (const succ of successors) {
        inDegree.set(succ, (inDegree.get(succ) || 0) + 1)
      }
    }

    // Find nodes with no incoming edges
    for (const [taskId, degree] of inDegree) {
      if (degree === 0) {
        queue.push(taskId)
      }
    }

    // Process queue
    while (queue.length > 0) {
      const current = queue.shift()!
      sortedOrder.push(current)

      const successors = adjacencyList.get(current) || []
      for (const succ of successors) {
        const newDegree = (inDegree.get(succ) || 1) - 1
        inDegree.set(succ, newDegree)
        if (newDegree === 0) {
          queue.push(succ)
        }
      }
    }

    // Check for cycles
    if (sortedOrder.length !== taskMap.size) {
      return NextResponse.json(
        { error: 'Circular dependency detected in the task network' },
        { status: 400 }
      )
    }

    // Calculate new dates using Critical Path Method (CPM)
    const newDates: Map<string, { startDate: Date; endDate: Date }> = new Map()
    
    // Forward pass - calculate Early Start (ES) and Early Finish (EF)
    const earlyStart: Map<string, number> = new Map()
    const earlyFinish: Map<string, number> = new Map()
    
    for (const taskId of sortedOrder) {
      const task = taskMap.get(taskId)!
      const predecessors = task.predecessors
      
      if (predecessors.length === 0) {
        // No predecessors - use original start date or provided start date
        const originalStart = data.startDate ? new Date(data.startDate) : task.startDate
        earlyStart.set(taskId, originalStart.getTime())
      } else {
        // Find max EF of predecessors (considering lag days)
        let maxEF = 0
        for (const pred of predecessors) {
          const predEF = earlyFinish.get(pred.id) || 0
          // Add lag days in milliseconds
          const lagMs = pred.lagDays * 24 * 60 * 60 * 1000
          maxEF = Math.max(maxEF, predEF + lagMs)
        }
        earlyStart.set(taskId, maxEF)
      }
      
      earlyFinish.set(taskId, earlyStart.get(taskId)! + task.duration * 24 * 60 * 60 * 1000)
    }

    // Backward pass - calculate Late Start (LS) and Late Finish (LF)
    const lateStart: Map<string, number> = new Map()
    const lateFinish: Map<string, number> = new Map()
    
    // Find project end time (max EF)
    let projectEndTime = 0
    for (const [_, ef] of earlyFinish) {
      projectEndTime = Math.max(projectEndTime, ef)
    }

    // Initialize LF for sink nodes
    for (const taskId of sortedOrder.reverse()) {
      const successors = adjacencyList.get(taskId) || []
      
      if (successors.length === 0) {
        // No successors - use project end time
        lateFinish.set(taskId, projectEndTime)
      } else {
        // Find min LS of successors
        let minLS = Infinity
        for (const succ of successors) {
          const succLS = lateStart.get(succ) || Infinity
          minLS = Math.min(minLS, succLS)
        }
        lateFinish.set(taskId, minLS)
      }
      
      const task = taskMap.get(taskId)!
      lateStart.set(taskId, lateFinish.get(taskId)! - task.duration * 24 * 60 * 60 * 1000)
    }

    // Calculate new dates
    const updates: any[] = []
    
    for (const [taskId, task] of taskMap) {
      const es = earlyStart.get(taskId)!
      const ls = lateStart.get(taskId)!
      
      // Use early start for scheduling (you could also use late start for latest possible)
      const newStartDate = new Date(es)
      const newEndDate = new Date(es + task.duration * 24 * 60 * 60 * 1000)
      
      // Calculate slack (float)
      const slack = (ls - es) / (24 * 60 * 60 * 1000) // in days
      
      newDates.set(taskId, { startDate: newStartDate, endDate: newEndDate })
      
      // Only update if dates changed significantly (more than 1 hour)
      const startDateDiff = Math.abs(task.startDate.getTime() - newStartDate.getTime())
      const endDateDiff = Math.abs(task.endDate.getTime() - newEndDate.getTime())
      
      if (startDateDiff > 60 * 60 * 1000 || endDateDiff > 60 * 60 * 1000) {
        updates.push({
          taskId: task.id,
          oldStartDate: task.startDate,
          oldEndDate: task.endDate,
          newStartDate,
          newEndDate,
          slack,
          isCritical: slack <= 0 // Zero slack means critical path
        })
      }
    }

    // Apply updates to database - update planned dates on tasks
    let updatedCount = 0
    
    for (const update of updates) {
      try {
        await db.machiningTask.update({
          where: { id: update.taskId },
          data: {
            plannedStartDate: update.newStartDate,
            plannedEndDate: update.newEndDate,
          }
        })
        updatedCount++
      } catch (error) {
        console.error(`Failed to update task ${update.taskId}:`, error)
      }
    }

    // Calculate critical path
    const criticalPath = updates
      .filter(u => u.isCritical)
      .map(u => u.taskId)

    return NextResponse.json({
      success: true,
      recalculated: updates.length,
      updated: updatedCount,
      criticalPath,
      updates: updates.map(u => ({
        taskId: u.taskId,
        oldStart: u.oldStartDate.toISOString().split('T')[0],
        oldEnd: u.oldEndDate.toISOString().split('T')[0],
        newStart: u.newStartDate.toISOString().split('T')[0],
        newEnd: u.newEndDate.toISOString().split('T')[0],
        slackDays: Math.round(u.slack * 10) / 10,
        isCritical: u.isCritical
      })),
      message: `Recalculated ${updates.length} tasks, updated ${updatedCount}`
    })
  } catch (error) {
    console.error('Error recalculating execution plan:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
    }
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to recalculate execution plan' }, { status: 500 })
  }
}

// GET /api/execution-plan - Get critical path analysis
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = request.nextUrl
    
    const orderId = searchParams.get('orderId')
    const moId = searchParams.get('moId')

    const where: any = { tenantId: user.tenantId, isActive: true }
    
    if (moId) {
      where.OR = [
        { predecessorMoId: moId },
        { successorMoId: moId }
      ]
    } else if (orderId) {
      where.OR = [
        { predecessorOrderId: orderId },
        { successorOrderId: orderId }
      ]
    }

    const dependencies = await db.taskDependency.findMany({
      where,
      include: {
        predecessorTask: {
          select: { id: true, taskNumber: true, name: true, status: true }
        },
        successorTask: {
          select: { id: true, taskNumber: true, name: true, status: true }
        }
      }
    })

    // Build dependency statistics
    const taskDependencyCount: Map<string, number> = new Map()
    let totalDependencies = dependencies.length
    let finishToStartCount = 0
    let withLagCount = 0

    for (const dep of dependencies) {
      if (dep.predecessorTaskId) {
        taskDependencyCount.set(
          dep.predecessorTaskId,
          (taskDependencyCount.get(dep.predecessorTaskId) || 0) + 1
        )
      }
      if (dep.successorTaskId) {
        taskDependencyCount.set(
          dep.successorTaskId,
          (taskDependencyCount.get(dep.successorTaskId) || 0) + 1
        )
      }
      if (dep.dependencyType === 'FINISH_TO_START') finishToStartCount++
      if (dep.lagDays !== 0) withLagCount++
    }

    // Find tasks with most dependencies (potential bottlenecks)
    const bottlenecks = Array.from(taskDependencyCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)

    return NextResponse.json({
      success: true,
      statistics: {
        totalDependencies,
        finishToStartPercentage: totalDependencies > 0 ? Math.round((finishToStartCount / totalDependencies) * 100) : 0,
        withLagPercentage: totalDependencies > 0 ? Math.round((withLagCount / totalDependencies) * 100) : 0,
        averageDependenciesPerTask: taskDependencyCount.size > 0 ? Math.round((totalDependencies * 2 / taskDependencyCount.size) * 10) / 10 : 0
      },
      bottlenecks: bottlenecks.map(([taskId, count]) => ({ taskId, dependencyCount: count })),
      dependencies: dependencies.slice(0, 50) // Return first 50 for visualization
    })
  } catch (error) {
    console.error('Error fetching execution plan:', error)
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to fetch execution plan' }, { status: 500 })
  }
}
