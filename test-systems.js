const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Required variables:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDatabaseConnection() {
  console.log('\n🔍 Testing Database Connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('video_notes').select('count').limit(1);
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    console.log('✅ Database connection successful');
    return true;
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    return false;
  }
}

async function testTableStructures() {
  console.log('\n🔍 Testing Table Structures...');
  
  const tables = ['video_notes', 'file_notes', 'text_notes'];
  const results = {};
  
  for (const table of tables) {
    try {
      console.log(`\n📋 Testing ${table} table...`);
      
      // Test table access
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.error(`❌ ${table}: ${error.message}`);
        results[table] = { status: 'error', error: error.message };
        continue;
      }
      
      // Test table structure by attempting to insert a test record
      const testRecord = {
        id: `test_${Date.now()}`,
        user_id: '00000000-0000-0000-0000-000000000000', // Test UUID
        created_at: new Date().toISOString()
      };
      
      // Add table-specific fields
      if (table === 'video_notes') {
        testRecord.video_url = 'https://youtube.com/watch?v=test';
        testRecord.video_id = 'test';
        testRecord.title = 'Test Video';
        testRecord.content = 'Test content';
      } else if (table === 'file_notes') {
        testRecord.file_name = 'test.txt';
        testRecord.file_type = 'text/plain';
        testRecord.content = 'Test content';
      } else if (table === 'text_notes') {
        testRecord.raw_text = 'Test text input';
        testRecord.content = 'Test content';
      }
      
      // Try to insert (this will likely fail due to RLS, but will validate structure)
      const { error: insertError } = await supabase.from(table).insert(testRecord);
      
      if (insertError && insertError.code === '42501') {
        // RLS policy error - this is expected and means table structure is correct
        console.log(`✅ ${table}: Table structure valid (RLS policies active)`);
        results[table] = { status: 'valid', note: 'RLS policies active' };
      } else if (insertError) {
        console.error(`❌ ${table}: Structure issue - ${insertError.message}`);
        results[table] = { status: 'structure_error', error: insertError.message };
      } else {
        // Unexpected success - clean up the test record
        await supabase.from(table).delete().eq('id', testRecord.id);
        console.log(`✅ ${table}: Table structure valid (no RLS restrictions)`);
        results[table] = { status: 'valid', note: 'No RLS restrictions' };
      }
      
    } catch (err) {
      console.error(`❌ ${table}: Exception - ${err.message}`);
      results[table] = { status: 'exception', error: err.message };
    }
  }
  
  return results;
}

async function testAPIEndpoints() {
  console.log('\n🔍 Testing API Endpoints...');
  
  const endpoints = [
    { name: 'video-notes', path: '/api/video-notes' },
    { name: 'file-notes', path: '/api/file-notes' },
    { name: 'text-notes', path: '/api/text-notes' }
  ];
  
  const results = {};
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🌐 Testing ${endpoint.name} endpoint...`);
      
      // Test GET request (should require auth)
      const getResponse = await fetch(`http://localhost:3000${endpoint.path}`, {
        method: 'GET'
      });
      
      if (getResponse.status === 401) {
        console.log(`✅ ${endpoint.name}: GET endpoint requires authentication (expected)`);
        results[endpoint.name] = { 
          status: 'available', 
          get: 'requires_auth',
          note: 'Endpoint is properly secured'
        };
      } else if (getResponse.status === 404) {
        console.error(`❌ ${endpoint.name}: Endpoint not found`);
        results[endpoint.name] = { status: 'not_found', get: 'missing' };
      } else {
        console.log(`⚠️ ${endpoint.name}: Unexpected response ${getResponse.status}`);
        results[endpoint.name] = { 
          status: 'unexpected', 
          get: `status_${getResponse.status}`,
          note: 'May need investigation'
        };
      }
      
    } catch (err) {
      if (err.code === 'ECONNREFUSED') {
        console.error(`❌ ${endpoint.name}: Server not running`);
        results[endpoint.name] = { status: 'server_down', error: 'Connection refused' };
      } else {
        console.error(`❌ ${endpoint.name}: ${err.message}`);
        results[endpoint.name] = { status: 'error', error: err.message };
      }
    }
  }
  
  return results;
}

