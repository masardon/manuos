# Jobsheet Analysis & Customizability Requirements

**Document Version**: 1.0
**Date**: January 2025
**Subject**: Evaluation of Sample Jobsheet JS102600595 and Customizability Recommendations for ManuOS

---

## 1. Executive Summary

### 1.1 Overview

This document analyzes the sample jobsheet structure (JS102600595) and provides recommendations for implementing customizable forms and workflows in ManuOS to support diverse manufacturing company requirements.

**Key Finding**: The sample jobsheet is highly structured and comprehensive, but also **rigid and company-specific**. To make ManuOS flexible for various manufacturing companies, we need to implement **customizable templates** and **configurable workflows**.

---

## 2. Jobsheet Structure Analysis

### 2.1 Current Structure (From Sample)

The sample jobsheet has the following structure:

**Header Information:**
```
Job Sheet Number: JS102600595 (Page 1 of 3)
Project: P10260314
Final Product: BLOW PLATE COREBOX
Order Reference: Mfg. Order / MO102600203
MO Number: MO102600203
Final Part No: P1
Date Required: 12/02/2026
Required Date: 26/02/2026
```

**Multi-Part Production (3 Parts per Job):**

Each Part Contains:
1. **Part Information**: Part No, Product Name, Part Name, Qty, Part Type
2. **Preparation Workflow**: Prepared → Checked → Approved
3. **Work Operations**:
   - CAM: 3 operations (Plan, Actual, Operator)
   - Machining: 2 operations (Plan, Actual, Operator)
   - QC: Quality Control check
4. **Time Tracking**: Minute estimates and actuals per operation
5. **Approval Levels**:
   - By: Multiple signatures
   - Date: Multiple date fields
   - Date fields: Prepared, Checked, Approved, Final Judge

**Detailed Structure per Part:**

```
Part No: P1
Product: BLOW PLATE COREBOX
Part Name: DR604A ECI
Qty: 1
Part No: P2
Product: BLOW PLATE COREBOX
Part Name: DR604A ECI
Qty: 1
Part No: P3
Product: BLOW PLATE COREBOX
Part Name: DR604A ECI
Qty: 1

Preparation Status: Prepared → Checked → Approved
CAM Operations:
  - Plan: MT102601833
  - Actual: MT102601833
  - Operator: Mach. CAM
  - Time: 360 minutes

Machining Operations:
  - Plan: CNC MILL MT102601834
  - Actual: CNC MILL MT102601834
  - Operator: Mach. PRIMINER (3 AXIS CNC)
  - Time: 480 minutes

QC: Quality Control check
  - Plan: MT102601835
  - Actual: Mach. QUALITY_CONTROL
  - Operator: Mach. QUALITY_CONTROL
  - Time: 30 minutes

Approval Workflow:
  - Prepared By: [Signatures]
  - Prepared Date: F-PPC-01.04/A/5/13-07-2016
  - Checked By: [Signatures]
  - Checked Date: F-PPC-01.04/A/5/13-07-2016
  - Approved By: [Signatures]
  - Approved Date: F-PPC-01.04/A/5/13-07-2016
  - Final Judge: [Signature]
  - Date: Date fields
```

### 2.2 Key Characteristics

| Characteristic | Description | Impact on ManuOS |
|-------------|-------------|----------------|
| **Multi-Level Approval** | Prepared → Checked → Approved → Final Judge | Need configurable workflow stages |
| **Multiple Signatories** | Multiple people sign at each stage | Need signature capture workflow |
| **Time Estimation** | Plan vs Actual times for each operation | Need time tracking feature |
| **Multi-Process** | CAM → Machining → QC per part | Need configurable process types |
| **Flexible Operators** | Different operators per operation | Need operator assignment |
| **Document Reference** | Links to CAM files, drawings | Need file attachment system |
| **Part-Based Structure** | Multiple parts per job sheet | Need hierarchical part management |
| **Rigid Fields** | Fixed field names and structure | Need customizable form fields |

---

## 3. Customizability Requirements

### 3.1 Customizable Form Fields

**Objective**: Allow different companies to define their own form structures based on their processes.

**Requirements:**

**FR-FORM-1: Dynamic Field Configuration**
- Admin can create custom field templates
- Fields types: Text, Number, Date, Dropdown, Checkbox, Signature, File Upload
- Field validation rules (required, min/max values, format patterns)
- Conditional logic (show field B only when field A has value X)
- Field ordering and grouping

**FR-FORM-2: Field Template Library**
- Pre-built templates for common manufacturing industries:
  - Metal fabrication
  - Assembly operations
  - Plastic molding
  - Electronics manufacturing
  - CNC machining
  - Quality control
