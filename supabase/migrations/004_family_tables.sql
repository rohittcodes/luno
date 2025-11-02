-- Households
CREATE TABLE IF NOT EXISTS public.households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Household Members
CREATE TABLE IF NOT EXISTS public.household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(household_id, user_id)
);

-- Shared Accounts
CREATE TABLE IF NOT EXISTS public.shared_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  permissions JSONB DEFAULT '{"view": true, "edit": false, "delete": false}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expense Splits
CREATE TABLE IF NOT EXISTS public.expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  split_type TEXT NOT NULL CHECK (split_type IN ('equal', 'percentage', 'custom')),
  splits JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_household_members_household_id ON public.household_members(household_id);
CREATE INDEX IF NOT EXISTS idx_household_members_user_id ON public.household_members(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_accounts_household_id ON public.shared_accounts(household_id);
CREATE INDEX IF NOT EXISTS idx_shared_accounts_account_id ON public.shared_accounts(account_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_transaction_id ON public.expense_splits(transaction_id);
CREATE INDEX IF NOT EXISTS idx_expense_splits_household_id ON public.expense_splits(household_id);

-- Enable RLS
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for households
CREATE POLICY "Household members can view household" ON public.households
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = households.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Household owners can update household" ON public.households
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = households.id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for household_members
CREATE POLICY "Household members can view members" ON public.household_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.household_members hm
      WHERE hm.household_id = household_members.household_id
      AND hm.user_id = auth.uid()
    )
  );

CREATE POLICY "Household owners can manage members" ON public.household_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.household_members hm
      JOIN public.households h ON h.id = hm.household_id
      WHERE hm.household_id = household_members.household_id
      AND hm.user_id = auth.uid()
      AND (h.created_by = auth.uid() OR hm.role IN ('owner', 'admin'))
    )
  );

-- RLS Policies for shared_accounts
CREATE POLICY "Household members can view shared accounts" ON public.shared_accounts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = shared_accounts.household_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Household admins can manage shared accounts" ON public.shared_accounts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = shared_accounts.household_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for expense_splits
CREATE POLICY "Household members can view expense splits" ON public.expense_splits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = expense_splits.household_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Household members can create expense splits" ON public.expense_splits
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_id = expense_splits.household_id
      AND user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_households_updated_at
  BEFORE UPDATE ON public.households
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

