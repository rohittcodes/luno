---
skill: tool-router-integrator
dependencies:
  - Context7 MCP for Tool Router docs
description: Integrate Tool Router by Composio for external service connections in the finance app
tags: [integration, tool-router, composio, external-services, agentic]
---

# Tool Router Integration for Finance App

Integrate Composio's Tool Router to enable users to connect external financial services (banks, payment processors, receipt scanners, etc.) with automatic discovery, authentication, and execution.

## What this skill does

1. **Set up Tool Router SDK** - Install and configure Composio SDK
2. **Create session management** - Handle Tool Router sessions per user
3. **Build connection UI** - Create interfaces for linking external accounts
4. **Implement agentic workflows** - Enable AI-powered financial operations
5. **Handle authentication flows** - Manage OAuth and API key connections
6. **Sync external data** - Import transactions, balances, and more

## When to use this skill

- Connecting to bank accounts for transaction import
- Integrating payment processors (Stripe, PayPal)
- Receipt scanning services (Expensify, Dext)
- Credit score monitoring (Credit Karma, Experian)
- Investment tracking (Robinhood, Coinbase)
- Bill payment automation
- Tax export integrations (TurboTax, QuickBooks)

## Finance App Use Cases

### Bank Account Syncing
```
User wants to automatically import transactions from Chase, Bank of America, etc.
Tool Router discovers and connects to banking APIs via Plaid, Yodlee, or direct APIs.
```

### Receipt Scanning
```
User takes photo of receipt.
Tool Router connects to OCR services to extract:
- Merchant name
- Amount
- Date
- Items purchased
- Category suggestions
```

### Bill Payment
```
User wants to pay utility bills directly from app.
Tool Router discovers bill payment APIs and executes payments.
```

### Investment Tracking
```
User connects brokerage accounts to track net worth.
Tool Router fetches current holdings and values.
```

### Tax Export
```
User wants to export transaction data for tax filing.
Tool Router formats data for QuickBooks, TurboTax, or accountant import.
```

## Setup & Configuration

### Install Dependencies
```bash
pnpm add @composio/core @composio/openai-agents @openai/agents
```

### Environment Variables
```env
# .env.local
COMPOSIO_API_KEY=your_composio_api_key
OPENAI_API_KEY=your_openai_api_key

# Supabase connection (for storing Tool Router sessions)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Schema for Tool Router
```sql
-- Store Tool Router sessions
CREATE TABLE tool_router_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_url TEXT NOT NULL,
  toolkits TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '1 hour',
  is_active BOOLEAN DEFAULT true
);

-- Store external connections
CREATE TABLE external_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL, -- 'bank', 'payment', 'receipt_scanner', etc.
  toolkit_name TEXT NOT NULL, -- 'plaid', 'stripe', 'expensify', etc.
  connection_id TEXT, -- Tool Router connection ID
  connected_entity_id TEXT, -- Bank account ID, Stripe account ID, etc.
  connected_entity_name TEXT, -- "Chase Checking", "My Stripe Account"
  status TEXT DEFAULT 'pending', -- 'pending', 'active', 'error', 'disconnected'
  last_synced_at TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Track sync history
CREATE TABLE sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES external_connections(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL, -- 'transactions', 'balances', 'investments'
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  status TEXT DEFAULT 'running', -- 'running', 'completed', 'failed'
  items_synced INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

-- RLS policies
ALTER TABLE tool_router_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sessions" ON tool_router_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own connections" ON external_connections
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users view own sync history" ON sync_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM external_connections
      WHERE id = sync_history.connection_id
      AND user_id = auth.uid()
    )
  );
```

## Tool Router Service Layer

### Create Tool Router Client
```typescript
// lib/tool-router/client.ts
import { Composio } from '@composio/core'
import { OpenAIAgentsProvider } from '@composio/openai-agents'

export function createToolRouterClient() {
  return new Composio({
    apiKey: process.env.COMPOSIO_API_KEY!,
    provider: new OpenAIAgentsProvider()
  })
}

