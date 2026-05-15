import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const TENANT_ID = 'tenant_ypti'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const dateFilter: any = {}
    if (startDate) dateFilter.gte = new Date(startDate)
    if (endDate) dateFilter.lte = new Date(endDate)

    const where: any = { tenantId: TENANT_ID }
    if (startDate || endDate) {
      where.reportedAt = dateFilter
    }

    const breakdowns = await db.breakdown.findMany({
      where,
      include: {
        machine: {
          select: {
            code: true,
            name: true,
            type: true,
            location: true,
          },
        },
      },
      orderBy: { reportedAt: 'desc' },
    })

    const breakdownsByType = breakdowns.reduce((acc, b) => {
      if (!acc[b.type]) acc[b.type] = []
      acc[b.type].push(b)
      return acc
    }, {} as Record<string, typeof breakdowns>)

    const resolvedBreakdowns = breakdowns.filter(b => b.resolvedAt)
    const totalDowntimeHours = resolvedBreakdowns.reduce((sum, b) => {
      if (b.resolvedAt) {
        return sum + (new Date(b.resolvedAt).getTime() - new Date(b.reportedAt).getTime()) / (1000 * 60 * 60)
      }
      return sum
    }, 0)

    const avgResolutionHours = resolvedBreakdowns.length > 0
      ? totalDowntimeHours / resolvedBreakdowns.length
      : 0

    return NextResponse.json({
      success: true,
      reportType: 'breakdowns',
      generatedAt: new Date().toISOString(),
      dateRange: { startDate, endDate },
      breakdowns: breakdowns.map((b) => ({
        id: b.id,
        machineCode: b.machine?.code || 'N/A',
        machineName: b.machine?.name || 'N/A',
        machineType: b.machine?.type || 'N/A',
        machineLocation: b.machine?.location || 'N/A',
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
      summary: {
        total: breakdowns.length,
        resolvedCount: breakdowns.filter(b => b.resolved).length,
        activeCount: breakdowns.filter(b => !b.resolved).length,
        totalDowntimeHours: totalDowntimeHours.toFixed(1),
        avgResolutionHours: avgResolutionHours.toFixed(1),
        breakdownsByType: Object.entries(breakdownsByType).map(([type, items]) => ({
          type,
          count: items.length,
          resolved: items.filter(i => i.resolved).length,
        })),
      },
    })
  } catch (error) {
    console.error('Error generating breakdowns report:', error)
    return NextResponse.json(
      { error: 'Failed to generate breakdowns report' },
      { status: 500 }
    )
  }
}