- Users can select, customize, and clone templates
- Templates can be shared across tenants

**FR-FORM-3: Form Versioning**
- Multiple form versions per company or department
- Version history with timestamps
- Ability to activate/deactivate versions
- Migration path when updating forms

### 3.2 Customizable Workflows

**Objective**: Support different approval processes and operational workflows.

**Requirements:**

**FR-WORKFLOW-1: Workflow Builder**
- Visual workflow designer (drag and drop nodes)
- Define stages, transitions, and conditions
- Configure required fields at each stage
- Set notification triggers
- Define approval requirements (who can approve what)

**FR-WORKFLOW-2: Pre-Built Workflow Templates**
```
Template 1: Simple Approval (2 stages)
  - Created → Approved

Template 2: Standard Manufacturing (3 stages)
  - Prepared → Checked → Approved

Template 3: Multi-Level Approval (4 stages)
  - Prepared → Technical Check → Manager Approval → Final

Template 4: Quality Control (4 stages)
  - Prepared → QC Check → Rework → Re-check → Approved

Template 5: Finance Approval (3 stages)
  - Created → Manager Review → Finance Approval

Template 6: Change Management (5 stages)
  - Requested → Technical Review → Manager Approval → Finance Approval → Implemented
```

**FR-WORKFLOW-3: Workflow Conditions**
- Condition-based routing (e.g., if value > $10,000, require manager approval)
- Parallel approval (multiple approvers in same stage)
- Delegation (approver can delegate to another person)
- Escalation (auto-escalate if not approved within time limit)
- Approval chains (person A → B → C with different approval limits)

**FR-WORKFLOW-4: Electronic Signatures**
- Digital signature capture
- Signature workflow configuration
- Signature authority levels (who signs where)
- Timestamp and audit trail
- Mobile signature support (touch devices)

**FR-WORKFLOW-5: Notifications**
- Email notifications for workflow actions
- In-app notifications
- Mobile push notifications
- Notification rules (who gets notified when)

---

## 4. Database Schema Extensions

### 4.1 Form Template Schema

```prisma
model FormTemplate {
  id          String   @id @default(cuid())
  tenantId    String
  name        String   // e.g., "Standard Jobsheet"
  description String?
  version     Int      @default(1)
  isActive    Boolean  @default(true)
  
  // Template configuration
  category    String   // Manufacturing, Assembly, QC, etc.
  isDefault   Boolean  @default(false)
  config      Json     // Full template structure as JSON
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([tenantId, category])
  @@index([isActive])
}

model FormField {
  id          String   @id @default(cuid())
  templateId  String
  fieldId     String   // Unique within template
  label       String   // e.g., "Part Name"
  fieldType   String   // text, number, date, dropdown, checkbox, signature, file
  key         String   // Database field key
  placeholder  String?
  
  // Validation rules
  isRequired  Boolean  @default(false)
  defaultValue String?
  validation  Json?    // Validation rules as JSON
  
  // UI configuration
  options     Json?     // For dropdowns: [{value, label}]
  width       Int?
  order       Int      @default(0)
  group       String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([templateId])
  @@index([fieldId])
}

model FormVersion {
  id          String   @id @default(cuid())
  templateId  String
  version     Int
  changeLog   String   // JSON of changes
  changedBy  String   // userId
  createdAt   DateTime @default(now())
  
  @@index([templateId, version])
}
```

### 4.2 Workflow Schema

