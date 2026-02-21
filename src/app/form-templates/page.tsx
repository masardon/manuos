'use client'

import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function FormTemplatesPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Form Templates</h1>
          <p className="text-muted-foreground mt-1">
            Manage form templates for jobsheets and manufacturing processes
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Form Templates</CardTitle>
            <CardDescription>
              This feature is under development. Coming soon!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <p>Form template management will be available in a future update</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
