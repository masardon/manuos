'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import {
  Package,
  ShoppingCart,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Truck,
  FileText,
  ArrowRight,
} from 'lucide-react'

interface MaterialRequirement {
  id: string
  partNumber: string
  name: string
  requiredQty: number
  reservedQty: number
  consumedQty: number
  requestedQty: number
  status: string
  unit?: string
  priority?: number
  inventory?: {
    id: string
    availableQty: number
    location?: string
  }
}

interface PurchaseRequest {
  id: string
  prNumber: string
  status: string
  totalItems: number
  estimatedAmount: number
  createdAt: string
}

interface MaterialRequirementsCardProps {
  moId: string
  onRefresh?: () => void
}

export function MaterialRequirementsCard({ moId, onRefresh }: MaterialRequirementsCardProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [requirements, setRequirements] = useState<MaterialRequirement[]>([])
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([])
  const [summary, setSummary] = useState({
    total: 0,
    reserved: 0,
    purchaseNeeded: 0,
    consumed: 0,
  })

  const fetchRequirements = async () => {
    try {
      const response = await fetch(`/api/mo/${moId}/materials`)
      if (response.ok) {
        const data = await response.json()
        setRequirements(data.requirements || [])
        setPurchaseRequests(data.purchaseRequests || [])
        
        // Calculate summary
        const total = data.requirements?.length || 0
        const reserved = data.requirements?.filter((r: MaterialRequirement) => 
          r.status === 'RESERVED' || r.status === 'PARTIALLY_RESERVED'
        ).length || 0
        const purchaseNeeded = data.requirements?.filter((r: MaterialRequirement) => 
          r.status === 'PURCHASE_REQUESTED' || r.requestedQty > 0
        ).length || 0
        const consumed = data.requirements?.filter((r: MaterialRequirement) => 
          r.consumedQty > 0
        ).length || 0
        
        setSummary({ total, reserved, purchaseNeeded, consumed })
      }
    } catch (error) {
      console.error('Error fetching requirements:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load material requirements',
      })
    } finally {
      setLoading(false)
    }
  }

  const runMRP = async () => {
    try {
      toast({
        title: 'Running MRP...',
        description: 'Calculating material requirements and checking stock',
      })

      const response = await fetch(`/api/mo/${moId}/mrp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'full-mrp' }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: 'MRP Complete',
          description: `Reserved: ${data.reservation?.reserved || 0} materials | PR Created: ${data.purchaseRequest?.prCreated ? 'Yes' : 'No'}`,
        })
        fetchRequirements()
        onRefresh?.()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to run MRP')
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'MRP Error',
        description: error.message || 'Failed to run MRP calculation',
      })
    }
  }

  useEffect(() => {
    fetchRequirements()
  }, [moId])

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'RESERVED': 'bg-green-100 text-green-800',
      'PARTIALLY_RESERVED': 'bg-yellow-100 text-yellow-800',
      'PURCHASE_REQUESTED': 'bg-orange-100 text-orange-800',
      'PLANNED': 'bg-gray-100 text-gray-800',
      'CONSUMED': 'bg-blue-100 text-blue-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RESERVED':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'PARTIALLY_RESERVED':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'PURCHASE_REQUESTED':
        return <ShoppingCart className="h-4 w-4 text-orange-600" />
      case 'CONSUMED':
        return <Package className="h-4 w-4 text-blue-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Material Requirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">Loading material requirements...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Material Requirements
            </CardTitle>
            <CardDescription>
              Material planning and stock status
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchRequirements}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm" onClick={runMRP}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Run MRP
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{summary.total}</div>
            <div className="text-xs text-muted-foreground">Total Materials</div>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{summary.reserved}</div>
            <div className="text-xs text-muted-foreground">Reserved</div>
          </div>
          <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{summary.purchaseNeeded}</div>
            <div className="text-xs text-muted-foreground">Need Purchase</div>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{summary.consumed}</div>
            <div className="text-xs text-muted-foreground">Consumed</div>
          </div>
        </div>

        {/* Materials List */}
        {requirements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2">No materials allocated to this MO</p>
            <Button variant="link" onClick={runMRP} className="text-primary">
              Run MRP to calculate materials →
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {requirements.map((material) => {
              const stockPercent = material.inventory 
                ? Math.min(100, (material.inventory.availableQty / material.requiredQty) * 100)
                : 0
              
              return (
                <div key={material.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(material.status)}
                        <h4 className="font-medium">{material.name}</h4>
                        <Badge className={getStatusColor(material.status)}>
                          {material.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{material.partNumber}</p>
                    </div>
                    {material.priority && material.priority <= 3 && (
                      <Badge variant="destructive">High Priority</Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground">Required</div>
                      <div className="font-semibold">
                        {material.requiredQty.toFixed(2)} {material.unit || ''}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Reserved</div>
                      <div className={`font-semibold ${material.reservedQty >= material.requiredQty ? 'text-green-600' : 'text-yellow-600'}`}>
                        {material.reservedQty.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Available Stock</div>
                      <div className="font-semibold">
                        {material.inventory?.availableQty?.toFixed(2) || 0} {material.unit || ''}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">To Purchase</div>
                      <div className="font-semibold text-orange-600">
                        {material.requestedQty.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  {material.inventory && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Stock Availability</span>
                        <span>{stockPercent.toFixed(0)}%</span>
                      </div>
                      <Progress value={stockPercent} className="h-2" />
                    </div>
                  )}
                  
                  {material.inventory?.location && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      📍 Location: {material.inventory.location}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Purchase Requests */}
        {purchaseRequests.length > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Purchase Requests ({purchaseRequests.length})
            </h4>
            <div className="space-y-2">
              {purchaseRequests.map((pr) => (
                <div key={pr.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{pr.prNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {pr.totalItems} items • Rp {pr.estimatedAmount.toLocaleString()}
                    </p>
                  </div>
                  <Badge className={
                    pr.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    pr.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {pr.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Distribution Status */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold mb-2">Material Distribution Workflow</h4>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <span>Reserved</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
              <span>Distributed</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
              <span>Consumed</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}