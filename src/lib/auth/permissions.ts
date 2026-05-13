// Permission definitions for ManuOS
// 7 Role Types: Super Admin, Admin, PPIC, Manager, Technician, Warehouse, Customer

export interface PermissionDefinition {
  code: string
  name: string
  description: string
  category: string
}

// All permissions organized by category
export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  // ============================================
  // ORDER MANAGEMENT PERMISSIONS
  // ============================================
  { code: 'order:read', name: 'View Orders', description: 'View order list and details', category: 'ORDER' },
  { code: 'order:create', name: 'Create Orders', description: 'Create new customer orders', category: 'ORDER' },
  { code: 'order:update', name: 'Update Orders', description: 'Edit order details', category: 'ORDER' },
  { code: 'order:delete', name: 'Delete Orders', description: 'Delete orders', category: 'ORDER' },
  { code: 'order:approve', name: 'Approve Orders', description: 'Approve order status changes', category: 'ORDER' },
  { code: 'order:cancel', name: 'Cancel Orders', description: 'Cancel orders', category: 'ORDER' },

  // ============================================
  // MANUFACTURING ORDER PERMISSIONS
  // ============================================
  { code: 'mo:read', name: 'View Manufacturing Orders', description: 'View MO list and details', category: 'MANUFACTURING' },
  { code: 'mo:create', name: 'Create Manufacturing Orders', description: 'Create new MOs', category: 'MANUFACTURING' },
  { code: 'mo:update', name: 'Update Manufacturing Orders', description: 'Edit MO details', category: 'MANUFACTURING' },
  { code: 'mo:delete', name: 'Delete Manufacturing Orders', description: 'Delete MOs', category: 'MANUFACTURING' },
  { code: 'mo:approve', name: 'Approve Manufacturing Orders', description: 'Approve MO status changes', category: 'MANUFACTURING' },

  // ============================================
  // JOBSHEET PERMISSIONS
  // ============================================
  { code: 'jobsheet:read', name: 'View Jobsheets', description: 'View jobsheet list and details', category: 'PRODUCTION' },
  { code: 'jobsheet:create', name: 'Create Jobsheets', description: 'Create new jobsheets', category: 'PRODUCTION' },
  { code: 'jobsheet:update', name: 'Update Jobsheets', description: 'Edit jobsheet details', category: 'PRODUCTION' },
  { code: 'jobsheet:delete', name: 'Delete Jobsheets', description: 'Delete jobsheets', category: 'PRODUCTION' },
  { code: 'jobsheet:prepare', name: 'Prepare Jobsheets', description: 'Prepare jobsheet for review', category: 'PRODUCTION' },
  { code: 'jobsheet:check', name: 'Check Jobsheets', description: 'Review and check jobsheets', category: 'PRODUCTION' },
  { code: 'jobsheet:approve', name: 'Approve Jobsheets', description: 'Approve jobsheets', category: 'PRODUCTION' },

  // ============================================
  // TASK PERMISSIONS
  // ============================================
  { code: 'task:read', name: 'View Tasks', description: 'View task list and details', category: 'PRODUCTION' },
  { code: 'task:create', name: 'Create Tasks', description: 'Create new tasks', category: 'PRODUCTION' },
  { code: 'task:update', name: 'Update Tasks', description: 'Edit task details', category: 'PRODUCTION' },
  { code: 'task:delete', name: 'Delete Tasks', description: 'Delete tasks', category: 'PRODUCTION' },
  { code: 'task:assign', name: 'Assign Tasks', description: 'Assign tasks to technicians/machines', category: 'PRODUCTION' },
  { code: 'task:clock', name: 'Clock In/Out Tasks', description: 'Clock in/out for tasks', category: 'PRODUCTION' },
  { code: 'task:report-breakdown', name: 'Report Breakdown', description: 'Report machine breakdown on task', category: 'PRODUCTION' },

  // ============================================
  // MACHINE PERMISSIONS
  // ============================================
  { code: 'machine:read', name: 'View Machines', description: 'View machine list and details', category: 'MACHINE' },
  { code: 'machine:create', name: 'Create Machines', description: 'Register new machines', category: 'MACHINE' },
  { code: 'machine:update', name: 'Update Machines', description: 'Edit machine details', category: 'MACHINE' },
  { code: 'machine:delete', name: 'Delete Machines', description: 'Remove machines', category: 'MACHINE' },
  { code: 'machine:maintenance', name: 'Manage Maintenance', description: 'Schedule and manage maintenance', category: 'MACHINE' },
  { code: 'machine:breakdown:manage', name: 'Manage Breakdowns', description: 'Resolve machine breakdowns', category: 'MACHINE' },

  // ============================================
  // INVENTORY PERMISSIONS
  // ============================================
  { code: 'inventory:read', name: 'View Inventory', description: 'View inventory list and details', category: 'INVENTORY' },
  { code: 'inventory:create', name: 'Create Inventory', description: 'Add new inventory items', category: 'INVENTORY' },
  { code: 'inventory:update', name: 'Update Inventory', description: 'Edit inventory details', category: 'INVENTORY' },
  { code: 'inventory:delete', name: 'Delete Inventory', description: 'Remove inventory items', category: 'INVENTORY' },
  { code: 'inventory:adjust', name: 'Adjust Stock', description: 'Adjust inventory quantities', category: 'INVENTORY' },
  { code: 'inventory:reserve', name: 'Reserve Materials', description: 'Create material reservations', category: 'INVENTORY' },
  { code: 'inventory:release', name: 'Release Reservations', description: 'Release material reservations', category: 'INVENTORY' },
  { code: 'inventory:transfer', name: 'Transfer Materials', description: 'Transfer materials between locations', category: 'INVENTORY' },

  // ============================================
  // PURCHASE ORDER PERMISSIONS
  // ============================================
  { code: 'po:read', name: 'View Purchase Orders', description: 'View PO list and details', category: 'PURCHASING' },
  { code: 'po:create', name: 'Create Purchase Orders', description: 'Create new purchase orders', category: 'PURCHASING' },
  { code: 'po:update', name: 'Update Purchase Orders', description: 'Edit purchase orders', category: 'PURCHASING' },
  { code: 'po:delete', name: 'Delete Purchase Orders', description: 'Delete purchase orders', category: 'PURCHASING' },
  { code: 'po:approve', name: 'Approve Purchase Orders', description: 'Approve purchase orders', category: 'PURCHASING' },
  { code: 'po:receive', name: 'Receive Goods', description: 'Confirm goods receipt', category: 'PURCHASING' },

  // ============================================
  // SUPPLIER PERMISSIONS
  // ============================================
  { code: 'supplier:read', name: 'View Suppliers', description: 'View supplier list and details', category: 'PURCHASING' },
  { code: 'supplier:create', name: 'Create Suppliers', description: 'Add new suppliers', category: 'PURCHASING' },
  { code: 'supplier:update', name: 'Update Suppliers', description: 'Edit supplier details', category: 'PURCHASING' },
  { code: 'supplier:delete', name: 'Delete Suppliers', description: 'Remove suppliers', category: 'PURCHASING' },

  // ============================================
  // RECIPE/BOM PERMISSIONS
  // ============================================
  { code: 'recipe:read', name: 'View Recipes', description: 'View recipe/BOM list and details', category: 'PRODUCTION' },
  { code: 'recipe:create', name: 'Create Recipes', description: 'Create new recipes/BOMs', category: 'PRODUCTION' },
  { code: 'recipe:update', name: 'Update Recipes', description: 'Edit recipes/BOMs', category: 'PRODUCTION' },
  { code: 'recipe:delete', name: 'Delete Recipes', description: 'Delete recipes/BOMs', category: 'PRODUCTION' },
  { code: 'recipe:approve', name: 'Approve Recipes', description: 'Approve recipes for production', category: 'PRODUCTION' },

  // ============================================
  // REPORT PERMISSIONS
  // ============================================
  { code: 'report:read', name: 'View Reports', description: 'View production and other reports', category: 'REPORTS' },
  { code: 'report:export', name: 'Export Reports', description: 'Export reports to file', category: 'REPORTS' },
  { code: 'report:production', name: 'Production Reports', description: 'Access production reports', category: 'REPORTS' },
  { code: 'report:efficiency', name: 'Efficiency Reports', description: 'Access efficiency analysis', category: 'REPORTS' },
  { code: 'report:inventory', name: 'Inventory Reports', description: 'Access inventory reports', category: 'REPORTS' },

  // ============================================
  // USER MANAGEMENT PERMISSIONS
  // ============================================
  { code: 'user:read', name: 'View Users', description: 'View user list and details', category: 'ADMIN' },
  { code: 'user:create', name: 'Create Users', description: 'Create new users', category: 'ADMIN' },
  { code: 'user:update', name: 'Update Users', description: 'Edit user details', category: 'ADMIN' },
  { code: 'user:delete', name: 'Delete Users', description: 'Remove users', category: 'ADMIN' },

  // ============================================
  // ROLE & PERMISSION MANAGEMENT
  // ============================================
  { code: 'role:read', name: 'View Roles', description: 'View roles and permissions', category: 'ADMIN' },
  { code: 'role:create', name: 'Create Roles', description: 'Create new roles', category: 'ADMIN' },
  { code: 'role:update', name: 'Update Roles', description: 'Edit roles and permissions', category: 'ADMIN' },
  { code: 'role:delete', name: 'Delete Roles', description: 'Remove roles', category: 'ADMIN' },

  // ============================================
  // WORKFLOW PERMISSIONS
  // ============================================
  { code: 'workflow:read', name: 'View Workflows', description: 'View workflow configurations', category: 'ADMIN' },
  { code: 'workflow:create', name: 'Create Workflows', description: 'Create new workflows', category: 'ADMIN' },
  { code: 'workflow:update', name: 'Update Workflows', description: 'Edit workflow configurations', category: 'ADMIN' },
  { code: 'workflow:delete', name: 'Delete Workflows', description: 'Remove workflows', category: 'ADMIN' },

  // ============================================
  // SYSTEM SETTINGS PERMISSIONS
  // ============================================
  { code: 'settings:read', name: 'View Settings', description: 'View system settings', category: 'ADMIN' },
  { code: 'settings:update', name: 'Update Settings', description: 'Update system settings', category: 'ADMIN' },
]

