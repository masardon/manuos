'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Calendar,
  Download,
  Filter,
  Wrench,
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'

interface GanttTask {
  id: string
  name: string
  orderNumber: string
  customerName: string
  startDate: Date
  endDate: Date
  progressPercent: number
  status: string
  type: 'order' | 'mo' | 'jobsheet' | 'task'
  level: number
  color: string
}

interface GanttChartTask {
  id: string | number
  text: string
  start: Date
  end: Date
  duration: number
  progress: number
  type: 'task' | 'summary'
  parent?: number | string
  open?: boolean
}

interface DateRange {
  start: Date
  end: Date
}

export default function GanttChartPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [tasks, setTasks] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<'week' | 'month'>('month')
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

  const fetchGanttData = async () => {
    try {
      const response = await fetch('/api/orders/gantt')
      if (response.ok) {
        const data = await response.json()
        const apiTasks = data.tasks || []
        setTasks(apiTasks)
        
        // Initialize ALL groups as expanded by default
        const initialExpanded: Record<string, boolean> = {}
        apiTasks.forEach((task: any) => {
          // Mark all parent levels as expanded
          if (task.orderId) {
            initialExpanded[`order-${task.orderId}`] = true
          }
          if (task.moId) {
            initialExpanded[`mo-${task.moId}`] = true
          }
          if (task.jsId) {
            initialExpanded[`js-${task.jsId}`] = true
          }
        })
        setExpandedGroups(initialExpanded)
      }
    } catch (error) {
      console.error('Error fetching Gantt data:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newValue = !prev[groupId]
      // Create a new object to trigger re-render
      const updated = { ...prev, [groupId]: newValue }
      console.log('Toggling', groupId, 'to', newValue, 'Total expanded:', Object.keys(updated).filter(k => updated[k]).length)
      return updated
    })
  }

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {}
    tasks.forEach((task: any) => {
      // Use item.id directly as the key (already prefixed)
      allExpanded[task.id] = true
    })
    setExpandedGroups(allExpanded)
  }

  const collapseAll = () => {
    setExpandedGroups({})
  }

  // Group tasks by hierarchy - ALWAYS SHOW ALL LEVELS
  const getHierarchicalTasks = () => {
    const orders = tasks.filter((t: any) => t.type === 'order')
    const result: any[] = []

    orders.forEach((order: any) => {
      // Use the actual item.id which is already prefixed (e.g., "order-cmlutic...")
      const orderKey = order.id // Already "order-xxx"
      const isOrderExpanded = expandedGroups[orderKey] !== false
      
      // Add order
      result.push({ ...order, level: 0, hasChildren: true, key: orderKey })
      
      if (isOrderExpanded) {
        // Add MOs for this order - filter by orderId
        const mos = tasks.filter((t: any) => t.type === 'mo' && t.orderId === order.orderId)
        
        mos.forEach((mo: any) => {
          const moKey = mo.id // Already "mo-xxx"
          const isMoExpanded = expandedGroups[moKey] !== false
          
          result.push({ ...mo, level: 1, hasChildren: true, key: moKey })
          
          if (isMoExpanded) {
            // Add Jobsheets for this MO - filter by moId
            const jss = tasks.filter((t: any) => t.type === 'jobsheet' && t.moId === mo.moId)
            
            jss.forEach((js: any) => {
              const jsKey = js.id // Already "js-xxx"
              const isJsExpanded = expandedGroups[jsKey] !== false
              
              result.push({ ...js, level: 2, hasChildren: true, key: jsKey })
              
              if (isJsExpanded) {
                // Add Tasks for this Jobsheet - filter by jsId
                const taskItems = tasks.filter((t: any) => t.type === 'task' && t.jsId === js.jsId)
                
                taskItems.forEach((task: any) => {
                  result.push({ ...task, level: 3, hasChildren: false, key: task.id })
                })
              }
            })
          }
        })
      }
    })

    return result
  }

  // Calculate timeline range based on actual data
  const getTimelineRange = () => {
    if (tasks.length === 0) {
      const start = new Date()
      start.setDate(start.getDate() - 30)
      const end = new Date()
      end.setDate(end.getDate() + 60)
      return { start, end }
    }

    let minDate = new Date('9999-12-31')
    let maxDate = new Date('0000-01-01')

    tasks.forEach((task: any) => {
      const start = new Date(task.plannedStartDate || task.clockedInAt || Date.now())
      const end = new Date(task.plannedEndDate || task.clockedOutAt || Date.now())
      if (start < minDate) minDate = start
      if (end > maxDate) maxDate = end
    })

    // Add padding: 10% before start, 20% after end
    const totalRange = maxDate.getTime() - minDate.getTime()
    const padding = totalRange * 0.15
    
    const timelineStart = new Date(minDate.getTime() - padding)
    const timelineEnd = new Date(maxDate.getTime() + padding * 2)

    return { start: timelineStart, end: timelineEnd }
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            setIsAuthenticated(true)
            await fetchGanttData()
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

  if (loading) {
    return (
      <AppLayout title="Production Planning - Gantt Chart">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading Gantt chart...</p>
        </div>
      </AppLayout>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <AppLayout title="Production Planning - Gantt Chart">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Production Planning
            </h2>
            <p className="text-muted-foreground mt-1">
              Gantt chart timeline view
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/planning')}>
              <Calendar className="h-4 w-4 mr-2" />
              Planning Overview
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">View Mode:</span>
            <Select value={viewMode} onValueChange={setViewMode}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week View</SelectItem>
                <SelectItem value="month">Month View</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={expandAll} className="ml-2">
              Expand All
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAll}>
              Collapse All
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            Total: <span className="font-medium">{tasks.length}</span> items
          </div>
        </div>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.filter((t) => t.type === 'order').length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manufacturing Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.filter((t) => t.type === 'mo').length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jobsheets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.filter((t) => t.type === 'jobsheet').length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.filter((t) => t.type === 'task').length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Gantt Chart */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Gantt Chart</CardTitle>
              <CardDescription>
                Timeline of orders, manufacturing orders, and tasks
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Visual Gantt Chart with Timeline Bars */}
              {loading ? (
                <div className="flex items-center justify-center h-[400px]">
                  <p className="text-muted-foreground">Loading Gantt chart...</p>
                </div>
              ) : !tasks || tasks.length === 0 ? (
                <div className="flex items-center justify-center h-[400px]">
                  <p className="text-muted-foreground">No tasks to display</p>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted p-4 border-b">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Production Timeline</h3>
                        <p className="text-sm text-muted-foreground">
                          Visual timeline showing {tasks.length} tasks across all orders
                        </p>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-blue-500 rounded"></div>
                          <span>Order</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-purple-500 rounded"></div>
                          <span>MO</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-green-500 rounded"></div>
                          <span>Jobsheet</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 bg-orange-500 rounded"></div>
                          <span>Task</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Gantt Chart Body */}
                  <div className="overflow-x-auto">
                    <div className="min-w-[1200px] p-4">
                      {/* Timeline Header */}
                      <div className="flex mb-2">
                        <div className="w-96 shrink-0"></div>
                        <div className="flex-1 relative">
                          <div className="flex justify-between text-xs text-muted-foreground pb-2 border-b">
                            {['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'].map((week, i) => (
                              <div key={i} className="flex-1 text-center">{week}</div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Calculate timeline dates */}
                      {(() => {
                        const { start: timelineStart, end: timelineEnd } = getTimelineRange()
                        const today = new Date()
                        const totalDays = Math.max(1, (timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24))
                        const todayOffset = (today.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)
                        const todayPercent = Math.max(0, Math.min(100, (todayOffset / totalDays) * 100))

                        const hierarchicalTasks = getHierarchicalTasks()
                        
                        // Calculate number of weeks for header
                        const numWeeks = Math.ceil(totalDays / 7)

                        return (
                          <>
                            {/* Hierarchical Task Rows */}
                            <div className="space-y-1">
                              {hierarchicalTasks.map((item: any, index: number) => {
                                // Calculate position and width based on ACTUAL dates
                                const startDate = new Date(item.plannedStartDate || item.clockedInAt || timelineStart)
                                const endDate = new Date(item.plannedEndDate || item.clockedOutAt || timelineEnd)
                                
                                // Ensure we have valid dates
                                const validStart = isNaN(startDate.getTime()) ? timelineStart : startDate
                                const validEnd = isNaN(endDate.getTime()) ? timelineEnd : endDate
                                
                                // Calculate position as percentage
                                const startOffset = (validStart.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)
                                const duration = Math.max(1, (validEnd.getTime() - validStart.getTime()) / (1000 * 60 * 60 * 24))
                                
                                const leftPercent = Math.max(0, (startOffset / totalDays) * 100)
                                const widthPercent = Math.max(1, (duration / totalDays) * 100)
                                
                                const isCompleted = item.status === 'COMPLETED'
                                const isDelayed = validEnd < today && !isCompleted
                                const isExpanded = expandedGroups[item.id] !== false  // Use item.id directly
                                
                                // Indentation based on level
                                const paddingLeft = item.level * 24
                                
                                return (
                                  <div key={`${item.type}-${item.id}-${index}`} className="flex items-center group hover:bg-muted/30 rounded-lg transition-colors">
                                    {/* Task Info with Hierarchy */}
                                    <div 
                                      className="shrink-0 p-2 border-r pr-4 flex items-center gap-2"
                                      style={{ width: `${400 + paddingLeft}px`, paddingLeft: `${paddingLeft}px` }}
                                    >
                                      {/* Expand/Collapse Button */}
                                      {item.hasChildren ? (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            toggleGroup(item.id)  // Use item.id directly (already prefixed)
                                          }}
                                          className="w-6 h-6 flex items-center justify-center hover:bg-muted rounded transition-colors"
                                        >
                                          {isExpanded ? (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                          ) : (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                          )}
                                        </button>
                                      ) : (
                                        <div className="w-6" />
                                      )}
                                      
                                      {/* Type Badge */}
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium shrink-0 ${
                                        item.type === 'order' ? 'bg-blue-100 text-blue-800' :
                                        item.type === 'mo' ? 'bg-purple-100 text-purple-800' :
                                        item.type === 'jobsheet' ? 'bg-green-100 text-green-800' :
                                        'bg-orange-100 text-orange-800'
                                      }`}>
                                        {item.type === 'order' ? 'Order' :
                                         item.type === 'mo' ? 'MO' :
                                         item.type === 'jobsheet' ? 'JS' : 'Task'}
                                      </span>
                                      
                                      {/* Task Name */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className={`font-medium text-sm truncate ${
                                            item.level === 0 ? 'text-base font-semibold' :
                                            item.level === 1 ? 'font-medium' :
                                            'font-normal'
                                          }`}>
                                            {item.name}
                                          </span>
                                          {item.type === 'order' && (
                                            <span className="text-xs text-muted-foreground">({item.customerName})</span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs">
                                          <span className="text-muted-foreground">
                                            {item.type === 'order' ? item.orderNumber :
                                             item.type === 'mo' ? item.moNumber :
                                             item.type === 'jobsheet' ? item.jsNumber :
                                             item.taskNumber}
                                          </span>
                                          {item.machine?.name && (
                                            <span className="flex items-center gap-1 text-muted-foreground">
                                              <Wrench className="w-3 h-3" />
                                              {item.machine.name}
                                            </span>
                                          )}
                                          <span className={`font-medium ${isDelayed ? 'text-red-600' : ''}`}>
                                            {item.progressPercent}%
                                          </span>
                                          <span className="text-muted-foreground">
                                            {validStart.toLocaleDateString()} - {validEnd.toLocaleDateString()}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Timeline Bar */}
                                    <div className="flex-1 relative h-10">
                                      {/* Grid lines */}
                                      <div className="absolute inset-0 flex">
                                        {Array.from({ length: numWeeks }).map((_, i) => (
                                          <div key={i} className="flex-1 border-r border-muted"></div>
                                        ))}
                                      </div>

                                      {/* Task Bar - WIDTH NOW REFLECTS ACTUAL DURATION */}
                                      <div
                                        className={`absolute top-1/2 -translate-y-1/2 h-7 rounded-md shadow-sm transition-all cursor-pointer ${
                                          isCompleted ? 'bg-green-500' :
                                          isDelayed ? 'bg-red-500' :
                                          item.type === 'order' ? 'bg-blue-500' :
                                          item.type === 'mo' ? 'bg-purple-500' :
                                          item.type === 'jobsheet' ? 'bg-green-400' :
                                          'bg-orange-500'
                                        } ${item.status === 'RUNNING' ? 'animate-pulse' : ''}`}
                                        style={{
                                          left: `${leftPercent}%`,
                                          width: `${widthPercent}%`,
                                          minWidth: '8px',
                                        }}
                                        title={`${item.name}\n${item.progressPercent}% complete\n${validStart.toLocaleDateString()} - ${validEnd.toLocaleDateString()}\nDuration: ${Math.round(duration)} days`}
                                      >
                                        {/* Progress fill */}
                                        <div
                                          className="absolute inset-0 bg-white/20 rounded-md"
                                          style={{ width: `${item.progressPercent}%` }}
                                        ></div>
                                        
                                        {/* Duration label */}
                                        {widthPercent > 8 && (
                                          <div className="absolute inset-0 flex items-center justify-center px-2">
                                            <span className="text-xs font-medium text-white truncate drop-shadow-md">
                                              {Math.round(duration)}d ({item.progressPercent}%)
                                            </span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Today marker */}
                                      <div
                                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                                        style={{ left: `${todayPercent}%` }}
                                      >
                                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full"></div>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>

                            {/* Legend */}
                            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                                    <span>Order</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-purple-500 rounded"></div>
                                    <span>MO</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                                    <span>Jobsheet</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-orange-500 rounded"></div>
                                    <span>Task</span>
                                  </div>
                                  <Separator orientation="vertical" className="h-4" />
                                  <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                                    <span>Completed</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                                    <span>Delayed</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-0.5 h-4 bg-red-500"></div>
                                    <span>Today</span>
                                  </div>
                                </div>
                                <div className="text-muted-foreground">
                                  Timeline: {timelineStart.toLocaleDateString()} → {timelineEnd.toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card>
          <CardHeader>
            <CardTitle>Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-100 border-blue-300 rounded"></div>
                <span>Order</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-100 border-purple-300 rounded"></div>
                <span>Manufacturing Order</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border-green-300 rounded"></div>
                <span>Jobsheet</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-100 border-orange-300 rounded"></div>
                <span>Task</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
