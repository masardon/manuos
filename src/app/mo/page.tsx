'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { Search, RefreshCw, Wrench, Calendar, Clock, Building, Factory } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ManufacturingOrder {
  id: string
  moNumber: string
  name: string
  status: string
  progressPercent: number
  plannedStartDate: string
  plannedEndDate: string
  isOutsourced: boolean
  outsourcedType: string | null
  vendor: {
    name: string
    code: string
  } | null
  order: {
    orderNumber: string
    customerName: string
  }
  jobsheetsCount: number
}

export default function MOListPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [mos, setMos] = useState<ManufacturingOrder[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [processorFilter, setProcessorFilter] = useState<string>('all')

  const fetchMOs = async () => {
    try {
      // Fetch all orders with their MOs
      const response = await fetch('/api/orders')
      if (response.ok) {
        const data = await response.json()
        const allMOs: ManufacturingOrder[] = []
        
        data.orders.forEach((order: any) => {
          if (order.manufacturingOrders) {
            order.manufacturingOrders.forEach((mo: any) => {
              allMOs.push({
                ...mo,
                order: {
                  orderNumber: order.orderNumber,
                  customerName: order.customerName,
                },
              })
            })
          }
        })
        
        setMos(allMOs)
      }
    } catch (error) {
      console.error('Error fetching MOs:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load manufacturing orders',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMOs()
  }, [])

  const filteredMOs = mos.filter((mo) => {
    // Search filter
    const matchesSearch = 
      mo.moNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mo.order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mo.order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Processor filter
    let matchesProcessor = true
    if (processorFilter === 'internal') {
      matchesProcessor = !mo.isOutsourced
    } else if (processorFilter === 'external') {
      matchesProcessor = mo.isOutsourced
    }
    
    return matchesSearch && matchesProcessor
  })

  const formatTimeline = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    // Check for invalid dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 'Not scheduled'
    }
    
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PLANNED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-orange-100 text-orange-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    }
    const statusValue = status || 'PLANNED'
    return <Badge className={config[statusValue] || 'bg-gray-100 text-gray-800'}>{statusValue.replace(/_/g, ' ')}</Badge>
  }

  const getProcessorBadge = (mo: ManufacturingOrder) => {
    if (mo.isOutsourced) {
      return (
        <div className="flex items-center gap-2">
          <Badge className="bg-purple-100 text-purple-800">
            <Building className="h-3 w-3 mr-1" />
            Subcon
          </Badge>
          {mo.vendor && (
            <span className="text-xs text-muted-foreground">
              ({mo.vendor.name})
            </span>
          )}
        </div>
      )
    }
    return (
      <Badge className="bg-blue-100 text-blue-800">
        <Wrench className="h-3 w-3 mr-1" />
        Internal
      </Badge>
    )
  }

  return (
    <AppLayout title="Manufacturing Orders">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Manufacturing Orders</h1>
            <p className="text-muted-foreground mt-1">Production batches and schedules</p>
          </div>
          <Button variant="outline" onClick={fetchMOs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Search & Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by MO number, name, order, or customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={processorFilter} onValueChange={setProcessorFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by processor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <span>All MOs</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="internal">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-blue-500" />
                      <span>Internal Only</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="external">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-purple-500" />
                      <span>Outsourced Only</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total MOs</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mos.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Internal</CardTitle>
              <Wrench className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {mos.filter((mo) => !mo.isOutsourced).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outsourced</CardTitle>
              <Building className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {mos.filter((mo) => mo.isOutsourced).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mos.filter((mo) => mo.status === 'IN_PROGRESS').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Planned</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mos.filter((mo) => mo.status === 'PLANNED').length}
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
                {mos.filter((mo) => mo.status === 'COMPLETED').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* MO List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {processorFilter === 'all' ? 'All Manufacturing Orders' : 
               processorFilter === 'internal' ? 'Internal Manufacturing Orders' : 
               'Outsourced Manufacturing Orders'}
            </CardTitle>
            <CardDescription>
              {filteredMOs.length} of {mos.length} orders shown
              {processorFilter !== 'all' && ` (filtered by ${processorFilter})`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : filteredMOs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No manufacturing orders found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>MO Number</TableHead>
                    <TableHead>Processor</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Timeline</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMOs.map((mo) => (
                    <TableRow key={mo.id}>
                      <TableCell className="font-medium">
                        <Badge variant="outline">{mo.moNumber}</Badge>
                      </TableCell>
                      <TableCell>{getProcessorBadge(mo)}</TableCell>
                      <TableCell>{mo.name}</TableCell>
                      <TableCell>{mo.order.orderNumber}</TableCell>
                      <TableCell>{mo.order.customerName}</TableCell>
                      <TableCell>{getStatusBadge(mo.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${mo.progressPercent}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{mo.progressPercent}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatTimeline(mo.plannedStartDate, mo.plannedEndDate)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/mo/${mo.id}`)}
                        >
                          View Details
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
