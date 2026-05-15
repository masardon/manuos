'use client'

import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { 
  Layers, 
  Package, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle,
  Building,
  MapPin,
  Truck,
  Factory,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'

// ============================================
// INTERFACES
// ============================================

interface MaterialRequirement {
  id: string
  moId: string
  moNumber: string
  partNumber: string
  name: string
  requiredQty: number
  reservedQty: number
  consumedQty: number
  unit: string | null
  status: string
  jobsheetMaterials: JobsheetMaterial[]
}

interface JobsheetMaterial {
  id: string
  jobsheetId: string
  jobsheetNumber: string
  jobsheetName: string
  allocatedQty: number
  availableQty: number
  consumedQty: number
  status: string
}

interface Jobsheet {
  id: string
  jsNumber: string
  name: string
  type: string
  tasks: MachiningTask[]
}

interface MachiningTask {
  id: string
  taskNumber: string
  name: string
  status: string
  assignedTo: string | null
  assignedUser?: { name: string } | null
}

interface Location {
  id: string
  code: string
  name: string
  type: string
}

interface InventoryItem {
  id: string
  partNumber: string
  name: string
  availableQty: number
  batch: string | null
  location: { code: string } | null
  shelf: { code: string } | null
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function MaterialAllocationPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [mos, setMos] = useState<any[]>([])
  const [selectedMO, setSelectedMO] = useState<string>('')
  const [requirements, setRequirements] = useState<MaterialRequirement[]>([])
  const [jobsheets, setJobsheets] = useState<Jobsheet[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  
  // Dialog states
  const [allocateDialogOpen, setAllocateDialogOpen] = useState(false)
  const [handoffDialogOpen, setHandoffDialogOpen] = useState(false)
  const [selectedRequirement, setSelectedRequirement] = useState<MaterialRequirement | null>(null)
  const [allocationForm, setAllocationForm] = useState({
    jobsheetId: '',
    quantity: 0,
  })
  const [handoffForm, setHandoffForm] = useState({
    fromLocationId: '',
    toLocationId: '',
    quantity: 0,
    notes: '',
  })

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mosRes, locationsRes] = await Promise.all([
          fetch('/api/mo'),
          fetch('/api/locations'),
        ])

        if (mosRes.ok) {
          const mosData = await mosRes.json()
          setMos(mosData.mos || [])
        }

        if (locationsRes.ok) {
          const locData = await locationsRes.json()
          setLocations(locData.locations || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Fetch requirements when MO selected
  useEffect(() => {
    if (selectedMO) {
      fetchRequirements(selectedMO)
      fetchJobsheets(selectedMO)
    } else {
      setRequirements([])
      setJobsheets([])
    }
  }, [selectedMO])

  const fetchRequirements = async (moId: string) => {
    try {
      const res = await fetch(`/api/mo/${moId}/materials`)
      if (res.ok) {
        const data = await res.json()
        setRequirements(data.requirements || [])
      }
    } catch (error) {
      console.error('Error fetching requirements:', error)
    }
  }

  const fetchJobsheets = async (moId: string) => {
    try {
      const res = await fetch(`/api/mo/${moId}`)
      if (res.ok) {
        const data = await res.json()
        setJobsheets(data.mo?.jobsheets || [])
      }
    } catch (error) {
      console.error('Error fetching jobsheets:', error)
    }
  }

  // Open allocation dialog
  const handleOpenAllocate = (req: MaterialRequirement) => {
    setSelectedRequirement(req)
    setAllocationForm({
      jobsheetId: '',
      quantity: req.requiredQty - req.reservedQty,
    })
    setAllocateDialogOpen(true)
  }

  // Allocate material to jobsheet
  const handleAllocate = async () => {
    if (!selectedRequirement || !allocationForm.jobsheetId) return

    try {
      const res = await fetch(`/api/mo/${selectedMO}/materials/allocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialRequirementId: selectedRequirement.id,
          jobsheetId: allocationForm.jobsheetId,
          quantity: allocationForm.quantity,
        }),
      })

      if (res.ok) {
        toast({
          title: 'Success',
          description: `Allocated ${allocationForm.quantity} ${selectedRequirement.unit || ''} to jobsheet`,
        })
        setAllocateDialogOpen(false)
        fetchRequirements(selectedMO)
      } else {
        throw new Error('Failed to allocate')
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to allocate material',
      })
    }
  }

  // Open handoff dialog
  const handleOpenHandoff = (req: MaterialRequirement) => {
    setSelectedRequirement(req)
    setHandoffForm({
      fromLocationId: '',
      toLocationId: '',
      quantity: req.reservedQty - req.consumedQty,
      notes: '',
    })
    setHandoffDialogOpen(true)
  }

  // Create material handoff
  const handleCreateHandoff = async () => {
    if (!selectedRequirement || !handoffForm.fromLocationId || !handoffForm.toLocationId) return

    try {
      const res = await fetch('/api/handoffs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ISSUE_TO_PRODUCTION',
          fromLocationId: handoffForm.fromLocationId,
          toLocationId: handoffForm.toLocationId,
          materialId: selectedRequirement.id,
          quantity: handoffForm.quantity,
          notes: handoffForm.notes,
          moId: selectedMO,
        }),
      })

      if (res.ok) {
        toast({
          title: 'Success',
          description: 'Material handoff created successfully',
        })
        setHandoffDialogOpen(false)
        fetchRequirements(selectedMO)
      } else {
        throw new Error('Failed to create handoff')
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create handoff',
      })
    }
  }

  // Calculate stats
  const stats = {
    totalMaterials: requirements.length,
    fullyAllocated: requirements.filter(r => 
      r.jobsheetMaterials.reduce((sum, jm) => sum + jm.allocatedQty, 0) >= r.reservedQty
    ).length,
    partiallyAllocated: requirements.filter(r => {
      const allocated = r.jobsheetMaterials.reduce((sum, jm) => sum + jm.allocatedQty, 0)
      return allocated > 0 && allocated < r.reservedQty
    }).length,
    notAllocated: requirements.filter(r => 
      r.jobsheetMaterials.reduce((sum, jm) => sum + jm.allocatedQty, 0) === 0 && r.reservedQty > 0
    ).length,
  }

  if (loading) {
    return (
      <AppLayout title="Material Allocation">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Material Allocation">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Material Allocation</h1>
          <p className="text-muted-foreground mt-1">
            Distribute materials from MO to Jobsheets and create handoffs to production
          </p>
        </div>

        {/* MO Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Manufacturing Order</CardTitle>
            <CardDescription>
              Choose an MO to view and allocate its reserved materials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedMO} onValueChange={setSelectedMO}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a Manufacturing Order" />
              </SelectTrigger>
              <SelectContent>
                {mos.map((mo) => (
                  <SelectItem key={mo.id} value={mo.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{mo.moNumber}</span>
                      <span className="text-muted-foreground">- {mo.name}</span>
                      {mo.isOutsourced && (
                        <Badge className="bg-purple-100 text-purple-800 ml-2">Subcon</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedMO && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{stats.totalMaterials}</div>
                    <p className="text-xs text-muted-foreground">Total Materials</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.fullyAllocated}</div>
                    <p className="text-xs text-green-700">Fully Allocated</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{stats.partiallyAllocated}</div>
                    <p className="text-xs text-yellow-700">Partial</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{stats.notAllocated}</div>
                    <p className="text-xs text-red-700">Not Allocated</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Materials Table */}
            <Card>
              <CardHeader>
                <CardTitle>Material Requirements</CardTitle>
                <CardDescription>
                  Allocate reserved materials to jobsheets and create handoffs for physical transfer
                </CardDescription>
              </CardHeader>
              <CardContent>
                {requirements.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No material requirements found for this MO.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Reserved</TableHead>
                        <TableHead>Allocated</TableHead>
                        <TableHead>Consumed</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Jobsheet Allocation</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requirements.map((req) => {
                        const totalAllocated = req.jobsheetMaterials.reduce((sum, jm) => sum + jm.allocatedQty, 0)
                        const remainingToAllocate = req.reservedQty - totalAllocated
                        const allocationPercent = req.reservedQty > 0 ? (totalAllocated / req.reservedQty) * 100 : 0
                        
                        return (
                          <TableRow key={req.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{req.name}</p>
                                <p className="text-xs text-muted-foreground">{req.partNumber}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {req.reservedQty.toFixed(2)} {req.unit || ''}
                            </TableCell>
                            <TableCell>
                              <div>
                                <span className={totalAllocated >= req.reservedQty ? 'text-green-600' : 'text-yellow-600'}>
                                  {totalAllocated.toFixed(2)} {req.unit || ''}
                                </span>
                                <Progress value={allocationPercent} className="h-1 mt-1 w-20" />
                              </div>
                            </TableCell>
                            <TableCell>
                              {req.consumedQty.toFixed(2)} {req.unit || ''}
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                req.status === 'RESERVED' ? 'bg-green-100 text-green-800' :
                                req.status === 'PARTIALLY_RESERVED' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }>
                                {req.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {req.jobsheetMaterials.length > 0 ? (
                                <div className="space-y-1">
                                  {req.jobsheetMaterials.map((jm) => (
                                    <div key={jm.id} className="text-xs flex items-center gap-1">
                                      <Badge variant="outline" className="text-xs">{jm.jobsheetNumber}</Badge>
                                      <span>{jm.allocatedQty.toFixed(1)}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">Not allocated</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenAllocate(req)}
                                  disabled={remainingToAllocate <= 0}
                                >
                                  <Layers className="h-3 w-3 mr-1" />
                                  Allocate
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenHandoff(req)}
                                  disabled={req.reservedQty <= req.consumedQty}
                                >
                                  <Truck className="h-3 w-3 mr-1" />
                                  Handoff
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Jobsheets & Tasks Overview */}
            {jobsheets.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Jobsheets & Task Allocation</CardTitle>
                  <CardDescription>
                    View material allocation per jobsheet and task
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {jobsheets.map((js) => (
                      <Card key={js.id} className="bg-muted/30">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">
                              {js.jsNumber} - {js.name}
                            </CardTitle>
                            <Badge>{js.type.replace(/_/g, ' ')}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm text-muted-foreground">
                            {js.tasks?.length || 0} tasks
                            {js.tasks?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {js.tasks.map((task) => (
                                  <Badge key={task.id} variant="secondary" className="text-xs">
                                    {task.taskNumber}
                                    {task.assignedUser && ` - ${task.assignedUser.name}`}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Process Flow Info */}
            <Card className="border-cyan-200 bg-cyan-50">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Layers className="h-5 w-5 text-cyan-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-cyan-900">Material Distribution Workflow</p>
                    <div className="text-sm text-cyan-700 mt-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">1. MRP Reserved</span>
                        <span className="text-muted-foreground">→ Materials reserved at MO level</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">2. Allocate to Jobsheet</span>
                        <ArrowRight className="h-3 w-3" />
                        <span>Click "Allocate" to assign materials to specific jobsheets</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">3. Create Handoff</span>
                        <ArrowRight className="h-3 w-3" />
                        <span>Click "Handoff" to transfer materials from warehouse to production area</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">4. Task Consumption</span>
                        <ArrowRight className="h-3 w-3" />
                        <span>Technicians consume materials during task execution</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Allocate Dialog */}
        <Dialog open={allocateDialogOpen} onOpenChange={setAllocateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Allocate Material to Jobsheet</DialogTitle>
              <DialogDescription>
                Distribute reserved materials from MO to a specific jobsheet
              </DialogDescription>
            </DialogHeader>
            {selectedRequirement && (
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">{selectedRequirement.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedRequirement.partNumber}</p>
                  <p className="text-sm mt-1">
                    Reserved: <strong>{selectedRequirement.reservedQty}</strong> {selectedRequirement.unit || ''}
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label>Select Jobsheet</Label>
                  <Select
                    value={allocationForm.jobsheetId}
                    onValueChange={(value) => setAllocationForm({ ...allocationForm, jobsheetId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select jobsheet" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobsheets.map((js) => (
                        <SelectItem key={js.id} value={js.id}>
                          {js.jsNumber} - {js.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Quantity to Allocate</Label>
                  <Input
                    type="number"
                    value={allocationForm.quantity}
                    onChange={(e) => setAllocationForm({ ...allocationForm, quantity: parseFloat(e.target.value) || 0 })}
                    max={selectedRequirement.reservedQty}
                    min={0}
                  />
                  <p className="text-xs text-muted-foreground">
                    Max: {selectedRequirement.reservedQty} {selectedRequirement.unit || ''}
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setAllocateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAllocate}>
                <Layers className="h-4 w-4 mr-2" />
                Allocate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Handoff Dialog */}
        <Dialog open={handoffDialogOpen} onOpenChange={setHandoffDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Material Handoff</DialogTitle>
              <DialogDescription>
                Transfer materials from warehouse to production area
              </DialogDescription>
            </DialogHeader>
            {selectedRequirement && (
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">{selectedRequirement.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedRequirement.partNumber}</p>
                  <p className="text-sm mt-1">
                    Available: <strong>{selectedRequirement.reservedQty - selectedRequirement.consumedQty}</strong> {selectedRequirement.unit || ''}
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label>From Location (Warehouse)</Label>
                  <Select
                    value={handoffForm.fromLocationId}
                    onValueChange={(value) => setHandoffForm({ ...handoffForm, fromLocationId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.filter(l => l.type === 'WAREHOUSE' || l.type === 'RECEIVING').map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {loc.code} - {loc.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-center">
                  <ArrowRight className="h-6 w-6 text-muted-foreground" />
                </div>

                <div className="grid gap-2">
                  <Label>To Location (Production)</Label>
                  <Select
                    value={handoffForm.toLocationId}
                    onValueChange={(value) => setHandoffForm({ ...handoffForm, toLocationId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.filter(l => l.type === 'PRODUCTION_AREA' || l.type === 'WORKSTATION').map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          <div className="flex items-center gap-2">
                            <Factory className="h-4 w-4" />
                            {loc.code} - {loc.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={handoffForm.quantity}
                    onChange={(e) => setHandoffForm({ ...handoffForm, quantity: parseFloat(e.target.value) || 0 })}
                    max={selectedRequirement.reservedQty - selectedRequirement.consumedQty}
                    min={0}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Notes</Label>
                  <textarea
                    className="w-full border rounded p-2 text-sm"
                    value={handoffForm.notes}
                    onChange={(e) => setHandoffForm({ ...handoffForm, notes: e.target.value })}
                    placeholder="Delivery notes..."
                    rows={2}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setHandoffDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateHandoff}>
                <Truck className="h-4 w-4 mr-2" />
                Create Handoff
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
