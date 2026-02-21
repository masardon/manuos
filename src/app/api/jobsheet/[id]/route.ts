import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
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
