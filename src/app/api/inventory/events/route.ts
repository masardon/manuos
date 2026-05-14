import { NextRequest, NextResponse } from 'next/server'
import { createSSEStream, getSSEHeaders } from '@/lib/events/inventory-events'
import { requireAuth } from '@/lib/middleware/auth'

export async function GET(request: NextRequest) {
  try {
    // Get user from auth (optional - for tenant filtering)
    const user = requireAuth(request)
    const tenantId = user?.tenantId || request.nextUrl.searchParams.get('tenantId') || undefined

    // Create SSE stream
    const stream = createSSEStream(tenantId)

    // Return SSE response
    return new NextResponse(stream, {
      headers: getSSEHeaders()
    })
  } catch (error) {
    console.error('SSE connection error:', error)
    return NextResponse.json(
      { error: 'Failed to establish SSE connection' },
      { status: 500 }
    )
  }
}

// Disable caching for SSE
export const dynamic = 'force-dynamic'
export const revalidate = 0
