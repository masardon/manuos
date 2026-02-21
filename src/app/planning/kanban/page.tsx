'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverEvent,
  closestCorners,
} from '@dnd-kit/core'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  Filter,
  RefreshCw,
  Clock,
  User,
  Settings,
  Wrench,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  XCircle,
  Plus,
  MoreVertical,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AppLayout } from '@/components/layout/app-layout'

interface Task {
  id: string
  taskNumber: string
  name: string
  description: string | null
  status: string
  progressPercent: number
  machineId: string | null
  assignedTo: string | null
  plannedHours: number | null
  actualHours: number | null
  clockedInAt: string | null
  clockedOutAt: string | null
  breakdownAt: string | null
  jobsheet: {
    id: string
    jsNumber: string
    name: string
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

interface KanbanColumn {
  id: string
  title: string
  status: string
  icon: React.ReactNode
  color: string
}

const COLUMNS: KanbanColumn[] = [
  {
    id: 'pending',
    title: 'Pending',
    status: 'PENDING',
    icon: <AlertCircle className="h-4 w-4" />,
    color: 'bg-slate-100 border-slate-200 dark:bg-slate-900 dark:border-slate-800',
  },
  {
    id: 'assigned',
    title: 'Assigned',
    status: 'ASSIGNED',
    icon: <User className="h-4 w-4" />,
    color: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-900',
  },
  {
    id: 'running',
    title: 'In Progress',
    status: 'RUNNING',
    icon: <Clock className="h-4 w-4 animate-pulse" />,
    color: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-900',
  },
  {
    id: 'paused',
    title: 'Paused',
    status: 'PAUSED',
    icon: <PauseCircle className="h-4 w-4" />,
    color: 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-900',
  },
  {
    id: 'onHold',
    title: 'On Hold',
    status: 'ON_HOLD',
    icon: <Settings className="h-4 w-4" />,
    color: 'bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-900',
  },
  {
    id: 'completed',
    title: 'Completed',
    status: 'COMPLETED',
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-900',
  },
  {
    id: 'cancelled',
    title: 'Cancelled',
    status: 'CANCELLED',
    icon: <XCircle className="h-4 w-4" />,
    color: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-900',
  },
]

export default function KanbanPage() {
  const { toast } = useToast()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [updatingTask, setUpdatingTask] = useState<string | null>(null)

  // Filter state
  const [machineFilter, setMachineFilter] = useState('')
  const [userFilter, setUserFilter] = useState('')
  const [moFilter, setMoFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  // Statistics
  const [stats, setStats] = useState({
    pending: 0,
    assigned: 0,
    running: 0,
    paused: 0,
    completed: 0,
    onHold: 0,
    cancelled: 0,
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (machineFilter) params.append('machineId', machineFilter)
      if (userFilter) params.append('assignedTo', userFilter)
      if (moFilter) params.append('moId', moFilter)
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/kanban?${params}`)
      const data = await response.json()
      setTasks(data.tasks || [])
      setStats(data.stats || {})
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
  }, [machineFilter, userFilter, moFilter, statusFilter])

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id)
    setActiveTask(task || null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Prevent same column
    const activeTask = tasks.find((t) => t.id === activeId)
    if (activeTask?.status === overId) return
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const task = tasks.find((t) => t.id === activeId)
    if (!task || task.status === overId) return

    setUpdatingTask(activeId)

    try {
      const response = await fetch(`/api/tasks/${activeId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: overId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update task status')
      }

      toast({
        title: 'Success',
        description: `Task moved to ${COLUMNS.find((c) => c.status === overId)?.title}`,
      })

      fetchTasks()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update task status',
      })
    } finally {
      setUpdatingTask(null)
    }
  }

  const getTasksForColumn = (status: string) => {
    let columnTasks = tasks.filter((t) => t.status === status)

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      columnTasks = columnTasks.filter(
        (t) =>
          t.name.toLowerCase().includes(search) ||
          t.taskNumber.toLowerCase().includes(search) ||
          t.jobsheet.manufacturingOrder.moNumber.toLowerCase().includes(search) ||
          t.jobsheet.jsNumber.toLowerCase().includes(search)
      )
    }

    return columnTasks
  }

  const getPriorityColor = (progressPercent: number) => {
    if (progressPercent >= 100) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    if (progressPercent >= 50) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    if (progressPercent >= 25) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }

