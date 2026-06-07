'use client'

import { useState } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  ChevronDown,
  ChevronRight,
  Users,
  Package,
  Factory,
  CheckCircle,
  Truck,
  FileText,
  Wrench,
  ArrowRight,
  ArrowDown,
  Settings,
  RefreshCw,
  Copy,
  Box,
} from 'lucide-react'

const flowTypes = [
  { id: 'regular-full', label: 'Regular (Full Internal)', icon: Factory },
  { id: 'regular-partial', label: 'Regular (Partial Outsource)', icon: Wrench },
  { id: 'outsource', label: 'Outsource (Full)', icon: Package },
  { id: 'final-part', label: 'Final Part', icon: Box },
  { id: 'repeat', label: 'Repeat Order', icon: Copy },
]

const odooSyncItems = [
  { process: 'Sales Order Creation', actor: 'Marketing', sync: true, endpoint: 'POST /api/sales-orders/:id/push-odoo', description: 'Push Sales Order to Odoo' },
  { process: 'Purchase Request', actor: 'System/PPIC', sync: true, endpoint: 'POST /api/purchase-requests/:id/push-odoo', description: 'Push PR to Odoo Procurement' },
  { process: 'Goods Received', actor: 'Warehouse', sync: true, endpoint: 'POST /api/goods-received/:id/sync-odoo', description: 'Sync inventory to Odoo' },
  { process: 'Order Creation', actor: 'Marketing', sync: false, endpoint: '-', description: 'ManuOS is entry point' },
  { process: 'Drawing Request', actor: 'Marketing', sync: false, endpoint: '-', description: 'Internal process' },
  { process: 'Engineering Processing', actor: 'Engineering', sync: false, endpoint: '-', description: 'Internal process' },
  { process: 'Recipe/BOM', actor: 'PPIC', sync: false, endpoint: '-', description: 'Internal process' },
  { process: 'Manufacturing Order', actor: 'PPIC', sync: false, endpoint: '-', description: 'Internal process' },
  { process: 'Vendor Order', actor: 'PPIC', sync: false, endpoint: '-', description: 'Internal process' },
  { process: 'Production', actor: 'Production', sync: false, endpoint: '-', description: 'Internal process' },
  { process: 'QC Inspection', actor: 'QC', sync: false, endpoint: '-', description: 'Internal process' },
  { process: 'Shipping', actor: 'Warehouse', sync: false, endpoint: '-', description: 'Invoice handled by Marketing in Odoo' },
  { process: 'Handoffs', actor: 'All', sync: false, endpoint: '-', description: 'Internal tracking' },
]

const actors = [
  { name: 'Marketing', responsibilities: 'Customer relationship, Orders, Sales Orders', actions: 'Create Orders, Sales Orders, Drawing Requests, Repeat Orders' },
  { name: 'Engineering', responsibilities: 'Design, Drawing, Estimation', actions: 'Process Drawing Requests, Upload Drawings, Provide Estimations' },
  { name: 'PPIC', responsibilities: 'Production Planning, BOM, MO, Master Plan', actions: 'Create Recipes, MOs, PRs, Vendor Orders, Manage Master Plan' },
  { name: 'Procurement', responsibilities: 'Purchasing, Vendor Management', actions: 'Process PRs, Create POs, Manage Vendors' },
  { name: 'Warehouse', responsibilities: 'Inventory, Receiving, Delivery, Shipping', actions: 'Receive Materials, Update Inventory, Deliver to Production, Pack and Ship to Customer' },
  { name: 'Production', responsibilities: 'Manufacturing, Assembly', actions: 'Execute Tasks, Record Materials, Track Progress' },
  { name: 'QC', responsibilities: 'Quality Control, Inspection', actions: 'Create Inspections, Make Decisions, Attach Documents' },
  { name: 'Vendor', responsibilities: 'Outsource Processing', actions: 'Process Outsource Work, Return Finished Goods' },
]

const handoffTypes = [
  { type: 'DRAWING', from: 'Engineering', to: 'PPIC', trigger: 'Drawing Completed', notification: 'Email + Push' },
  { type: 'MATERIAL', from: 'Warehouse', to: 'Production', trigger: 'Material Delivery', notification: 'Email + Push' },
  { type: 'PRODUCTION_OUTPUT', from: 'Production', to: 'QC', trigger: 'Task Completed', notification: 'Email + Push' },
  { type: 'QC', from: 'QC', to: 'Warehouse', trigger: 'QC Passed', notification: 'Email + Push' },
  { type: 'SHIPPING', from: 'Warehouse', to: 'Customer', trigger: 'Order Shipped', notification: 'Email + Push' },
  { type: 'VENDOR', from: 'PPIC', to: 'Vendor', trigger: 'Vendor Order Created', notification: 'Email + Push' },
  { type: 'VENDOR_RETURN', from: 'Vendor', to: 'QC/Production', trigger: 'Work Completed', notification: 'Email + Push' },
]

