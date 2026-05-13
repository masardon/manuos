// Enhanced Authentication Middleware for ManuOS
// Supports JWT tokens and cookie-based auth for backward compatibility

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractTokenFromHeader, type TokenPayload } from './jwt'

export interface AuthUser {
  id: string
  email: string
  name?: string
  roleId: string
  roleCode: string
  tenantId: string
}

export interface AuthResult {
  success: boolean
  user?: AuthUser
  error?: string
  statusCode?: number
}

/**
 * Extract user from request (JWT or Cookie)
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  // Try JWT first
  const authHeader = request.headers.get('authorization')
  const token = extractTokenFromHeader(authHeader)
  
  if (token) {
    const payload = await verifyToken(token, 'access')
    if (payload) {
      return {
        success: true,
        user: {
          id: payload.userId,
          email: payload.email,
          tenantId: payload.tenantId,
          roleId: payload.roleId,
          roleCode: payload.roleCode
        }
      }
    }
    return {
      success: false,
      error: 'Invalid or expired token',
      statusCode: 401
    }
  }
  
  // Fallback to cookie-based auth for backward compatibility
  const cookieUser = getUserFromCookie(request)
  if (cookieUser) {
    return {
      success: true,
      user: cookieUser
    }
  }
  
  return {
    success: false,
    error: 'Authentication required',
    statusCode: 401
  }
}

/**
 * Get user from cookie (backward compatibility)
 */
function getUserFromCookie(request: NextRequest): AuthUser | null {
  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) return null
  
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, ...value] = cookie.trim().split('=')
    acc[key] = value.join('=')
    return acc
  }, {} as Record<string, string>)
  
  const userCookie = cookies['manuos-user']
  if (!userCookie) return null
  
  try {
    const user = JSON.parse(decodeURIComponent(userCookie))
    return user as AuthUser
  } catch (e) {
    return null
  }
}

/**
 * Require authentication - returns user or throws
 */
export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const result = await authenticateRequest(request)
  
  if (!result.success || !result.user) {
    throw new AuthError(result.error || 'Authentication required', result.statusCode || 401)
  }
  
  return result.user
}

/**
 * Check if user has required role
 */
export function hasRole(user: AuthUser, requiredRoles: string[]): boolean {
  return requiredRoles.includes(user.roleCode)
}

/**
 * Require specific roles
 */
export async function requireRole(request: NextRequest, requiredRoles: string[]): Promise<AuthUser> {
  const user = await requireAuth(request)
  
  if (!hasRole(user, requiredRoles)) {
    throw new AuthError('Insufficient permissions', 403)
  }
  
  return user
}

/**
 * Get tenant ID from request
 */
export async function getTenantId(request: NextRequest): Promise<string | null> {
  try {
    const user = await requireAuth(request)
    return user.tenantId
  } catch {
    return null
  }
}

/**
 * Get user ID from request
 */
export async function getUserId(request: NextRequest): Promise<string | null> {
  try {
    const user = await requireAuth(request)
    return user.id
  } catch {
    return null
  }
}

/**
 * Create auth error response
 */
export function createAuthErrorResponse(error: string, statusCode: number = 401): NextResponse {
  return NextResponse.json(
    { error, success: false },
    { status: statusCode }
  )
}

/**
 * Create success response with auth headers
 */
export function createAuthSuccessResponse(data: any, tokens?: { accessToken: string; refreshToken: string }): NextResponse {
  const response = NextResponse.json({ success: true, ...data })
  
  if (tokens) {
    response.headers.set('X-Access-Token', tokens.accessToken)
    response.headers.set('X-Refresh-Token', tokens.refreshToken)
  }
  
  return response
}

/**
 * Custom Auth Error class
 */
export class AuthError extends Error {
  statusCode: number
  
  constructor(message: string, statusCode: number = 401) {
    super(message)
    this.name = 'AuthError'
    this.statusCode = statusCode
  }
}

/**
 * Role constants for the 7 role types
 */
export const ROLES = {
  SUPER_ADMIN: 'ROLE_SUPER_ADMIN',
  ADMIN: 'ROLE_ADMIN',
  PPIC: 'ROLE_PPIC',
  MANAGER: 'ROLE_MANAGER',
  TECHNICIAN: 'ROLE_TECHNICIAN',
  WAREHOUSE: 'ROLE_WAREHOUSE',
  CUSTOMER: 'ROLE_CUSTOMER'
} as const

/**
 * Helper to check permission by category
 */
export const PERMISSIONS = {
  // Inventory
  INVENTORY_READ: 'inventory:read',
  INVENTORY_WRITE: 'inventory:write',
  INVENTORY_DELETE: 'inventory:delete',
  INVENTORY_RESERVE: 'inventory:reserve',
  
  // Production
  PRODUCTION_READ: 'production:read',
  PRODUCTION_WRITE: 'production:write',
  PRODUCTION_APPROVE: 'production:approve',
  
  // Orders
  ORDER_READ: 'order:read',
  ORDER_WRITE: 'order:write',
  ORDER_DELETE: 'order:delete',
  
  // Users
  USER_READ: 'user:read',
  USER_WRITE: 'user:write',
  USER_DELETE: 'user:delete',
  
  // Reports
  REPORTS_READ: 'reports:read',
  REPORTS_EXPORT: 'reports:export',
  
  // Settings
  SETTINGS_READ: 'settings:read',
  SETTINGS_WRITE: 'settings:write'
} as const
