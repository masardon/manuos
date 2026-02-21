import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST() {
  try {
    // Check if already initialized
    const rolesCount = await db.role.count()
    if (rolesCount > 0) {
      return NextResponse.json({
        success: true,
        message: 'Already initialized',
        rolesCount,
      })
    }

    // Create default roles
    const roles = [
      {
        id: 'role_super_admin',
        name: 'Super Admin',
        code: 'ROLE_SUPER_ADMIN',
        description: 'Full system access with all permissions',
        isSystem: true,
      },
      {
        id: 'role_admin',
        name: 'Admin',
        code: 'ROLE_ADMIN',
        description: 'Administrative access with most permissions',
        isSystem: true,
      },
      {
        id: 'role_ppic',
        name: 'PPIC',
        code: 'ROLE_PPIC',
        description: 'Production Planning and Inventory Control',
        isSystem: true,
      },
      {
        id: 'role_manager',
        name: 'Manager',
        code: 'ROLE_MANAGER',
        description: 'Department manager with oversight permissions',
        isSystem: true,
      },
      {
        id: 'role_technician',
        name: 'Technician',
        code: 'ROLE_TECHNICIAN',
        description: 'Production technician with task execution permissions',
        isSystem: true,
      },
      {
        id: 'role_warehouse',
        name: 'Warehouse',
        code: 'ROLE_WAREHOUSE',
        description: 'Warehouse staff with inventory management permissions',
        isSystem: true,
      },
      {
        id: 'role_customer',
        name: 'Customer',
        code: 'ROLE_CUSTOMER',
        description: 'Customer with view-only access',
        isSystem: true,
      },
    ]

    await db.role.createMany({
      data: roles,
    })

    // Create default tenant
    await db.tenant.upsert({
      where: { slug: 'default' },
      update: {},
      create: {
        id: 'tenant_default',
        name: 'Default Organization',
        slug: 'default',
        isActive: true,
      },
    })

    // Create default admin user
    const adminPassword = 'admin123'
    await db.user.upsert({
      where: { 
        tenantId_email: {
          tenantId: 'tenant_default',
          email: 'admin@example.com',
        },
      },
      update: {},
      create: {
        id: 'user_admin',
        tenantId: 'tenant_default',
        email: 'admin@example.com',
        name: 'System Admin',
        roleId: 'role_admin',
        passwordHash: adminPassword, // In production, hash with bcrypt
        isActive: true,
        employeeId: 'ADMIN001',
      },
    })

    // Create default system settings
    const settings = [
      {
        key: 'company_name',
        category: 'General',
        value: 'ManuOS Manufacturing',
        description: 'Company name displayed in the application',
        type: 'string',
        isPublic: true,
      },
      {
        key: 'default_language',
        category: 'General',
        value: 'en',
        description: 'Default language for the application',
        type: 'string',
        isPublic: true,
      },
      {
        key: 'default_timezone',
        category: 'General',
        value: 'UTC',
        description: 'Default timezone for the application',
        type: 'string',
        isPublic: true,
      },
      {
        key: 'maintenance_reminder_days',
        category: 'Operations',
        value: '7',
        description: 'Days before maintenance to send reminders',
        type: 'number',
        isPublic: false,
      },
      {
        key: 'enable_notifications',
        category: 'Notifications',
        value: 'true',
        description: 'Enable system notifications',
        type: 'boolean',
        isPublic: false,
      },
    ]

    await db.systemSettings.createMany({
      data: settings,
    })

    const newRolesCount = await db.role.count()

    return NextResponse.json({
      success: true,
      message: 'Default data initialized successfully',
      rolesCount: newRolesCount,
      details: {
        roles: roles.map((r) => r.name),
        tenant: 'default',
        adminUser: 'admin@example.com',
        adminPassword: 'admin123 (change this immediately!)',
      },
    })
  } catch (error: any) {
    console.error('Initialization error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to initialize data',
        error: error.message,
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const [rolesCount, tenantsCount, usersCount] = await Promise.all([
      db.role.count(),
      db.tenant.count(),
      db.user.count(),
    ])

    return NextResponse.json({
      isInitialized: rolesCount > 0 && tenantsCount > 0 && usersCount > 0,
      rolesCount,
      tenantsCount,
      usersCount,
    })
  } catch (error) {
    return NextResponse.json({
      isInitialized: false,
      error: 'Database not ready',
    })
  }
}
