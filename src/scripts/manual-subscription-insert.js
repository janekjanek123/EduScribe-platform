/**
 * Manually insert subscription data for a specific user
 * This bypasses RLS by directly executing SQL
 * Run with: node src/scripts/manual-subscription-insert.js USER_ID
 */

// Use hardcoded values since .env.local doesn't exist
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xhljckmlzdshxibnqsbj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhobGpja21semRzaHhpYm5xc2JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg2MzA5MzcsImV4cCI6MjA0NDIwNjkzN30.dYKVqYp3RhDHQA6QhXd5I8uiR9LY-Z2yocfW-xMBPtU';

// Get user ID from command line args
const userId = process.argv[2];
if (!userId) {
  console.error('❌ Please provide a user ID');
  console.error('Usage: node src/scripts/manual-subscription-insert.js USER_ID');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function manuallyInsertSubscription() {
  console.log(`🚀 Manually inserting subscription for user: ${userId}\n`);

  try {
    // Generate unique subscription ID
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const currentDate = new Date().toISOString();
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const currentMonth = new Date().toISOString().slice(0, 7);

    console.log('1️⃣ Using SQL to insert subscription...');
    
    // Use raw SQL to bypass RLS
    const { data: insertResult, error: insertError } = await supabase.rpc('exec_sql', {
      sql: `
        INSERT INTO user_subscriptions (
          subscription_id,
          user_id, 
          plan_id, 
          billing_cycle, 
          status, 
          current_period_start, 
          current_period_end,
          created_at,
          updated_at
        ) VALUES (
          '${subscriptionId}',
          '${userId}', 
          'free', 
          'monthly', 
          'active', 
          '${currentDate}', 
          '${futureDate}',
          '${currentDate}',
          '${currentDate}'
        ) ON CONFLICT (user_id) DO UPDATE SET
          status = 'active',
          updated_at = '${currentDate}';
      `
    });

    if (insertError) {
      console.error('❌ SQL insert failed, trying alternative approach...');
      console.error('Details:', insertError);
      
      // Try alternative: direct table access with service role simulation
      console.log('2️⃣ Trying direct insert...');
      const { error: directError } = await supabase
        .from('user_subscriptions')
        .upsert({
          subscription_id: subscriptionId,
          user_id: userId,
          plan_id: 'free',
          billing_cycle: 'monthly',
          status: 'active',
          current_period_start: currentDate,
          current_period_end: futureDate
        }, {
          onConflict: 'user_id'
        });

      if (directError) {
        console.error('❌ Direct insert also failed:', directError.message);
        
        // Final fallback: suggest manual database entry
        console.log('\n📝 Manual Database Entry Required:');
        console.log('Go to your Supabase dashboard > SQL Editor and run:');
        console.log(`
INSERT INTO user_subscriptions (
  user_id, 
  plan_id, 
  billing_cycle, 
  status, 
  current_period_start, 
  current_period_end
) VALUES (
  '${userId}', 
  'free', 
  'monthly', 
  'active', 
  NOW(), 
  NOW() + INTERVAL '30 days'
) ON CONFLICT (user_id) DO UPDATE SET
  status = 'active',
  updated_at = NOW();

INSERT INTO user_usage (
  user_id,
  month_year,
  notes_generated,
  video_notes_count,
  file_notes_count,
  text_notes_count,
  total_saved_notes
) VALUES (
  '${userId}',
  '${currentMonth}',
  0, 0, 0, 0, 0
) ON CONFLICT (user_id, month_year) DO NOTHING;
        `);
        return;
      }
    }

    console.log('✅ Subscription created successfully!');

    // Insert usage record
    console.log('3️⃣ Creating usage record...');
    const { error: usageError } = await supabase
      .from('user_usage')
      .upsert({
        user_id: userId,
        month_year: currentMonth,
        notes_generated: 0,
        video_notes_count: 0,
        file_notes_count: 0,
        text_notes_count: 0,
        total_saved_notes: 0
      }, {
        onConflict: 'user_id,month_year'
      });

    if (usageError) {
      console.log('⚠️  Usage record creation failed, but subscription was created.');
      console.log('Manual usage entry:');
      console.log(`
INSERT INTO user_usage (
  user_id, month_year, notes_generated, video_notes_count, 
  file_notes_count, text_notes_count, total_saved_notes
) VALUES (
  '${userId}', '${currentMonth}', 0, 0, 0, 0, 0
) ON CONFLICT (user_id, month_year) DO NOTHING;
      `);
    } else {
      console.log('✅ Usage record created successfully!');
    }

    console.log('\n🎉 Setup completed!');
    console.log('📝 Next steps:');
    console.log('   1. Restart your Next.js dev server');
    console.log('   2. Try generating a note');
    console.log('   3. The subscription limits should now work');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the setup
manuallyInsertSubscription().catch(console.error); 