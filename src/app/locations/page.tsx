'use client'

import { useEffect, useState } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, RefreshCw, MapPin, Building, Layers, Eye, Edit, Trash2 } from 'lucide-react'
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

interface Location {
  id: string
  code: string
  name: string
  type: string
  description?: string
  address?: string
  capacity?: number
  isActive: boolean
  parentId?: string
  parent?: Location
  children?: Location[]
  shelves?: Shelf[]
  _count?: {
    inventory: number
    handoffsFrom: number
    handoffsTo: number
  }
}

interface Shelf {
  id: string
  code: string
  name: string
  rack?: string
  row?: string
  column?: string
  level?: string
  capacity?: number
  isActive: boolean
}

export default function LocationsPage() {
  const { toast } = useToast()
  const [locations, setLocations] = useState<Location[]>([])
  const [shelves, setShelves] = useState<Shelf[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('locations')
  const [createLocationDialogOpen, setCreateLocationDialogOpen] = useState(false)
  const [createShelfDialogOpen, setCreateShelfDialogOpen] = useState(false)
  const [locationForm, setLocationForm] = useState({
    code: '',
    name: '',
    type: 'WAREHOUSE',
    description: '',
    address: '',
    capacity: 0,
    parentId: '',
  })
  const [shelfForm, setShelfForm] = useState({
    locationId: '',
    code: '',
    name: '',
    rack: '',
    row: '',
    column: '',
    level: '',
    capacity: 0,
  })

  const fetchData = async () => {
    try {
      const locationsRes = await fetch('/api/locations?includeShelves=true')
      
      if (!locationsRes.ok) {
        throw new Error(`Failed to fetch locations: ${locationsRes.status}`)
      }
      
      const locationsData = await locationsRes.json()
      setLocations(locationsData.locations || [])
      
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
              location: { code: location.code, name: location.name },
              rack: location.code,
              row: shelf.row,
              column: shelf.column,
              level: shelf.level,
              capacity: shelf.capacity,
              isActive: shelf.isActive,
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
        description: 'Failed to fetch locations and shelves',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getLocationTypeBadge = (type: string) => {
    const config: Record<string, string> = {
      WAREHOUSE: 'bg-blue-100 text-blue-800',
      PPIC_RACK: 'bg-purple-100 text-purple-800',
      PRODUCTION_AREA: 'bg-green-100 text-green-800',
      WORKSTATION: 'bg-yellow-100 text-yellow-800',
      QC_AREA: 'bg-red-100 text-red-800',
      TOOL_CRIB: 'bg-orange-100 text-orange-800',
      SHIPPING: 'bg-indigo-100 text-indigo-800',
      RECEIVING: 'bg-pink-100 text-pink-800',
    }
    return <Badge className={config[type] || 'bg-gray-100 text-gray-800'}>{type.replace(/_/g, ' ')}</Badge>
  }

  const handleCreateLocation = async () => {
    try {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...locationForm,
          capacity: locationForm.capacity || undefined,
          parentId: (locationForm.parentId && locationForm.parentId !== 'none') ? locationForm.parentId : undefined,
        }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Location created successfully',
        })
        setCreateLocationDialogOpen(false)
        setLocationForm({
          code: '',
          name: '',
          type: 'WAREHOUSE',
          description: '',
          address: '',
          capacity: 0,
          parentId: '',
        })
        fetchData()
      } else {
        throw new Error('Failed to create location')
      }
    } catch (error) {
      console.error('Error creating location:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create location',
      })
    }
  }

  const handleCreateShelf = async () => {
    try {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_shelf',
          ...shelfForm,
          capacity: shelfForm.capacity || undefined,
        }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Shelf created successfully',
        })
        setCreateShelfDialogOpen(false)
        setShelfForm({
          locationId: '',
          code: '',
          name: '',
          rack: '',
          row: '',
          column: '',
          level: '',
          capacity: 0,
        })
        fetchData()
      } else {
        throw new Error('Failed to create shelf')
      }
    } catch (error) {
      console.error('Error creating shelf:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create shelf',
      })
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Locations & Storage</h1>
            <p className="text-muted-foreground mt-1">Manage warehouses, racks, shelves, and workstations</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{locations.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Warehouses</CardTitle>
              <Building className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {locations.filter((l) => l.type === 'WAREHOUSE').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Shelves</CardTitle>
              <Layers className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shelves.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Production Areas</CardTitle>
              <MapPin className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {locations.filter((l) => ['PRODUCTION_AREA', 'WORKSTATION'].includes(l.type)).length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="locations">Locations</TabsTrigger>
            <TabsTrigger value="shelves">Shelves</TabsTrigger>
          </TabsList>

          <TabsContent value="locations" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Locations</CardTitle>
                  <CardDescription>Warehouses, production areas, and workstations</CardDescription>
                </div>
                <Dialog open={createLocationDialogOpen} onOpenChange={setCreateLocationDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Location
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Location</DialogTitle>
                      <DialogDescription>Add a new location to your facility</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="loc-code">Code</Label>
                          <Input
                            id="loc-code"
                            value={locationForm.code}
                            onChange={(e) => setLocationForm({ ...locationForm, code: e.target.value })}
                            placeholder="e.g., WH-01"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="loc-name">Name</Label>
                          <Input
                            id="loc-name"
                            value={locationForm.name}
                            onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                            placeholder="e.g., Main Warehouse"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="loc-type">Type</Label>
                        <Select
                          value={locationForm.type}
                          onValueChange={(value) => setLocationForm({ ...locationForm, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="WAREHOUSE">Warehouse</SelectItem>
                            <SelectItem value="PPIC_RACK">PPIC Rack</SelectItem>
                            <SelectItem value="PRODUCTION_AREA">Production Area</SelectItem>
                            <SelectItem value="WORKSTATION">Workstation</SelectItem>
                            <SelectItem value="QC_AREA">QC Area</SelectItem>
                            <SelectItem value="TOOL_CRIB">Tool Crib</SelectItem>
                            <SelectItem value="SHIPPING">Shipping</SelectItem>
                            <SelectItem value="RECEIVING">Receiving</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="loc-description">Description</Label>
                        <Textarea
                          id="loc-description"
                          value={locationForm.description}
                          onChange={(e) => setLocationForm({ ...locationForm, description: e.target.value })}
                          placeholder="Optional description"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="loc-capacity">Capacity</Label>
                          <Input
                            id="loc-capacity"
                            type="number"
                            value={locationForm.capacity}
                            onChange={(e) => setLocationForm({ ...locationForm, capacity: parseInt(e.target.value) })}
                            min="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="loc-parent">Parent Location</Label>
                          <Select
                          value={locationForm.parentId || 'none'}
                          onValueChange={(value) => setLocationForm({ ...locationForm, parentId: value === 'none' ? '' : value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="None (root level)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None (root level)</SelectItem>
                              {locations
                                .filter((l) => !l.parentId)
                                .map((loc) => (
                                  <SelectItem key={loc.id} value={loc.id}>
                                    {loc.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCreateLocationDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateLocation}>Create Location</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading locations...</div>
                ) : locations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No locations found. Add your first location to get started.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Capacity</TableHead>
                        <TableHead>Shelves</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {locations.map((location) => (
                        <TableRow key={location.id}>
                          <TableCell className="font-medium">{location.code}</TableCell>
                          <TableCell>{location.name}</TableCell>
                          <TableCell>{getLocationTypeBadge(location.type)}</TableCell>
                          <TableCell>{location.capacity || '-'}</TableCell>
                          <TableCell>{location.shelves?.length || 0}</TableCell>
                          <TableCell>
                            <Badge className={location.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {location.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
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

          <TabsContent value="shelves" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Shelves</CardTitle>
                  <CardDescription>Storage shelves within locations</CardDescription>
                </div>
                <Dialog open={createShelfDialogOpen} onOpenChange={setCreateShelfDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Shelf
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Shelf</DialogTitle>
                      <DialogDescription>Add a new shelf to a location</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="shelf-location">Location</Label>
                        <Select
                          value={shelfForm.locationId}
                          onValueChange={(value) => setShelfForm({ ...shelfForm, locationId: value })}
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
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="shelf-code">Code</Label>
                          <Input
                            id="shelf-code"
                            value={shelfForm.code}
                            onChange={(e) => setShelfForm({ ...shelfForm, code: e.target.value })}
                            placeholder="e.g., A-01"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="shelf-name">Name</Label>
                          <Input
                            id="shelf-name"
                            value={shelfForm.name}
                            onChange={(e) => setShelfForm({ ...shelfForm, name: e.target.value })}
                            placeholder="e.g., Rack A, Row 1"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="shelf-rack">Rack</Label>
                          <Input
                            id="shelf-rack"
                            value={shelfForm.rack}
                            onChange={(e) => setShelfForm({ ...shelfForm, rack: e.target.value })}
                            placeholder="e.g., A"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="shelf-row">Row</Label>
                          <Input
                            id="shelf-row"
                            value={shelfForm.row}
                            onChange={(e) => setShelfForm({ ...shelfForm, row: e.target.value })}
                            placeholder="e.g., 1"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="shelf-column">Column</Label>
                          <Input
                            id="shelf-column"
                            value={shelfForm.column}
                            onChange={(e) => setShelfForm({ ...shelfForm, column: e.target.value })}
                            placeholder="e.g., 2"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="shelf-level">Level</Label>
                          <Input
                            id="shelf-level"
                            value={shelfForm.level}
                            onChange={(e) => setShelfForm({ ...shelfForm, level: e.target.value })}
                            placeholder="e.g., 3"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="shelf-capacity">Capacity</Label>
                        <Input
                          id="shelf-capacity"
                          type="number"
                          value={shelfForm.capacity}
                          onChange={(e) => setShelfForm({ ...shelfForm, capacity: parseInt(e.target.value) })}
                          min="0"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCreateShelfDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateShelf}>Create Shelf</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading shelves...</div>
                ) : shelves.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No shelves found. Add your first shelf to get started.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Rack</TableHead>
                        <TableHead>Row</TableHead>
                        <TableHead>Column</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shelves.map((shelf) => (
                        <TableRow key={shelf.id}>
                          <TableCell className="font-medium">{shelf.code}</TableCell>
                          <TableCell>{shelf.name}</TableCell>
                          <TableCell>{shelf.location?.code || '-'}</TableCell>
                          <TableCell>{shelf.rack || '-'}</TableCell>
                          <TableCell>{shelf.row || '-'}</TableCell>
                          <TableCell>{shelf.column || '-'}</TableCell>
                          <TableCell>{shelf.level || '-'}</TableCell>
                          <TableCell>
                            <Badge className={shelf.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {shelf.isActive ? 'Active' : 'Inactive'}
                            </Badge>
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
      </div>
    </AppLayout>
  )
}