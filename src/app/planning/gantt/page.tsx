'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Calendar, RefreshCw, Link2, GitBranch, AlertCircle, 
  CheckCircle, ArrowRight, Info
} from 'lucide-react'

// Disable static generation
export const dynamic = 'force-dynamic'

interface Task {
  id: string
  rawId: string
  name: string
  type: 'order' | 'mo' | 'jobsheet' | 'task'
  startDate: string
  endDate: string
  duration: number
  progress: number
  status: string
  parent?: string
  level: number
  isCritical?: boolean
  slackDays?: number
}

interface Dependency {
  id: string
  fromId: string
  toId: string
  type: 'FINISH_TO_START' | 'START_TO_START' | 'FINISH_TO_FINISH' | 'START_TO_FINISH'
  lagDays: number
}

interface ScheduleResult {
  taskId: string
  newStart: string
  newEnd: string
  oldStart: string
  oldEnd: string
  slackDays: number
  isCritical: boolean
}

export default function GanttChartPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [dependencies, setDependencies] = useState<Dependency[]>([])
  const [showDeps, setShowDeps] = useState(true)
  const [autoScheduled, setAutoScheduled] = useState<ScheduleResult[]>([])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [scheduling, setScheduling] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)
  const chartContainerRef = useRef<HTMLDivElement>(null)

  // Calculate visible tasks (respecting expanded state)
  const getVisibleTasks = useCallback(() => {
    const visible: Task[] = []
    const addedParents = new Set<string>()
    
    tasks.forEach(task => {
      if (task.level === 0) {
        visible.push(task)
        addedParents.add(task.id)
      } else if (task.parent && expandedIds.has(`order-${task.parent}`)) {
        visible.push(task)
      } else if (task.level === 1) {
        // MO level - check if order is expanded
        const orderExpanded = Array.from(expandedIds).some(id => id.startsWith('order-'))
        if (orderExpanded) visible.push(task)
      } else if (task.level === 2) {
        // Jobsheet level - check if MO is expanded
        visible.push(task)
      } else if (task.level === 3) {
        // Task level - check if jobsheet is expanded
        visible.push(task)
      }
    })
    
    return visible
  }, [tasks, expandedIds])

  const visibleTasks = getVisibleTasks()

  // Fetch Gantt data
  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/orders/gantt')
      if (res.ok) {
        const data = await res.json()
        
        // Transform tasks
        const transformedTasks: Task[] = (data.tasks || []).map((t: any) => ({
          id: t.id,
          rawId: t.taskId || t.jsId || t.moId || t.orderId,
          name: t.name,
          type: t.type,
          startDate: t.startDate || t.plannedStartDate,
          endDate: t.endDate || t.plannedEndDate,
          duration: Math.ceil((new Date(t.endDate || t.plannedEndDate).getTime() - new Date(t.startDate || t.plannedStartDate).getTime()) / (1000 * 60 * 60 * 24)),
          progress: t.progressPercent || 0,
          status: t.status,
          parent: t.moId || t.orderId,
          level: t.level || 0,
        }))
        
        setTasks(transformedTasks)
        
        // Transform dependencies - from Gantt API
        const transformedDeps: Dependency[] = (data.dependencies || []).map((d: any) => ({
          id: d.id,
          fromId: d.from,
          toId: d.to,
          type: d.type || 'FINISH_TO_START',
          lagDays: d.lagDays || 0,
        }))
        
        setDependencies(transformedDeps)
        
        // Expand all by default
        const allIds = new Set<string>()
        transformedTasks.forEach(t => allIds.add(t.id))
        setExpandedIds(allIds)
      }
    } catch (error) {
      console.error('Error fetching Gantt data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Auto-schedule tasks based on dependencies
  const autoSchedule = async () => {
    setScheduling(true)
    try {
      const res = await fetch('/api/execution-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respectExistingDates: true })
      })
      
      if (res.ok) {
        const data = await res.json()
        setAutoScheduled(data.updates || [])
        alert(`✅ Scheduled ${data.recalculated} tasks\n🎯 Critical path: ${data.criticalPath.length} tasks\n\nRefresh to see updated bars.`)
        await fetchData()
      } else {
        const error = await res.json()
        alert(`❌ Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error scheduling:', error)
      alert('❌ Failed to schedule')
    } finally {
      setScheduling(false)
    }
  }

  // Calculate timeline range
  const getTimelineRange = () => {
    if (tasks.length === 0) return { start: new Date(), end: new Date(), totalDays: 1 }
    
    let minDate = new Date('9999-12-31')
    let maxDate = new Date('0000-01-01')
    
    tasks.forEach(task => {
      const start = new Date(task.startDate)
      const end = new Date(task.endDate)
      if (start < minDate) minDate = start
      if (end > maxDate) maxDate = end
    })
    
    // Add padding
    const totalMs = maxDate.getTime() - minDate.getTime()
    const padding = totalMs * 0.2
    
    const start = new Date(minDate.getTime() - padding)
    const end = new Date(maxDate.getTime() + padding)
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    
    return { start, end, totalDays }
  }

  // Get task bar position
  const getTaskPosition = (task: Task, timelineStart: Date, totalDays: number) => {
    const start = new Date(task.startDate)
    const end = new Date(task.endDate)
    
    const startOffset = (start.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)
    const duration = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    
    const leftPercent = Math.max(0, (startOffset / totalDays) * 100)
    const widthPercent = Math.max(0.5, (duration / totalDays) * 100)
    
    return { leftPercent, widthPercent, duration }
  }

  // Fetch data on mount
  useEffect(() => {
    fetchData()
  }, [])

  // Draw dependency arrows after render
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!showDeps || dependencies.length === 0 || !chartContainerRef.current) return

    // Wait for DOM to be ready
    const drawArrows = () => {
      const svg = svgRef.current
      const container = chartContainerRef.current
      if (!svg || !container) return

      // Clear existing paths
      svg.innerHTML = `
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#9333ea" />
          </marker>
        </defs>
      `

      // Draw each dependency
      dependencies.forEach(dep => {
        const fromEl = document.querySelector(`[data-task-id="${dep.fromId}"]`)
        const toEl = document.querySelector(`[data-task-id="${dep.toId}"]`)

        if (!fromEl || !toEl) return

        const fromBar = fromEl.querySelector('[class*="rounded-md"]') as HTMLElement
        const toBar = toEl.querySelector('[class*="rounded-md"]') as HTMLElement

        if (!fromBar || !toBar) return

        // Get positions relative to chart container
        const containerRect = container.getBoundingClientRect()
        const fromRect = fromBar.getBoundingClientRect()
        const toRect = toBar.getBoundingClientRect()

        // Calculate start/end points based on dependency type
        let startX: number, startY: number, endX: number, endY: number

        switch (dep.type) {
          case 'START_TO_START':
            startX = fromRect.left - containerRect.left
            startY = fromRect.top + fromRect.height / 2 - containerRect.top
            endX = toRect.left - containerRect.left
            endY = toRect.top + toRect.height / 2 - containerRect.top
            break
          case 'FINISH_TO_FINISH':
            startX = fromRect.right - containerRect.left
            startY = fromRect.top + fromRect.height / 2 - containerRect.top
            endX = toRect.right - containerRect.left
            endY = toRect.top + toRect.height / 2 - containerRect.top
            break
          case 'START_TO_FINISH':
            startX = fromRect.left - containerRect.left
            startY = fromRect.top + fromRect.height / 2 - containerRect.top
            endX = toRect.right - containerRect.left
            endY = toRect.top + toRect.height / 2 - containerRect.top
            break
          case 'FINISH_TO_START':
          default:
            startX = fromRect.right - containerRect.left
            startY = fromRect.top + fromRect.height / 2 - containerRect.top
            endX = toRect.left - containerRect.left
            endY = toRect.top + toRect.height / 2 - containerRect.top
            break
        }

        // Create curved path
        const midX = (startX + endX) / 2
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        
        // Different curve based on direction
        let pathData: string
        if (endX > startX + 20) {
          // Normal forward dependency
          pathData = `M${startX},${startY} C${midX},${startY}, ${midX},${endY}, ${endX},${endY}`
        } else {
          // Backward or overlapping - create a loop
          const offset = 30
          pathData = `M${startX},${startY} C${startX + offset},${startY + offset}, ${endX - offset},${endY - offset}, ${endX},${endY}`
        }

        path.setAttribute('d', pathData)
        path.setAttribute('fill', 'none')
        path.setAttribute('stroke', '#9333ea')
        path.setAttribute('stroke-width', '2')
        path.setAttribute('marker-end', 'url(#arrowhead)')
        
        if (dep.type === 'START_TO_START' || dep.type === 'FINISH_TO_FINISH') {
          path.setAttribute('stroke-dasharray', '5,5')
        }

        svg.appendChild(path)
      })
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(drawArrows, 150)
    return () => clearTimeout(timer)
  }, [dependencies, showDeps, visibleTasks, autoScheduled])
  
  // Calculate timeline range (before loading check)
  const { start: timelineStart, totalDays } = getTimelineRange()
  
  const rowHeight = 40
  const headerHeight = 60
  const chartHeight = Math.max(400, visibleTasks.length * rowHeight + headerHeight + 50)

  // Generate week markers
  const weeks: { date: Date; label: string; position: number }[] = []
  for (let i = 0; i < totalDays; i += 7) {
    const date = new Date(timelineStart)
    date.setDate(date.getDate() + i)
    weeks.push({
      date,
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      position: (i / totalDays) * 100
    })
  }

  // Today marker
  const today = new Date()
  const todayOffset = (today.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)
  const todayPercent = Math.max(0, Math.min(100, (todayOffset / totalDays) * 100))

  if (loading) {
    return (
      <AppLayout title="Production Planning - Gantt Chart">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Production Planning - Gantt Chart">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Production Planning</h2>
            <p className="text-muted-foreground mt-1">
              Gantt chart with dependency-aware scheduling
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/planning')}>
              <Calendar className="h-4 w-4 mr-2" />
              Planning Overview
            </Button>
            <Button variant="outline" onClick={() => router.push('/planning/dependencies')}>
              <Link2 className="h-4 w-4 mr-2" />
              Dependencies ({dependencies.length})
            </Button>
          </div>
        </div>

        {/* Stats & Controls */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="font-medium">{tasks.length}</span> tasks
            </div>
            <div className="text-sm">
              <span className="font-medium">{dependencies.length}</span> dependencies
            </div>
            <Button
              variant={showDeps ? "default" : "outline"}
              size="sm"
              onClick={() => setShowDeps(!showDeps)}
            >
              <GitBranch className="h-4 w-4 mr-1" />
              {showDeps ? 'Hide' : 'Show'} Dependencies
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={autoSchedule}
              disabled={scheduling || dependencies.length === 0}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${scheduling ? 'animate-spin' : ''}`} />
              {scheduling ? 'Scheduling...' : 'Auto-Schedule Tasks'}
            </Button>
          </div>
          
          {autoScheduled.length > 0 && (
            <Badge variant="outline" className="text-green-600 border-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Last schedule: {autoScheduled.length} tasks updated
            </Badge>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-sm flex-wrap">
          <div className="flex items-center gap-1">
            <div className="w-4 h-3 bg-blue-500 rounded-sm"></div>
            <span>Order</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-3 bg-purple-500 rounded-sm"></div>
            <span>MO</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-3 bg-green-500 rounded-sm"></div>
            <span>Jobsheet</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-3 bg-orange-500 rounded-sm"></div>
            <span>Task</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-1">
            <div className="w-4 h-3 bg-red-500 rounded-sm"></div>
            <span>Delayed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-3 bg-green-600 rounded-sm"></div>
            <span>Completed</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-1">
            <Link2 className="w-4 h-4 text-purple-600" />
            <span>Dependency</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-0.5 h-4 bg-red-500"></div>
            <span>Today</span>
          </div>
        </div>

        {/* Gantt Chart */}
        <Card>
          <CardContent className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[1200px]" ref={chartContainerRef as any}>
                {/* Timeline Header */}
                <div className="flex border-b bg-muted/50" style={{ height: headerHeight }}>
                  <div className="w-[350px] shrink-0 p-3 border-r font-medium text-sm">
                    Task Name
                  </div>
                  <div className="flex-1 relative">
                    {weeks.map((week, i) => (
                      <div
                        key={i}
                        className="absolute text-xs text-muted-foreground top-3"
                        style={{ left: `${week.position}%` }}
                      >
                        {week.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Task Rows */}
                <div className="relative" style={{ height: chartHeight - headerHeight }}>
                  {/* Background grid */}
                  <div className="absolute inset-0 flex">
                    <div className="w-[350px] shrink-0" />
                    <div className="flex-1 flex">
                      {weeks.map((_, i) => (
                        <div key={i} className="flex-1 border-r border-muted" />
                      ))}
                    </div>
                  </div>

                  {/* Today line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
                    style={{ left: `calc(350px + (100% - 350px) * ${todayPercent} / 100)` }}
                  >
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full" />
                    <div className="absolute top-0 left-2 text-xs text-red-500 whitespace-nowrap">Today</div>
                  </div>

                  {/* Dependency arrows */}
                  {showDeps && dependencies.length > 0 && svgRef.current && (
                    <svg
                      ref={svgRef}
                      className="absolute top-0 left-[350px] pointer-events-none z-10"
                      style={{ width: 'calc(100% - 350px)', height: chartHeight - headerHeight }}
                    >
                      <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                          <polygon points="0 0, 10 3.5, 0 7" fill="#9333ea" />
                        </marker>
                      </defs>
                    </svg>
                  )}

                  {/* Task rows and bars */}
                  {visibleTasks.map((task, index) => {
                    const { leftPercent, widthPercent, duration } = getTaskPosition(task, timelineStart, totalDays)
                    const top = index * rowHeight
                    const isExpanded = expandedIds.has(task.id)
                    const hasChildren = tasks.some(t => 
                      (task.type === 'order' && t.type === 'mo' && t.parent === task.rawId) ||
                      (task.type === 'mo' && t.type === 'jobsheet' && t.parent === task.rawId) ||
                      (task.type === 'jobsheet' && t.type === 'task' && t.parent === task.rawId)
                    )

                    const isCompleted = task.progress >= 100
                    const endDate = new Date(task.endDate)
                    const isDelayed = endDate < new Date() && !isCompleted
                    const isCritical = task.isCritical || autoScheduled.some(s => s.isCritical && s.taskId === task.rawId)
                    const depCount = dependencies.filter(d => d.toId === task.id).length

                    return (
                      <div key={task.id} className="absolute left-0 right-0 flex" style={{ top, height: rowHeight }}>
                        {/* Task name */}
                        <div 
                          className="w-[350px] shrink-0 p-2 border-r border-b flex items-center gap-1 cursor-pointer hover:bg-muted/50"
                          style={{ paddingLeft: `${task.level * 16 + 8}px` }}
                          onClick={() => {
                            const newExpanded = new Set(expandedIds)
                            if (isExpanded) newExpanded.delete(task.id)
                            else newExpanded.add(task.id)
                            setExpandedIds(newExpanded)
                          }}
                        >
                          {hasChildren && (
                            <span className="w-4 h-4 flex items-center justify-center text-muted-foreground">
                              {isExpanded ? '▼' : '▶'}
                            </span>
                          )}
                          {!hasChildren && <span className="w-4" />}
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              task.type === 'order' ? 'border-blue-500 text-blue-700' :
                              task.type === 'mo' ? 'border-purple-500 text-purple-700' :
                              task.type === 'jobsheet' ? 'border-green-500 text-green-700' :
                              'border-orange-500 text-orange-700'
                            }`}
                          >
                            {task.type === 'order' ? 'O' : task.type === 'mo' ? 'MO' : task.type === 'jobsheet' ? 'JS' : 'T'}
                          </Badge>
                          <span className="truncate text-sm">{task.name}</span>
                          {depCount > 0 && (
                            <Link2 className="h-3 w-3 text-purple-600 shrink-0" title={`${depCount} predecessor(s)`} />
                          )}
                          <span className="text-xs text-muted-foreground ml-auto">{task.progress}%</span>
                        </div>

                        {/* Task bar */}
                        <div 
                          className="flex-1 relative border-b"
                          data-task-id={task.id}
                          data-task-index={index}
                        >
                          <div
                            className={`absolute top-2 h-6 rounded-md shadow-sm transition-all cursor-pointer flex items-center ${
                              isCompleted ? 'bg-green-600' :
                              isDelayed ? 'bg-red-500' :
                              isCritical ? 'bg-amber-500 ring-2 ring-amber-300' :
                              task.type === 'order' ? 'bg-blue-500' :
                              task.type === 'mo' ? 'bg-purple-500' :
                              task.type === 'jobsheet' ? 'bg-green-500' :
                              'bg-orange-500'
                            }`}
                            style={{
                              left: `${leftPercent}%`,
                              width: `${widthPercent}%`,
                              minWidth: '20px',
                            }}
                            title={`${task.name}\n${task.startDate} → ${task.endDate}\n${duration} days\nProgress: ${task.progress}%`}
                          >
                            <div
                              className="h-full bg-white/25 rounded-l-md"
                              style={{ width: `${task.progress}%` }}
                            />
                            {widthPercent > 10 && (
                              <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium px-1 truncate">
                                {duration}d
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info about auto-scheduling */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-5 w-5" />
              How Auto-Scheduling Works
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Auto-Schedule Tasks</strong> uses Critical Path Method (CPM) to calculate optimal task dates based on dependencies:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>FS (Finish-to-Start)</strong>: Successor starts after predecessor finishes</li>
              <li><strong>SS (Start-to-Start)</strong>: Successor starts when predecessor starts</li>
              <li><strong>FF (Finish-to-Finish)</strong>: Successor finishes when predecessor finishes</li>
              <li><strong>Lag (+10d)</strong>: Adds delay between predecessor and successor</li>
            </ul>
            <p className="mt-2">
              Tasks on the <span className="text-amber-600 font-medium">critical path</span> (zero slack) are highlighted in amber.
              These tasks directly affect the project end date.
            </p>
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="font-medium">Current Dependencies:</p>
              {dependencies.length === 0 ? (
                <p className="text-muted-foreground">No dependencies defined. <a href="/planning/dependencies" className="text-primary underline">Add dependencies</a> to enable auto-scheduling.</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {dependencies.slice(0, 5).map(dep => (
                    <li key={dep.id} className="flex items-center gap-2">
                      <span className="font-mono text-xs">{dep.fromId}</span>
                      <ArrowRight className="h-3 w-3" />
                      <span className="font-mono text-xs">{dep.toId}</span>
                      <Badge variant="outline" className="text-xs">{dep.type.replace(/_/g, '-')}</Badge>
                      {dep.lagDays !== 0 && (
                        <span className="text-xs">({dep.lagDays > 0 ? '+' : ''}{dep.lagDays}d)</span>
                      )}
                    </li>
                  ))}
                  {dependencies.length > 5 && (
                    <li className="text-muted-foreground">... and {dependencies.length - 5} more</li>
                  )}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
