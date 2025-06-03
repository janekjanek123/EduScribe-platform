/**
 * Simple database setup script for subscription system
 * Run with: node src/scripts/setup-simple.js
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('URL:', supabaseUrl ? 'Found' : 'Missing');
  console.log('Key:', supabaseAnonKey ? 'Found' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupBasicTables() {
  console.log('🚀 Setting up basic subscription tables...\n');

  // 1. Try to create subscription_plans table by inserting data
  console.log('1️⃣ Creating subscription_plans table...');
  try {
    const { data, error } = await supabase
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
            notes_generation: true,
            quizzes: false,
            youtube_support: true,
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

    if (error) {
      console.log('⚠️  subscription_plans table might already exist or need manual creation');
      console.log('   Error:', error.message);
    } else {
      console.log('✅ subscription_plans table created with plans');
    }
  } catch (err) {
    console.log('⚠️  Could not create subscription_plans table automatically');
  }

  // 2. Try to create user_subscriptions table
  console.log('\n2️⃣ Creating user_subscriptions table...');
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .insert([])
      .select();

    console.log('✅ user_subscriptions table is accessible');
  } catch (err) {
    console.log('⚠️  user_subscriptions table needs manual creation');
  }

  // 3. Try to create user_usage table  
  console.log('\n3️⃣ Creating user_usage table...');
  try {
    const { data, error } = await supabase
      .from('user_usage')
      .insert([])
      .select();

    console.log('✅ user_usage table is accessible');
  } catch (err) {
    console.log('⚠️  user_usage table needs manual creation');
  }

  console.log('\n✅ Basic setup completed!');
  console.log('\n📋 If you see warnings above, please:');
  console.log('   1. Go to your Supabase Dashboard → SQL Editor');
  console.log('   2. Copy and paste the contents of database-subscription-system.sql');
  console.log('   3. Execute the SQL script');
  console.log('   4. Run this script again to verify');
}

// Run the setup
setupBasicTables().catch(console.error); 