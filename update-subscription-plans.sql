-- ============================================================================
-- Update Subscription Plans with New Limits and Features
-- ============================================================================
-- This script updates all subscription plans to match the new requirements

-- ========== UPDATE FREE PLAN ==========
UPDATE public.subscription_plans 
SET 
  features = '{
    "notes_generation": true,
    "quizzes": false,
    "youtube_support": true,
    "ppt_support": false,
    "export": false,
    "copy_paste": true,
    "upload_video": false,
    "priority_generation": false
  }',
  limits = '{
    "notes_per_month": 2,
    "max_saved_notes": 3,
    "max_text_length": 5000
  }',
  updated_at = NOW()
WHERE id = 'free';

-- ========== UPDATE STUDENT PLAN ==========
UPDATE public.subscription_plans 
SET 
  price_monthly = 24.99,
  price_yearly = 224.99,
  features = '{
    "notes_generation": true,
    "quizzes": true,
    "youtube_support": true,
    "ppt_support": true,
    "export": true,
    "copy_paste": true,
    "upload_video": true,
    "priority_generation": false
  }',
  limits = '{
    "notes_per_month": 10,
    "max_saved_notes": 12,
    "max_text_length": 10000
  }',
  updated_at = NOW()
WHERE id = 'student';

-- ========== UPDATE PRO PLAN ==========
UPDATE public.subscription_plans 
SET 
  price_monthly = 49.99,
  price_yearly = 449.99,
  features = '{
    "notes_generation": true,
    "quizzes": true,
    "youtube_support": true,
    "ppt_support": true,
    "export": true,
    "copy_paste": true,
    "upload_video": true,
    "priority_generation": true
  }',
  limits = '{
    "notes_per_month": -1,
    "max_saved_notes": 50,
    "max_text_length": 15000
  }',
  updated_at = NOW()
WHERE id = 'pro';

-- ========== VERIFY UPDATES ==========
SELECT 
  id,
  display_name,
  price_monthly,
  price_yearly,
  features,
  limits
FROM public.subscription_plans 
ORDER BY price_monthly ASC;

-- ========== SUCCESS MESSAGE ==========
SELECT 'All subscription plans updated successfully with new limits and features!' as status; 