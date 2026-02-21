'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, RefreshCw, Settings, AlertTriangle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Machine {
  id: string
  code: string
  name: string
  model?: string
  location?: string
  type?: string
  status: string
  isActive: boolean
}

export default function MachinesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMachines = async () => {
    try {
      const response = await fetch('/api/machines')
      const data = await response.json()
      setMachines(data.machines || [])
    } catch (error) {
      console.error('Error fetching machines:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch machines',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMachines()
  }, [])

  const getStatusBadge = (status: string) => {
    const config: Record<string, string> = {
      IDLE: 'bg-gray-100 text-gray-800',
      BUSY: 'bg-blue-100 text-blue-800',
      DOWN: 'bg-red-100 text-red-800',
      MAINTENANCE: 'bg-yellow-100 text-yellow-800',
    }
    return <Badge className={config[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Machines</h1>
            <p className="text-muted-foreground mt-1">Manage your manufacturing equipment</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchMachines} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => router.push('/machines/breakdowns')}>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Breakdowns
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Machine
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Machines</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{machines.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Idle</CardTitle>
              <Settings className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {machines.filter((m) => m.status === 'IDLE').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Busy</CardTitle>
              <Settings className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {machines.filter((m) => m.status === 'BUSY').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Down</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {machines.filter((m) => m.status === 'DOWN').length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Machines</CardTitle>
            <CardDescription>List of all registered machines in the system</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading machines...</div>
            ) : machines.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No machines found. Add your first machine to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {machines.map((machine) => (
                    <TableRow key={machine.id}>
                      <TableCell className="font-medium">{machine.code}</TableCell>
                      <TableCell>{machine.name}</TableCell>
                      <TableCell>{machine.type || '-'}</TableCell>
                      <TableCell>{machine.location || '-'}</TableCell>
                      <TableCell>{getStatusBadge(machine.status)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
