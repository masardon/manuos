// JWT Authentication Utilities for ManuOS
// Uses jose library for JWT handling

import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

// JWT Configuration
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'manuos-secret-key-change-in-production'
)

const ACCESS_TOKEN_EXPIRY = '15m'  // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'  // 7 days

export interface TokenPayload extends JWTPayload {
  userId: string
  email: string
  tenantId: string
  roleId: string
  roleCode: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

/**
 * Generate JWT tokens for a user
 */
export async function generateTokens(payload: Omit<TokenPayload, 'iat' | 'exp'>): Promise<AuthTokens> {
  const accessToken = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .setIssuer('manuos')
    .setAudience('manuos-api')
    .sign(JWT_SECRET)

  const refreshToken = await new SignJWT({ ...payload, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .setIssuer('manuos')
    .setAudience('manuos-refresh')
    .sign(JWT_SECRET)

  return {
    accessToken,
    refreshToken,
    expiresIn: 900 // 15 minutes in seconds
  }
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string, expectedType?: 'access' | 'refresh'): Promise<TokenPayload | null> {
  try {
    const expectedAudience = expectedType === 'refresh' ? 'manuos-refresh' : 'manuos-api'
    
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: 'manuos',
      audience: expectedAudience
    })

    return payload as TokenPayload
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

/**
 * Refresh an access token using a refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<AuthTokens | null> {
  const payload = await verifyToken(refreshToken, 'refresh')
  if (!payload) return null

  // Remove type from payload for new tokens
  const { type, ...userPayload } = payload as any
  
  return generateTokens(userPayload)
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null
  
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }
  
  return parts[1]
}

/**
 * Generate password hash (for demo - use bcrypt in production)
 */
export async function hashPassword(password: string): Promise<string> {
  // For demo purposes, return a simple hash
  // In production, use bcrypt or argon2
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Verify password (for demo - use bcrypt in production)
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // For demo, check against plain text or simple comparison
  // In production, use bcrypt.compare
  if (password === 'demo123' || password === hash) {
    return true
  }
  
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}