const notifications = [
  { event: 'Order Created', recipients: 'Engineering, PPIC', type: 'Email + Push' },
  { event: 'Drawing Request Created', recipients: 'Engineering', type: 'Email + Push' },
  { event: 'Drawing Completed', recipients: 'PPIC', type: 'Email + Push' },
  { event: 'MO Created', recipients: 'Production, Warehouse', type: 'Email + Push' },
  { event: 'PR Created', recipients: 'Procurement', type: 'Email + Push' },
  { event: 'PR Pushed to Odoo', recipients: 'Procurement', type: 'Email + Push' },
  { event: 'Materials Received', recipients: 'PPIC, Production', type: 'Email + Push' },
  { event: 'Material Delivered', recipients: 'Production', type: 'Email + Push' },
  { event: 'Task Completed', recipients: 'QC', type: 'Email + Push' },
  { event: 'QC Inspection Completed', recipients: 'Warehouse', type: 'Email + Push' },
  { event: 'Vendor Order Created', recipients: 'Vendor', type: 'Email + Push' },
  { event: 'Vendor Work Completed', recipients: 'QC, Production', type: 'Email + Push' },
  { event: 'Order Shipped', recipients: 'Marketing, Customer', type: 'Email + Push' },
  { event: 'Handoff Created', recipients: 'Receiver', type: 'Email + Push' },
  { event: 'Handoff Confirmed', recipients: 'Sender', type: 'Email + Push' },
]

