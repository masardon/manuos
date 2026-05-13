// Token refresh endpoint for ManuOS
import { NextRequest, NextResponse } from 'next/server'
import { refreshAccessToken, extractTokenFromHeader } from '@/lib/auth/jwt'

export async function POST(request: NextRequest) {
  try {
    // Try to get refresh token from header or cookie
    let refreshToken: string | null = null
    
    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      refreshToken = extractTokenFromHeader(authHeader)
    }
    
    if (!refreshToken) {
      refreshToken = request.cookies.get('manuos-refresh')?.value || null
    }
    
    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token required' },
        { status: 401 }
      )
    }
    
    // Refresh the tokens
    const tokens = await refreshAccessToken(refreshToken)
    
    if (!tokens) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      )
    }
    
    const response = NextResponse.json({
      success: true,
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn
      }
    })
    
    // Update cookies
    response.cookies.set('manuos-token', tokens.accessToken, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 15,
      sameSite: 'lax'
    })
    
    response.cookies.set('manuos-refresh', tokens.refreshToken, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax'
    })
    
    return response
  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
