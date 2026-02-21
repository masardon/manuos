import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// Validation schema for user settings
const userSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
  emailNotifications: z.boolean().optional(),
  taskReminders: z.boolean().optional(),
  breakdownAlerts: z.boolean().optional(),
  inventoryAlerts: z.boolean().optional(),
  defaultView: z.string().optional(),
  showInactiveMachines: z.boolean().optional(),
  showCompletedTasks: z.boolean().optional(),
  rowsPerPage: z.number().min(5).max(100).optional(),
})

// GET /api/usersettings?userId=xxx - Get user settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    let settings = await db.userSettings.findUnique({
      where: { userId },
    })

    // If no settings exist, create default settings
    if (!settings) {
      settings = await db.userSettings.create({
        data: { userId },
      })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error fetching user settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user settings' },
      { status: 500 }
    )
  }
}

// PUT /api/usersettings - Update user settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ...settingsData } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const validatedData = userSettingsSchema.parse(settingsData)

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update or create settings
    let settings = await db.userSettings.findUnique({
      where: { userId },
    })

    if (!settings) {
      settings = await db.userSettings.create({
        data: {
          userId,
          ...validatedData,
        },
      })
    } else {
      settings = await db.userSettings.update({
        where: { userId },
        data: validatedData,
      })
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error updating user settings:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update user settings' },
      { status: 500 }
    )
  }
}
