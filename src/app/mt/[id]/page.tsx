'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
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
  Play,
  Pause,
  CheckSquare,
} from 'lucide-react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { ScrollArea } from '@/components/ui/scroll-area'

interface MachiningTask {
  id: string
  taskNumber: string
  name: string
  description: string | null
  status: string
  progressPercent: number
  plannedHours: number | null
  actualHours: number | null
  clockedInAt: string | null
  clockedOutAt: string | null
  breakdownAt: string | null
  breakdownNote: string | null
  machine?: {
    id: string
    code: string
    name: string
    type: string | null
  } | null
  assignedUser?: {
    id: string
    name: string | null
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

const COLUMNS = [
  { id: 'pending', title: 'Pending', status: 'PENDING', icon: AlertCircle, color: 'bg-slate-100 border-slate-200' },
  { id: 'assigned', title: 'Assigned', status: 'ASSIGNED', icon: User, color: 'bg-blue-50 border-blue-200' },
  { id: 'running', title: 'Running', status: 'RUNNING', icon: Play, color: 'bg-emerald-50 border-emerald-200' },
  { id: 'paused', title: 'Paused', status: 'PAUSED', icon: Pause, color: 'bg-amber-50 border-amber-200' },
  { id: 'completed', title: 'Completed', status: 'COMPLETED', icon: CheckCircle, color: 'bg-green-50 border-green-200' },
]

export default function MTDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [task, setTask] = useState<MachiningTask | null>(null)
  const [activeTask, setActiveTask] = useState<MachiningTask | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  useEffect(() => {
    fetchTask()
  }, [params.id])

  const fetchTask = async () => {
    try {
      const response = await fetch(`/api/jobsheet/tasks/${params.id}`)
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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTask(task)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null)
    const { over } = event

    if (!over || !task) return

    const newStatus = over.id as string
    if (task.status === newStatus) return

    setUpdating(true)

    try {
      const response = await fetch(`/api/tasks/${task.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setTask({ ...task, status: newStatus })
        toast({
          title: 'Success',
          description: `Task status updated to ${COLUMNS.find((c) => c.status === newStatus)?.title}`,
        })
      } else {
        throw new Error('Failed to update status')
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update task status',
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleQuickAction = async (newStatus: string) => {
    if (!task) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/tasks/${task.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setTask({ ...task, status: newStatus })
        toast({
          title: 'Success',
          description: 'Task status updated',
        })
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleClockIn = async () => {
    if (!task) return
    setUpdating(true)
    try {
      const response = await fetch(`/api/tasks/${task.id}/clock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clock_in' }),
      })
      if (response.ok) {
        await fetchTask()
        toast({ title: 'Clocked in successfully' })
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message })
    } finally {
      setUpdating(false)
    }
  }

  const handleClockOut = async () => {
    if (!task) return
    setUpdating(true)
    try {
      const response = await fetch(`/api/tasks/${task.id}/clock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clock_out' }),
      })
      if (response.ok) {
        await fetchTask()
        toast({ title: 'Clocked out successfully' })
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message })
    } finally {
      setUpdating(false)
    }
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
      <AppLayout title="Task Not Found">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Task not found</p>
            <Button onClick={() => router.push('/planning/kanban')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Kanban
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  const currentColumn = COLUMNS.find((c) => c.status === task.status)
  const Icon = currentColumn?.icon || AlertCircle

  return (
    <AppLayout title="Task Details">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">{task.taskNumber}</Badge>
                <Badge className={currentColumn?.color.replace('border-', 'text-').split(' ')[0]}>
                  <Icon className="h-3 w-3 mr-1" />
                  {currentColumn?.title}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold">{task.name}</h1>
            </div>
          </div>
          <Button variant="outline" onClick={fetchTask} disabled={loading || updating}>
            <RefreshCw className={`h-4 w-4 mr-2 ${updating ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Status Update - Drag and Drop */}
        <Card>
          <CardHeader>
            <CardTitle>Update Status</CardTitle>
            <CardDescription>Drag the task card to a different status column or use quick actions</CardDescription>
          </CardHeader>
          <CardContent>
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className="flex gap-4 overflow-x-auto pb-4">
                {COLUMNS.map((column) => {
                  const ColumnIcon = column.icon
                  const isActive = task.status === column.status
                  return (
                    <div
                      key={column.id}
                      className={`flex-shrink-0 w-48 rounded-lg border-2 p-3 ${column.color} ${
                        isActive ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <ColumnIcon className="h-4 w-4" />
                        <h3 className="font-semibold text-sm">{column.title}</h3>
                      </div>
                      {isActive ? (
                        <div className="text-xs text-muted-foreground">Current status</div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs"
                          onClick={() => handleQuickAction(column.status)}
                          disabled={updating}
                        >
                          Move here
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>

              <DragOverlay>
                {activeTask && (
                  <Card className="w-48 cursor-grabbing">
                    <CardContent className="p-3">
                      <div className="text-sm font-medium">{activeTask.taskNumber}</div>
                      <div className="text-xs text-muted-foreground">{activeTask.name}</div>
                    </CardContent>
                  </Card>
                )}
              </DragOverlay>
            </DndContext>
          </CardContent>
        </Card>

        {/* Task Info Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Order Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {task.jobsheet?.manufacturingOrder?.order && (
                <div>
                  <div className="text-xs text-muted-foreground">Order</div>
                  <div className="font-medium">{task.jobsheet.manufacturingOrder.order.orderNumber}</div>
                  <div className="text-sm text-muted-foreground">{task.jobsheet.manufacturingOrder.order.customerName}</div>
                </div>
              )}
              {task.jobsheet?.manufacturingOrder && (
                <div>
                  <div className="text-xs text-muted-foreground">Manufacturing Order</div>
                  <div className="font-medium">{task.jobsheet.manufacturingOrder.moNumber}</div>
                  <div className="text-sm text-muted-foreground">{task.jobsheet.manufacturingOrder.name}</div>
                </div>
              )}
              {task.jobsheet && (
                <div>
                  <div className="text-xs text-muted-foreground">Jobsheet</div>
                  <div className="font-medium">{task.jobsheet.jsNumber}</div>
                  <div className="text-sm text-muted-foreground">{task.jobsheet.name}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Wrench className="h-3 w-3" />
                  Machine
                </div>
                <div className="font-medium">{task.machine?.name || 'Not assigned'}</div>
                {task.machine && (
                  <div className="text-sm text-muted-foreground">{task.machine.code} - {task.machine.type}</div>
                )}
              </div>
              <Separator />
              <div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Technician
                </div>
                <div className="font-medium">{task.assignedUser?.name || task.assignedUser?.email || 'Not assigned'}</div>
              </div>
            </CardContent>
          </Card>

          {/* Time Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Time Tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Planned</div>
                  <div className="font-medium">{task.plannedHours || 0} hrs</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Actual</div>
                  <div className="font-medium">{task.actualHours || 0} hrs</div>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Status
                </div>
                <div className="flex gap-2">
                  {!task.clockedInAt ? (
                    <Button size="sm" onClick={handleClockIn} disabled={updating}>
                      <Play className="h-3 w-3 mr-1" />
                      Clock In
                    </Button>
                  ) : !task.clockedOutAt ? (
                    <Button size="sm" onClick={handleClockOut} disabled={updating} variant="secondary">
                      <Pause className="h-3 w-3 mr-1" />
                      Clock Out
                    </Button>
                  ) : (
                    <Badge variant="outline">Completed</Badge>
                  )}
                </div>
              </div>
              {task.clockedInAt && (
                <div className="text-xs">
                  <div className="text-muted-foreground">Clocked In</div>
                  <div className="font-medium">{new Date(task.clockedInAt).toLocaleString()}</div>
                </div>
              )}
              {task.clockedOutAt && (
                <div className="text-xs">
                  <div className="text-muted-foreground">Clocked Out</div>
                  <div className="font-medium">{new Date(task.clockedOutAt).toLocaleString()}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Completion</span>
                  <span className="text-lg font-bold">{task.progressPercent}%</span>
                </div>
                <Progress value={task.progressPercent} className="h-3" />
                {task.progressPercent >= 100 && (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    <span>Task completed</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Breakdown Alert */}
        {task.breakdownAt && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <CardTitle>Machine Breakdown</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Reported at: </span>
                  {new Date(task.breakdownAt).toLocaleString()}
                </div>
                {task.breakdownNote && (
                  <div className="p-3 bg-white rounded-lg border">
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
              <CardTitle className="text-lg">Description</CardTitle>
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
