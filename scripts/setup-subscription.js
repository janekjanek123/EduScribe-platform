#!/usr/bin/env node

/**
 * Subscription System Setup Script
 * 
 * This script sets up the subscription system database tables and functions.
 * Run this script to enable subscription management in your EduScribe application.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function setupSubscriptionSystem() {
  console.log('🚀 Setting up subscription system...\n');

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    console.error('   - NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
    console.error('\nPlease check your .env.local file.');
    process.exit(1);
  }

  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'database-subscription-system.sql');
    
    if (!fs.existsSync(sqlPath)) {
      console.error('❌ SQL file not found:', sqlPath);
      process.exit(1);
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Executing subscription system SQL...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    });

    if (error) {
      console.error('❌ Error executing SQL:', error.message);
      
      // Try alternative approach - execute parts separately
      console.log('🔄 Trying alternative approach...');
      
      // Create subscription plans table
      const { error: plansError } = await supabase
        .from('subscription_plans')
        .select('id')
        .limit(1);
        
      if (plansError && plansError.code === 'PGRST116') {
        console.log('📋 Creating subscription_plans table...');
        // Table doesn't exist, we need to create it manually
        console.log('⚠️  Please run the SQL script manually in your Supabase dashboard:');
        console.log('   1. Go to your Supabase dashboard');
        console.log('   2. Navigate to SQL Editor');
        console.log('   3. Copy and paste the contents of database-subscription-system.sql');
        console.log('   4. Execute the script');
        return;
      }
      
      console.log('✅ Subscription tables already exist');
    } else {
      console.log('✅ SQL executed successfully');
    }

    // Verify the setup
    console.log('\n🔍 Verifying subscription system setup...');
    
    // Check subscription plans
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('id, display_name, price_monthly, price_yearly')
      .eq('is_active', true);
      
    if (plansError) {
      console.error('❌ Error fetching subscription plans:', plansError.message);
    } else {
      console.log('✅ Subscription plans found:');
      plans.forEach(plan => {
        console.log(`   - ${plan.display_name}: ${plan.price_monthly} PLN/month, ${plan.price_yearly} PLN/year`);
      });
    }

    // Check if user_subscriptions table exists
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('user_subscriptions')
      .select('id')
      .limit(1);
      
    if (subscriptionsError) {
      console.error('❌ Error accessing user_subscriptions table:', subscriptionsError.message);
    } else {
      console.log('✅ User subscriptions table is accessible');
    }

    // Check if user_usage table exists
    const { data: usage, error: usageError } = await supabase
      .from('user_usage')
      .select('id')
      .limit(1);
      
    if (usageError) {
      console.error('❌ Error accessing user_usage table:', usageError.message);
    } else {
      console.log('✅ User usage table is accessible');
    }

    console.log('\n🎉 Subscription system setup completed!');
    console.log('\nNext steps:');
    console.log('1. Test the pricing page: http://localhost:3000/pricing');
    console.log('2. Sign up for a new account to test the free plan assignment');
    console.log('3. Implement payment processing (Stripe) for paid plans');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupSubscriptionSystem().catch(console.error); 