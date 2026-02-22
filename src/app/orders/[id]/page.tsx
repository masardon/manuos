'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeft,
  FileText,
  Wrench,
  User,
  Clock,
  Calendar,
  CheckCircle,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  AlertCircle,
  TrendingUp,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  description: string | null
  status: string
  progressPercent: number
  plannedStartDate: string
  plannedEndDate: string
  jobsheetsCount: number
}

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  description: string | null
  status: string
  progressPercent: number
  plannedStartDate: string
  plannedEndDate: string
  actualStartDate: string | null
  actualEndDate: string | null
  manufacturingOrders: ManufacturingOrder[]
}

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<Order | null>(null)
  const [machines, setMachines] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  
  // MO dialog state
  const [isMODialogOpen, setIsMODialogOpen] = useState(false)
  const [editingMO, setEditingMO] = useState<ManufacturingOrder | null>(null)
  const [moForm, setMOForm] = useState({
    moNumber: '',
    name: '',
    description: '',
    plannedStartDate: '',
    plannedEndDate: '',
  })

  useEffect(() => {
    fetchOrder()
    fetchMachines()
    fetchUsers()
  }, [params.id])

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data.order)
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Order not found',
        })
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load order details',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchMachines = async () => {
    try {
      const response = await fetch('/api/machines')
      if (response.ok) {
        const data = await response.json()
        setMachines(data.machines || [])
      }
    } catch (error) {
      console.error('Error fetching machines:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const handleAddMO = () => {
    setEditingMO(null)
    const nextNum = (order?.manufacturingOrders.length || 0) + 1
    setMOForm({
      moNumber: `MO-${nextNum.toString().padStart(3, '0')}`,
      name: '',
      description: '',
      plannedStartDate: '',
      plannedEndDate: '',
    })
    setIsMODialogOpen(true)
  }

  const handleEditMO = (mo: ManufacturingOrder) => {
    setEditingMO(mo)
    setMOForm({
      moNumber: mo.moNumber,
      name: mo.name,
      description: mo.description || '',
      plannedStartDate: mo.plannedStartDate,
      plannedEndDate: mo.plannedEndDate,
    })
    setIsMODialogOpen(true)
  }

  const handleDeleteMO = async (moId: string, moNumber: string) => {
    if (!confirm(`Are you sure you want to delete MO ${moNumber}?`)) return

    try {
      const response = await fetch(`/api/mo/${moId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'MO deleted successfully',
        })
        await fetchOrder()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete MO')
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete MO',
      })
    }
  }

  // Check if MO can be edited/deleted (only if still in PLANNED status)
  const canEditMO = (mo: ManufacturingOrder) => {
    // Can only edit/delete if MO is still in PLANNED status
    return mo.status === 'PLANNED'
  }

  const handleSaveMO = async () => {
    try {
      const url = editingMO
        ? `/api/mo/${editingMO.id}`
        : `/api/orders/${params.id}/mo`

      const response = await fetch(url, {
        method: editingMO ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moForm),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: editingMO ? 'MO updated successfully' : 'MO created successfully',
        })
        setIsMODialogOpen(false)
        await fetchOrder()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save MO')
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save MO',
      })
    }
  }

  const handleSubmitForReview = async () => {
    if (!confirm('Submit this order for customer review? The order cannot be edited once submitted.')) return

    try {
      const response = await fetch(`/api/orders/${params.id}/review`, {
        method: 'POST',
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Order submitted for customer review',
        })
        await fetchOrder()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit for review')
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to submit for review',
      })
    }
  }

  const handleApproveOrder = async () => {
    if (!confirm('Approve this order for production? This action cannot be undone.')) return

    try {
      const response = await fetch(`/api/orders/${params.id}/approve`, {
        method: 'POST',
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Order approved for production',
        })
        await fetchOrder()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to approve order')
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to approve order',
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PLANNING: 'bg-blue-100 text-blue-800',
      MATERIAL_PREPARATION: 'bg-indigo-100 text-indigo-800',
      IN_PRODUCTION: 'bg-orange-100 text-orange-800',
      COMPLETED: 'bg-green-100 text-green-800',
      DELIVERED: 'bg-purple-100 text-purple-800',
      CANCELLED: 'bg-red-100 text-red-800',
    }
    return <Badge className={config[status] || 'bg-gray-100 text-gray-800'}>{status.replace(/_/g, ' ')}</Badge>
  }

  const getMOStatusColor = (status: string) => {
    if (status === 'COMPLETED') return 'bg-green-500'
    if (status === 'IN_PROGRESS') return 'bg-emerald-500'
    if (status === 'PLANNED') return 'bg-blue-500'
    return 'bg-slate-400'
  }

  const formatDateTime = (dateTimeString: string | null) => {
    if (!dateTimeString) return '-'
    return new Date(dateTimeString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  // Get actual start date from earliest MO start
  const getActualStartDate = () => {
    if (!order) return null
    
    const mosWithStart = order.manufacturingOrders.filter(mo => mo.plannedStartDate)
    if (mosWithStart.length === 0) return null
    
    const earliest = mosWithStart.reduce((earliest, current) => {
      return new Date(current.plannedStartDate) < new Date(earliest.plannedStartDate) ? current : earliest
    })
    
    return earliest.plannedStartDate
  }

  // Get actual end date - only if ALL MOs are completed
  const getActualEndDate = () => {
    if (!order) return null
    
    const allCompleted = order.manufacturingOrders.every(mo => mo.status === 'COMPLETED')
    if (!allCompleted) return null
    
    const mosWithEnd = order.manufacturingOrders.filter(mo => mo.plannedEndDate)
    if (mosWithEnd.length === 0) return null
    
    const latest = mosWithEnd.reduce((latest, current) => {
      return new Date(current.plannedEndDate) > new Date(latest.plannedEndDate) ? current : latest
    })
    
    return latest.plannedEndDate
  }

  if (loading) {
    return (
      <AppLayout title="Order Details">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading order details...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!order) {
    return (
      <AppLayout title="Order Not Found">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Order not found</p>
            <Button onClick={() => router.push('/orders')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Order Details">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/orders')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">{order.orderNumber}</Badge>
                {getStatusBadge(order.status)}
              </div>
              <h1 className="text-3xl font-bold">{order.customerName}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/orders/${params.id}/gantt`)}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Gantt Chart
            </Button>
            <Button variant="outline" onClick={fetchOrder} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {order.status === 'DRAFT' && (
              <Button onClick={handleSubmitForReview} size="sm" className="bg-black text-white hover:bg-black/90">
                Submit for Review
              </Button>
            )}
            {order.status === 'MATERIAL_PREPARATION' && (
              <Button onClick={handleApproveOrder} size="sm" className="bg-black text-white hover:bg-black/90">
                Approve for Production
              </Button>
            )}
          </div>
        </div>

        {/* Progress Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Progress Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Overall Progress</span>
                <span className="text-lg font-bold">{order.progressPercent}%</span>
              </div>
              <Progress value={order.progressPercent} className="h-3" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <div className="text-xs text-muted-foreground">Status</div>
                  <div className="font-medium">{order.status.replace(/_/g, ' ')}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">MOs</div>
                  <div className="font-medium">{order.manufacturingOrders.length} total</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Completed</div>
                  <div className="font-medium">{order.manufacturingOrders.filter(mo => mo.status === 'COMPLETED').length}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">In Progress</div>
                  <div className="font-medium">{order.manufacturingOrders.filter(mo => mo.status === 'IN_PROGRESS').length}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">Customer Name</div>
                <div className="font-medium">{order.customerName}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Email</div>
                <div className="font-medium">{order.customerEmail || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Phone</div>
                <div className="font-medium">{order.customerPhone || '-'}</div>
              </div>
            </div>
            {order.status === 'MATERIAL_PREPARATION' && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-blue-900 dark:text-blue-100">Awaiting Customer Approval</div>
                    <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      This order has been submitted for customer review. Once approved, it will proceed to production.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Planned Start
                </div>
                <div className="font-medium mt-1">{formatDateTime(order.plannedStartDate)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Planned End
                </div>
                <div className="font-medium mt-1">{formatDateTime(order.plannedEndDate)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Actual Start
                </div>
                <div className="font-medium mt-1">{formatDateTime(getActualStartDate())}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Actual End
                </div>
                <div className="font-medium mt-1">{formatDateTime(getActualEndDate())}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manufacturing Orders List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Manufacturing Orders</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{order.manufacturingOrders.length} MOs</Badge>
                <Button onClick={handleAddMO} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add MO
                </Button>
              </div>
            </div>
            <CardDescription>Production batches and jobsheets</CardDescription>
          </CardHeader>
          <CardContent>
            {order.manufacturingOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No manufacturing orders for this order</p>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {order.manufacturingOrders.map((mo) => (
                    <div key={mo.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{mo.moNumber}</Badge>
                          <span className="font-semibold">{mo.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => router.push(`/mo/${mo.id}`)}
                            title="View MO Details"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditMO(mo)}
                            disabled={!canEditMO(mo)}
                            title={canEditMO(mo) ? 'Edit MO' : 'Cannot edit - MO has been processed'}
                          >
                            <Edit className={`h-4 w-4 ${!canEditMO(mo) ? 'text-muted-foreground' : ''}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteMO(mo.id, mo.moNumber)}
                            disabled={!canEditMO(mo)}
                            title={canEditMO(mo) ? 'Delete MO' : 'Cannot delete - MO has been processed'}
                          >
                            <Trash2 className={`h-4 w-4 ${!canEditMO(mo) ? 'text-muted-foreground' : ''}`} />
                          </Button>
                          <div className={`w-2 h-2 rounded-full ${getMOStatusColor(mo.status)}`} />
                          <Badge variant="outline">{mo.status.replace(/_/g, ' ')}</Badge>
                        </div>
                      </div>

                      {mo.description && (
                        <p className="text-sm text-muted-foreground mb-3">{mo.description}</p>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                        <div>
                          <div className="text-xs text-muted-foreground">Jobsheets</div>
                          <div className="font-medium text-sm">{mo.jobsheetsCount}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Progress</div>
                          <div className="font-medium text-sm">{mo.progressPercent}%</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Status</div>
                          <div className="font-medium text-sm">{mo.status.replace(/_/g, ' ')}</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-semibold">{mo.progressPercent}%</span>
                        </div>
                        <Progress value={mo.progressPercent} className="h-2" />
                      </div>

                      <div className="mt-3 pt-3 border-t">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            Start: {formatDateTime(mo.plannedStartDate)}
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            End: {formatDateTime(mo.plannedEndDate)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* MO Dialog */}
        <Dialog open={isMODialogOpen} onOpenChange={setIsMODialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMO ? 'Edit Manufacturing Order' : 'Add New Manufacturing Order'}
              </DialogTitle>
              <DialogDescription>
                {editingMO ? 'Update MO details' : 'Create a new MO for this order'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="moNumber">MO Number *</Label>
                <Input
                  id="moNumber"
                  value={moForm.moNumber}
                  onChange={(e) => setMOForm({ ...moForm, moNumber: e.target.value })}
                  placeholder="e.g., MO-001"
                  disabled={!!editingMO}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="moName">MO Name *</Label>
                <Input
                  id="moName"
                  value={moForm.name}
                  onChange={(e) => setMOForm({ ...moForm, name: e.target.value })}
                  placeholder="e.g., Frame Assembly"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="moDescription">Description</Label>
                <Textarea
                  id="moDescription"
                  value={moForm.description}
                  onChange={(e) => setMOForm({ ...moForm, description: e.target.value })}
                  placeholder="MO description..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plannedStart">Planned Start Date</Label>
                  <Input
                    id="plannedStart"
                    type="date"
                    value={moForm.plannedStartDate}
                    onChange={(e) => setMOForm({ ...moForm, plannedStartDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plannedEnd">Planned End Date</Label>
                  <Input
                    id="plannedEnd"
                    type="date"
                    value={moForm.plannedEndDate}
                    onChange={(e) => setMOForm({ ...moForm, plannedEndDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsMODialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveMO} disabled={!moForm.moNumber.trim() || !moForm.name.trim()}>
                {editingMO ? 'Update MO' : 'Create MO'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
