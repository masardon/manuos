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
import { Calendar, Download, Filter, FileText, TrendingUp } from 'lucide-react'

export default function ReportsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Report options
  const [reportType, setReportType] = useState<'production' | 'efficiency' | 'orders' | 'breakdowns'>('production')
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'month' | 'custom'>('30d')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  const generateReport = async () => {
    setGenerating(true)
    try {
      let url = '/api/reports/production'
      
      if (reportType === 'efficiency') {
        url = '/api/reports/efficiency'
      } else if (reportType === 'orders') {
        url = '/api/reports/orders'
      } else if (reportType === 'breakdowns') {
        url = '/api/reports/breakdowns'
      }

      const params = new URLSearchParams()
      if (dateRange === 'custom') {
        params.append('startDate', customStart)
        params.append('endDate', customEnd)
      } else {
        const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 30
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)
        params.append('startDate', startDate.toISOString())
        params.append('endDate', new Date().toISOString())
      }

      const response = await fetch(`${url}?${params}`)
      
      if (response.ok) {
        // Create a blob and download
        const data = await response.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url2 = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url2
        a.download = `${reportType}-report-${Date.now()}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error generating report:', error)
    } finally {
      setGenerating(false)
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
            setLoading(false)
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const reportTypes = [
    { value: 'production', label: 'Production Report', description: 'Complete production output details' },
    { value: 'efficiency', label: 'Efficiency Analysis', description: 'Machine and task efficiency metrics' },
    { value: 'orders', label: 'Order Summary', description: 'Orders by status and customer' },
    { value: 'breakdowns', label: 'Breakdown Report', description: 'Machine downtime analysis' },
  ]

  return (
    <AppLayout title="Work Reports">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Work Reports
          </h2>
          <p className="text-muted-foreground mt-1">
            Generate and download production reports
          </p>
        </div>

        {/* Report Type Selection */}
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

        {/* Date Range Filter */}
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
                  <Input
                    id="startDate"
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generate Button */}
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
                <Download className="h-5 w-5" />
              </>
            )}
          </Button>
        </div>

        {/* Report Info Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Production Report</CardTitle>
              <CardDescription>
                Includes orders, MOs, and task completion
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-6">
              <p className="text-sm text-muted-foreground">
                Complete overview of production activities
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Efficiency Analysis</CardTitle>
              <CardDescription>
                Machine utilization and task efficiency metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-6">
              <p className="text-sm text-muted-foreground">
                Track production efficiency over time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>
                Orders by status and customer
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-6">
              <p className="text-sm text-muted-foreground">
                Summarize all orders and their status
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Breakdown Report</CardTitle>
              <CardDescription>
                Machine downtime and resolution tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-6">
              <p className="text-sm text-muted-foreground">
                Analyze breakdown patterns and maintenance needs
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
