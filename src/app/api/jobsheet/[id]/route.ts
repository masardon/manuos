import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

// GET /api/jobsheet/[id] - Get jobsheet details with tasks
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    const jobsheet = await db.jobsheet.findUnique({
      where: { id },
      include: {
        machiningTasks: {
          include: {
            machine: {
              select: {
                id: true,
                code: true,
                name: true,
                type: true,
              },
            },
            assignedUser: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            taskNumber: 'asc',
          },
        },
        manufacturingOrder: {
          include: {
            order: {
              select: {
                id: true,
                orderNumber: true,
                customerName: true,
                status: true,
                progressPercent: true,
              },
            },
          },
        },
      },
    })

    if (!jobsheet) {
      return NextResponse.json(
        { error: 'Jobsheet not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      jobsheet: {
        ...jobsheet,
        plannedStartDate: jobsheet.plannedStartDate?.toISOString() || null,
        plannedEndDate: jobsheet.plannedEndDate?.toISOString() || null,
        actualStartDate: jobsheet.actualStartDate?.toISOString() || null,
        actualEndDate: jobsheet.actualEndDate?.toISOString() || null,
      },
    })
  } catch (error) {
    console.error('Error fetching jobsheet details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch jobsheet details' },
      { status: 500 }
    )
  }
}

// PUT /api/jobsheet/[id] - Update a jobsheet
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()

    const jobsheet = await db.jobsheet.update({
      where: { id },
      data: {
        jsNumber: body.jsNumber,
        name: body.name,
        description: body.description,
        drawingUrl: body.drawingUrl,
        plannedStartDate: body.plannedStartDate ? new Date(body.plannedStartDate) : null,
        plannedEndDate: body.plannedEndDate ? new Date(body.plannedEndDate) : null,
      },
    })

    return NextResponse.json({
      success: true,
      jobsheet,
      message: 'Jobsheet updated successfully',
    })
  } catch (error) {
    console.error('Error updating jobsheet:', error)
    return NextResponse.json(
      { error: 'Failed to update jobsheet' },
      { status: 500 }
    )
  }
}

// DELETE /api/jobsheet/[id] - Delete a jobsheet
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params

    await db.jobsheet.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Jobsheet deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting jobsheet:', error)
    return NextResponse.json(
      { error: 'Failed to delete jobsheet' },
      { status: 500 }
    )
  }
}
