import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/reports/breakdowns - Get breakdown data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const breakdowns = await db.breakdown.findMany({
      where: {
        tenantId: 'tenant_default',
      },
      include: {
        machine: true,
      },
      orderBy: {
        reportedAt: 'desc',
      },
    })

    const breakdownsByType = breakdowns.reduce((acc, b) => {
      if (!acc[b.type]) acc[b.type] = []
      acc[b.type].push(b)
      return acc
    }, {} as Record<string, typeof breakdowns>)

    const totalBreakdownTime = breakdowns
      .filter((b) => b.resolvedAt)
      .reduce((sum, b) => {
        if (b.resolvedAt) {
          return sum + (b.resolvedAt.getTime() - new Date(b.reportedAt).getTime())
        }
        return sum
      }, 0)

    return NextResponse.json({
      success: true,
      startDate,
      endDate,
      breakdowns: breakdowns.map((b) => ({
        id: b.id,
        machineCode: b.machine?.code,
        machineName: b.machine?.name,
        type: b.type,
        description: b.description,
        reportedBy: b.reportedBy || 'Unknown',
        reportedAt: b.reportedAt,
        resolved: b.resolved,
        resolvedAt: b.resolvedAt,
        resolvedBy: b.resolvedBy || null,
        resolution: b.resolution,
        durationHours: b.resolvedAt
          ? Math.round((new Date(b.resolvedAt).getTime() - new Date(b.reportedAt).getTime()) / (1000 * 60 * 60))
          : null,
      })),
      statistics: {
        total: breakdowns.length,
        resolvedCount: breakdowns.filter((b) => b.resolved).length,
        activeCount: breakdowns.filter((b) => !b.resolved).length,
      },
      breakdownsByType: Object.entries(breakdownsByType).map(([type, items]) => ({
        type,
        count: items.length,
      })),
    })
  } catch (error) {
    console.error('Error generating breakdowns report:', error)
    return NextResponse.json(
      { error: 'Failed to generate breakdowns report' },
      { status: 500 }
    )
  }
}
