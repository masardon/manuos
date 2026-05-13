'use client'

import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, RefreshCw, Shield, Eye, Check, X, AlertTriangle, Wrench, BarChart3 } from 'lucide-react'
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

interface QualityCheck {
  id: string
  qcNumber: string
  referenceType: string
  checkType: string
  inspectionStage: string
  partNumber: string
  productName: string
  batch?: string
  quantity: number
  unit?: string
  status: string
  passQuantity: number
  failQuantity: number
  reworkQuantity: number
  scrapQuantity: number
  defectCode?: string
  defectDescription?: string
  defectCategory?: string
  order?: { orderNumber: string; customerName: string }
  manufacturingOrder?: { moNumber: string }
  inspector?: { name: string; email: string }
  checkItems: QCItem[]
  reworkOrder?: { reworkNumber: string; status: string }
  customerApprovalRequired: boolean
  customerApproved: boolean
  createdAt: string
  completedAt?: string
}

interface QCItem {
  id: string
  criteriaCode: string
  criteriaName: string
  category: string
  specification?: string
  result?: string
  actualValue?: number
  defectCode?: string
  defectSeverity?: string
}

interface QCStats {
  total: number
  pending: number
  passed: number
  failed: number
  inRework: number
  passRate: number
  pendingReworks: number
}

interface ReworkOrder {
  id: string
  reworkNumber: string
  reworkType: string
  priority: string
  status: string
  partNumber: string
  productName: string
  quantity: number
  defectDescription: string
  assignedTo?: { name: string }
  qualityCheck?: { qcNumber: string }
  createdAt: string
}

