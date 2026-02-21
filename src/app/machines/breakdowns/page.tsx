'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  Plus,
  RefreshCw,
} from 'lucide-react'

interface Breakdown {
  id: string
  machineId: string
  machine: {
    code: string
    name: string
    type?: string
    location?: string
  }
  reportedBy: {
    name?: string
    email?: string
  }
  reportedAt: string
  type: string
  description: string
  notes?: string
  resolved: boolean
  resolvedAt?: string
  resolvedBy?: {
    name?: string
    email?: string
  }
  resolution?: string
  affectedTask?: {
    id: string
    taskNumber: string
    name: string
  }
}

interface Machine {
  id: string
  code: string
  name: string
  type?: string
  location?: string
  status: string
}

export default function MachineBreakdownsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [breakdowns, setBreakdowns] = useState<Breakdown[]>([])
  const [machines, setMachines] = useState<Machine[]>([])
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [selectedMachine, setSelectedMachine] = useState<string>('')
  const [reporting, setReporting] = useState(false)

  // Form state
  const [breakdownType, setBreakdownType] = useState('MECHANICAL')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')

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
        console.error('Auth check error:', error)
        router.replace('/login')
      }
    }

    checkAuth()
  }, [router])

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', color: string }> = {
      PENDING: { variant: 'outline', color: 'bg-gray-100 text-gray-800' },
      RUNNING: { variant: 'default', color: 'bg-orange-500 text-white' },
      PAUSED: { variant: 'outline', color: 'bg-yellow-100 text-yellow-800' },
      COMPLETED: { variant: 'default', color: 'bg-green-600 text-white' },
      CANCELLED: { variant: 'destructive', color: 'bg-red-100 text-red-800' },
      ON_HOLD: { variant: 'outline', color: 'bg-orange-100 text-orange-800' },
    }

    const config = statusConfig[status] || { variant: 'secondary', color: 'bg-gray-100 text-gray-800' }

    return <Badge className={config.color}>{status.replace(/_/g, ' ')}</Badge>
  }

  const getMachine = (machineId: string) => {
    return machines.find((m) => m.id === machineId)
  }

  const getTypeBadge = (type: string) => {
    const typeConfig: Record<string, { color: string, label: string }> = {
      MECHANICAL: { color: 'bg-red-100 text-red-800', label: 'Mechanical' },
      ELECTRICAL: { color: 'bg-yellow-100 text-yellow-800', label: 'Electrical' },
      MAINTENANCE: { color: 'bg-blue-100 text-blue-800', label: 'Maintenance' },
      OTHER: { color: 'bg-gray-100 text-gray-800', label: 'Other' },
    }

    const config = typeConfig[type] || { color: 'bg-gray-100 text-gray-800', label: type }

    return <Badge variant="outline" className={config.color}>{config.label}</Badge>
  }

  const handleReportBreakdown = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMachine || !description.trim()) {
      return
    }

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
        }),
      })

      if (response.ok) {
        await fetchData()
        setReportDialogOpen(false)
        setDescription('')
        setNotes('')
        setSelectedMachine('')
        setBreakdownType('MECHANICAL')
      }
    } catch (error) {
      console.error('Error reporting breakdown:', error)
    } finally {
      setReporting(false)
    }
  }

  const handleResolveBreakdown = async (breakdownId: string) => {
    try {
      const response = await fetch(`/api/breakdowns/${breakdownId}/resolve`, {
        method: 'POST',
      })

      if (response.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Error resolving breakdown:', error)
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

  if (!isAuthenticated) {
    return null
  }

  const activeBreakdowns = breakdowns.filter((b) => !b.resolved)
  const resolvedBreakdowns = breakdowns.filter((b) => b.resolved)

  return (
    <AppLayout title="Machine Breakdowns">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Machine Breakdowns
            </h2>
            <p className="text-muted-foreground mt-1">
              Track and manage machine issues
            </p>
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
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Breakdowns</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeBreakdowns.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Requiring resolution
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {resolvedBreakdowns.filter((b) => {
                  const today = new Date().toDateString()
                  return b.resolvedAt && new Date(b.resolvedAt).toDateString() === today
                }).length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Breakdowns fixed today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Machines</CardTitle>
              <Wrench className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{machines.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                In the system
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Report Breakdown Button */}
        <Card>
          <CardHeader>
            <CardTitle>Report New Breakdown</CardTitle>
            <CardDescription>
              Report a machine issue quickly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" variant="outline">
                  <Plus className="h-5 w-5 mr-2" />
                  Report Breakdown
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Report Machine Breakdown</DialogTitle>
                  <DialogDescription>
                    Provide details about the machine issue
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleReportBreakdown} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="machine">Machine</Label>
                    <Select value={selectedMachine} onValueChange={setSelectedMachine}>
                      <SelectTrigger id="machine">
                        <SelectValue placeholder="Select a machine" />
                      </SelectTrigger>
                      <SelectContent>
                        {machines.map((machine) => (
                          <SelectItem key={machine.id} value={machine.id}>
                            {machine.code} - {machine.name}
                            {machine.location && `(${machine.location})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Breakdown Type</Label>
                    <Select value={breakdownType} onValueChange={setBreakdownType}>
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
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
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setReportDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={reporting || !selectedMachine || !description.trim()}
                    >
                      {reporting ? 'Reporting...' : 'Report Breakdown'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Breakdowns List */}
        <Card>
          <CardHeader>
            <CardTitle>Breakdown History</CardTitle>
            <CardDescription>
              Recent and resolved breakdowns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {breakdowns.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No breakdowns recorded
                </div>
              ) : (
                breakdowns.map((breakdown) => {
                  const machine = getMachine(breakdown.machineId)
                  
                  return (
                    <div key={breakdown.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className={`h-5 w-5 ${breakdown.resolved ? 'text-green-500' : 'text-red-500'}`} />
                            <div>
                              <p className="font-medium">{machine?.code} - {machine?.name}</p>
                              {machine.type && (
                                <p className="text-sm text-muted-foreground">
                                  {machine.type} · {machine.location}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getTypeBadge(breakdown.type)}
                            <Badge variant={breakdown.resolved ? 'outline' : 'default'} className={breakdown.resolved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {breakdown.resolved ? 'Resolved' : 'Active'}
                            </Badge>
                          </div>
                        </div>

                        <h4 className="font-medium mb-1">{breakdown.description}</h4>
                        {breakdown.notes && (
                          <p className="text-sm text-muted-foreground mb-2">
                            <strong>Notes:</strong> {breakdown.notes}
                          </p>
                        )}

                        <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Reported by</p>
                            <p className="text-sm font-medium">
                              {breakdown.reportedBy?.name || 'Unknown'}
                            </p>
                            {breakdown.reportedBy?.email && (
                              <p className="text-xs text-muted-foreground">
                                {breakdown.reportedBy.email}
                              </p>
                            )}
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Reported at</p>
                            <p className="text-sm font-medium">
                              {new Date(breakdown.reportedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t">
                          <div className="flex items-center justify-between mb-1">
                            <div>
                              <p className="text-xs text-muted-foreground">Duration</p>
                              <p className="text-sm font-medium">
                                {getDuration(breakdown.reportedAt, breakdown.resolvedAt)}
                              </p>
                            </div>
                          </div>

                          {breakdown.affectedTask && (
                            <div className="flex items-center gap-2">
                              <Wrench className="h-4 w-4 text-orange-500" />
                              <div className="flex-1">
                                <p className="text-xs text-muted-foreground">Affected Task</p>
                                <p className="text-sm font-medium">
                                  {breakdown.affectedTask.taskNumber}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {!breakdown.resolved && (
                          <div className="pt-3 border-t">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-xs text-muted-foreground">Status</p>
                                <p className="text-sm font-medium text-red-600">
                                  Machine Down
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResolveBreakdown(breakdown.id)}
                              >
                                Mark Resolved
                              </Button>
                            </div>
                          </div>
                        )}

                        {breakdown.resolved && (
                          <div className="pt-3 border-t">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs text-muted-foreground">Resolved at</p>
                                  <p className="text-sm font-medium">
                                    {new Date(breakdown.resolvedAt!).toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Resolved by</p>
                                  <p className="text-sm font-medium">
                                    {breakdown.resolvedBy?.name || 'Unknown'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            {breakdown.resolution && (
                              <p className="text-sm text-muted-foreground mt-2">
                                <strong>Resolution:</strong> {breakdown.resolution}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
