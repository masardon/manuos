'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { RefreshCw, Save, Play, AlertCircle, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { AppLayout } from '@/components/layout/app-layout'
import { useAuthStore } from '@/stores/auth-store'

interface OdooConfig {
  odoo_url: string
  odoo_db: string
  odoo_user: string
  odoo_password: string
  odoo_enabled: string
}

interface SyncLog {
  id: string
  syncType: string
  status: string
  message: string | null
  syncedAt: string
}

export default function OdooIntegrationPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, setUser } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [config, setConfig] = useState<OdooConfig>({
    odoo_url: '',
    odoo_db: '',
    odoo_user: '',
    odoo_password: '',
    odoo_enabled: 'false',
  })
  const [logs, setLogs] = useState<SyncLog[]>([])

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
    fetchConfig()
    fetchLogs()
  }, [])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/odoo/config')
      const data = await response.json()
      if (data.success) {
        setConfig(data.config)
      }
    } catch (error) {
      console.error('Error fetching Odoo config:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch Odoo configuration',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/odoo/sync')
      const data = await response.json()
      if (data.success) {
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Error fetching sync logs:', error)
    }
  }

  const handleConfigChange = (key: keyof OdooConfig, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const handleSaveConfig = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/odoo/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      })
      const data = await response.json()
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Odoo configuration saved',
        })
      } else {
        throw new Error(data.error || 'Failed to save')
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save configuration',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    toast({
      title: 'Testing connection...',
      description: 'Mock implementation - always succeeds',
    })
    // In a real implementation, this would call an API endpoint
    setTimeout(() => {
      toast({
        title: 'Connection successful',
        description: 'Mock Odoo connection is working',
      })
    }, 1000)
  }

  const handleSyncPurchaseOrders = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/odoo/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_purchase_orders' }),
      })
      const data = await response.json()
      if (data.success) {
        toast({
          title: 'Sync completed',
          description: `Successfully synced ${data.result.syncedCount} purchase orders`,
        })
        fetchLogs()
      } else {
        throw new Error(data.error || 'Sync failed')
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Sync failed',
        description: error.message || 'Failed to sync purchase orders',
      })
    } finally {
      setSyncing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: any }> = {
      SUCCESS: { variant: 'default', icon: CheckCircle },
      FAILED: { variant: 'destructive', icon: AlertCircle },
      PENDING: { variant: 'secondary', icon: RefreshCw },
    }
    const { variant, icon: Icon } = config[status] || { variant: 'outline', icon: AlertCircle }
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <AppLayout title="Odoo Integration">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading Odoo configuration...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Odoo Integration">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Odoo Integration</h1>
            <p className="text-muted-foreground mt-2">
              Configure Odoo ERP integration and manage synchronization
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchLogs}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Logs
            </Button>
          </div>
        </div>

        <Tabs defaultValue="configuration" className="space-y-6">
          <TabsList>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="sync">Synchronization</TabsTrigger>
            <TabsTrigger value="logs">Sync Logs</TabsTrigger>
          </TabsList>

          {/* Configuration Tab */}
          <TabsContent value="configuration">
            <Card>
              <CardHeader>
                <CardTitle>Odoo Connection Settings</CardTitle>
                <CardDescription>
                  Configure connection to your Odoo instance. These settings can also be set via environment variables.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="odoo_url">Odoo URL *</Label>
                    <Input
                      id="odoo_url"
                      value={config.odoo_url}
                      onChange={(e) => handleConfigChange('odoo_url', e.target.value)}
                      placeholder="https://your-odoo-instance.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="odoo_db">Database *</Label>
                    <Input
                      id="odoo_db"
                      value={config.odoo_db}
                      onChange={(e) => handleConfigChange('odoo_db', e.target.value)}
                      placeholder="your_database"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="odoo_user">Username *</Label>
                    <Input
                      id="odoo_user"
                      value={config.odoo_user}
                      onChange={(e) => handleConfigChange('odoo_user', e.target.value)}
                      placeholder="admin"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="odoo_password">Password *</Label>
                    <Input
                      id="odoo_password"
                      type="password"
                      value={config.odoo_password}
                      onChange={(e) => handleConfigChange('odoo_password', e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="odoo_enabled"
                    checked={config.odoo_enabled === 'true'}
                    onCheckedChange={(checked) =>
                      handleConfigChange('odoo_enabled', String(checked))
                    }
                  />
                  <Label htmlFor="odoo_enabled">Enable Odoo Integration</Label>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveConfig} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Configuration'}
                  </Button>
                  <Button variant="outline" onClick={handleTestConnection}>
                    <Play className="h-4 w-4 mr-2" />
                    Test Connection
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Synchronization Tab */}
          <TabsContent value="sync">
            <Card>
              <CardHeader>
                <CardTitle>Manual Synchronization</CardTitle>
                <CardDescription>
                  Trigger synchronization between ManuOS and Odoo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Purchase Orders</CardTitle>
                      <CardDescription>
                        Sync approved purchase orders from ManuOS to Odoo
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button onClick={handleSyncPurchaseOrders} disabled={syncing || config.odoo_enabled !== 'true'}>
                        <Play className="h-4 w-4 mr-2" />
                        {syncing ? 'Syncing...' : 'Sync Purchase Orders'}
                      </Button>
                      {config.odoo_enabled !== 'true' && (
                        <p className="text-sm text-destructive mt-2">
                          Odoo integration is disabled
                        </p>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Goods Receipts</CardTitle>
                      <CardDescription>
                        Confirm goods receipts in Odoo
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" disabled>
                        <Play className="h-4 w-4 mr-2" />
                        Coming Soon
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Synchronization Logs</CardTitle>
                <CardDescription>
                  Recent synchronization activities and results
                </CardDescription>
              </CardHeader>
              <CardContent>
                {logs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No synchronization logs found</p>
                    <p className="text-sm mt-2">
                      Sync logs will appear here after synchronization operations
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {logs.map((log) => (
                      <div key={log.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">{log.syncType.replace('_', ' ')}</span>
                              {getStatusBadge(log.status)}
                            </div>
                            {log.message && (
                              <p className="text-sm text-muted-foreground">{log.message}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDate(log.syncedAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}