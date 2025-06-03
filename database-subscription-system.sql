-- EduScribe Subscription System Database Schema
-- Run this script in the Supabase SQL Editor to create the subscription tables

-- ========== SUBSCRIPTION PLANS TABLE ==========
-- Define the available subscription plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'PLN',
  features JSONB NOT NULL,
  limits JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert the three subscription plans
INSERT INTO public.subscription_plans (id, name, display_name, description, price_monthly, price_yearly, features, limits) VALUES
('free', 'free', 'Free', 'Basic note generation for students', 0.00, 0.00, 
 '{"notes_generation": true, "quizzes": false, "youtube_support": true, "ppt_support": false, "export": false, "copy_paste": true}',
 '{"notes_per_month": 2, "max_saved_notes": 3, "max_text_length": 5000}'
),
('student', 'student', 'Student', 'Perfect for students with enhanced features', 19.99, 179.99,
 '{"notes_generation": true, "quizzes": true, "youtube_support": true, "ppt_support": true, "export": false, "copy_paste": true}',
 '{"notes_per_month": 10, "max_saved_notes": 12, "max_text_length": 15000}'
),
('pro', 'pro', 'Pro', 'Ultimate plan for power users and professionals', 49.99, 449.99,
 '{"notes_generation": true, "quizzes": true, "youtube_support": true, "ppt_support": true, "export": true, "copy_paste": true, "priority_generation": true}',
 '{"notes_per_month": 150, "max_saved_notes": 50, "max_text_length": 50000}'
)
ON CONFLICT (id) DO UPDATE SET
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  updated_at = NOW();

-- ========== USER SUBSCRIPTIONS TABLE ==========
-- Track user subscription status
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.subscription_plans(id),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  current_period_start TIMESTAMP NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ========== USAGE TRACKING TABLE ==========
-- Track monthly usage for each user
CREATE TABLE IF NOT EXISTS public.user_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- Format: 'YYYY-MM'
  notes_generated INTEGER DEFAULT 0,
  video_notes_count INTEGER DEFAULT 0,
  file_notes_count INTEGER DEFAULT 0,
  text_notes_count INTEGER DEFAULT 0,
  total_saved_notes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, month_year)
);

-- ========== INDEXES ==========
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id ON public.user_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON public.user_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_month_year ON public.user_usage(month_year);

-- ========== ROW LEVEL SECURITY ==========
-- Enable RLS on all subscription tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscription_plans (public read access)
CREATE POLICY "Anyone can view subscription plans" 
  ON public.subscription_plans 
  FOR SELECT 
  TO public
  USING (is_active = true);

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscription" 
  ON public.user_subscriptions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" 
  ON public.user_subscriptions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert user subscriptions" 
  ON public.user_subscriptions 
  FOR INSERT 
  WITH CHECK (true);

-- RLS Policies for user_usage
CREATE POLICY "Users can view their own usage" 
  ON public.user_usage 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage user usage" 
  ON public.user_usage 
  FOR ALL 
  USING (true);