const FlowStep = ({ number, title, actor, description, odooSync, details, isOpen, onToggle }: any) => (
  <div className="border rounded-lg mb-3 overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm shrink-0">
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium">{title}</span>
          <Badge variant="outline" className="text-xs">{actor}</Badge>
          {odooSync && <Badge className="bg-green-100 text-green-800 text-xs">Odoo Sync</Badge>}
        </div>
        <p className="text-sm text-muted-foreground mt-1 truncate">{description}</p>
      </div>
      {isOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
    </button>
    {isOpen && details && (
      <div className="px-4 pb-4 pt-0 border-t bg-muted/30">
        <div className="mt-3 text-sm space-y-2">{details}</div>
      </div>
    )}
  </div>
)

const HighLevelFlow = ({ steps }: { steps: string[] }) => (
  <div className="flex items-center gap-2 flex-wrap py-4">
    {steps.map((step, i) => (
      <div key={i} className="flex items-center gap-2">
        <Badge variant="outline" className="px-3 py-1.5 text-sm font-medium">
          {step}
        </Badge>
        {i < steps.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
      </div>
    ))}
  </div>
)

export default function FlowPage() {
  const [openSteps, setOpenSteps] = useState<Record<string, boolean>>({})
  const [activeFlow, setActiveFlow] = useState('regular-full')

  const toggleStep = (id: string) => {
    setOpenSteps(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <AppLayout title="Manufacturing Flow">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Comprehensive Manufacturing Flow</h1>
          <p className="text-muted-foreground mt-1">
            Complete workflow documentation for ManuOS - All processes, actors, and Odoo synchronization
          </p>
        </div>

        {/* Flow Type Tabs */}
        <Tabs value={activeFlow} onValueChange={setActiveFlow}>
          <TabsList className="grid w-full grid-cols-5">
            {flowTypes.map(ft => (
              <TabsTrigger key={ft.id} value={ft.id} className="flex items-center gap-2">
                <ft.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{ft.label}</span>
                <span className="sm:hidden">{ft.label.split(' ')[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Flow 1: Regular (Full Internal) */}
          <TabsContent value="regular-full" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Factory className="h-5 w-5" />
                  Flow 1: Regular Order (Full Internal Process)
                </CardTitle>
                <CardDescription>All processes handled internally - from order to delivery</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2 text-muted-foreground">HIGH-LEVEL FLOW</h3>
                  <HighLevelFlow steps={[
                    'Customer PO',
                    'Marketing',
                    'Engineering',
                    'PPIC',
                    'Procurement',
                    'Warehouse',
                    'Production',
                    'QC',
                    'Warehouse',
                    'Customer'
                  ]} />
                </div>

                <h3 className="text-sm font-medium mb-3 text-muted-foreground">DETAILED STEPS</h3>

                <FlowStep number={1} title="Order Creation" actor="Marketing" description="Create Order in ManuOS" odooSync={false}
                  isOpen={openSteps['r1']} onToggle={() => toggleStep('r1')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> Marketing</p>
                      <p><strong>Process:</strong> Create Order in ManuOS</p>
                      <p><strong>Fields:</strong> Customer name, Customer PO number, Order date, Order type: REGULAR, Notes</p>
                      <p><strong>Odoo Sync:</strong> NO (ManuOS is entry point)</p>
                    </div>
                  }
                />

                <FlowStep number={2} title="Sales Order Creation" actor="Marketing" description="Create Sales Order and push to Odoo" odooSync={true}
                  isOpen={openSteps['r2']} onToggle={() => toggleStep('r2')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> Marketing</p>
                      <p><strong>Process:</strong> Create Sales Order in ManuOS</p>
                      <p><strong>Fields:</strong> Sales Order number, Link to Order, Finished goods list, Quantity, Price, Currency</p>
                      <p><strong>Odoo Sync:</strong> YES - Push to Odoo</p>
                      <p><strong>Endpoint:</strong> POST /api/sales-orders/:id/push-odoo</p>
                      <p><strong>Status Flow:</strong> DRAFT → CONFIRMED → PUSHED_TO_ODOO</p>
                    </div>
                  }
                />

                <FlowStep number={3} title="Drawing Request" actor="Marketing" description="Create Drawing Request for Engineering" odooSync={false}
                  isOpen={openSteps['r3']} onToggle={() => toggleStep('r3')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> Marketing</p>
                      <p><strong>Process:</strong> Create Drawing Request in ManuOS</p>
                      <p><strong>Fields:</strong> Link to Order, Part number, Part name, Quantity, Material (optional), Special requirements</p>
                      <p><strong>Odoo Sync:</strong> NO</p>
                      <p><strong>Handoff:</strong> Marketing → Engineering (notification sent)</p>
                    </div>
                  }
                />

                <FlowStep number={4} title="Engineering Processing" actor="Engineering" description="Process Drawing Request and provide estimation" odooSync={false}
                  isOpen={openSteps['r4']} onToggle={() => toggleStep('r4')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> Engineering</p>
                      <p><strong>Process:</strong> Process Drawing Request</p>
                      <p><strong>Actions:</strong> Review request details, Provide design estimation (hours), Provide drawing estimation (hours), Calculate total estimation, Set estimated completion date</p>
                      <p><strong>Odoo Sync:</strong> NO</p>
                    </div>
                  }
                />

                <FlowStep number={5} title="Drawing Upload" actor="Engineering" description="Upload drawing files to bucket storage" odooSync={false}
                  isOpen={openSteps['r5']} onToggle={() => toggleStep('r5')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> Engineering</p>
                      <p><strong>Process:</strong> Upload Drawing Files</p>
                      <p><strong>Actions:</strong> Upload CAD/CAM files, Upload detail drawings, Store in bucket storage</p>
                      <p><strong>Odoo Sync:</strong> NO</p>
                    </div>
                  }
                />

                <FlowStep number={6} title="Drawing Completion" actor="Engineering" description="Mark Drawing Request as Completed" odooSync={false}
                  isOpen={openSteps['r6']} onToggle={() => toggleStep('r6')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> Engineering</p>
                      <p><strong>Process:</strong> Mark Drawing Request as Completed</p>
                      <p><strong>Status Flow:</strong> PENDING → IN_PROGRESS → COMPLETED</p>
                      <p><strong>Odoo Sync:</strong> NO</p>
                      <p><strong>Handoff:</strong> Engineering → PPIC (auto-create handoff, notification sent)</p>
                    </div>
                  }
                />

                <FlowStep number={7} title="Recipe/BOM Creation" actor="PPIC" description="Create Recipe/BOM for manufacturing" odooSync={false}
                  isOpen={openSteps['r7']} onToggle={() => toggleStep('r7')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> PPIC</p>
                      <p><strong>Process:</strong> Create Recipe/BOM</p>
                      <p><strong>Actions:</strong> Create from template or new, Define materials list, Define quantities, Define operations, Define lead times</p>
                      <p><strong>Odoo Sync:</strong> NO</p>
                    </div>
                  }
                />

                <FlowStep number={8} title="Manufacturing Order Creation" actor="PPIC" description="Create Manufacturing Order" odooSync={false}
                  isOpen={openSteps['r8']} onToggle={() => toggleStep('r8')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> PPIC</p>
                      <p><strong>Process:</strong> Create Manufacturing Order</p>
                      <p><strong>Fields:</strong> Link to Order, Link to Recipe/BOM, Quantity, Planned start/end dates, Production estimation</p>
                      <p><strong>Odoo Sync:</strong> NO</p>
                    </div>
                  }
                />

                <FlowStep number={9} title="Material Requirements Calculation" actor="System" description="Auto-calculate material requirements from BOM" odooSync={false}
                  isOpen={openSteps['r9']} onToggle={() => toggleStep('r9')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> System (Auto)</p>
                      <p><strong>Process:</strong> Calculate Material Requirements</p>
                      <p><strong>Actions:</strong> Calculate from BOM, Check inventory availability, Identify shortages</p>
                      <p><strong>Odoo Sync:</strong> NO</p>
                    </div>
                  }
                />

                <FlowStep number={10} title="Purchase Request Generation" actor="System/PPIC" description="Generate Purchase Request for shortages" odooSync={true}
                  isOpen={openSteps['r10']} onToggle={() => toggleStep('r10')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> System (Auto) / PPIC (Manual)</p>
                      <p><strong>Process:</strong> Generate Purchase Request</p>
                      <p><strong>Actions:</strong> Create PR for shortages, Define quantities, Set priority</p>
                      <p><strong>Odoo Sync:</strong> YES - Push to Odoo Procurement</p>
                      <p><strong>Endpoint:</strong> POST /api/purchase-requests/:id/push-odoo</p>
                      <p><strong>Handoff:</strong> PPIC → Procurement (notification sent)</p>
                    </div>
                  }
                />

                <FlowStep number={11} title="Procurement Processing" actor="Procurement" description="Process Purchase Request and create Purchase Order" odooSync={true}
                  isOpen={openSteps['r11']} onToggle={() => toggleStep('r11')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> Procurement</p>
                      <p><strong>Process:</strong> Process Purchase Request</p>
                      <p><strong>Actions:</strong> Review PR details, Provide material fulfillment estimation, Create Purchase Order, Send PO to vendor</p>
                      <p><strong>Odoo Sync:</strong> YES - PO created in Odoo</p>
                    </div>
                  }
                />

                <FlowStep number={12} title="Goods Received Note (GRN)" actor="Warehouse" description="Receive Materials and update inventory" odooSync={true}
                  isOpen={openSteps['r12']} onToggle={() => toggleStep('r12')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> Warehouse</p>
                      <p><strong>Process:</strong> Receive Materials</p>
                      <p><strong>Actions:</strong> Create GRN, Verify quantities, Check quality, Update inventory</p>
                      <p><strong>Odoo Sync:</strong> YES - Sync to Odoo Inventory</p>
                      <p><strong>Endpoint:</strong> POST /api/goods-received/:id/sync-odoo</p>
                      <p><strong>Status Flow:</strong> PENDING → RECEIVED → SYNCED_TO_ODOO</p>
                    </div>
                  }
                />

                <FlowStep number={13} title="Material Delivery to Production" actor="Warehouse" description="Deliver materials to Production" odooSync={false}
                  isOpen={openSteps['r13']} onToggle={() => toggleStep('r13')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> Warehouse</p>
                      <p><strong>Process:</strong> Deliver Materials to Production</p>
                      <p><strong>Actions:</strong> Pick materials from inventory, Create handoff, Track PIC, reason, timestamp</p>
                      <p><strong>Odoo Sync:</strong> NO</p>
                      <p><strong>Handoff:</strong> Warehouse → Production (notification sent)</p>
                    </div>
                  }
                />

                <FlowStep number={14} title="Production Execution" actor="Production" description="Execute manufacturing tasks" odooSync={false}
                  isOpen={openSteps['r14']} onToggle={() => toggleStep('r14')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> Production</p>
                      <p><strong>Process:</strong> Execute Tasks</p>
                      <p><strong>Actions:</strong> Clock in/out, Record material consumption, Update progress, Track actual hours</p>
                      <p><strong>Odoo Sync:</strong> NO</p>
                    </div>
                  }
                />

                <FlowStep number={15} title="Production Completion" actor="Production" description="Mark Task as Completed" odooSync={false}
                  isOpen={openSteps['r15']} onToggle={() => toggleStep('r15')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> Production</p>
                      <p><strong>Process:</strong> Mark Task as Completed</p>
                      <p><strong>Status Flow:</strong> PENDING → RUNNING → COMPLETED</p>
                      <p><strong>Odoo Sync:</strong> NO</p>
                      <p><strong>Handoff:</strong> Production → QC (auto-create handoff, notification sent)</p>
                    </div>
                  }
                />

                <FlowStep number={16} title="QC Inspection" actor="QC" description="Create QC Inspection" odooSync={false}
                  isOpen={openSteps['r16']} onToggle={() => toggleStep('r16')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> QC</p>
                      <p><strong>Process:</strong> Create QC Inspection</p>
                      <p><strong>Inspection Types:</strong> FIRST_ARTICLE, AFTER_PROCESSING</p>
                      <p><strong>Actions:</strong> Record quantity, Record pass/fail quantity, Attach documents/images, Add notes</p>
                      <p><strong>Odoo Sync:</strong> NO</p>
                    </div>
                  }
                />

                <FlowStep number={17} title="QC Decision" actor="QC" description="Make Pass/Fail/Rework decision" odooSync={false}
                  isOpen={openSteps['r17']} onToggle={() => toggleStep('r17')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> QC</p>
                      <p><strong>Decision:</strong> Pass, Fail, or Rework</p>
                      <ul className="list-disc list-inside ml-2">
                        <li>Pass → Move to Warehouse</li>
                        <li>Fail → Scrap or Rework</li>
                        <li>Rework → Send back to Production</li>
                      </ul>
                      <p><strong>Odoo Sync:</strong> NO</p>
                      <p><strong>Handoff:</strong> QC → Warehouse (if passed, auto-create handoff, notification sent)</p>
                    </div>
                  }
                />

                <FlowStep number={18} title="Warehouse Receiving" actor="Warehouse" description="Receive finished goods from QC" odooSync={false}
                  isOpen={openSteps['r18']} onToggle={() => toggleStep('r18')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> Warehouse</p>
                      <p><strong>Process:</strong> Receive finished goods from QC</p>
                      <p><strong>Actions:</strong> Verify quantity, Update inventory (finished goods), Prepare for shipping</p>
                      <p><strong>Odoo Sync:</strong> NO</p>
                      <p><strong>Handoff:</strong> QC → Warehouse (notification sent)</p>
                    </div>
                  }
                />

                <FlowStep number={19} title="Shipping" actor="Warehouse" description="Pack and Ship to Customer" odooSync={false}
                  isOpen={openSteps['r19']} onToggle={() => toggleStep('r19')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> Warehouse</p>
                      <p><strong>Process:</strong> Pack and Ship to Customer</p>
                      <p><strong>Actions:</strong> Create packing list, Attach shipping documents, Mark as shipped</p>
                      <p><strong>Odoo Sync:</strong> NO (Invoice handled by Marketing in Odoo)</p>
                      <p><strong>Handoff:</strong> Warehouse → Customer (track delivery status)</p>
                    </div>
                  }
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Flow 2: Regular (Partial Outsource) */}
          <TabsContent value="regular-partial" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Flow 2: Regular Order (Partially Outsource)
                </CardTitle>
                <CardDescription>Some processes outsourced to vendors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2 text-muted-foreground">HIGH-LEVEL FLOW</h3>
                  <HighLevelFlow steps={[
                    'Customer PO',
                    'Marketing',
                    'Engineering',
                    'PPIC',
                    'Procurement',
                    'Warehouse',
                    'Production',
                    'Vendor',
                    'QC',
                    'Warehouse',
                    'Customer'
                  ]} />
                </div>

                <h3 className="text-sm font-medium mb-3 text-muted-foreground">DETAILED STEPS</h3>

                <FlowStep number="1-6" title="Same as Regular (Full Internal)" actor="Multiple" description="Order Creation through Drawing Completion" odooSync={false}
                  isOpen={openSteps['po1']} onToggle={() => toggleStep('po1')}
                  details={
                    <div className="space-y-2">
                      <p>Steps 1-6 are identical to the Regular (Full Internal) flow:</p>
                      <ul className="list-disc list-inside ml-2">
                        <li>Order Creation (Marketing)</li>
                        <li>Sales Order Creation → Push to Odoo (Marketing)</li>
                        <li>Drawing Request (Marketing)</li>
                        <li>Engineering Processing (Engineering)</li>
                        <li>Drawing Upload (Engineering)</li>
                        <li>Drawing Completion → Handoff to PPIC (Engineering)</li>
                      </ul>
                    </div>
                  }
                />

                <FlowStep number={7} title="Recipe/BOM Creation" actor="PPIC" description="Create Recipe/BOM with outsource processes identified" odooSync={false}
                  isOpen={openSteps['po7']} onToggle={() => toggleStep('po7')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> PPIC</p>
                      <p><strong>Process:</strong> Create Recipe/BOM</p>
                      <p><strong>Special:</strong> Identify outsource processes, Mark processes as "Outsource"</p>
                      <p><strong>Odoo Sync:</strong> NO</p>
                    </div>
                  }
                />

                <FlowStep number={8} title="Manufacturing Order Creation" actor="PPIC" description="Create MO with outsource type: PARTIAL" odooSync={false}
                  isOpen={openSteps['po8']} onToggle={() => toggleStep('po8')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> PPIC</p>
                      <p><strong>Process:</strong> Create Manufacturing Order</p>
                      <p><strong>Special:</strong> Set outsourceType: PARTIAL, Identify outsource processes</p>
                      <p><strong>Odoo Sync:</strong> NO</p>
                    </div>
                  }
                />

                <FlowStep number={9} title="Vendor Selection" actor="PPIC" description="Select vendor for outsource processes" odooSync={false}
                  isOpen={openSteps['po9']} onToggle={() => toggleStep('po9')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> PPIC</p>
                      <p><strong>Process:</strong> Select Vendor for Outsource</p>
                      <p><strong>Actions:</strong> Filter by capability, Compare lead time/quality/price, Select vendor manually</p>
                      <p><strong>Odoo Sync:</strong> NO</p>
                    </div>
                  }
                />

                <FlowStep number={10} title="Vendor Order Creation" actor="PPIC" description="Create Vendor Order for outsource work" odooSync={false}
                  isOpen={openSteps['po10']} onToggle={() => toggleStep('po10')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> PPIC</p>
                      <p><strong>Process:</strong> Create Vendor Order</p>
                      <p><strong>Fields:</strong> Link to MO, Work description, Quantity, Price, Promised date</p>
                      <p><strong>Odoo Sync:</strong> NO</p>
                      <p><strong>Handoff:</strong> PPIC → Vendor (auto-create handoff, notification sent)</p>
                    </div>
                  }
                />

                <FlowStep number="11-13" title="Material Procurement" actor="Multiple" description="PR generation, Procurement, GRN" odooSync={true}
                  isOpen={openSteps['po11']} onToggle={() => toggleStep('po11')}
                  details={
                    <div className="space-y-2">
                      <p>Steps 11-13 are identical to the Regular (Full Internal) flow:</p>
                      <ul className="list-disc list-inside ml-2">
                        <li>Material Requirements Calculation (System)</li>
                        <li>Purchase Request Generation → Push to Odoo (System/PPIC)</li>
                        <li>Procurement Processing (Procurement)</li>
                      </ul>
                    </div>
                  }
                />

                <FlowStep number={14} title="Internal Production" actor="Production" description="Execute internal operations only" odooSync={false}
                  isOpen={openSteps['po14']} onToggle={() => toggleStep('po14')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> Production</p>
                      <p><strong>Process:</strong> Execute Internal Tasks</p>
                      <p><strong>Special:</strong> Process internal operations only, Handoff to vendor for outsource processes</p>
                      <p><strong>Odoo Sync:</strong> NO</p>
                    </div>
                  }
                />

                <FlowStep number={15} title="Vendor Processing" actor="Vendor" description="Vendor processes outsource work" odooSync={false}
                  isOpen={openSteps['po15']} onToggle={() => toggleStep('po15')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> Vendor</p>
                      <p><strong>Process:</strong> Vendor Processes Outsource Work</p>
                      <p><strong>Actions:</strong> Receive materials/components, Process outsource operations, Return to Production</p>
                      <p><strong>Odoo Sync:</strong> NO</p>
                      <p><strong>Handoff:</strong> Vendor → Production (auto-create handoff, notification sent)</p>
                    </div>
                  }
                />

                <FlowStep number="16-18" title="QC & Warehouse & Shipping" actor="Multiple" description="QC Inspection, Decision, Warehouse Receiving, Shipping" odooSync={false}
                  isOpen={openSteps['po16']} onToggle={() => toggleStep('po16')}
                  details={
                    <div className="space-y-2">
                      <p>Steps 16-18 are similar to the Regular (Full Internal) flow:</p>
                      <ul className="list-disc list-inside ml-2">
                        <li>QC Inspection (QC)</li>
                        <li>QC Decision (QC)</li>
                        <li>Warehouse Receiving (Warehouse)</li>
                        <li>Shipping to Customer (Warehouse)</li>
                      </ul>
                    </div>
                  }
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Flow 3: Outsource (Full) */}
          <TabsContent value="outsource" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Flow 3: Outsource Order (Fully Outsource)
                </CardTitle>
                <CardDescription>Entire order processed by vendor</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2 text-muted-foreground">HIGH-LEVEL FLOW</h3>
                  <HighLevelFlow steps={[
                    'Customer PO',
                    'Marketing',
                    'Engineering',
                    'PPIC',
                    'Vendor',
                    'QC',
                    'Warehouse',
                    'Customer'
                  ]} />
                </div>

                <h3 className="text-sm font-medium mb-3 text-muted-foreground">DETAILED STEPS</h3>

                <FlowStep number="1-6" title="Same as Regular (Full Internal)" actor="Multiple" description="Order Creation through Drawing Completion" odooSync={false}
                  isOpen={openSteps['fo1']} onToggle={() => toggleStep('fo1')}
                  details={
                    <div className="space-y-2">
                      <p>Steps 1-6 are identical to the Regular (Full Internal) flow.</p>
                    </div>
                  }
                />

                <FlowStep number={7} title="Manufacturing Order Creation" actor="PPIC" description="Create MO with outsource type: FULL" odooSync={false}
                  isOpen={openSteps['fo7']} onToggle={() => toggleStep('fo7')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> PPIC</p>
                      <p><strong>Process:</strong> Create Manufacturing Order</p>
                      <p><strong>Special:</strong> Set outsourceType: FULL, No internal production needed</p>
                      <p><strong>Odoo Sync:</strong> NO</p>
                    </div>
                  }
                />

                <FlowStep number={8} title="Vendor Selection" actor="PPIC" description="Select vendor for full manufacturing" odooSync={false}
                  isOpen={openSteps['fo8']} onToggle={() => toggleStep('fo8')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> PPIC</p>
                      <p><strong>Process:</strong> Select Vendor</p>
                      <p><strong>Actions:</strong> Filter by capability (full manufacturing), Compare lead time/quality/price, Select vendor manually</p>
                      <p><strong>Odoo Sync:</strong> NO</p>
                    </div>
                  }
                />

                <FlowStep number={9} title="Vendor Order Creation" actor="PPIC" description="Create Vendor Order for full manufacturing" odooSync={false}
                  isOpen={openSteps['fo9']} onToggle={() => toggleStep('fo9')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> PPIC</p>
                      <p><strong>Process:</strong> Create Vendor Order</p>
                      <p><strong>Fields:</strong> Link to MO, Work description (full manufacturing), Quantity, Price, Promised date</p>
                      <p><strong>Odoo Sync:</strong> NO</p>
                      <p><strong>Handoff:</strong> PPIC → Vendor (auto-create handoff, notification sent)</p>
                    </div>
                  }
                />

                <FlowStep number={10} title="Vendor Processing" actor="Vendor" description="Vendor processes entire order" odooSync={false}
                  isOpen={openSteps['fo10']} onToggle={() => toggleStep('fo10')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> Vendor</p>
                      <p><strong>Process:</strong> Vendor Processes Entire Order</p>
                      <p><strong>Actions:</strong> Receive materials/components, Process all manufacturing operations, Return finished goods</p>
                      <p><strong>Odoo Sync:</strong> NO</p>
                      <p><strong>Handoff:</strong> Vendor → QC (auto-create handoff, notification sent)</p>
                    </div>
                  }
                />

                <FlowStep number={11} title="Incoming QC Inspection" actor="QC" description="Inspect incoming goods from vendor" odooSync={false}
                  isOpen={openSteps['fo11']} onToggle={() => toggleStep('fo11')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> QC</p>
                      <p><strong>Process:</strong> Incoming Inspection from Vendor</p>
                      <p><strong>Inspection Type:</strong> INCOMING</p>
                      <p><strong>Actions:</strong> Verify quality, Attach vendor documents (COC, test reports), Record pass/fail quantity</p>
                      <p><strong>Odoo Sync:</strong> NO</p>
                    </div>
                  }
                />

                <FlowStep number={12} title="QC Decision" actor="QC" description="Make Pass/Fail/Rework decision" odooSync={false}
                  isOpen={openSteps['fo12']} onToggle={() => toggleStep('fo12')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> QC</p>
                      <p><strong>Decision:</strong> Pass, Fail, or Rework</p>
                      <ul className="list-disc list-inside ml-2">
                        <li>Pass → Move to Warehouse</li>
                        <li>Fail → Return to Vendor</li>
                        <li>Rework → Return to Vendor</li>
                      </ul>
                      <p><strong>Odoo Sync:</strong> NO</p>
                      <p><strong>Handoff:</strong> QC → Warehouse (if passed, auto-create handoff, notification sent)</p>
                    </div>
                  }
                />

                <FlowStep number={13} title="Warehouse Receiving" actor="Warehouse" description="Receive finished goods from QC" odooSync={false}
                  isOpen={openSteps['fo13']} onToggle={() => toggleStep('fo13')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> Warehouse</p>
                      <p><strong>Process:</strong> Receive finished goods from QC</p>
                      <p><strong>Actions:</strong> Verify quantity, Update inventory (finished goods), Prepare for shipping</p>
                      <p><strong>Odoo Sync:</strong> NO</p>
                      <p><strong>Handoff:</strong> QC → Warehouse (notification sent)</p>
                    </div>
                  }
                />

                <FlowStep number={14} title="Shipping" actor="Warehouse" description="Pack and Ship to Customer" odooSync={false}
                  isOpen={openSteps['fo14']} onToggle={() => toggleStep('fo14')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> Warehouse</p>
                      <p><strong>Process:</strong> Pack and Ship to Customer</p>
                      <p><strong>Actions:</strong> Create packing list, Attach shipping documents, Mark as shipped</p>
                      <p><strong>Odoo Sync:</strong> NO (Invoice handled by Marketing in Odoo)</p>
                      <p><strong>Handoff:</strong> Warehouse → Customer (track delivery status)</p>
                    </div>
                  }
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Flow 4: Final Part */}
          <TabsContent value="final-part" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Box className="h-5 w-5" />
                  Flow 4: Final Part Order
                </CardTitle>
                <CardDescription>No manufacturing needed - stock, purchased, or external source</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2 text-muted-foreground">HIGH-LEVEL FLOW</h3>
                  <HighLevelFlow steps={[
                    'Customer PO',
                    'Marketing',
                    'PPIC',
                    'Source',
                    'Warehouse',
                    'Customer'
                  ]} />
                </div>

                <h3 className="text-sm font-medium mb-3 text-muted-foreground">DETAILED STEPS</h3>

                <FlowStep number="1-2" title="Order & Sales Order" actor="Marketing" description="Create Order (type: FINAL_PART) and Sales Order" odooSync={true}
                  isOpen={openSteps['fp1']} onToggle={() => toggleStep('fp1')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> Marketing</p>
                      <p><strong>Process:</strong> Create Order (type: FINAL_PART), Create Sales Order → Push to Odoo</p>
                      <p><strong>Odoo Sync:</strong> YES - Sales Order push to Odoo</p>
                    </div>
                  }
                />

                <FlowStep number={3} title="Final Part Identification" actor="PPIC" description="Identify as Final Part and determine source" odooSync={false}
                  isOpen={openSteps['fp3']} onToggle={() => toggleStep('fp3')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> PPIC</p>
                      <p><strong>Process:</strong> Identify as Final Part</p>
                      <p><strong>Special:</strong> No manufacturing needed, Determine source: Stock, Purchased, or External</p>
                      <p><strong>Odoo Sync:</strong> NO</p>
                    </div>
                  }
                />

                <FlowStep number={4} title="Source Selection" actor="PPIC" description="Select source: Stock, Purchased, or External" odooSync={false}
                  isOpen={openSteps['fp4']} onToggle={() => toggleStep('fp4')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> PPIC</p>
                      <p><strong>Decision:</strong> Stock, Purchased, or External</p>
                      <ul className="list-disc list-inside ml-2">
                        <li>Stock → Pick from inventory</li>
                        <li>Purchased → Create PR and purchase</li>
                        <li>External → Receive from vendor</li>
                      </ul>
                      <p><strong>Odoo Sync:</strong> NO</p>
                    </div>
                  }
                />

                <FlowStep number="5A" title="Stock Source" actor="Warehouse" description="Pick from existing inventory" odooSync={false}
                  isOpen={openSteps['fp5a']} onToggle={() => toggleStep('fp5a')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> Warehouse</p>
                      <p><strong>Process:</strong> Pick from Inventory</p>
                      <p><strong>Actions:</strong> Check availability, Pick items, Update inventory</p>
                      <p><strong>Odoo Sync:</strong> NO</p>
                      <p><strong>Note:</strong> Items are already in Warehouse, ready for shipping</p>
                    </div>
                  }
                />

                <FlowStep number="5B" title="Purchased Source" actor="Procurement" description="Purchase from vendor" odooSync={true}
                  isOpen={openSteps['fp5b']} onToggle={() => toggleStep('fp5b')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> Procurement</p>
                      <p><strong>Process:</strong> Purchase from Vendor</p>
                      <p><strong>Actions:</strong> Create PR, Push PR to Odoo (sync), Create PO, Receive materials, Update inventory</p>
                      <p><strong>Odoo Sync:</strong> YES - PR and PO sync to Odoo</p>
                      <p><strong>Handoff:</strong> Procurement → Warehouse (auto-create handoff, notification sent)</p>
                    </div>
                  }
                />

                <FlowStep number="5C" title="External Source" actor="Vendor" description="Receive from vendor" odooSync={false}
                  isOpen={openSteps['fp5c']} onToggle={() => toggleStep('fp5c')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> Vendor</p>
                      <p><strong>Process:</strong> Receive from Vendor</p>
                      <p><strong>Actions:</strong> Create Vendor Order, Receive from vendor, QC inspection (incoming)</p>
                      <p><strong>Odoo Sync:</strong> NO</p>
                      <p><strong>Handoff:</strong> Vendor → Warehouse (auto-create handoff, notification sent)</p>
                    </div>
                  }
                />

                <FlowStep number={6} title="Shipping" actor="Warehouse" description="Pack and Ship to Customer" odooSync={false}
                  isOpen={openSteps['fp6']} onToggle={() => toggleStep('fp6')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> Warehouse</p>
                      <p><strong>Process:</strong> Pack and Ship to Customer</p>
                      <p><strong>Actions:</strong> Create packing list, Attach shipping documents, Mark as shipped</p>
                      <p><strong>Odoo Sync:</strong> NO (Invoice handled by Marketing in Odoo)</p>
                      <p><strong>Handoff:</strong> Warehouse → Customer (track delivery status)</p>
                    </div>
                  }
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Flow 5: Repeat Order */}
          <TabsContent value="repeat" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Copy className="h-5 w-5" />
                  Flow 5: Repeat Order
                </CardTitle>
                <CardDescription>Copy from previous order - skip some processes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2 text-muted-foreground">HIGH-LEVEL FLOW</h3>
                  <HighLevelFlow steps={[
                    'Select Previous',
                    'Copy Options',
                    'Create New',
                    'Sales Order',
                    'Continue',
                    'Warehouse',
                    'Customer'
                  ]} />
                </div>

                <h3 className="text-sm font-medium mb-3 text-muted-foreground">DETAILED STEPS</h3>

                <FlowStep number={1} title="Select Previous Order" actor="Marketing" description="Select previous order to copy" odooSync={false}
                  isOpen={openSteps['rp1']} onToggle={() => toggleStep('rp1')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> Marketing</p>
                      <p><strong>Process:</strong> Select Previous Order to Copy</p>
                      <p><strong>Actions:</strong> Search previous orders, Select order to repeat</p>
                      <p><strong>Odoo Sync:</strong> NO</p>
                    </div>
                  }
                />

                <FlowStep number={2} title="Copy Options" actor="Marketing" description="Select what to copy from previous order" odooSync={false}
                  isOpen={openSteps['rp2']} onToggle={() => toggleStep('rp2')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> Marketing</p>
                      <p><strong>Process:</strong> Select What to Copy</p>
                      <p><strong>Options:</strong></p>
                      <ul className="list-disc list-inside ml-2">
                        <li>Copy Drawing Request (skip if same product)</li>
                        <li>Copy Recipe/BOM (skip if same product)</li>
                        <li>Copy MO template (skip if same process)</li>
                        <li>Copy PR template (skip if same materials)</li>
                      </ul>
                      <p><strong>Keep:</strong> Material check, Production, QC, Shipping</p>
                      <p><strong>Odoo Sync:</strong> NO</p>
                    </div>
                  }
                />

                <FlowStep number={3} title="Create New Order" actor="System" description="Create new order from copy" odooSync={false}
                  isOpen={openSteps['rp3']} onToggle={() => toggleStep('rp3')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> System (Auto)</p>
                      <p><strong>Process:</strong> Create New Order from Copy</p>
                      <p><strong>Actions:</strong> Create new Order, Link to original order, Copy selected items, Update quantities if different</p>
                      <p><strong>Odoo Sync:</strong> NO</p>
                    </div>
                  }
                />

                <FlowStep number={4} title="Sales Order Creation" actor="Marketing" description="Create Sales Order and push to Odoo" odooSync={true}
                  isOpen={openSteps['rp4']} onToggle={() => toggleStep('rp4')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Actor:</strong> Marketing</p>
                      <p><strong>Process:</strong> Create Sales Order</p>
                      <p><strong>Odoo Sync:</strong> YES - Push to Odoo</p>
                    </div>
                  }
                />

                <FlowStep number={5} title="Continue Workflow" actor="Multiple" description="Continue from where copy ended" odooSync={false}
                  isOpen={openSteps['rp5']} onToggle={() => toggleStep('rp5')}
                  details={
                    <div className="space-y-2">
                      <p><strong>Process:</strong> Continue from Where Copy Ended</p>
                      <ul className="list-disc list-inside ml-2">
                        <li>If Drawing skipped → Start from PPIC</li>
                        <li>If Recipe skipped → Start from MO</li>
                        <li>If MO skipped → Start from Material Check</li>
                      </ul>
                      <p><strong>Continue:</strong> Production, QC, Shipping</p>
                      <p><strong>Odoo Sync:</strong> As needed (PR, Inventory)</p>
                    </div>
                  }
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Odoo Sync Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Odoo Synchronization Summary
            </CardTitle>
            <CardDescription>Processes that sync with Odoo ERP</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Process</th>
                    <th className="text-left p-2 font-medium">Actor</th>
                    <th className="text-left p-2 font-medium">Odoo Sync</th>
                    <th className="text-left p-2 font-medium">Endpoint</th>
                    <th className="text-left p-2 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {odooSyncItems.map((item, i) => (
                    <tr key={i} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{item.process}</td>
                      <td className="p-2">
                        <Badge variant="outline">{item.actor}</Badge>
                      </td>
                      <td className="p-2">
                        {item.sync ? (
                          <Badge className="bg-green-100 text-green-800">YES</Badge>
                        ) : (
                          <Badge variant="secondary">NO</Badge>
                        )}
                      </td>
                      <td className="p-2 font-mono text-xs">{item.endpoint}</td>
                      <td className="p-2 text-muted-foreground">{item.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Actor Responsibilities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Actor Responsibilities
            </CardTitle>
            <CardDescription>Roles and responsibilities for each actor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {actors.map((actor, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">{actor.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{actor.responsibilities}</p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Key Actions:</strong> {actor.actions}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Handoff Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              Handoff Types
            </CardTitle>
            <CardDescription>Material and document transfer tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Type</th>
                    <th className="text-left p-2 font-medium">From</th>
                    <th className="text-left p-2 font-medium">To</th>
                    <th className="text-left p-2 font-medium">Trigger</th>
                    <th className="text-left p-2 font-medium">Notification</th>
                  </tr>
                </thead>
                <tbody>
                  {handoffTypes.map((item, i) => (
                    <tr key={i} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <Badge variant="outline">{item.type}</Badge>
                      </td>
                      <td className="p-2">{item.from}</td>
                      <td className="p-2">{item.to}</td>
                      <td className="p-2">{item.trigger}</td>
                      <td className="p-2">
                        <Badge className="bg-blue-100 text-blue-800">{item.notification}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Notification Triggers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Notification Triggers
            </CardTitle>
            <CardDescription>Events that trigger notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Event</th>
                    <th className="text-left p-2 font-medium">Recipients</th>
                    <th className="text-left p-2 font-medium">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((item, i) => (
                    <tr key={i} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{item.event}</td>
                      <td className="p-2">{item.recipients}</td>
                      <td className="p-2">
                        <Badge className="bg-purple-100 text-purple-800">{item.type}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