export default function QualityControlPage() {
  const { toast } = useToast()
  const [qualityChecks, setQualityChecks] = useState<QualityCheck[]>([])
  const [reworkOrders, setReworkOrders] = useState<ReworkOrder[]>([])
  const [stats, setStats] = useState<QCStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('inspections')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedQC, setSelectedQC] = useState<QualityCheck | null>(null)
  const [resultDialogOpen, setResultDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    checkType: 'FINAL',
    inspectionStage: 'POST_PRODUCTION',
    referenceType: 'MO',
    partNumber: '',
    productName: '',
    batch: '',
    quantity: 1,
    unit: 'pcs',
    notes: '',
  })

  const fetchData = async () => {
    try {
      const [qcRes, reworkRes, statsRes] = await Promise.all([
        fetch('/api/quality-checks'),
        fetch('/api/rework-orders'),
        fetch('/api/quality-checks?stats=true'),
      ])
      const [qcData, reworkData, statsData] = await Promise.all([
        qcRes.json(),
        reworkRes.json(),
        statsRes.json(),
      ])
      setQualityChecks(qcData.qualityChecks || [])
      setReworkOrders(reworkData.reworkOrders || [])
      setStats(statsData.stats || null)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch quality control data',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getStatusBadge = (status: string) => {
    const config: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      PASSED: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
      REWORK: 'bg-orange-100 text-orange-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
      ON_HOLD: 'bg-purple-100 text-purple-800',
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

  const getCheckTypeBadge = (type: string) => {
    const config: Record<string, string> = {
      INCOMING: 'bg-blue-100 text-blue-800',
      IN_PROCESS: 'bg-yellow-100 text-yellow-800',
      FINAL: 'bg-green-100 text-green-800',
      CUSTOMER: 'bg-purple-100 text-purple-800',
      PERIODIC: 'bg-orange-100 text-orange-800',
    }
    return <Badge className={config[type] || 'bg-gray-100 text-gray-800'}>{type.replace(/_/g, ' ')}</Badge>
  }

  const handleCreateQC = async () => {
    try {
      const response = await fetch('/api/quality-checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          referenceId: formData.referenceType === 'MO' ? 'demo-mo' : 'demo-order',
        }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Quality check created successfully',
        })
        setCreateDialogOpen(false)
        setFormData({
          checkType: 'FINAL',
          inspectionStage: 'POST_PRODUCTION',
          referenceType: 'MO',
          partNumber: '',
          productName: '',
          batch: '',
          quantity: 1,
          unit: 'pcs',
          notes: '',
        })
        fetchData()
      } else {
        throw new Error('Failed to create quality check')
      }
    } catch (error) {
      console.error('Error creating quality check:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create quality check',
      })
    }
  }

  const handleRecordResult = async (id: string, passed: boolean) => {
    try {
      const response = await fetch(`/api/quality-checks/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record-result',
          overallStatus: passed ? 'PASSED' : 'FAILED',
          passQuantity: passed ? selectedQC?.quantity : 0,
          failQuantity: passed ? 0 : selectedQC?.quantity,
          reworkQuantity: passed ? 0 : selectedQC?.quantity,
          results: [],
        }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: passed ? 'QC passed' : 'QC failed - rework order created',
        })
        setResultDialogOpen(false)
        fetchData()
      } else {
        throw new Error('Failed to record result')
      }
    } catch (error) {
      console.error('Error recording result:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to record QC result',
      })
    }
  }

  const handleCustomerApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/quality-checks/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'customer-approve',
          approvedBy: 'Customer',
        }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Customer approved - ready for shipment',
        })
        fetchData()
      } else {
        throw new Error('Failed to approve')
      }
    } catch (error) {
      console.error('Error approving:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to approve by customer',
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

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Quality Control</h1>
            <p className="text-muted-foreground mt-1">Manage quality inspections and rework orders</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New QC Inspection
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Quality Check</DialogTitle>
                  <DialogDescription>Start a new quality inspection</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="checkType">Check Type</Label>
                      <Select
                        value={formData.checkType}
                        onValueChange={(value) => setFormData({ ...formData, checkType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INCOMING">Incoming Inspection</SelectItem>
                          <SelectItem value="IN_PROCESS">In-Process</SelectItem>
                          <SelectItem value="FINAL">Final Inspection</SelectItem>
                          <SelectItem value="CUSTOMER">Customer QC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inspectionStage">Stage</Label>
                      <Select
                        value={formData.inspectionStage}
                        onValueChange={(value) => setFormData({ ...formData, inspectionStage: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PRE_PRODUCTION">Pre-Production</SelectItem>
                          <SelectItem value="DURING_PRODUCTION">During Production</SelectItem>
                          <SelectItem value="POST_PRODUCTION">Post-Production</SelectItem>
                          <SelectItem value="PRE_SHIPMENT">Pre-Shipment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="partNumber">Part Number</Label>
                      <Input
                        id="partNumber"
                        value={formData.partNumber}
                        onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                        placeholder="e.g., FG-001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="productName">Product Name</Label>
                      <Input
                        id="productName"
                        value={formData.productName}
                        onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                        placeholder="Product name"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="batch">Batch</Label>
                      <Input
                        id="batch"
                        value={formData.batch}
                        onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                        placeholder="Batch number"
                      />
                    </div>
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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional notes or instructions"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateQC}>Create Inspection</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total QC</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.passRate || 0}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Shield className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pending || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reworks</CardTitle>
              <Wrench className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pendingReworks || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="inspections">QC Inspections</TabsTrigger>
            <TabsTrigger value="reworks">Rework Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="inspections" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Quality Inspections</CardTitle>
                <CardDescription>All quality control inspections</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading inspections...</div>
                ) : qualityChecks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No quality checks found. Create your first inspection to get started.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>QC Number</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Pass</TableHead>
                        <TableHead>Fail</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {qualityChecks.map((qc) => (
                        <TableRow key={qc.id}>
                          <TableCell className="font-medium">{qc.qcNumber}</TableCell>
                          <TableCell>{getCheckTypeBadge(qc.checkType)}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{qc.productName}</p>
                              <p className="text-xs text-muted-foreground">{qc.partNumber}</p>
                            </div>
                          </TableCell>
                          <TableCell>{qc.quantity} {qc.unit || ''}</TableCell>
                          <TableCell className="text-green-600">{qc.passQuantity}</TableCell>
                          <TableCell className="text-red-600">{qc.failQuantity}</TableCell>
                          <TableCell>{getStatusBadge(qc.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedQC(qc)
                                  setViewDialogOpen(true)
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {qc.status === 'PENDING' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedQC(qc)
                                      setResultDialogOpen(true)
                                    }}
                                    title="Record Result"
                                  >
                                    <Check className="h-4 w-4 text-green-500" />
                                  </Button>
                                </>
                              )}
                              {qc.status === 'PASSED' && qc.customerApprovalRequired && !qc.customerApproved && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCustomerApprove(qc.id)}
                                  title="Customer Approval"
                                >
                                  <Check className="h-4 w-4 text-blue-500" />
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
          </TabsContent>

          <TabsContent value="reworks" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Rework Orders</CardTitle>
                <CardDescription>Products requiring rework due to QC failures</CardDescription>
              </CardHeader>
              <CardContent>
                {reworkOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No rework orders found.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rework #</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Defect</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reworkOrders.map((rework) => (
                        <TableRow key={rework.id}>
                          <TableCell className="font-medium">{rework.reworkNumber}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{rework.reworkType}</Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{rework.productName}</p>
                              <p className="text-xs text-muted-foreground">{rework.partNumber}</p>
                            </div>
                          </TableCell>
                          <TableCell>{rework.quantity}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {rework.defectDescription}
                          </TableCell>
                          <TableCell>{getPriorityBadge(rework.priority)}</TableCell>
                          <TableCell>{getStatusBadge(rework.status)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
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
              <DialogTitle>Quality Check Details</DialogTitle>
              <DialogDescription>
                {selectedQC?.qcNumber} - {selectedQC?.productName}
              </DialogDescription>
            </DialogHeader>
            {selectedQC && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p>{getStatusBadge(selectedQC.status)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Check Type</p>
                    <p>{getCheckTypeBadge(selectedQC.checkType)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Part Number</p>
                    <p>{selectedQC.partNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Batch</p>
                    <p>{selectedQC.batch || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Quantity</p>
                    <p>{selectedQC.quantity} {selectedQC.unit || ''}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Inspector</p>
                    <p>{selectedQC.inspector?.name || '-'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-4 border-t pt-4">
                  <div>
                    <p className="text-sm font-medium">Pass</p>
                    <p className="text-2xl font-bold text-green-600">{selectedQC.passQuantity}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Fail</p>
                    <p className="text-2xl font-bold text-red-600">{selectedQC.failQuantity}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Rework</p>
                    <p className="text-2xl font-bold text-orange-600">{selectedQC.reworkQuantity}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Scrap</p>
                    <p className="text-2xl font-bold text-gray-600">{selectedQC.scrapQuantity}</p>
                  </div>
                </div>

                {selectedQC.defectCode && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Defect Information</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Code</p>
                        <p>{selectedQC.defectCode}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Category</p>
                        <p>{selectedQC.defectCategory || '-'}</p>
                      </div>
                    </div>
                    {selectedQC.defectDescription && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground">Description</p>
                        <p className="text-sm">{selectedQC.defectDescription}</p>
                      </div>
                    )}
                  </div>
                )}

                {selectedQC.reworkOrder && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Rework Order</p>
                    <div className="flex items-center gap-2">
                      <Badge>{selectedQC.reworkOrder.reworkNumber}</Badge>
                      {getStatusBadge(selectedQC.reworkOrder.status)}
                    </div>
                  </div>
                )}

                {selectedQC.customerApprovalRequired && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Customer Approval</p>
                    {selectedQC.customerApproved ? (
                      <Badge className="bg-green-100 text-green-800">Approved</Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800">Pending Approval</Badge>
                    )}
                  </div>
                )}

                {selectedQC.notes && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Notes</p>
                    <p className="text-sm text-muted-foreground">{selectedQC.notes}</p>
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

        <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record QC Result</DialogTitle>
              <DialogDescription>
                Record the inspection result for {selectedQC?.qcNumber}
              </DialogDescription>
            </DialogHeader>
            {selectedQC && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="font-medium">{selectedQC.productName}</p>
                  <p className="text-sm text-muted-foreground">
                    Quantity: {selectedQC.quantity} {selectedQC.unit || ''}
                  </p>
                </div>
                <div className="flex justify-center gap-4">
                  <Button
                    size="lg"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleRecordResult(selectedQC.id, true)}
                  >
                    <Check className="h-5 w-5 mr-2" />
                    PASS
                  </Button>
                  <Button
                    size="lg"
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleRecordResult(selectedQC.id, false)}
                  >
                    <X className="h-5 w-5 mr-2" />
                    FAIL
                  </Button>
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  FAIL will automatically create a rework order
                </p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setResultDialogOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}