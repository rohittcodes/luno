-- Household Invitations
CREATE TABLE IF NOT EXISTS public.household_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '7 days',
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_household_invitations_token ON public.household_invitations(token);
CREATE INDEX IF NOT EXISTS idx_household_invitations_email ON public.household_invitations(email);
CREATE INDEX IF NOT EXISTS idx_household_invitations_household_id ON public.household_invitations(household_id);
CREATE INDEX IF NOT EXISTS idx_household_invitations_status ON public.household_invitations(status, expires_at);

-- Enable RLS
ALTER TABLE public.household_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Household owners can view invitations" ON public.household_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.household_members hm
      JOIN public.households h ON h.id = hm.household_id
      WHERE hm.household_id = household_invitations.household_id
      AND hm.user_id = auth.uid()
      AND (h.created_by = auth.uid() OR hm.role IN ('owner', 'admin'))
    )
  );

CREATE POLICY "Household owners can create invitations" ON public.household_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.household_members hm
      JOIN public.households h ON h.id = hm.household_id
      WHERE hm.household_id = household_invitations.household_id
      AND hm.user_id = auth.uid()
      AND (h.created_by = auth.uid() OR hm.role IN ('owner', 'admin'))
    )
  );

CREATE POLICY "Users can view their own invitations by email" ON public.household_invitations
  FOR SELECT USING (
    email = (SELECT email FROM public.users_profile WHERE id = auth.uid())
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can update their own invitations" ON public.household_invitations
  FOR UPDATE USING (
    email = (SELECT email FROM public.users_profile WHERE id = auth.uid())
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
