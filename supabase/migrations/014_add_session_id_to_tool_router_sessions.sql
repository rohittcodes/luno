-- Add session_id column to tool_router_sessions table
-- This stores the Composio session ID returned from the API

ALTER TABLE public.tool_router_sessions
ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Add index for faster lookups by session_id
CREATE INDEX IF NOT EXISTS idx_tool_router_sessions_session_id 
ON public.tool_router_sessions(session_id);

-- Add comment
COMMENT ON COLUMN public.tool_router_sessions.session_id IS 'Composio Tool Router session ID returned from the API';

