import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// Validation schema for creating a user
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  phone: z.string().optional(),
  roleId: z.string(),
  password: z.string().min(6),
  tenantId: z.string(),
  employeeId: z.string().optional(),
  avatarUrl: z.string().url().optional(),
})

// Validation schema for updating a user
const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  roleId: z.string().optional(),
  password: z.string().min(6).optional(),
  isActive: z.boolean().optional(),
  employeeId: z.string().optional(),
  avatarUrl: z.string().url().optional(),
})

// GET /api/users - Get all users with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const roleId = searchParams.get('roleId')
    const isActive = searchParams.get('isActive')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (tenantId) {
      where.tenantId = tenantId
    }

    if (roleId) {
      where.roleId = roleId
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    if (search) {
      where.OR = [
        { email: { contains: search } },
        { name: { contains: search } },
        { employeeId: { contains: search } },
      ]
    }

    // Get users with pagination
    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        include: {
          role: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.user.count({ where }),
    ])

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Check if user with email already exists in tenant
    const existingUser = await db.user.findFirst({
      where: {
        tenantId: validatedData.tenantId,
        email: validatedData.email,
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password (simple hash for now - in production, use bcrypt)
    const passwordHash = Buffer.from(validatedData.password).toString('base64')

    // Create user
    const user = await db.user.create({
      data: {
        ...validatedData,
        passwordHash,
      },
      include: {
        role: true,
      },
    })

    // Create default user settings
    await db.userSettings.create({
      data: {
        userId: user.id,
      },
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
