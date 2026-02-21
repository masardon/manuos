import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tenantId = searchParams.get('tenantId') || 'tenant_ypti'

    const machines = await db.machine.findMany({
      where: {
        tenantId,
      },
      orderBy: {
        code: 'asc',
      },
    })

    return NextResponse.json({ machines })
  } catch (error) {
    console.error('Error fetching machines:', error)
    return NextResponse.json({ machines: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, name, model, location, type, tenantId } = body

    if (!code || !name) {
      return NextResponse.json(
        { error: 'Code and name are required' },
        { status: 400 }
      )
    }

    const machine = await db.machine.create({
      data: {
        tenantId: tenantId || 'tenant_default',
        code,
        name,
        model,
        location,
        type,
        status: 'IDLE',
        isActive: true,
      },
    })

    return NextResponse.json({ machine })
  } catch (error) {
    console.error('Error creating machine:', error)
    return NextResponse.json(
      { error: 'Failed to create machine' },
      { status: 500 }
    )
  }
}
