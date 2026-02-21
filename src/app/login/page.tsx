'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { useToast } from '@/hooks/use-toast'

export default function LoginPage() {
  const router = useRouter()
  const { setUser } = useAuthStore()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        toast({
          title: 'Login successful',
          description: `Welcome back, ${data.user.name || data.user.email}!`,
        })
        router.push('/dashboard')
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Login failed')
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: error.message || 'Please check your credentials and try again',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Building2 className="h-8 w-8" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl">ManuOS</CardTitle>
            <CardDescription className="mt-1">
              Manufacturing Operating System
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
          <div className="mt-6 p-4 bg-muted rounded-lg space-y-3">
            <div>
              <p className="text-sm font-semibold mb-2">🏭 YPTI Demo Credentials:</p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded font-medium">Admin</span>
                  <code className="bg-background px-2 py-0.5 rounded flex-1">admin@ypti.com</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-blue-500 text-white px-2 py-0.5 rounded font-medium">PPIC</span>
                  <code className="bg-background px-2 py-0.5 rounded flex-1">ppic@ypti.com</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-purple-500 text-white px-2 py-0.5 rounded font-medium">Manager</span>
                  <code className="bg-background px-2 py-0.5 rounded flex-1">manager@ypti.com</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-green-500 text-white px-2 py-0.5 rounded font-medium">Tech 1</span>
                  <code className="bg-background px-2 py-0.5 rounded flex-1">tech1@ypti.com</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-orange-500 text-white px-2 py-0.5 rounded font-medium">Tech 2</span>
                  <code className="bg-background px-2 py-0.5 rounded flex-1">tech2@ypti.com</code>
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground mb-1">🔑 Password (all accounts):</p>
              <code className="text-xs bg-background px-2 py-1 rounded block text-center font-mono">demo123</code>
            </div>
            <p className="text-xs text-muted-foreground text-center pt-2">
              ✨ Recommended: Use <strong>admin@ypti.com</strong> for full demo access
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
