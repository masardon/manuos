import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

    // For demo purposes: accept 'demo123' password for all YPTI accounts
    // TODO: Implement proper password hashing with bcrypt in production
    const passwordMatch = user.passwordHash === password ||
                         user.passwordHash === Buffer.from(password).toString('base64') ||
                         (user.email.endsWith('@ypti.com') && password === 'demo123')

    if (!passwordMatch) {
      return NextResponse.json(
        { message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Return user data (without password)
    const { passwordHash, ...userWithoutPassword } = user
    const userData = {
      ...userWithoutPassword,
      role: user.role.name,
      roleCode: user.role.code,
    }

    const response = NextResponse.json({
      user: userData,
      message: 'Login successful',
    })

    // Set a simple cookie for session (in production, use proper session tokens)
    response.cookies.set('manuos-user', JSON.stringify(userData), {
      httpOnly: false, // In production, set to true and use proper session management
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
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
