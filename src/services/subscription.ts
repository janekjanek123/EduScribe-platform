/**
 * Subscription Service
 * 
 * Handles subscription plans, usage tracking, and feature access control
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  features: {
    notes_generation: boolean;
    quizzes: boolean;
    youtube_support: boolean;
    ppt_support: boolean;
    export: boolean;
    copy_paste: boolean;
    upload_video?: boolean;
    priority_generation?: boolean;
  };
  limits: {
    notes_per_month: number; // -1 means unlimited
    max_saved_notes: number;
    max_text_length: number;
  };
  is_active: boolean;
}

export interface UserSubscription {
  subscription_id: string;
  plan_id: string;
  plan_name: string;
  plan_display_name: string;
  billing_cycle: 'monthly' | 'yearly';
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  current_period_end: string;
  features: SubscriptionPlan['features'];
  limits: SubscriptionPlan['limits'];
  price_monthly: number;
  price_yearly: number;
}

export interface UserUsage {
  notes_generated: number;
  video_notes_count: number;
  file_notes_count: number;
  text_notes_count: number;
  total_saved_notes: number;
  month_year: string;
}

export interface UsageCheck {
  canGenerate: boolean;
  canSave: boolean;
  reason?: string;
  usage: UserUsage;
  limits: SubscriptionPlan['limits'];
}

/**
 * Get all available subscription plans
 */
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('price_monthly', { ascending: true });
    
  if (error) {
    console.error('[Subscription] Error fetching plans:', error);
    throw new Error('Failed to fetch subscription plans');
  }
  
  return data || [];
}

/**
 * Get user's current subscription with plan details
 */