```prisma
model WorkflowTemplate {
  id          String   @id @default(cuid())
  tenantId    String
  name        String   // e.g., "Standard 3-Stage Approval"
  description String?
  category    String   // Jobsheet, Purchase Request, etc.
  
  // Workflow definition
  stages      Json     // Array of stage objects
  transitions Json     // Rules for stage transitions
  isActive    Boolean  @default(true)
  isDefault   Boolean  @default(false)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([tenantId, category])
}

model WorkflowStage {
  id          String   @id @default(cuid())
  templateId  String
  stageId     String
  name        String
  order       Int      // Execution order
  requiredRoles Json?    // Roles that can perform this stage
  autoTransition Json?  // Auto-transition rules
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model WorkflowTransition {
  id          String   @id @default(cuid())
  templateId  String
  fromStage  String
  toStage     String
  conditions  Json?     // When this transition is allowed
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 4.3 Form Submission Schema

```prisma
model FormSubmission {
  id          String   @id @default(cuid())
  tenantId    String
  templateId  String
  version     Int
  
  // Reference to related entity
  entityType  String   // jobsheet, task, order, etc.
  entityId    String
  
  // Form data
  formData    Json     // Key-value pairs of form fields
  attachments Json?    // File attachments
  
  // Workflow state
  currentStage String?
  stageHistory Json?    // Array of {stage, userId, timestamp}
  
  // Signatures
  signatures Json?    // Array of {userId, signature, timestamp}
  
  // Status
  status      String   // draft, submitted, in_review, approved, rejected
  submittedAt DateTime?
  approvedAt  DateTime?
  rejectedAt  DateTime?
  rejectedBy  String?
  rejectionReason String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([tenantId, templateId, entityType, entityId])
  @@index([status])
  @@index([currentStage])
}
```

### 4.4 Jobsheet Schema Extensions

```prisma
model JobsheetTemplate {
  id          String   @id @default(cuid())
  tenantId    String
  name        String   // e.g., "Standard 3-Part Jobsheet"
  description String?
  category    String   // Machining, Assembly, QC, etc.
  
  // Template structure
  structure    Json     // JSON defining parts, operations, approval stages
  config      Json     // Additional configuration
  
  isActive    Boolean  @default(true)
  isDefault   Boolean  @default(false)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([tenantId, category])
}

model JobsheetPart {
  id          String   @id @default(cuid())
  jobsheetId  String
  partNumber  String
  partType    String   // Product, Component, Material
  productName String?
  partName    String?
  quantity    Float
  
  // Custom fields (flexible)
  customFields Json?    // Key-value pairs
  
  // Preparation workflow
  preparedBy  String?
  preparedAt  DateTime?
  checkedBy   String?
  checkedAt   DateTime?
  approvedBy  String?
  approvedAt  DateTime?
  
  // Status
  status      String   // draft, prepared, checked, approved
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([jobsheetId, partNumber])
  @@index([status])
}

model WorkOperation {
  id          String   @id @default(cuid())
  jobsheetPartId String
  operationType String   // CAM, Machining, QC, Assembly, etc.
  sequence    Int      // Operation order within type
  
  // Operation details
  description String?
  operator    String?
  machineId   String?
  programRef  String?    // Reference to CAM program/file
  
  // Time tracking
  estimatedMinutes Float?
  actualMinutes   Float?
  startedAt   DateTime?
  completedAt DateTime?
  
  // Status
  status      String   // planned, in_progress, completed, on_hold, cancelled
  
  // Quality
  qualityCheck Json?    // Pass/fail criteria and results
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([jobsheetPartId, operationType])
  @@index([status])
}
```

### 4.5 Digital Signature Schema

```prisma
model DigitalSignature {
  id          String   @id @default(cuid())
  tenantId    String
  
  // Signature data
  userId      String
  signature   String   // Base64 or encrypted signature
  signedAt    DateTime @default(now())
  ipAddress   String?
  userAgent   String?
  
  // Reference
  referenceType String   // jobsheet, workflow, document
  referenceId  String
  
  createdAt   DateTime @default(now())
  
  @@index([tenantId, userId])
  @@index([referenceType, referenceId])
}

