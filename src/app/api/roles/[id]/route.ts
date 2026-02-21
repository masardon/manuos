import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

// Validation schema for updating a role
const updateRoleSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).regex(/^ROLE_[A-Z_]+$/, 'Role code must start with ROLE_ and contain uppercase letters and underscores').optional(),
  description: z.string().optional(),
})

// GET /api/roles/[id] - Get a specific role
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const role = await db.role.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { user: true },
        },
      },
    })

    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ role })
  } catch (error) {
    console.error('Error fetching role:', error)
    return NextResponse.json(
      { error: 'Failed to fetch role' },
      { status: 500 }
    )
  }
}

// PUT /api/roles/[id] - Update a role
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = updateRoleSchema.parse(body)

    // Check if role exists
    const existingRole = await db.role.findUnique({
      where: { id: params.id },
    })

    if (!existingRole) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      )
    }

    // System roles cannot be modified
    if (existingRole.isSystem) {
      return NextResponse.json(
        { error: 'System roles cannot be modified' },
        { status: 403 }
      )
    }

    // If code is being updated, check if it's already taken
    if (validatedData.code && validatedData.code !== existingRole.code) {
      const codeExists = await db.role.findUnique({
        where: { code: validatedData.code },
      })

      if (codeExists) {
        return NextResponse.json(
          { error: 'Role code already in use' },
          { status: 400 }
        )
      }
    }

    const role = await db.role.update({
      where: { id: params.id },
      data: validatedData,
    })

    return NextResponse.json({ role })
  } catch (error) {
    console.error('Error updating role:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    )
  }
}

// DELETE /api/roles/[id] - Delete a role
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if role exists
    const existingRole = await db.role.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { user: true },
        },
      },
    })

    if (!existingRole) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      )
    }

    // System roles cannot be deleted
    if (existingRole.isSystem) {
      return NextResponse.json(
        { error: 'System roles cannot be deleted' },
        { status: 403 }
      )
    }

    // Check if role has users
    if (existingRole._count.user > 0) {
      return NextResponse.json(
        { error: 'Cannot delete role with assigned users. Please reassign users first.' },
        { status: 400 }
      )
    }

    // Delete role
    await db.role.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting role:', error)
    return NextResponse.json(
      { error: 'Failed to delete role' },
      { status: 500 }
    )
  }
}
