import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// Validation schema for system settings
const systemSettingsSchema = z.object({
  key: z.string().min(1),
  category: z.string().min(1),
  value: z.string(),
  description: z.string().optional(),
  type: z.enum(['string', 'number', 'boolean', 'json']).optional(),
  isPublic: z.boolean().optional(),
})

// GET /api/settings - Get all system settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const isPublic = searchParams.get('isPublic')
    const search = searchParams.get('search')

    const where: any = {}

    if (category) {
      where.category = category
    }

    if (isPublic !== null && isPublic !== undefined) {
      where.isPublic = isPublic === 'true'
    }

    if (search) {
      where.OR = [
        { key: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const settings = await db.systemSettings.findMany({
      where,
      orderBy: [{ category: 'asc' }, { key: 'asc' }],
    })

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error fetching system settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch system settings' },
      { status: 500 }
    )
  }
}

// POST /api/settings - Create a new system setting
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = systemSettingsSchema.parse(body)

    // Check if setting key already exists
    const existingSetting = await db.systemSettings.findUnique({
      where: { key: validatedData.key },
    })

    if (existingSetting) {
      return NextResponse.json(
        { error: 'Setting with this key already exists' },
        { status: 400 }
      )
    }

    const setting = await db.systemSettings.create({
      data: validatedData,
    })

    return NextResponse.json({ setting }, { status: 201 })
  } catch (error) {
    console.error('Error creating system setting:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create system setting' },
      { status: 500 }
    )
  }
}
