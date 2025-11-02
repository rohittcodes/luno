-- User Subscriptions
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'pro', 'family')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'expired')),
  lemon_squeezy_subscription_id TEXT,
  lemon_squeezy_customer_id TEXT,
  lemon_squeezy_order_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription Limits
CREATE TABLE IF NOT EXISTS public.subscription_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  transactions_limit INTEGER DEFAULT 50, -- -1 for unlimited
  categories_limit INTEGER DEFAULT 10, -- -1 for unlimited
  bank_connections_limit INTEGER DEFAULT 1,
  receipt_scans_limit INTEGER DEFAULT 0,
  family_members_limit INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscription_limits_user_id ON public.subscription_limits(user_id);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON public.user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own limits" ON public.subscription_limits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own limits" ON public.subscription_limits
  FOR UPDATE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_subscription_limits_updated_at
  BEFORE UPDATE ON public.subscription_limits
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to initialize subscription limits for new users
CREATE OR REPLACE FUNCTION public.initialize_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default free tier subscription
  INSERT INTO public.user_subscriptions (user_id, plan_type, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Insert default free tier limits
  INSERT INTO public.subscription_limits (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create user profile
  INSERT INTO public.users_profile (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to initialize subscription when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_user_subscription();

