'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  Clock,
  Play,
  Pause,
  Square,
  FileText,
  Wrench,
  User,
  AlertCircle,
  RefreshCw,
  Maximize2,
  X,
  CheckCircle,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Task {
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
  quantity: number | null
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
  jobsheet: {
    id: string
    jsNumber: string
    name: string
    drawingUrl: string | null
    manufacturingOrder: {
      id: string
      moNumber: string
      name: string
      order: {
        id: string
        orderNumber: string
        customerName: string
      }
    }
  }
}

export default function ShopFloorPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isDrawingOpen, setIsDrawingOpen] = useState(false)
  const [filter, setFilter] = useState<'todo' | 'completed' | 'running'>('todo')

  // Live clock - only start on client
  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setLoading(true)
      const url = filter !== 'all' 
        ? `/api/shop-floor/tasks?status=${filter}`
        : '/api/shop-floor/tasks'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks || [])
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load tasks',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [filter]) // Refetch when filter changes

  // Clock in/out/pause
  const handleClockAction = async (taskId: string, action: 'clock_in' | 'clock_out' | 'pause') => {
    setUpdating(taskId)
    try {
      const response = await fetch(`/api/tasks/${taskId}/clock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        await fetchTasks()
        toast({
          title: 'Success',
          description: action === 'clock_in' ? 'Clocked in successfully' : action === 'clock_out' ? 'Clocked out successfully' : 'Task paused',
        })
      } else {
        throw new Error('Failed to update')
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update task',
      })
    } finally {
      setUpdating(null)
    }
  }

  // Format time (24-hour format)
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatDateTime = (dateTimeString: string | null) => {
    if (!dateTimeString) return null
    return new Date(dateTimeString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  const getStatusColor = (task: Task) => {
    if (task.status === 'RUNNING' && task.clockedInAt && !task.clockedOutAt) return 'bg-emerald-500'
    if (task.status === 'PAUSED') return 'bg-amber-500'
    if (task.status === 'COMPLETED') return 'bg-green-500'
    return 'bg-slate-400'
  }

  // Check if task is currently being worked on (for showing clock out button)
  const isTaskActive = (task: Task) => {
    return task.clockedInAt && !task.clockedOutAt && (task.status === 'RUNNING' || task.status === 'PAUSED')
  }

  return (
    <AppLayout title="Shop Floor">
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Live Clock Header */}
        <Card className="shrink-0 bg-primary text-primary-foreground border-0 shadow-md">
          <CardContent className="pt-4 pb-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Clock className="h-4 w-4 animate-pulse" />
              <span className="text-xs font-medium opacity-90">Current Time</span>
            </div>
            {currentTime ? (
              <>
                <div className="text-4xl md:text-5xl font-bold tracking-tight">
                  {formatTime(currentTime)}
                </div>
                <div className="text-xs opacity-90 mt-1">
                  {formatDate(currentTime)}
                </div>
              </>
            ) : (
              <div className="text-4xl md:text-5xl font-bold tracking-tight">
                --:--:--
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filter Buttons */}
        <div className="shrink-0 bg-background py-2 px-4 shadow-md border-b">
          <div className="flex gap-2">
            <Button
              variant={filter === 'todo' ? 'default' : 'outline'}
              size="sm"
              className="flex-1 text-xs md:text-sm"
              onClick={() => setFilter('todo')}
            >
              Todo
            </Button>
            <Button
              variant={filter === 'running' ? 'default' : 'outline'}
              size="sm"
              className="flex-1 text-xs md:text-sm"
              onClick={() => setFilter('running')}
            >
              <Play className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              Running
            </Button>
            <Button
              variant={filter === 'completed' ? 'default' : 'outline'}
              size="sm"
              className="flex-1 text-xs md:text-sm"
              onClick={() => setFilter('completed')}
            >
              <CheckCircle className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              Completed
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={fetchTasks}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Scrollable Task Cards */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {/* Task Count */}
          <div className="text-center text-sm text-muted-foreground mb-3">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} found
          </div>

          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No tasks assigned to you</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
            {tasks.map((task) => {
              const isActive = isTaskActive(task)
              const isUpdating = updating === task.id

              return (
                <Card key={task.id} className={`overflow-hidden border-2 ${isActive ? 'border-emerald-500 shadow-emerald-500/20 shadow-lg' : ''}`}>
                  {/* Status Bar */}
                  <div className={`h-2 ${getStatusColor(task)}`} />

                  <CardContent className="p-4 space-y-4">
                    {/* Task Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs shrink-0">
                            {task.taskNumber}
                          </Badge>
                          {isActive && (
                            <Badge className="bg-emerald-500 text-xs shrink-0">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Running
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-lg break-words">{task.name}</h3>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1 break-words">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Order Info Grid */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground">Order</div>
                        <div className="font-medium truncate">
                          {task.jobsheet.manufacturingOrder.order.orderNumber}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">MO</div>
                        <div className="font-medium truncate">
                          {task.jobsheet.manufacturingOrder.moNumber}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Jobsheet</div>
                        <div className="font-medium truncate">{task.jobsheet.jsNumber}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Customer</div>
                        <div className="font-medium truncate">
                          {task.jobsheet.manufacturingOrder.order.customerName}
                        </div>
                      </div>
                    </div>

                    {/* Machine & Quantity */}
                    {(task.machine || task.quantity) && (
                      <div className="flex items-center gap-4 text-sm">
                        {task.machine && (
                          <div className="flex items-center gap-2">
                            <Wrench className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{task.machine.name}</span>
                          </div>
                        )}
                        {task.quantity && (
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Qty: {task.quantity}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Time Info */}
                    {isActive && task.clockedInAt && (
                      <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            Started: {formatDateTime(task.clockedInAt)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold">{task.progressPercent}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            task.progressPercent >= 100
                              ? 'bg-green-500'
                              : task.progressPercent >= 50
                              ? 'bg-blue-500'
                              : task.progressPercent >= 25
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${task.progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      {task.status === 'COMPLETED' ? (
                        // Completed state - show grey Completed button
                        <Button
                          className="flex-1 h-14 text-lg bg-slate-400 text-white cursor-not-allowed"
                          disabled
                        >
                          <CheckCircle className="h-5 w-5 mr-2" />
                          Completed
                        </Button>
                      ) : isActive ? (
                        // Active state (Running or Paused)
                        <>
                          {/* Pause Button - Only show when RUNNING (not paused) */}
                          {task.status === 'RUNNING' && (
                            <Button
                              variant="outline"
                              className="h-14 w-14 shrink-0 bg-orange-100 border-orange-300 text-orange-700 hover:bg-orange-200 hover:text-orange-800"
                              onClick={() => handleClockAction(task.id, 'pause')}
                              disabled={isUpdating}
                              title="Pause task"
                            >
                              <Pause className="h-6 w-6" />
                            </Button>
                          )}

                          {/* Resume Button - Only show when PAUSED */}
                          {task.status === 'PAUSED' && (
                            <Button
                              variant="outline"
                              className="h-14 w-14 shrink-0 bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200 hover:text-blue-800"
                              onClick={() => handleClockAction(task.id, 'clock_in')}
                              disabled={isUpdating}
                              title="Resume task"
                            >
                              <Play className="h-6 w-6" />
                            </Button>
                          )}

                          {/* Clock Out Button - Disabled when PAUSED */}
                          <Button
                            className="flex-1 h-14 text-lg bg-red-600 hover:bg-red-700 hover:text-white"
                            variant="destructive"
                            onClick={() => handleClockAction(task.id, 'clock_out')}
                            disabled={isUpdating || task.status === 'PAUSED'}
                            title={task.status === 'PAUSED' ? 'Resume task before clocking out' : 'Clock out'}
                          >
                            <Square className="h-5 w-5 mr-2" />
                            Clock Out
                          </Button>
                        </>
                      ) : (
                        // Not started state - show Clock In button
                        <Button
                          className="flex-1 h-14 text-lg bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => handleClockAction(task.id, 'clock_in')}
                          disabled={isUpdating}
                        >
                          <Play className="h-5 w-5 mr-2" />
                          Clock In
                        </Button>
                      )}

                      {/* View Drawing Button */}
                      <Button
                        variant="outline"
                        className="h-14 w-14 shrink-0"
                        onClick={() => {
                          setSelectedTask(task)
                          setIsDrawingOpen(true)
                        }}
                        disabled={isUpdating || !task.jobsheet.drawingUrl}
                        title={task.jobsheet.drawingUrl ? 'View Engineering Drawing' : 'No drawing available'}
                      >
                        <FileText className={`h-6 w-6 ${task.jobsheet.drawingUrl ? 'text-blue-600' : 'text-muted-foreground'}`} />
                      </Button>
                    </div>

                    {/* Breakdown Alert */}
                    {task.breakdownAt && (
                      <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3 flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-red-700 dark:text-red-400">
                            Machine Breakdown
                          </div>
                          {task.breakdownNote && (
                            <div className="text-sm text-red-600 dark:text-red-500 mt-1">
                              {task.breakdownNote}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
            </div>
          )}
        </div>

        {/* Drawing Dialog */}
        <Dialog open={isDrawingOpen} onOpenChange={setIsDrawingOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>
                {selectedTask?.jobsheet.drawingUrl ? 'Engineering Drawing' : 'No Drawing Available'}
              </DialogTitle>
            </DialogHeader>
            {selectedTask?.jobsheet.drawingUrl ? (
              <div className="flex-1 overflow-auto bg-muted rounded-lg">
                <img
                  src={selectedTask.jobsheet.drawingUrl}
                  alt="Engineering Drawing"
                  className="w-full h-auto"
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <FileText className="h-16 w-16 mb-4" />
                <p>No engineering drawing available for this task</p>
              </div>
            )}
            {selectedTask && (
              <div className="text-sm text-muted-foreground pt-4 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Task:</span> {selectedTask.taskNumber}
                  </div>
                  <div>
                    <span className="font-medium">Jobsheet:</span> {selectedTask.jobsheet.jsNumber}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
