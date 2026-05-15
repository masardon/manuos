'use client'

import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, RefreshCw, ArrowRightLeft, Eye, Check, Truck, Package, MapPin, Clock } from 'lucide-react'
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

interface HandoffItem {
  id: string
  inventory?: { id: string; partNumber: string; name: string }
  partNumber: string
  name: string
  quantity: number
  unit?: string
  condition: string
}

interface Handoff {
  id: string
  handoffNumber: string
  handoffType: string
  type?: string
  status: string
  description?: string
  fromLocationId: string
  toLocationId: string
  fromLocation?: { code: string; name: string }
  toLocation?: { code: string; name: string }
  fromShelf?: { code: string; name: string }
  toShelf?: { code: string; name: string }
  items: HandoffItem[]
  mo?: { moNumber: string; name: string }
  handedByUser?: { name: string }
  receivedByUser?: { name: string }
  handedAt?: string
  receivedAt?: string
  notes?: string
  createdAt: string
}

interface Location {
  id: string
  code: string
  name: string
  type: string
}

interface Shelf {
  id: string
  code: string
  name: string
  locationId: string
}

export default function HandoffsPage() {
  const { toast } = useToast()
  const [handoffs, setHandoffs] = useState<Handoff[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [shelves, setShelves] = useState<Shelf[]>([])
  const [inventory, setInventory] = useState<{ id: string; partNumber: string; name: string; quantity: number; unit: string | null }[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedHandoff, setSelectedHandoff] = useState<Handoff | null>(null)
  const [formData, setFormData] = useState({
    type: 'STOCK_TRANSFER',
    fromLocationId: '',
    fromShelfId: '',
    toLocationId: '',
    toShelfId: '',
    materialId: '',
    inventoryId: '',
    quantity: 1,
    unit: 'pcs',
    condition: 'GOOD',
    description: '',
    notes: '',
    moId: '',
  })

  const fetchData = async () => {
    try {
      const [handoffsRes, locationsRes, inventoryRes] = await Promise.all([
        fetch('/api/handoffs'),
        fetch('/api/locations?includeShelves=true'),
        fetch('/api/inventory'),
      ])
      
      // Helper to safely parse JSON response
      const safeParseJson = async (res: Response, name: string) => {
        const contentType = res.headers.get('content-type')
        if (!contentType?.includes('application/json')) {
          const text = await res.text()
          throw new Error(`${name} returned non-JSON response (${res.status}): ${text.slice(0, 100)}`)
        }
        return res.json()
      }
      
      const [handoffsData, locationsData, inventoryData] = await Promise.all([
        safeParseJson(handoffsRes, 'Handoffs'),
        safeParseJson(locationsRes, 'Locations'),
        safeParseJson(inventoryRes, 'Inventory'),
      ])
      
      setHandoffs(handoffsData.handoffs || [])
      setLocations(locationsData.locations || [])
      setInventory(inventoryData.inventory || [])
      
      // Extract shelves from locations
      const allShelves: Shelf[] = []
      for (const location of locationsData.locations || []) {
        if (location.shelves) {
          for (const shelf of location.shelves) {
            allShelves.push({
              id: shelf.id,
              code: shelf.code,
              name: shelf.name,
              locationId: location.id,
            })
          }
        }
      }
      setShelves(allShelves)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch handoffs and locations',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getStatusBadge = (status: string | undefined) => {
    const config: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      IN_TRANSIT: 'bg-blue-100 text-blue-800',
      CONFIRMED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    }
    if (!status) return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
    return <Badge className={config[status] || 'bg-gray-100 text-gray-800'}>{status.replace(/_/g, ' ')}</Badge>
  }

  const getTypeBadge = (type: string | undefined) => {
    const config: Record<string, string> = {
      STOCK_TRANSFER: 'bg-indigo-100 text-indigo-800',
      MATERIAL_REQUEST: 'bg-purple-100 text-purple-800',
      ISSUE_TO_PRODUCTION: 'bg-green-100 text-green-800',
      CONSUMPTION_RETURN: 'bg-orange-100 text-orange-800',
      QC_TRANSFER: 'bg-red-100 text-red-800',
      REWORK: 'bg-yellow-100 text-yellow-800',
      ADJUSTMENT: 'bg-gray-100 text-gray-800',
    }
    if (!type) return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
    return <Badge className={config[type] || 'bg-gray-100 text-gray-800'}>{type.replace(/_/g, ' ')}</Badge>
  }

  const getConditionBadge = (condition: string | undefined) => {
    const config: Record<string, string> = {
      GOOD: 'bg-green-100 text-green-800',
      DAMAGED: 'bg-red-100 text-red-800',
      DEFECTIVE: 'bg-orange-100 text-orange-800',
      EXPIRED: 'bg-gray-100 text-gray-800',
    }
    if (!condition) return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
    return <Badge className={config[condition] || 'bg-gray-100 text-gray-800'}>{condition}</Badge>
  }

  const handleCreateHandoff = async () => {
    try {
      // Validate required fields
      if (!formData.fromLocationId || !formData.toLocationId || !formData.inventoryId) {
        throw new Error('Please fill in all required fields (From Location, To Location, and Material)')
      }
      
      // Transform form data to match API schema
      const payload = {
        fromLocationId: formData.fromLocationId,
        toLocationId: formData.toLocationId,
        fromShelf: formData.fromShelfId === 'none' ? undefined : formData.fromShelfId,
        toShelf: formData.toShelfId === 'none' ? undefined : formData.toShelfId,
        handoffType: formData.type,
        notes: formData.notes,
        moId: formData.moId || undefined,
        items: [{
          inventoryId: formData.inventoryId,
          quantity: formData.quantity,
          unit: formData.unit,
          condition: formData.condition,
        }],
      }
      
      const response = await fetch('/api/handoffs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Handoff created successfully',
        })
        setCreateDialogOpen(false)
        setFormData({
          type: 'STOCK_TRANSFER',
          fromLocationId: '',
          fromShelfId: '',
          toLocationId: '',
          toShelfId: '',
          materialId: '',
          inventoryId: '',
          quantity: 1,
          unit: 'pcs',
          condition: 'GOOD',
          description: '',
          notes: '',
          moId: '',
        })
        fetchData()
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `Failed to create handoff (${response.status})`)
      }
    } catch (error) {
      console.error('Error creating handoff:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create handoff',
      })
    }
  }

  const handleMoveToPPIC = async (id: string) => {
    try {
      const handoff = handoffs.find(h => h.id === id)
      if (!handoff) {
        throw new Error('Handoff not found')
      }

      console.log('Handoff data:', handoff)
      console.log('Handoff items:', handoff.items)

      const payload = {
        action: 'move_to_ppic',
        moId: handoff.moId || undefined,
        items: handoff.items?.map((item: any) => ({
          inventoryId: item.inventoryId || item.inventory?.id,
          quantity: item.quantity,
          materialRequirementId: item.materialRequirementId || undefined,
        })).filter((item: any) => item.inventoryId) || [],
      }
      
      console.log('Move to PPIC payload:', payload)

      if (payload.items.length === 0) {
        throw new Error('No valid items to move')
      }

      const response = await fetch('/api/handoffs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: 'Success',
          description: data.handoff?.handoffNumber 
            ? `Handoff ${data.handoff.handoffNumber} created` 
            : 'Material moved to PPIC rack',
        })
        fetchData()
      } else {
        const contentType = response.headers.get('content-type')
        let errorMessage = `Failed to move material (${response.status})`
        
        if (contentType?.includes('application/json')) {
          const errorData = await response.json()
          if (errorData.details) {
            const details = errorData.details.map((d: any) => `${d.path?.join('.')}: ${d.message}`).join(', ')
            errorMessage = `${errorData.error}: ${details}`
          } else {
            errorMessage = errorData.error || errorMessage
          }
        } else {
          const text = await response.text()
          errorMessage = `${errorMessage}: ${text.slice(0, 100)}`
        }
        
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('Error moving material:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to move material to PPIC rack',
      })
    }
  }

  const handleIssueToProduction = async (id: string) => {
    try {
      const handoff = handoffs.find(h => h.id === id)
      if (!handoff) {
        throw new Error('Handoff not found')
      }

      const response = await fetch('/api/handoffs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'issue_to_production',
          moId: handoff.moId || '',
          items: handoff.items?.map((item: any) => ({
            inventoryId: item.inventoryId,
            quantity: item.quantity,
            materialRequirementId: item.materialRequirementId,
          })) || [],
        }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Material issued to production',
        })
        fetchData()
      } else {
        const contentType = response.headers.get('content-type')
        let errorMessage = `Failed to issue material (${response.status})`
        
        if (contentType?.includes('application/json')) {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } else {
          const text = await response.text()
          errorMessage = `${errorMessage}: ${text.slice(0, 100)}`
        }
        
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('Error issuing material:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to issue material to production',
      })
    }
  }

  const handleConfirmReceipt = async (id: string) => {
    try {
      const response = await fetch('/api/handoffs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm_receipt',
          handoffId: id,
        }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Receipt confirmed',
        })
        fetchData()
      } else {
        const contentType = response.headers.get('content-type')
        let errorMessage = `Failed to confirm receipt (${response.status})`
        
        if (contentType?.includes('application/json')) {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } else {
          const text = await response.text()
          errorMessage = `${errorMessage}: ${text.slice(0, 100)}`
        }
        
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('Error confirming receipt:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to confirm receipt',
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const filteredShelves = (locationId: string) => {
    return shelves.filter((s) => s.locationId === locationId)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Material Handoffs</h1>
            <p className="text-muted-foreground mt-1">Track material movement between locations</p>
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
                  New Handoff
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Material Handoff</DialogTitle>
                  <DialogDescription>Track material movement between locations</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="handoff-type">Handoff Type</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData({ ...formData, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="STOCK_TRANSFER">Stock Transfer</SelectItem>
                          <SelectItem value="MATERIAL_REQUEST">Material Request</SelectItem>
                          <SelectItem value="ISSUE_TO_PRODUCTION">Issue to Production</SelectItem>
                          <SelectItem value="CONSUMPTION_RETURN">Consumption Return</SelectItem>
                          <SelectItem value="QC_TRANSFER">QC Transfer</SelectItem>
                          <SelectItem value="REWORK">Rework</SelectItem>
                          <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="handoff-condition">Condition</Label>
                      <Select
                        value={formData.condition}
                        onValueChange={(value) => setFormData({ ...formData, condition: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GOOD">Good</SelectItem>
                          <SelectItem value="DAMAGED">Damaged</SelectItem>
                          <SelectItem value="DEFECTIVE">Defective</SelectItem>
                          <SelectItem value="EXPIRED">Expired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="from-location">From Location</Label>
                      <Select
                        value={formData.fromLocationId}
                        onValueChange={(value) => setFormData({ ...formData, fromLocationId: value, fromShelfId: '' })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map((loc) => (
                            <SelectItem key={loc.id} value={loc.id}>
                              {loc.code} - {loc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="to-location">To Location</Label>
                      <Select
                        value={formData.toLocationId}
                        onValueChange={(value) => setFormData({ ...formData, toLocationId: value, toShelfId: '' })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map((loc) => (
                            <SelectItem key={loc.id} value={loc.id}>
                              {loc.code} - {loc.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="from-shelf">From Shelf (Optional)</Label>
                      <Select
                        value={formData.fromShelfId || 'none'}
                        onValueChange={(value) => setFormData({ ...formData, fromShelfId: value === 'none' ? '' : value })}
                        disabled={!formData.fromLocationId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select shelf" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No shelf</SelectItem>
                          {filteredShelves(formData.fromLocationId).map((shelf) => (
                            <SelectItem key={shelf.id} value={shelf.id}>
                              {shelf.code} - {shelf.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="to-shelf">To Shelf (Optional)</Label>
                      <Select
                        value={formData.toShelfId || 'none'}
                        onValueChange={(value) => setFormData({ ...formData, toShelfId: value === 'none' ? '' : value })}
                        disabled={!formData.toLocationId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select shelf" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No shelf</SelectItem>
                          {filteredShelves(formData.toLocationId).map((shelf) => (
                            <SelectItem key={shelf.id} value={shelf.id}>
                              {shelf.code} - {shelf.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inventory">Material / Inventory *</Label>
                    <Select
                      value={formData.inventoryId}
                      onValueChange={(value) => setFormData({ ...formData, inventoryId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select material to handoff" />
                      </SelectTrigger>
                      <SelectContent>
                        {inventory.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.partNumber} - {item.name} ({item.quantity} {item.unit || 'pcs'})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                        min="0.01"
                        step="0.01"
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
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe the handoff purpose"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional notes"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateHandoff}>Create Handoff</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Handoffs</CardTitle>
              <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{handoffs.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {handoffs.filter((h) => h.status === 'PENDING').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Transit</CardTitle>
              <Truck className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {handoffs.filter((h) => h.status === 'IN_TRANSIT').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
              <Check className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {handoffs.filter((h) => h.status === 'CONFIRMED').length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Material Handoffs</CardTitle>
            <CardDescription>Track all material movements between locations</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading handoffs...</div>
            ) : handoffs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No handoffs found. Create your first handoff to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Handoff #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {handoffs.map((handoff) => (
                    <TableRow key={handoff.id}>
                      <TableCell className="font-medium">{handoff.handoffNumber}</TableCell>
                        <TableCell>{getTypeBadge(handoff.handoffType || handoff.type || 'Unknown')}</TableCell>
                       <TableCell>
                         <div className="flex items-center gap-1">
                           <MapPin className="h-3 w-3" />
                           {handoff.fromLocation?.code || handoff.fromLocationId || '-'}
                           {handoff.fromShelf?.code && ` / ${handoff.fromShelf.code}`}
                         </div>
                       </TableCell>
                       <TableCell>
                         <div className="flex items-center gap-1">
                           <MapPin className="h-3 w-3" />
                           {handoff.toLocation?.code || handoff.toLocationId || '-'}
                           {handoff.toShelf?.code && ` / ${handoff.toShelf.code}`}
                         </div>
                       </TableCell>
                       <TableCell>
                         {handoff.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} {handoff.items?.[0]?.unit || ''}
                       </TableCell>
                       <TableCell>
                         <Badge variant="outline">{handoff.items?.[0]?.condition || '-'}</Badge>
                       </TableCell>
                      <TableCell>{getStatusBadge(handoff.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedHandoff(handoff)
                              setViewDialogOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {handoff.status === 'PENDING' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMoveToPPIC(handoff.id)}
                              title="Move to PPIC Rack"
                            >
                              <Truck className="h-4 w-4" />
                            </Button>
                          )}
                          {handoff.status === 'IN_TRANSIT' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleConfirmReceipt(handoff.id)}
                              title="Confirm Receipt"
                            >
                              <Check className="h-4 w-4 text-green-500" />
                            </Button>
                          )}
                          {handoff.status === 'CONFIRMED' && handoff.handoffType !== 'ISSUE_TO_PRODUCTION' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleIssueToProduction(handoff.id)}
                              title="Issue to Production"
                            >
                              <Package className="h-4 w-4" />
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
              <DialogTitle>Handoff Details</DialogTitle>
              <DialogDescription>
                {selectedHandoff?.handoffNumber} - {(selectedHandoff?.handoffType || selectedHandoff?.type || 'Unknown').replace(/_/g, ' ')}
              </DialogDescription>
            </DialogHeader>
            {selectedHandoff && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p>{getStatusBadge(selectedHandoff.status)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Condition</p>
                    <p><Badge variant="outline">{selectedHandoff.items?.[0]?.condition || '-'}</Badge></p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">From Location</p>
                    <p className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {selectedHandoff.fromLocation?.name || selectedHandoff.fromLocationId || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">To Location</p>
                    <p className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {selectedHandoff.toLocation?.name || selectedHandoff.toLocationId || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Total Quantity</p>
                    <p>{selectedHandoff.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} {selectedHandoff.items?.[0]?.unit || ''}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Items</p>
                    <p>{selectedHandoff.items?.length || 0} items</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Items List</p>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Material</TableHead>
                          <TableHead>Part Number</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Condition</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedHandoff.items?.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.name || item.inventory?.name || '-'}</TableCell>
                            <TableCell>{item.partNumber || item.inventory?.partNumber || '-'}</TableCell>
                            <TableCell>{item.quantity} {item.unit || ''}</TableCell>
                            <TableCell><Badge variant="outline">{item.condition}</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Notes</p>
                  <p className="text-sm text-muted-foreground">{selectedHandoff.notes || 'No notes'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <div>
                    <p className="text-sm font-medium">Handed By</p>
                    <p className="text-sm">{selectedHandoff.handedByUser?.name || '-'}</p>
                    {selectedHandoff.handedAt && (
                      <p className="text-xs text-muted-foreground">{formatDate(selectedHandoff.handedAt)}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Received By</p>
                    <p className="text-sm">{selectedHandoff.receivedByUser?.name || '-'}</p>
                    {selectedHandoff.receivedAt && (
                      <p className="text-xs text-muted-foreground">{formatDate(selectedHandoff.receivedAt)}</p>
                    )}
                  </div>
                </div>
                {selectedHandoff.mo && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium">Related Manufacturing Order</p>
                    <p className="text-sm">{selectedHandoff.mo.moNumber} - {selectedHandoff.mo.name}</p>
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