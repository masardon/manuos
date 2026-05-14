import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const DEMO_TENANT_ID = 'tenant_ypti'

// GET /api/recipes - List all recipes
export async function GET(request: NextRequest) {
  try {
    const recipes = await db.recipe.findMany({
      where: { 
        tenantId: DEMO_TENANT_ID,
        isActive: true 
      },
      include: {
        ingredients: {
          include: {
            inventory: {
              select: {
                id: true,
                partNumber: true,
                name: true,
                availableQty: true,
                unit: true,
                location: true,
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ recipes })
  } catch (error) {
    console.error('Error fetching recipes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recipes' },
      { status: 500 }
    )
  }
}