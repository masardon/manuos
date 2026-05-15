// Locations API - Manage inventory locations
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth/middleware'
import { 
  createLocation, 
  createShelf, 
  initializeDefaultLocations,
  getLocationHandoffHistory 
} from '@/lib/inventory/material-handoff'
import { z } from 'zod'

const createLocationSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['WAREHOUSE', 'PPIC_RACK', 'PRODUCTION_AREA', 'WORKSTATION', 'QC_AREA', 'TOOL_CRIB', 'SHIPPING', 'RECEIVING']),
  description: z.string().optional(),
  parentLocationId: z.string().optional(),
  capacity: z.number().min(0).optional(),
  area: z.number().min(0).optional(),
  picUserId: z.string().optional(),
  building: z.string().optional(),
  floor: z.string().optional(),
  zone: z.string().optional(),
})

const createShelfSchema = z.object({
  locationId: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  row: z.string().optional(),
  column: z.string().optional(),
  level: z.string().optional(),
  capacity: z.number().min(0).optional(),
})

// GET /api/locations - List all locations
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = request.nextUrl
    
    const type = searchParams.get('type')
    const includeShelves = searchParams.get('includeShelves') === 'true'
    const includeInventory = searchParams.get('includeInventory') === 'true'

    const where: any = { tenantId: user.tenantId, isActive: true }
    if (type) where.type = type

    const locations = await db.location.findMany({
      where,
      include: {
        parentLocation: { select: { id: true, name: true, code: true } },
        childLocations: { select: { id: true, name: true, code: true, type: true } },
        picUser: { select: { id: true, name: true, email: true } },
        shelves: includeShelves ? {
          include: {
            _count: { select: { inventory: true } }
          }
        } : false,
        _count: {
          select: { 
            inventory: true,
            outgoingHandoffs: true,
            incomingHandoffs: true
          }
        }
      },
      orderBy: [{ type: 'asc' }, { code: 'asc' }]
    })

    // Get inventory summary for each location if requested
    let locationSummary = null
    if (includeInventory) {
      locationSummary = await db.inventory.groupBy({
        by: ['locationId', 'status'],
        where: { tenantId: user.tenantId, locationId: { not: null } },
        _count: true,
        _sum: { quantity: true }
      })
    }

    return NextResponse.json({
      success: true,
      locations,
      locationSummary,
      count: locations.length
    })
  } catch (error) {
    console.error('Error fetching locations:', error)
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 })
  }
}

// POST /api/locations - Create location, shelf, or initialize defaults
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    
    // Check if it's an init request
    if (body.action === 'initialize') {
      const locations = await initializeDefaultLocations(user.tenantId, user.id)
      return NextResponse.json({
        success: true,
        locations,
        message: 'Default locations initialized successfully'
      })
    }
    
    // Check if it's a shelf creation request
    if (body.action === 'create_shelf' || body.locationId) {
      const data = createShelfSchema.parse(body)
      const shelf = await createShelf(user.tenantId, data, user.id)
      return NextResponse.json({
        success: true,
        shelf,
        message: 'Shelf created successfully'
      }, { status: 201 })
    }
    
    // Otherwise create a single location
    const data = createLocationSchema.parse(body)
    const location = await createLocation(user.tenantId, data, user.id)

    return NextResponse.json({
      success: true,
      location,
      message: 'Location created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating location:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.issues }, { status: 400 })
    }
    if (error instanceof Error && error.name === 'AuthError') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to create location' }, { status: 500 })
  }
}
