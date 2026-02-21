'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Loader2 } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        // Check if system is initialized
        const initRes = await fetch('/api/init')
        const initData = await initRes.json()

        if (!initData.isInitialized) {
          // Initialize the system
          await fetch('/api/init', { method: 'POST' })
        }

        // Check if user is authenticated
        const authRes = await fetch('/api/auth/me')
        const authData = await authRes.json()

        if (authData.user) {
          router.push('/dashboard')
        } else {
          router.push('/login')
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        router.push('/login')
      } finally {
        setChecking(false)
      }
    }

    checkAndRedirect()
  }, [router])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50">
        <div className="text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-primary text-primary-foreground mx-auto mb-4">
            <Building2 className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold mb-2">ManuOS</h1>
          <p className="text-muted-foreground mb-4">Manufacturing Operating System</p>
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p>Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return null
}
