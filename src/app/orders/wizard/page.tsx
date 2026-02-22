'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Progress } from '@/components/ui/progress'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Wrench,
  Settings,
  Plus,
  Trash2,
  TrendingUp,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Task {
  id: string
  taskNumber: string
  name: string
  description: string
  plannedHours: string
  machineId: string
  assignedTo: string
}

interface Jobsheet {
  id: string
  jsNumber: string
  name: string
  description: string
  plannedStartDate: string
  plannedEndDate: string
  tasks: Task[]
}

interface MO {
  id: string
  moNumber: string
  name: string
  description: string
  plannedStartDate: string
  plannedEndDate: string
  jobsheets: Jobsheet[]
}

interface Order {
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  description: string
  plannedStartDate: string
  plannedEndDate: string
  mos: MO[]
}

const steps = [
  { id: 1, title: 'Order Info', icon: FileText },
  { id: 2, title: 'Add MO', icon: Wrench },
  { id: 3, title: 'Add Jobsheets', icon: Settings },
  { id: 4, title: 'Add Tasks', icon: TrendingUp },
  { id: 5, title: 'Review', icon: Check },
]

export default function OrderWizardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  const [order, setOrder] = useState<Order>({
    orderNumber: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    description: '',
    plannedStartDate: '',
    plannedEndDate: '',
    mos: [],
  })

  const [currentMO, setCurrentMO] = useState<MO | null>(null)
  const [currentJobsheet, setCurrentJobsheet] = useState<Jobsheet | null>(null)

  const totalSteps = steps.length

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleAddMO = () => {
    const newMO: MO = {
      id: `mo-${Date.now()}`,
      moNumber: `MO-${String(order.mos.length + 1).padStart(3, '0')}`,
      name: '',
      description: '',
      plannedStartDate: order.plannedStartDate,
      plannedEndDate: order.plannedEndDate,
      jobsheets: [],
    }
    setOrder({
      ...order,
      mos: [...order.mos, newMO],
    })
    setCurrentMO(newMO)
  }

  const handleUpdateMO = (moId: string, data: Partial<MO>) => {
    setOrder({
      ...order,
      mos: order.mos.map((mo) => (mo.id === moId ? { ...mo, ...data } : mo)),
    })
  }

  const handleDeleteMO = (moId: string) => {
    setOrder({
      ...order,
      mos: order.mos.filter((mo) => mo.id !== moId),
    })
    if (currentMO?.id === moId) {
      setCurrentMO(null)
    }
  }

  const handleAddJobsheet = (moId: string) => {
    const mo = order.mos.find((m) => m.id === moId)
    if (!mo) return

    const newJobsheet: Jobsheet = {
      id: `js-${Date.now()}`,
      jsNumber: `JS-${String(mo.jobsheets.length + 1).padStart(3, '0')}`,
      name: '',
      description: '',
      plannedStartDate: mo.plannedStartDate,
      plannedEndDate: mo.plannedEndDate,
      tasks: [],
    }

    const updatedMOs = order.mos.map((m) =>
      m.id === moId ? { ...m, jobsheets: [...m.jobsheets, newJobsheet] } : m
    )

    setOrder({ ...order, mos: updatedMOs })
    setCurrentJobsheet(newJobsheet)
  }

  const handleUpdateJobsheet = (moId: string, jsId: string, data: Partial<Jobsheet>) => {
    const updatedMOs = order.mos.map((mo) =>
      mo.id === moId
        ? {
            ...mo,
            jobsheets: mo.jobsheets.map((js) => (js.id === jsId ? { ...js, ...data } : js)),
          }
        : mo
    )
    setOrder({ ...order, mos: updatedMOs })
  }

  const handleDeleteJobsheet = (moId: string, jsId: string) => {
    const updatedMOs = order.mos.map((mo) =>
      mo.id === moId
        ? { ...mo, jobsheets: mo.jobsheets.filter((js) => js.id !== jsId) }
        : mo
    )
    setOrder({ ...order, mos: updatedMOs })
    if (currentJobsheet?.id === jsId) {
      setCurrentJobsheet(null)
    }
  }

  const handleAddTask = (moId: string, jsId: string) => {
    const mo = order.mos.find((m) => m.id === moId)
    const js = mo?.jobsheets.find((j) => j.id === jsId)
    if (!mo || !js) return

    const newTask: Task = {
      id: `task-${Date.now()}`,
      taskNumber: `MT-${String(js.tasks.length + 1).padStart(3, '0')}`,
      name: '',
      description: '',
      plannedHours: '4',
      machineId: '',
      assignedTo: '',
    }

    const updatedMOs = order.mos.map((m) =>
      m.id === moId
        ? {
            ...m,
            jobsheets: m.jobsheets.map((j) =>
              j.id === jsId ? { ...j, tasks: [...j.tasks, newTask] } : j
            ),
          }
        : m
    )

    setOrder({ ...order, mos: updatedMOs })
  }

  const handleUpdateTask = (moId: string, jsId: string, taskId: string, data: Partial<Task>) => {
    const updatedMOs = order.mos.map((mo) =>
      mo.id === moId
        ? {
            ...mo,
            jobsheets: mo.jobsheets.map((js) =>
              js.id === jsId
                ? {
                    ...js,
                    tasks: js.tasks.map((t) => (t.id === taskId ? { ...t, ...data } : t)),
                  }
                : js
            ),
          }
        : mo
    )
    setOrder({ ...order, mos: updatedMOs })
  }

  const handleDeleteTask = (moId: string, jsId: string, taskId: string) => {
    const updatedMOs = order.mos.map((mo) =>
      mo.id === moId
        ? {
            ...mo,
            jobsheets: mo.jobsheets.map((js) =>
              js.id === jsId ? { ...js, tasks: js.tasks.filter((t) => t.id !== taskId) } : js
            ),
          }
        : mo
    )
    setOrder({ ...order, mos: updatedMOs })
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Create Order
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          description: order.description,
          plannedStartDate: order.plannedStartDate,
          plannedEndDate: order.plannedEndDate,
        }),
      })

      if (!orderResponse.ok) throw new Error('Failed to create order')
      const orderData = await orderResponse.json()
      const orderId = orderData.order.id

      // Create MOs
      for (const mo of order.mos) {
        const moResponse = await fetch(`/api/orders/${orderId}/mo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            moNumber: mo.moNumber,
            name: mo.name,
            description: mo.description,
            plannedStartDate: mo.plannedStartDate,
            plannedEndDate: mo.plannedEndDate,
          }),
        })

        if (!moResponse.ok) throw new Error('Failed to create MO')
        const moData = await moResponse.json()
        const moId = moData.mo.id

        // Create Jobsheets
        for (const js of mo.jobsheets) {
          const jsResponse = await fetch(`/api/mo/${moId}/jobsheets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsNumber: js.jsNumber,
              name: js.name,
              description: js.description,
              plannedStartDate: js.plannedStartDate,
              plannedEndDate: js.plannedEndDate,
            }),
          })

          if (!jsResponse.ok) throw new Error('Failed to create jobsheet')
          const jsData = await jsResponse.json()
          const jsId = jsData.jobsheet.id

          // Create Tasks
          for (const task of js.tasks) {
            await fetch(`/api/jobsheet/${jsId}/tasks`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                taskNumber: task.taskNumber,
                name: task.name,
                description: task.description,
                plannedHours: task.plannedHours ? parseFloat(task.plannedHours) : null,
                machineId: task.machineId || null,
                assignedTo: task.assignedTo || null,
              }),
            })
          }
        }
      }

      toast({
        title: 'Success',
        description: 'Order created successfully!',
      })

      router.push(`/orders/${orderId}`)
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create order',
      })
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Order Information</h3>
            <p className="text-sm text-muted-foreground">
              Enter the customer order details
            </p>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="orderNumber">Order Number *</Label>
                <Input
                  id="orderNumber"
                  value={order.orderNumber}
                  onChange={(e) => setOrder({ ...order, orderNumber: e.target.value })}
                  placeholder="e.g., ORD-260221-00001"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={order.customerName}
                  onChange={(e) => setOrder({ ...order, customerName: e.target.value })}
                  placeholder="e.g., PT. Toyota Astra Motor"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={order.customerEmail}
                    onChange={(e) => setOrder({ ...order, customerEmail: e.target.value })}
                    placeholder="customer@example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="customerPhone">Phone</Label>
                  <Input
                    id="customerPhone"
                    value={order.customerPhone}
                    onChange={(e) => setOrder({ ...order, customerPhone: e.target.value })}
                    placeholder="+62xxx"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={order.description}
                  onChange={(e) => setOrder({ ...order, description: e.target.value })}
                  placeholder="Order description..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="plannedStartDate">Planned Start Date *</Label>
                  <Input
                    id="plannedStartDate"
                    type="date"
                    value={order.plannedStartDate}
                    onChange={(e) => setOrder({ ...order, plannedStartDate: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="plannedEndDate">Planned End Date *</Label>
                  <Input
                    id="plannedEndDate"
                    type="date"
                    value={order.plannedEndDate}
                    onChange={(e) => setOrder({ ...order, plannedEndDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Manufacturing Orders</h3>
                <p className="text-sm text-muted-foreground">
                  Add production batches for this order
                </p>
              </div>
              <Button onClick={handleAddMO} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add MO
              </Button>
            </div>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {order.mos.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No MOs added yet. Click "Add MO" to create one.</p>
                  </div>
                ) : (
                  order.mos.map((mo) => (
                    <Card
                      key={mo.id}
                      className={`cursor-pointer transition-colors ${
                        currentMO?.id === mo.id ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => setCurrentMO(mo)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{mo.moNumber}</Badge>
                            <span className="font-medium">{mo.name || 'Unnamed MO'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{mo.jobsheets.length} jobsheets</Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteMO(mo.id)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
            {currentMO && (
              <Card>
                <CardHeader>
                  <CardTitle>Edit {currentMO.moNumber}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label>MO Number</Label>
                    <Input
                      value={currentMO.moNumber}
                      onChange={(e) => handleUpdateMO(currentMO.id, { moNumber: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>MO Name</Label>
                    <Input
                      value={currentMO.name}
                      onChange={(e) => handleUpdateMO(currentMO.id, { name: e.target.value })}
                      placeholder="e.g., Frame Assembly"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Description</Label>
                    <Textarea
                      value={currentMO.description}
                      onChange={(e) => handleUpdateMO(currentMO.id, { description: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Planned Start</Label>
                      <Input
                        type="date"
                        value={currentMO.plannedStartDate}
                        onChange={(e) => handleUpdateMO(currentMO.id, { plannedStartDate: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Planned End</Label>
                      <Input
                        type="date"
                        value={currentMO.plannedEndDate}
                        onChange={(e) => handleUpdateMO(currentMO.id, { plannedEndDate: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Jobsheets</h3>
              <p className="text-sm text-muted-foreground">
                Add jobsheets for each MO
              </p>
            </div>
            {order.mos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Please add at least one MO first.</p>
                <Button variant="outline" onClick={handleBack} className="mt-4">
                  Go Back to Add MO
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-6">
                  {order.mos.map((mo) => (
                    <Card key={mo.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">{mo.moNumber} - {mo.name}</CardTitle>
                            <CardDescription>{mo.jobsheets.length} jobsheets</CardDescription>
                          </div>
                          <Button
                            onClick={() => handleAddJobsheet(mo.id)}
                            size="sm"
                            variant="outline"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Jobsheet
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {mo.jobsheets.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              No jobsheets yet. Click "Add Jobsheet" to create one.
                            </p>
                          ) : (
                            mo.jobsheets.map((js) => (
                              <div key={js.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary">{js.jsNumber}</Badge>
                                  <span className="font-medium">{js.name || 'Unnamed Jobsheet'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{js.tasks.length} tasks</Badge>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive"
                                    onClick={() => handleDeleteJobsheet(mo.id, js.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Machining Tasks</h3>
              <p className="text-sm text-muted-foreground">
                Add tasks for each jobsheet
              </p>
            </div>
            {order.mos.length === 0 || order.mos.every((mo) => mo.jobsheets.length === 0) ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Please add at least one jobsheet first.</p>
                <Button variant="outline" onClick={handleBack} className="mt-4">
                  Go Back to Add Jobsheets
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-6">
                  {order.mos.map((mo) =>
                    mo.jobsheets.map((js) => (
                      <Card key={js.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-base">
                                {mo.moNumber} / {js.jsNumber} - {js.name}
                              </CardTitle>
                              <CardDescription>{js.tasks.length} tasks</CardDescription>
                            </div>
                            <Button
                              onClick={() => handleAddTask(mo.id, js.id)}
                              size="sm"
                              variant="outline"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Task
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {js.tasks.length === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                No tasks yet. Click "Add Task" to create one.
                              </p>
                            ) : (
                              js.tasks.map((task) => (
                                <div key={task.id} className="p-3 border rounded-lg space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline">{task.taskNumber}</Badge>
                                      <span className="font-medium">{task.name || 'Unnamed Task'}</span>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive"
                                      onClick={() => handleDeleteTask(mo.id, js.id, task.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <Input
                                      placeholder="Task name"
                                      value={task.name}
                                      onChange={(e) => handleUpdateTask(mo.id, js.id, task.id, { name: e.target.value })}
                                    />
                                    <Input
                                      type="number"
                                      placeholder="Hours"
                                      value={task.plannedHours}
                                      onChange={(e) => handleUpdateTask(mo.id, js.id, task.id, { plannedHours: e.target.value })}
                                    />
                                  </div>
                                  <Textarea
                                    placeholder="Description"
                                    value={task.description}
                                    onChange={(e) => handleUpdateTask(mo.id, js.id, task.id, { description: e.target.value })}
                                    rows={2}
                                  />
                                </div>
                              ))
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        )

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Review Order</h3>
            <p className="text-sm text-muted-foreground">
              Review all details before creating the order
            </p>
            <Card>
              <CardHeader>
                <CardTitle>{order.orderNumber || 'New Order'}</CardTitle>
                <CardDescription>{order.customerName}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Email:</span> {order.customerEmail || '-'}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span> {order.customerPhone || '-'}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Start:</span> {order.plannedStartDate || '-'}
                  </div>
                  <div>
                    <span className="text-muted-foreground">End:</span> {order.plannedEndDate || '-'}
                  </div>
                </div>
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Manufacturing Orders:</span>
                    <Badge>{order.mos.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Total Jobsheets:</span>
                    <Badge variant="secondary">
                      {order.mos.reduce((sum, mo) => sum + mo.jobsheets.length, 0)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total Tasks:</span>
                    <Badge variant="outline">
                      {order.mos.reduce(
                        (sum, mo) => sum + mo.jobsheets.reduce((s, js) => s + js.tasks.length, 0),
                        0
                      )}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <AppLayout title="Order Creation Wizard">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/orders')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create New Order</h1>
            <p className="text-muted-foreground">Interactive wizard to create order with MOs, jobsheets, and tasks</p>
          </div>
        </div>

        {/* Progress Steps */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isCompleted = currentStep > step.id
                const isCurrent = currentStep === step.id

                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors ${
                          isCompleted
                            ? 'bg-primary border-primary text-primary-foreground'
                            : isCurrent
                            ? 'border-primary text-primary'
                            : 'border-muted text-muted-foreground'
                        }`}
                      >
                        {isCompleted ? <Check className="h-6 w-6" /> : <Icon className="h-5 w-5" />}
                      </div>
                      <span className={`text-xs mt-2 font-medium ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>
                        {step.title}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-1 mx-4 ${isCompleted ? 'bg-primary' : 'bg-muted'}`} />
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">{Math.round((currentStep / totalSteps) * 100)}%</span>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="pt-6">
            {renderStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          {currentStep < totalSteps ? (
            <Button onClick={handleNext} disabled={currentStep === 2 && order.mos.length === 0}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading || !order.orderNumber || !order.customerName}>
              {loading ? 'Creating...' : 'Create Order'}
              <Check className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
