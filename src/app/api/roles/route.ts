import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// Validation schema for creating a role
const createRoleSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).regex(/^ROLE_[A-Z_]+$/, 'Role code must start with ROLE_ and contain uppercase letters and underscores'),
  description: z.string().optional(),
  isSystem: z.boolean().optional().default(false),
})

// Validation schema for updating a role
const updateRoleSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).regex(/^ROLE_[A-Z_]+$/, 'Role code must start with ROLE_ and contain uppercase letters and underscores').optional(),
  description: z.string().optional(),
})

// GET /api/roles - Get all roles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const roles = await db.role.findMany({
      where,
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    })

    return NextResponse.json({ roles })
  } catch (error) {
    console.error('Error fetching roles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    )
  }
}

// POST /api/roles - Create a new role
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createRoleSchema.parse(body)

    // Check if role code already exists
    const existingRole = await db.role.findUnique({
      where: { code: validatedData.code },
    })

    if (existingRole) {
      return NextResponse.json(
        { error: 'Role with this code already exists' },
        { status: 400 }
      )
    }

    const role = await db.role.create({
      data: validatedData,
    })

    return NextResponse.json({ role }, { status: 201 })
  } catch (error) {
    console.error('Error creating role:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    )
  }
}
