'use client'

import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, RefreshCw, ShoppingCart, Eye, Edit, Check, X } from 'lucide-react'
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

interface PurchaseRequest {
  id: string
  prNumber: string
  title: string
  description?: string
  status: string
  priority: string
  estimatedAmount: number
  currency: string
  supplier?: string
  preparedBy?: string
  approvedBy?: string
  createdAt: string
  updatedAt: string
  items: PurchaseRequestItem[]
}

interface PurchaseRequestItem {
  id: string
  materialId?: string
  name: string
  partNumber?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  unit?: string
  status: string
  receivedQty: number
  notes?: string
}

export default function PurchaseRequestsPage() {
  const { toast } = useToast()
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedPR, setSelectedPR] = useState<PurchaseRequest | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    materialName: '',
    partNumber: '',
    quantity: 1,
    unit: 'pcs',
    unitPrice: 0,
    supplier: '',
  })

  const fetchPurchaseRequests = async () => {
    try {
      const response = await fetch('/api/purchase-requests')
      const data = await response.json()
      setPurchaseRequests(data.purchaseRequests || [])
    } catch (error) {
      console.error('Error fetching purchase requests:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch purchase requests',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPurchaseRequests()
  }, [])

  const getStatusBadge = (status: string) => {
    const config: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      ORDERED: 'bg-blue-100 text-blue-800',
      RECEIVED: 'bg-purple-100 text-purple-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
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

  const handleCreatePR = async () => {
    try {
      const response = await fetch('/api/purchase-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          supplier: formData.supplier,
          items: [
            {
              name: formData.materialName,
              partNumber: formData.partNumber,
              description: formData.description,
              quantity: formData.quantity,
              unit: formData.unit,
              unitPrice: formData.unitPrice,
            },
          ],
        }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Purchase request created successfully',
        })
        setCreateDialogOpen(false)
        setFormData({
          title: '',
          description: '',
          priority: 'MEDIUM',
          materialName: '',
          partNumber: '',
          quantity: 1,
          unit: 'pcs',
          unitPrice: 0,
          supplier: '',
        })
        fetchPurchaseRequests()
      } else {
        throw new Error('Failed to create purchase request')
      }
    } catch (error) {
      console.error('Error creating purchase request:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create purchase request',
      })
    }
  }

  const handleApprovePR = async (id: string) => {
    try {
      const response = await fetch(`/api/purchase-requests/${id}/approve`, {
        method: 'POST',
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Purchase request approved',
        })
        fetchPurchaseRequests()
      } else {
        throw new Error('Failed to approve purchase request')
      }
    } catch (error) {
      console.error('Error approving purchase request:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to approve purchase request',
      })
    }
  }

  const handleRejectPR = async (id: string) => {
    try {
      const response = await fetch(`/api/purchase-requests/${id}/reject`, {
        method: 'POST',
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Purchase request rejected',
        })
        fetchPurchaseRequests()
      } else {
        throw new Error('Failed to reject purchase request')
      }
    } catch (error) {
      console.error('Error rejecting purchase request:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reject purchase request',
      })
    }
  }

  const handleReceiveGoods = async (id: string) => {
    try {
      const response = await fetch(`/api/purchase-requests/${id}/receive`, {
        method: 'POST',
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Goods receipt recorded',
        })
        fetchPurchaseRequests()
      } else {
        throw new Error('Failed to record goods receipt')
      }
    } catch (error) {
      console.error('Error recording goods receipt:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to record goods receipt',
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Purchase Requests</h1>
            <p className="text-muted-foreground mt-1">Manage material procurement requests</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchPurchaseRequests} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Purchase Request
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Purchase Request</DialogTitle>
                  <DialogDescription>Submit a new purchase request for materials</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Purchase request title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) => setFormData({ ...formData, priority: value })}
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
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe the purpose of this purchase request"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="materialName">Material Name</Label>
                      <Input
                        id="materialName"
                        value={formData.materialName}
                        onChange={(e) => setFormData({ ...formData, materialName: e.target.value })}
                        placeholder="Material name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="partNumber">Part Number</Label>
                      <Input
                        id="partNumber"
                        value={formData.partNumber}
                        onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                        placeholder="Part number"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                        min="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit">Unit</Label>
                      <Input
                        id="unit"
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        placeholder="pcs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unitPrice">Unit Price</Label>
                      <Input
                        id="unitPrice"
                        type="number"
                        value={formData.unitPrice}
                        onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) })}
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supplier">Supplier</Label>
                      <Input
                        id="supplier"
                        value={formData.supplier}
                        onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                        placeholder="Supplier name"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreatePR}>Create Request</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{purchaseRequests.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <ShoppingCart className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {purchaseRequests.filter((pr) => pr.status === 'PENDING_APPROVAL').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <ShoppingCart className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {purchaseRequests.filter((pr) => pr.status === 'APPROVED').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <ShoppingCart className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(purchaseRequests.reduce((sum, pr) => sum + pr.estimatedAmount, 0))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Purchase Requests</CardTitle>
            <CardDescription>View and manage all purchase requests</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading purchase requests...</div>
            ) : purchaseRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No purchase requests found. Create your first purchase request to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PR Number</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseRequests.map((pr) => (
                    <TableRow key={pr.id}>
                      <TableCell className="font-medium">{pr.prNumber}</TableCell>
                      <TableCell>{pr.title}</TableCell>
                      <TableCell>{getStatusBadge(pr.status)}</TableCell>
                      <TableCell>{getPriorityBadge(pr.priority)}</TableCell>
                      <TableCell>{formatCurrency(pr.estimatedAmount)}</TableCell>
                      <TableCell>{pr.preparedBy || '-'}</TableCell>
                      <TableCell>{formatDate(pr.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPR(pr)
                              setViewDialogOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {pr.status === 'PENDING_APPROVAL' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleApprovePR(pr.id)}
                              >
                                <Check className="h-4 w-4 text-green-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRejectPR(pr.id)}
                              >
                                <X className="h-4 w-4 text-red-500" />
                              </Button>
                            </>
                          )}
                          {pr.status === 'APPROVED' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReceiveGoods(pr.id)}
                            >
                              Receive
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

        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Purchase Request Details</DialogTitle>
              <DialogDescription>
                {selectedPR?.prNumber} - {selectedPR?.title}
              </DialogDescription>
            </DialogHeader>
            {selectedPR && (
              <div className="space-y-4 overflow-hidden">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p>{getStatusBadge(selectedPR.status)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Priority</p>
                    <p>{getPriorityBadge(selectedPR.priority)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Requested By</p>
                    <p className="break-words">{selectedPR.preparedBy || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Date</p>
                    <p>{formatDate(selectedPR.createdAt)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Description</p>
                  <p className="text-sm text-muted-foreground break-words">{selectedPR.description || 'No description provided'}</p>
                </div>
                <div className="overflow-x-auto">
                  <p className="text-sm font-medium mb-2">Items</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[150px]">Material</TableHead>
                        <TableHead className="w-[100px]">Part Number</TableHead>
                        <TableHead className="w-[100px]">Quantity</TableHead>
                        <TableHead className="w-[120px]">Unit Price</TableHead>
                        <TableHead className="w-[120px]">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedPR.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="truncate max-w-[150px]">{item.name}</TableCell>
                          <TableCell className="truncate">{item.partNumber || '-'}</TableCell>
                          <TableCell>
                            {item.quantity} {item.unit}
                          </TableCell>
                          <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(item.totalPrice)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex justify-between items-center border-t pt-4">
                  <div>
                    <p className="text-sm font-medium">Total Amount</p>
                    <p className="text-lg font-bold">{formatCurrency(selectedPR.estimatedAmount)}</p>
                  </div>
                  {selectedPR.approvedBy && (
                    <div>
                      <p className="text-xs text-muted-foreground">Approved By</p>
                      <p className="text-sm break-words">{selectedPR.approvedBy}</p>
                    </div>
                  )}
                </div>
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