export async function createToolRouterSession(
  userId: string,
  toolkits: string[] = ['plaid', 'stripe', 'expensify', 'yodlee']
) {
  const composio = createToolRouterClient()

  const session = await composio.experimental.toolRouter.createSession(
    userId,
    { toolkits }
  )

  // Store session in database
  const supabase = createClient()
  await supabase.from('tool_router_sessions').insert({
    user_id: userId,
    session_url: session.url,
    toolkits: toolkits,
    expires_at: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
  })

  return session
}

export async function getActiveSession(userId: string) {
  const supabase = createClient()

  const { data: session } = await supabase
    .from('tool_router_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return session
}
```

### Connection Management
```typescript
// lib/tool-router/connections.ts
import { createClient } from '@/lib/supabase/client'

export async function saveConnection(
  userId: string,
  integrationType: string,
  toolkitName: string,
  connectionData: {
    connectionId?: string
    entityId: string
    entityName: string
    metadata?: Record<string, any>
  }
) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('external_connections')
    .insert({
      user_id: userId,
      integration_type: integrationType,
      toolkit_name: toolkitName,
      connection_id: connectionData.connectionId,
      connected_entity_id: connectionData.entityId,
      connected_entity_name: connectionData.entityName,
      status: 'active',
      metadata: connectionData.metadata || {}
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getConnections(userId: string, integrationType?: string) {
  const supabase = createClient()

  let query = supabase
    .from('external_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')

  if (integrationType) {
    query = query.eq('integration_type', integrationType)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function disconnectConnection(connectionId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('external_connections')
    .update({ status: 'disconnected' })
    .eq('id', connectionId)

  if (error) throw error
}
```

## Agentic Workflows

### Bank Transaction Sync Agent
```typescript
// lib/tool-router/agents/bank-sync.ts
import { Agent, run } from '@openai/agents'
import { hostedMcpTool } from '@openai/agents'
import { createToolRouterSession } from '../client'
import { createClient } from '@/lib/supabase/client'

export async function syncBankTransactions(
  userId: string,
  bankConnectionId: string,
  dateRange: { start: Date; end: Date }
) {
  // Get or create Tool Router session
  const session = await createToolRouterSession(userId, ['plaid', 'yodlee'])

  // Create agent with Tool Router
  const agent = new Agent({
    name: 'BankSyncAgent',
    instructions: `
      You are a financial data sync agent. Your job is to:
      1. Fetch bank transactions from the connected account
      2. Parse and normalize transaction data
      3. Categorize transactions intelligently
      4. Check for duplicates before importing
      5. Return structured transaction data

      For each transaction, extract:
      - Date
      - Description/merchant name
      - Amount (positive for income, negative for expenses)
      - Category (groceries, dining, transport, utilities, etc.)
      - Payment method

      Handle edge cases:
      - Pending transactions (mark as pending)
      - Refunds (link to original transaction if possible)
      - Transfers between accounts (avoid double counting)
    `,
    tools: [
      hostedMcpTool({
        serverLabel: 'tool_router',
        serverUrl: session.url,
      }),
    ],
  })

  // Execute sync
  const result = await run(
    agent,
    `Fetch all transactions from connection ${bankConnectionId} between ${dateRange.start.toISOString()} and ${dateRange.end.toISOString()}. Parse and return them in structured format.`
  )

  // Parse agent response and import transactions
  const transactions = parseAgentResponse(result.finalOutput)

  // Import to database (with duplicate detection)
  const supabase = createClient()
  const imported = []

  for (const txn of transactions) {
    // Check for duplicate
    const { data: existing } = await supabase
      .from('transactions')
      .select('id')
      .eq('user_id', userId)
      .eq('external_id', txn.externalId)
      .single()

    if (!existing) {
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          account_id: txn.accountId,
          amount: Math.abs(txn.amount),
          type: txn.amount > 0 ? 'income' : 'expense',
          description: txn.description,
          transaction_date: txn.date,
          category_id: await findOrCreateCategory(userId, txn.category),
          external_id: txn.externalId,
          payment_method: txn.paymentMethod,
          notes: `Imported from ${txn.source}`
        })
        .select()
        .single()

      if (!error) imported.push(data)
    }
  }

  // Log sync history
  await supabase.from('sync_history').insert({
    connection_id: bankConnectionId,
    sync_type: 'transactions',
    completed_at: new Date().toISOString(),
    status: 'completed',
    items_synced: imported.length
  })

  return {
    synced: imported.length,
    skipped: transactions.length - imported.length,
    transactions: imported
  }
}

function parseAgentResponse(output: string): any[] {
  // Parse agent's structured output
  // Agent should return JSON array of transactions
  try {
    const match = output.match(/```json\n([\s\S]*?)\n```/)
    if (match) {
      return JSON.parse(match[1])
    }
    return JSON.parse(output)
  } catch (e) {
    console.error('Failed to parse agent output:', e)
    return []
  }
}

async function findOrCreateCategory(userId: string, categoryName: string): Promise<string> {
  const supabase = createClient()

  // Try to find existing category
  const { data: existing } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', userId)
    .ilike('name', categoryName)
    .single()

  if (existing) return existing.id

  // Create new category
  const { data: newCat } = await supabase
    .from('categories')
    .insert({
      user_id: userId,
      name: categoryName,
      type: 'expense', // Default
      icon: getCategoryIcon(categoryName),
      color: getCategoryColor(categoryName)
    })
    .select()
    .single()

  return newCat.id
}
```

### Receipt Scanner Agent
```typescript
// lib/tool-router/agents/receipt-scanner.ts
export async function scanReceipt(
  userId: string,
  receiptImageUrl: string
) {
  const session = await createToolRouterSession(userId, ['expensify', 'ocr_space', 'google_vision'])

  const agent = new Agent({
    name: 'ReceiptScannerAgent',
    instructions: `
      You are a receipt scanning expert. Your job is to:
      1. Use OCR tools to extract text from receipt images
      2. Parse merchant name, total amount, date, and line items
      3. Suggest appropriate expense category
      4. Return structured data

      Extract:
      - Merchant/vendor name
      - Date of purchase
      - Total amount (look for "Total", "Amount Due", etc.)
      - Line items with individual prices
      - Tax amount
      - Payment method (if shown)
      - Suggested category based on merchant type
    `,
    tools: [
      hostedMcpTool({
        serverLabel: 'tool_router',
        serverUrl: session.url,
      }),
    ],
  })

  const result = await run(
    agent,
    `Scan this receipt image and extract all transaction details: ${receiptImageUrl}`
  )

  return parseReceiptData(result.finalOutput)
}
```

### Bill Payment Agent
```typescript
// lib/tool-router/agents/bill-payment.ts
export async function payBill(
  userId: string,
  billDetails: {
    payee: string
    amount: number
    dueDate: Date
    accountId: string
  }
) {
  const session = await createToolRouterSession(userId, ['stripe', 'paypal', 'bill_com'])

  const agent = new Agent({
    name: 'BillPaymentAgent',
    instructions: `
      You are a bill payment assistant. Your job is to:
      1. Verify the payee accepts online payments
      2. Find the best payment method (lowest fees)
      3. Process the payment securely
      4. Return confirmation details

      IMPORTANT: Always confirm with user before executing payment.
    `,
    tools: [
      hostedMcpTool({
        serverLabel: 'tool_router',
        serverUrl: session.url,
      }),
    ],
  })

  const result = await run(
    agent,
    `Process payment of $${billDetails.amount} to ${billDetails.payee} from account ${billDetails.accountId}. Due date: ${billDetails.dueDate.toISOString()}`
  )

  return parsePaymentConfirmation(result.finalOutput)
}
```

## UI Components

### Connection Manager Component
```typescript
// components/integrations/ConnectionManager.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const AVAILABLE_INTEGRATIONS = [
  {
    id: 'plaid',
    name: 'Plaid',
    description: 'Connect your bank accounts',
    icon: '🏦',
    category: 'banking'
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Connect your payment processor',
    icon: '💳',
    category: 'payments'
  },
  {
    id: 'expensify',
    name: 'Expensify',
    description: 'Scan receipts automatically',
    icon: '📄',
    category: 'receipts'
  }
]

export function ConnectionManager() {
  const [connections, setConnections] = useState([])
  const [connecting, setConnecting] = useState<string | null>(null)

  async function handleConnect(integrationId: string) {
    setConnecting(integrationId)

    try {
      // Create Tool Router session
      const response = await fetch('/api/tool-router/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolkits: [integrationId] })
      })

      const { sessionUrl, authRequired, authUrl } = await response.json()

      if (authRequired) {
        // Open authentication popup
        window.open(authUrl, 'Connect Account', 'width=600,height=700')

        // Listen for auth completion
        window.addEventListener('message', handleAuthCallback)
      } else {
        // Connection ready
        await completeConnection(integrationId)
      }
    } catch (error) {
      console.error('Connection failed:', error)
    } finally {
      setConnecting(null)
    }
  }

  async function handleAuthCallback(event: MessageEvent) {
    if (event.data.type === 'auth-complete') {
      await completeConnection(event.data.integrationId)
    }
  }

  async function completeConnection(integrationId: string) {
    // Save connection
    const response = await fetch('/api/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ integrationId })
    })

    const connection = await response.json()
    setConnections(prev => [...prev, connection])
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Connected Accounts</h2>

      {/* Active Connections */}
      <div className="space-y-4">
        {connections.map(conn => (
          <Card key={conn.id} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-2xl">{conn.icon}</span>
              <div>
                <h3 className="font-medium">{conn.name}</h3>
                <p className="text-sm text-gray-500">
                  Connected {new Date(conn.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={conn.status === 'active' ? 'success' : 'warning'}>
                {conn.status}
              </Badge>
              <Button variant="outline" size="sm">Disconnect</Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Available Integrations */}
      <div>
        <h3 className="text-lg font-medium mb-4">Add Connection</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {AVAILABLE_INTEGRATIONS.map(integration => (
            <Card key={integration.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <span className="text-3xl">{integration.icon}</span>
                  <div>
                    <h4 className="font-medium">{integration.name}</h4>
                    <p className="text-sm text-gray-500">{integration.description}</p>
                  </div>
                </div>
              </div>
              <Button
                className="w-full mt-4"
                onClick={() => handleConnect(integration.id)}
                disabled={connecting === integration.id}
              >
                {connecting === integration.id ? 'Connecting...' : 'Connect'}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
```

## API Routes

### Create Session Endpoint
```typescript
// app/api/tool-router/create-session/route.ts
import { NextResponse } from 'next/server'
import { createToolRouterSession } from '@/lib/tool-router/client'
import { getUser } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { toolkits } = await request.json()

    const session = await createToolRouterSession(user.id, toolkits)

    return NextResponse.json({
      sessionUrl: session.url,
      authRequired: session.authRequired,
      authUrl: session.authUrl
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

### Bank Sync Endpoint
```typescript
// app/api/sync/bank/route.ts
import { NextResponse } from 'next/server'
import { syncBankTransactions } from '@/lib/tool-router/agents/bank-sync'
import { getUser } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { connectionId, dateRange } = await request.json()

    const result = await syncBankTransactions(
      user.id,
      connectionId,
      {
        start: new Date(dateRange.start),
        end: new Date(dateRange.end)
      }
    )

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

## Workflow Steps

1. **Install Tool Router SDK** - Add dependencies and configure
2. **Create database schema** - Set up session and connection tables
3. **Build service layer** - Create session and connection management
4. **Implement agents** - Build agentic workflows for specific tasks
5. **Create UI components** - Build connection manager interface
6. **Add API endpoints** - Create routes for session and sync operations
7. **Test integration** - Verify authentication and data sync flows

## Security Considerations

- Never store Tool Router session URLs in client-side storage
- Generate new session for each user session
- Implement rate limiting on sync operations
- Validate all external data before import
- Log all external API calls for audit
- Handle PII data according to regulations

## Output Format

Provide:
1. Tool Router client configuration
2. Database schema for connections
3. Agentic workflow implementations
4. UI components for connection management
5. API route handlers
6. Type definitions
7. Testing examples

## Example Usage

"Set up Tool Router to allow users to connect their Chase bank account and automatically import transactions"

Expected output:
- Complete Tool Router setup
- Bank sync agent implementation
- Connection UI component
- API endpoints
- Database schema
- Testing instructions
