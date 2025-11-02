-- Add INSERT policy for users_profile
-- Users should be able to insert their own profile
CREATE POLICY "Users can insert own profile" ON public.users_profile
  FOR INSERT WITH CHECK (auth.uid() = id);

