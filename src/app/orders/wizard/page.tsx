'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Progress } from '@/components/ui/progress'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Wrench,
  Settings,
  Plus,
  Trash2,
  TrendingUp,
  Building,
  Factory,
  Layers,
  Upload,
  ClipboardList,
  User,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// ============================================
// INTERFACES
// ============================================

interface Recipe {
  id: string
  code: string
  name: string
  outputPartNumber: string
  outputName: string
  outputQuantity: number
  outputUnit: string | null
  ingredients: RecipeIngredient[]
}

interface RecipeIngredient {
  id: string
  partNumber: string
  name: string
  quantity: number
  unit: string | null
  isCritical: boolean
}

interface Vendor {
  id: string
  code: string
  name: string
  supplierType: string
  capabilities: string[]
}

interface Machine {
  id: string
  code: string
  name: string
  type: string | null
  status: string
}

interface UserOption {
  id: string
  name: string | null
  email: string
  role: string
}

interface InventoryItem {
  id: string
  partNumber: string
  name: string
  availableQty: number
  unit: string | null
  location: string | null
  status: string
}

interface MaterialRequirement {
  partNumber: string
  name: string
  quantityRequired: number
  unit: string | null
  availableStock: number
  shortage: number
  status: 'RESERVED' | 'PARTIALLY_RESERVED' | 'PURCHASE_NEEDED' | 'NO_STOCK'
  isCritical: boolean
  moNumber: string
  moId: string
}

interface Task {
  id: string
  taskNumber: string
  name: string
  description: string
  plannedHours: string
  machineId: string
  assignedTo: string
}

interface Jobsheet {
  id: string
  jsNumber: string
  name: string
  description: string
  type: string
  plannedStartDate: string
  plannedEndDate: string
  tasks: Task[]
}

interface TechnicalSpec {
  drawingFiles: string[]
  camFiles: string[]
  cadFiles: string[]
  specifications: string
  notes: string
}

interface MO {
  id: string
  moNumber: string
  name: string
  description: string
  recipeId: string | null
  recipe: Recipe | null
  plannedStartDate: string
  plannedEndDate: string
  isOutsourced: boolean
  outsourcedType: string | null
  vendorId: string | null
  vendor: Vendor | null
  jobsheets: Jobsheet[]
}

interface Order {
  // Step 1: Marketing / Order Info
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAddress: string
  orderDescription: string
  priority: string
  plannedStartDate: string
  plannedEndDate: string
  
  // Step 2: Drafter / Technical Specs
  technicalSpec: TechnicalSpec
  
  // Step 3-5: PPIC / Manufacturing
  mos: MO[]
}

// ============================================
// STEPS DEFINITION
// ============================================

const steps = [
  { id: 1, title: 'Order Info', subtitle: 'Marketing', icon: FileText, color: 'text-blue-500' },
  { id: 2, title: 'Technical Specs', subtitle: 'Drafter', icon: ClipboardList, color: 'text-green-500' },
  { id: 3, title: 'Manufacturing Order', subtitle: 'PPIC', icon: Wrench, color: 'text-purple-500' },
  { id: 4, title: 'Material Distribution', subtitle: 'PPIC/MRP', icon: Layers, color: 'text-cyan-500' },
  { id: 5, title: 'Jobsheets', subtitle: 'PPIC', icon: Settings, color: 'text-orange-500' },
  { id: 6, title: 'Tasks', subtitle: 'PPIC/Production', icon: TrendingUp, color: 'text-red-500' },
  { id: 7, title: 'Review & Submit', subtitle: 'All', icon: Check, color: 'text-green-600' },
]

// ============================================
// SAMPLE DATA
// ============================================

const sampleRecipes: Recipe[] = [
  {
    id: 'recipe-001',
    code: 'ASM-FRAME-001',
    name: 'Frame Assembly',
    outputPartNumber: 'FRM-001',
    outputName: 'Steel Frame Assembly',
    outputQuantity: 1,
    outputUnit: 'pcs',
    ingredients: [
      { id: 'ing-001', partNumber: 'MAT-001', name: 'Steel Plate 3mm', quantity: 2, unit: 'pcs', isCritical: true },
      { id: 'ing-002', partNumber: 'MAT-002', name: 'Steel Tube 25x25mm', quantity: 4, unit: 'pcs', isCritical: true },
      { id: 'ing-003', partNumber: 'MAT-003', name: 'Welding Wire', quantity: 0.5, unit: 'kg', isCritical: false },
    ],
  },
  {
    id: 'recipe-002',
    code: 'ASM-MOTOR-001',
    name: 'Motor Bracket Assembly',
    outputPartNumber: 'BRK-001',
    outputName: 'Motor Mounting Bracket',
    outputQuantity: 1,
    outputUnit: 'pcs',
    ingredients: [
      { id: 'ing-004', partNumber: 'MAT-004', name: 'Aluminum Plate 5mm', quantity: 1, unit: 'pcs', isCritical: true },
      { id: 'ing-005', partNumber: 'MAT-005', name: 'M8 Bolts', quantity: 4, unit: 'pcs', isCritical: false },
      { id: 'ing-006', partNumber: 'MAT-006', name: 'M8 Nuts', quantity: 4, unit: 'pcs', isCritical: false },
    ],
  },
  {
    id: 'recipe-003',
    code: 'ASM-GEARBOX-001',
    name: 'Gearbox Sub-assembly',
    outputPartNumber: 'GBX-001',
    outputName: 'Gearbox Housing Assembly',
    outputQuantity: 1,
    outputUnit: 'pcs',
    ingredients: [
      { id: 'ing-007', partNumber: 'MAT-007', name: 'Cast Iron Housing', quantity: 1, unit: 'pcs', isCritical: true },
      { id: 'ing-008', partNumber: 'MAT-008', name: 'Bearing 6205', quantity: 2, unit: 'pcs', isCritical: true },
      { id: 'ing-009', partNumber: 'MAT-009', name: 'Gear Shaft', quantity: 1, unit: 'pcs', isCritical: true },
      { id: 'ing-010', partNumber: 'MAT-010', name: 'Seal Ring', quantity: 2, unit: 'pcs', isCritical: false },
    ],
  },
]