// 7 Role Types with their default permissions
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  // Super Admin - All permissions
  'ROLE_SUPER_ADMIN': PERMISSION_DEFINITIONS.map(p => p.code),

  // Admin - Most permissions except some critical ones
  'ROLE_ADMIN': [
    ...PERMISSION_DEFINITIONS.filter(p => 
      !p.code.includes('workflow:') && 
      !p.code.includes('role:')
    ).map(p => p.code),
    'workflow:read',
    'role:read'
  ],

  // PPIC (Production Planning & Inventory Control)
  'ROLE_PPIC': [
    'order:read', 'order:create', 'order:update',
    'mo:read', 'mo:create', 'mo:update', 'mo:approve',
    'jobsheet:read', 'jobsheet:create', 'jobsheet:update', 'jobsheet:prepare',
    'task:read', 'task:create', 'task:update', 'task:assign',
    'machine:read',
    'inventory:read', 'inventory:create', 'inventory:update', 'inventory:adjust', 'inventory:reserve', 'inventory:release',
    'recipe:read', 'recipe:create', 'recipe:update',
    'report:read', 'report:production', 'report:efficiency', 'report:inventory',
    'supplier:read'
  ],

  // Manager
  'ROLE_MANAGER': [
    'order:read', 'order:approve', 'order:cancel',
    'mo:read', 'mo:approve',
    'jobsheet:read', 'jobsheet:check', 'jobsheet:approve',
    'task:read', 'task:assign',
    'machine:read', 'machine:maintenance', 'machine:breakdown:manage',
    'inventory:read',
    'report:read', 'report:export', 'report:production', 'report:efficiency', 'report:inventory',
    'po:read', 'po:approve',
    'supplier:read',
    'user:read',
    'recipe:read', 'recipe:approve'
  ],

  // Technician
  'ROLE_TECHNICIAN': [
    'order:read',
    'mo:read',
    'jobsheet:read',
    'task:read', 'task:clock', 'task:report-breakdown',
    'machine:read',
    'inventory:read',
    'report:read'
  ],

  // Warehouse
  'ROLE_WAREHOUSE': [
    'inventory:read', 'inventory:create', 'inventory:update', 'inventory:adjust', 'inventory:transfer',
    'po:read', 'po:receive',
    'supplier:read',
    'report:read', 'report:inventory',
    'order:read',
    'mo:read'
  ],

  // Customer
  'ROLE_CUSTOMER': [
    'order:read'
  ]
}

// Role descriptions
export const ROLE_DESCRIPTIONS: Record<string, { name: string; description: string }> = {
  'ROLE_SUPER_ADMIN': {
    name: 'Super Administrator',
    description: 'Full system access across all tenants'
  },
  'ROLE_ADMIN': {
    name: 'Administrator',
    description: 'Full access within tenant'
  },
  'ROLE_PPIC': {
    name: 'PPIC Staff',
    description: 'Production Planning & Inventory Control'
  },
  'ROLE_MANAGER': {
    name: 'Production Manager',
    description: 'Approvals and oversight'
  },
  'ROLE_TECHNICIAN': {
    name: 'Technician',
    description: 'Execute tasks on shop floor'
  },
  'ROLE_WAREHOUSE': {
    name: 'Warehouse Staff',
    description: 'Manage inventory and receiving'
  },
  'ROLE_CUSTOMER': {
    name: 'Customer',
    description: 'View own orders only'
  }
}
