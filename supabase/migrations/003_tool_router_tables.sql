-- Tool Router Sessions
CREATE TABLE IF NOT EXISTS public.tool_router_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_url TEXT NOT NULL,
  toolkits TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 hour',
  is_active BOOLEAN DEFAULT true
);

-- External Connections
CREATE TABLE IF NOT EXISTS public.external_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL CHECK (integration_type IN ('bank', 'payment', 'receipt_scanner', 'credit_monitor', 'investment', 'tax_service')),
  toolkit_name TEXT NOT NULL,
  connection_id TEXT,
  connected_entity_id TEXT,
  connected_entity_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'error', 'disconnected')),
  last_synced_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sync History
CREATE TABLE IF NOT EXISTS public.sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES public.external_connections(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('transactions', 'balances', 'investments', 'credit_score')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  items_synced INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tool_router_sessions_user_id ON public.tool_router_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_router_sessions_active ON public.tool_router_sessions(user_id, is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_external_connections_user_id ON public.external_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_external_connections_status ON public.external_connections(user_id, status);
CREATE INDEX IF NOT EXISTS idx_sync_history_connection_id ON public.sync_history(connection_id);

-- Enable RLS
ALTER TABLE public.tool_router_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users manage own sessions" ON public.tool_router_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own connections" ON public.external_connections
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users view own sync history" ON public.sync_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.external_connections
      WHERE id = sync_history.connection_id
      AND user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_external_connections_updated_at
  BEFORE UPDATE ON public.external_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

