'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  FileText,
  Wrench,
  AlertTriangle,
  TrendingUp,
  Kanban,
  Calendar,
  Package,
  CheckCircle,
  Clock,
  ArrowRightLeft,
  Play,
  Pause,
  User,
  Transfer,
} from 'lucide-react'

interface Activity {
  id: string
  type: 'task' | 'breakdown' | 'handoff'
  icon: string
  message: string
  detail: string
  timestamp: string
  status: string
}

interface DashboardData {
  activeOrders: number
  inProduction: number
  pendingTasks: number
  completedToday: number
  machineUtilization: number
  activeBreakdowns: number
  recentActivity: Activity[]
}

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/dashboard')
      if (res.ok) {
        const result = await res.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (icon: string) => {
    switch (icon) {
      case 'check': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'play': return <Play className="h-4 w-4 text-blue-500" />
      case 'pause': return <Pause className="h-4 w-4 text-yellow-500" />
      case 'clock': return <Clock className="h-4 w-4 text-gray-500" />
      case 'user': return <User className="h-4 w-4 text-purple-500" />
      case 'alert': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'transfer': return <ArrowRightLeft className="h-4 w-4 text-orange-500" />
      default: return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, string> = {
      COMPLETED: 'bg-green-100 text-green-800',
      RUNNING: 'bg-blue-100 text-blue-800',
      PAUSED: 'bg-yellow-100 text-yellow-800',
      PENDING: 'bg-gray-100 text-gray-800',
      ASSIGNED: 'bg-purple-100 text-purple-800',
      ACTIVE: 'bg-red-100 text-red-800',
      RESOLVED: 'bg-green-100 text-green-800',
      PENDING_HANDOFF: 'bg-orange-100 text-orange-800',
      DELIVERED: 'bg-green-100 text-green-800',
      IN_TRANSIT: 'bg-blue-100 text-blue-800',
    }
    return <Badge className={`${config[status] || 'bg-gray-100 text-gray-800'} text-xs`}>{status.replace(/_/g, ' ')}</Badge>
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })
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
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your manufacturing operations</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
              <FileText className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data?.activeOrders || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Orders in production</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Production</CardTitle>
              <Wrench className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data?.inProduction || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Manufacturing orders running</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data?.pendingTasks || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Tasks awaiting execution</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data?.completedToday || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Tasks finished today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Machine Utilization</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data?.machineUtilization || 0}%</div>
              <Progress value={data?.machineUtilization || 0} className="h-2 mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Breakdowns</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data?.activeBreakdowns || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Requiring attention</p>
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

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from the production floor</CardDescription>
          </CardHeader>
          <CardContent>
            {!data?.recentActivity || data.recentActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No recent activity to display</p>
                <p className="text-sm mt-1">Activity will appear here as your team uses the system</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {data.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="mt-0.5">
                      {getActivityIcon(activity.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{activity.message}</p>
                        {getStatusBadge(activity.status)}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {activity.detail}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTime(activity.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
