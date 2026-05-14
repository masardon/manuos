'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Package,
  AlertTriangle,
  XCircle,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Clock,
  RefreshCw,
  BarChart3,
  Warehouse,
  Truck,
  Factory,
  ClipboardCheck,
  History,
  Filter,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface InventoryDashboardData {
  totalItems: number
  lowStockItems: { partNumber: string; name: string; currentQuantity: number; minimumQuantity: number }[]
  outOfStockItems: number
  totalQuantity: number
  recentTransactions: {
    id: string
    type: string
    quantity: number
    inventory: { partNumber: string; name: string }
    referenceType: string
    notes: string | null
    createdAt: string
  }[]
  byCategory: { category: string; count: number; totalQuantity: number }[]
  byLocation: { locationId: string; count: number; totalQuantity: number }[]
  pendingHandoffs: number
  activeReservations: {
    id: string
    reservedQty: number
    inventory: { partNumber: string; name: string }
    mo: { moNumber: string; name: string }
  }[]
}

export default function InventoryDashboardPage() {
  const [data, setData] = useState<InventoryDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/inventory/dashboard')
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'RECEIPT': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'ISSUE': return <Factory className="h-4 w-4 text-blue-600" />
      case 'RETURN': return <ArrowRightLeft className="h-4 w-4 text-amber-600" />
      case 'TRANSFER': return <ArrowRightLeft className="h-4 w-4 text-purple-600" />
      case 'PRODUCTION_OUTPUT': return <Package className="h-4 w-4 text-indigo-600" />
      case 'CONSUMPTION': return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'RESERVATION': return <ClipboardCheck className="h-4 w-4 text-cyan-600" />
      case 'SCRAP': return <XCircle className="h-4 w-4 text-gray-600" />
      default: return <Package className="h-4 w-4" />
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'RECEIPT': return 'bg-green-100 text-green-800'
      case 'ISSUE': return 'bg-blue-100 text-blue-800'
      case 'RETURN': return 'bg-amber-100 text-amber-800'
      case 'TRANSFER': return 'bg-purple-100 text-purple-800'
      case 'PRODUCTION_OUTPUT': return 'bg-indigo-100 text-indigo-800'
      case 'CONSUMPTION': return 'bg-red-100 text-red-800'
      case 'RESERVATION': return 'bg-cyan-100 text-cyan-800'
      case 'SCRAP': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <AppLayout title="Inventory Dashboard">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Inventory Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Inventory Dashboard</h2>
            <p className="text-muted-foreground mt-1">
              Central monitoring of all inventory movements and status
            </p>
          </div>
          <Button onClick={fetchDashboardData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Critical Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.totalItems || 0}</div>
              <p className="text-xs text-muted-foreground">
                {data?.totalQuantity?.toLocaleString() || 0} total units
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{data?.lowStockItems?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Items below minimum stock level
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{data?.outOfStockItems || 0}</div>
              <p className="text-xs text-muted-foreground">
                Items with zero quantity
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Handoffs</CardTitle>
              <ArrowRightLeft className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{data?.pendingHandoffs || 0}</div>
              <p className="text-xs text-muted-foreground">
                Material transfers in progress
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for detailed views */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Recent Activity</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="reservations">Reservations</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* By Category */}
              <Card>
                <CardHeader>
                  <CardTitle>Inventory by Category</CardTitle>
                  <CardDescription>Distribution across categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data?.byCategory?.map((cat) => (
                      <div key={cat.category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{cat.category}</Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{cat._count} items</div>
                          <div className="text-xs text-muted-foreground">
                            {cat._sum?.currentQuantity?.toLocaleString() || 0} units
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!data?.byCategory || data.byCategory.length === 0) && (
                      <div className="text-center py-4 text-muted-foreground">
                        No inventory data
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* By Location */}
              <Card>
                <CardHeader>
                  <CardTitle>Inventory by Location</CardTitle>
                  <CardDescription>Distribution across locations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data?.byLocation?.map((loc) => (
                      <div key={loc.locationId} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Warehouse className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">Location {loc.locationId.slice(0, 8)}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{loc._count} items</div>
                          <div className="text-xs text-muted-foreground">
                            {loc._sum?.currentQuantity?.toLocaleString() || 0} units
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!data?.byLocation || data.byLocation.length === 0) && (
                      <div className="text-center py-4 text-muted-foreground">
                        No location data
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Inventory Flow Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Inventory Flow Summary</CardTitle>
                <CardDescription>Today's material movements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <TrendingUp className="h-8 w-8 mx-auto text-green-600 mb-2" />
                    <div className="text-2xl font-bold text-green-600">
                      {data?.recentTransactions?.filter(t => t.type === 'RECEIPT' || t.type === 'PRODUCTION_OUTPUT').length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Receipts</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Factory className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                    <div className="text-2xl font-bold text-blue-600">
                      {data?.recentTransactions?.filter(t => t.type === 'ISSUE' || t.type === 'CONSUMPTION').length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Issues/Consumption</div>
                  </div>
                  <div className="text-center p-4 bg-amber-50 rounded-lg">
                    <ArrowRightLeft className="h-8 w-8 mx-auto text-amber-600 mb-2" />
                    <div className="text-2xl font-bold text-amber-600">
                      {data?.recentTransactions?.filter(t => t.type === 'TRANSFER' || t.type === 'RETURN').length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Transfers</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <XCircle className="h-8 w-8 mx-auto text-red-600 mb-2" />
                    <div className="text-2xl font-bold text-red-600">
                      {data?.recentTransactions?.filter(t => t.type === 'SCRAP' || t.type === 'WASTE').length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Scrap/Waste</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Activity Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Last 24 hours of inventory movements</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.recentTransactions?.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <Badge className={getTransactionColor(transaction.type)}>
                            {getTransactionIcon(transaction.type)}
                            <span className="ml-1">{transaction.type}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{transaction.inventory?.partNumber}</div>
                            <div className="text-xs text-muted-foreground">{transaction.inventory?.name}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={transaction.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                            {transaction.quantity > 0 ? '+' : ''}{transaction.quantity}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{transaction.referenceType}</Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {transaction.notes || '-'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(transaction.createdAt).toLocaleTimeString()}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!data?.recentTransactions || data.recentTransactions.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                          No recent transactions
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-amber-600">Low Stock Alerts</CardTitle>
                <CardDescription>Items below minimum stock level</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part Number</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Current</TableHead>
                      <TableHead className="text-right">Minimum</TableHead>
                      <TableHead className="text-right">Shortage</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.lowStockItems?.map((item) => (
                      <TableRow key={item.partNumber}>
                        <TableCell className="font-medium">{item.partNumber}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right">{item.currentQuantity}</TableCell>
                        <TableCell className="text-right">{item.minimumQuantity}</TableCell>
                        <TableCell className="text-right text-red-600">
                          {item.minimumQuantity - item.currentQuantity}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-amber-100 text-amber-800">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Low Stock
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!data?.lowStockItems || data.lowStockItems.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4 text-green-600">
                          ✓ All items are adequately stocked
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reservations Tab */}
          <TabsContent value="reservations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Material Reservations</CardTitle>
                <CardDescription>Materials reserved for manufacturing orders</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Reserved Qty</TableHead>
                      <TableHead>Manufacturing Order</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.activeReservations?.map((res) => (
                      <TableRow key={res.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{res.inventory?.partNumber}</div>
                            <div className="text-xs text-muted-foreground">{res.inventory?.name}</div>
                          </div>
                        </TableCell>
                        <TableCell>{res.reservedQty}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{res.mo?.moNumber}</Badge>
                          <span className="ml-2 text-sm text-muted-foreground">{res.mo?.name}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!data?.activeReservations || data.activeReservations.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                          No active reservations
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Data Flow Indicator */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Factory className="h-4 w-4" />
                <span>Purchase Receipt</span>
              </div>
              <span>→</span>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span>Inventory</span>
              </div>
              <span>→</span>
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4" />
                <span>Issue to Production</span>
              </div>
              <span>→</span>
              <div className="flex items-center gap-2">
                <Factory className="h-4 w-4" />
                <span>Production Output</span>
              </div>
              <span>→</span>
              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" />
                <span>QC Inspection</span>
              </div>
              <span>→</span>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span>Finished Goods</span>
              </div>
            </div>
            <div className="text-center text-xs text-muted-foreground mt-4">
              Every material movement is tracked through the Inventory Ledger
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
