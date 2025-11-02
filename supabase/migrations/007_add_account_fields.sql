-- Add missing fields to accounts table
ALTER TABLE public.accounts
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS institution_name TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