async function testFrontendPages() {
  console.log('\n🔍 Testing Frontend Pages...');
  
  const pages = [
    { name: 'YouTube Notes', path: '/generate/youtube' },
    { name: 'File Notes', path: '/generate/upload' },
    { name: 'Text Notes', path: '/generate/text' }
  ];
  
  const results = {};
  
  for (const page of pages) {
    try {
      console.log(`\n📄 Testing ${page.name} page...`);
      
      const response = await fetch(`http://localhost:3000${page.path}`);
      
      if (response.status === 200) {
        const html = await response.text();
        if (html.includes('<!DOCTYPE html>') || html.includes('<html')) {
          console.log(`✅ ${page.name}: Page loads successfully`);
          results[page.name] = { status: 'available', note: 'Page renders correctly' };
        } else {
          console.log(`⚠️ ${page.name}: Page loads but may have issues`);
          results[page.name] = { status: 'partial', note: 'Response may not be HTML' };
        }
      } else if (response.status === 404) {
        console.error(`❌ ${page.name}: Page not found`);
        results[page.name] = { status: 'not_found' };
      } else {
        console.log(`⚠️ ${page.name}: Unexpected response ${response.status}`);
        results[page.name] = { status: 'unexpected', code: response.status };
      }
      
    } catch (err) {
      if (err.code === 'ECONNREFUSED') {
        console.error(`❌ ${page.name}: Server not running`);
        results[page.name] = { status: 'server_down', error: 'Connection refused' };
      } else {
        console.error(`❌ ${page.name}: ${err.message}`);
        results[page.name] = { status: 'error', error: err.message };
      }
    }
  }
  
  return results;
}

async function generateDiagnosisReport(dbResults, tableResults, apiResults, frontendResults) {
  console.log('\n\n📊 COMPREHENSIVE DIAGNOSIS REPORT');
  console.log('=====================================');
  
  // Overall system status
  const dbOk = dbResults;
  const tablesOk = Object.values(tableResults).every(r => r.status === 'valid');
  const apisOk = Object.values(apiResults).every(r => r.status === 'available');
  const frontendOk = Object.values(frontendResults).every(r => r.status === 'available');
  
  console.log('\n🎯 SYSTEM STATUS OVERVIEW:');
  console.log(`   Database Connection: ${dbOk ? '✅ OK' : '❌ FAILED'}`);
  console.log(`   Table Structures: ${tablesOk ? '✅ OK' : '❌ ISSUES'}`);
  console.log(`   API Endpoints: ${apisOk ? '✅ OK' : '❌ ISSUES'}`);
  console.log(`   Frontend Pages: ${frontendOk ? '✅ OK' : '❌ ISSUES'}`);
  
  // Detailed breakdown
  console.log('\n📋 DETAILED BREAKDOWN:');
  
  console.log('\n🗄️ Database Tables:');
  Object.entries(tableResults).forEach(([table, result]) => {
    const status = result.status === 'valid' ? '✅' : '❌';
    console.log(`   ${status} ${table}: ${result.note || result.error || result.status}`);
  });
  
  console.log('\n🌐 API Endpoints:');
  Object.entries(apiResults).forEach(([api, result]) => {
    const status = result.status === 'available' ? '✅' : '❌';
    console.log(`   ${status} ${api}: ${result.note || result.error || result.status}`);
  });
  
  console.log('\n📄 Frontend Pages:');
  Object.entries(frontendResults).forEach(([page, result]) => {
    const status = result.status === 'available' ? '✅' : '❌';
    console.log(`   ${status} ${page}: ${result.note || result.error || result.status}`);
  });
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  
  if (!dbOk) {
    console.log('   🔧 Fix database connection issues first');
    console.log('   🔧 Check Supabase credentials in .env.local');
  }
  
  if (!tablesOk) {
    console.log('   🔧 Run: npm run setup-isolated-tables');
    console.log('   🔧 Check database schema and RLS policies');
  }
  
  if (!apisOk) {
    console.log('   🔧 Ensure development server is running: npm run dev');
    console.log('   🔧 Check API route implementations');
  }
  
  if (!frontendOk) {
    console.log('   🔧 Check frontend page implementations');
    console.log('   🔧 Verify Next.js routing configuration');
  }
  
  // Overall assessment
  const overallHealth = dbOk && tablesOk && apisOk && frontendOk;
  console.log('\n🎉 OVERALL ASSESSMENT:');
  if (overallHealth) {
    console.log('   ✅ ALL SYSTEMS OPERATIONAL');
    console.log('   🚀 Ready for testing and production use');
  } else {
    console.log('   ⚠️ SOME ISSUES DETECTED');
    console.log('   🔧 Follow recommendations above to resolve');
  }
  
  console.log('\n=====================================');
}

async function runDiagnosis() {
  console.log('🏥 EDUSCRIBE SYSTEM DIAGNOSIS');
  console.log('============================');
  console.log('Testing all three isolated note generation systems...\n');
  
  try {
    // Test database connection
    const dbResults = await testDatabaseConnection();
    
    // Test table structures
    const tableResults = await testTableStructures();
    
    // Test API endpoints
    const apiResults = await testAPIEndpoints();
    
    // Test frontend pages
    const frontendResults = await testFrontendPages();
    
    // Generate comprehensive report
    await generateDiagnosisReport(dbResults, tableResults, apiResults, frontendResults);
    
  } catch (error) {
    console.error('\n❌ DIAGNOSIS FAILED:', error.message);
    console.log('\n🔧 Please check your environment setup and try again.');
  }
}

// Run the diagnosis
runDiagnosis().catch(console.error); 