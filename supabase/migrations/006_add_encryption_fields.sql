-- Add secure_metadata field for encrypted payment data
ALTER TABLE public.user_subscriptions
ADD COLUMN IF NOT EXISTS secure_metadata TEXT;

-- Add secure_metadata field for encrypted external connection data
ALTER TABLE public.external_connections
ADD COLUMN IF NOT EXISTS secure_metadata TEXT;

-- Add index for secure_metadata lookup (if needed)
-- Note: We can't index encrypted data directly, but we can add comments
COMMENT ON COLUMN public.user_subscriptions.secure_metadata IS 'Encrypted payment metadata (card details, etc.)';
COMMENT ON COLUMN public.external_connections.secure_metadata IS 'Encrypted connection credentials and sensitive data';