const sampleVendors: Vendor[] = [
  {
    id: 'vendor-001',
    code: 'CM-JKT-001',
    name: 'PT. Cipta Manufacturing Jakarta',
    supplierType: 'CONTRACT_MANUFACTURER',
    capabilities: ['CNC', 'WELDING', 'FABRICATION', 'ASSEMBLY'],
  },
  {
    id: 'vendor-002',
    code: 'CM-BDG-001',
    name: 'CV. Bandung Precision Works',
    supplierType: 'CONTRACT_MANUFACTURER',
    capabilities: ['CNC', 'MILLING', 'TURNING', 'GRINDING'],
  },
  {
    id: 'vendor-003',
    code: 'CM-SBY-001',
    name: 'PT. Surabaya Metal Industry',
    supplierType: 'CONTRACT_MANUFACTURER',
    capabilities: ['CASTING', 'MACHINING', 'SURFACE_TREATMENT'],
  },
  {
    id: 'vendor-004',
    code: 'CM-MLK-001',
    name: 'PT. Malang Electronic Assembly',
    supplierType: 'CONTRACT_MANUFACTURER',
    capabilities: ['PCB_ASSEMBLY', 'WIRING', 'TESTING', 'ENCLOSURE'],
  },
  {
    id: 'vendor-005',
    code: 'CM-MDN-001',
    name: 'CV. Medan Sheet Metal Works',
    supplierType: 'CONTRACT_MANUFACTURER',
    capabilities: ['SHEET_METAL', 'LASER_CUT', 'BENDING', 'POWDER_COATING'],
  },
]

const sampleOrderData = {
  orderNumber: 'ORD-2026-0042',
  customerName: 'PT. Automotive Indonesia',
  customerEmail: 'procurement@automotive.co.id',
  customerPhone: '+62 21 5551234',
  customerAddress: 'Jl. Industri No. 15, Bekasi, Jawa Barat',
  orderDescription: 'Custom frame assemblies and motor brackets for industrial conveyor system. Total 50 units to be delivered in 3 batches.',
  priority: 'HIGH',
  plannedStartDate: '2026-05-20',
  plannedEndDate: '2026-06-15',
}

