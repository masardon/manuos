import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateTokens, verifyPassword } from '@/lib/auth/jwt'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await db.user.findFirst({
      where: {
        email,
        isActive: true,
      },
      include: {
        role: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password (demo mode accepts demo123)
    const passwordValid = await verifyPassword(password, user.passwordHash) ||
                          (user.email.endsWith('@ypti.com') && password === 'demo123')

    if (!passwordValid) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Generate JWT tokens
    const tokens = await generateTokens({
      userId: user.id,
      email: user.email,
      tenantId: user.tenantId,
      roleId: user.roleId,
      roleCode: user.role.code
    })

    // Return user data (without password) and tokens
    const { passwordHash, ...userWithoutPassword } = user
    const userData = {
      ...userWithoutPassword,
      role: user.role.name,
      roleCode: user.role.code,
    }

    const response = NextResponse.json({
      success: true,
      user: userData,
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn
      },
      message: 'Login successful',
    })

    // Set secure cookies for web access
    response.cookies.set('manuos-user', JSON.stringify(userData), {
      httpOnly: false, // Allow JS access for client-side
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: 'lax'
    })
    
    response.cookies.set('manuos-token', tokens.accessToken, {
      httpOnly: true, // Secure HTTP-only cookie
      path: '/',
      maxAge: 60 * 15, // 15 minutes
      sameSite: 'lax'
    })
    
    response.cookies.set('manuos-refresh', tokens.refreshToken, {
      httpOnly: true, // Secure HTTP-only cookie
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax'
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
