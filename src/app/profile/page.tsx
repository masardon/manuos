'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { User, Bell, Monitor, LayoutGrid } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { useAuthStore } from '@/stores/auth-store'

interface UserSettings {
  id: string
  userId: string
  theme: string
  language: string
  timezone: string
  emailNotifications: boolean
  taskReminders: boolean
  breakdownAlerts: boolean
  inventoryAlerts: boolean
  defaultView: string
  showInactiveMachines: boolean
  showCompletedTasks: boolean
  rowsPerPage: number
  createdAt: string
  updatedAt: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, setUser } = useAuthStore()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    theme: 'light',
    language: 'en',
    timezone: 'UTC',
    emailNotifications: true,
    taskReminders: true,
    breakdownAlerts: true,
    inventoryAlerts: true,
    defaultView: 'dashboard',
    showInactiveMachines: false,
    showCompletedTasks: false,
    rowsPerPage: 25,
  })

  const fetchSettings = async () => {
    try {
      setLoading(true)
      // Using a demo user ID - in production, this would come from auth
      const userId = 'demo-user-id'
      const response = await fetch(`/api/usersettings?userId=${userId}`)
      const data = await response.json()
      setSettings(data.settings)
      setFormData({
        theme: data.settings.theme,
        language: data.settings.language,
        timezone: data.settings.timezone,
        emailNotifications: data.settings.emailNotifications,
        taskReminders: data.settings.taskReminders,
        breakdownAlerts: data.settings.breakdownAlerts,
        inventoryAlerts: data.settings.inventoryAlerts,
        defaultView: data.settings.defaultView,
        showInactiveMachines: data.settings.showInactiveMachines,
        showCompletedTasks: data.settings.showCompletedTasks,
        rowsPerPage: data.settings.rowsPerPage,
      })
    } catch (error) {
      console.error('Error fetching user settings:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch settings',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            setUser(data.user)
          } else {
            router.replace('/login')
          }
        } else {
          router.replace('/login')
        }
      } catch (error) {
        console.error('Auth check error:', error)
        router.replace('/login')
      }
    }

    checkAuth()
  }, [router, setUser])

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const userId = 'demo-user-id' // In production, this would come from auth
      const response = await fetch('/api/usersettings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...formData,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save settings')
      }

      const data = await response.json()
      setSettings(data.settings)
      toast({
        title: 'Success',
        description: 'Settings saved successfully',
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save settings',
      })
    } finally {
      setSaving(false)
    }
  }

  const themes = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ]

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'zh', label: 'Chinese' },
  ]

  const timezones = [
    { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Paris', label: 'Paris (CET)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  ]

  const rowsPerPageOptions = [10, 25, 50, 100]

  if (loading) {
    return (
      <AppLayout title="Profile">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Profile">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile & Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your personal information and application preferences
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="general" className="space-y-4">
            <TabsList>
              <TabsTrigger value="general">
                <Monitor className="h-4 w-4 mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="preferences">
                <LayoutGrid className="h-4 w-4 mr-2" />
                Preferences
              </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize how the application looks and behaves
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <Select
                      value={formData.theme}
                      onValueChange={(value) => setFormData({ ...formData, theme: value })}
                    >
                      <SelectTrigger id="theme">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {themes.map((theme) => (
                          <SelectItem key={theme.value} value={theme.value}>
                            {theme.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={formData.language}
                      onValueChange={(value) => setFormData({ ...formData, language: value })}
                    >
                      <SelectTrigger id="language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={formData.timezone}
                    onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose which notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive email notifications for important updates
                      </p>
                    </div>
                    <Switch
                      checked={formData.emailNotifications}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, emailNotifications: checked })
                      }
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Task Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Get reminded about upcoming and overdue tasks
                      </p>
                    </div>
                    <Switch
                      checked={formData.taskReminders}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, taskReminders: checked })
                      }
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Breakdown Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive alerts when machines break down
                      </p>
                    </div>
                    <Switch
                      checked={formData.breakdownAlerts}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, breakdownAlerts: checked })
                      }
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Inventory Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about low inventory levels
                      </p>
                    </div>
                    <Switch
                      checked={formData.inventoryAlerts}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, inventoryAlerts: checked })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard & Display</CardTitle>
                <CardDescription>
                  Customize your dashboard and data display preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultView">Default View</Label>
                  <Select
                    value={formData.defaultView}
                    onValueChange={(value) => setFormData({ ...formData, defaultView: value })}
                  >
                    <SelectTrigger id="defaultView">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dashboard">Dashboard</SelectItem>
                      <SelectItem value="orders">Orders</SelectItem>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="machines">Machines</SelectItem>
                      <SelectItem value="inventory">Inventory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Inactive Machines</Label>
                    <p className="text-sm text-muted-foreground">
                      Display inactive machines in the list
                    </p>
                  </div>
                  <Switch
                    checked={formData.showInactiveMachines}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, showInactiveMachines: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show Completed Tasks</Label>
                    <p className="text-sm text-muted-foreground">
                      Display completed tasks by default
                    </p>
                  </div>
                  <Switch
                    checked={formData.showCompletedTasks}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, showCompletedTasks: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="rowsPerPage">Rows Per Page</Label>
                  <Select
                    value={String(formData.rowsPerPage)}
                    onValueChange={(value) =>
                      setFormData({ ...formData, rowsPerPage: parseInt(value) })
                    }
                  >
                    <SelectTrigger id="rowsPerPage">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {rowsPerPageOptions.map((option) => (
                        <SelectItem key={option} value={String(option)}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Number of rows to display in data tables
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={fetchSettings}
            disabled={saving}
          >
            Reset
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
      </div>
    </AppLayout>
  )
}
