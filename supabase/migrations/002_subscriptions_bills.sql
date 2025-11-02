-- Subscriptions and Bills
CREATE TABLE IF NOT EXISTS public.subscriptions_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bill', 'subscription', 'free_trial')),
  amount NUMERIC(12, 2),
  currency TEXT DEFAULT 'USD',
  due_date DATE NOT NULL,
  renewal_frequency TEXT CHECK (renewal_frequency IN ('monthly', 'yearly', 'weekly', 'one_time')),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  reminder_days_before INTEGER[] DEFAULT ARRAY[7, 3, 1],
  last_notified_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('bill_due', 'subscription_renewal', 'trial_expiring', 'budget_alert', 'account_balance')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_entity_type TEXT CHECK (related_entity_type IN ('subscriptions_bills', 'budget', 'account')),
  related_entity_id UUID,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification Preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT false,
  sms_enabled BOOLEAN DEFAULT false,
  bill_reminder_days INTEGER[] DEFAULT ARRAY[7, 3, 1],
  subscription_reminder_days INTEGER[] DEFAULT ARRAY[7, 3, 1],
  trial_reminder_days INTEGER[] DEFAULT ARRAY[7, 3, 1],
  budget_alert_threshold NUMERIC(3, 2) DEFAULT 0.80,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_bills_user_due ON public.subscriptions_bills(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_bills_active ON public.subscriptions_bills(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.subscriptions_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own subscriptions_bills" ON public.subscriptions_bills
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own notifications" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own preferences" ON public.notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_subscriptions_bills_updated_at
  BEFORE UPDATE ON public.subscriptions_bills
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

