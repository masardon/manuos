# User Management & Settings Documentation

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Frontend Pages](#frontend-pages)
5. [Setup & Initialization](#setup--initialization)
6. [Usage Examples](#usage-examples)
7. [Security Considerations](#security-considerations)

---

## Overview

The User Management & Settings module provides comprehensive user account management, role-based access control, user preferences, and system-wide configuration settings for the Manufacturing Orchestrator Platform.

### Key Features

- **User Management**: Complete CRUD operations for user accounts
- **Role-Based Access Control (RBAC)**: Flexible role and permission system
- **User Settings**: Personalized preferences for each user
- **System Settings**: Global configuration management
- **Multi-Tenancy Support**: Tenant-aware user and settings management

---

## Database Schema

### User Model

```prisma
model User {
  id           String   @id @default(cuid())
  tenantId     String
  email        String
  name         String?
  phone        String?
  roleId       String
  passwordHash String
  isActive     Boolean  @default(true)
  avatarUrl    String?
  employeeId   String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([tenantId, email])
  @@index([tenantId])
  @@index([email])
  @@index([roleId])
}
```

### Role Model

```prisma
model Role {
  id          String   @id @default(cuid())
  name        String   // e.g., Super Admin, Admin, PPIC
  code        String   @unique // e.g., ROLE_SUPER_ADMIN
  description String?
  isSystem    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([code])
}
```

### UserSettings Model

```prisma
model UserSettings {
  id                   String  @id @default(cuid())
  userId               String  @unique

  // UI Preferences
  theme                String  @default("light")
  language             String  @default("en")
  timezone             String  @default("UTC")

  // Notification Settings
  emailNotifications   Boolean @default(true)
  taskReminders        Boolean @default(true)
  breakdownAlerts      Boolean @default(true)
  inventoryAlerts      Boolean @default(true)

  // Dashboard Preferences
  defaultView          String  @default("dashboard")
  showInactiveMachines Boolean @default(false)
  showCompletedTasks   Boolean @default(false)

  // Table Settings
  rowsPerPage          Int     @default(25)

  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  @@index([userId])
}
```

### SystemSettings Model

```prisma
model SystemSettings {
  id          String   @id @default(cuid())
  key         String   @unique
  category    String   // General, Security, Notifications, etc.
  value       String
  description String?
  type        String   @default("string") // string, number, boolean, json
  isPublic    Boolean  @default(false)
  updatedAt   DateTime @updatedAt

  @@index([category])
  @@index([key])
}
```

---

## API Endpoints

### User Management

#### GET /api/users

Get all users with optional filtering and pagination.

**Query Parameters:**
- `tenantId` (string) - Filter by tenant ID
- `roleId` (string) - Filter by role ID
- `isActive` (boolean) - Filter by active status
- `search` (string) - Search in name, email, employeeId
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 25)

**Response:**
```json
{
  "users": [
    {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "phone": "+1234567890",
      "roleId": "role_456",
      "role": {
        "id": "role_456",
        "name": "Admin",
        "code": "ROLE_ADMIN"
      },
      "tenantId": "tenant_789",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 100,
    "totalPages": 4
  }
}
```

#### POST /api/users

Create a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "phone": "+1234567890",
  "roleId": "role_456",
  "password": "securePassword123",
  "tenantId": "tenant_789",
  "employeeId": "EMP001",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

**Response:**
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "roleId": "role_456",
    "role": { ... },
    "isActive": true
  }
}
```

#### GET /api/users/[id]

Get a specific user by ID.

**Response:**
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": { ... },
    "settings": { ... }
  }
}
```

#### PUT /api/users/[id]

Update a user.

**Request Body:**
```json
{
  "email": "newemail@example.com",
  "name": "Jane Doe",
  "roleId": "role_new",
  "password": "newPassword123",
  "isActive": false
}
```

#### DELETE /api/users/[id]

Delete a user by ID.

**Response:**
```json
{
  "success": true
}
```

### Role Management

#### GET /api/roles

Get all roles.

**Query Parameters:**
- `search` (string) - Search in name, code, description

**Response:**
```json
{
  "roles": [
    {
      "id": "role_456",
      "name": "Admin",
      "code": "ROLE_ADMIN",
      "description": "Administrative access",
      "isSystem": true
    }
  ]
}
```

#### POST /api/roles

Create a new role.

**Request Body:**
```json
{
  "name": "Custom Role",
  "code": "ROLE_CUSTOM",
  "description": "Custom role description",
  "isSystem": false
}
```

#### PUT /api/roles/[id]

Update a role. System roles cannot be modified.

#### DELETE /api/roles/[id]

Delete a role. System roles and roles with assigned users cannot be deleted.

### User Settings

#### GET /api/usersettings?userId=xxx

Get user settings.

**Response:**
```json
{
  "settings": {
    "id": "settings_123",
    "userId": "user_456",
    "theme": "dark",
    "language": "en",
    "timezone": "America/New_York",
    "emailNotifications": true,
    "taskReminders": true,
    "breakdownAlerts": false,
    "inventoryAlerts": true,
    "defaultView": "dashboard",
    "showInactiveMachines": false,
    "showCompletedTasks": true,
    "rowsPerPage": 50
  }
}
```

#### PUT /api/usersettings

Update user settings.

**Request Body:**
```json
{
  "userId": "user_456",
  "theme": "dark",
  "language": "en",
  "timezone": "America/New_York",
  "emailNotifications": false,
  "rowsPerPage": 50
}
```

### System Settings

#### GET /api/settings

Get all system settings.

**Query Parameters:**
- `category` (string) - Filter by category
- `isPublic` (boolean) - Filter by public flag
- `search` (string) - Search in key, description

**Response:**
```json
{
  "settings": [
    {
      "id": "setting_123",
      "key": "company_name",
      "category": "General",
      "value": "Manufacturing Orchestrator",
      "description": "Company name displayed in the application",
      "type": "string",
      "isPublic": true,
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/settings

Create a new system setting.

**Request Body:**
```json
{
  "key": "custom_setting",
  "category": "Custom",
  "value": "some value",
  "description": "Custom setting description",
  "type": "string",
  "isPublic": false
}
```

#### GET /api/settings/[id]

Get a specific system setting. Value is automatically parsed based on type.

**Response:**
```json
{
  "setting": {
    "id": "setting_123",
    "key": "maintenance_reminder_days",
    "value": 7,
    "type": "number",
    ...
  }
}
```

#### PUT /api/settings/[id]

Update a system setting.

**Request Body:**
```json
{
  "value": "new value",
  "description": "Updated description",
  "isPublic": true
}
```

#### DELETE /api/settings/[id]

Delete a system setting.

### Initialization

#### GET /api/init

Check if default data is initialized.

**Response:**
```json
{
  "isInitialized": true,
  "rolesCount": 7,
  "settingsCount": 11,
  "tenantsCount": 1
}
```

#### POST /api/init

Initialize default roles and system settings.

**Default Roles Created:**
- ROLE_SUPER_ADMIN - Full system access
- ROLE_ADMIN - Administrative access
- ROLE_PPIC - Production Planning and Inventory Control
- ROLE_MANAGER - Department manager
- ROLE_TECHNICIAN - Production technician
- ROLE_WAREHOUSE - Warehouse staff
- ROLE_CUSTOMER - View-only access

**Default Settings Created:**
- company_name (General)
- default_language (General)
- default_timezone (General)
- maintenance_reminder_days (Operations)
- enable_notifications (Notifications)
- SMTP settings (Notifications)
- Session and security settings (Security)

**Response:**
```json
{
  "success": true,
  "message": "Default roles and settings initialized successfully"
}
```

---

## Frontend Pages

### User Management Page (`/users`)

**Features:**
- List all users with pagination
- Search by name, email, or employee ID
- Filter by role and status
- Create new users
- Edit existing users
- Delete users with confirmation
- View user details including avatar, name, email, role, and status

**Components Used:**
- Card, Table, Dialog, AlertDialog
- Input, Select, Button, Switch
- Badge, Avatar, Separator

### User Profile & Settings Page (`/profile`)

**Features:**
- Tabbed interface for organized settings
- General tab: Theme, language, timezone
- Notifications tab: Email, task, breakdown, inventory alerts
- Preferences tab: Default view, display options, rows per page

**Settings Categories:**
- Appearance (theme, language, timezone)
- Notifications (email, reminders, alerts)
- Preferences (dashboard, display, table settings)

### System Settings Page (`/settings`)

**Features:**
- Categorized settings tabs (General, Security, Notifications, Operations, Custom)
- Search and filter by category
- Create new settings
- Edit existing settings inline
- Delete settings with confirmation
- Type-appropriate input fields (string, number, boolean)
- Visual indicators for public settings

**Components Used:**
- Tabs, Card, Dialog, Input, Select, Switch
- Badge, Textarea, Button, Search, Refresh

---

## Setup & Initialization

### 1. Database Setup

The schema is already updated. Run the following command to sync with the database:

```bash
bun run db:push
```

### 2. Initialize Default Data

After database setup, initialize default roles and system settings:

```bash
curl -X POST http://localhost:3000/api/init
```

Or use the API directly:

```typescript
fetch('/api/init', { method: 'POST' })
  .then(res => res.json())
  .then(data => console.log(data))
```

### 3. Create First Admin User

After initialization, create your first admin user:

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "name": "System Admin",
    "roleId": "ROLE_ADMIN",
    "password": "securePassword123",
    "tenantId": "default"
  }'
```

### 4. Access the Frontend

- User Management: `/users`
- Profile & Settings: `/profile`
- System Settings: `/settings`

---

## Usage Examples

### Example 1: Creating a New Technician

```typescript
const response = await fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'tech1@company.com',
    name: 'John Smith',
    roleId: 'ROLE_TECHNICIAN',
    password: 'Password123!',
    tenantId: 'default',
    employeeId: 'TECH001',
  }),
})

const { user } = await response.json()
console.log('Created user:', user)
```

### Example 2: Updating User Preferences

```typescript
const response = await fetch('/api/usersettings', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user_123',
    theme: 'dark',
    language: 'en',
    timezone: 'America/New_York',
    emailNotifications: true,
    rowsPerPage: 50,
  }),
})

const { settings } = await response.json()
console.log('Updated settings:', settings)
```

### Example 3: Updating System Setting

```typescript
const response = await fetch('/api/settings/setting_123', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    value: '10', // Maintenance reminder days
  }),
})

const { setting } = await response.json()
console.log('Updated setting:', setting)
```

### Example 4: Searching Users

```typescript
const searchTerm = 'John'
const response = await fetch(
  `/api/users?search=${searchTerm}&roleId=ROLE_TECHNICIAN&isActive=true`
)

const { users, pagination } = await response.json()
console.log('Found users:', users)
```

### Example 5: Creating Custom Role

```typescript
const response = await fetch('/api/roles', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Quality Control',
    code: 'ROLE_QC',
    description: 'Quality control specialists',
  }),
})

const { role } = await response.json()
console.log('Created role:', role)
```

---

## Security Considerations

### Password Management

⚠️ **Important**: The current implementation uses Base64 encoding for passwords (for demonstration purposes). In production, you should use a proper password hashing library like bcrypt.

**Recommended Implementation:**

```typescript
import bcrypt from 'bcrypt'

// Hash password
const saltRounds = 10
const passwordHash = await bcrypt.hash(password, saltRounds)

// Verify password
const isValid = await bcrypt.compare(plainPassword, passwordHash)
```

### Access Control

1. **Role-Based Access Control (RBAC)**: Each user has a role that determines their access level
2. **System Roles**: Cannot be deleted or modified
3. **Tenant Isolation**: Users are scoped to their tenant
4. **Public Settings**: Mark system settings as `isPublic: false` for sensitive data

### API Security Recommendations

1. Implement authentication middleware for all API endpoints
2. Add rate limiting to prevent abuse
3. Validate all input data using Zod schemas (already implemented)
4. Use HTTPS in production
5. Implement CORS policies
6. Add audit logging for sensitive operations

### Data Privacy

1. Password hashes should never be returned in API responses
2. User settings should be accessible only to the user or admins
3. System settings marked as private should be protected
4. Consider implementing GDPR compliance features for user data

---

## Default Roles

| Role Code | Role Name | Description |
|-----------|-----------|-------------|
| ROLE_SUPER_ADMIN | Super Admin | Full system access with all permissions |
| ROLE_ADMIN | Admin | Administrative access with most permissions |
| ROLE_PPIC | PPIC | Production Planning and Inventory Control |
| ROLE_MANAGER | Manager | Department manager with oversight permissions |
| ROLE_TECHNICIAN | Technician | Production technician with task execution permissions |
| ROLE_WAREHOUSE | Warehouse | Warehouse staff with inventory management permissions |
| ROLE_CUSTOMER | Customer | Customer with view-only access |

---

## Default System Settings

### General
- `company_name`: Manufacturing Orchestrator
- `default_language`: en
- `default_timezone`: UTC

### Operations
- `maintenance_reminder_days`: 7 (days before maintenance to send reminders)

### Notifications
- `enable_notifications`: true
- `email_smtp_host`: (empty - to be configured)
- `email_smtp_port`: 587
- `email_smtp_secure`: true

### Security
- `session_timeout_minutes`: 60
- `max_login_attempts`: 5
- `password_min_length`: 8
- `allow_user_registration`: false

---

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── users/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── roles/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── usersettings/
│   │   │   └── route.ts
│   │   ├── settings/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   └── init/
│   │       └── route.ts
│   ├── users/
│   │   └── page.tsx
│   ├── profile/
│   │   └── page.tsx
│   └── settings/
│       └── page.tsx
├── stores/
│   └── authStore.ts
└── ...

prisma/
└── schema.prisma (contains User, Role, UserSettings, SystemSettings models)
```

---

## Troubleshooting

### Issue: Users not showing in list

**Solution:** Ensure default data is initialized:
```bash
curl -X POST http://localhost:3000/api/init
```

### Issue: Cannot create user

**Solution:** Check that the role exists and the tenant ID is valid:
```bash
curl http://localhost:3000/api/roles
```

### Issue: Settings not persisting

**Solution:** Verify the database connection and check for console errors in the browser.

### Issue: System role cannot be modified

**Explanation:** This is by design. System roles have `isSystem: true` and cannot be modified or deleted to maintain system integrity.

---

## Future Enhancements

1. **Authentication**: Integrate NextAuth.js for proper authentication
2. **Permissions**: Implement fine-grained permissions beyond roles
3. **Audit Logs**: Add comprehensive audit logging
4. **User Groups**: Create user groups for easier management
5. **Password Reset**: Implement password reset functionality
6. **Two-Factor Authentication**: Add 2FA support
7. **Bulk Operations**: Support bulk user import/export
8. **Advanced Search**: Implement more sophisticated search and filtering
9. **Settings Validation**: Add validation rules for system settings
10. **Multi-language Support**: Implement proper i18n

---

## Support & Contributing

For issues or feature requests related to user management and settings, please refer to the project's issue tracker.

When contributing:
1. Follow existing code style
2. Add tests for new features
3. Update documentation
4. Ensure backward compatibility

---

**Last Updated:** January 2025
