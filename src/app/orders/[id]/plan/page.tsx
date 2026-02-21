'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Save, Calendar, Clock, CheckCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface Order {
  id: string
  orderNumber: string
  customerName: string
  status: string
  description: string
  plannedStartDate: string
  plannedEndDate: string
  notes: string
}

interface ManufacturingOrder {
  id: string
  moNumber: string
  name: string
  status: string
  plannedStartDate: string
  plannedEndDate: string
}

export default function OrderPlanningPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [order, setOrder] = useState<Order | null>(null)
  const [mos, setMos] = useState<ManufacturingOrder[]>([])
  const [newMO, setNewMO] = useState({
    name: '',
    plannedStartDate: '',
    plannedEndDate: '',
  })

  useEffect(() => {
    fetchOrderDetails()
  }, [params.id])

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders/${params.id}/approve`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data.order)
        setMos(data.order.manufacturingOrders || [])
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddMO = () => {
    if (!newMO.name || !newMO.plannedStartDate || !newMO.plannedEndDate) {
      toast({
        variant: 'destructive',
        title: 'Missing fields',
        description: 'Please fill in all MO fields',
      })
      return
    }

    const mo: ManufacturingOrder = {
      id: `temp-${Date.now()}`,
      moNumber: `${order?.orderNumber}-MO${(mos.length + 1).toString().padStart(3, '0')}`,
      name: newMO.name,
      status: 'PLANNED',
      plannedStartDate: newMO.plannedStartDate,
      plannedEndDate: newMO.plannedEndDate,
    }

    setMos([...mos, mo])
    setNewMO({ name: '', plannedStartDate: '', plannedEndDate: '' })
  }

  const handleRemoveMO = (index: number) => {
    setMos(mos.filter((_, i) => i !== index))
  }

  const handleSubmitForReview = async () => {
    if (mos.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No MOs',
        description: 'Please add at least one manufacturing order',
      })
      return
    }

    setSaving(true)
    try {
      // In a real app, you'd save the MOs to the database here
      const response = await fetch(`/api/orders/${params.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_for_review',
          approvalNotes: `Master plan created with ${mos.length} MO(s)`,
        }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Order submitted for engineering review',
        })
        router.push('/orders')
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit')
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleApproveEngineering = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/orders/${params.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve_engineering',
          approvalNotes: 'Engineering plan approved',
        }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Engineering plan approved. Ready for client approval.',
        })
        router.push('/orders')
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message,
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AppLayout title="Order Planning">
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
      <AppLayout title="Order Planning">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Order not found</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/orders')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </div>
      </AppLayout>
    )
  }

  const canEdit = order.status === 'DRAFT' || order.status === 'PLANNING'
  const canApprove = order.status === 'PLANNING' && mos.length > 0

  return (
    <AppLayout title="Master Plan Scheduler">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/orders')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Master Plan Scheduler</h1>
                <Badge variant={order.status === 'DRAFT' ? 'outline' : 'default'}>
                  {order.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1">
                {order.orderNumber} - {order.customerName}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {canEdit && (
              <Button onClick={handleSubmitForReview} disabled={saving || mos.length === 0}>
                <Save className="h-4 w-4 mr-2" />
                Submit for Review
              </Button>
            )}
            {canApprove && (
              <Button onClick={handleApproveEngineering} disabled={saving} variant="default">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve Engineering Plan
              </Button>
            )}
          </div>
        </div>

        {/* Order Info */}
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label className="text-muted-foreground">Customer</Label>
                <p className="font-medium">{order.customerName}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Timeline</Label>
                <p className="font-medium">
                  {new Date(order.plannedStartDate).toLocaleDateString()} - {new Date(order.plannedEndDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="text-sm">{order.description || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manufacturing Orders Planning */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Manufacturing Orders</CardTitle>
                <CardDescription>Plan production batches and schedule</CardDescription>
              </div>
              {canEdit && (
                <Badge variant="secondary">{mos.length} MO(s) planned</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {mos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No manufacturing orders planned yet</p>
                <p className="text-sm">Add MOs to create the master production schedule</p>
              </div>
            ) : (
              <div className="space-y-3">
                {mos.map((mo, index) => (
                  <div
                    key={mo.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{mo.moNumber}</Badge>
                          <span className="font-medium">{mo.name}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(mo.plannedStartDate).toLocaleDateString()} - {new Date(mo.plannedEndDate).toLocaleDateString()}
                          </span>
                          <Badge variant="secondary">{mo.status}</Badge>
                        </div>
                      </div>
                    </div>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMO(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {canEdit && (
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-medium mb-3">Add Manufacturing Order</h3>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="moName">MO Name</Label>
                    <Input
                      id="moName"
                      placeholder="Production Batch 1"
                      value={newMO.name}
                      onChange={(e) => setNewMO({ ...newMO, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="moStart">Start Date</Label>
                    <Input
                      id="moStart"
                      type="date"
                      value={newMO.plannedStartDate}
                      onChange={(e) => setNewMO({ ...newMO, plannedStartDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="moEnd">End Date</Label>
                    <Input
                      id="moEnd"
                      type="date"
                      value={newMO.plannedEndDate}
                      onChange={(e) => setNewMO({ ...newMO, plannedEndDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button onClick={handleAddMO} variant="outline">
                    Add Manufacturing Order
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workflow Info */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Next Steps</h3>
            <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              {order.status === 'DRAFT' && (
                <>
                  <li className="flex items-center gap-2">
                    <span className="font-semibold">1. Current:</span>
                    <span>Add manufacturing orders and create master plan</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="font-semibold">2.</span>
                    <span>Submit for engineering review</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="font-semibold">3.</span>
                    <span>PPIC approves engineering plan</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="font-semibold">4.</span>
                    <span>Send to client for approval</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="font-semibold">5.</span>
                    <span>Client approves → Auto-generate MOs</span>
                  </li>
                </>
              )}
              {order.status === 'PLANNING' && (
                <>
                  <li className="flex items-center gap-2">
                    <span className="font-semibold">1. Current:</span>
                    <span>Review master plan and approve engineering</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="font-semibold">2.</span>
                    <span>Send to client for approval</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="font-semibold">3.</span>
                    <span>Client approves → Production starts</span>
                  </li>
                </>
              )}
              {order.status === 'MATERIAL_PREPARATION' && (
                <>
                  <li className="flex items-center gap-2">
                    <span className="font-semibold">Current:</span>
                    <span>Waiting for client approval</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-muted-foreground">Next:</span>
                    <span>Client approval → Auto-generate manufacturing orders</span>
                  </li>
                </>
              )}
            </ol>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
