'use client'

import { useEffect, useState } from 'react'
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
  FileText,
  Wrench,
  User,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Play,
  Pause,
  Square,
  Plus,
  Trash2,
  Edit,
  Kanban,
  Store,
  X,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
}

interface Jobsheet {
  id: string
  jsNumber: string
  name: string
  description: string | null
  status: string
  progressPercent: number
  plannedStartDate: string
  plannedEndDate: string
  actualStartDate: string | null
  actualEndDate: string | null
  drawingUrl: string | null
  manufacturingOrder: {
    id: string
    moNumber: string
    name: string
    status: string
    progressPercent: number
    order: {
      id: string
      orderNumber: string
      customerName: string
      status: string
      progressPercent: number
    }
  }
  machiningTasks: Task[]
}

export default function JobsheetDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [jobsheet, setJobsheet] = useState<Jobsheet | null>(null)
  const [machines, setMachines] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  
  // Task dialog state
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [taskForm, setTaskForm] = useState({
    name: '',
    description: '',
    machineId: '',
    assignedTo: '',
    plannedHours: '',
  })

  useEffect(() => {
    fetchJobsheet()
    fetchMachines()
    fetchUsers()
  }, [params.id])

  const fetchJobsheet = async () => {
    try {
      const response = await fetch(`/api/jobsheet/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setJobsheet(data.jobsheet)
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Jobsheet not found',
        })
      }
    } catch (error) {
      console.error('Error fetching jobsheet:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load jobsheet details',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchMachines = async () => {
    try {
      const response = await fetch('/api/machines')
      if (response.ok) {
        const data = await response.json()
        setMachines(data.machines || [])
      }
    } catch (error) {
      console.error('Error fetching machines:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleAddTask = () => {
    setEditingTask(null)
    setTaskForm({
      name: '',
      description: '',
      machineId: '',
      assignedTo: '',
      plannedHours: '',
    })
    setIsTaskDialogOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setTaskForm({
      name: task.name,
      description: task.description || '',
      machineId: task.machine?.id || '',
      assignedTo: task.assignedUser?.id || '',
      plannedHours: task.plannedHours?.toString() || '',
    })
    setIsTaskDialogOpen(true)
  }

  const handleDeleteTask = async (taskId: string, taskNumber: string) => {
    if (!confirm(`Are you sure you want to delete task ${taskNumber}?`)) return

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Task deleted successfully',
        })
        await fetchJobsheet()
      } else {
        throw new Error('Failed to delete task')
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete task',
      })
    }
  }

  const handleSaveTask = async () => {
    try {
      const url = editingTask
        ? `/api/tasks/${editingTask.id}`
        : `/api/jobsheet/${params.id}/tasks`

      const response = await fetch(url, {
        method: editingTask ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskForm),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: editingTask ? 'Task updated successfully' : 'Task created successfully',
        })
        setIsTaskDialogOpen(false)
        await fetchJobsheet()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save task')
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save task',
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, string> = {
      PREPARING: 'bg-gray-100 text-gray-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    }
    return <Badge className={config[status] || 'bg-gray-100 text-gray-800'}>{status.replace(/_/g, ' ')}</Badge>
  }

  const getTaskStatusColor = (status: string) => {
    if (status === 'COMPLETED') return 'bg-green-500'
    if (status === 'RUNNING') return 'bg-emerald-500'
    if (status === 'PAUSED') return 'bg-amber-500'
    return 'bg-slate-400'
  }

  const formatDateTime = (dateTimeString: string | null) => {
    if (!dateTimeString) return '-'
    return new Date(dateTimeString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  // Get actual start date from earliest clocked-in task
  const getActualStartDate = () => {
    const clockedTasks = jobsheet.machiningTasks.filter(t => t.clockedInAt)
    if (clockedTasks.length === 0) return null
    
    const earliestTask = clockedTasks.reduce((earliest, current) => {
      return new Date(current.clockedInAt!) < new Date(earliest.clockedInAt!) ? current : earliest
    })
    
    return earliestTask.clockedInAt
  }

  // Get actual end date - only if ALL tasks are completed
  const getActualEndDate = () => {
    // Check if all tasks are completed
    const allCompleted = jobsheet.machiningTasks.every(t => t.status === 'COMPLETED')
    if (!allCompleted) return null
    
    // Get the latest clocked-out time from all tasks
    const tasksWithEndTime = jobsheet.machiningTasks.filter(t => t.clockedOutAt)
    if (tasksWithEndTime.length === 0) return null
    
    const latestTask = tasksWithEndTime.reduce((latest, current) => {
      return new Date(current.clockedOutAt!) > new Date(latest.clockedOutAt!) ? current : latest
    })
    
    return latestTask.clockedOutAt
  }

  // Check if task can be edited/deleted (never started)
  const canEditTask = (task: Task) => {
    return !task.clockedInAt && task.status !== 'COMPLETED'
  }

  if (loading) {
    return (
      <AppLayout title="Jobsheet Details">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading jobsheet details...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!jobsheet) {
    return (
      <AppLayout title="Jobsheet Not Found">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Jobsheet not found</p>
            <Button onClick={() => router.push('/jobsheets')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobsheets
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Jobsheet Details">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/jobsheets')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">{jobsheet.jsNumber}</Badge>
                {getStatusBadge(jobsheet.status)}
              </div>
              <h1 className="text-3xl font-bold">{jobsheet.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Shortcuts */}
            <Button variant="outline" size="sm" onClick={() => router.push('/planning/kanban')}>
              <Kanban className="h-4 w-4 mr-2" />
              Kanban
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/shop-floor')}>
              <Store className="h-4 w-4 mr-2" />
              Shop Floor
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button variant="outline" onClick={fetchJobsheet} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={handleAddTask}>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </div>

        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Progress Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Overall Progress</span>
                <span className="text-lg font-bold">{jobsheet.progressPercent}%</span>
              </div>
              <Progress value={jobsheet.progressPercent} className="h-3" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <div className="text-xs text-muted-foreground">Status</div>
                  <div className="font-medium">{jobsheet.status.replace(/_/g, ' ')}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Tasks</div>
                  <div className="font-medium">{jobsheet.machiningTasks.length} total</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                  <div className="font-medium">{jobsheet.machiningTasks.filter(t => t.status === 'COMPLETED').length}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">In Progress</div>
                  <div className="font-medium">{jobsheet.machiningTasks.filter(t => t.status === 'RUNNING').length}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Hierarchy */}
        <Card>
          <CardHeader>
            <CardTitle>Order Hierarchy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">Order</div>
                  <div className="font-medium">{jobsheet.manufacturingOrder.order.orderNumber}</div>
                  <div className="text-sm text-muted-foreground">{jobsheet.manufacturingOrder.order.customerName}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Progress</div>
                  <div className="font-medium">{jobsheet.manufacturingOrder.order.progressPercent}%</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Wrench className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">Manufacturing Order</div>
                  <div className="font-medium">{jobsheet.manufacturingOrder.moNumber}</div>
                  <div className="text-sm text-muted-foreground">{jobsheet.manufacturingOrder.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Progress</div>
                  <div className="font-medium">{jobsheet.manufacturingOrder.progressPercent}%</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">Jobsheet (Current)</div>
                  <div className="font-medium">{jobsheet.jsNumber}</div>
                  <div className="text-sm text-muted-foreground">{jobsheet.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Progress</div>
                  <div className="font-medium">{jobsheet.progressPercent}%</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Planned Start
                </div>
                <div className="font-medium mt-1">{formatDateTime(jobsheet.plannedStartDate)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Planned End
                </div>
                <div className="font-medium mt-1">{formatDateTime(jobsheet.plannedEndDate)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Actual Start
                </div>
                <div className="font-medium mt-1">{formatDateTime(getActualStartDate())}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Actual End
                </div>
                <div className="font-medium mt-1">{formatDateTime(getActualEndDate())}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Machining Tasks</CardTitle>
              <Badge variant="secondary">{jobsheet.machiningTasks.length} tasks</Badge>
            </div>
            <CardDescription>Detailed breakdown of machining operations</CardDescription>
          </CardHeader>
          <CardContent>
            {jobsheet.machiningTasks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tasks defined for this jobsheet</p>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {jobsheet.machiningTasks.map((task) => (
                    <div key={task.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{task.taskNumber}</Badge>
                          <span className="font-semibold">{task.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditTask(task)}
                            disabled={!canEditTask(task)}
                          >
                            <Edit className={`h-4 w-4 ${!canEditTask(task) ? 'text-muted-foreground' : ''}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteTask(task.id, task.taskNumber)}
                            disabled={!canEditTask(task)}
                          >
                            <Trash2 className={`h-4 w-4 ${!canEditTask(task) ? 'text-muted-foreground' : ''}`} />
                          </Button>
                          <div className={`w-2 h-2 rounded-full ${getTaskStatusColor(task.status)}`} />
                          <Badge variant="outline">{task.status.replace(/_/g, ' ')}</Badge>
                        </div>
                      </div>

                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        {task.machine && (
                          <div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Wrench className="h-3 w-3" />
                              Machine
                            </div>
                            <div className="font-medium text-sm">{task.machine.name}</div>
                          </div>
                        )}
                        {task.assignedUser && (
                          <div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <User className="h-3 w-3" />
                              Technician
                            </div>
                            <div className="font-medium text-sm">{task.assignedUser.name || task.assignedUser.email}</div>
                          </div>
                        )}
                        <div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Planned
                          </div>
                          <div className="font-medium text-sm">{task.plannedHours || 0}h</div>
                        </div>
                        {task.actualHours && (
                          <div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Actual
                            </div>
                            <div className="font-medium text-sm">{task.actualHours}h</div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-semibold">{task.progressPercent}%</span>
                        </div>
                        <Progress value={task.progressPercent} className="h-2" />
                      </div>

                      {/* Proceed Button - Only for uncompleted tasks */}
                      {task.status !== 'COMPLETED' && (
                        <div className="mt-3">
                          <Button
                            className="w-full h-12"
                            variant={task.clockedInAt && !task.clockedOutAt ? 'destructive' : 'default'}
                            onClick={() => router.push('/shop-floor')}
                          >
                            {task.clockedInAt && !task.clockedOutAt ? (
                              <>
                                <Square className="h-5 w-5 mr-2" />
                                Clock Out
                              </>
                            ) : task.status === 'PAUSED' ? (
                              <>
                                <Play className="h-5 w-5 mr-2" />
                                Resume
                              </>
                            ) : (
                              <>
                                <Play className="h-5 w-5 mr-2" />
                                Clock In
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {(task.clockedInAt || task.clockedOutAt) && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            {task.clockedInAt && (
                              <div className="flex items-center gap-1 text-emerald-600">
                                <Play className="h-3 w-3" />
                                Started: {formatDateTime(task.clockedInAt)}
                              </div>
                            )}
                            {task.clockedOutAt && (
                              <div className="flex items-center gap-1 text-slate-600">
                                <Square className="h-3 w-3" />
                                Ended: {formatDateTime(task.clockedOutAt)}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Engineering Drawing */}
        {jobsheet.drawingUrl && (
          <Card>
            <CardHeader>
              <CardTitle>Engineering Drawing</CardTitle>
              <CardDescription>CAM drawing and specifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg overflow-hidden">
                <img
                  src={jobsheet.drawingUrl}
                  alt="Engineering Drawing"
                  className="w-full h-auto"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Task Dialog */}
        <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTask ? 'Edit Task' : 'Add New Task'}
              </DialogTitle>
              <DialogDescription>
                {editingTask ? 'Update task details' : 'Create a new machining task for this jobsheet'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="taskName">Task Name *</Label>
                <Input
                  id="taskName"
                  value={taskForm.name}
                  onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
                  placeholder="e.g., Rough Milling Operation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taskDescription">Description</Label>
                <Textarea
                  id="taskDescription"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Task description..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="machine">Machine</Label>
                  <Select
                    value={taskForm.machineId}
                    onValueChange={(value) => setTaskForm({ ...taskForm, machineId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select machine" />
                    </SelectTrigger>
                    <SelectContent>
                      {machines.map((machine) => (
                        <SelectItem key={machine.id} value={machine.id}>
                          {machine.name} ({machine.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="technician">Technician</Label>
                  <Select
                    value={taskForm.assignedTo}
                    onValueChange={(value) => setTaskForm({ ...taskForm, assignedTo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select technician" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="plannedHours">Planned Hours</Label>
                <Input
                  id="plannedHours"
                  type="number"
                  step="0.5"
                  min="0"
                  value={taskForm.plannedHours}
                  onChange={(e) => setTaskForm({ ...taskForm, plannedHours: e.target.value })}
                  placeholder="e.g., 4.0"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveTask} disabled={!taskForm.name.trim()}>
                {editingTask ? 'Update Task' : 'Create Task'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
