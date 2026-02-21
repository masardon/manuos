'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  FileText,
  Wrench,
  Calendar,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Kanban,
} from 'lucide-react'

interface DashboardStats {
  activeOrders: number
  inProduction: number
  pendingTasks: number
  machineUtilization: number
}

export default function PlanningPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentEvents, setRecentEvents] = useState<Array<{
    id: string
    type: 'info' | 'warning' | 'alert'
    title: string
    message: string
    time: string
  }>>([])

  const fetchPlanningData = async () => {
    try {
      const statsRes = await fetch('/api/dashboard/stats')
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      // Mock recent events (would come from audit logs)
      setRecentEvents([
        {
          id: '1',
          type: 'info',
          title: 'Material Reserved',
          message: '10 units of Steel Sheet reserved for ORD-001',
          time: '2 hours ago',
        },
        {
          id: '2',
          type: 'warning',
          title: 'Low Stock Alert',
          message: 'Material AL-203 below minimum quantity (5 units)',
          time: '3 hours ago',
        },
        {
          id: '3',
          type: 'alert',
          title: 'Machine Breakdown',
          message: 'CNC Lathe M-002 reported breakdown',
          time: '5 hours ago',
        },
        {
          id: '4',
          type: 'info',
          title: 'Order Completed',
          message: 'Manufacturing Order MO-005 completed',
          time: '1 day ago',
        },
      ])
    } catch (error) {
      console.error('Error fetching planning data:', error)
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            setIsAuthenticated(true)
            setLoading(false)
            await fetchPlanningData()
          } else {
            router.replace('/login')
          }
        } else {
          router.replace('/login')
        }
      } catch (error) {
        console.error('Auth check error:', error)
        router.replace('/login')
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <AppLayout title="Planning">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Production Planning
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage production schedules and timelines
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Orders
              </CardTitle>
              <FileText className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeOrders || '-'}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Orders in production
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                In Production
              </CardTitle>
              <Wrench className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.inProduction || '-'}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Orders currently running
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Tasks
              </CardTitle>
              <Wrench className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pendingTasks || '-'}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Tasks awaiting execution
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Machine Utilization
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.machineUtilization || 0}%</div>
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Efficiency</span>
                  <span className="font-medium">{stats?.machineUtilization || 0}%</span>
                </div>
                <Progress value={stats?.machineUtilization || 0} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="cursor-pointer hover:border-orange-500 transition-colors" onClick={() => router.push('/planning/gantt')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-500" />
                Gantt Chart
              </CardTitle>
              <CardDescription>
                Visual timeline of all orders and manufacturing tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">View</span>
                  <Badge className="bg-blue-100 text-blue-800">Timeline</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Period</span>
                  <span className="font-medium">Month/Week</span>
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline">
                Open Gantt Chart
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-orange-500 transition-colors" onClick={() => router.push('/planning/kanban')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Kanban className="h-5 w-5 text-emerald-500" />
                Kanban Board
              </CardTitle>
              <CardDescription>
                Drag-and-drop task management by status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">View</span>
                  <Badge className="bg-emerald-100 text-emerald-800">Board</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">Interactive</span>
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline">
                Open Kanban Board
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:border-orange-500 transition-colors" onClick={() => router.push('/orders')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-500" />
                View Orders
              </CardTitle>
              <CardDescription>
                Browse and manage customer orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">View</span>
                  <Badge className="bg-blue-100 text-blue-800">List</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Orders</span>
                  <span className="font-medium">5 Active</span>
                </div>
              </div>
              <Button className="w-full mt-4" variant="outline">
                View Orders
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Events */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>
              Latest production and inventory activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {recentEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No recent events
                </div>
              ) : (
                recentEvents.map((event) => (
                  <div key={event.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 ${
                        event.type === 'info' ? 'text-blue-500' :
                        event.type === 'warning' ? 'text-yellow-500' :
                        'text-red-500'
                      }`}>
                        {event.type === 'info' && <Calendar className="h-4 w-4" />}
                        {event.type === 'warning' && <AlertTriangle className="h-4 w-4" />}
                        {event.type === 'alert' && <AlertTriangle className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{event.message}</p>
                        <p className="text-xs text-muted-foreground">{event.time}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