const sampleTechnicalSpec: TechnicalSpec = {
  drawingFiles: ['FRM-001-V2.dwg', 'BRK-001-V1.dwg'],
  camFiles: ['CNC-FRM-001.nc', 'CNC-BRK-001.nc'],
  cadFiles: ['CONVEYOR-ASM-001.SLDASM'],
  specifications: `Material: SPHC Steel 3mm, Aluminum 6061-T6
Tolerance: ±0.1mm for critical dimensions
Surface Finish: Ra 3.2 or better
Welding: AWS D1.1 Structural Welding Code
Coating: Powder coat RAL 9005 (Jet Black)`,
  notes: 'Customer requires material certificates for all steel components. First article inspection required before batch production.',
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function OrderWizardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  
  // Data states
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>(sampleRecipes)
  const [machines, setMachines] = useState<Machine[]>([])
  const [users, setUsers] = useState<UserOption[]>([])
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [materialRequirements, setMaterialRequirements] = useState<MaterialRequirement[]>([])
  
  // Order state
  const [order, setOrder] = useState<Order>({
    orderNumber: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    orderDescription: '',
    priority: 'MEDIUM',
    plannedStartDate: '',
    plannedEndDate: '',
    technicalSpec: {
      drawingFiles: [],
      camFiles: [],
      cadFiles: [],
      specifications: '',
      notes: '',
    },
    mos: [],
  })

  const [currentMO, setCurrentMO] = useState<MO | null>(null)
  const [currentJobsheet, setCurrentJobsheet] = useState<Jobsheet | null>(null)

  const totalSteps = steps.length

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch vendors
        const vendorsRes = await fetch('/api/vendors?supplierType=CONTRACT_MANUFACTURER')
        if (vendorsRes.ok) {
          const vendorsData = await vendorsRes.json()
          // Use sample vendors if API returns empty
          setVendors(vendorsData.vendors?.length > 0 ? vendorsData.vendors : sampleVendors)
        } else {
          setVendors(sampleVendors)
        }

        // Fetch machines
        const machinesRes = await fetch('/api/machines')
        if (machinesRes.ok) {
          const machinesData = await machinesRes.json()
          setMachines(machinesData.machines || [])
        }

        // Fetch users (technicians)
        const usersRes = await fetch('/api/users')
        if (usersRes.ok) {
          const usersData = await usersRes.json()
          setUsers(usersData.users || [])
        }

        // Fetch inventory
        const inventoryRes = await fetch('/api/inventory')
        if (inventoryRes.ok) {
          const inventoryData = await inventoryRes.json()
          setInventory(inventoryData.inventory || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        // Use sample vendors on error
        setVendors(sampleVendors)
      }
    }
    fetchData()
  }, [])

  // Calculate material requirements from all MOs with recipes
  const calculateMaterials = () => {
    const requirements: MaterialRequirement[] = []
    
    for (const mo of order.mos) {
      if (!mo.recipe) continue
      
      for (const ingredient of mo.recipe.ingredients) {
        const existingIndex = requirements.findIndex(r => r.partNumber === ingredient.partNumber)
        
        // Get available stock for this material
        const inventoryItem = inventory.find(inv => inv.partNumber === ingredient.partNumber)
        const availableStock = inventoryItem?.availableQty || 0
        
        // Calculate required quantity (add to existing if same material)
        const quantityRequired = (existingIndex >= 0 
          ? requirements[existingIndex].quantityRequired 
          : 0) + ingredient.quantity
        
        // Calculate shortage
        const shortage = Math.max(0, quantityRequired - availableStock)
        
        // Determine status
        let status: MaterialRequirement['status']
        if (availableStock >= quantityRequired) {
          status = 'RESERVED'
        } else if (availableStock > 0) {
          status = 'PARTIALLY_RESERVED'
        } else if (shortage > 0) {
          status = 'PURCHASE_NEEDED'
        } else {
          status = 'NO_STOCK'
        }
        
        if (existingIndex >= 0) {
          // Update existing requirement
          requirements[existingIndex] = {
            ...requirements[existingIndex],
            quantityRequired,
            availableStock,
            shortage,
            status,
          }
        } else {
          // Add new requirement
          requirements.push({
            partNumber: ingredient.partNumber,
            name: ingredient.name,
            quantityRequired,
            unit: ingredient.unit,
            availableStock,
            shortage,
            status,
            isCritical: ingredient.isCritical,
            moNumber: mo.moNumber,
            moId: mo.id,
          })
        }
      }
    }
    
    setMaterialRequirements(requirements)
  }

  // Load sample data
  const loadSampleData = () => {
    const sampleMOs: MO[] = [
      {
        id: 'mo-sample-001',
        moNumber: 'MO-001',
        name: 'Frame Assembly Production',
        description: 'Main frame assembly for conveyor system',
        recipeId: 'recipe-001',
        recipe: sampleRecipes[0],
        plannedStartDate: '2026-05-20',
        plannedEndDate: '2026-05-28',
        isOutsourced: false,
        outsourcedType: null,
        vendorId: null,
        vendor: null,
        jobsheets: [
          {
            id: 'js-sample-001',
            jsNumber: 'JS-001',
            name: 'CNC Milling',
            description: 'CNC machining of frame components',
            type: 'SINGLE_PART',
            plannedStartDate: '2026-05-20',
            plannedEndDate: '2026-05-24',
            tasks: [
              {
                id: 'task-sample-001',
                taskNumber: 'MT-001',
                name: 'CNC Milling - Base Plate',
                description: 'Machine base plate from steel',
                plannedHours: '4',
                machineId: '',
                assignedTo: '',
              },
              {
                id: 'task-sample-002',
                taskNumber: 'MT-002',
                name: 'CNC Milling - Side Panels',
                description: 'Machine side panels',
                plannedHours: '6',
                machineId: '',
                assignedTo: '',
              },
            ],
          },
          {
            id: 'js-sample-002',
            jsNumber: 'JS-002',
            name: 'Welding & Assembly',
            description: 'Frame welding and assembly',
            type: 'ASSEMBLY',
            plannedStartDate: '2026-05-25',
            plannedEndDate: '2026-05-28',
            tasks: [
              {
                id: 'task-sample-003',
                taskNumber: 'MT-003',
                name: 'TIG Welding',
                description: 'Weld frame components',
                plannedHours: '8',
                machineId: '',
                assignedTo: '',
              },
            ],
          },
        ],
      },
      {
        id: 'mo-sample-002',
        moNumber: 'MO-002',
        name: 'Gearbox Sub-assembly (Outsourced)',
        description: 'Gearbox housing - outsourced to vendor',
        recipeId: 'recipe-003',
        recipe: sampleRecipes[2],
        plannedStartDate: '2026-05-22',
        plannedEndDate: '2026-06-01',
        isOutsourced: true,
        outsourcedType: 'SUBCONTRACT',
        vendorId: 'vendor-002',
        vendor: sampleVendors[1],
        jobsheets: [
          {
            id: 'js-sample-003',
            jsNumber: 'JS-003',
            name: 'Precision Grinding',
            description: 'Outsourced precision grinding',
            type: 'SINGLE_PART',
            plannedStartDate: '2026-05-22',
            plannedEndDate: '2026-05-30',
            tasks: [
              {
                id: 'task-sample-004',
                taskNumber: 'MT-004',
                name: 'Surface Grinding',
                description: 'Grind housing surfaces',
                plannedHours: '12',
                machineId: '',
                assignedTo: '',
              },
            ],
          },
        ],
      },
    ]

    setOrder({
      ...order,
      ...sampleOrderData,
      technicalSpec: sampleTechnicalSpec,
      mos: sampleMOs,
    })
    
    toast({
      title: 'Sample Data Loaded',
      description: 'Complete order with MOs, jobsheets, and tasks loaded',
    })
  }

  // Navigation
  const handleNext = () => {
    if (currentStep < totalSteps) {
      const nextStep = currentStep + 1
      setCurrentStep(nextStep)
      
      // Calculate materials when entering step 4 (Material Distribution)
      if (nextStep === 4) {
        calculateMaterials()
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // MO Handlers
  const handleAddMO = () => {
    const newMO: MO = {
      id: `mo-${Date.now()}`,
      moNumber: `MO-${String(order.mos.length + 1).padStart(3, '0')}`,
      name: '',
      description: '',
      recipeId: null,
      recipe: null,
      plannedStartDate: order.plannedStartDate,
      plannedEndDate: order.plannedEndDate,
      isOutsourced: false,
      outsourcedType: null,
      vendorId: null,
      vendor: null,
      jobsheets: [],
    }
    setOrder({
      ...order,
      mos: [...order.mos, newMO],
    })
    setCurrentMO(newMO)
  }

  const handleUpdateMO = (moId: string, data: Partial<MO>) => {
    const updatedMOs = order.mos.map((mo) => (mo.id === moId ? { ...mo, ...data } : mo))
    setOrder({
      ...order,
      mos: updatedMOs,
    })
    if (currentMO?.id === moId) {
      setCurrentMO({ ...currentMO, ...data })
    }
  }

  const handleDeleteMO = (moId: string) => {
    setOrder({
      ...order,
      mos: order.mos.filter((mo) => mo.id !== moId),
    })
    if (currentMO?.id === moId) {
      setCurrentMO(null)
    }
  }

  const handleSelectRecipe = (moId: string, recipeId: string) => {
    const recipe = recipes.find((r) => r.id === recipeId) || null
    handleUpdateMO(moId, { recipeId, recipe })
  }

  // Jobsheet Handlers
  const handleAddJobsheet = (moId: string) => {
    const mo = order.mos.find((m) => m.id === moId)
    if (!mo) return

    const newJobsheet: Jobsheet = {
      id: `js-${Date.now()}`,
      jsNumber: `JS-${String(mo.jobsheets.length + 1).padStart(3, '0')}`,
      name: '',
      description: '',
      type: 'SINGLE_PART',
      plannedStartDate: mo.plannedStartDate,
      plannedEndDate: mo.plannedEndDate,
      tasks: [],
    }

    const updatedMOs = order.mos.map((m) =>
      m.id === moId ? { ...m, jobsheets: [...m.jobsheets, newJobsheet] } : m
    )

    setOrder({ ...order, mos: updatedMOs })
    setCurrentJobsheet(newJobsheet)
  }

  const handleUpdateJobsheet = (moId: string, jsId: string, data: Partial<Jobsheet>) => {
    const updatedMOs = order.mos.map((mo) =>
      mo.id === moId
        ? {
            ...mo,
            jobsheets: mo.jobsheets.map((js) => (js.id === jsId ? { ...js, ...data } : js)),
          }
        : mo
    )
    setOrder({ ...order, mos: updatedMOs })
    if (currentJobsheet?.id === jsId) {
      setCurrentJobsheet({ ...currentJobsheet, ...data })
    }
  }

  const handleDeleteJobsheet = (moId: string, jsId: string) => {
    const updatedMOs = order.mos.map((mo) =>
      mo.id === moId
        ? { ...mo, jobsheets: mo.jobsheets.filter((js) => js.id !== jsId) }
        : mo
    )
    setOrder({ ...order, mos: updatedMOs })
    if (currentJobsheet?.id === jsId) {
      setCurrentJobsheet(null)
    }
  }

  // Task Handlers
  const handleAddTask = (moId: string, jsId: string) => {
    const mo = order.mos.find((m) => m.id === moId)
    const js = mo?.jobsheets.find((j) => j.id === jsId)
    if (!mo || !js) return

    const newTask: Task = {
      id: `task-${Date.now()}`,
      taskNumber: `MT-${String(js.tasks.length + 1).padStart(3, '0')}`,
      name: '',
      description: '',
      plannedHours: '',
      machineId: '',
      assignedTo: '',
    }

    const updatedMOs = order.mos.map((m) =>
      m.id === moId
        ? {
            ...m,
            jobsheets: m.jobsheets.map((j) =>
              j.id === jsId ? { ...j, tasks: [...j.tasks, newTask] } : j
            ),
          }
        : m
    )

    setOrder({ ...order, mos: updatedMOs })
  }

  const handleUpdateTask = (moId: string, jsId: string, taskId: string, data: Partial<Task>) => {
    const updatedMOs = order.mos.map((mo) =>
      mo.id === moId
        ? {
            ...mo,
            jobsheets: mo.jobsheets.map((js) =>
              js.id === jsId
                ? { ...js, tasks: js.tasks.map((t) => (t.id === taskId ? { ...t, ...data } : t)) }
                : js
            ),
          }
        : mo
    )
    setOrder({ ...order, mos: updatedMOs })
  }

  const handleDeleteTask = (moId: string, jsId: string, taskId: string) => {
    const updatedMOs = order.mos.map((mo) =>
      mo.id === moId
        ? {
            ...mo,
            jobsheets: mo.jobsheets.map((js) =>
              js.id === jsId ? { ...js, tasks: js.tasks.filter((t) => t.id !== taskId) } : js
            ),
          }
        : mo
    )
    setOrder({ ...order, mos: updatedMOs })
  }

  // Submit Handler
  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Create Order
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
          description: order.orderDescription,
          plannedStartDate: order.plannedStartDate,
          plannedEndDate: order.plannedEndDate,
          drawingUrl: order.technicalSpec.drawingFiles[0] || null,
        }),
      })

      if (!orderResponse.ok) throw new Error('Failed to create order')
      const orderData = await orderResponse.json()
      const orderId = orderData.order.id

      // Create MOs
      for (const mo of order.mos) {
        const moResponse = await fetch(`/api/orders/${orderId}/mo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            moNumber: mo.moNumber,
            name: mo.name,
            description: mo.description,
            plannedStartDate: mo.plannedStartDate,
            plannedEndDate: mo.plannedEndDate,
            recipeId: mo.recipeId,
            isOutsourced: mo.isOutsourced,
            outsourcedType: mo.outsourcedType,
            vendorId: mo.vendorId,
          }),
        })

        if (!moResponse.ok) throw new Error('Failed to create MO')
        const moData = await moResponse.json()
        const moId = moData.mo.id

        // Create Jobsheets
        for (const js of mo.jobsheets) {
          const jsResponse = await fetch(`/api/mo/${moId}/jobsheets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsNumber: js.jsNumber,
              name: js.name,
              description: js.description,
              type: js.type,
              plannedStartDate: js.plannedStartDate,
              plannedEndDate: js.plannedEndDate,
            }),
          })

          if (!jsResponse.ok) throw new Error('Failed to create jobsheet')
          const jsData = await jsResponse.json()
          const jsId = jsData.jobsheet.id

          // Create Tasks
          for (const task of js.tasks) {
            await fetch(`/api/jobsheet/${jsId}/tasks`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                taskNumber: task.taskNumber,
                name: task.name,
                description: task.description,
                plannedHours: task.plannedHours ? parseFloat(task.plannedHours) : null,
                machineId: task.machineId || null,
                assignedTo: task.assignedTo || null,
              }),
            })
          }
        }
      }

      toast({
        title: 'Success',
        description: 'Order created successfully with all manufacturing details!',
      })

      router.push(`/orders/${orderId}`)
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

  // ============================================
  // RENDER STEP CONTENT
  // ============================================

  const renderStep = () => {
    switch (currentStep) {
      // ==========================================
      // STEP 1: ORDER INFO (Marketing)
      // ==========================================
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  Customer Order Information
                </h3>
                <p className="text-sm text-muted-foreground">
                  Enter the customer order details (Marketing Department)
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={loadSampleData}>
                Load Sample Data
              </Button>
            </div>
            
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="orderNumber">Order Number *</Label>
                  <Input
                    id="orderNumber"
                    value={order.orderNumber}
                    onChange={(e) => setOrder({ ...order, orderNumber: e.target.value })}
                    placeholder="e.g., ORD-2026-0042"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={order.priority}
                    onValueChange={(value) => setOrder({ ...order, priority: value })}
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

              <Separator />

              <div className="grid gap-2">
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={order.customerName}
                  onChange={(e) => setOrder({ ...order, customerName: e.target.value })}
                  placeholder="e.g., PT. Automotive Indonesia"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={order.customerEmail}
                    onChange={(e) => setOrder({ ...order, customerEmail: e.target.value })}
                    placeholder="customer@example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="customerPhone">Phone</Label>
                  <Input
                    id="customerPhone"
                    value={order.customerPhone}
                    onChange={(e) => setOrder({ ...order, customerPhone: e.target.value })}
                    placeholder="+62xxx"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="customerAddress">Address</Label>
                <Textarea
                  id="customerAddress"
                  value={order.customerAddress}
                  onChange={(e) => setOrder({ ...order, customerAddress: e.target.value })}
                  placeholder="Customer address..."
                  rows={2}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="orderDescription">Order Description</Label>
                <Textarea
                  id="orderDescription"
                  value={order.orderDescription}
                  onChange={(e) => setOrder({ ...order, orderDescription: e.target.value })}
                  placeholder="Describe the order requirements..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="plannedStartDate">Planned Start Date *</Label>
                  <Input
                    id="plannedStartDate"
                    type="date"
                    value={order.plannedStartDate}
                    onChange={(e) => setOrder({ ...order, plannedStartDate: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="plannedEndDate">Planned End Date *</Label>
                  <Input
                    id="plannedEndDate"
                    type="date"
                    value={order.plannedEndDate}
                    onChange={(e) => setOrder({ ...order, plannedEndDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        )

      // ==========================================
      // STEP 2: TECHNICAL SPECS (Drafter)
      // ==========================================
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-green-500" />
                Technical Specifications
              </h3>
              <p className="text-sm text-muted-foreground">
                Upload drawings, CAM/CAD files and technical specifications (Drafter)
              </p>
            </div>

            <div className="grid gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Drawing Files
                  </CardTitle>
                  <CardDescription>Upload technical drawings (.dwg, .pdf, .step)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Drag & drop files here or click to browse</p>
                    <p className="text-xs text-muted-foreground mt-1">Supported: .dwg, .pdf, .step, .iges</p>
                  </div>
                  {order.technicalSpec.drawingFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {order.technicalSpec.drawingFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{file}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">CAM Files</CardTitle>
                    <CardDescription>CNC machining programs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Input
                      placeholder="e.g., CNC-FRM-001.nc"
                      value={order.technicalSpec.camFiles.join(', ')}
                      onChange={(e) => setOrder({
                        ...order,
                        technicalSpec: {
                          ...order.technicalSpec,
                          camFiles: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                        }
                      })}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">CAD Files</CardTitle>
                    <CardDescription>3D models and assemblies</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Input
                      placeholder="e.g., CONVEYOR-ASM-001.SLDASM"
                      value={order.technicalSpec.cadFiles.join(', ')}
                      onChange={(e) => setOrder({
                        ...order,
                        technicalSpec: {
                          ...order.technicalSpec,
                          cadFiles: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                        }
                      })}
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-2">
                <Label>Material & Process Specifications</Label>
                <Textarea
                  value={order.technicalSpec.specifications}
                  onChange={(e) => setOrder({
                    ...order,
                    technicalSpec: { ...order.technicalSpec, specifications: e.target.value }
                  })}
                  placeholder="Material specs, tolerances, surface finish requirements..."
                  rows={5}
                />
              </div>

              <div className="grid gap-2">
                <Label>Notes</Label>
                <Textarea
                  value={order.technicalSpec.notes}
                  onChange={(e) => setOrder({
                    ...order,
                    technicalSpec: { ...order.technicalSpec, notes: e.target.value }
                  })}
                  placeholder="Additional notes, special requirements..."
                  rows={3}
                />
              </div>
            </div>
          </div>
        )

      // ==========================================
      // STEP 3: MANUFACTURING ORDER (PPIC)
      // ==========================================
      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-purple-500" />
                  Manufacturing Orders
                </h3>
                <p className="text-sm text-muted-foreground">
                  Create MOs with Recipe/BOM and select processor (PPIC Department)
                </p>
              </div>
              <Button onClick={handleAddMO} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add MO
              </Button>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <ScrollArea className="h-[400px] col-span-1">
                <div className="space-y-2 pr-4">
                  {order.mos.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No MOs added yet. Click "Add MO" to create one.</p>
                    </div>
                  ) : (
                    order.mos.map((mo) => (
                      <Card
                        key={mo.id}
                        className={`cursor-pointer transition-colors ${
                          currentMO?.id === mo.id ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => setCurrentMO(mo)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{mo.moNumber}</Badge>
                              {mo.isOutsourced && (
                                <Badge className="bg-purple-100 text-purple-800">
                                  <Building className="h-3 w-3 mr-1" />
                                  Subcon
                                </Badge>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteMO(mo.id)
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-sm font-medium mt-1">{mo.name || 'Unnamed MO'}</p>
                          {mo.recipe && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Recipe: {mo.recipe.code}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>

              <div className="col-span-2">
                {currentMO ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{currentMO.moNumber} Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-2">
                        <Label>MO Name *</Label>
                        <Input
                          value={currentMO.name}
                          onChange={(e) => handleUpdateMO(currentMO.id, { name: e.target.value })}
                          placeholder="e.g., Frame Assembly Production"
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label>Description</Label>
                        <Textarea
                          value={currentMO.description}
                          onChange={(e) => handleUpdateMO(currentMO.id, { description: e.target.value })}
                          rows={2}
                        />
                      </div>

                      {/* Recipe Selection */}
                      <div className="border-t pt-4">
                        <Label className="text-base flex items-center gap-2 mb-3">
                          <Layers className="h-4 w-4" />
                          Recipe / Bill of Materials (BOM)
                        </Label>
                        <Select
                          value={currentMO.recipeId || ''}
                          onValueChange={(value) => handleSelectRecipe(currentMO.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select recipe to auto-calculate materials" />
                          </SelectTrigger>
                          <SelectContent>
                            {recipes.map((recipe) => (
                              <SelectItem key={recipe.id} value={recipe.id}>
                                <div>
                                  <p className="font-medium">{recipe.code} - {recipe.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Output: {recipe.outputName} ({recipe.ingredients.length} materials)
                                  </p>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {currentMO.recipe && (
                          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm font-medium mb-2">Material Requirements:</p>
                            <div className="space-y-1">
                              {currentMO.recipe.ingredients.map((ing) => (
                                <div key={ing.id} className="flex items-center justify-between text-sm">
                                  <span className="flex items-center gap-2">
                                    {ing.isCritical && <span className="text-red-500">●</span>}
                                    {ing.partNumber} - {ing.name}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {ing.quantity} {ing.unit || ''}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              ● Critical material • MRP will auto-detect stock levels
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Processor Selection */}
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-4">
                          <Label className="text-base flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            Processor Type
                          </Label>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {currentMO.isOutsourced ? 'Outsourced' : 'Internal'}
                            </span>
                            <Switch
                              checked={currentMO.isOutsourced}
                              onCheckedChange={(checked) => 
                                handleUpdateMO(currentMO.id, { 
                                  isOutsourced: checked,
                                  vendorId: checked ? currentMO.vendorId : null,
                                  outsourcedType: checked ? 'SUBCONTRACT' : null,
                                })
                              }
                            />
                          </div>
                        </div>

                        {currentMO.isOutsourced && (
                          <div className="grid gap-4 p-3 bg-purple-50 rounded-lg">
                            <div className="grid gap-2">
                              <Label>Outsource Type</Label>
                              <Select
                                value={currentMO.outsourcedType || 'SUBCONTRACT'}
                                onValueChange={(value) => 
                                  handleUpdateMO(currentMO.id, { outsourcedType: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="FULL">
                                    <div className="flex items-center gap-2">
                                      <Factory className="h-4 w-4" />
                                      <span>Full Outsource</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="PARTIAL">
                                    <div className="flex items-center gap-2">
                                      <Settings className="h-4 w-4" />
                                      <span>Partial Outsource</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="SUBCONTRACT">
                                    <div className="flex items-center gap-2">
                                      <Building className="h-4 w-4" />
                                      <span>Subcontract</span>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="grid gap-2">
                              <Label>Vendor / Contract Manufacturer</Label>
                              <Select
                                value={currentMO.vendorId || 'none'}
                                onValueChange={(value) => {
                                  const selectedVendor = vendors.find(v => v.id === value)
                                  handleUpdateMO(currentMO.id, { 
                                    vendorId: value === 'none' ? null : value,
                                    vendor: selectedVendor || null,
                                  })
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select vendor (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">
                                    <span className="text-muted-foreground">No vendor selected</span>
                                  </SelectItem>
                                  {vendors.map((vendor) => (
                                    <SelectItem key={vendor.id} value={vendor.id}>
                                      <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                          <Building className="h-4 w-4" />
                                          <span className="font-medium">{vendor.name}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                          {vendor.code} • {vendor.capabilities.slice(0, 3).join(', ')}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground">
                                Vendor can be assigned later. MRP will generate Purchase Requests if materials are out of stock.
                              </p>
                            </div>

                            {/* Vendor Details Card */}
                            {currentMO.vendorId && currentMO.vendor && (
                              <div className="p-3 bg-purple-100 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <Building className="h-4 w-4 text-purple-600" />
                                  <span className="font-medium text-purple-900">{currentMO.vendor.name}</span>
                                </div>
                                <p className="text-xs text-purple-700">
                                  Code: {currentMO.vendor.code}
                                </p>
                                {currentMO.vendor.capabilities && currentMO.vendor.capabilities.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {currentMO.vendor.capabilities.map((cap, idx) => (
                                      <Badge key={idx} variant="secondary" className="text-xs">
                                        {cap}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Planned Start</Label>
                          <Input
                            type="date"
                            value={currentMO.plannedStartDate}
                            onChange={(e) => handleUpdateMO(currentMO.id, { plannedStartDate: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Planned End</Label>
                          <Input
                            type="date"
                            value={currentMO.plannedEndDate}
                            onChange={(e) => handleUpdateMO(currentMO.id, { plannedEndDate: e.target.value })}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Select an MO from the list or create a new one</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )

      // ==========================================
      // STEP 4: MATERIAL DISTRIBUTION (MRP)
      // ==========================================
      case 4:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Layers className="h-5 w-5 text-cyan-500" />
                Material Distribution (MRP)
              </h3>
              <p className="text-sm text-muted-foreground">
                Review material requirements and stock availability. Materials will be reserved upon order submission.
              </p>
            </div>

            {materialRequirements.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    No materials to distribute. Please add MOs with recipes in the previous step.
                  </p>
                  <Button variant="outline" onClick={handleBack} className="mt-4">
                    Go Back to Add MO & Recipes
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-4 pb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{materialRequirements.length}</div>
                        <p className="text-xs text-muted-foreground">Total Materials</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="pt-4 pb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {materialRequirements.filter(m => m.status === 'RESERVED').length}
                        </div>
                        <p className="text-xs text-green-700">Fully Reserved</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="pt-4 pb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {materialRequirements.filter(m => m.status === 'PARTIALLY_RESERVED').length}
                        </div>
                        <p className="text-xs text-yellow-700">Partial Stock</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-4 pb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {materialRequirements.filter(m => m.status === 'PURCHASE_NEEDED' || m.status === 'NO_STOCK').length}
                        </div>
                        <p className="text-xs text-red-700">Need Purchase</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Materials Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Material Requirements</CardTitle>
                    <CardDescription>
                      Materials will be auto-reserved from stock. Purchase Requests will be generated for shortages.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Part Number</TableHead>
                          <TableHead>Material Name</TableHead>
                          <TableHead>Required</TableHead>
                          <TableHead>In Stock</TableHead>
                          <TableHead>Shortage</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Source MO</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {materialRequirements.map((req, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {req.isCritical && (
                                  <span className="text-red-500 text-xs">●</span>
                                )}
                                {req.partNumber}
                              </div>
                            </TableCell>
                            <TableCell>{req.name}</TableCell>
                            <TableCell>
                              {req.quantityRequired.toFixed(2)} {req.unit || ''}
                            </TableCell>
                            <TableCell>
                              <span className={req.availableStock >= req.quantityRequired ? 'text-green-600' : req.availableStock > 0 ? 'text-yellow-600' : 'text-red-600'}>
                                {req.availableStock.toFixed(2)} {req.unit || ''}
                              </span>
                            </TableCell>
                            <TableCell>
                              {req.shortage > 0 ? (
                                <span className="text-red-600 font-medium">
                                  {req.shortage.toFixed(2)} {req.unit || ''}
                                </span>
                              ) : (
                                <span className="text-green-600">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                req.status === 'RESERVED' ? 'bg-green-100 text-green-800' :
                                req.status === 'PARTIALLY_RESERVED' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }>
                                {req.status === 'RESERVED' ? 'Available' :
                                 req.status === 'PARTIALLY_RESERVED' ? 'Partial' :
                                 'Need Purchase'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{req.moNumber}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* MRP Action Info */}
                <Card className="border-cyan-200 bg-cyan-50">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <Layers className="h-5 w-5 text-cyan-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-cyan-900">Automatic MRP Processing on Submit</p>
                        <ul className="text-sm text-cyan-700 list-disc list-inside mt-1 space-y-1">
                          <li>Materials with stock will be <strong>automatically reserved</strong></li>
                          <li>Materials with shortage will trigger <strong>Purchase Request generation</strong></li>
                          <li>Purchase Requests will be <strong>pushed to Odoo</strong> for procurement</li>
                          <li>When goods are received, inventory will be <strong>updated automatically</strong></li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )

      // ==========================================
      // STEP 5: JOBSHEETS
      // ==========================================
      case 5:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Settings className="h-5 w-5 text-orange-500" />
                Jobsheets
              </h3>
              <p className="text-sm text-muted-foreground">
                Create jobsheets for each Manufacturing Order
              </p>
            </div>
            
            {order.mos.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Please add at least one MO first.</p>
                <Button variant="outline" onClick={handleBack} className="mt-4">
                  Go Back to Add MO
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-6">
                  {order.mos.map((mo) => (
                    <Card key={mo.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base flex items-center gap-2">
                              {mo.moNumber} - {mo.name}
                              {mo.isOutsourced && (
                                <Badge className="bg-purple-100 text-purple-800">Subcon</Badge>
                              )}
                            </CardTitle>
                            <CardDescription>{mo.jobsheets.length} jobsheets</CardDescription>
                          </div>
                          <Button
                            onClick={() => handleAddJobsheet(mo.id)}
                            size="sm"
                            variant="outline"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Jobsheet
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {mo.jobsheets.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No jobsheets yet. Click "Add Jobsheet" to create one.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {mo.jobsheets.map((js) => (
                              <Card key={js.id} className="bg-muted/30">
                                <CardContent className="p-4">
                                  <div className="grid grid-cols-4 gap-3">
                                    <div className="grid gap-1">
                                      <Label className="text-xs">JS Number</Label>
                                      <Input
                                        value={js.jsNumber}
                                        onChange={(e) => handleUpdateJobsheet(mo.id, js.id, { jsNumber: e.target.value })}
                                        className="h-8 text-sm"
                                      />
                                    </div>
                                    <div className="col-span-2 grid gap-1">
                                      <Label className="text-xs">Name</Label>
                                      <Input
                                        value={js.name}
                                        onChange={(e) => handleUpdateJobsheet(mo.id, js.id, { name: e.target.value })}
                                        placeholder="e.g., CNC Machining"
                                        className="h-8 text-sm"
                                      />
                                    </div>
                                    <div className="grid gap-1">
                                      <Label className="text-xs">Type</Label>
                                      <Select
                                        value={js.type}
                                        onValueChange={(value) => handleUpdateJobsheet(mo.id, js.id, { type: value })}
                                      >
                                        <SelectTrigger className="h-8 text-sm">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="SINGLE_PART">Single Part</SelectItem>
                                          <SelectItem value="ASSEMBLY">Assembly</SelectItem>
                                          <SelectItem value="QC_TEST">QC Test</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="col-span-3 grid gap-1">
                                      <Label className="text-xs">Description</Label>
                                      <Input
                                        value={js.description}
                                        onChange={(e) => handleUpdateJobsheet(mo.id, js.id, { description: e.target.value })}
                                        placeholder="Work instructions..."
                                        className="h-8 text-sm"
                                      />
                                    </div>
                                    <div className="grid gap-1">
                                      <Label className="text-xs">Tasks</Label>
                                      <div className="h-8 flex items-center">
                                        <Badge variant="secondary">{js.tasks.length} tasks</Badge>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex justify-end mt-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-destructive"
                                      onClick={() => handleDeleteJobsheet(mo.id, js.id)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      Delete
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )

      // ==========================================
      // STEP 6: TASKS
      // ==========================================
      case 6:
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-red-500" />
                Machining Tasks
              </h3>
              <p className="text-sm text-muted-foreground">
                Define individual tasks with machine and technician assignment
              </p>
            </div>

            <ScrollArea className="h-[500px]">
              <div className="space-y-6">
                {order.mos.map((mo) => (
                  <div key={mo.id}>
                    {mo.jobsheets.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="font-medium flex items-center gap-2">
                          <Badge variant="outline">{mo.moNumber}</Badge>
                          {mo.name}
                        </h4>
                        
                        {mo.jobsheets.map((js) => {
                          // Determine if machine is optional based on jobsheet type
                          const isMachineOptional = js.type === 'QC_TEST' || js.type === 'ASSEMBLY'
                          const isOutsourced = mo.isOutsourced
                          
                          return (
                          <Card key={js.id}>
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <CardTitle className="text-base">
                                    {js.jsNumber} - {js.name}
                                  </CardTitle>
                                  <Badge variant="secondary" className="text-xs">
                                    {js.type.replace(/_/g, ' ')}
                                  </Badge>
                                  {isOutsourced && (
                                    <Badge className="bg-purple-100 text-purple-800 text-xs">
                                      <Building className="h-3 w-3 mr-1" />
                                      Vendor
                                    </Badge>
                                  )}
                                </div>
                                <Button
                                  onClick={() => handleAddTask(mo.id, js.id)}
                                  size="sm"
                                  variant="outline"
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Task
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent>
                              {js.tasks.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  No tasks yet.
                                </p>
                              ) : (
                                <div className="space-y-3">
                                  {js.tasks.map((task) => (
                                    <div key={task.id} className={`grid gap-2 items-end p-3 bg-muted/30 rounded-lg ${isOutsourced ? 'grid-cols-5' : isMachineOptional ? 'grid-cols-6' : 'grid-cols-6'}`}>
                                      <div className="grid gap-1">
                                        <Label className="text-xs">Task #</Label>
                                        <Input
                                          value={task.taskNumber}
                                          onChange={(e) => handleUpdateTask(mo.id, js.id, task.id, { taskNumber: e.target.value })}
                                          className="h-8 text-sm"
                                        />
                                      </div>
                                      <div className={`${isOutsourced ? 'col-span-2' : 'col-span-2'} grid gap-1`}>
                                        <Label className="text-xs">Name</Label>
                                        <Input
                                          value={task.name}
                                          onChange={(e) => handleUpdateTask(mo.id, js.id, task.id, { name: e.target.value })}
                                          placeholder="e.g., CNC Milling"
                                          className="h-8 text-sm"
                                        />
                                      </div>
                                      
                                      {/* Machine Selection - Optional for QC/Assembly */}
                                      {!isOutsourced && (
                                        <div className="grid gap-1">
                                          <Label className="text-xs">
                                            Machine
                                            {isMachineOptional && <span className="text-muted-foreground ml-1">(Optional)</span>}
                                          </Label>
                                          <Select
                                            value={task.machineId || 'none'}
                                            onValueChange={(value) => handleUpdateTask(mo.id, js.id, task.id, { machineId: value === 'none' ? '' : value })}
                                          >
                                            <SelectTrigger className="h-8 text-sm">
                                              <SelectValue placeholder={isMachineOptional ? "Optional" : "Required"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="none">
                                                <span className="text-muted-foreground">{isMachineOptional ? "None" : "Select..."}</span>
                                              </SelectItem>
                                              {machines.filter(m => m.status === 'IDLE' || m.id === task.machineId).map((machine) => (
                                                <SelectItem key={machine.id} value={machine.id}>
                                                  {machine.code} - {machine.name}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      )}

                                      {/* Assigned To - Hidden for Outsourced */}
                                      {!isOutsourced && (
                                        <div className="grid gap-1">
                                          <Label className="text-xs">
                                            Assigned To
                                            {isMachineOptional && <span className="text-muted-foreground ml-1">(Optional)</span>}
                                          </Label>
                                          <Select
                                            value={task.assignedTo || 'none'}
                                            onValueChange={(value) => handleUpdateTask(mo.id, js.id, task.id, { assignedTo: value === 'none' ? '' : value })}
                                          >
                                            <SelectTrigger className="h-8 text-sm">
                                              <SelectValue placeholder={isMachineOptional ? "Optional" : "Required"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="none">
                                                <span className="text-muted-foreground">{isMachineOptional ? "None" : "Select..."}</span>
                                              </SelectItem>
                                              {users.map((user) => (
                                                <SelectItem key={user.id} value={user.id}>
                                                  {user.name || user.email}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      )}

                                      {/* Vendor Info for Outsourced */}
                                      {isOutsourced && (
                                        <div className="col-span-2 grid gap-1">
                                          <Label className="text-xs">Processing</Label>
                                          <div className="h-8 flex items-center px-3 bg-purple-100 rounded-md text-sm text-purple-700">
                                            <Building className="h-4 w-4 mr-2" />
                                            Handled by vendor: {mo.vendor?.name || 'Vendor TBD'}
                                          </div>
                                        </div>
                                      )}
                                      
                                      <div className="flex items-center gap-1">
                                        <div className="grid gap-1 flex-1">
                                          <Label className="text-xs">Hours</Label>
                                          <Input
                                            type="number"
                                            value={task.plannedHours}
                                            onChange={(e) => handleUpdateTask(mo.id, js.id, task.id, { plannedHours: e.target.value })}
                                            placeholder="0"
                                            className="h-8 text-sm"
                                          />
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-destructive mt-4"
                                          onClick={() => handleDeleteTask(mo.id, js.id, task.id)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )

      // ==========================================
      // STEP 7: REVIEW & SUBMIT
      // ==========================================
      case 7:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                Review & Submit
              </h3>
              <p className="text-sm text-muted-foreground">
                Review all information before submitting
              </p>
            </div>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Order Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Order #:</span> {order.orderNumber}</div>
                <div><span className="text-muted-foreground">Priority:</span> <Badge>{order.priority}</Badge></div>
                <div><span className="text-muted-foreground">Customer:</span> {order.customerName}</div>
                <div><span className="text-muted-foreground">Timeline:</span> {order.plannedStartDate} - {order.plannedEndDate}</div>
              </CardContent>
            </Card>

            {/* Technical Specs Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-green-500" />
                  Technical Specifications
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div><span className="text-muted-foreground">Drawings:</span> {order.technicalSpec.drawingFiles.join(', ') || 'None'}</div>
                <div><span className="text-muted-foreground">CAM Files:</span> {order.technicalSpec.camFiles.join(', ') || 'None'}</div>
                <div><span className="text-muted-foreground">CAD Files:</span> {order.technicalSpec.cadFiles.join(', ') || 'None'}</div>
              </CardContent>
            </Card>

            {/* Manufacturing Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-purple-500" />
                  Manufacturing Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{order.mos.length}</div>
                      <div className="text-xs text-muted-foreground">MOs</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">
                        {order.mos.reduce((sum, mo) => sum + mo.jobsheets.length, 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">Jobsheets</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">
                        {order.mos.reduce((sum, mo) => 
                          sum + mo.jobsheets.reduce((jsSum, js) => jsSum + js.tasks.length, 0), 0
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">Tasks</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {order.mos.map((mo) => (
                      <div key={mo.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{mo.moNumber}</Badge>
                          <span className="text-sm">{mo.name}</span>
                          {mo.recipe && (
                            <Badge variant="secondary">{mo.recipe.code}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {mo.isOutsourced ? (
                            <Badge className="bg-purple-100 text-purple-800">
                              <Building className="h-3 w-3 mr-1" />
                              {mo.vendor?.name || 'Outsourced'}
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-100 text-blue-800">
                              <User className="h-3 w-3 mr-1" />
                              Internal
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Material Distribution Summary */}
            {materialRequirements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Layers className="h-4 w-4 text-cyan-500" />
                    Material Distribution Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4 text-center mb-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{materialRequirements.length}</div>
                      <div className="text-xs text-muted-foreground">Total Materials</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {materialRequirements.filter(m => m.status === 'RESERVED').length}
                      </div>
                      <div className="text-xs text-green-700">Available</div>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {materialRequirements.filter(m => m.status === 'PARTIALLY_RESERVED').length}
                      </div>
                      <div className="text-xs text-yellow-700">Partial</div>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {materialRequirements.filter(m => m.status === 'PURCHASE_NEEDED' || m.status === 'NO_STOCK').length}
                      </div>
                      <div className="text-xs text-red-700">Need Purchase</div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {materialRequirements.filter(m => m.status === 'PURCHASE_NEEDED' || m.status === 'NO_STOCK').length > 0 && (
                      <p className="text-orange-600">
                        ⚠️ {materialRequirements.filter(m => m.status === 'PURCHASE_NEEDED' || m.status === 'NO_STOCK').length} material(s) will trigger Purchase Requests
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* MRP Note */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Layers className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Automatic MRP Processing</p>
                    <p className="text-sm text-blue-700">
                      When submitted, the system will automatically:
                    </p>
                    <ul className="text-sm text-blue-700 list-disc list-inside mt-1">
                      <li>Calculate material requirements based on selected recipes</li>
                      <li>Reserve available stock from inventory</li>
                      <li>Generate Purchase Requests for out-of-stock materials</li>
                      <li>Push POs to Odoo for procurement</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <AppLayout title="Create Order">
      <div className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {steps.map((step, idx) => (
            <div
              key={step.id}
              className={`flex items-center ${idx < steps.length - 1 ? 'flex-1' : ''}`}
            >
              <button
                onClick={() => setCurrentStep(step.id)}
                className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors ${
                  currentStep === step.id
                    ? 'bg-primary/10'
                    : currentStep > step.id
                    ? 'bg-green-50'
                    : 'hover:bg-muted'
                }`}
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  currentStep === step.id
                    ? 'bg-primary text-primary-foreground'
                    : currentStep > step.id
                    ? 'bg-green-500 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {currentStep > step.id ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <step.icon className="h-4 w-4" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium">{step.title}</p>
                  <p className="text-xs text-muted-foreground">{step.subtitle}</p>
                </div>
              </button>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 ${
                  currentStep > step.id ? 'bg-green-500' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="pt-6">
            {renderStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="flex items-center gap-2">
            {currentStep === totalSteps ? (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Creating...' : 'Create Order'}
                <Check className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
