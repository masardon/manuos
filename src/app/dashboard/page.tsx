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
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Kanban,
  Calendar,
  Package,
  CheckCircle,
  Clock,
} from 'lucide-react'

interface DashboardStats {
  activeOrders: number
  inProduction: number
  pendingTasks: number
  completedToday: number
  machineUtilization: number
  activeBreakdowns: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Try to fetch stats, use mock data if API not available
      const statsRes = await fetch('/api/dashboard/stats')
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      } else {
        // Mock data for demo
        setStats({
          activeOrders: 12,
          inProduction: 8,
          pendingTasks: 23,
          completedToday: 5,
          machineUtilization: 78,
          activeBreakdowns: 2,
        })
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Use mock data on error
      setStats({
        activeOrders: 12,
        inProduction: 8,
        pendingTasks: 23,
        completedToday: 5,
        machineUtilization: 78,
        activeBreakdowns: 2,
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading dashboard...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your manufacturing operations
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
              <FileText className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.activeOrders || '-'}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Orders in production
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Production</CardTitle>
              <Wrench className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.inProduction || '-'}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Orders currently running
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.pendingTasks || '-'}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Tasks awaiting execution
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.completedToday || '-'}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Tasks finished today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Machine Utilization</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.machineUtilization || 0}%</div>
              <div className="mt-2">
                <Progress value={stats?.machineUtilization || 0} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Breakdowns</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.activeBreakdowns || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Requiring attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => router.push('/planning/kanban')}>
              <CardHeader>
                <Kanban className="h-8 w-8 text-emerald-500 mb-2" />
                <CardTitle>Kanban Board</CardTitle>
                <CardDescription>Manage tasks by status</CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => router.push('/planning/gantt')}>
              <CardHeader>
                <Calendar className="h-8 w-8 text-blue-500 mb-2" />
                <CardTitle>Gantt Chart</CardTitle>
                <CardDescription>Timeline visualization</CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => router.push('/machines/breakdowns')}>
              <CardHeader>
                <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
                <CardTitle>Report Breakdown</CardTitle>
                <CardDescription>Report machine issues</CardDescription>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => router.push('/inventory')}>
              <CardHeader>
                <Package className="h-8 w-8 text-orange-500 mb-2" />
                <CardTitle>Inventory</CardTitle>
                <CardDescription>Manage materials</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from the production floor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p>No recent activity to display</p>
              <p className="text-sm mt-1">Activity will appear here as your team uses the system</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
