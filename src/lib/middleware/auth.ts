// Simple authentication middleware helper
// In production, replace with proper JWT/session validation

export interface AuthUser {
  id: string
  email: string
  name?: string
  roleId: string
  roleCode: string
  tenantId: string
}

export function requireAuth(headers: Headers): AuthUser | null {
  // Get user from cookie
  const cookieHeader = headers.get('cookie')
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=')
    acc[key] = value
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

export function getTenantId(headers: Headers): string | null {
  const user = requireAuth(headers)
  return user?.tenantId || null
}

export function getUserId(headers: Headers): string | null {
  const user = requireAuth(headers)
  return user?.id || null
}

export function checkRole(requiredRoles: string[], user: AuthUser | null): boolean {
  if (!user) return false
  return requiredRoles.includes(user.roleCode)
}
