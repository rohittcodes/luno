-- Add currency field to transactions table
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

