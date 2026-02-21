import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Check for user cookie
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
    return NextResponse.json({ user: null })
  }
}
