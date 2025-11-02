-- Add missing fields to budgets table
ALTER TABLE public.budgets
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

