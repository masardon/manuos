import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Validation schema for form templates
const formTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.enum(['manufacturing', 'assembly', 'quality_control', 'purchase_request', 'maintenance', 'change_request']),
  description: z.string().optional(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  config: z.object({
    structure: z.object({
      maxParts: z.number().min(1).max(10),
      minParts: z.number().min(1).max(1),
      defaultParts: z.number().min(1).max(10),
      customFields: z.array(z.object({
        id: z.string(),
        type: z.enum(['text', 'number', 'date', 'dropdown', 'checkbox', 'signature', 'file_upload', 'image_upload', 'textarea']),
        label: z.string(),
        key: z.string(),
        placeholder: z.string().optional(),
        defaultValue: z.string().optional(),
        validation: z.object({
          type: z.enum(['required', 'min', 'max', 'pattern', 'custom']),
          value: z.union([z.string(), z.number(), z.boolean()]).optional(),
          options: z.array(z.object({
            value: z.string(),
            label: z.string()
          })).optional()
        }).optional(),
        options: z.array(z.object({
          value: z.string(),
          label: z.string()
        })).optional(),
        width: z.number().optional(),
        order: z.number().optional(),
        group: z.string().optional(),
        helpText: z.string().optional(),
        customCssClass: z.string().optional()
      })).optional()
    }),
    isActive: z.boolean().default(true)
  }).optional(),
})

// Pre-built template library (will be expanded later)
const preBuiltTemplates = [
  {
    id: 'tpl-simple-approval',
    name: 'Simple 2-Stage Approval',
    category: 'jobsheet',
    description: 'Standard jobsheet with 2-stage approval',
    isDefault: true,
    config: {
      structure: {
        parts: [
          {
            id: 'part1',
            name: 'Part 1',
            type: 'product',
            fields: [
              { key: 'partNumber', label: 'Part Number', type: 'text' },
              { key: 'partName', label: 'Part Name', type: 'text' },
              { key: 'quantity', label: 'Quantity', type: 'number' }
            ]
          }
        ],
        operations: [
          {
            id: 'op1',
            name: 'CAM Programming',
            type: 'cam',
            fields: [
              { key: 'camProgram', label: 'CAM Program', type: 'file_upload' },
              { key: 'planTime', label: 'Plan Time (minutes)', type: 'number' }
            ]
          },
          {
            id: 'op2',
            name: 'CNC Machining',
            type: 'machining',
            fields: [
              { key: 'programRef', label: 'Program Reference', type: 'text' },
              { key: 'machineId', label: 'Machine', type: 'dropdown', options: [] },
              { key: 'planTime', label: 'Plan Time (minutes)', type: 'number' }
            ]
          },
          {
            id: 'op3',
            name: 'Quality Control',
            type: 'qc',
            fields: [
              { key: 'qcCriteria', label: 'QC Criteria', type: 'textarea' },
              { key: 'result', label: 'Result', type: 'dropdown', options: ['pass', 'fail', 'rework'] }
            ]
          }
        ],
        approvalStages: [
          {
            id: 'stage1',
            name: 'Prepared',
            order: 1,
            requiredSignatures: 1,
            signatureRoles: ['technician', 'supervisor']
          },
          {
            id: 'stage2',
            name: 'Checked',
            order: 2,
            requiredSignatures: 1,
            signatureRoles: ['quality_inspector', 'supervisor']
          },
          {
            id: 'stage3',
            name: 'Approved',
            order: 3,
            requiredSignatures: 1,
            signatureRoles: ['manager']
          }
        ]
      }
    }
  }
]

// Mock in-memory storage (in production, this would be a database)
let templatesStore = [...preBuiltTemplates]

// GET /api/form-templates
export async function GET(request: NextRequest) {
  const { search, category, isActive, isDefault } = Object.fromEntries(
    request.nextUrl.searchParams
  )

  // Simulate form templates database
  let templates = templatesStore

  // Apply filters
  if (category) {
    templates = templates.filter(t => t.category === category)
  }

  if (isActive !== undefined) {
    templates = templates.filter(t => t.isActive === (isActive === 'true'))
  }

  if (isDefault !== undefined) {
    templates = templates.filter(t => t.isDefault === (isDefault === 'true'))
  }

  // Search
  if (search) {
    const searchLower = search.toLowerCase()
    templates = templates.filter(t =>
      t.name.toLowerCase().includes(searchLower) ||
      t.description?.toLowerCase().includes(searchLower)
    )
  }

  return NextResponse.json({
    templates,
    total: templates.length
  })
}

// POST /api/form-templates
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = formTemplateSchema.parse(body)

    // Check for default template in same category
    if (validatedData.isDefault) {
      const existingDefault = templates.find(t =>
        t.category === validatedData.category && t.isDefault
      )

      if (existingDefault && existingDefault.id !== undefined && existingDefault.id !== body.overrideDefaultId) {
        return NextResponse.json({
          error: 'Cannot create new default template. One already exists in this category'
        }, { status: 400 })
      }
    }

    // Create new template
    const newTemplate = {
      id: `tpl_${Date.now()}`,
      ...validatedData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    templatesStore = [...templatesStore, newTemplate]

    return NextResponse.json({
      template: newTemplate,
      message: 'Form template created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating form template:', error)
    return NextResponse.json(
      { error: 'Failed to create form template' },
      { status: 500 }
    )
  }
}