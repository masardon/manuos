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
import { Search, RefreshCw, Plus, Trash2, Edit, Save } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { AppLayout } from '@/components/layout/app-layout'
import { useAuthStore } from '@/stores/auth-store'

interface SystemSetting {
  id: string
  key: string
  category: string
  value: string
  description?: string
  type: string
  isPublic: boolean
  updatedAt: string
}

interface NewSetting {
  key: string
  category: string
  value: string
  description: string
  type: string
  isPublic: boolean
}

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, setUser } = useAuthStore()
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteSetting, setDeleteSetting] = useState<SystemSetting | null>(null)

  const [newSetting, setNewSetting] = useState<NewSetting>({
    key: '',
    category: 'General',
    value: '',
    description: '',
    type: 'string',
    isPublic: false,
  })

  const [editedValues, setEditedValues] = useState<Record<string, string>>({})

  const categories = ['General', 'Security', 'Notifications', 'Operations', 'Custom']

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (categoryFilter) params.append('category', categoryFilter)

      const response = await fetch(`/api/settings?${params}`)
      const data = await response.json()
      setSettings(data.settings || [])
      setEditedValues({})
    } catch (error) {
      console.error('Error fetching settings:', error)
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
  }, [searchTerm, categoryFilter])

  const handleValueChange = (settingId: string, value: string) => {
    setEditedValues({
      ...editedValues,
      [settingId]: value,
    })
  }

  const handleSave = async (setting: SystemSetting) => {
    const newValue = editedValues[setting.id]
    if (newValue === undefined || newValue === setting.value) return

    setSaving(true)
    try {
      const response = await fetch(`/api/settings/${setting.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: newValue }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update setting')
      }

      toast({
        title: 'Success',
        description: 'Setting updated successfully',
      })

      setEditedValues({
        ...editedValues,
        [setting.id]: undefined,
      })
      fetchSettings()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update setting',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCreateSetting = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSetting),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create setting')
      }

      toast({
        title: 'Success',
        description: 'Setting created successfully',
      })

      setDialogOpen(false)
      resetNewSetting()
      fetchSettings()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to create setting',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteSetting = async (setting: SystemSetting) => {
    try {
      const response = await fetch(`/api/settings/${setting.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete setting')
      }

      toast({
        title: 'Success',
        description: 'Setting deleted successfully',
      })

      setDeleteSetting(null)
      fetchSettings()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete setting',
      })
    }
  }

  const resetNewSetting = () => {
    setNewSetting({
      key: '',
      category: 'General',
      value: '',
      description: '',
      type: 'string',
      isPublic: false,
    })
  }

  const renderValueInput = (setting: SystemSetting) => {
    const currentValue = editedValues[setting.id] ?? setting.value

    switch (setting.type) {
      case 'boolean':
        return (
          <Switch
            checked={currentValue === 'true'}
            onCheckedChange={(checked) =>
              handleValueChange(setting.id, String(checked))
            }
          />
        )
      case 'number':
        return (
          <Input
            type="number"
            value={currentValue}
            onChange={(e) => handleValueChange(setting.id, e.target.value)}
            className="max-w-xs"
          />
        )
      default:
        return (
          <Input
            value={currentValue}
            onChange={(e) => handleValueChange(setting.id, e.target.value)}
            className="max-w-xs"
          />
        )
    }
  }

  const settingsByCategory = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = []
    }
    acc[setting.category].push(setting)
    return acc
  }, {} as Record<string, SystemSetting[]>)

  return (
    <AppLayout title="Settings">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
            <p className="text-muted-foreground mt-2">
              Manage system-wide configuration and preferences
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetNewSetting()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Setting
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Setting</DialogTitle>
                <DialogDescription>
                  Add a new system-wide configuration setting
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSetting}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="key">Setting Key *</Label>
                  <Input
                    id="key"
                    value={newSetting.key}
                    onChange={(e) =>
                      setNewSetting({ ...newSetting, key: e.target.value })
                    }
                    placeholder="e.g., company_name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={newSetting.category}
                    onValueChange={(value) =>
                      setNewSetting({ ...newSetting, category: value })
                    }
                    required
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Data Type *</Label>
                  <Select
                    value={newSetting.type}
                    onValueChange={(value) =>
                      setNewSetting({ ...newSetting, type: value })
                    }
                    required
                  >
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string">String</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="boolean">Boolean</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">Value *</Label>
                  <Input
                    id="value"
                    value={newSetting.value}
                    onChange={(e) =>
                      setNewSetting({ ...newSetting, value: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newSetting.description}
                    onChange={(e) =>
                      setNewSetting({ ...newSetting, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPublic"
                    checked={newSetting.isPublic}
                    onCheckedChange={(checked) =>
                      setNewSetting({ ...newSetting, isPublic: checked })
                    }
                  />
                  <Label htmlFor="isPublic">Public Setting</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Setting'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search settings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter || "all"} onValueChange={(v) => setCategoryFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="sm:w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={fetchSettings} variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          <Tabs defaultValue={categories[0]} className="space-y-4">
            <TabsList className="flex-wrap h-auto">
              {categories.map((category) => {
                const count = settings.filter((s) => s.category === category).length
                return count > 0 ? (
                  <TabsTrigger key={category} value={category}>
                    {category}
                    <Badge variant="secondary" className="ml-2">
                      {count}
                    </Badge>
                  </TabsTrigger>
                ) : null
              })}
            </TabsList>

            {categories.map((category) => (
              <TabsContent key={category} value={category}>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading settings...
                  </div>
                ) : settingsByCategory[category]?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No settings found in this category.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {settingsByCategory[category]?.map((setting) => (
                      <div
                        key={setting.id}
                        className="flex items-start justify-between gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Label className="font-medium">{setting.key}</Label>
                            {setting.isPublic && (
                              <Badge variant="secondary" className="text-xs">
                                Public
                              </Badge>
                            )}
                          </div>
                          {setting.description && (
                            <p className="text-sm text-muted-foreground">
                              {setting.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Type: {setting.type} • Updated: {new Date(setting.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {renderValueInput(setting)}
                            {editedValues[setting.id] !== undefined && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleSave(setting)}
                                disabled={saving}
                              >
                                <Save className="h-4 w-4 text-primary" />
                              </Button>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteSetting(setting)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {deleteSetting && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Delete Setting</CardTitle>
              <CardDescription>
                Are you sure you want to delete the setting "{deleteSetting.key}"? This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setDeleteSetting(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteSetting(deleteSetting)}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </AppLayout>
  )
}
