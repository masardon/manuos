import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// Validation schema for updating a system setting
const updateSystemSettingsSchema = z.object({
  value: z.string(),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
})

// GET /api/settings/[id] - Get a specific system setting
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const setting = await db.systemSettings.findUnique({
      where: { id: params.id },
    })

    if (!setting) {
      return NextResponse.json(
        { error: 'Setting not found' },
        { status: 404 }
      )
    }

    // Parse value based on type
    let parsedValue: any = setting.value
    switch (setting.type) {
      case 'number':
        parsedValue = parseFloat(setting.value)
        break
      case 'boolean':
        parsedValue = setting.value === 'true'
        break
      case 'json':
        parsedValue = JSON.parse(setting.value)
        break
    }

    return NextResponse.json({
      setting: {
        ...setting,
        value: parsedValue,
      },
    })
  } catch (error) {
    console.error('Error fetching system setting:', error)
    return NextResponse.json(
      { error: 'Failed to fetch system setting' },
      { status: 500 }
    )
  }
}

// PUT /api/settings/[id] - Update a system setting
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = updateSystemSettingsSchema.parse(body)

    // Check if setting exists
    const existingSetting = await db.systemSettings.findUnique({
      where: { id: params.id },
    })

    if (!existingSetting) {
      return NextResponse.json(
        { error: 'Setting not found' },
        { status: 404 }
      )
    }

    // Convert value to string based on type
    let valueString = validatedData.value
    if (typeof validatedData.value !== 'string') {
      valueString = String(validatedData.value)
    }

    // Update setting
    const setting = await db.systemSettings.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        value: valueString,
      },
    })

    return NextResponse.json({ setting })
  } catch (error) {
    console.error('Error updating system setting:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update system setting' },
      { status: 500 }
    )
  }
}

// DELETE /api/settings/[id] - Delete a system setting
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if setting exists
    const existingSetting = await db.systemSettings.findUnique({
      where: { id: params.id },
    })

    if (!existingSetting) {
      return NextResponse.json(
        { error: 'Setting not found' },
        { status: 404 }
      )
    }

    // Delete setting
    await db.systemSettings.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting system setting:', error)
    return NextResponse.json(
      { error: 'Failed to delete system setting' },
      { status: 500 }
    )
  }
}
