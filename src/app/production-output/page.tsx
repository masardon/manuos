'use client'

import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { 
  Package, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Play,
  Pause,
  Square,
  Factory,
  MapPin,
  User,
  Wrench,
  ClipboardCheck,
  RotateCcw,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'

// ============================================
// INTERFACES
// ============================================

interface Task {
  id: string
  taskNumber: string
  name: string
  status: string
  machineId: string | null
  assignedTo: string | null
  clockedInAt: string | null
  clockedOutAt: string | null
  actualHours: number | null
  plannedHours: number | null
  jobsheet: {
    id: string
    jsNumber: string
    name: string
    moId: string
    moNumber: string
    moName: string
    recipeOutput: {
      partNumber: string
      name: string
      quantity: number
      unit: string | null
    } | null
  }
  machine?: { code: string; name: string } | null
  assignedUser?: { name: string } | null
  materialAllocations: {
    id: string
    allocatedQty: number
    consumedQty: number
    jobsheetMaterial: {
      partNumber: string
      name: string
      unit: string | null
    }
  }[]
  productionOutputs: ProductionOutput[]
}

interface ProductionOutput {
  id: string
  outputNumber: string
  partNumber: string
  productName: string
  plannedQty: number
  actualQty: number
  goodQty: number
  reworkQty: number
  scrapQty: number
  status: string
  qcPassed: boolean
  batch: string | null
  createdAt: string
}

interface Location {
  id: string
  code: string
  name: string
  type: string
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ProductionOutputPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [moFilter, setMoFilter] = useState<string>('all')
  const [mos, setMos] = useState<any[]>([])
  
  // Dialog states
  const [outputDialogOpen, setOutputDialogOpen] = useState(false)
  const [qcDialogOpen, setQcDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [selectedOutput, setSelectedOutput] = useState<ProductionOutput | null>(null)
  
  const [outputForm, setOutputForm] = useState({
    actualQty: 0,
    goodQty: 0,
    reworkQty: 0,
    scrapQty: 0,
    batch: '',
    outputLocationId: '',
    notes: '',
  })
  
  const [qcForm, setQcForm] = useState({
    qcPassed: true,
    goodQty: 0,
    reworkQty: 0,
    scrapQty: 0,
    defectNotes: '',
  })

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, mosRes, locationsRes] = await Promise.all([
          fetch('/api/production-output/tasks'),
          fetch('/api/mo'),
          fetch('/api/locations'),
        ])

        if (tasksRes.ok) {
          const tasksData = await tasksRes.json()
          setTasks(tasksData.tasks || [])
        }

        if (mosRes.ok) {
          const mosData = await mosRes.json()
          setMos(mosData.mos || [])
        }

        if (locationsRes.ok) {
          const locData = await locationsRes.json()
          setLocations(locData.locations || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false
    if (moFilter !== 'all' && task.jobsheet.moId !== moFilter) return false
    return true
  })

  // Stats
  const stats = {
    totalTasks: tasks.length,
    inProgress: tasks.filter(t => t.status === 'RUNNING').length,
    completed: tasks.filter(t => t.status === 'COMPLETED').length,
    pending: tasks.filter(t => t.status === 'PENDING' || t.status === 'ASSIGNED').length,
    totalOutputs: tasks.reduce((sum, t) => sum + t.productionOutputs.length, 0),
  }

  // Open output dialog
  const handleRecordOutput = (task: Task) => {
    setSelectedTask(task)
    const expectedQty = task.jobsheet.recipeOutput?.quantity || 1
    setOutputForm({
      actualQty: expectedQty,
      goodQty: expectedQty,
      reworkQty: 0,
      scrapQty: 0,
      batch: `BATCH-${Date.now()}`,
      outputLocationId: '',
      notes: '',
    })
    setOutputDialogOpen(true)
  }

  // Submit production output
  const handleSubmitOutput = async () => {
    if (!selectedTask) return

    try {
      const res = await fetch('/api/production-output', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: selectedTask.id,
          jobsheetId: selectedTask.jobsheet.id,
          moId: selectedTask.jobsheet.moId,
          partNumber: selectedTask.jobsheet.recipeOutput?.partNumber,
          productName: selectedTask.jobsheet.recipeOutput?.name,
          plannedQty: selectedTask.jobsheet.recipeOutput?.quantity || 1,
          actualQty: outputForm.actualQty,
          goodQty: outputForm.goodQty,
          reworkQty: outputForm.reworkQty,
          scrapQty: outputForm.scrapQty,
          batch: outputForm.batch,
          outputLocationId: outputForm.outputLocationId,
          notes: outputForm.notes,
        }),
      })

      if (res.ok) {
        toast({
          title: 'Production Output Recorded',
          description: 'Output has been recorded and inventory updated',
        })
        setOutputDialogOpen(false)
        // Refresh tasks
        const tasksRes = await fetch('/api/production-output/tasks')
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json()
          setTasks(tasksData.tasks || [])
        }
      } else {
        throw new Error('Failed to record output')
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to record production output',
      })
    }
  }

  // Open QC dialog
  const handleQC = (output: ProductionOutput) => {
    setSelectedOutput(output)
    setQcForm({
      qcPassed: true,
      goodQty: output.goodQty,
      reworkQty: output.reworkQty,
      scrapQty: output.scrapQty,
      defectNotes: '',
    })
    setQcDialogOpen(true)
  }

  // Submit QC
  const handleSubmitQC = async () => {
    if (!selectedOutput) return

    try {
      const res = await fetch(`/api/production-output/${selectedOutput.id}/qc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qcPassed: qcForm.qcPassed,
          goodQty: qcForm.goodQty,
          reworkQty: qcForm.reworkQty,
          scrapQty: qcForm.scrapQty,
          defectNotes: qcForm.defectNotes,
        }),
      })

      if (res.ok) {
        toast({
          title: 'QC Completed',
          description: qcForm.qcPassed ? 'Output passed QC and stored' : 'Output failed QC - rework required',
        })
        setQcDialogOpen(false)
        // Refresh tasks
        const tasksRes = await fetch('/api/production-output/tasks')
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json()
          setTasks(tasksData.tasks || [])
        }
      } else {
        throw new Error('Failed to complete QC')
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to complete QC',
      })
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; icon: any }> = {
      PENDING: { bg: 'bg-gray-100', text: 'text-gray-800', icon: Clock },
      ASSIGNED: { bg: 'bg-blue-100', text: 'text-blue-800', icon: User },
      RUNNING: { bg: 'bg-green-100', text: 'text-green-800', icon: Play },
      PAUSED: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Pause },
      COMPLETED: { bg: 'bg-purple-100', text: 'text-purple-800', icon: CheckCircle },
      ON_HOLD: { bg: 'bg-orange-100', text: 'text-orange-800', icon: AlertTriangle },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', icon: Square },
    }
    const cfg = config[status] || config.PENDING
    const Icon = cfg.icon
    return (
      <Badge className={`${cfg.bg} ${cfg.text}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    )
  }

  // Get output status badge
  const getOutputStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string }> = {
      IN_PROGRESS: { bg: 'bg-blue-100', text: 'text-blue-800' },
      COMPLETED: { bg: 'bg-purple-100', text: 'text-purple-800' },
      QC_PASSED: { bg: 'bg-green-100', text: 'text-green-800' },
      QC_FAILED: { bg: 'bg-red-100', text: 'text-red-800' },
      REWORK: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      SCRAPPED: { bg: 'bg-gray-200', text: 'text-gray-700' },
      STORED: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
    }
    const cfg = config[status] || config.IN_PROGRESS
    return <Badge className={`${cfg.bg} ${cfg.text}`}>{status.replace(/_/g, ' ')}</Badge>
  }

  if (loading) {
    return (
      <AppLayout title="Production Output">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Production Output">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Production Output</h1>
          <p className="text-muted-foreground mt-1">
            Record production output when machining tasks are completed
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.totalTasks}</div>
                <p className="text-xs text-muted-foreground">Total Tasks</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
                <p className="text-xs text-blue-700">In Progress</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <p className="text-xs text-green-700">Completed</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <p className="text-xs text-yellow-700">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.totalOutputs}</div>
                <p className="text-xs text-purple-700">Outputs Recorded</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex gap-4">
              <div className="grid gap-2 flex-1">
                <Label>Filter by MO</Label>
                <Select value={moFilter} onValueChange={setMoFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All MOs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All MOs</SelectItem>
                    {mos.map((mo) => (
                      <SelectItem key={mo.id} value={mo.id}>
                        {mo.moNumber} - {mo.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 flex-1">
                <Label>Filter by Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="RUNNING">Running</SelectItem>
                    <SelectItem value="ASSIGNED">Assigned</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Table */}
        <Card>
          <CardHeader>
            <CardTitle>Production Tasks</CardTitle>
            <CardDescription>
              Record output when tasks are completed. Output goes through QC before being stored as finished goods.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No tasks found matching the filters.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>MO</TableHead>
                    <TableHead>Machine</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Expected Output</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Production Output</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{task.taskNumber}</p>
                          <p className="text-xs text-muted-foreground">{task.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{task.jobsheet.moNumber}</Badge>
                      </TableCell>
                      <TableCell>
                        {task.machine ? (
                          <span className="text-sm">{task.machine.code}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {task.assignedUser ? (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span className="text-sm">{task.assignedUser.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {task.jobsheet.recipeOutput ? (
                          <div className="text-sm">
                            <p>{task.jobsheet.recipeOutput.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Qty: {task.jobsheet.recipeOutput.quantity} {task.jobsheet.recipeOutput.unit || ''}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">No recipe</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(task.status)}</TableCell>
                      <TableCell>
                        {task.productionOutputs.length > 0 ? (
                          <div className="space-y-1">
                            {task.productionOutputs.map((output) => (
                              <div key={output.id} className="flex items-center gap-1">
                                {getOutputStatusBadge(output.status)}
                                <span className="text-xs">
                                  {output.goodQty}/{output.actualQty}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No output recorded</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRecordOutput(task)}
                          disabled={task.status !== 'RUNNING' && task.status !== 'COMPLETED'}
                        >
                          <Package className="h-3 w-3 mr-1" />
                          Record Output
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Process Flow Info */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Factory className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">Production Output Flow</p>
                <div className="text-sm text-green-700 mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">1. Task Execution</span>
                    <span className="text-muted-foreground">→ Technician works on machining task</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">2. Record Output</span>
                    <span className="text-muted-foreground">→ Enter actual quantities produced</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">3. QC Inspection</span>
                    <span className="text-muted-foreground">→ Quality check the output</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">4. Store Finished Goods</span>
                    <span className="text-muted-foreground">→ Good items go to inventory as finished goods</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">5. Rework/Scrap</span>
                    <span className="text-muted-foreground">→ Failed items go to rework or scrap</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Record Output Dialog */}
      <Dialog open={outputDialogOpen} onOpenChange={setOutputDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Production Output</DialogTitle>
            <DialogDescription>
              Enter the actual quantities produced by this task
            </DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              {/* Task Info */}
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedTask.taskNumber} - {selectedTask.name}</p>
                <p className="text-sm text-muted-foreground">
                  MO: {selectedTask.jobsheet.moNumber} | JS: {selectedTask.jobsheet.jsNumber}
                </p>
                {selectedTask.jobsheet.recipeOutput && (
                  <p className="text-sm mt-1">
                    Expected: <strong>{selectedTask.jobsheet.recipeOutput.quantity}</strong> {selectedTask.jobsheet.recipeOutput.unit || ''} of {selectedTask.jobsheet.recipeOutput.name}
                  </p>
                )}
              </div>

              {/* Output Form */}
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Total Produced</Label>
                    <Input
                      type="number"
                      value={outputForm.actualQty}
                      onChange={(e) => setOutputForm({ ...outputForm, actualQty: parseFloat(e.target.value) || 0 })}
                      min={0}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Batch Number</Label>
                    <Input
                      value={outputForm.batch}
                      onChange={(e) => setOutputForm({ ...outputForm, batch: e.target.value })}
                      placeholder="BATCH-001"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-green-600">Good Qty</Label>
                    <Input
                      type="number"
                      value={outputForm.goodQty}
                      onChange={(e) => setOutputForm({ ...outputForm, goodQty: parseFloat(e.target.value) || 0 })}
                      className="border-green-300"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-yellow-600">Rework Qty</Label>
                    <Input
                      type="number"
                      value={outputForm.reworkQty}
                      onChange={(e) => setOutputForm({ ...outputForm, reworkQty: parseFloat(e.target.value) || 0 })}
                      className="border-yellow-300"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-red-600">Scrap Qty</Label>
                    <Input
                      type="number"
                      value={outputForm.scrapQty}
                      onChange={(e) => setOutputForm({ ...outputForm, scrapQty: parseFloat(e.target.value) || 0 })}
                      className="border-red-300"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Output Location (Storage)</Label>
                  <Select
                    value={outputForm.outputLocationId}
                    onValueChange={(value) => setOutputForm({ ...outputForm, outputLocationId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select storage location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.filter(l => 
                        l.type === 'WAREHOUSE' || 
                        l.type === 'QC_AREA' || 
                        l.type === 'PRODUCTION_AREA'
                      ).map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {loc.code} - {loc.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={outputForm.notes}
                    onChange={(e) => setOutputForm({ ...outputForm, notes: e.target.value })}
                    placeholder="Production notes..."
                    rows={2}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOutputDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitOutput}>
              <Package className="h-4 w-4 mr-2" />
              Record Output
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QC Dialog */}
      <Dialog open={qcDialogOpen} onOpenChange={setQcDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Quality Control Inspection</DialogTitle>
            <DialogDescription>
              Inspect the production output and mark items as good, rework, or scrap
            </DialogDescription>
          </DialogHeader>
          {selectedOutput && (
            <div className="space-y-4">
              {/* Output Info */}
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedOutput.partNumber} - {selectedOutput.productName}</p>
                <p className="text-sm text-muted-foreground">
                  Batch: {selectedOutput.batch || 'N/A'}
                </p>
                <p className="text-sm mt-1">
                  Total Produced: <strong>{selectedOutput.actualQty}</strong>
                </p>
              </div>

              {/* QC Form */}
              <div className="grid gap-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-green-600">Pass Qty</Label>
                    <Input
                      type="number"
                      value={qcForm.goodQty}
                      onChange={(e) => setQcForm({ ...qcForm, goodQty: parseFloat(e.target.value) || 0 })}
                      className="border-green-300"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-yellow-600">Rework Qty</Label>
                    <Input
                      type="number"
                      value={qcForm.reworkQty}
                      onChange={(e) => setQcForm({ ...qcForm, reworkQty: parseFloat(e.target.value) || 0 })}
                      className="border-yellow-300"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-red-600">Scrap Qty</Label>
                    <Input
                      type="number"
                      value={qcForm.scrapQty}
                      onChange={(e) => setQcForm({ ...qcForm, scrapQty: parseFloat(e.target.value) || 0 })}
                      className="border-red-300"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>QC Result</Label>
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant={qcForm.qcPassed ? "default" : "outline"}
                      className={qcForm.qcPassed ? "bg-green-600 hover:bg-green-700" : ""}
                      onClick={() => setQcForm({ ...qcForm, qcPassed: true })}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Pass
                    </Button>
                    <Button
                      type="button"
                      variant={!qcForm.qcPassed ? "default" : "outline"}
                      className={!qcForm.qcPassed ? "bg-red-600 hover:bg-red-700" : ""}
                      onClick={() => setQcForm({ ...qcForm, qcPassed: false })}
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Fail
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Defect Notes {qcForm.qcPassed ? '' : '(Required)'}</Label>
                  <Textarea
                    value={qcForm.defectNotes}
                    onChange={(e) => setQcForm({ ...qcForm, defectNotes: e.target.value })}
                    placeholder="Describe any defects or issues..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setQcDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitQC}>
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Complete QC
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
