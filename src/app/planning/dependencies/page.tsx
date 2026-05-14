'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Link2,
  Plus,
  Trash2,
  Calendar,
  ArrowRight,
  GitBranch,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Dependency {
  id: string
  predecessorTaskId: string | null
  predecessorJobsheetId: string | null
  predecessorMoId: string | null
  successorTaskId: string | null
  successorJobsheetId: string | null
  successorMoId: string | null
  dependencyType: string
  lagDays: number
  isActive: boolean
  notes: string | null
  predecessorTask?: { id: string; taskNumber: string; name: string } | null
  successorTask?: { id: string; taskNumber: string; name: string } | null
  predecessorJobsheet?: { id: string; jsNumber: string; name: string } | null
  successorJobsheet?: { id: string; jsNumber: string; name: string } | null
  predecessorMO?: { id: string; moNumber: string; name: string } | null
  successorMO?: { id: string; moNumber: string; name: string } | null
}

interface TaskOption {
  id: string
  label: string
  type: 'task' | 'jobsheet' | 'mo'
}

export default function DependenciesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [dependencies, setDependencies] = useState<Dependency[]>([])
  const [tasks, setTasks] = useState<TaskOption[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Form state
  const [predecessorType, setPredecessorType] = useState<string>('task')
  const [predecessorId, setPredecessorId] = useState<string>('')
  const [successorType, setSuccessorType] = useState<string>('task')
  const [successorId, setSuccessorId] = useState<string>('')
  const [dependencyType, setDependencyType] = useState<string>('FINISH_TO_START')
  const [lagDays, setLagDays] = useState<number>(0)
  const [notes, setNotes] = useState<string>('')

  const fetchDependencies = async () => {
    try {
      const response = await fetch('/api/dependencies')
      if (response.ok) {
        const data = await response.json()
        setDependencies(data.dependencies || [])
      }
    } catch (error) {
      console.error('Error fetching dependencies:', error)
    }
  }

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/orders/gantt')
      if (response.ok) {
        const data = await response.json()
        const apiTasks = data.tasks || []
        
        // Extract raw IDs from prefixed IDs (e.g., "task-abc123" -> "abc123")
        const taskOptions: TaskOption[] = apiTasks
          .filter((t: any) => t.type === 'task' || t.type === 'jobsheet' || t.type === 'mo')
          .map((t: any) => {
            // Extract raw ID by removing prefix
            const rawId = t.id.replace(/^(task|js|mo)-/, '')
            const dbId = t.type === 'task' ? t.taskId : t.type === 'jobsheet' ? t.jsId : t.moId
            return {
              id: dbId || rawId,  // Prefer database ID if available
              label: t.type === 'task' ? t.taskNumber : t.type === 'jobsheet' ? t.jsNumber : t.moNumber,
              type: t.type
            }
          })
        
        setTasks(taskOptions)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  const createDependency = async () => {
    if (!predecessorId || !successorId) {
      alert('Please select both predecessor and successor')
      return
    }

    try {
      const body: any = {
        dependencyType,
        lagDays,
        notes: notes || undefined,
      }

      // Set predecessor based on type
      if (predecessorType === 'task') body.predecessorTaskId = predecessorId
      else if (predecessorType === 'jobsheet') body.predecessorJobsheetId = predecessorId
      else if (predecessorType === 'mo') body.predecessorMoId = predecessorId

      // Set successor based on type
      if (successorType === 'task') body.successorTaskId = successorId
      else if (successorType === 'jobsheet') body.successorJobsheetId = successorId
      else if (successorType === 'mo') body.successorMoId = successorId

      const response = await fetch('/api/dependencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        await fetchDependencies()
        setDialogOpen(false)
        resetForm()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error creating dependency:', error)
      alert('Failed to create dependency')
    }
  }

  const deleteDependency = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this dependency?')) return

    setDeleting(id)
    try {
      // Hard delete to permanently remove
      const response = await fetch(`/api/dependencies?id=${id}&hard=true`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchDependencies()
        alert('Dependency permanently deleted. You can now create a new one with the same tasks.')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting dependency:', error)
      alert('Failed to delete dependency')
    } finally {
      setDeleting(null)
    }
  }

  const resetForm = () => {
    setPredecessorType('task')
    setPredecessorId('')
    setSuccessorType('task')
    setSuccessorId('')
    setDependencyType('FINISH_TO_START')
    setLagDays(0)
    setNotes('')
  }

  const getDependencyLabel = (dep: Dependency) => {
    let from = ''
    let to = ''

    if (dep.predecessorTask) from = `${dep.predecessorTask.taskNumber} - ${dep.predecessorTask.name}`
    else if (dep.predecessorJobsheet) from = `${dep.predecessorJobsheet.jsNumber} - ${dep.predecessorJobsheet.name}`
    else if (dep.predecessorMO) from = `${dep.predecessorMO.moNumber} - ${dep.predecessorMO.name}`

    if (dep.successorTask) to = `${dep.successorTask.taskNumber} - ${dep.successorTask.name}`
    else if (dep.successorJobsheet) to = `${dep.successorJobsheet.jsNumber} - ${dep.successorJobsheet.name}`
    else if (dep.successorMO) to = `${dep.successorMO.moNumber} - ${dep.successorMO.name}`

    return { from, to }
  }

  const getDependencyTypeLabel = (type: string) => {
    switch (type) {
      case 'FINISH_TO_START': return 'FS'
      case 'START_TO_START': return 'SS'
      case 'FINISH_TO_FINISH': return 'FF'
      case 'START_TO_FINISH': return 'SF'
      default: return type
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
            await fetchDependencies()
            await fetchTasks()
          } else {
            router.replace('/login')
          }
        } else {
          router.replace('/login')
        }
      } catch (error) {
        console.error('Auth check error:', error)
        router.replace('/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <AppLayout title="Dependencies Management">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        </div>
      </AppLayout>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <AppLayout title="Dependencies Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dependencies</h2>
            <p className="text-muted-foreground mt-1">
              Manage predecessor and successor relationships between tasks
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/planning/gantt')}>
              <Calendar className="h-4 w-4 mr-2" />
              Back to Gantt
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Dependency
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create Dependency</DialogTitle>
                  <DialogDescription>
                    Define a predecessor-successor relationship between activities
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {/* Predecessor */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Predecessor Type</Label>
                      <Select value={predecessorType} onValueChange={setPredecessorType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="task">Task</SelectItem>
                          <SelectItem value="jobsheet">Jobsheet</SelectItem>
                          <SelectItem value="mo">Manufacturing Order</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Predecessor</Label>
                      <Select value={predecessorId} onValueChange={setPredecessorId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {tasks
                            .filter(t => t.type === predecessorType)
                            .map(t => (
                              <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <ArrowRight className="h-6 w-6 text-muted-foreground" />
                  </div>

                  {/* Successor */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Successor Type</Label>
                      <Select value={successorType} onValueChange={setSuccessorType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="task">Task</SelectItem>
                          <SelectItem value="jobsheet">Jobsheet</SelectItem>
                          <SelectItem value="mo">Manufacturing Order</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Successor</Label>
                      <Select value={successorId} onValueChange={setSuccessorId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {tasks
                            .filter(t => t.type === successorType)
                            .map(t => (
                              <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Dependency Type & Lag */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Dependency Type</Label>
                      <Select value={dependencyType} onValueChange={setDependencyType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FINISH_TO_START">Finish-to-Start (FS)</SelectItem>
                          <SelectItem value="START_TO_START">Start-to-Start (SS)</SelectItem>
                          <SelectItem value="FINISH_TO_FINISH">Finish-to-Finish (FF)</SelectItem>
                          <SelectItem value="START_TO_FINISH">Start-to-Finish (SF)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Lag (days)</Label>
                      <Input
                        type="number"
                        value={lagDays}
                        onChange={(e) => setLagDays(parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional notes..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button onClick={createDependency}>Create Dependency</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Dependencies</CardTitle>
              <Link2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dependencies.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Finish-to-Start</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dependencies.filter(d => d.dependencyType === 'FINISH_TO_START').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">With Lag</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dependencies.filter(d => d.lagDays !== 0).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Other Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dependencies.filter(d => d.dependencyType !== 'FINISH_TO_START').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dependencies Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Dependencies</CardTitle>
            <CardDescription>
              Predecessor and successor relationships between tasks, jobsheets, and manufacturing orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dependencies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No dependencies yet</h3>
                <p className="text-muted-foreground mt-1">
                  Create dependencies to define task relationships and enable critical path analysis
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Predecessor</TableHead>
                    <TableHead className="w-[100px]">Type</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Successor</TableHead>
                    <TableHead className="w-[80px]">Lag</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dependencies.map((dep) => {
                    const { from, to } = getDependencyLabel(dep)
                    return (
                      <TableRow key={dep.id}>
                        <TableCell className="font-medium">{from}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{getDependencyTypeLabel(dep.dependencyType)}</Badge>
                        </TableCell>
                        <TableCell>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                        <TableCell className="font-medium">{to}</TableCell>
                        <TableCell>
                          {dep.lagDays !== 0 && (
                            <span className={dep.lagDays > 0 ? 'text-orange-600' : 'text-green-600'}>
                              {dep.lagDays > 0 ? '+' : ''}{dep.lagDays}d
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteDependency(dep.id)}
                            disabled={deleting === dep.id}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
