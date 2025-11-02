'use client'

import { useState, useEffect } from 'react'
import { createClientBrowser } from '@/lib/supabase/browser-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CheckCircle2, Bot, ExternalLink, Info } from 'lucide-react'
import { toast } from 'sonner'
import { CardGridSkeleton } from '@/components/skeletons'
import type { Database } from '@/types/database'

type ExternalConnection = Database['public']['Tables']['external_connections']['Row']

export default function IntegrationsPage() {
  const [connections, setConnections] = useState<ExternalConnection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConnections()
  }, [])

  async function loadConnections() {
    try {
      const supabase = createClientBrowser()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data, error } = await supabase
        .from('external_connections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setConnections((data || []) as ExternalConnection[])
    } catch (error: any) {
      console.error('Error loading connections:', error)
      toast.error('Failed to load integrations')
    } finally {
      setLoading(false)
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'active':
      case 'connected':
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Connected
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <CardGridSkeleton count={2} />
      </div>
    )
  }

  const activeConnections = connections.filter((c) => c.status === 'active')

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ExternalLink className="h-8 w-8" />
          Integrations
        </h1>
        <p className="text-muted-foreground mt-1">
          Connect external services via the AI chat assistant
        </p>
      </div>

      <Alert>
        <Bot className="h-4 w-4" />
        <AlertTitle>Tool Router Integration</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>
            <strong>Tool Router works directly in the AI chat interface.</strong> 
            The AI assistant can automatically discover and use 500+ integrations including:
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
            <li>Banking services (Plaid, Yodlee)</li>
            <li>Email services (Gmail, Outlook)</li>
            <li>Receipt scanning (OCR services)</li>
            <li>Payment processors</li>
            <li>Investment tracking</li>
            <li>And many more...</li>
          </ul>
          <p className="mt-2">
            Simply ask the AI assistant in chat to connect to a service, and it will guide you through the connection process automatically.
          </p>
        </AlertDescription>
      </Alert>

      {/* Connected Services */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Connected Services</h2>
          <Button
            variant="outline"
            onClick={() => {
              toast.info('Open the AI chat assistant (bottom right) to connect new services')
            }}
          >
            <Bot className="mr-2 h-4 w-4" />
            Connect via Chat
          </Button>
        </div>

        {activeConnections.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <ExternalLink className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Connected Services</h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  Connect services directly through the AI chat assistant. 
                  Try asking: "Connect my Gmail account" or "Sync my bank transactions"
                </p>
                <Button
                  onClick={() => {
                    toast.info('Open the AI chat (bottom right corner) to connect services')
                  }}
                >
                  Learn How to Connect
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activeConnections.map((connection) => (
              <Card key={connection.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {connection.connected_entity_name || connection.toolkit_name || connection.integration_type}
                      </CardTitle>
                      <CardDescription>
                        Connected via Tool Router
                      </CardDescription>
                    </div>
                    {getStatusBadge(connection.status || 'active')}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last synced:</span>
                      <span>
                        {connection.last_synced_at
                          ? new Date(connection.last_synced_at).toLocaleDateString()
                          : 'Never'}
                      </span>
                    </div>
                    {connection.toolkit_name && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Service:</span>
                        <span>{connection.toolkit_name}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        toast.info('Ask the AI assistant to sync this connection')
                      }}
                      className="flex-1"
                    >
                      <Bot className="mr-2 h-4 w-4" />
                      Sync via Chat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Tool Router Info */}
      <Card>
        <CardHeader>
          <CardTitle>About Tool Router</CardTitle>
          <CardDescription>
            How integrations work in Luno
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <p>
              <strong>Tool Router by Composio</strong> powers all external integrations. 
              Instead of manually connecting services, you interact with the AI assistant in chat.
            </p>
            <div className="space-y-1 mt-3">
              <p className="font-medium">To connect a service:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2 text-muted-foreground">
                <li>Open the AI chat assistant (bottom right)</li>
                <li>Ask to connect a service (e.g., "Connect my Gmail" or "Sync bank transactions")</li>
                <li>The AI will guide you through the connection process</li>
              </ol>
            </div>
            <div className="space-y-1 mt-3">
              <p className="font-medium">Examples of what you can connect:</p>
              <ul className="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
                <li>Email accounts (Gmail, Outlook) for receipt scanning</li>
                <li>Bank accounts via Plaid/Yodlee</li>
                <li>Investment platforms</li>
                <li>Payment processors</li>
                <li>And 500+ other services</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
