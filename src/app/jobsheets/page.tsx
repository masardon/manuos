'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Search, RefreshCw, FileText, Wrench, Clock } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Jobsheet {
  id: string
  jsNumber: string
  name: string
  status: string
  progressPercent: number
  plannedStartDate: string
  plannedEndDate: string
  moId: string
  moNumber: string
  moName: string
  orderNumber: string
  customerName: string
  tasksCount: number
}

export default function JobsheetsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [jobsheets, setJobsheets] = useState<Jobsheet[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  const fetchJobsheets = async () => {
    try {
      // Fetch all orders to get jobsheets
      const response = await fetch('/api/orders')
      if (response.ok) {
        const data = await response.json()
        const allJobsheets: Jobsheet[] = []
        
        data.orders.forEach((order: any) => {
          if (order.manufacturingOrders) {
            order.manufacturingOrders.forEach((mo: any) => {
              if (mo.jobsheets) {
                mo.jobsheets.forEach((js: any) => {
                  allJobsheets.push({
                    id: js.id,
                    jsNumber: js.jsNumber,
                    name: js.name,
                    status: js.status,
                    progressPercent: js.progressPercent,
                    plannedStartDate: js.plannedStartDate,
                    plannedEndDate: js.plannedEndDate,
                    moId: mo.id,
                    moNumber: mo.moNumber,
                    moName: mo.name,
                    orderNumber: order.orderNumber,
                    customerName: order.customerName,
                    tasksCount: js.machiningTasks?.length || 0,
                  })
                })
              }
            })
          }
        })
        
        setJobsheets(allJobsheets)
      }
    } catch (error) {
      console.error('Error fetching jobsheets:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobsheets()
  }, [])

  const filteredJobsheets = jobsheets.filter((js) =>
    js.jsNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    js.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    js.moNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    js.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    const config: Record<string, string> = {
      PREPARING: 'bg-gray-100 text-gray-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    }
    const statusValue = status || 'PREPARING'
    return <Badge className={config[statusValue] || 'bg-gray-100 text-gray-800'}>{statusValue.replace(/_/g, ' ')}</Badge>
  }

  return (
    <AppLayout title="Jobsheets">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Jobsheets</h1>
            <p className="text-muted-foreground mt-1">Production operations and processes</p>
          </div>
          <Button variant="outline" onClick={fetchJobsheets} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by JS number, name, MO, or order..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobsheets</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{jobsheets.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {jobsheets.filter((js) => js.status === 'IN_PROGRESS').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <Wrench className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {jobsheets.reduce((sum, js) => sum + js.tasksCount, 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Badge className="bg-green-500">✓</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {jobsheets.filter((js) => js.status === 'COMPLETED').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Jobsheets List */}
        <Card>
          <CardHeader>
            <CardTitle>All Jobsheets</CardTitle>
            <CardDescription>Production operations with machining tasks</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : filteredJobsheets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No jobsheets found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>JS Number</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>MO</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Tasks</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobsheets.map((js) => (
                    <TableRow key={js.id}>
                      <TableCell className="font-medium">
                        <Badge variant="outline">{js.jsNumber}</Badge>
                      </TableCell>
                      <TableCell>{js.name}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{js.moNumber}</div>
                          <div className="text-xs text-muted-foreground">{js.moName}</div>
                        </div>
                      </TableCell>
                      <TableCell>{js.orderNumber}</TableCell>
                      <TableCell>{js.customerName}</TableCell>
                      <TableCell>{getStatusBadge(js.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${js.progressPercent}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{js.progressPercent}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{js.tasksCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/mo/${js.moId}`)}
                        >
                          View MO
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
