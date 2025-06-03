#!/usr/bin/env node

/**
 * Create Subscription Tables Script
 * 
 * This script creates subscription tables by inserting test records,
 * which triggers Supabase to auto-create the table schema.
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function createSubscriptionTables() {
  console.log('🚀 Creating subscription tables...\n');

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
    console.error('\nPlease check your .env.local file.');
    process.exit(1);
  }

  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    console.log('📋 Creating subscription_plans table...');
    
    // Create subscription plans by inserting test data
    const { data: plansData, error: plansError } = await supabase
      .from('subscription_plans')
      .insert([
        {
          id: 'free',
          name: 'free',
          display_name: 'Free',
          description: 'Basic note generation for students',
          price_monthly: 0.00,
          price_yearly: 0.00,
          currency: 'PLN',
          features: {
            notes_generation: false,
            quizzes: false,
            youtube_support: false,
            ppt_support: false,
            export: false,
            copy_paste: true
          },
          limits: {
            notes_per_month: 2,
            max_saved_notes: 3,
            max_text_length: 5000
          },
          is_active: true
        },
        {
          id: 'student',
          name: 'student',
          display_name: 'Student',
          description: 'Perfect for students with enhanced features',
          price_monthly: 19.99,
          price_yearly: 179.99,
          currency: 'PLN',
          features: {
            notes_generation: true,
            quizzes: true,
            youtube_support: true,
            ppt_support: true,
            export: false,
            copy_paste: true
          },
          limits: {
            notes_per_month: 10,
            max_saved_notes: 12,
            max_text_length: 15000
          },
          is_active: true
        },
        {
          id: 'pro',
          name: 'pro',
          display_name: 'Pro',
          description: 'Ultimate plan for power users and professionals',
          price_monthly: 49.99,
          price_yearly: 449.99,
          currency: 'PLN',
          features: {
            notes_generation: true,
            quizzes: true,
            youtube_support: true,
            ppt_support: true,
            export: true,
            copy_paste: true,
            priority_generation: true
          },
          limits: {
            notes_per_month: 150,
            max_saved_notes: 50,
            max_text_length: 50000
          },
          is_active: true
        }
      ])
      .select();

    if (plansError) {
      console.error('❌ Error creating subscription_plans table:', plansError.message);
    } else {
      console.log('✅ subscription_plans table created successfully');
      console.log(`   - Inserted ${plansData.length} subscription plans`);
    }

    console.log('\n📋 Creating user_subscriptions table...');
    
    // Create a test user subscription (this will be deleted)
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .insert([
        {
          user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
          plan_id: 'free',
          billing_cycle: 'monthly',
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      ])
      .select();

    if (subscriptionError) {
      console.error('❌ Error creating user_subscriptions table:', subscriptionError.message);
    } else {
      console.log('✅ user_subscriptions table created successfully');
      
      // Delete the test record
      await supabase
        .from('user_subscriptions')
        .delete()
        .eq('user_id', '00000000-0000-0000-0000-000000000000');
      console.log('   - Test record cleaned up');
    }

    console.log('\n📋 Creating user_usage table...');
    
    // Create a test user usage record (this will be deleted)
    const { data: usageData, error: usageError } = await supabase
      .from('user_usage')
      .insert([
        {
          user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
          month_year: new Date().toISOString().slice(0, 7), // YYYY-MM format
          notes_generated: 0,
          video_notes_count: 0,
          file_notes_count: 0,
          text_notes_count: 0,
          total_saved_notes: 0
        }
      ])
      .select();

    if (usageError) {
      console.error('❌ Error creating user_usage table:', usageError.message);
    } else {
      console.log('✅ user_usage table created successfully');
      
      // Delete the test record
      await supabase
        .from('user_usage')
        .delete()
        .eq('user_id', '00000000-0000-0000-0000-000000000000');
      console.log('   - Test record cleaned up');
    }

    // Verify the setup
    console.log('\n🔍 Verifying subscription system setup...');
    
    // Check subscription plans
    const { data: plans, error: verifyPlansError } = await supabase
      .from('subscription_plans')
      .select('id, display_name, price_monthly, price_yearly')
      .eq('is_active', true);
      
    if (verifyPlansError) {
      console.error('❌ Error fetching subscription plans:', verifyPlansError.message);
    } else {
      console.log('✅ Subscription plans verified:');
      plans.forEach(plan => {
        console.log(`   - ${plan.display_name}: ${plan.price_monthly} PLN/month, ${plan.price_yearly} PLN/year`);
      });
    }

    console.log('\n🎉 Subscription system setup completed!');
    console.log('\nNext steps:');
    console.log('1. Test the pricing page: http://localhost:3000/pricing');
    console.log('2. Sign up for a new account to test the free plan assignment');
    console.log('3. Set up RLS policies in Supabase dashboard');
    console.log('4. Implement payment processing (Stripe) for paid plans');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

// Run the setup
createSubscriptionTables().catch(console.error); 