  const TaskCard = ({ task }: { task: Task }) => (
    <div
      className={cn(
        'bg-white dark:bg-slate-800 rounded-lg shadow-sm border-2 border-transparent',
        'p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow',
        updatingTask === task.id && 'opacity-50 pointer-events-none'
      )}
    >
      {/* Task Header */}
      <div className="flex items-start justify-between mb-3">
        <Link
          href={`/tasks/${task.id}`}
          className="text-sm font-semibold text-foreground hover:text-primary transition-colors flex-1"
        >
          {task.taskNumber}
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/tasks/${task.id}`}>
                <Wrench className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Task Name */}
      <p className="text-sm text-foreground mb-3 line-clamp-2">{task.name}</p>

      {/* MO Info */}
      <div className="text-xs text-muted-foreground mb-2 space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {task.jobsheet.manufacturingOrder.order.orderNumber}
          </Badge>
          <span>{task.jobsheet.jsNumber}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{Math.round(task.progressPercent)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full transition-all duration-300',
              task.progressPercent >= 100
                ? 'bg-green-500'
                : task.progressPercent >= 50
                  ? 'bg-blue-500'
                  : task.progressPercent >= 25
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
            )}
            style={{ width: `${task.progressPercent}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
        {task.machine && (
          <div className="flex items-center gap-1">
            <Wrench className="h-3 w-3" />
            <span className="truncate max-w-[80px]">{task.machine.name}</span>
          </div>
        )}
        {task.assignedUser && (
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span className="truncate max-w-[80px]">
              {task.assignedUser.name || task.assignedUser.email}
            </span>
          </div>
        )}
      </div>

      {/* Status Indicators */}
      {task.breakdownAt && (
        <div className="mt-2 text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Breakdown
        </div>
      )}
      {task.clockedInAt && !task.clockedOutAt && (
        <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Clocked In
        </div>
      )}
    </div>
  )

  return (
    <AppLayout title="Kanban">
      <div className="space-y-6 h-full flex flex-col">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Kanban Board</h1>
              <p className="text-muted-foreground mt-1">
                Manage and track manufacturing tasks visually
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={fetchTasks} disabled={loading}>
                <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              </Button>
            </div>
          </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search Tasks</label>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by task, MO, or JS..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Machine</label>
                <Select value={machineFilter || "all"} onValueChange={(v) => setMachineFilter(v === "all" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All machines" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All machines</SelectItem>
                    {Array.from(new Set(tasks.map((t) => t.machine?.name).filter(Boolean)))
                      .sort()
                      .map((name) => (
                        <SelectItem key={name} value={name!}>
                          {name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Technician</label>
                <Select value={userFilter || "all"} onValueChange={(v) => setUserFilter(v === "all" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All technicians" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All technicians</SelectItem>
                    {Array.from(
                      new Set(tasks.map((t) => t.assignedUser?.name || t.assignedUser?.email).filter(Boolean))
                    )
                      .sort()
                      .map((name) => (
                        <SelectItem key={name} value={name!}>
                          {name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {COLUMNS.map((col) => (
                      <SelectItem key={col.id} value={col.status}>
                        <div className="flex items-center gap-2">
                          {col.icon}
                          {col.title}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mt-4">
          {COLUMNS.map((column) => (
            <Card key={column.id} className={column.color}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  {column.icon}
                  <div className="flex-1">
                    <p className="text-2xl font-bold">{stats[column.id as keyof typeof stats] || 0}</p>
                    <p className="text-xs text-muted-foreground">{column.title}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 min-w-max h-full pb-4">
            {COLUMNS.map((column) => {
              const columnTasks = getTasksForColumn(column.status)

              return (
                <div
                  key={column.id}
                  className={cn(
                    'flex-shrink-0 w-80 rounded-lg border-2 p-3',
                    column.color
                  )}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {column.icon}
                      <h3 className="font-semibold">{column.title}</h3>
                      <Badge variant="secondary" className="ml-2">
                        {columnTasks.length}
                      </Badge>
                    </div>
                  </div>

                  {/* Task Cards */}
                  <ScrollArea className="h-[calc(100vh-450px)]">
                    <div className="space-y-3 pr-4">
                      {columnTasks.length === 0 ? (
                        <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                          No tasks in this column
                        </div>
                      ) : (
                        columnTasks.map((task) => (
                          <TaskCard key={task.id} task={task} />
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )
            })}
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} />}
        </DragOverlay>
      </DndContext>
      </div>
    </AppLayout>
  )
}
