'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, RefreshCw, FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

interface Order {
  id: string
  orderNumber: string
  customerName: string
  status: string
  progressPercent: number
  createdAt: string
  manufacturingOrdersCount: number
}

const statusFilters = [
  { value: 'all', label: 'All Orders' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PLANNING', label: 'Engineering Review' },
  { value: 'MATERIAL_PREPARATION', label: 'Client Approval' },
  { value: 'IN_PRODUCTION', label: 'In Production' },
  { value: 'COMPLETED', label: 'Completed' },
]

export default function OrdersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchOrders = async (status?: string) => {
    try {
      const url = status && status !== 'all' 
        ? `/api/orders?status=${status}`
        : '/api/orders'
      const response = await fetch(url)
      const data = await response.json()
      setOrders(data.orders || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const getStatusBadge = (status: string) => {
    const config: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PLANNING: 'bg-blue-100 text-blue-800',
      IN_PRODUCTION: 'bg-orange-100 text-orange-800',
      COMPLETED: 'bg-green-100 text-green-800',
      DELIVERED: 'bg-purple-100 text-purple-800',
    }
    return <Badge className={config[status] || 'bg-gray-100 text-gray-800'}>{status.replace(/_/g, ' ')}</Badge>
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Orders</h1>
            <p className="text-muted-foreground mt-1">Manage customer orders</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => fetchOrders(statusFilter)} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => router.push('/orders/new')}>
              <Plus className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </div>
        </div>

        {/* Status Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              {statusFilters.map((filter) => (
                <Button
                  key={filter.value}
                  variant={statusFilter === filter.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setStatusFilter(filter.value)
                    fetchOrders(filter.value === 'all' ? undefined : filter.value)
                  }}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All Orders</CardTitle>
            <CardDescription>Customer orders and their status</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No orders found. Create your first order to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>MOs</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden w-24">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${order.progressPercent}%` }} />
                          </div>
                          <span className="text-xs font-medium">{order.progressPercent}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{order.manufacturingOrdersCount}</Badge>
                      </TableCell>
                      <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/orders/${order.id}/plan`)}
                          >
                            Plan
                          </Button>
                          {order.status === 'MATERIAL_PREPARATION' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/client/approval/${order.id}`)}
                            >
                              Approval
                            </Button>
                          )}
                        </div>
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
