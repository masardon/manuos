import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { JobsheetStatus } from '@prisma/client'

interface Params {
  params: Promise<{ id: string }>
}

// GET /api/mo/[id]/jobsheets - Get all jobsheets for an MO
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    
    const jobsheets = await db.jobsheet.findMany({
      where: { moId: id },
      include: {
        machiningTasks: {
          include: {
            machine: true,
            assignedUser: true,
          },
          orderBy: {
            taskNumber: 'asc',
          },
        },
      },
      orderBy: {
        jsNumber: 'asc',
      },
    })

    return NextResponse.json({
      success: true,
      jobsheets,
      count: jobsheets.length,
    })
  } catch (error) {
    console.error('Error fetching jobsheets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch jobsheets' },
      { status: 500 }
    )
  }
}

// POST /api/mo/[id]/jobsheets - Create a new jobsheet
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      jsNumber,
      name,
      description,
      plannedStartDate,
      plannedEndDate,
      drawingUrl,
    } = body

    if (!jsNumber || !name || !plannedStartDate || !plannedEndDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get MO to get tenant and order info
    const mo = await db.manufacturingOrder.findUnique({
      where: { id },
      include: {
        order: true,
      },
    })

    if (!mo) {
      return NextResponse.json(
        { error: 'Manufacturing Order not found' },
        { status: 404 }
      )
    }

    const jobsheet = await db.jobsheet.create({
      data: {
        tenantId: mo.tenantId,
        moId: id,
        jsNumber,
        name,
        description,
        drawingUrl,
        status: JobsheetStatus.PREPARING,
        plannedStartDate: new Date(plannedStartDate),
        plannedEndDate: new Date(plannedEndDate),
        progressPercent: 0,
      },
    })

    return NextResponse.json({
      success: true,
      jobsheet,
      message: 'Jobsheet created successfully',
    })
  } catch (error) {
    console.error('Error creating jobsheet:', error)
    return NextResponse.json(
      { error: 'Failed to create jobsheet' },
      { status: 500 }
    )
  }
}

// DELETE /api/mo/[id]/jobsheets/[jsId] - Delete a jobsheet
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const jsId = searchParams.get('jsId')

    if (!jsId) {
      return NextResponse.json(
        { error: 'Jobsheet ID required' },
        { status: 400 }
      )
    }

    await db.jobsheet.delete({
      where: { id: jsId },
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
