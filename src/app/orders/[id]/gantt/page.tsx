'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeft,
  RefreshCw,
  Kanban,
  Store,
  TrendingUp,
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'

interface ManufacturingOrder {
  id: string
  moNumber: string
  name: string
  status: string
  progressPercent: number
  plannedStartDate: string
  plannedEndDate: string
  jobsheets: Jobsheet[]
}

interface Jobsheet {
  id: string
  jsNumber: string
  name: string
  status: string
  progressPercent: number
  plannedStartDate: string
  plannedEndDate: string
}

interface Order {
  id: string
  orderNumber: string
  customerName: string
  status: string
  progressPercent: number
  plannedStartDate: string
  plannedEndDate: string
  manufacturingOrders: ManufacturingOrder[]
}

export default function OrderGanttPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<Order | null>(null)

  useEffect(() => {
    fetchOrder()
  }, [params.id])

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${params.id}/gantt`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data.order)
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Order not found',
        })
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load order Gantt chart',
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PLANNING: 'bg-blue-100 text-blue-800',
      MATERIAL_PREPARATION: 'bg-indigo-100 text-indigo-800',
      IN_PRODUCTION: 'bg-orange-100 text-orange-800',
      COMPLETED: 'bg-green-100 text-green-800',
      DELIVERED: 'bg-purple-100 text-purple-800',
    }
    return <Badge className={config[status] || 'bg-gray-100 text-gray-800'}>{status.replace(/_/g, ' ')}</Badge>
  }

  const getMOStatusColor = (status: string) => {
    if (status === 'COMPLETED') return 'bg-green-500'
    if (status === 'IN_PROGRESS') return 'bg-emerald-500'
    if (status === 'PLANNED') return 'bg-blue-500'
    return 'bg-slate-400'
  }

  const formatDateTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const formatFullDateTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  // Calculate timeline position
  const getTimelinePosition = (startDate: string, endDate: string, timelineStart: Date, timelineEnd: Date) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const totalDuration = timelineEnd.getTime() - timelineStart.getTime()
    const startOffset = start.getTime() - timelineStart.getTime()
    const duration = end.getTime() - start.getTime()
    
    const left = (startOffset / totalDuration) * 100
    const width = (duration / totalDuration) * 100
    
    return { left: Math.max(0, left), width: Math.max(2, width) }
  }

  if (loading) {
    return (
      <AppLayout title="Order Gantt Chart">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading Gantt chart...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!order) {
    return (
      <AppLayout title="Order Not Found">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Order not found</p>
            <Button onClick={() => router.push(`/orders/${params.id}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Order
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  // Calculate timeline range
  const timelineStart = new Date(order.plannedStartDate)
  timelineStart.setDate(timelineStart.getDate() - 7)
  const timelineEnd = new Date(order.plannedEndDate)
  timelineEnd.setDate(timelineEnd.getDate() + 7)

  return (
    <AppLayout title="Order Gantt Chart">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push(`/orders/${params.id}`)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">{order.orderNumber}</Badge>
                {getStatusBadge(order.status)}
              </div>
              <h1 className="text-3xl font-bold">{order.customerName}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/orders/${params.id}`)}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Order Details
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="outline" onClick={fetchOrder} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Order Info */}
        <Card>
          <CardHeader>
            <CardTitle>Order Timeline</CardTitle>
            <CardDescription>
              {formatFullDateTime(order.plannedStartDate)} - {formatFullDateTime(order.plannedEndDate)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Overall Progress</div>
                <div className="text-2xl font-bold">{order.progressPercent}%</div>
              </div>
              <div className="flex-1 mx-8">
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${order.progressPercent}%` }}
                  />
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {order.manufacturingOrders.length} MOs
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gantt Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Manufacturing Orders Gantt Chart</CardTitle>
            <CardDescription>Visual timeline of manufacturing orders and jobsheets</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Timeline Header */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-muted-foreground pb-2 border-b">
                {Array.from({ length: 8 }).map((_, i) => {
                  const date = new Date(timelineStart)
                  date.setDate(date.getDate() + i * Math.ceil((timelineEnd.getTime() - timelineStart.getTime()) / (7 * 24 * 60 * 60 * 1000)))
                  return (
                    <div key={i} className="text-center flex-1">
                      {formatDateTime(date)}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Gantt Bars */}
            <div className="space-y-6">
              {order.manufacturingOrders.map((mo) => (
                <div key={mo.id} className="space-y-2">
                  {/* MO Bar */}
                  <div className="flex items-center gap-4">
                    <div className="w-48 shrink-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{mo.moNumber}</Badge>
                        <span className="font-medium text-sm truncate">{mo.name}</span>
                      </div>
                    </div>
                    <div className="flex-1 relative h-8">
                      {(() => {
                        const pos = getTimelinePosition(
                          mo.plannedStartDate,
                          mo.plannedEndDate,
                          timelineStart,
                          timelineEnd
                        )
                        return (
                          <div
                            className={`absolute top-1/2 -translate-y-1/2 h-6 rounded shadow-sm cursor-pointer ${
                              mo.status === 'COMPLETED' ? 'bg-green-500' :
                              mo.status === 'IN_PROGRESS' ? 'bg-emerald-500' :
                              'bg-blue-500'
                            }`}
                            style={{ left: `${pos.left}%`, width: `${pos.width}%` }}
                            title={`${mo.moNumber}: ${mo.name}\n${formatDateTime(mo.plannedStartDate)} - ${formatDateTime(mo.plannedEndDate)}\nProgress: ${mo.progressPercent}%`}
                          >
                            <div className="h-full flex items-center px-2">
                              <span className="text-xs font-medium text-white truncate">
                                {mo.progressPercent}%
                              </span>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </div>

                  {/* Jobsheet Bars */}
                  {mo.jobsheets.map((js) => (
                    <div key={js.id} className="flex items-center gap-4 pl-8">
                      <div className="w-48 shrink-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">{js.jsNumber}</Badge>
                          <span className="text-sm text-muted-foreground truncate">{js.name}</span>
                        </div>
                      </div>
                      <div className="flex-1 relative h-6">
                        {(() => {
                          const pos = getTimelinePosition(
                            js.plannedStartDate,
                            js.plannedEndDate,
                            timelineStart,
                            timelineEnd
                          )
                          return (
                            <div
                              className={`absolute top-1/2 -translate-y-1/2 h-4 rounded ${
                                js.status === 'COMPLETED' ? 'bg-green-400' :
                                js.status === 'IN_PROGRESS' ? 'bg-emerald-400' :
                                'bg-slate-400'
                              }`}
                              style={{ left: `${pos.left}%`, width: `${pos.width}%` }}
                              title={`${js.jsNumber}: ${js.name}\n${formatDateTime(js.plannedStartDate)} - ${formatDateTime(js.plannedEndDate)}\nProgress: ${js.progressPercent}%`}
                            >
                              <div className="h-full flex items-center px-2">
                                <span className="text-xs font-medium text-white truncate">
                                  {js.progressPercent}%
                                </span>
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-8 pt-4 border-t">
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span>Planned</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-emerald-500 rounded"></div>
                  <span>In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-slate-400 rounded"></div>
                  <span>Jobsheet</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