export async function getUserSubscription(userId: string, token: string): Promise<UserSubscription | null> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
  
  try {
    // Use direct table query instead of RPC function
    const { data: userSub, error } = await supabase
      .from('user_subscriptions')
      .select(`
        id,
        plan_id,
        billing_cycle,
        status,
        current_period_end,
        subscription_plans (
          name,
          display_name,
          features,
          limits,
          price_monthly,
          price_yearly
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error) {
      console.error('[Subscription] Error fetching user subscription:', error);
      return null;
    }

    if (!userSub || !userSub.subscription_plans) {
      return null;
    }

    const planData = userSub.subscription_plans as any;
    
    return {
      subscription_id: userSub.id,
      plan_id: userSub.plan_id,
      plan_name: planData.name,
      plan_display_name: planData.display_name,
      billing_cycle: userSub.billing_cycle,
      status: userSub.status,
      current_period_end: userSub.current_period_end,
      features: planData.features,
      limits: planData.limits,
      price_monthly: planData.price_monthly,
      price_yearly: planData.price_yearly
    };
  } catch (error) {
    console.error('[Subscription] Error in getUserSubscription:', error);
    return null;
  }
}

/**
 * Get a specific subscription plan by ID
 */
export async function getSubscriptionPlan(planId: string): Promise<SubscriptionPlan | null> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', planId)
    .eq('is_active', true)
    .single();
    
  if (error) {
    console.error('[Subscription] Error fetching plan:', error);
    return null;
  }
  
  return data;
}

/**
 * Check if user can generate notes based on their plan and usage
 */
export async function checkUsageLimits(
  userId: string, 
  token: string, 
  noteType: 'video' | 'file' | 'text' = 'text'
): Promise<UsageCheck> {
  try {
    // Use direct table queries instead of RPC functions to avoid issues
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    console.log('[Subscription] Checking usage limits for user:', userId)

    // Get user's subscription directly
    const { data: userSub, error: subError } = await supabase
      .from('user_subscriptions')
      .select(`
        plan_id,
        billing_cycle,
        status,
        current_period_end,
        subscription_plans (
          name,
          display_name,
          features,
          limits,
          price_monthly,
          price_yearly
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    // Get current month usage directly
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data: usage, error: usageError } = await supabase
      .from('user_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('month_year', currentMonth)
      .single();

    // Default free plan limits
    const freePlanLimits = { 
      notes_per_month: 2, 
      max_saved_notes: 3, 
      max_text_length: 5000 
    };

    const currentUsage = usage || {
      notes_generated: 0,
      video_notes_count: 0,
      file_notes_count: 0,
      text_notes_count: 0,
      total_saved_notes: 0,
      month_year: currentMonth
    };

    // If usage record doesn't exist, create it
    if (!usage) {
      console.log('[Subscription] Creating usage record for current month:', currentMonth)
      const { error: createUsageError } = await supabase
        .from('user_usage')
        .insert({
          user_id: userId,
          month_year: currentMonth,
          notes_generated: 0,
          video_notes_count: 0,
          file_notes_count: 0,
          text_notes_count: 0,
          total_saved_notes: 0,
          updated_at: new Date().toISOString()
        });
      
      if (createUsageError) {
        console.error('[Subscription] Warning: Could not create usage record:', createUsageError);
      }
    }

    // If no subscription found or error, try to create a free subscription
    if (!userSub || subError) {
      console.log('[Subscription] No active subscription found, attempting to create free subscription')
      
      if (subError) {
        console.error('[Subscription] Subscription query error:', subError);
      }

      // Try to create a free subscription for the user
      const { error: createSubError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          plan_id: 'free',
          billing_cycle: 'monthly',
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (createSubError) {
        console.error('[Subscription] Could not create free subscription:', createSubError);
      } else {
        console.log('[Subscription] Created free subscription for user');
      }

      // Return free plan limits regardless of whether we could create the subscription
      const canGenerate = currentUsage.notes_generated < freePlanLimits.notes_per_month;
      const canSave = currentUsage.total_saved_notes < freePlanLimits.max_saved_notes;
      
      return {
        canGenerate,
        canSave,
        reason: !canGenerate ? `Monthly limit reached (${freePlanLimits.notes_per_month} notes per month)` :
                !canSave ? `Storage limit reached (${freePlanLimits.max_saved_notes} saved notes maximum)` : undefined,
        usage: currentUsage,
        limits: freePlanLimits
      };
    }

    const subscription = userSub;
    const planData = subscription.subscription_plans as any;
    
    if (!planData) {
      console.error('[Subscription] Plan data not found for subscription:', subscription);
      // Fallback to free plan
      const canGenerate = currentUsage.notes_generated < freePlanLimits.notes_per_month;
      const canSave = currentUsage.total_saved_notes < freePlanLimits.max_saved_notes;
      
      return {
        canGenerate,
        canSave,
        reason: 'Plan data not found - using free plan limits',
        usage: currentUsage,
        limits: freePlanLimits
      };
    }
    
    console.log('[Subscription] Found subscription:', {
      planId: subscription.plan_id,
      planLimits: planData.limits,
      currentUsage: currentUsage
    });

    // Check monthly generation limit (handle unlimited case)
    const monthlyLimit = planData.limits.notes_per_month;
    const canGenerate = monthlyLimit === -1 || currentUsage.notes_generated < monthlyLimit;
    
    // Check saved notes limit
    const canSave = currentUsage.total_saved_notes < planData.limits.max_saved_notes;
    
    let reason: string | undefined;
    if (!canGenerate && monthlyLimit !== -1) {
      reason = `Monthly limit reached (${monthlyLimit} notes per month)`;
    } else if (!canSave) {
      reason = `Storage limit reached (${planData.limits.max_saved_notes} saved notes maximum)`;
    }
    
    return {
      canGenerate,
      canSave,
      reason,
      usage: currentUsage,
      limits: planData.limits
    };
  } catch (error) {
    console.error('[Subscription] Error checking usage limits:', error);
    
    // Return restrictive fallback
    const currentMonth = new Date().toISOString().slice(0, 7);
    const fallbackUsage = {
      notes_generated: 999,
      video_notes_count: 0,
      file_notes_count: 0,
      text_notes_count: 0,
      total_saved_notes: 999,
      month_year: currentMonth
    };
    
    return {
      canGenerate: false,
      canSave: false,
      reason: 'Error checking subscription limits. Please try again.',
      usage: fallbackUsage,
      limits: { notes_per_month: 2, max_saved_notes: 3, max_text_length: 5000 }
    };
  }
}

/**
 * Increment user's usage count after successful note generation
 */
export async function incrementUsage(
  userId: string, 
  token: string, 
  noteType: 'video' | 'file' | 'text' = 'text'
): Promise<boolean> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    const currentMonth = new Date().toISOString().slice(0, 7);
    console.log('[Subscription] Incrementing usage for user:', userId, 'type:', noteType)

    // Get current usage
    const { data: currentUsage, error: fetchError } = await supabase
      .from('user_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('month_year', currentMonth)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[Subscription] Error fetching current usage:', fetchError);
      return false;
    }

    // Prepare update data
    const updateData: any = {
      notes_generated: (currentUsage?.notes_generated || 0) + 1,
      updated_at: new Date().toISOString()
    };

    // Increment specific note type counter
    if (noteType === 'video') {
      updateData.video_notes_count = (currentUsage?.video_notes_count || 0) + 1;
    } else if (noteType === 'file') {
      updateData.file_notes_count = (currentUsage?.file_notes_count || 0) + 1;
    } else if (noteType === 'text') {
      updateData.text_notes_count = (currentUsage?.text_notes_count || 0) + 1;
    }

    // Update or insert usage record
    if (currentUsage) {
      const { error: updateError } = await supabase
        .from('user_usage')
        .update(updateData)
        .eq('user_id', userId)
        .eq('month_year', currentMonth);

      if (updateError) {
        console.error('[Subscription] Error updating usage:', updateError);
        return false;
      }
    } else {
      // Create new usage record
      const insertData = {
        user_id: userId,
        month_year: currentMonth,
        notes_generated: 1,
        video_notes_count: noteType === 'video' ? 1 : 0,
        file_notes_count: noteType === 'file' ? 1 : 0,
        text_notes_count: noteType === 'text' ? 1 : 0,
        total_saved_notes: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('user_usage')
        .insert(insertData);

      if (insertError) {
        console.error('[Subscription] Error creating usage record:', insertError);
        return false;
      }
    }

    console.log('[Subscription] Successfully incremented usage');
    return true;
  } catch (error) {
    console.error('[Subscription] Error incrementing usage:', error);
    return false;
  }
}

