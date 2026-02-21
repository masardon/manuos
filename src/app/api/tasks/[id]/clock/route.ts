import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

// Update jobsheet status based on progress
async function updateJobsheetStatus(jobsheetId: string, progress: number) {
  const { JobsheetStatus } = await import('@prisma/client')
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

// Calculate progress for an MO based on its jobsheets
async function calculateMOProgress(moId: string) {
  const jobsheets = await db.jobsheet.findMany({
    where: { moId },
    select: { progressPercent: true },
  })

  if (jobsheets.length === 0) return 0
  return Math.round(jobsheets.reduce((sum, js) => sum + js.progressPercent, 0) / jobsheets.length)
}

// Update MO status based on progress
async function updateMOStatus(moId: string, progress: number) {
  const { MOStatus } = await import('@prisma/client')
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

// Calculate progress for an Order based on its MOs
async function calculateOrderProgress(orderId: string) {
  const mos = await db.manufacturingOrder.findMany({
    where: { orderId },
    select: { progressPercent: true },
  })

  if (mos.length === 0) return 0
  return Math.round(mos.reduce((sum, mo) => sum + mo.progressPercent, 0) / mos.length)
}

// Update Order status based on progress
async function updateOrderStatus(orderId: string, progress: number) {
  const { OrderStatus } = await import('@prisma/client')
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

// Roll up progress to parent entities
async function rollupProgress(jobsheetId: string) {
  try {
    // Update Jobsheet progress
    const jsProgress = await calculateJobsheetProgress(jobsheetId)
    console.log(`Jobsheet ${jobsheetId} progress: ${jsProgress}%`)
    await updateJobsheetStatus(jobsheetId, jsProgress)

    // Get jobsheet to find MO
    const jobsheet = await db.jobsheet.findUnique({
      where: { id: jobsheetId },
      include: {
        manufacturingOrder: {
          include: {
            order: true,
          },
        },
      },
    })

    if (jobsheet) {
      // Update MO progress
      const moId = jobsheet.moId || jobsheet.manufacturingOrder?.id
      if (moId) {
        const moProgress = await calculateMOProgress(moId)
        console.log(`MO ${moId} progress: ${moProgress}%`)
        await updateMOStatus(moId, moProgress)

        // Update Order progress
        const orderId = jobsheet.manufacturingOrder?.orderId || jobsheet.manufacturingOrder?.order?.id
        if (orderId) {
          const orderProgress = await calculateOrderProgress(orderId)
          console.log(`Order ${orderId} progress: ${orderProgress}%`)
          await updateOrderStatus(orderId, orderProgress)
        }
      }
    }
  } catch (error) {
    console.error('Error in rollupProgress:', error)
  }
}

// POST /api/tasks/[id]/clock - Clock in/out/pause of task
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action } = body

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

    const now = new Date()

    if (action === 'clock_in') {
      const task = await db.machiningTask.update({
        where: { id },
        data: {
          clockedInAt: now,
          clockedOutAt: null, // Clear clockedOutAt when clocking in
          progressPercent: 1, // Set minimal progress when starting
          status: 'RUNNING', // Update status to RUNNING when clocking in
        },
        include: {
          jobsheet: true,
        },
      })

      // Roll up progress to parent entities
      await rollupProgress(task.jobsheetId)

      return NextResponse.json({
        success: true,
        message: 'Clocked in successfully',
        clockedInAt: now.toISOString(),
      })
    } else if (action === 'clock_out') {
      // Calculate actual hours
      const actualHours = task.clockedInAt
        ? parseFloat(((now.getTime() - new Date(task.clockedInAt).getTime()) / (1000 * 60 * 60)).toFixed(2))
        : task.actualHours

      const updatedTask = await db.machiningTask.update({
        where: { id },
        data: {
          clockedOutAt: now,
          actualHours,
          progressPercent: 100, // Mark as complete when clocking out
          status: 'COMPLETED',
        },
        include: {
          jobsheet: true,
        },
      })

      // Roll up progress to parent entities
      await rollupProgress(updatedTask.jobsheetId)

      return NextResponse.json({
        success: true,
        message: 'Clocked out successfully',
        clockedOutAt: now.toISOString(),
        actualHours,
      })
    } else if (action === 'pause') {
      const updatedTask = await db.machiningTask.update({
        where: { id },
        data: {
          status: 'PAUSED',
        },
        include: {
          jobsheet: true,
        },
      })

      // Roll up progress to parent entities
      await rollupProgress(updatedTask.jobsheetId)

      return NextResponse.json({
        success: true,
        message: 'Task paused',
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating task clock:', error)
    return NextResponse.json(
      { error: 'Failed to update task clock' },
      { status: 500 }
    )
  }
}
