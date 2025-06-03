# Supabase Schema Fix

This document explains the issues with the Supabase schema and how they were fixed.

## The Problem

The application was encountering errors when trying to store notes in the `youtube_notes` table, with the following error:

```
[YouTube API] Database storage error: {
  code: 'PGRST204',
  details: null,
  hint: null,
  message: "Could not find the 'createdAt' column of 'youtube_notes' in the schema cache"
}
```

### Root Causes

1. **Case sensitivity mismatch:** The code was trying to insert data using lowercase field names (`createdat`), but the expected schema was using camelCase with quotes (`"createdAt"`).

2. **Schema cache issues:** The schema cache in Supabase was not recognizing the correct column names.

3. **Inconsistent column names:** The table had a mix of camelCase and lowercase column names, leading to confusion.

## The Solution

We implemented several fixes:

1. **Schema Fix Script:** Created a SQL script (`fix-youtube-notes-schema.sql`) to:
   - Back up the existing table data
   - Drop the problematic table
   - Recreate the table with consistent camelCase column names
   - Restore the data (if needed)

2. **Code Updates:** Modified the API endpoints to use the correct camelCase column names when inserting data:
   - Updated `src/app/api/youtube-notes/route.ts`
   - Updated `src/app/api/process-youtube/route.ts`

3. **Added Diagnostic Tools:**
   - `check-schema.js` - Script to inspect the current schema and identify issues
   - `refresh-schema-cache.js` - Script to force a refresh of the Supabase schema cache

4. **Added NPM Scripts:**
   - `npm run check-schema` - Run the schema diagnostic tool
   - `npm run refresh-schema` - Force refresh the schema cache
   - `npm run fix-schema` - Apply the SQL fix using the Supabase CLI

## Applying the Fix

To fix the schema issues:

1. Run `npm run check-schema` to diagnose the current issues
2. Run `npm run fix-schema` to apply the SQL fixes (requires Supabase CLI)
3. Run `npm run refresh-schema` to refresh the schema cache

## Future Prevention

To prevent similar issues in the future:

1. **Consistent Naming:** Always use quotes and camelCase for column names in PostgreSQL
2. **Schema Validation:** Add validation to ensure data matches the expected schema
3. **Better Error Handling:** Improved the error reporting to provide more context
4. **Database Initialization:** Use the table creation functions consistently at app startup

## Technical Details

The main issues were caused by PostgreSQL's handling of column names. In PostgreSQL:

- Unquoted column names are automatically converted to lowercase
- Quoted column names preserve their case
- This creates confusion when code uses lowercase names but the schema expects camelCase

By standardizing on camelCase with quotes in the schema and using consistent casing in the code, we've resolved these issues. 