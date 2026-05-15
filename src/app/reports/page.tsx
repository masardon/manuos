'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Calendar, Download, FileText, TrendingUp } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ReportsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [generating, setGenerating] = useState(false)

  const [reportType, setReportType] = useState<'production' | 'efficiency' | 'orders' | 'breakdowns'>('production')
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'month' | 'custom'>('30d')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const getDateRange = () => {
    if (dateRange === 'custom') {
      return { startDate: customStart, endDate: customEnd }
    }
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    return { startDate: startDate.toISOString(), endDate: new Date().toISOString() }
  }

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('id-ID', {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  }

  const generateReport = async () => {
    setGenerating(true)
    try {
      const { startDate, endDate } = getDateRange()
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(`/api/reports/${reportType}?${params}`)
      if (!response.ok) throw new Error('Failed to fetch report data')

      const data = await response.json()
      const html = generateHTML(reportType, data)
      const win = window.open('', '_blank')
      if (win) {
        win.document.write(html)
        win.document.close()
      }

      toast({ title: 'Report Generated', description: 'Report opened in new tab. Use Ctrl+P to print or save as PDF.' })
    } catch (error) {
      console.error('Error generating report:', error)
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate report' })
    } finally {
      setGenerating(false)
    }
  }

  const generateHTML = (type: string, data: any) => {
    const title = {
      production: 'Production Report',
      efficiency: 'Efficiency Analysis Report',
      orders: 'Order Summary Report',
      breakdowns: 'Breakdown Report',
    }[type] || 'Report'

    const range = data.dateRange?.startDate && data.dateRange?.endDate
      ? `${formatDate(data.dateRange.startDate)} - ${formatDate(data.dateRange.endDate)}`
      : 'All Time'

    let body = ''

    if (type === 'production') {
      const moDetails = (data.orders || []).flatMap((o: any) =>
        (o.manufacturingOrders || []).map((mo: any) => {
          const jsRows = (mo.jobsheets || []).map((js: any) => {
            const taskRows = (js.tasks || []).map((t: any) =>
              `<tr><td>${t.taskNumber}</td><td>${t.name}</td><td><span class="badge badge-${getStatusColor(t.status)}">${t.status}</span></td><td>${t.plannedHours || '-'}h</td><td>${t.actualHours || '-'}h</td></tr>`
            ).join('')
            return `<h4>&nbsp;&nbsp;${js.jsNumber}: ${js.name} [${js.status}]</h4><table><thead><tr><th>Task #</th><th>Name</th><th>Status</th><th>Planned</th><th>Actual</th></tr></thead><tbody>${taskRows || '<tr><td colspan="5">No tasks</td></tr>'}</tbody></table>`
          }).join('')
          return `<h3>${o.orderNumber} &rarr; ${mo.moNumber}: ${mo.name}</h3><p>Status: ${mo.status} | Progress: ${mo.progressPercent}% | Outsourced: ${mo.isOutsourced ? 'Yes' : 'No'}</p>${jsRows}`
        })
      ).join('')

      body = `
        <div class="summary-grid">
          <div class="summary-card"><div class="summary-value">${data.summary?.totalOrders || 0}</div><div class="summary-label">Orders</div></div>
          <div class="summary-card"><div class="summary-value">${data.summary?.totalMOs || 0}</div><div class="summary-label">Manufacturing Orders</div></div>
          <div class="summary-card"><div class="summary-value">${data.summary?.totalJobsheets || 0}</div><div class="summary-label">Jobsheets</div></div>
          <div class="summary-card"><div class="summary-value">${data.summary?.completedTasks || 0} / ${data.summary?.totalTasks || 0}</div><div class="summary-label">Tasks Completed</div></div>
          <div class="summary-card"><div class="summary-value">${data.summary?.totalPlannedHours?.toFixed(1) || 0}h</div><div class="summary-label">Planned Hours</div></div>
          <div class="summary-card"><div class="summary-value">${data.summary?.totalActualHours?.toFixed(1) || 0}h</div><div class="summary-label">Actual Hours</div></div>
        </div>
        <h2>Orders</h2>
        <table>
          <thead><tr><th>Order #</th><th>Customer</th><th>Status</th><th>Progress</th><th>MOs</th><th>Tasks</th><th>Planned Hours</th><th>Actual Hours</th></tr></thead>
          <tbody>
            ${(data.orders || []).map((o: any) => `<tr>
              <td>${o.orderNumber}</td>
              <td>${o.customerName}</td>
              <td><span class="badge badge-${getStatusColor(o.status)}">${o.status}</span></td>
              <td><div class="progress-bar"><div class="progress-fill" style="width:${o.progressPercent}%"></div></div>${o.progressPercent}%</td>
              <td>${o.moCount}</td>
              <td>${o.completedTasks}/${o.taskCount}</td>
              <td>${o.totalPlannedHours?.toFixed(1)}h</td>
              <td>${o.totalActualHours?.toFixed(1)}h</td>
            </tr>`).join('') || '<tr><td colspan="8">No data</td></tr>'}
          </tbody>
        </table>
        ${moDetails}
      `
    }

    if (type === 'efficiency') {
      body = `
        <div class="summary-grid">
          <div class="summary-card"><div class="summary-value">${data.summary?.totalMachines || 0}</div><div class="summary-label">Machines</div></div>
          <div class="summary-card"><div class="summary-value">${data.summary?.activeMachines || 0}</div><div class="summary-label">Active</div></div>
          <div class="summary-card"><div class="summary-value">${data.summary?.idleMachines || 0}</div><div class="summary-label">Idle</div></div>
          <div class="summary-card"><div class="summary-value">${data.summary?.totalTasks || 0}</div><div class="summary-label">Total Tasks</div></div>
          <div class="summary-card"><div class="summary-value">${data.summary?.overallEfficiency || 0}%</div><div class="summary-label">Efficiency</div></div>
          <div class="summary-card"><div class="summary-value">${data.summary?.overallUtilization || 0}%</div><div class="summary-label">Utilization</div></div>
        </div>
        <h2>Machine Efficiency</h2>
        <table>
          <thead><tr>
            <th>Code</th><th>Name</th><th>Type</th><th>Status</th><th>Tasks</th><th>Completed</th><th>Planned</th><th>Actual</th><th>Efficiency</th>
          </tr></thead>
          <tbody>
            ${data.machines?.map((m: any) => `<tr>
              <td>${m.code}</td><td>${m.name}</td><td>${m.type}</td>
              <td><span class="badge badge-${getStatusColor(m.status)}">${m.status}</span></td>
              <td>${m.taskCount}</td><td>${m.completedTasks}</td>
              <td>${m.plannedHours}h</td><td>${m.actualHours}h</td>
              <td><strong>${m.efficiency}%</strong></td>
            </tr>`).join('') || '<tr><td colspan="9">No data</td></tr>'}
          </tbody>
        </table>
      `
    }

    if (type === 'orders') {
      body = `
        <div class="summary-grid">
          <div class="summary-card"><div class="summary-value">${data.summary?.total || 0}</div><div class="summary-label">Total Orders</div></div>
          <div class="summary-card"><div class="summary-value">${data.summary?.avgProgress || 0}%</div><div class="summary-label">Avg Progress</div></div>
          <div class="summary-card"><div class="summary-value">${data.summary?.inProgress || 0}</div><div class="summary-label">In Progress</div></div>
          <div class="summary-card"><div class="summary-value">${data.summary?.completed || 0}</div><div class="summary-label">Completed</div></div>
        </div>
        <h2>Status Distribution</h2>
        <table>
          <thead><tr><th>Status</th><th>Count</th></tr></thead>
          <tbody>
            ${Object.entries(data.summary?.statusDistribution || {}).map(([status, count]) =>
              `<tr><td><span class="badge badge-${getStatusColor(status)}">${status}</span></td><td>${count}</td></tr>`
            ).join('')}
          </tbody>
        </table>
        <h2>Order Details</h2>
        <table>
          <thead><tr>
            <th>Order #</th><th>Customer</th><th>Status</th><th>Progress</th><th>MOs</th><th>Planned Start</th><th>Planned End</th>
          </tr></thead>
          <tbody>
            ${data.orders?.map((o: any) => `<tr>
              <td>${o.orderNumber}</td><td>${o.customerName}</td>
              <td><span class="badge badge-${getStatusColor(o.status)}">${o.status}</span></td>
              <td>${o.progressPercent}%</td><td>${o.moCount}</td>
              <td>${formatDate(o.plannedStartDate)}</td><td>${formatDate(o.plannedEndDate)}</td>
            </tr>`).join('') || '<tr><td colspan="7">No data</td></tr>'}
          </tbody>
        </table>
      `
    }

    if (type === 'breakdowns') {
      body = `
        <div class="summary-grid">
          <div class="summary-card"><div class="summary-value">${data.summary?.total || 0}</div><div class="summary-label">Total Breakdowns</div></div>
          <div class="summary-card"><div class="summary-value">${data.summary?.resolvedCount || 0}</div><div class="summary-label">Resolved</div></div>
          <div class="summary-card"><div class="summary-value">${data.summary?.activeCount || 0}</div><div class="summary-label">Active</div></div>
          <div class="summary-card"><div class="summary-value">${data.summary?.totalDowntimeHours || 0}h</div><div class="summary-label">Total Downtime</div></div>
          <div class="summary-card"><div class="summary-value">${data.summary?.avgResolutionHours || 0}h</div><div class="summary-label">Avg Resolution</div></div>
        </div>
        <h2>Breakdowns by Type</h2>
        <table>
          <thead><tr><th>Type</th><th>Count</th><th>Resolved</th></tr></thead>
          <tbody>
            ${data.summary?.breakdownsByType?.map((bt: any) =>
              `<tr><td>${bt.type}</td><td>${bt.count}</td><td>${bt.resolved}</td></tr>`
            ).join('') || '<tr><td colspan="3">No data</td></tr>'}
          </tbody>
        </table>
        <h2>Breakdown Details</h2>
        <table>
          <thead><tr>
            <th>Machine</th><th>Type</th><th>Description</th><th>Reported By</th><th>Reported At</th><th>Duration</th><th>Status</th>
          </tr></thead>
          <tbody>
            ${data.breakdowns?.map((b: any) => `<tr>
              <td>${b.machineCode} - ${b.machineName}</td>
              <td>${b.type}</td>
              <td>${b.description || '-'}</td>
              <td>${b.reportedBy}</td>
              <td>${formatDate(b.reportedAt)}</td>
              <td>${b.durationHours ? b.durationHours + 'h' : '-'}</td>
              <td><span class="badge badge-${b.resolved ? 'green' : 'yellow'}">${b.resolved ? 'Resolved' : 'Active'}</span></td>
            </tr>`).join('') || '<tr><td colspan="7">No data</td></tr>'}
          </tbody>
        </table>
      `
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} - ManuOS</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1a1a1a; font-size: 14px; }
    .header { border-bottom: 3px solid #f97316; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
    .header h1 { font-size: 28px; color: #1a1a1a; }
    .header .meta { text-align: right; color: #666; font-size: 13px; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 30px; }
    .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center; }
    .summary-value { font-size: 24px; font-weight: 700; color: #f97316; }
    .summary-label { font-size: 12px; color: #64748b; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    h2 { font-size: 18px; margin: 24px 0 12px; color: #1a1a1a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
    h3 { font-size: 15px; margin: 16px 0 8px; color: #334155; }
    h4 { font-size: 13px; margin: 12px 0 6px; color: #475569; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
    th { background: #f1f5f9; border: 1px solid #e2e8f0; padding: 10px 12px; text-align: left; font-weight: 600; color: #334155; }
    td { border: 1px solid #e2e8f0; padding: 8px 12px; }
    tr:nth-child(even) { background: #f8fafc; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-blue { background: #dbeafe; color: #1e40af; }
    .badge-yellow { background: #fef9c3; color: #854d0e; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    .badge-gray { background: #f1f5f9; color: #475569; }
    .badge-purple { background: #f3e8ff; color: #6b21a8; }
    .progress-bar { display: inline-block; width: 80px; height: 8px; background: #e2e8f0; border-radius: 4px; margin-right: 6px; vertical-align: middle; }
    .progress-fill { height: 100%; background: #f97316; border-radius: 4px; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px; }
    @media print { body { padding: 20px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="no-print" style="text-align:right; margin-bottom: 20px;">
    <button onclick="window.print()" style="padding: 8px 20px; background: #f97316; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">Print / Save as PDF</button>
  </div>
  <div class="header">
    <div>
      <h1>${title}</h1>
      <p style="color:#666; margin-top: 4px;">YPTI Manufacturing</p>
    </div>
    <div class="meta">
      <div>Period: ${range}</div>
      <div>Generated: ${formatDate(data.generatedAt)}</div>
    </div>
  </div>
  ${body}
  <div class="footer">
    ManuOS - Manufacturing Operating System | Report generated on ${new Date().toLocaleString('id-ID')}
  </div>
</body>
</html>`
  }

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      DRAFT: 'gray', PLANNING: 'blue', MATERIAL_PREPARATION: 'yellow',
      IN_PRODUCTION: 'purple', IN_PROGRESS: 'purple', ASSEMBLY: 'blue',
      QC: 'yellow', READY_FOR_DELIVERY: 'green', DELIVERED: 'green',
      CLOSED: 'green', CANCELLED: 'red', PLANNED: 'blue', SCHEDULED: 'blue',
      RUNNING: 'purple', PAUSED: 'yellow', COMPLETED: 'green',
      PREPARING: 'blue', READY: 'green', REVIEW: 'yellow', APPROVED: 'green',
      REJECTED: 'red', PENDING: 'yellow', ASSIGNED: 'blue',
      IDLE: 'gray', MAINTENANCE: 'yellow', BREAKDOWN: 'red',
      RESOLVED: 'green', ACTIVE: 'yellow',
    }
    return map[status] || 'gray'
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            setIsAuthenticated(true)
            setLoading(false)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  const reportTypes = [
    { value: 'production', label: 'Production Report', description: 'Orders, MOs, and task completion details' },
    { value: 'efficiency', label: 'Efficiency Analysis', description: 'Machine utilization and task efficiency' },
    { value: 'orders', label: 'Order Summary', description: 'Orders by status and customer' },
    { value: 'breakdowns', label: 'Breakdown Report', description: 'Machine downtime analysis' },
  ]

  return (
    <AppLayout title="Work Reports">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Work Reports</h2>
          <p className="text-muted-foreground mt-1">Generate and print production reports</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {reportTypes.map((type) => (
            <Card
              key={type.value}
              className={`cursor-pointer transition-colors hover:shadow-lg hover:border-orange-500 ${
                reportType === type.value ? 'border-orange-500 bg-orange-50' : 'border-border'
              }`}
              onClick={() => setReportType(type.value as any)}
            >
              <CardHeader>
                <CardTitle>{type.label}</CardTitle>
                <CardDescription>{type.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <FileText className="h-12 w-12 text-orange-500 mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Date Range</CardTitle>
            <CardDescription>Select time period for the report</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateRange === 'custom' && (
              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input id="endDate" type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            onClick={generateReport}
            disabled={generating || (dateRange === 'custom' && (!customStart || !customEnd))}
            size="lg"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Generating...
              </>
            ) : (
              <>
                <FileText className="h-5 w-5 mr-2" />
                Generate Report
                <Download className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}
