'use client'

import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Layers, CheckCircle, AlertCircle, Clock, Eye, ShoppingCart, Plus } from 'lucide-react'
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
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface MaterialRequirement {
  id: string
  moId: string
  partNumber: string
  name: string
  inventory?: { id: string; name: string; partNumber?: string; availableQty?: number; location?: string } | null
  manufacturingOrder?: { moNumber: string; status: string }
  requiredQty: number
  reservedQty: number
  consumedQty: number
  requestedQty: number
  unit?: string
  status: string
  priority: number
  requiredDate?: string
  reservations: InventoryReservation[]
  purchaseRequestItems: PurchaseRequestItem[]
}

interface InventoryReservation {
  id: string
  inventoryId: string
  quantity: number
  status: string
  inventory?: { batch?: string; shelf?: { code: string } }
}

interface PurchaseRequestItem {
  id: string
  purchaseRequestId: string
  purchaseRequest?: { prNumber: string; status: string }
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface InventoryReservation {
  id: string
  inventoryId: string
  quantity: number
  status: string
  inventory?: { batch?: string; quantity: number; shelf?: { code: string } }
}

interface PurchaseRequestItem {
  id: string
  purchaseRequestId: string
  purchaseRequest?: { prNumber: string; status: string }
  quantity: number
  unitPrice: number
  totalPrice: number
}

export default function MaterialRequirementsPage() {
  const { toast } = useToast()
  const [requirements, setRequirements] = useState<MaterialRequirement[]>([])
  const [mos, setMos] = useState<any[]>([])
  const [selectedMOId, setSelectedMOId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [selectedRequirement, setSelectedRequirement] = useState<MaterialRequirement | null>(null)
  const [addMaterialForm, setAddMaterialForm] = useState({
    partNumber: '',
    name: '',
    requiredQty: 1,
    unit: 'pcs',
    requiredDate: new Date().toISOString().split('T')[0],
    priority: 'MEDIUM',
  })

  const fetchRequirements = async (moId?: string) => {
    if (!moId) {
      setRequirements([])
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch(`/api/mo/${moId}/materials`)
      const data = await response.json()
      setRequirements(data.requirements || [])
    } catch (error) {
      console.error('Error fetching requirements:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch material requirements',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchMOs = async () => {
    try {
      const response = await fetch('/api/mo')
      const data = await response.json()
      setMos(data.mos || [])
    } catch (error) {
      console.error('Error fetching MOs:', error)
    }
  }

  const handleAddMaterial = async () => {
    if (!selectedMOId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a Manufacturing Order first',
      })
      return
    }

    try {
      const response = await fetch(`/api/mo/${selectedMOId}/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materials: [{
            partNumber: addMaterialForm.partNumber,
            name: addMaterialForm.name,
            requiredQty: addMaterialForm.requiredQty,
            unit: addMaterialForm.unit,
            requiredDate: new Date(addMaterialForm.requiredDate).toISOString(),
            priority: addMaterialForm.priority === 'HIGH' ? 1 : addMaterialForm.priority === 'MEDIUM' ? 5 : 10,
          }],
        }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Material requirement added successfully',
        })
        setAddDialogOpen(false)
        setAddMaterialForm({
          partNumber: '',
          name: '',
          requiredQty: 1,
          unit: 'pcs',
          requiredDate: new Date().toISOString().split('T')[0],
          priority: 'MEDIUM',
        })
        fetchRequirements(selectedMOId)
      } else {
        throw new Error('Failed to add material')
      }
    } catch (error) {
      console.error('Error adding material:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add material requirement',
      })
    }
  }

  const handleRunMRP = async () => {
    if (!selectedMOId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a Manufacturing Order first',
      })
      return
    }

    try {
      toast({
        title: 'Running MRP...',
        description: 'Calculating material requirements from BOM',
      })

      const response = await fetch(`/api/mo/${selectedMOId}/mrp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'full-mrp' }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: 'MRP Complete',
          description: `Reserved: ${data.reservation?.reserved || 0} | PR Created: ${data.purchaseRequest?.prCreated ? 'Yes' : 'No'}`,
        })
        fetchRequirements(selectedMOId)
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to run MRP')
      }
    } catch (error: any) {
      console.error('MRP error:', error)
      toast({
        variant: 'destructive',
        title: 'MRP Error',
        description: error.message || 'Failed to run MRP calculation',
      })
    }
  }

