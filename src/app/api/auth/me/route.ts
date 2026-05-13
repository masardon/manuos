import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth/middleware'

export async function GET(request: NextRequest) {
  try {
    // Try to authenticate via JWT or cookie
    const authResult = await authenticateRequest(request)
    
    if (authResult.success && authResult.user) {
      // Get full user data from database
      const { db } = await import('@/lib/db')
      const user = await db.user.findUnique({
        where: { id: authResult.user.id },
        include: {
          role: true,
          userSettings: true
        }
      })
      
      if (user) {
        const { passwordHash, ...userWithoutPassword } = user
        return NextResponse.json({
          user: {
            ...userWithoutPassword,
            role: user.role.name,
            roleCode: user.role.code,
          }
        })
      }
    }
    
    // Fallback to cookie check for backward compatibility
    const userCookie = request.cookies.get('manuos-user')
    if (userCookie) {
      try {
        const user = JSON.parse(userCookie.value)
        return NextResponse.json({ user })
      } catch (e) {
        // Invalid cookie, clear it
        const response = NextResponse.json({ user: null })
        response.cookies.delete('manuos-user')
        return response
      }
    }
    
    return NextResponse.json({ user: null })
  } catch (error) {
    console.error('Auth me error:', error)
    return NextResponse.json({ user: null })
  }
}
