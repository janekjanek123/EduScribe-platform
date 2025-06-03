# Transitioning to Isolated Architecture

This guide will help you migrate your application to a fully isolated architecture for the three note generation systems: Video Notes, File Notes, and Text Notes.

## What's Included

- ✅ Separate database tables for each note system
- ✅ Isolated API endpoints
- ✅ Independent frontend components
- ✅ System-specific error handling
- ✅ Elimination of shared dependencies

## Prerequisites

1. A running Supabase instance
2. Environment variables set up for Supabase in your `.env.local` file:
   - `NEXT_PUBLIC_SUPABASE_URL=your_supabase_url`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key`
   - `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key` (recommended for database operations)

## Transition Steps

### 1. Set Up Database Tables

You have two options for creating the isolated tables:

#### Option A: Direct Table Creation (Recommended)

Run the direct table creation script:

```bash
npm run create-tables-direct
```

This approach:
- Loads environment variables from your `.env.local` file
- Creates tables by inserting test records (which triggers auto-schema creation)
- Works with standard Supabase setups
- Provides clear feedback on success/failure

#### Option B: SQL Script Execution

If you prefer to use the full SQL script:

```bash
npm run setup-isolated-tables
```

This will:
- Create `video_notes` table for YouTube video notes
- Create `file_notes` table for uploaded file notes
- Create `text_notes` table for raw text notes
- Configure proper RLS policies for security

#### Option C: Manual Setup

If both scripts fail, you can manually create the tables:

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `database-setup.sql`
4. Paste and execute the SQL script

### 2. Transition to Isolated Architecture

Run the transition script to complete the migration:

```bash
npm run transition-to-isolation
```

This will:
- Remove legacy API endpoints
- Create necessary directories
- Update Next.js configuration
- Ensure proper isolation of systems

### 3. Verify the Setup

Run a health check to ensure everything is working properly:

```bash
npm run health-check
```

## Testing the Isolated Systems

Test each system independently to verify that they're working correctly:

### Video Notes
1. Go to `/generate/youtube`
2. Enter a YouTube URL
3. Verify that notes are generated and stored in the `video_notes` table

### File Notes
1. Go to `/generate/upload`
2. Upload a file (PDF, TXT, DOCX, etc.)
3. Verify that notes are generated and stored in the `file_notes` table

### Text Notes
1. Go to `/generate/text`
2. Enter some text
3. Verify that notes are generated and stored in the `text_notes` table

## Troubleshooting

### Environment Variable Issues

If you get an error about missing Supabase URL or key:

1. **Check your `.env.local` file exists** in the project root
2. **Verify the file contains** the required variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```
3. **Make sure there are no spaces** around the `=` sign
4. **Restart your terminal** after making changes to `.env.local`

### Database Issues
- Verify that your Supabase instance is running
- Check the tables in the Supabase dashboard
- Ensure RLS policies are correctly set up
- Try the manual SQL approach if scripts fail

### API Issues
- Check the server logs for errors
- Verify that the API endpoints are returning proper responses
- Test each API endpoint independently

### Frontend Issues
- Clear your browser cache
- Check for console errors
- Verify that the frontend is using the correct API endpoints

## Architecture Documentation

For a detailed explanation of the isolated architecture, see [SYSTEM-ISOLATION.md](./SYSTEM-ISOLATION.md). 