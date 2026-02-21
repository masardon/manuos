import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { TaskStatus, JobsheetStatus, MOStatus, OrderStatus } from '@prisma/client'

interface Params {
  params: Promise<{ id: string }>
}

// Calculate progress for a jobsheet based on its tasks
async function calculateJobsheetProgress(jobsheetId: string) {
  const tasks = await db.machiningTask.findMany({
    where: { jobsheetId },
    select: { progressPercent: true, plannedHours: true },
  })

  if (tasks.length === 0) return 0

  // Weight by planned hours
  const totalPlannedHours = tasks.reduce((sum, t) => sum + (t.plannedHours || 0), 0)
  if (totalPlannedHours === 0) {
    // Simple average if no hours defined
    return Math.round(tasks.reduce((sum, t) => sum + t.progressPercent, 0) / tasks.length)
  }

  const weightedProgress = tasks.reduce(
    (sum, t) => sum + (t.progressPercent * (t.plannedHours || 0)),
    0
  )
  return Math.round(weightedProgress / totalPlannedHours)
}

// Calculate progress for an MO based on its jobsheets
async function calculateMOProgress(moId: string) {
  const jobsheets = await db.jobsheet.findMany({
    where: { moId },
    select: { progressPercent: true },
  })

  if (jobsheets.length === 0) return 0
  return Math.round(jobsheets.reduce((sum, js) => sum + js.progressPercent, 0) / jobsheets.length)
}

// Calculate progress for an Order based on its MOs
async function calculateOrderProgress(orderId: string) {
  const mos = await db.manufacturingOrder.findMany({
    where: { orderId },
    select: { progressPercent: true },
  })

  if (mos.length === 0) return 0
  return Math.round(mos.reduce((sum, mo) => sum + mo.progressPercent, 0) / mos.length)
}

// Update jobsheet status based on tasks
async function updateJobsheetStatus(jobsheetId: string, progress: number) {
  let status = JobsheetStatus.PREPARING
  
  if (progress >= 100) {
    status = JobsheetStatus.COMPLETED
  } else if (progress > 0) {
    status = JobsheetStatus.IN_PROGRESS
  }

  await db.jobsheet.update({
    where: { id: jobsheetId },
    data: {
      progressPercent: progress,
      status,
      actualEndDate: progress >= 100 ? new Date() : null,
    },
  })

  return status
}

// Update MO status based on jobsheets
async function updateMOStatus(moId: string, progress: number) {
  let status = MOStatus.PLANNED
  
  if (progress >= 100) {
    status = MOStatus.COMPLETED
  } else if (progress > 0) {
    status = MOStatus.IN_PROGRESS
  }

  await db.manufacturingOrder.update({
    where: { id: moId },
    data: {
      progressPercent: progress,
      status,
      actualEndDate: progress >= 100 ? new Date() : null,
    },
  })

  return status
}

// Update Order status based on MOs
async function updateOrderStatus(orderId: string, progress: number) {
  let status = OrderStatus.DRAFT
  
  if (progress >= 100) {
    status = OrderStatus.COMPLETED
  } else if (progress > 0) {
    status = OrderStatus.IN_PRODUCTION
  }

  await db.order.update({
    where: { id: orderId },
    data: {
      progressPercent: progress,
      status,
      actualEndDate: progress >= 100 ? new Date() : null,
    },
  })

  return status
}

// PUT /api/tasks/[id]/status - Update task status
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    // Validate status value
    const validStatuses = ['PENDING', 'ASSIGNED', 'RUNNING', 'PAUSED', 'ON_HOLD', 'COMPLETED', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      )
    }

    // Find the task
    const task = await db.machiningTask.findUnique({
      where: { id },
      include: {
        jobsheet: {
          include: {
            manufacturingOrder: {
              include: {
                order: true,
              },
            },
          },
        },
      },
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Update task status and progress
    const progressPercent = status === 'COMPLETED' ? 100 : 
                           status === 'CANCELLED' ? 0 : 
                           task.progressPercent

    // Update task
    const updatedTask = await db.machiningTask.update({
      where: { id },
      data: {
        status,
        progressPercent,
        // Update timestamps based on status transitions
        clockedInAt: status === 'RUNNING' && task.status !== 'RUNNING' ? new Date() : task.clockedInAt,
        clockedOutAt: status !== 'RUNNING' && task.status === 'RUNNING' ? new Date() : task.clockedOutAt,
        resolvedAt: status === 'COMPLETED' ? new Date() : task.resolvedAt,
      },
    })

    // Roll up progress to parent entities
    if (task.jobsheetId) {
      // Update Jobsheet progress
      const jsProgress = await calculateJobsheetProgress(task.jobsheetId)
      await updateJobsheetStatus(task.jobsheetId, jsProgress)

      // Update MO progress - use manufacturingOrder.id from included object
      const moId = task.jobsheet.moId || task.jobsheet.manufacturingOrder?.id
      if (moId) {
        const moProgress = await calculateMOProgress(moId)
        await updateMOStatus(moId, moProgress)

        // Update Order progress
        const orderId = task.jobsheet.manufacturingOrder?.orderId || task.jobsheet.manufacturingOrder?.order?.id
        if (orderId) {
          const orderProgress = await calculateOrderProgress(orderId)
          await updateOrderStatus(orderId, orderProgress)
        }
      }
    }

    return NextResponse.json({
      task: {
        ...updatedTask,
        clockedInAt: updatedTask.clockedInAt?.toISOString() || null,
        clockedOutAt: updatedTask.clockedOutAt?.toISOString() || null,
      },
      message: 'Task status updated successfully',
    })
  } catch (error) {
    console.error('Error updating task status:', error)
    return NextResponse.json(
      { error: 'Failed to update task status' },
      { status: 500 }
    )
  }
}
