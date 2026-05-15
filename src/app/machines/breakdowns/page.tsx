'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  Plus,
  RefreshCw,
  Factory,
  Calendar,
  ArrowRight,
  ArrowRightLeft,
} from 'lucide-react'

interface AffectedTask {
  id: string
  taskNumber: string
  name: string
  status: string
  breakdownAt: string | null
  breakdownNote: string | null
  estimatedRecoveryDate: string | null
  plannedStartDate: string | null
  plannedEndDate: string | null
  jobsheet: {
    jsNumber: string
    name: string
    manufacturingOrder: {
      moNumber: string
      name: string
      order: {
        orderNumber: string
        customerName: string
      }
    }
  }
}

interface Breakdown {
  id: string
  machineId: string
  machine: {
    id: string
    code: string
    name: string
    type?: string
    status: string
  }
  reportedBy: string
  reportedAt: string
  type: string
  description: string
  notes?: string
  estimatedRecoveryDate?: string
  resolved: boolean
  resolvedAt?: string
  resolvedBy?: string
  resolution?: string
  affectedTasks: AffectedTask[]
}

interface Machine {
  id: string
  code: string
  name: string
  type?: string
  status: string
}

export default function MachineBreakdownsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [breakdowns, setBreakdowns] = useState<Breakdown[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [selectedMachine, setSelectedMachine] = useState('')
  const [reporting, setReporting] = useState(false)

  const [breakdownType, setBreakdownType] = useState('MECHANICAL')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [estimatedRecovery, setEstimatedRecovery] = useState('')

  // Reassign dialog state
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false)
  const [reassignTaskId, setReassignTaskId] = useState('')
  const [reassignBreakdownId, setReassignBreakdownId] = useState('')
  const [reassignMachineId, setReassignMachineId] = useState('')
  const [reassigning, setReassigning] = useState(false)

  const fetchData = async () => {
    try {
      const [breakdownsRes, machinesRes] = await Promise.all([
        fetch('/api/breakdowns'),
        fetch('/api/machines'),
      ])

      if (breakdownsRes.ok) {
        const data = await breakdownsRes.json()
        setBreakdowns(data.breakdowns || [])
      }

      if (machinesRes.ok) {
        const machinesData = await machinesRes.json()
        setMachines(machinesData.machines || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            setIsAuthenticated(true)
            await fetchData()
          } else {
            router.replace('/login')
          }
        } else {
          router.replace('/login')
        }
      } catch (error) {
        router.replace('/login')
      }
    }
    checkAuth()
  }, [router])

  const getTypeBadge = (type: string) => {
    const config: Record<string, string> = {
      MECHANICAL: 'bg-red-100 text-red-800',
      ELECTRICAL: 'bg-yellow-100 text-yellow-800',
      MAINTENANCE: 'bg-blue-100 text-blue-800',
      OTHER: 'bg-gray-100 text-gray-800',
    }
    return <Badge variant="outline" className={config[type] || 'bg-gray-100 text-gray-800'}>{type}</Badge>
  }

  const getTaskStatusBadge = (status: string) => {
    const config: Record<string, string> = {
      PENDING: 'bg-gray-100 text-gray-800',
      ASSIGNED: 'bg-blue-100 text-blue-800',
      RUNNING: 'bg-orange-100 text-orange-800',
      PAUSED: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      ON_HOLD: 'bg-orange-100 text-orange-800',
    }
    return <Badge className={config[status] || 'bg-gray-100 text-gray-800'}>{status.replace(/_/g, ' ')}</Badge>
  }

  const handleReportBreakdown = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMachine || !description.trim()) return

    setReporting(true)
    try {
      const response = await fetch('/api/breakdowns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machineId: selectedMachine,
          type: breakdownType,
          description,
          notes,
          estimatedRecoveryDate: estimatedRecovery || null,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: 'Breakdown Reported',
          description: result.message || 'Machine breakdown reported successfully',
        })
        await fetchData()
        setReportDialogOpen(false)
        setDescription('')
        setNotes('')
        setSelectedMachine('')
        setBreakdownType('MECHANICAL')
        setEstimatedRecovery('')
      } else {
        const err = await response.json()
        toast({ variant: 'destructive', title: 'Error', description: err.error })
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to report breakdown' })
    } finally {
      setReporting(false)
    }
  }

  const handleResolveBreakdown = async (breakdownId: string) => {
    try {
      const response = await fetch(`/api/breakdowns/${breakdownId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution: 'Machine restored to service' }),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: 'Breakdown Resolved',
          description: result.message || 'Machine restored to service',
        })
        await fetchData()
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to resolve breakdown' })
    }
  }

  const openReassignDialog = (breakdownId: string, taskId: string) => {
    setReassignBreakdownId(breakdownId)
    setReassignTaskId(taskId)
    setReassignMachineId('')
    setReassignDialogOpen(true)
  }

  const handleReassign = async () => {
    if (!reassignBreakdownId || !reassignTaskId || !reassignMachineId) return

    setReassigning(true)
    try {
      const response = await fetch(`/api/breakdowns/${reassignBreakdownId}/reassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: reassignTaskId,
          newMachineId: reassignMachineId,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast({ title: 'Task Reassigned', description: result.message })
        setReassignDialogOpen(false)
        await fetchData()
      } else {
        const err = await response.json()
        toast({ variant: 'destructive', title: 'Error', description: err.error })
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to reassign task' })
    } finally {
      setReassigning(false)
    }
  }

  const getDuration = (reportedAt: string, resolvedAt?: string) => {
    const start = new Date(reportedAt)
    const end = resolvedAt ? new Date(resolvedAt) : new Date()
    const diffMs = end.getTime() - start.getTime()
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('id-ID', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading breakdowns...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  const activeBreakdowns = breakdowns.filter(b => !b.resolved)
  const resolvedBreakdowns = breakdowns.filter(b => b.resolved)
  const totalAffectedTasks = activeBreakdowns.reduce((sum, b) => sum + b.affectedTasks.length, 0)

  return (
    <AppLayout title="Machine Breakdowns">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Machine Breakdowns</h2>
            <p className="text-muted-foreground mt-1">Track machine issues and their production impact</p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted/50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Breakdowns</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{activeBreakdowns.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Affected Tasks</CardTitle>
              <Factory className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{totalAffectedTasks}</div>
              <p className="text-xs text-muted-foreground">Tasks paused due to breakdowns</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {resolvedBreakdowns.filter(b => {
                  const today = new Date().toDateString()
                  return b.resolvedAt && new Date(b.resolvedAt).toDateString() === today
                }).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Machines DOWN</CardTitle>
              <Wrench className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {machines.filter(m => m.status === 'DOWN').length}
              </div>
              <p className="text-xs text-muted-foreground">of {machines.length} total</p>
            </CardContent>
          </Card>
        </div>

        {/* Report Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Report New Breakdown</CardTitle>
            <CardDescription>Report a machine issue - all running tasks will be paused automatically</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" variant="outline">
                  <Plus className="h-5 w-5 mr-2" />
                  Report Breakdown
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Report Machine Breakdown</DialogTitle>
                  <DialogDescription>
                    All running tasks on this machine will be paused automatically
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleReportBreakdown} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="machine">Machine *</Label>
                    <Select value={selectedMachine} onValueChange={setSelectedMachine}>
                      <SelectTrigger id="machine">
                        <SelectValue placeholder="Select a machine" />
                      </SelectTrigger>
                      <SelectContent>
                        {machines.filter(m => m.status !== 'DOWN').map(machine => (
                          <SelectItem key={machine.id} value={machine.id}>
                            {machine.code} - {machine.name} ({machine.status})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Breakdown Type</Label>
                    <Select value={breakdownType} onValueChange={setBreakdownType}>
                      <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MECHANICAL">Mechanical</SelectItem>
                        <SelectItem value="ELECTRICAL">Electrical</SelectItem>
                        <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe what happened..."
                      required
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recovery">Estimated Recovery</Label>
                    <Input
                      id="recovery"
                      type="datetime-local"
                      value={estimatedRecovery}
                      onChange={(e) => setEstimatedRecovery(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      When do you expect the machine to be back online?
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any additional information..."
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => setReportDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={reporting || !selectedMachine || !description.trim()}>
                      {reporting ? 'Reporting...' : 'Report Breakdown'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Reassign Task Dialog */}
        <Dialog open={reassignDialogOpen} onOpenChange={setReassignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reassign Task to Another Machine</DialogTitle>
              <DialogDescription>
                Move this task from the broken machine to an available machine
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Target Machine</Label>
                <Select value={reassignMachineId} onValueChange={setReassignMachineId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a machine" />
                  </SelectTrigger>
                  <SelectContent>
                    {machines.filter(m => m.status === 'IDLE' || m.status === 'BUSY').map(machine => (
                      <SelectItem key={machine.id} value={machine.id}>
                        {machine.code} - {machine.name} ({machine.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Only IDLE or BUSY machines are shown
                </p>
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setReassignDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleReassign}
                  disabled={reassigning || !reassignMachineId}
                >
                  {reassigning ? 'Reassigning...' : 'Reassign Task'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Breakdowns List */}
        <Card>
          <CardHeader>
            <CardTitle>Breakdown History</CardTitle>
            <CardDescription>Active and resolved breakdowns with production impact</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[800px] overflow-y-auto">
              {breakdowns.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No breakdowns recorded</div>
              ) : (
                breakdowns.map(breakdown => (
                  <div key={breakdown.id} className={`p-4 border rounded-lg ${breakdown.resolved ? 'bg-muted/30' : 'border-red-200 bg-red-50/50'}`}>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className={`h-5 w-5 ${breakdown.resolved ? 'text-green-500' : 'text-red-500'}`} />
                        <div>
                          <p className="font-medium">{breakdown.machine.code} - {breakdown.machine.name}</p>
                          <p className="text-sm text-muted-foreground">{breakdown.machine.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTypeBadge(breakdown.type)}
                        <Badge className={breakdown.resolved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {breakdown.resolved ? 'Resolved' : 'Active'}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-sm mb-2">{breakdown.description}</p>
                    {breakdown.notes && <p className="text-xs text-muted-foreground mb-3">Notes: {breakdown.notes}</p>}

                    {/* Timeline */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      <span>Reported: {formatDate(breakdown.reportedAt)}</span>
                      {breakdown.estimatedRecoveryDate && !breakdown.resolved && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Est. Recovery: {formatDate(breakdown.estimatedRecoveryDate)}
                        </span>
                      )}
                      <span>Duration: {getDuration(breakdown.reportedAt, breakdown.resolvedAt)}</span>
                    </div>

                    {/* Affected Tasks / Production Impact */}
                    {breakdown.affectedTasks.length > 0 && (
                      <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded">
                        <p className="text-sm font-medium text-orange-800 mb-2 flex items-center gap-2">
                          <Factory className="h-4 w-4" />
                          Production Impact ({breakdown.affectedTasks.length} task{breakdown.affectedTasks.length > 1 ? 's' : ''} paused)
                        </p>
                        <div className="space-y-2">
                          {breakdown.affectedTasks.map(task => (
                            <div key={task.id} className="flex items-center justify-between text-xs bg-white p-2 rounded border">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{task.taskNumber}</span>
                                <span className="text-muted-foreground">{task.name}</span>
                                {getTaskStatusBadge(task.status)}
                              </div>
                              <div className="flex items-center gap-3 text-muted-foreground">
                                <span>{task.jobsheet.manufacturingOrder.order.orderNumber}</span>
                                <ArrowRight className="h-3 w-3" />
                                <span>{task.jobsheet.manufacturingOrder.moNumber}</span>
                                <ArrowRight className="h-3 w-3" />
                                <span>{task.jobsheet.jsNumber}</span>
                                {task.estimatedRecoveryDate && (
                                  <span className="text-orange-600">
                                    Est: {formatDate(task.estimatedRecoveryDate)}
                                  </span>
                                )}
                                {!breakdown.resolved && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 text-xs"
                                    onClick={() => openReassignDialog(breakdown.id, task.id)}
                                  >
                                    <ArrowRightLeft className="h-3 w-3 mr-1" />
                                    Reassign
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Resolution */}
                    {breakdown.resolved && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-800">
                            Resolved at {formatDate(breakdown.resolvedAt)}
                          </span>
                          {breakdown.resolution && (
                            <span className="text-green-700">- {breakdown.resolution}</span>
                          )}
                        </div>
                        {breakdown.affectedTasks.length > 0 && (
                          <p className="text-xs text-green-700 mt-1">
                            {breakdown.affectedTasks.length} task(s) automatically resumed
                          </p>
                        )}
                      </div>
                    )}

                    {/* Resolve Button */}
                    {!breakdown.resolved && (
                      <div className="mt-3 flex justify-end">
                        <Button size="sm" onClick={() => handleResolveBreakdown(breakdown.id)}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark Resolved & Resume Tasks
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
