'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Clock,
  User,
  Wrench,
  AlertCircle,
  CheckCircle,
  Calendar,
  FileText,
  RefreshCw,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Task {
  id: string
  taskNumber: string
  name: string
  description?: string | null
  status: string
  progressPercent: number
  plannedHours?: number | null
  actualHours?: number | null
  clockedInAt?: string | null
  clockedOutAt?: string | null
  breakdownAt?: string | null
  breakdownNote?: string | null
  machine?: {
    id: string
    code: string
    name: string
    type?: string | null
  } | null
  assignedUser?: {
    id: string
    name?: string | null
    email: string
  } | null
  jobsheet?: {
    id: string
    jsNumber: string
    name: string
    manufacturingOrder?: {
      id: string
      moNumber: string
      name: string
      order?: {
        id: string
        orderNumber: string
        customerName: string
      }
    }
  }
}

export default function TaskDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [task, setTask] = useState<Task | null>(null)

  const fetchTask = async () => {
    try {
      const response = await fetch(`/api/tasks/${params.id}/detail`)
      if (response.ok) {
        const data = await response.json()
        setTask(data.task)
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Task not found',
        })
      }
    } catch (error) {
      console.error('Error fetching task:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load task details',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (params.id) {
      fetchTask()
    }
  }, [params.id])

  const getStatusBadge = (status: string) => {
    const config: Record<string, string> = {
      PENDING: 'bg-gray-100 text-gray-800',
      ASSIGNED: 'bg-blue-100 text-blue-800',
      RUNNING: 'bg-emerald-100 text-emerald-800',
      PAUSED: 'bg-amber-100 text-amber-800',
      ON_HOLD: 'bg-purple-100 text-purple-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    }
    return (
      <Badge className={config[status] || 'bg-gray-100 text-gray-800'}>
        {status.replace(/_/g, ' ')}
      </Badge>
    )
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  if (loading) {
    return (
      <AppLayout title="Task Details">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading task details...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!task) {
    return (
      <AppLayout title="Task Details">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Task not found</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push('/planning/kanban')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Kanban
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Task Details">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">{task.taskNumber}</Badge>
                {getStatusBadge(task.status)}
              </div>
              <h1 className="text-3xl font-bold">{task.name}</h1>
            </div>
          </div>
          <Button variant="outline" onClick={fetchTask} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Completion</span>
                <span className="text-lg font-bold">{task.progressPercent}%</span>
              </div>
              <Progress value={task.progressPercent} className="h-3" />
              {task.progressPercent >= 100 && (
                <div className="flex items-center gap-2 text-green-600 mt-2">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Task completed</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Details Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Order Information */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Order Information</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-2">
              {task.jobsheet?.manufacturingOrder?.order && (
                <div>
                  <div className="text-xs text-muted-foreground">Order</div>
                  <div className="font-medium">{task.jobsheet.manufacturingOrder.order.orderNumber}</div>
                  <div className="text-sm text-muted-foreground">{task.jobsheet.manufacturingOrder.order.customerName}</div>
                </div>
              )}
              {task.jobsheet && (
                <div>
                  <div className="text-xs text-muted-foreground">Jobsheet</div>
                  <div className="font-medium">{task.jobsheet.jsNumber} - {task.jobsheet.name}</div>
                </div>
              )}
              {task.jobsheet?.manufacturingOrder && (
                <div>
                  <div className="text-xs text-muted-foreground">Manufacturing Order</div>
                  <div className="font-medium">{task.jobsheet.manufacturingOrder.moNumber} - {task.jobsheet.manufacturingOrder.name}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Machine Assignment */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Machine</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {task.machine ? (
                <div className="space-y-1">
                  <div className="font-medium">{task.machine.name}</div>
                  <div className="text-sm text-muted-foreground">{task.machine.code}</div>
                  {task.machine.type && (
                    <Badge variant="outline" className="mt-1">{task.machine.type}</Badge>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No machine assigned</div>
              )}
            </CardContent>
          </Card>

          {/* Technician */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Technician</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {task.assignedUser ? (
                <div className="space-y-1">
                  <div className="font-medium">{task.assignedUser.name || task.assignedUser.email}</div>
                  <div className="text-sm text-muted-foreground">{task.assignedUser.email}</div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No technician assigned</div>
              )}
            </CardContent>
          </Card>

          {/* Time Tracking */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time Tracking</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <div className="text-xs text-muted-foreground">Planned Hours</div>
                <div className="font-medium">{task.plannedHours || 0} hrs</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Actual Hours</div>
                <div className="font-medium">{task.actualHours || 0} hrs</div>
              </div>
              <Separator />
              <div>
                <div className="text-xs text-muted-foreground">Clocked In</div>
                <div className="font-medium text-sm">{formatDate(task.clockedInAt)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Clocked Out</div>
                <div className="font-medium text-sm">{formatDate(task.clockedOutAt)}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Breakdown Alert */}
        {task.breakdownAt && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardHeader>
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="h-5 w-5" />
                <CardTitle>Machine Breakdown</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Reported at: </span>
                  {formatDate(task.breakdownAt)}
                </div>
                {task.breakdownNote && (
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border">
                    <div className="text-xs text-muted-foreground mb-1">Notes</div>
                    <div className="text-sm">{task.breakdownNote}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Description */}
        {task.description && (
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{task.description}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