-- ========== FUNCTIONS ==========
-- Function to get user's current subscription with plan details
CREATE OR REPLACE FUNCTION get_user_subscription(user_uuid UUID)
RETURNS TABLE (
  subscription_id UUID,
  plan_id TEXT,
  plan_name TEXT,
  plan_display_name TEXT,
  billing_cycle TEXT,
  status TEXT,
  current_period_end TIMESTAMP,
  features JSONB,
  limits JSONB,
  price_monthly DECIMAL,
  price_yearly DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.id as subscription_id,
    us.plan_id,
    sp.name as plan_name,
    sp.display_name as plan_display_name,
    us.billing_cycle,
    us.status,
    us.current_period_end,
    sp.features,
    sp.limits,
    sp.price_monthly,
    sp.price_yearly
  FROM public.user_subscriptions us
  JOIN public.subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = user_uuid
  AND us.status = 'active'
  ORDER BY us.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get or create user usage for current month
CREATE OR REPLACE FUNCTION get_user_monthly_usage(user_uuid UUID)
RETURNS TABLE (
  notes_generated INTEGER,
  video_notes_count INTEGER,
  file_notes_count INTEGER,
  text_notes_count INTEGER,
  total_saved_notes INTEGER,
  month_year TEXT
) AS $$
DECLARE
  current_month TEXT := to_char(NOW(), 'YYYY-MM');
BEGIN
  -- Insert usage record if it doesn't exist
  INSERT INTO public.user_usage (user_id, month_year)
  VALUES (user_uuid, current_month)
  ON CONFLICT (user_id, month_year) DO NOTHING;
  
  -- Return current usage
  RETURN QUERY
  SELECT 
    uu.notes_generated,
    uu.video_notes_count,
    uu.file_notes_count,
    uu.text_notes_count,
    uu.total_saved_notes,
    uu.month_year
  FROM public.user_usage uu
  WHERE uu.user_id = user_uuid 
  AND uu.month_year = current_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage counters
CREATE OR REPLACE FUNCTION increment_user_usage(
  user_uuid UUID,
  note_type TEXT DEFAULT 'general'
)
RETURNS void AS $$
DECLARE
  current_month TEXT := to_char(NOW(), 'YYYY-MM');
BEGIN
  -- Ensure usage record exists
  INSERT INTO public.user_usage (user_id, month_year)
  VALUES (user_uuid, current_month)
  ON CONFLICT (user_id, month_year) DO NOTHING;
  
  -- Increment counters based on note type
  IF note_type = 'video' THEN
    UPDATE public.user_usage 
    SET 
      notes_generated = notes_generated + 1,
      video_notes_count = video_notes_count + 1,
      updated_at = NOW()
    WHERE user_id = user_uuid AND month_year = current_month;
  ELSIF note_type = 'file' THEN
    UPDATE public.user_usage 
    SET 
      notes_generated = notes_generated + 1,
      file_notes_count = file_notes_count + 1,
      updated_at = NOW()
    WHERE user_id = user_uuid AND month_year = current_month;
  ELSIF note_type = 'text' THEN
    UPDATE public.user_usage 
    SET 
      notes_generated = notes_generated + 1,
      text_notes_count = text_notes_count + 1,
      updated_at = NOW()
    WHERE user_id = user_uuid AND month_year = current_month;
  ELSE
    UPDATE public.user_usage 
    SET 
      notes_generated = notes_generated + 1,
      updated_at = NOW()
    WHERE user_id = user_uuid AND month_year = current_month;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update total saved notes count
CREATE OR REPLACE FUNCTION update_saved_notes_count(user_uuid UUID)
RETURNS void AS $$
DECLARE
  current_month TEXT := to_char(NOW(), 'YYYY-MM');
  total_notes INTEGER;
BEGIN
  -- Count total saved notes across all tables
  SELECT 
    COALESCE((SELECT COUNT(*) FROM public.video_notes WHERE user_id = user_uuid), 0) +
    COALESCE((SELECT COUNT(*) FROM public.file_notes WHERE user_id = user_uuid), 0) +
    COALESCE((SELECT COUNT(*) FROM public.text_notes WHERE user_id = user_uuid), 0)
  INTO total_notes;
  
  -- Ensure usage record exists
  INSERT INTO public.user_usage (user_id, month_year)
  VALUES (user_uuid, current_month)
  ON CONFLICT (user_id, month_year) DO NOTHING;
  
  -- Update the count
  UPDATE public.user_usage 
  SET 
    total_saved_notes = total_notes,
    updated_at = NOW()
  WHERE user_id = user_uuid AND month_year = current_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========== DEFAULT FREE SUBSCRIPTION ==========
-- Function to create default free subscription for new users
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_subscriptions (
    user_id, 
    plan_id, 
    billing_cycle, 
    status,
    current_period_start,
    current_period_end
  ) VALUES (
    NEW.id,
    'free',
    'monthly',
    'active',
    NOW(),
    NOW() + INTERVAL '1 month'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically assign free plan to new users
DROP TRIGGER IF EXISTS create_user_subscription_trigger ON auth.users;
CREATE TRIGGER create_user_subscription_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_subscription();

-- ========== VERIFICATION QUERIES ==========
-- Verify the setup
SELECT 'Subscription Plans' as table_name, COUNT(*) as count FROM public.subscription_plans
UNION ALL
SELECT 'User Subscriptions' as table_name, COUNT(*) as count FROM public.user_subscriptions
UNION ALL
SELECT 'User Usage' as table_name, COUNT(*) as count FROM public.user_usage; 