'use client'

import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, RefreshCw, Building, Star, Clock, TrendingUp, Eye, Edit, Award, Factory } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'

interface Vendor {
  id: string
  code: string
  name: string
  supplierType: string
  vendorTier?: string
  contactPerson?: string
  email?: string
  phone?: string
  address?: string
  capabilities: string[]
  certifications?: string
  leadTimeDays?: number
  qualityRating: number
  deliveryRating: number
  priceRating: number
  onTimeDelivery: number
  totalOrders: number
  isActive: boolean
  vendorOrders: { id: string; vendorOrderId: string; status: string; totalPrice: number }[]
  outsourcedMfgOrders: { id: string; moNumber: string; status: string }[]
}

interface VendorOrder {
  id: string
  vendorOrderId: string
  title: string
  workDescription: string
  quantity: number
  unit?: string
  totalPrice: number
  currency: string
  status: string
  outsourceType: string
  promisedDate?: string
  vendor: { name: string; code: string }
  order?: { orderNumber: string; customerName: string }
  manufacturingOrder?: { moNumber: string }
}

interface VendorStats {
  totalVendors: number
  contractManufacturers: number
  activeOrders: number
  completedOrders: number
  totalOutsourcedValue: number
}

export default function VendorManagementPage() {
  const { toast } = useToast()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [vendorOrders, setVendorOrders] = useState<VendorOrder[]>([])
  const [stats, setStats] = useState<VendorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('vendors')
  const [createVendorDialogOpen, setCreateVendorDialogOpen] = useState(false)
  const [viewVendorDialogOpen, setViewVendorDialogOpen] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [vendorForm, setVendorForm] = useState({
    code: '',
    name: '',
    supplierType: 'CONTRACT_MANUFACTURER',
    vendorTier: 'TIER_1',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    capabilities: '',
    certifications: '',
    leadTimeDays: 0,
    paymentTerms: 'NET30',
    notes: '',
  })

  const fetchData = async () => {
    try {
      const [vendorsRes, ordersRes, statsRes] = await Promise.all([
        fetch('/api/vendors'),
        fetch('/api/vendor-orders'),
        fetch('/api/vendors?stats=true'),
      ])
      const [vendorsData, ordersData, statsData] = await Promise.all([
        vendorsRes.json(),
        ordersRes.json(),
        statsRes.json(),
      ])
      setVendors(vendorsData.vendors || [])
      setVendorOrders(ordersData.vendorOrders || [])
      setStats(statsData.stats || null)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch vendor data',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getSupplierTypeBadge = (type: string) => {
    const config: Record<string, string> = {
      MATERIAL: 'bg-blue-100 text-blue-800',
      CONTRACT_MANUFACTURER: 'bg-green-100 text-green-800',
      BOTH: 'bg-purple-100 text-purple-800',
    }
    return <Badge className={config[type] || 'bg-gray-100 text-gray-800'}>{type.replace(/_/g, ' ')}</Badge>
  }

  const getTierBadge = (tier?: string) => {
    if (!tier) return null
    const config: Record<string, string> = {
      TIER_1: 'bg-yellow-100 text-yellow-800',
      TIER_2: 'bg-orange-100 text-orange-800',
      TIER_3: 'bg-gray-100 text-gray-800',
    }
    const displayText = tier.replace('TIER_', 'Tier ')
    return <Badge className={config[tier]}>{displayText}</Badge>
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      ORDERED: 'bg-indigo-100 text-indigo-800',
      IN_PROGRESS: 'bg-purple-100 text-purple-800',
      SHIPPED: 'bg-cyan-100 text-cyan-800',
      RECEIVED: 'bg-teal-100 text-teal-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    }
    return <Badge className={config[status] || 'bg-gray-100 text-gray-800'}>{status.replace(/_/g, ' ')}</Badge>
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
        <span className="ml-1 text-sm">{rating.toFixed(1)}</span>
      </div>
    )
  }

  const handleCreateVendor = async () => {
    try {
      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...vendorForm,
          capabilities: vendorForm.capabilities.split(',').map(c => c.trim()).filter(c => c),
        }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Vendor created successfully',
        })
        setCreateVendorDialogOpen(false)
        setVendorForm({
          code: '',
          name: '',
          supplierType: 'CONTRACT_MANUFACTURER',
          vendorTier: 'TIER_1',
          contactPerson: '',
          email: '',
          phone: '',
          address: '',
          capabilities: '',
          certifications: '',
          leadTimeDays: 0,
          paymentTerms: 'NET30',
          notes: '',
        })
        fetchData()
      } else {
        throw new Error('Failed to create vendor')
      }
    } catch (error) {
      console.error('Error creating vendor:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create vendor',
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Vendor Management</h1>
            <p className="text-muted-foreground mt-1">Manage suppliers and contract manufacturers</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Dialog open={createVendorDialogOpen} onOpenChange={setCreateVendorDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Vendor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Vendor</DialogTitle>
                  <DialogDescription>Add a new vendor or contract manufacturer</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="code">Vendor Code</Label>
                      <Input
                        id="code"
                        value={vendorForm.code}
                        onChange={(e) => setVendorForm({ ...vendorForm, code: e.target.value })}
                        placeholder="e.g., V-001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={vendorForm.name}
                        onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                        placeholder="Company name"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="supplierType">Type</Label>
                      <Select
                        value={vendorForm.supplierType}
                        onValueChange={(value) => setVendorForm({ ...vendorForm, supplierType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MATERIAL">Material Supplier</SelectItem>
                          <SelectItem value="CONTRACT_MANUFACTURER">Contract Manufacturer</SelectItem>
                          <SelectItem value="BOTH">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vendorTier">Tier</Label>
                      <Select
                        value={vendorForm.vendorTier}
                        onValueChange={(value) => setVendorForm({ ...vendorForm, vendorTier: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select tier" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TIER_1">Tier 1</SelectItem>
                          <SelectItem value="TIER_2">Tier 2</SelectItem>
                          <SelectItem value="TIER_3">Tier 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactPerson">Contact Person</Label>
                      <Input
                        id="contactPerson"
                        value={vendorForm.contactPerson}
                        onChange={(e) => setVendorForm({ ...vendorForm, contactPerson: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={vendorForm.email}
                        onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capabilities">Capabilities (comma-separated)</Label>
                    <Input
                      id="capabilities"
                      value={vendorForm.capabilities}
                      onChange={(e) => setVendorForm({ ...vendorForm, capabilities: e.target.value })}
                      placeholder="e.g., CNC, Injection Molding, Sheet Metal"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="leadTimeDays">Lead Time (days)</Label>
                      <Input
                        id="leadTimeDays"
                        type="number"
                        value={vendorForm.leadTimeDays}
                        onChange={(e) => setVendorForm({ ...vendorForm, leadTimeDays: parseInt(e.target.value) })}
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paymentTerms">Payment Terms</Label>
                      <Select
                        value={vendorForm.paymentTerms}
                        onValueChange={(value) => setVendorForm({ ...vendorForm, paymentTerms: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select terms" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PREPAID">Prepaid</SelectItem>
                          <SelectItem value="NET15">NET 15</SelectItem>
                          <SelectItem value="NET30">NET 30</SelectItem>
                          <SelectItem value="NET60">NET 60</SelectItem>
                          <SelectItem value="COD">Cash on Delivery</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateVendorDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateVendor}>Create Vendor</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalVendors || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contract Manufacturers</CardTitle>
              <Factory className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.contractManufacturers || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeOrders || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Outsourced</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats?.totalOutsourcedValue || 0)}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="vendors">Vendors</TabsTrigger>
            <TabsTrigger value="orders">Outsourced Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="vendors" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Vendors & Contract Manufacturers</CardTitle>
                <CardDescription>Manage supplier relationships and performance</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading vendors...</div>
                ) : vendors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No vendors found. Add your first vendor to get started.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead>Quality</TableHead>
                        <TableHead>On-Time %</TableHead>
                        <TableHead>Lead Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendors.map((vendor) => (
                        <TableRow key={vendor.id}>
                          <TableCell className="font-medium">{vendor.code}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{vendor.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {vendor.capabilities?.slice(0, 2).join(', ')}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{getSupplierTypeBadge(vendor.supplierType)}</TableCell>
                          <TableCell>{getTierBadge(vendor.vendorTier)}</TableCell>
                          <TableCell>{renderStars(vendor.qualityRating)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span className={vendor.onTimeDelivery >= 90 ? 'text-green-600' : vendor.onTimeDelivery >= 70 ? 'text-yellow-600' : 'text-red-600'}>
                                {vendor.onTimeDelivery?.toFixed(0) || 100}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{vendor.leadTimeDays || '-'} days</TableCell>
                          <TableCell>
                            <Badge className={vendor.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {vendor.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedVendor(vendor)
                                  setViewVendorDialogOpen(true)
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Outsourced Manufacturing Orders</CardTitle>
                <CardDescription>Track work sent to contract manufacturers</CardDescription>
              </CardHeader>
              <CardContent>
                {vendorOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No outsourced orders found.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>VO Number</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendorOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.vendorOrderId}</TableCell>
                          <TableCell>{order.title}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{order.vendor.name}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{order.outsourceType}</Badge>
                          </TableCell>
                          <TableCell>{order.quantity} {order.unit || ''}</TableCell>
                          <TableCell>{formatCurrency(order.totalPrice)}</TableCell>
                          <TableCell>{formatDate(order.promisedDate)}</TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={viewVendorDialogOpen} onOpenChange={setViewVendorDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Vendor Details</DialogTitle>
              <DialogDescription>
                {selectedVendor?.code} - {selectedVendor?.name}
              </DialogDescription>
            </DialogHeader>
            {selectedVendor && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Type</p>
                    <p>{getSupplierTypeBadge(selectedVendor.supplierType)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Tier</p>
                    <p>{getTierBadge(selectedVendor.vendorTier)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 border-t pt-4">
                  <div>
                    <p className="text-sm font-medium">Quality Rating</p>
                    {renderStars(selectedVendor.qualityRating)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Delivery Rating</p>
                    {renderStars(selectedVendor.deliveryRating)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Price Rating</p>
                    {renderStars(selectedVendor.priceRating)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <div>
                    <p className="text-sm font-medium">On-Time Delivery</p>
                    <p className="text-2xl font-bold">{selectedVendor.onTimeDelivery?.toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Total Orders</p>
                    <p className="text-2xl font-bold">{selectedVendor.totalOrders}</p>
                  </div>
                </div>

                {selectedVendor.capabilities?.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Capabilities</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedVendor.capabilities.map((cap, index) => (
                        <Badge key={index} variant="outline">{cap}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedVendor.certifications && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Certifications</p>
                    <p className="text-sm">{selectedVendor.certifications}</p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">Contact Information</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Contact Person</p>
                      <p>{selectedVendor.contactPerson || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p>{selectedVendor.email || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p>{selectedVendor.phone || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Address</p>
                      <p>{selectedVendor.address || '-'}</p>
                    </div>
                  </div>
                </div>

                {selectedVendor.vendorOrders.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Recent Orders</p>
                    <div className="space-y-2">
                      {selectedVendor.vendorOrders.map((order) => (
                        <div key={order.id} className="flex justify-between items-center p-2 bg-muted rounded">
                          <span className="font-medium">{order.vendorOrderId}</span>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(order.status)}
                            <span className="text-sm">{formatCurrency(order.totalPrice)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewVendorDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}