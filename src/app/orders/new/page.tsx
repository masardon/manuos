'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Upload, FileText, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface DrawingFile {
  name: string
  size: number
  type: string
  url?: string
}

export default function NewOrderPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [drawings, setDrawings] = useState<DrawingFile[]>([])
  const [formData, setFormData] = useState({
    orderNumber: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    description: '',
    notes: '',
    plannedStartDate: '',
    plannedEndDate: '',
    drawingUrl: '',
  })

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        const drawing: DrawingFile = {
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file),
        }
        setDrawings((prev) => [...prev, drawing])
      } else {
        toast({
          variant: 'destructive',
          title: 'Invalid file type',
          description: 'Please upload images or PDF files only',
        })
      }
    })
  }

  const removeDrawing = (index: number) => {
    setDrawings((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const orderData = {
        ...formData,
        drawings: drawings.map((d) => d.name),
        status: 'DRAFT',
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: 'Order created successfully',
          description: `Order ${data.order.orderNumber} has been created and is pending engineering review`,
        })
        router.push(`/orders/${data.order.id}`)
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create order')
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create order',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout title="Create New Order">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/orders')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Order</h1>
            <p className="text-muted-foreground mt-1">
              Enter customer order details and upload CAM drawings
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <FileText className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">Order Workflow</h3>
                <ol className="mt-2 text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>1. <strong>Draft</strong> - Order created by Marketing</li>
                  <li>2. <strong>Engineering Review</strong> - PPIC prepares CAM drawings and Master Plan</li>
                  <li>3. <strong>Client Approval</strong> - Customer reviews and approves the plan</li>
                  <li>4. <strong>Approved</strong> - Manufacturing Orders are generated</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
              <CardDescription>Enter customer contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    placeholder="PT. Example Company"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Customer Email *</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    placeholder="customer@example.com"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Customer Phone</Label>
                  <Input
                    id="customerPhone"
                    placeholder="+62 xxx xxxx xxxx"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orderNumber">Order Number *</Label>
                  <Input
                    id="orderNumber"
                    placeholder="ORD-2025-XXX"
                    value={formData.orderNumber}
                    onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Order Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the order requirements..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Planned Timeline</CardTitle>
              <CardDescription>Expected start and end dates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="plannedStartDate">Planned Start Date *</Label>
                  <Input
                    id="plannedStartDate"
                    type="date"
                    value={formData.plannedStartDate}
                    onChange={(e) => setFormData({ ...formData, plannedStartDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plannedEndDate">Planned End Date *</Label>
                  <Input
                    id="plannedEndDate"
                    type="date"
                    value={formData.plannedEndDate}
                    onChange={(e) => setFormData({ ...formData, plannedEndDate: e.target.value })}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CAM Drawings */}
          <Card>
            <CardHeader>
              <CardTitle>CAM Drawings & Technical Documents</CardTitle>
              <CardDescription>
                Upload engineering drawings, specifications, and technical documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                <Input
                  id="drawings"
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Label htmlFor="drawings" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <div className="text-sm font-medium">
                      Click to upload or drag and drop
                    </div>
                    <p className="text-xs text-muted-foreground">
                      SVG, PNG, JPG, or PDF (max 10MB each)
                    </p>
                  </div>
                </Label>
              </div>

              {drawings.length > 0 && (
                <div className="space-y-2">
                  <Label>Uploaded Drawings ({drawings.length})</Label>
                  <div className="grid gap-2">
                    {drawings.map((drawing, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{drawing.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(drawing.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDrawing(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Internal Notes</CardTitle>
              <CardDescription>Additional information for PPIC and Engineering teams</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Special requirements, priorities, or other notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.push('/orders')}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || drawings.length === 0}>
              {loading ? 'Creating...' : 'Create Order'}
              {!loading && drawings.length > 0 && (
                <span className="ml-2">
                  ({drawings.length} drawing{drawings.length !== 1 ? 's' : ''})
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