/**
 * Update saved notes count (used when notes are saved or deleted)
 */
export async function updateSavedNotesCount(
  userId: string, 
  token: string, 
  count: number
): Promise<boolean> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    const currentMonth = new Date().toISOString().slice(0, 7);
    console.log('[Subscription] Updating saved notes count for user:', userId, 'count:', count)

    // Upsert the saved notes count
    const { error } = await supabase
      .from('user_usage')
      .upsert({
        user_id: userId,
        month_year: currentMonth,
        total_saved_notes: Math.max(0, count), // Ensure non-negative
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,month_year'
      });

    if (error) {
      console.error('[Subscription] Error updating saved notes count:', error);
      return false;
    }

    console.log('[Subscription] Successfully updated saved notes count');
    return true;
  } catch (error) {
    console.error('[Subscription] Error updating saved notes count:', error);
    return false;
  }
}

/**
 * Refresh saved notes count by counting all notes from all tables
 */
export async function refreshSavedNotesCount(
  userId: string,
  token: string
): Promise<boolean> {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    console.log('[Subscription] Refreshing saved notes count for user:', userId);

    // Count notes from all tables
    const [videoResult, fileResult, textResult] = await Promise.all([
      supabase
        .from('video_notes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('file_notes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('text_notes')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
    ]);

    const videoCount = videoResult.count || 0;
    const fileCount = fileResult.count || 0;
    const textCount = textResult.count || 0;
    const totalCount = videoCount + fileCount + textCount;

    console.log('[Subscription] Note counts:', {
      video: videoCount,
      file: fileCount,
      text: textCount,
      total: totalCount
    });

    // Update the usage record with the actual count
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { error } = await supabase
      .from('user_usage')
      .upsert({
        user_id: userId,
        month_year: currentMonth,
        total_saved_notes: totalCount,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,month_year'
      });

    if (error) {
      console.error('[Subscription] Error updating saved notes count:', error);
      return false;
    }

    console.log('[Subscription] Successfully refreshed saved notes count to:', totalCount);
    return true;
  } catch (error) {
    console.error('[Subscription] Error refreshing saved notes count:', error);
    return false;
  }
}

