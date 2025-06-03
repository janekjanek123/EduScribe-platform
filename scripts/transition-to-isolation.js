// Transition to Isolated Architecture Script
// This script helps migrate the application to use isolated systems for video, file, and text notes

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Environment check:');
console.log('Supabase URL:', supabaseUrl ? '✅ Found' : '❌ Missing');
console.log('Supabase Key:', supabaseKey ? '✅ Found' : '❌ Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Supabase URL or key is missing. Please check your .env.local file contains:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key');
  console.error('   NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (optional)');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Files to be removed (legacy/duplicate endpoints)
const filesToRemove = [
  'src/app/api/youtube-notes/route.ts',
  'src/app/api/youtube-proxy/route.ts',
  'src/app/api/process-youtube/route.ts',
  'pages/api/youtube-notes.ts',
  'pages/api/youtube-proxy.ts',
  'pages/api/process-youtube.ts',
  'pages/api/generate.ts',
];

async function main() {
  try {
    console.log('\n🔄 Starting transition to isolated architecture...');

    // Step 1: Apply database schema
    console.log('\n📊 Setting up isolated database tables...');
    const sqlFilePath = path.join(process.cwd(), 'database-setup.sql');
    
    if (fs.existsSync(sqlFilePath)) {
      const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
      console.log('✅ Found database-setup.sql');
      
      try {
        console.log('🔄 Executing SQL setup script in Supabase...');
        
        // Execute the SQL script using Supabase's API
        const { error } = await supabase.rpc('exec_sql', { sql_string: sqlContent });
        
        if (error) {
          console.error('❌ Error executing SQL script:', error.message);
          console.log('⚠️ You may need to run the SQL script manually in the Supabase dashboard');
        } else {
          console.log('✅ Database tables created successfully');
        }
      } catch (e) {
        console.error('❌ Failed to execute SQL script:', e.message);
        console.log('⚠️ Please run the database-setup.sql script manually in the Supabase dashboard');
      }
    } else {
      console.error('❌ database-setup.sql not found. Make sure it exists in the project root.');
    }

    // Step 2: Remove legacy files
    console.log('\n🗑️ Removing legacy/duplicate API files...');
    
    for (const file of filesToRemove) {
      const filePath = path.join(process.cwd(), file);
      
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`✅ Removed: ${file}`);
        } catch (e) {
          console.error(`❌ Failed to remove ${file}:`, e.message);
        }
      } else {
        console.log(`⚠️ File not found, skipping: ${file}`);
      }
    }

    // Step 3: Create pages directory if it doesn't exist to prevent errors
    const pagesDir = path.join(process.cwd(), 'pages');
    const pagesApiDir = path.join(pagesDir, 'api');
    
    if (!fs.existsSync(pagesDir)) {
      console.log('\n📁 Creating pages directory to prevent Next.js errors...');
      fs.mkdirSync(pagesDir);
      fs.mkdirSync(pagesApiDir);
      
      // Create a dummy file to indicate this is a legacy directory
      fs.writeFileSync(
        path.join(pagesApiDir, 'README.md'),
        '# Legacy API Directory\n\nThis directory exists to prevent Next.js from throwing errors about missing pages directory.\nAll API routes have been moved to the app directory using the App Router.'
      );
      
      console.log('✅ Created pages directory with README');
    }

    // Step 4: Update next.config.js to remove appDir experimental flag
    console.log('\n📝 Updating next.config.js...');
    const nextConfigPath = path.join(process.cwd(), 'next.config.js');
    
    if (fs.existsSync(nextConfigPath)) {
      let configContent = fs.readFileSync(nextConfigPath, 'utf8');
      
      // Remove appDir experimental flag if present
      if (configContent.includes('appDir')) {
        configContent = configContent.replace(/experimental\s*:\s*{\s*appDir\s*:\s*true\s*,?/g, 'experimental: {');
        configContent = configContent.replace(/,\s*}\s*,/g, '}');
        
        fs.writeFileSync(nextConfigPath, configContent);
        console.log('✅ Removed appDir flag from next.config.js (no longer needed in Next.js 13+)');
      } else {
        console.log('✅ next.config.js already updated');
      }
    }

    console.log('\n✅ Transition complete! Your application now uses isolated systems for video, file, and text notes.');
    console.log('\n🚀 Next steps:');
    console.log('1. Run "npm run dev" to start the development server');
    console.log('2. Test each system independently to ensure they work correctly');
    console.log('3. Check for any remaining references to the old APIs in your frontend code');
  } catch (error) {
    console.error('❌ Transition failed:', error);
    process.exit(1);
  }
}

main(); 