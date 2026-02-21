'use client'

import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Wrench, AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Task {
  id: string
  taskNumber: string
  name: string
  status: string
  progressPercent: number
  machine?: { name: string } | null
  assignedUser?: { name: string } | null
  clockedInAt?: string | null
}

export default function ProductionPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [runningTasks, setRunningTasks] = useState<Task[]>([])
  const [stats, setStats] = useState({
    running: 0,
    completedToday: 0,
    activeMachines: 0,
    breakdowns: 0,
  })

  const fetchProductionData = async () => {
    try {
      const [kanbanRes, machinesRes, breakdownsRes] = await Promise.all([
        fetch('/api/kanban'),
        fetch('/api/machines'),
        fetch('/api/breakdowns'),
      ])

      const kanbanData = await kanbanRes.json()
      const machinesData = await machinesRes.json()
      const breakdownsData = await breakdownsRes.json()

      const tasks = kanbanData.tasks || []
      const running = tasks.filter((t: Task) => t.status === 'RUNNING')
      const completedToday = tasks.filter((t: Task) => t.status === 'COMPLETED')
      
      setRunningTasks(running)
      setStats({
        running: running.length,
        completedToday: completedToday.length,
        activeMachines: machinesData.machines?.filter((m: any) => m.status === 'RUNNING').length || 0,
        breakdowns: breakdownsData.breakdowns?.filter((b: any) => !b.resolved).length || 0,
      })
    } catch (error) {
      console.error('Error fetching production data:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load production data',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProductionData()
  }, [])

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Production</h1>
            <p className="text-muted-foreground mt-1">Production execution and monitoring</p>
          </div>
          <Button variant="outline" onClick={fetchProductionData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Running Tasks</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.running}</div>
              <p className="text-xs text-muted-foreground mt-1">Currently in progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedToday}</div>
              <p className="text-xs text-muted-foreground mt-1">Tasks finished today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Machines</CardTitle>
              <Wrench className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeMachines}</div>
              <p className="text-xs text-muted-foreground mt-1">Machines in operation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Breakdowns</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.breakdowns}</div>
              <p className="text-xs text-muted-foreground mt-1">Requiring attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Running Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Active Production Tasks</CardTitle>
            <CardDescription>Real-time production floor status</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : runningTasks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Wrench className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No active tasks</p>
                <p className="text-sm mt-2">Tasks will appear here when assigned and started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {runningTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{task.taskNumber}</Badge>
                        <span className="font-medium">{task.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {task.machine && (
                          <span className="flex items-center gap-1">
                            <Wrench className="h-3 w-3" />
                            {task.machine.name}
                          </span>
                        )}
                        {task.assignedUser && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {task.assignedUser.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{task.progressPercent}%</div>
                      <div className="text-xs text-muted-foreground">Progress</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
