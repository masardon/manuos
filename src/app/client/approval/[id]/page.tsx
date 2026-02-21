'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Building2, Calendar, CheckCircle2, XCircle, Clock, FileText } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface Order {
  id: string
  orderNumber: string
  customerName: string
  status: string
  progressPercent: number
  plannedStartDate: string
  plannedEndDate: string
  description: string
  notes: string
  drawingUrl?: string
  manufacturingOrdersCount: number
  manufacturingOrders: any[]
}

export default function ClientApprovalPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [order, setOrder] = useState<Order | null>(null)
  const [approvalNotes, setApprovalNotes] = useState('')

  useEffect(() => {
    fetchOrderDetails()
  }, [params.id])

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`/api/orders/${params.id}/approve`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data.order)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    setSubmitting(true)
    try {
      const response = await fetch(`/api/orders/${params.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve_client',
          approvalNotes: approvalNotes || 'Client approved via portal',
        }),
      })

      if (response.ok) {
        toast({
          title: 'Approval Submitted',
          description: 'Your approval has been recorded. Manufacturing will begin shortly.',
        })
        router.push('/client/success')
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to submit approval',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!approvalNotes.trim()) {
      toast({
        variant: 'destructive',
        title: 'Notes Required',
        description: 'Please provide a reason for rejection',
      })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/orders/${params.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          approvalNotes: `Client rejected: ${approvalNotes}`,
        }),
      })

      if (response.ok) {
        toast({
          title: 'Rejection Submitted',
          description: 'Your feedback has been sent to the engineering team.',
        })
        router.push('/client/success')
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to submit rejection',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <div className="text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-primary text-primary-foreground mx-auto mb-4">
            <Building2 className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold mb-2">ManuOS</h1>
          <p className="text-muted-foreground mb-4">Client Approval Portal</p>
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            <p>Loading order details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle>Order Not Found</CardTitle>
            <CardDescription>The requested order could not be found</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')} className="w-full">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const canApprove = order.status === 'MATERIAL_PREPARATION'

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/50">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">ManuOS Client Portal</h1>
              <p className="text-sm text-muted-foreground">Order Approval System</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Order Status Banner */}
        <Card className={order.status === 'MATERIAL_PREPARATION' ? 'border-blue-200 bg-blue-50 dark:bg-blue-950/20' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {order.status === 'MATERIAL_PREPARATION' ? (
                  <Clock className="h-8 w-8 text-blue-600" />
                ) : (
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                )}
                <div>
                  <h2 className="text-lg font-semibold">
                    {order.status === 'MATERIAL_PREPARATION' 
                      ? 'Awaiting Your Approval' 
                      : 'Already Approved'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {order.status === 'MATERIAL_PREPARATION'
                      ? 'Please review the production plan below'
                      : 'This order has been approved and is in production'}
                  </p>
                </div>
              </div>
              <Badge variant={order.status === 'MATERIAL_PREPARATION' ? 'default' : 'secondary'}>
                {order.status.replace(/_/g, ' ')}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
            <CardDescription>{order.orderNumber}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-muted-foreground">Customer</Label>
                <p className="font-medium">{order.customerName}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Progress</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${order.progressPercent}%` }} />
                  </div>
                  <span className="text-sm font-medium">{order.progressPercent}%</span>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Planned Start</Label>
                <p className="font-medium">{new Date(order.plannedStartDate).toLocaleDateString()}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Planned End</Label>
                <p className="font-medium">{new Date(order.plannedEndDate).toLocaleDateString()}</p>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Description</Label>
              <p className="text-sm mt-1">{order.description || 'No description provided'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Manufacturing Plan */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Production Plan</CardTitle>
                <CardDescription>Manufacturing orders and schedule</CardDescription>
              </div>
              <Badge variant="outline">{order.manufacturingOrdersCount} MO(s)</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {order.manufacturingOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Production plan is being prepared</p>
              </div>
            ) : (
              <div className="space-y-3">
                {order.manufacturingOrders.map((mo, index) => (
                  <div
                    key={mo.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{mo.moNumber}</Badge>
                          <span className="font-medium">{mo.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Status: {mo.status}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>{new Date(mo.plannedStartDate).toLocaleDateString()}</p>
                      <p>→ {new Date(mo.plannedEndDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approval Actions */}
        {canApprove && (
          <Card>
            <CardHeader>
              <CardTitle>Your Decision</CardTitle>
              <CardDescription>
                Review the production plan and provide your approval
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Comments (Optional for approval, required for rejection)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any comments or special requirements..."
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <Button
                  onClick={handleApprove}
                  disabled={submitting}
                  className="flex-1"
                  size="lg"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {submitting ? 'Submitting...' : 'Approve Production Plan'}
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={submitting}
                  variant="outline"
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                  size="lg"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {submitting ? 'Submitting...' : 'Request Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">What happens next?</h3>
            <ol className="space-y-2 text-sm text-muted-foreground">
              {order.status === 'MATERIAL_PREPARATION' ? (
                <>
                  <li>
                    <strong className="text-foreground">If you approve:</strong> Manufacturing orders will be generated and production will begin immediately
                  </li>
                  <li>
                    <strong className="text-foreground">If you request changes:</strong> Your feedback will be sent to our engineering team for revision
                  </li>
                  <li>
                    <strong className="text-foreground">Timeline:</strong> You will receive updates within 24-48 hours
                  </li>
                </>
              ) : (
                <li>
                  <strong className="text-foreground">Production Status:</strong> Your order is currently in production. You will receive regular updates on progress.
                </li>
              )}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