/**
 * Get plan pricing with discount calculation
 */
export function getPlanPricing(plan: SubscriptionPlan) {
  const monthlyPrice = plan.price_monthly;
  const yearlyPrice = plan.price_yearly;
  const yearlyMonthlyEquivalent = yearlyPrice / 12;
  const discountPercentage = monthlyPrice > 0 ? Math.round((1 - yearlyMonthlyEquivalent / monthlyPrice) * 100) : 0;
  const yearlySavings = (monthlyPrice * 12) - yearlyPrice;
  
  return {
    monthly: monthlyPrice,
    yearly: yearlyPrice,
    yearlyMonthlyEquivalent,
    discountPercentage,
    yearlySavings,
    currency: plan.currency
  };
}

/**
 * Check if user has access to a specific feature
 */
export async function hasFeatureAccess(
  userId: string,
  token: string,
  feature: keyof SubscriptionPlan['features']
): Promise<boolean> {
  try {
    const subscription = await getUserSubscription(userId, token);
    
    if (!subscription) {
      // Default free plan features
      const freeFeatures = {
        notes_generation: true,
        quizzes: false,
        youtube_support: true,
        ppt_support: false,
        export: false,
        copy_paste: true,
        upload_video: false,
        priority_generation: false
      };
      
      return freeFeatures[feature] || false;
    }
    
    return subscription.features[feature] || false;
  } catch (error) {
    console.error('[Subscription] Error checking feature access:', error);
    return false; // Default to no access on error
  }
}

/**
 * Assign subscription to user after successful payment
 */
export async function assignUserSubscription(
  userId: string,
  token: string,
  planId: string,
  billingCycle: 'monthly' | 'yearly',
  paymentData?: {
    stripeSubscriptionId?: string;
    stripeCustomerId?: string;
  }
): Promise<UserSubscription | null> {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  try {
    // Calculate period dates
    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date();
    
    if (billingCycle === 'yearly') {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
    } else {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    }

    // Prepare subscription data
    const subscriptionData = {
      user_id: userId,
      plan_id: planId,
      billing_cycle: billingCycle,
      status: 'active' as const,
      current_period_start: currentPeriodStart.toISOString(),
      current_period_end: currentPeriodEnd.toISOString(),
      cancel_at_period_end: false,
      stripe_subscription_id: paymentData?.stripeSubscriptionId || null,
      stripe_customer_id: paymentData?.stripeCustomerId || null,
      updated_at: new Date().toISOString()
    };

    // Upsert subscription (update if exists, insert if new)
    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'user_id'
      })
      .select(`
        id,
        plan_id,
        billing_cycle,
        status,
        current_period_end,
        subscription_plans (
          name,
          display_name,
          features,
          limits,
          price_monthly,
          price_yearly
        )
      `)
      .single();

    if (subscriptionError) {
      console.error('[Subscription] Error assigning subscription:', subscriptionError);
      throw new Error('Failed to assign subscription');
    }

    if (!subscription || !subscription.subscription_plans) {
      throw new Error('Failed to retrieve subscription details');
    }

    // Initialize usage tracking for current month
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { error: usageError } = await supabase
      .from('user_usage')
      .upsert({
        user_id: userId,
        month_year: currentMonth,
        notes_generated: 0,
        video_notes_count: 0,
        file_notes_count: 0,
        text_notes_count: 0,
        total_saved_notes: 0,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,month_year',
        ignoreDuplicates: true
      });

    if (usageError) {
      console.error('[Subscription] Warning: Failed to initialize usage tracking:', usageError);
      // Don't throw error here as subscription assignment was successful
    }

    const planData = subscription.subscription_plans as any;
    
    return {
      subscription_id: subscription.id,
      plan_id: subscription.plan_id,
      plan_name: planData.name,
      plan_display_name: planData.display_name,
      billing_cycle: subscription.billing_cycle,
      status: subscription.status,
      current_period_end: subscription.current_period_end,
      features: planData.features,
      limits: planData.limits,
      price_monthly: planData.price_monthly,
      price_yearly: planData.price_yearly
    };
  } catch (error) {
    console.error('[Subscription] Error in assignUserSubscription:', error);
    throw error;
  }
} 