  const handleCalculateMRP = async () => {
    if (!selectedMOId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a Manufacturing Order first',
      })
      return
    }

    try {
      const response = await fetch(`/api/mo/${selectedMOId}/mrp`)
      if (response.ok) {
        const data = await response.json()
        toast({
          title: 'MRP Calculation',
          description: `Materials: ${data.summary?.totalMaterials || 0} | Need Purchase: ${data.summary?.needsPurchase || 0}`,
        })
      }
    } catch (error) {
      console.error('MRP calculation error:', error)
    }
  }

  useEffect(() => {
    fetchMOs()
  }, [])

  useEffect(() => {
    if (selectedMOId) {
      fetchRequirements(selectedMOId)
    } else {
      setRequirements([])
    }
  }, [selectedMOId])

  const getStatusBadge = (status: string) => {
    const config: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PARTIALLY_RESERVED: 'bg-blue-100 text-blue-800',
      RESERVED: 'bg-green-100 text-green-800',
      PURCHASE_NEEDED: 'bg-orange-100 text-orange-800',
      CONSUMED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
    }
    return <Badge className={config[status] || 'bg-gray-100 text-gray-800'}>{status.replace(/_/g, ' ')}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, string> = {
      LOW: 'bg-gray-100 text-gray-800',
      MEDIUM: 'bg-blue-100 text-blue-800',
      HIGH: 'bg-orange-100 text-orange-800',
      URGENT: 'bg-red-100 text-red-800',
    }
    return <Badge className={config[priority] || 'bg-gray-100 text-gray-800'}>{priority}</Badge>
  }

  const filteredRequirements = requirements.filter((req) => {
    if (activeTab === 'all') return true
    if (activeTab === 'reserved') return req.status === 'RESERVED'
    if (activeTab === 'purchase-needed') return req.status === 'PURCHASE_REQUESTED' || req.requestedQty > 0
    if (activeTab === 'pending') return req.status === 'PLANNED'
    return true
  })

  const stats = {
    total: requirements.length,
    reserved: requirements.filter((r) => r.status === 'RESERVED').length,
    purchaseNeeded: requirements.filter((r) => r.status === 'PURCHASE_REQUESTED').length,
    pending: requirements.filter((r) => r.status === 'PLANNED').length,
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
            <h1 className="text-4xl font-bold tracking-tight">Material Requirements</h1>
            <p className="text-muted-foreground mt-1">Material requirements planning (MRP) for manufacturing orders</p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedMOId} onValueChange={setSelectedMOId}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Select Manufacturing Order" />
              </SelectTrigger>
              <SelectContent>
                {mos.map((mo) => (
                  <SelectItem key={mo.id} value={mo.id}>
                    {mo.moNumber} - {mo.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => selectedMOId && fetchRequirements(selectedMOId)} disabled={loading || !selectedMOId}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleCalculateMRP} disabled={!selectedMOId}>
              Calculate MRP
            </Button>
            <Button onClick={handleRunMRP} disabled={!selectedMOId} className="bg-green-600 hover:bg-green-700">
              Run MRP & Reserve
            </Button>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <Button onClick={() => setAddDialogOpen(true)} disabled={!selectedMOId}>
                <Plus className="h-4 w-4 mr-2" />
                Add Material
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Material Requirement</DialogTitle>
                  <DialogDescription>
                    Add a new material requirement to this Manufacturing Order
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="partNumber">Part Number</Label>
                      <Input
                        id="partNumber"
                        value={addMaterialForm.partNumber}
                        onChange={(e) => setAddMaterialForm({ ...addMaterialForm, partNumber: e.target.value })}
                        placeholder="e.g., MAT-001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Material Name</Label>
                      <Input
                        id="name"
                        value={addMaterialForm.name}
                        onChange={(e) => setAddMaterialForm({ ...addMaterialForm, name: e.target.value })}
                        placeholder="e.g., Steel Plate"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="requiredQty">Quantity</Label>
                      <Input
                        id="requiredQty"
                        type="number"
                        value={addMaterialForm.requiredQty}
                        onChange={(e) => setAddMaterialForm({ ...addMaterialForm, requiredQty: parseFloat(e.target.value) })}
                        min="0.01"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit">Unit</Label>
                      <Input
                        id="unit"
                        value={addMaterialForm.unit}
                        onChange={(e) => setAddMaterialForm({ ...addMaterialForm, unit: e.target.value })}
                        placeholder="pcs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={addMaterialForm.priority}
                        onValueChange={(value) => setAddMaterialForm({ ...addMaterialForm, priority: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="URGENT">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="requiredDate">Required Date</Label>
                    <Input
                      id="requiredDate"
                      type="date"
                      value={addMaterialForm.requiredDate}
                      onChange={(e) => setAddMaterialForm({ ...addMaterialForm, requiredDate: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddMaterial}>Add Material</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requirements</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reserved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.reserved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Need Purchase</CardTitle>
              <ShoppingCart className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.purchaseNeeded}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="reserved">Reserved</TabsTrigger>
            <TabsTrigger value="purchase-needed">Need Purchase</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Material Requirements</CardTitle>
                <CardDescription>
                  {activeTab === 'all' && 'All material requirements for manufacturing orders'}
                  {activeTab === 'reserved' && 'Materials fully reserved from stock'}
                  {activeTab === 'purchase-needed' && 'Materials requiring purchase orders'}
                  {activeTab === 'pending' && 'Materials pending reservation or purchase'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading requirements...</div>
                ) : !selectedMOId ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Select a Manufacturing Order above to view and manage material requirements.
                  </div>
                ) : filteredRequirements.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No material requirements found for this MO. Click "Add Material" to add one.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Required</TableHead>
                        <TableHead>Available Stock</TableHead>
                        <TableHead>Reserved</TableHead>
                        <TableHead>To Purchase</TableHead>
                        <TableHead>Consumed</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRequirements.map((req) => {
                        const availableStock = req.inventory?.availableQty || 0
                        const shortage = req.requiredQty - availableStock - req.reservedQty
                        return (
                        <TableRow key={req.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{req.name || '-'}</p>
                              <p className="text-xs text-muted-foreground">
                                {req.partNumber || ''}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {req.requiredQty.toFixed(2)} {req.unit || ''}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span className={availableStock >= req.requiredQty ? 'text-green-600 font-medium' : availableStock > 0 ? 'text-yellow-600' : 'text-red-600'}>
                                {availableStock.toFixed(2)} {req.unit || ''}
                              </span>
                              {availableStock >= req.requiredQty ? (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              ) : (
                                <AlertCircle className="h-3 w-3 text-red-500" />
                              )}
                            </div>
                            {shortage > 0 && (
                              <p className="text-xs text-red-600">
                                Shortage: {shortage.toFixed(2)}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {req.reservedQty.toFixed(2)}
                              {req.reservedQty >= req.requiredQty && (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span className={req.requestedQty > 0 ? 'text-orange-600 font-medium' : ''}>
                                {req.requestedQty.toFixed(2)}
                              </span>
                              {req.requestedQty > 0 && (
                                <ShoppingCart className="h-3 w-3 text-orange-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {req.consumedQty.toFixed(2)} {req.unit || ''}
                          </TableCell>
                          <TableCell>{getStatusBadge(req.status)}</TableCell>
                          <TableCell>{formatDate(req.requiredDate)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRequirement(req)
                                setViewDialogOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Material Requirement Details</DialogTitle>
              <DialogDescription>
                {selectedRequirement?.name || 'Material'} - {selectedRequirement?.manufacturingOrder?.moNumber || 'MO'}
              </DialogDescription>
            </DialogHeader>
            {selectedRequirement && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p>{getStatusBadge(selectedRequirement.status)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Priority</p>
                    <p>{getPriorityBadge(String(selectedRequirement.priority))}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Quantity Required</p>
                    <p className="text-lg font-bold">{selectedRequirement.requiredQty} {selectedRequirement.unit || ''}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Due Date</p>
                    <p>{formatDate(selectedRequirement.requiredDate)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 border-t pt-4">
                  <div>
                    <p className="text-sm font-medium">Reserved</p>
                    <p className="text-lg font-bold text-green-600">{selectedRequirement.reservedQty}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Purchased</p>
                    <p className="text-lg font-bold text-orange-600">{selectedRequirement.requestedQty}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Consumed</p>
                    <p className="text-lg font-bold text-gray-600">{selectedRequirement.consumedQty}</p>
                  </div>
                </div>
                {selectedRequirement.reservations?.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Stock Reservations</p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Batch</TableHead>
                          <TableHead>Shelf</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedRequirement.reservations?.map((res) => (
                          <TableRow key={res.id}>
                            <TableCell>{res.inventory?.batch || '-'}</TableCell>
                            <TableCell>{res.inventory?.shelf?.code || '-'}</TableCell>
                            <TableCell>{res.quantity}</TableCell>
                            <TableCell>
                              <Badge className={res.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                {res.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                {selectedRequirement.purchaseRequestItems?.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Purchase Requests</p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>PR Number</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedRequirement.purchaseRequestItems?.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.purchaseRequest?.prNumber || '-'}</TableCell>
                            <TableCell>
                              <Badge className={item.purchaseRequest?.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                                {item.purchaseRequest?.status || '-'}
                              </Badge>
                            </TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>Rp {item.totalPrice.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}