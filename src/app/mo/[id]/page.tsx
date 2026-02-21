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
  Kanban,
  Store,
  Plus,
  Trash2,
  Edit,
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
  machiningTasks: Task[]
}

interface ManufacturingOrder {
  id: string
  moNumber: string
  name: string
  description: string | null
  status: string
  progressPercent: number
  plannedStartDate: string
  plannedEndDate: string
  actualStartDate: string | null
  actualEndDate: string | null
  order: {
    id: string
    orderNumber: string
    customerName: string
    status: string
    progressPercent: number
  }
  jobsheets: Jobsheet[]
}

export default function MODetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [mo, setMo] = useState<ManufacturingOrder | null>(null)
  const [machines, setMachines] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  
  // Jobsheet dialog state
  const [isJobsheetDialogOpen, setIsJobsheetDialogOpen] = useState(false)
  const [editingJobsheet, setEditingJobsheet] = useState<Jobsheet | null>(null)
  const [jobsheetForm, setJobsheetForm] = useState({
    jsNumber: '',
    name: '',
    description: '',
    plannedStartDate: '',
    plannedEndDate: '',
  })

  useEffect(() => {
    fetchMO()
    fetchMachines()
    fetchUsers()
  }, [params.id])

  const fetchMO = async () => {
    try {
      const response = await fetch(`/api/mo/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setMo(data.mo)
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'MO not found',
        })
      }
    } catch (error) {
      console.error('Error fetching MO:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load MO details',
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

  const handleAddJobsheet = () => {
    setEditingJobsheet(null)
    setJobsheetForm({
      jsNumber: '',
      name: '',
      description: '',
      plannedStartDate: '',
      plannedEndDate: '',
    })
    setIsJobsheetDialogOpen(true)
  }

  const handleEditJobsheet = (jobsheet: Jobsheet) => {
    setEditingJobsheet(jobsheet)
    setJobsheetForm({
      jsNumber: jobsheet.jsNumber,
      name: jobsheet.name,
      description: jobsheet.description || '',
      plannedStartDate: jobsheet.plannedStartDate,
      plannedEndDate: jobsheet.plannedEndDate,
    })
    setIsJobsheetDialogOpen(true)
  }

  const handleDeleteJobsheet = async (jobsheetId: string, jsNumber: string) => {
    if (!confirm(`Are you sure you want to delete jobsheet ${jsNumber}?`)) return

    try {
      const response = await fetch(`/api/jobsheet/${jobsheetId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Jobsheet deleted successfully',
        })
        await fetchMO()
      } else {
        throw new Error('Failed to delete jobsheet')
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete jobsheet',
      })
    }
  }

  const handleSaveJobsheet = async () => {
    try {
      const url = editingJobsheet
        ? `/api/jobsheet/${editingJobsheet.id}`
        : `/api/mo/${params.id}/jobsheets`

      const response = await fetch(url, {
        method: editingJobsheet ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobsheetForm),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: editingJobsheet ? 'Jobsheet updated successfully' : 'Jobsheet created successfully',
        })
        setIsJobsheetDialogOpen(false)
        await fetchMO()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save jobsheet')
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save jobsheet',
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PLANNED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-orange-100 text-orange-800',
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

  // Get actual start date from earliest jobsheet
  const getActualStartDate = () => {
    const jobsheetsWithStart = mo?.jobsheets.filter(js => js.actualStartDate)
    if (!jobsheetsWithStart || jobsheetsWithStart.length === 0) return null
    
    const earliest = jobsheetsWithStart.reduce((earliest, current) => {
      return new Date(current.actualStartDate!) < new Date(earliest.actualStartDate!) ? current : earliest
    })
    
    return earliest.actualStartDate
  }

  // Get actual end date - only if ALL jobsheets are completed
  const getActualEndDate = () => {
    if (!mo) return null
    
    const allCompleted = mo.jobsheets.every(js => js.status === 'COMPLETED')
    if (!allCompleted) return null
    
    const jobsheetsWithEnd = mo.jobsheets.filter(js => js.actualEndDate)
    if (jobsheetsWithEnd.length === 0) return null
    
    const latest = jobsheetsWithEnd.reduce((latest, current) => {
      return new Date(current.actualEndDate!) > new Date(latest.actualEndDate!) ? current : latest
    })
    
    return latest.actualEndDate
  }

  // Check if jobsheet can be edited/deleted (no tasks started)
  const canEditJobsheet = (jobsheet: Jobsheet) => {
    // Can't edit if any task has been clocked in
    const hasStartedTasks = jobsheet.machiningTasks.some(t => t.clockedInAt)
    return !hasStartedTasks
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
              Back to MOs
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="MO Details">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/mo')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">{mo.moNumber}</Badge>
                {getStatusBadge(mo.status)}
              </div>
              <h1 className="text-3xl font-bold">{mo.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchMO} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={handleAddJobsheet}>
              <Plus className="h-4 w-4 mr-2" />
              Add Jobsheet
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
                <span className="text-lg font-bold">{mo.progressPercent}%</span>
              </div>
              <Progress value={mo.progressPercent} className="h-3" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <div className="text-xs text-muted-foreground">Status</div>
                  <div className="font-medium">{mo.status.replace(/_/g, ' ')}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Jobsheets</div>
                  <div className="font-medium">{mo.jobsheets.length} total</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                  <div className="font-medium">{mo.jobsheets.filter(js => js.status === 'COMPLETED').length}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">In Progress</div>
                  <div className="font-medium">{mo.jobsheets.filter(js => js.status === 'IN_PROGRESS').length}</div>
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
                  <div className="font-medium">{mo.order.orderNumber}</div>
                  <div className="text-sm text-muted-foreground">{mo.order.customerName}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Progress</div>
                  <div className="font-medium">{mo.order.progressPercent}%</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <Wrench className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">MO (Current)</div>
                  <div className="font-medium">{mo.moNumber}</div>
                  <div className="text-sm text-muted-foreground">{mo.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Progress</div>
                  <div className="font-medium">{mo.progressPercent}%</div>
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
                <div className="font-medium mt-1">{formatDateTime(mo.plannedStartDate)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Planned End
                </div>
                <div className="font-medium mt-1">{formatDateTime(mo.plannedEndDate)}</div>
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

        {/* Jobsheets List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Jobsheets</CardTitle>
              <Badge variant="secondary">{mo.jobsheets.length} jobsheets</Badge>
            </div>
            <CardDescription>Production jobsheets and machining tasks</CardDescription>
          </CardHeader>
          <CardContent>
            {mo.jobsheets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No jobsheets defined for this MO</p>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {mo.jobsheets.map((jobsheet) => (
                    <div key={jobsheet.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{jobsheet.jsNumber}</Badge>
                          <span className="font-semibold">{jobsheet.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => router.push(`/jobsheets/${jobsheet.id}`)}
                            title="View Jobsheet Details"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditJobsheet(jobsheet)}
                            disabled={!canEditJobsheet(jobsheet)}
                            title={canEditJobsheet(jobsheet) ? 'Edit Jobsheet' : 'Cannot edit - tasks have started'}
                          >
                            <Edit className={`h-4 w-4 ${!canEditJobsheet(jobsheet) ? 'text-muted-foreground' : ''}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteJobsheet(jobsheet.id, jobsheet.jsNumber)}
                            disabled={!canEditJobsheet(jobsheet)}
                            title={canEditJobsheet(jobsheet) ? 'Delete Jobsheet' : 'Cannot delete - tasks have started'}
                          >
                            <Trash2 className={`h-4 w-4 ${!canEditJobsheet(jobsheet) ? 'text-muted-foreground' : ''}`} />
                          </Button>
                          <div className={`w-2 h-2 rounded-full ${getTaskStatusColor(jobsheet.status)}`} />
                          <Badge variant="outline">{jobsheet.status.replace(/_/g, ' ')}</Badge>
                        </div>
                      </div>

                      {jobsheet.description && (
                        <p className="text-sm text-muted-foreground mb-3">{jobsheet.description}</p>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div>
                          <div className="text-xs text-muted-foreground">Tasks</div>
                          <div className="font-medium text-sm">{jobsheet.machiningTasks.length}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Completed</div>
                          <div className="font-medium text-sm">{jobsheet.machiningTasks.filter(t => t.status === 'COMPLETED').length}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Running</div>
                          <div className="font-medium text-sm">{jobsheet.machiningTasks.filter(t => t.status === 'RUNNING').length}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Pending</div>
                          <div className="font-medium text-sm">{jobsheet.machiningTasks.filter(t => t.status === 'PENDING').length}</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-semibold">{jobsheet.progressPercent}%</span>
                        </div>
                        <Progress value={jobsheet.progressPercent} className="h-2" />
                      </div>

                      <div className="mt-3 pt-3 border-t">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            Start: {formatDateTime(jobsheet.plannedStartDate)}
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            End: {formatDateTime(jobsheet.plannedEndDate)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Jobsheet Dialog */}
        <Dialog open={isJobsheetDialogOpen} onOpenChange={setIsJobsheetDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingJobsheet ? 'Edit Jobsheet' : 'Add New Jobsheet'}
              </DialogTitle>
              <DialogDescription>
                {editingJobsheet ? 'Update jobsheet details' : 'Create a new jobsheet for this MO'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="jsNumber">Jobsheet Number *</Label>
                <Input
                  id="jsNumber"
                  value={jobsheetForm.jsNumber}
                  onChange={(e) => setJobsheetForm({ ...jobsheetForm, jsNumber: e.target.value })}
                  placeholder="e.g., JS-001"
                  disabled={!!editingJobsheet}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jsName">Jobsheet Name *</Label>
                <Input
                  id="jsName"
                  value={jobsheetForm.name}
                  onChange={(e) => setJobsheetForm({ ...jobsheetForm, name: e.target.value })}
                  placeholder="e.g., CNC Milling Operation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jsDescription">Description</Label>
                <Textarea
                  id="jsDescription"
                  value={jobsheetForm.description}
                  onChange={(e) => setJobsheetForm({ ...jobsheetForm, description: e.target.value })}
                  placeholder="Jobsheet description..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plannedStart">Planned Start Date</Label>
                  <Input
                    id="plannedStart"
                    type="date"
                    value={jobsheetForm.plannedStartDate}
                    onChange={(e) => setJobsheetForm({ ...jobsheetForm, plannedStartDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plannedEnd">Planned End Date</Label>
                  <Input
                    id="plannedEnd"
                    type="date"
                    value={jobsheetForm.plannedEndDate}
                    onChange={(e) => setJobsheetForm({ ...jobsheetForm, plannedEndDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsJobsheetDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveJobsheet} disabled={!jobsheetForm.jsNumber.trim() || !jobsheetForm.name.trim()}>
                {editingJobsheet ? 'Update Jobsheet' : 'Create Jobsheet'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
