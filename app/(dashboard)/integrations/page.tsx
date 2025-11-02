'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Building2,
  CreditCard,
  Receipt,
  TrendingUp,
  FileText,
  Plug,
  Check,
  RefreshCw,
  Plus,
} from 'lucide-react'
import { logger } from '@/lib/utils/logger'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface Connection {
  id: string
  integrationType: string
  toolkitName: string
  entityName: string
  status: 'active' | 'error' | 'disconnected'
  lastSyncedAt: string
  createdAt: string
}

interface Session {
  id?: string
  url?: string
  sessionId?: string
  toolkits?: string[]
  expiresAt?: string
  isActive?: boolean
}

const integrationTypes = [
  {
    type: 'bank',
    name: 'Bank Accounts',
    description: 'Connect your bank accounts to automatically sync transactions',
    icon: Building2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-950',
  },
  {
    type: 'payment',
    name: 'Payment Providers',
    description: 'Connect payment processors for income tracking',
    icon: CreditCard,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-950',
  },
  {
    type: 'receipt_scanner',
    name: 'Receipt Scanning',
    description: 'Automatically extract expense data from receipts',
    icon: Receipt,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-950',
  },
  {
    type: 'investment',
    name: 'Investment Accounts',
    description: 'Track your investment portfolio and gains',
    icon: TrendingUp,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-950',
  },
  {
    type: 'tax_service',
    name: 'Tax Services',
    description: 'Export data to tax software for easy filing',
    icon: FileText,
    color: 'text-red-600',
    bgColor: 'bg-red-100 dark:bg-red-950',
  },
]

export default function IntegrationsPage() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)

      const connectionsRes = await fetch('/api/tool-router/connections')
      if (connectionsRes.ok) {
        const data = await connectionsRes.json()
        setConnections(data.connections || [])
      }

      const sessionRes = await fetch('/api/tool-router/session')
      if (sessionRes.ok) {
        const data = await sessionRes.json()
        if (data.session) {
          setSession(data.session)
          logger.debug('Session loaded:', data.session)
        }
      } else {
        const errorData = await sessionRes.json().catch(() => ({}))
        logger.debug('No session found:', errorData)
      }
    } catch (error) {
      logger.error('Error loading integrations:', error)
    } finally {
      setLoading(false)
    }
  }

  async function createSession() {
    try {
      setCreating(true)
      const res = await fetch('/api/tool-router/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolkits: [] }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `Failed to create session: ${res.status}`)
      }

      const data = await res.json()
      logger.debug('Session created:', data.session)
      setSession(data.session)

      // Reload data after successful creation
      await loadData()
    } catch (error) {
      logger.error('Error creating session:', error)
      toast.error(`Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Card><CardContent className="p-8"><Skeleton className="h-32 w-full" /></CardContent></Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-muted-foreground mt-1">Connect external services via Tool Router & MCP</p>
      </div>

      <Card className="rounded-xl border-[3px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Plug className="h-6 w-6" />
            Tool Router Session
          </CardTitle>
          <CardDescription>MCP-enabled session for connecting to 500+ apps</CardDescription>
        </CardHeader>
        <CardContent>
          {session ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Session Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={session.isActive ? 'default' : 'secondary'}>
                      {session.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {!session.sessionId && (
                      <Badge variant="outline" className="ml-2 text-amber-600 border-amber-600">
                        Missing Session ID
                      </Badge>
                    )}
                    {session.isActive && <Check className="h-4 w-4 text-green-600" />}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={loadData} className="rounded-[2rem]">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={async () => {
                      if (confirm('Delete this session? You can create a new one afterward.')) {
                        try {
                          const res = await fetch('/api/tool-router/session', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ sessionId: session.id }),
                          })
                          if (res.ok) {
                            setSession(null)
                            toast.success('Session deleted')
                          } else {
                            throw new Error('Failed to delete session')
                          }
                        } catch (error) {
                          logger.error('Error deleting session:', error)
                          toast.error('Failed to delete session')
                        }
                      }
                    }}
                    className="rounded-[2rem]"
                  >
                    Delete
                  </Button>
                </div>
              </div>
              <div className="grid gap-3 text-sm">
                {session.id && (
                  <div>
                    <span className="text-muted-foreground">Database ID:</span>{' '}
                    <code className="text-xs bg-muted px-2 py-1 rounded-lg font-mono">
                      {session.id}
                    </code>
                  </div>
                )}
                {session.sessionId ? (
                  <div>
                    <span className="text-muted-foreground">Composio Session ID:</span>{' '}
                    <code className="text-xs bg-muted px-2 py-1 rounded-lg font-mono break-all">
                      {session.sessionId}
                    </code>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-amber-600 dark:text-amber-400 text-xs">
                      ⚠️ Session ID not available (this session was created before the migration)
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        // Delete old session and create new one
                        if (confirm('Delete old session and create a new one with Session ID?')) {
                          try {
                            // Delete old session
                            await fetch('/api/tool-router/session', {
                              method: 'DELETE',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ sessionId: session.id }),
                            })
                            
                            // Create new session
                            await createSession()
                            toast.success('New session created with Session ID!')
                          } catch (error) {
                            logger.error('Error recreating session:', error)
                            toast.error('Failed to recreate session')
                          }
                        }
                      }}
                      className="rounded-[2rem] text-xs"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Recreate Session
                    </Button>
                  </div>
                )}
                {session.url && (
                  <div>
                    <span className="text-muted-foreground">MCP URL:</span>{' '}
                    <code className="text-xs bg-muted px-2 py-1 rounded-lg font-mono break-all">
                      {session.url.length > 50 ? `${session.url.substring(0, 50)}...` : session.url}
                    </code>
                  </div>
                )}
                {session.toolkits && session.toolkits.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Toolkits:</span>{' '}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {session.toolkits.map((toolkit: string) => (
                        <Badge key={toolkit} variant="secondary" className="text-xs">
                          {toolkit}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Expires:</span>{' '}
                  {session.expiresAt ? format(new Date(session.expiresAt), 'PPp') : 'N/A'}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No active session. Create one to start connecting services.
              </p>
              <Button onClick={createSession} disabled={creating} className="rounded-[2rem]">
                {creating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Session
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Available Integrations</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {integrationTypes.map((integration) => {
            const Icon = integration.icon
            return (
              <Card key={integration.type} className="rounded-xl border-[3px] hover:shadow-xl transition-all">
                <CardHeader>
                  <div className={`p-3 rounded-xl ${integration.bgColor} w-fit`}>
                    <Icon className={`h-6 w-6 ${integration.color}`} />
                  </div>
                  <CardTitle className="mt-4 text-xl">{integration.name}</CardTitle>
                  <CardDescription>{integration.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full rounded-xl" disabled>
                    <Plus className="h-4 w-4 mr-2" />
                    Connect (Coming Soon)
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