model SignatureTemplate {
  id          String   @id @default(cuid())
  tenantId    String
  name        String   // e.g., "3-Signature Approval"
  description String?
  
  // Signature requirements
  requiredSignatures Int   // Number of signatures needed
  signatureRoles Json?    // Which roles must sign
  
  // Configuration
  isActive    Boolean  @default(true)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## 5. Customizability Features

### 5.1 Form Builder Module

**Objective**: Provide intuitive interface for creating and managing custom forms.

**Features:**

**FB-1: Drag-and-Drop Form Designer**
- Visual form builder with field palette
- Drag fields to canvas to create forms
- Live preview of forms
- Form template library

**FB-2: Field Types Supported**
```
Text Input
  - Single line text
  - Multi-line textarea
  - Rich text editor

Number Input
  - Integer input
  - Decimal input
  - Range slider

Date/Time
  - Date picker
  - Time picker
  - Date range

Selection
  - Dropdown (single select)
  - Multi-select
  - Radio buttons
  - Checkboxes

Special Fields
  - File upload (single & multiple)
  - Image upload with preview
  - Digital signature canvas
  - QR code scanner
  - Barcode scanner

Layout
  - Section headers
  - Column layouts (1, 2, 3, 4)
  - Grid layouts
  - Accordion/collapsible sections

Conditional
  - Show/hide fields based on conditions
  - Field dependencies
  - Dynamic field sets
```

**FB-3: Field Validation**
```typescript
// Validation rules
interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom'
  value?: any
  errorMessage?: string
  customValidator?: string // Function name or regex pattern
}

// Examples
{
  field: 'quantity',
  label: 'Quantity',
  type: 'number',
  validation: {
    required: true,
    min: 1,
    max: 9999,
    step: 1
  }
},
{
  field: 'email',
  label: 'Email Address',
  type: 'text',
  validation: {
    required: true,
    pattern: '^[^\\S]+@\\S+\\.\\S+$'
    errorMessage: 'Please enter a valid email'
  }
},
{
  field: 'phone',
  label: 'Phone Number',
  label: 'Phone Number',
  type: 'text',
  validation: {
    required: false,
    pattern: '^[0-9]{10}$'
    errorMessage: 'Please enter a 10-digit phone number'
  }
}
```

**FB-4: Template Categories**
```
Manufacturing
  - Job Sheet (Multi-part)
  - Work Order
  - Change Request
  - Purchase Request

Quality Control
  - Inspection Checklist
  - Non-Conformance Report
  - First Article Inspection

Maintenance
  - Work Order
  - Maintenance Checklist
  - Machine Breakdown Report

Human Resources
  - Time Sheet
  - Leave Request
  - Expense Report
```

### 5.2 Workflow Builder Module

**Objective**: Enable companies to design custom approval workflows without code.

**Features:**

**WB-1: Visual Workflow Designer**
- Node-based workflow diagram
- Drag and drop stages
- Configure transitions between stages
- Set conditions for transitions
- Define approvers for each stage
- Parallel and serial approval paths

**WB-2: Workflow Elements**
```
Stages
  - User Task (user fills form)
  - Review Stage (manager reviews)
  - Approval Stage (manager approves)
  - Notification Stage (user notified)

Transitions
  - When all approvers in a stage approve → move to next
  - If one rejects → return to previous or send back
  - Conditional paths (e.g., if value > $10,000, require senior approval)

Approvers
  - Single approver
  - Multiple approvers (all must approve)
  - Any of (at least one must approve)
  - Sequential (A must approve, then B)
  - Parallel voting (majority wins)
  - Delegation (approver can delegate)

Actions
  - Approve
  - Reject (with reason)
  - Request Changes
  - Comment/Question
  - Delegate to another user
```

**WB-3: Workflow Templates**
```
Simple 2-Stage Approval
  Stages: [Submit, Approve]
  Transitions: Submit → Approve
  
3-Stage Standard Approval
  Stages: [Draft, Review, Approve]
  Transitions: Draft → Review → Approve
  Review → Approve (if rejected → back to Draft)
  Approve → Review (request changes)

4-Stage Quality Approval
  Stages: [Prepare, QC Check, QC Review, Approve]
  Transitions:
    Prepare → QC Check
    QC Check → Approve (if pass)
    QC Check → QC Review (if fail or needs changes)
    QC Review → Approve
    Approve → Review (request changes)
    QC Review → Prepare (changes approved)

Multi-Level Finance Approval
  Stages: [Submit, Dept Review, Manager Review, Finance Review, Finance Approve]
  Transitions:
    Submit → Dept Review
    Dept Review → Manager Review (if approved)
    Manager Review → Finance Review
    Finance Review → Finance Approve
    Finance Approve → Manager Review (request changes)
    Any stage → Submit (request changes)
```

**WB-4: Workflow Analytics**
- Workflow performance metrics (avg approval time, bottlenecks)
- Stage-by-stage analytics
- Approver performance tracking
- Workflow optimization suggestions

### 5.3 Dynamic Jobsheet Generation

**Objective**: Generate jobsheets that adapt to different manufacturing processes.

**Features:**

**DJ-1: Configurable Part Structure**
```typescript
interface PartTemplate {
  id: string
  name: string              // e.g., "Part 1", "Operation 1"
  type: 'product' | 'component' | 'material'
  
  // Fields for each part
  fields: FieldConfig[]
  
  // Operations associated with this part
  operations: OperationConfig[]
  
  // Approval requirements for this part
  approvalStage: string
  requiredSignatures: number
}
```

**DJ-2: Flexible Operation Types**
```typescript
interface OperationType {
  id: string
  name: string              // e.g., "CAM Programming", "CNC Machining"
  category: string         // CAM, Machining, QC, Assembly, Testing
  
  // Configurable fields for this operation type
  defaultFields: FieldConfig[]
  optionalFields: FieldConfig[]
  
  // Time tracking configuration
  trackTime: boolean
  timeFields: string[]    // Which time fields to show
  
  // Output options
  outputs: string[]          // What documents/files to generate
}
```

**DJ-3: Parts Database**
- Company-specific parts library
- Material database integration
- Standard parts catalogs
- Custom part creation
- Part revision tracking

**DJ-4: CAM Integration**
- Link to CAM files
- Program reference for each part
- Version control of CAM programs
- Automatic drawing references

### 5.4 Digital Signature Integration

**Objective**: Enable electronic signature workflows.

**Features:**

**DS-1: Signature Capture**
- Canvas-based signature pad
- Touch-enabled signature input
- Stylus options (pen thickness, color)
- Multiple signature support per document

**DS-2: Signature Verification**
- Biometric verification (optional)
- Timestamp capture
- IP address logging
- Audit trail for all signatures

**DS-3: Signature Templates**
- Pre-defined signature blocks
- Auto-fill with user information
- Company stamp/logo integration
- Signature ordering

**DS-4: Mobile Signature Support**
- Mobile-optimized signature interface
- Touch signature capture
- Fingerprint integration (future)
- Offline signature queue

---

## 6. Implementation Recommendations

### 6.1 Phase 1: Core Customization (MVP)

**Timeline**: 2-3 months

**Deliverables:**

**1. Form Template System**
- Form Template CRUD API
- Pre-built template library (10+ templates)
- Form Builder UI (basic version)
- Field validation framework
- Template versioning

**2. Workflow Engine**
- Workflow template CRUD API
- Pre-built workflow templates (6+ templates)
- Workflow status tracking API
- Notification triggers

**3. Extended Jobsheet System**
- Jobsheet template configuration
- Custom part structure support
- Flexible operation types
- Dynamic form generation from templates

**4. Digital Signatures**
- Signature capture UI
- Signature storage and retrieval
- Signature verification
- Audit logging

**5. Admin UI**
- Template management interface
- Workflow designer UI
- Form builder UI
- Signature template manager
- Company settings

### 6.2 Phase 2: Advanced Customization

**Timeline**: 3-4 months

**Deliverables:**

**1. Advanced Form Builder**
- Full drag-and-drop form designer
- Conditional logic builder
- Formula support (calculated fields)
- Reusable field groups/components
- Form analytics

**2. Advanced Workflow Designer**
- Visual workflow diagram with canvas
- Complex conditional routing
- Parallel approval paths
- Delegation and escalation
- Workflow templates marketplace

**3. Integration Features**
- ERP system integration
- MES system synchronization
- Email/Slack notifications
- API for external systems
- Webhook support

**4. Advanced Analytics**
- Form submission analytics
- Workflow performance metrics
- Bottleneck identification
- Custom report builder

### 6.3 Phase 3: Enterprise Features

**Timeline**: 6-12 months

**Deliverables:**

**1. AI-Powered Features**
- Intelligent form suggestions
- Auto-route based on form data
- Smart approval recommendations
- Predictive analytics

**2. Mobile Apps**
- Native mobile form filling
- Offline mobile signature
- Push notifications
- Camera/QR code integration

**3. Advanced Integrations**
- Digital signature pads (hardware)
- Biometric authentication
- Smart card integration
- Blockchain document verification (future)

**4. Compliance & Security**
- ISO 9001 compliance templates
- 21 CFR Part 11 compliance
- GDPR compliance features
- Audit logging and reporting

---

## 7. API Specifications

### 7.1 Form Template API

```typescript
// GET /api/form-templates
// List all templates for tenant
interface QueryParams {
  category?: string
  isActive?: boolean
  isDefault?: boolean
}

// POST /api/form-templates
// Create new template
interface CreateTemplate {
  name: string
  category: string
  config: any  // Template structure as JSON
}

// PUT /api/form-templates/[id]
// Update template
interface UpdateTemplate {
  name?: string
  config?: any
  isActive?: boolean
}

// POST /api/form-templates/[id]/versions
// Create new version
interface CreateVersion {
  changeLog: string
}

// GET /api/form-templates/[id]
// Get template details with versions
```

### 7.2 Workflow API

```typescript
// GET /api/workflow-templates
// List workflow templates

// POST /api/workflow-templates
// Create workflow template
interface CreateWorkflow {
  name: string
  category: string
  stages: WorkflowStage[]
  transitions: WorkflowTransition[]
}

// POST /api/workflow-instances/[templateId]
// Create workflow instance from template for specific entity
interface CreateWorkflowInstance {
  entityType: 'jobsheet' | 'order' | 'task'
  entityId: string
  context: any  // Additional context data
}

// GET /api/workflow-instances/[id]
// Get workflow instance details
```

### 7.3 Workflow Actions API

```typescript
// POST /api/workflow-instances/[id]/advance
// Advance workflow to next stage
interface AdvanceWorkflow {
  action: 'approve' | 'reject' | 'request_changes' | 'delegate'
  comment?: string
  delegateTo?: string
  reason?: string
}

// POST /api/workflow-instances/[id]/signature
// Add signature
interface AddSignature {
  signature: string  // Base64 signature data
  signatureType: 'draw' | 'upload'
}

// GET /api/workflow-instances/[id]/history
// Get workflow history/audit trail
```

### 7.4 Dynamic Form API

```typescript
// GET /api/jobsheets/[id]/form
// Generate jobsheet form from template
interface GenerateForm {
  templateId: string
  parts: JobsheetPartConfig[]
  customFields?: Record<string, any>
}

// POST /api/jobsheets/[id]/submit
// Submit jobsheet form data
interface SubmitForm {
  formData: Record<string, any>
  attachments?: FormData
  workflowInstanceId?: string
}

// GET /api/form-definitions
// Get field definitions for form generation
interface QueryParams {
  category?: string
  operationType?: string
}
```

---

## 8. UI/UX Design

### 8.1 Form Builder UI

**Layout Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│ [Form Fields Palette]  │  [Form Canvas]        │ [Properties Panel]   │
├───────────────────────┬─────────────────────┬─────────────────────┤
│ Field Types           │ Drag fields here   │ Edit field properties  │
│ - Text Input         │                   │ - Field ID           │
│ - Number Input       │                   │ - Label              │
│ - Dropdown           │                   │ - Placeholder         │
│ - Date Picker        │                   │ - Required?           │
│ - Checkbox           │                   │ - Validation rules     │
│ - File Upload         │                   │ - Custom CSS         │
│ - Signature          │                   │ - Width/Columns      │
└───────────────────────┴─────────────────────┴─────────────────────┘
```

**Key Features:**
- Drag and drop fields to canvas
- Live preview as user builds form
- Properties panel for configuring selected field
- Save form as template
- Clone existing templates
- Import/export templates

### 8.2 Workflow Designer UI

**Layout Structure:**
```
┌──────────────────────────────────────────────────────────────────────┐
│ [Stages Palette]       │ [Workflow Canvas]          │ [Properties Panel]     │
├─────────────────────────┬─────────────────────────────┬─────────────────────────┤
│ Stage Types            │ Drag stages to canvas    │ - Stage Name          │
│ - User Task           │                           │ - Approvers Required   │
│ - Review              │                           │ - Auto-transition      │
│ - Approval           │                           │ - Conditions          │
│ - Notification        │                           │ - Email Triggers      │
└─────────────────────────┴─────────────────────────────┴─────────────────────────┘

[Transitions Palette]   │
└─────────────────────────┬─────────────────────────────────────────────────────────┤
│                    │ Draw transition lines between stages
│                    │ Configure conditions
│                    │ Set actions
└─────────────────────────┴─────────────────────────────────────────────────────────┘
```

**Key Features:**
- Visual workflow diagram
- Add/edit/delete stages and transitions
- Configure approvers per stage
- Set conditional transitions
- Save as workflow template
- Test workflow before deploying

### 8.3 Form Filling UI

**Features:**
- Smart form pre-fill based on saved data
- Real-time validation
- Progress indicator (e.g., "3/5 sections completed")
- Save draft functionality
- Version history access
- Mobile-optimized interface

### 8.4 Admin Dashboard

**Key Metrics to Display:**
- Active form templates count
- Workflow instances by status
- Pending approvals count
- Average approval time
- Most used templates
- Recent activity log

---

## 9. Configuration vs. Hardcoded

### 9.1 Before Customizability

**Current State (Based on Sample Jobsheet):**
```typescript
// Hardcoded in UI
const JobsheetForm = () => (
  <Form>
    <Field name="partNumber" label="Part No" />
    <Field name="partName" label="Part Name" />
    <Field name="quantity" label="Quantity" type="number" />
    
    {/* Fixed operation types */}
    <Field name="camPlan" label="CAM Plan" />
    <Field name="camActual" label="CAM Actual" />
    <Field name="machiningPlan" label="Machining Plan" />
    <Field name="machiningActual" label="Machining Actual" />
    
    {/* Fixed approval stages */}
    <Field name="preparedBy" label="Prepared By" />
    <Field name="checkedBy" label="Checked By" />
    <Field name="approvedBy" label="Approved By" />
  </Form>
)
```

**Limitations:**
- Only supports 3-part structure
- Fixed operation types (CAM, Machining, QC)
- Fixed 3-stage approval (Prepare → Check → Approve)
- No custom fields
- No conditional logic
- Cannot adapt to different company workflows

### 9.2 After Customizability

**Proposed State:**
```typescript
// Template-based form generation
const DynamicJobsheetForm = ({ templateId, onValidate }: Props) => {
  const { template } = useTemplate(templateId)
  
  return (
    <Form onSubmit={handleSubmit}>
      {template.config.parts.map((part, index) => (
        <div key={part.id} className="part-section">
          <h2>Part {index + 1}</h2>
          
          {/* Dynamic fields based on template */}
          {part.fields.map(field => (
            <FormField
              key={field.key}
              type={field.type}
              label={field.label}
              validation={field.validation}
              placeholder={field.placeholder}
            />
          ))}
          
          {/* Dynamic operations based on template */}
          {part.operations.map((op, opIndex) => (
            <div key={op.id} className="operation-group">
              <h3>Operation {opIndex + 1}</h3>
              
              {/* Fields specific to this operation */}
              {op.fields.map(field => (
                <FormField {...field} />
              ))}
              
              {/* Signature for this operation */}
              {op.requireSignature && (
                <SignatureField
                  ref={`signature-${part.id}-${opIndex}`}
                  onSave={handleSignatureSave}
                />
              )}
            </div>
          ))}
          
          {/* Approval section for this part */}
          {template.config.approvalStages.map((stage, stageIndex) => (
            <ApprovalStage
              key={stage.id}
              stage={stage}
              stageIndex={stageIndex}
              onApprove={handleApprove}
              onReject={handleReject}
              onComment={handleComment}
            />
          ))}
        </div>
      ))}
      
      <Button type="submit">Submit Form</Button>
    </Form>
  )
}
```

**Benefits:**
- Unlimited number of parts
- Custom operation types per part
- Custom fields anywhere
- Configurable approval stages
- Conditional logic support
- Version control and rollback
- Multi-company templates

---

## 10. Migration Strategy

### 10.1 From Current Jobsheet to New System

**Phase 1: Template Creation**
1. Create standard jobsheet template matching current structure
2. Set as default template for existing data
3. Enable gradual migration

**Phase 2: Data Migration**
1. Extract existing jobsheet data
2. Map to new flexible schema
3. Validate data integrity
4. Import with audit trail

**Phase 3: User Training**
1. Provide training on form builder
2. Document workflow changes
3. Provide templates library
4. Offer sandbox environment

### 10.2 Backward Compatibility

**Strategy:**
- Keep legacy jobsheet UI available
- Auto-convert old jobsheets to new format
- Provide side-by-side view during transition
- Archive old data with export access

---

## 11. Success Criteria

### 11.1 Customizability Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Template Flexibility | Support 10+ form categories | Template count |
| Field Customization | 15+ field types available | Field type count |
| Workflow Flexibility | 6+ workflow templates | Template count |
| Form Generation Time | < 5 minutes for simple template | Time to generate |
| User Satisfaction | NPS > 8 | Survey results |
| Adoption Rate | 80% of users within 3 months | Usage analytics |

### 11.2 Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response Time | < 500ms (95th percentile) | APM monitoring |
| Form Rendering Time | < 2 seconds (95th percentile) | Performance monitoring |
| Workflow Execution Time | < 1 second per action | APM monitoring |
| Data Consistency | 99.9% | Audit verification |
| System Uptime | 99.5% | Uptime monitoring |

---

## 12. Risks and Mitigations

### 12.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|------------|
| Complex form builder UI affects performance | Medium | Medium | Lazy loading, virtualization for large forms |
| Workflow state management complexity | High | High | State machine pattern, comprehensive testing |
| Template version conflicts | Medium | Medium | Version control with migration paths |
| Too much flexibility causes user confusion | Medium | Medium | Pre-built templates, guided setup, defaults |

### 12.2 Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|------------|
| Users reject new system due to complexity | Medium | High | Phased rollout, extensive training |
| Companies demand features outside scope | High | High | Clear roadmap, prioritize by demand |
| Data migration issues | Low | High | Thorough testing, backup plan |

---

## 13. Recommendations Summary

### 13.1 Top 5 Priorities

**Priority 1: Form Template System** (HIGHEST)
- Implement flexible form builder
- Create template library
- Enable field validation
- Version control support

**Priority 2: Workflow Engine** (HIGHEST)
- Implement workflow designer
- Create workflow templates
- Status tracking and notifications
- Integration with jobsheets

**Priority 3: Extended Jobsheet System** (HIGH)
- Configurable part structure
- Flexible operation types
- Dynamic form generation

**Priority 4: Digital Signatures** (MEDIUM)
- Canvas-based signature capture
- Signature verification
- Mobile support

**Priority 5: Admin UI** (MEDIUM)
- Template management
- Workflow designer UI
- Analytics dashboard
- Configuration interface

### 13.2 Implementation Timeline

```
Month 1-2:
  - Form template CRUD API
  - Basic field types (text, number, date, dropdown)
  - Simple template library (3 templates)
  - Workflow engine basic
  - Digital signature capture

Month 3-4:
  - Advanced form builder UI
  - Conditional field logic
  - Workflow designer UI
  - Extended field types (file, signature)
  - More workflow templates
  - Form submission tracking

Month 5-6:
  - Formula support in forms
  - Dynamic form generation
  - Parallel approvals
  - Integration features

Month 7-8:
  - Mobile apps
  - Advanced analytics
  - AI-powered features
  - Enterprise integrations
```

---

## 14. Conclusion

The sample jobsheet demonstrates a well-structured manufacturing document with comprehensive tracking. However, its fixed structure limits ManuOS's ability to serve diverse manufacturing companies.

By implementing **customizable forms**, **flexible workflows**, and **dynamic jobsheet generation**, ManuOS can:
- Support various manufacturing processes
- Adapt to company-specific requirements
- Scale without code changes
- Improve user satisfaction through flexibility
- Capture more detailed production data

The recommended phased approach balances quick wins with long-term flexibility goals, ensuring ManuOS evolves into a truly adaptable manufacturing execution platform.

---

## Appendix: Sample Form Configuration

### Example: Flexible Jobsheet Template Configuration

```json
{
  "id": "tpl-standard-jobsheet-3part",
  "name": "Standard 3-Part Jobsheet",
  "description": "Standard jobsheet with 3 parts and standard operations",
  "category": "manufacturing",
  "config": {
    "structure": {
      "maxParts": 10,
      "minParts": 1,
      "defaultParts": 3
    },
    "parts": {
      "part1": {
        "fields": [
          {
            "key": "partNumber",
            "type": "text",
            "label": "Part Number",
            "required": true
          },
          {
            "key": "partName",
            "type": "text",
            "label": "Part Name",
            "required": true
          },
          {
            "key": "quantity",
            "type": "number",
            "label": "Quantity",
            "required": true,
            "validation": {
              "min": 1,
              "max": 99999
            }
          }
        ],
        "operations": [
          {
            "type": "cam",
            "name": "CAM Programming",
            "fields": [
              {
                "key": "camProgram",
                "type": "file",
                "label": "CAM Program",
                "required": true
              },
              {
                "key": "planTime",
                "type": "number",
                "label": "Plan Time (minutes)",
                "required": true
              }
            ]
          },
          {
            "type": "machining",
            "name": "CNC Machining",
            "fields": [
              {
                "key": "programRef",
                "type": "text",
                "label": "Program Reference",
                "required": false
              },
              {
                "key": "machineId",
                "type": "dropdown",
                "label": "Machine",
                "required": true,
                "options": "machines"  // References machine database
              },
              {
                "key": "planTime",
                "type": "number",
                "label": "Plan Time (minutes)",
                "required": true
              },
              {
                "key": "actualTime",
                "type": "number",
                "label": "Actual Time (minutes)",
                "required": false,
                "readOnly": true
              }
            ]
          },
          {
            "type": "qc",
            "name": "Quality Control",
            "fields": [
              {
                "key": "qcCriteria",
                "type": "text",
                "label": "QC Criteria",
                "required": true
              },
              {
                "key": "result",
                "type": "dropdown",
                "label": "Result",
                "required": true,
                "options": ["pass", "fail", "rework"]
              },
              {
                "key": "notes",
                "type": "textarea",
                "label": "Notes",
                "required": false
              }
            ]
          }
        ],
        "approvalStages": [
          {
            "id": "stage-prepared",
            "name": "Prepared",
            "order": 1,
            "requiredSignatures": 1,
            "signatureRoles": ["technician", "supervisor"],
            "autoTransition": false
          },
          {
            "id": "stage-checked",
            "name": "Checked",
            "order": 2,
            "requiredSignatures": 1,
            "signatureRoles": ["quality_inspector", "supervisor"],
            "autoTransition": "prepared → checked"
          },
          {
            "id": "stage-approved",
            "name": "Approved",
            "order": 3,
            "requiredSignatures": 1,
            "signatureRoles": ["manager"],
            "autoTransition": "checked → approved"
          }
        ]
      }
    }
  }
}
```

---

**Document Owner**: Product Team
**Approved By**: ________
**Date**: ________
**Next Review**: March 2025
