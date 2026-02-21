'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Wrench,
  User,
  Clock,
  Calendar,
  Settings,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface ManufacturingOrder {
  id: string
  moNumber: string
  name: string
  status: string
  plannedStartDate: string
  plannedEndDate: string
  progressPercent: number
  order: {
    orderNumber: string
    customerName: string
  }
}

interface Jobsheet {
  id: string
  jsNumber: string
  name: string
  status: string
  plannedStartDate: string
  plannedEndDate: string
  progressPercent: number
  machiningTasks: Task[]
}

interface Task {
  id: string
  taskNumber: string
  name: string
  status: string
  plannedHours: number
  progressPercent: number
  machine?: { name: string } | null
  assignedUser?: { name: string } | null
}

interface Machine {
  id: string
  name: string
  code: string
}

interface User {
  id: string
  name: string
  email: string
}

export default function MODetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [mo, setMo] = useState<ManufacturingOrder | null>(null)
  const [jobsheets, setJobsheets] = useState<Jobsheet[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [newJobsheet, setNewJobsheet] = useState({
    jsNumber: '',
    name: '',
    plannedStartDate: '',
    plannedEndDate: '',
  })
  const [newTask, setNewTask] = useState<{ [key: string]: any }>({})
  const [activeJobsheetId, setActiveJobsheetId] = useState<string | null>(null)
  const [isJobsheetDialogOpen, setIsJobsheetDialogOpen] = useState(false)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)

  useEffect(() => {
    fetchMODetails()
    fetchMachines()
    fetchUsers()
  }, [params.id])

  const fetchMODetails = async () => {
    try {
      // Fetch all orders to find the MO
      const ordersRes = await fetch('/api/orders')
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json()
        
        // Find the MO across all orders
        let foundMO = null
        let foundOrder = null
        
        for (const order of ordersData.orders || []) {
          const mo = order.manufacturingOrders?.find((m: any) => m.id === params.id)
          if (mo) {
            foundMO = mo
            foundOrder = order
            break
          }
        }
        
        if (foundMO && foundOrder) {
          setMo({
            ...foundMO,
            order: foundOrder,
          })
        }
      }

      // Fetch jobsheets for this MO
      const jsRes = await fetch(`/api/mo/${params.id}/jobsheets`)
      if (jsRes.ok) {
        const jsData = await jsRes.json()
        setJobsheets(jsData.jobsheets || [])
      }
    } catch (error) {
      console.error('Error fetching MO details:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMachines = async () => {
    try {
      const res = await fetch('/api/machines')
      if (res.ok) {
        const data = await res.json()
        setMachines(data.machines || [])
      }
    } catch (error) {
      console.error('Error fetching machines:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleAddJobsheet = async () => {
    if (!newJobsheet.jsNumber || !newJobsheet.name) {
      toast({
        variant: 'destructive',
        title: 'Missing fields',
        description: 'Please fill in all jobsheet fields',
      })
      return
    }

    try {
      const res = await fetch(`/api/mo/${params.id}/jobsheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newJobsheet,
          description: `Jobsheet for ${mo?.moNumber}`,
        }),
      })

      if (res.ok) {
        toast({ title: 'Jobsheet created' })
        setNewJobsheet({ jsNumber: '', name: '', plannedStartDate: '', plannedEndDate: '' })
        setIsJobsheetDialogOpen(false)
        fetchMODetails()
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create jobsheet',
      })
    }
  }

  const handleAddTask = async (jobsheetId: string) => {
    const task = newTask[jobsheetId] || {}
    if (!task.taskNumber || !task.name || !task.plannedHours) {
      toast({
        variant: 'destructive',
        title: 'Missing fields',
        description: 'Please fill in all task fields',
      })
      return
    }

    try {
      const res = await fetch(`/api/jobsheet/${jobsheetId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      })

      if (res.ok) {
        toast({ title: 'Task created' })
        setNewTask({ ...newTask, [jobsheetId]: {} })
        setIsTaskDialogOpen(false)
        fetchMODetails()
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create task',
      })
    }
  }

  const handleDeleteJobsheet = async (jsId: string) => {
    if (!confirm('Are you sure? This will also delete all tasks in this jobsheet.')) return

    try {
      const res = await fetch(`/api/mo/${params.id}/jobsheets?jsId=${jsId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast({ title: 'Jobsheet deleted' })
        fetchMODetails()
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete jobsheet',
      })
    }
  }

  const handleDeleteTask = async (jsId: string, taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      const res = await fetch(`/api/jobsheet/${jsId}/tasks?taskId=${taskId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast({ title: 'Task deleted' })
        fetchMODetails()
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete task',
      })
    }
  }

  if (loading) {
    return (
      <AppLayout title="MO Details">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading MO details...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!mo) {
    return (
      <AppLayout title="MO Not Found">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Manufacturing Order not found</p>
            <Button onClick={() => router.push('/mo')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to MO List
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Manufacturing Order Details">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/orders')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{mo.moNumber}</Badge>
                <h1 className="text-3xl font-bold">{mo.name}</h1>
              </div>
              <p className="text-muted-foreground mt-1">
                {mo.order?.orderNumber} - {mo.order?.customerName}
              </p>
            </div>
          </div>
          <Dialog open={isJobsheetDialogOpen} onOpenChange={setIsJobsheetDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Jobsheet
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Jobsheet</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>JS Number</Label>
                  <Input
                    value={newJobsheet.jsNumber}
                    onChange={(e) => setNewJobsheet({ ...newJobsheet, jsNumber: e.target.value })}
                    placeholder={`JS-${mo.moNumber}-01`}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={newJobsheet.name}
                    onChange={(e) => setNewJobsheet({ ...newJobsheet, name: e.target.value })}
                    placeholder="Operation name"
                  />
                </div>
                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={newJobsheet.plannedStartDate}
                      onChange={(e) => setNewJobsheet({ ...newJobsheet, plannedStartDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={newJobsheet.plannedEndDate}
                      onChange={(e) => setNewJobsheet({ ...newJobsheet, plannedEndDate: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={handleAddJobsheet} className="w-full">
                  Create Jobsheet
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* MO Info */}
        <Card>
          <CardHeader>
            <CardTitle>Manufacturing Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <Badge className="mt-1">{mo.status}</Badge>
              </div>
              <div>
                <Label className="text-muted-foreground">Progress</Label>
                <p className="font-medium mt-1">{mo.progressPercent}%</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Start Date</Label>
                <p className="font-medium mt-1">{new Date(mo.plannedStartDate).toLocaleDateString()}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">End Date</Label>
                <p className="font-medium mt-1">{new Date(mo.plannedEndDate).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jobsheets */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Jobsheets ({jobsheets.length})</h2>
          </div>

          {jobsheets.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No jobsheets yet. Add the first jobsheet to break down this MO.</p>
              </CardContent>
            </Card>
          ) : (
            jobsheets.map((js, jsIndex) => (
              <Card key={js.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{js.jsNumber}</Badge>
                        <CardTitle>{js.name}</CardTitle>
                      </div>
                      <CardDescription>
                        {new Date(js.plannedStartDate).toLocaleDateString()} - {new Date(js.plannedEndDate).toLocaleDateString()}
                        {' • '}{js.machiningTasks.length} task(s)
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Dialog open={isTaskDialogOpen && activeJobsheetId === js.id} onOpenChange={(open) => {
                        setIsTaskDialogOpen(open)
                        if (!open) setActiveJobsheetId(null)
                      }}>
                        <DialogTrigger asChild>
                          <Button size="sm" onClick={() => setActiveJobsheetId(js.id)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Task
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Task to {js.jsNumber}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <Label>Task Number</Label>
                              <Input
                                value={newTask[js.id]?.taskNumber || ''}
                                onChange={(e) => setNewTask({ ...newTask, [js.id]: { ...newTask[js.id], taskNumber: e.target.value } })}
                                placeholder={`${js.jsNumber}-T01`}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Task Name</Label>
                              <Input
                                value={newTask[js.id]?.name || ''}
                                onChange={(e) => setNewTask({ ...newTask, [js.id]: { ...newTask[js.id], name: e.target.value } })}
                                placeholder="Operation name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Planned Hours</Label>
                              <Input
                                type="number"
                                step="0.5"
                                value={newTask[js.id]?.plannedHours || ''}
                                onChange={(e) => setNewTask({ ...newTask, [js.id]: { ...newTask[js.id], plannedHours: e.target.value } })}
                                placeholder="4"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Machine</Label>
                              <Select
                                value={newTask[js.id]?.machineId || ''}
                                onValueChange={(value) => setNewTask({ ...newTask, [js.id]: { ...newTask[js.id], machineId: value } })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select machine" />
                                </SelectTrigger>
                                <SelectContent>
                                  {machines.map((m) => (
                                    <SelectItem key={m.id} value={m.id}>{m.name} ({m.code})</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label>Technician</Label>
                              <Select
                                value={newTask[js.id]?.assignedTo || ''}
                                onValueChange={(value) => setNewTask({ ...newTask, [js.id]: { ...newTask[js.id], assignedTo: value } })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select technician" />
                                </SelectTrigger>
                                <SelectContent>
                                  {users.map((u) => (
                                    <SelectItem key={u.id} value={u.id}>{u.name || u.email}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button onClick={() => handleAddTask(js.id)} className="w-full">
                              Create Task
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteJobsheet(js.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {js.machiningTasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No tasks yet. Click "Add Task" to break down this jobsheet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {js.machiningTasks.map((task, taskIndex) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                              {taskIndex + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">{task.taskNumber}</Badge>
                                <span className="font-medium text-sm">{task.name}</span>
                              </div>
                              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                {task.machine && (
                                  <span className="flex items-center gap-1">
                                    <Wrench className="h-3 w-3" />
                                    {task.machine.name}
                                  </span>
                                )}
                                {task.assignedUser && (
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {task.assignedUser.name}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {task.plannedHours}h
                                </span>
                                <Badge variant="outline" className="text-xs">{task.progressPercent}%</Badge>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTask(js.id, task.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Info */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Production Breakdown Structure</h3>
            <ol className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li>1. <strong>Order</strong> → Customer order ({mo.order?.orderNumber})</li>
              <li>2. <strong>Manufacturing Order</strong> → Production batch ({mo.moNumber})</li>
              <li>3. <strong>Jobsheets</strong> → Operations ({jobsheets.length} created)</li>
              <li>4. <strong>Tasks</strong> → Individual machining operations ({jobsheets.reduce((sum, js) => sum + js.machiningTasks.length, 0)} created)</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
