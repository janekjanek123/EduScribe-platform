(()=>{var e={};e.id=6102,e.ids=[6102],e.modules={20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},78893:e=>{"use strict";e.exports=require("buffer")},84770:e=>{"use strict";e.exports=require("crypto")},17702:e=>{"use strict";e.exports=require("events")},32615:e=>{"use strict";e.exports=require("http")},35240:e=>{"use strict";e.exports=require("https")},98216:e=>{"use strict";e.exports=require("net")},68621:e=>{"use strict";e.exports=require("punycode")},76162:e=>{"use strict";e.exports=require("stream")},82452:e=>{"use strict";e.exports=require("tls")},17360:e=>{"use strict";e.exports=require("url")},71568:e=>{"use strict";e.exports=require("zlib")},58359:()=>{},93739:()=>{},11427:(e,r,t)=>{"use strict";t.r(r),t.d(r,{originalPathname:()=>p,patchFetch:()=>_,requestAsyncStorage:()=>T,routeModule:()=>c,serverHooks:()=>d,staticGenerationAsyncStorage:()=>I});var s={};t.r(s),t.d(s,{POST:()=>E,dynamic:()=>u});var i=t(49303),o=t(88716),a=t(60670),n=t(87070),l=t(23517);async function E(e){console.log("[Init DB API] Initializing database schema...");try{let r=!1;{let t=e.headers.get("authorization");if(!t||!t.startsWith("Bearer "))return console.error("[Init DB API] Authentication missing"),n.NextResponse.json({success:!1,error:"Authentication required",message:"Valid Bearer token is required"},{status:401});r=!0}if(!r)return n.NextResponse.json({success:!1,error:"Authentication required",message:"Valid Bearer token is required"},{status:401});let t="https://xhljckmlzdshxibnqsbj.supabase.co",s="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhobGpja21semRzaHhpYm5xc2JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NDIwNzIsImV4cCI6MjA2MzQxODA3Mn0.UuU3QBxwY3-DsSpXB-UiKarjgZWiFAFIzFbgUqacmIA";if(!t||!s)return console.error("[Init DB API] Missing Supabase environment variables"),n.NextResponse.json({success:!1,error:"Configuration error",message:"Supabase URL or key not configured"},{status:500});let i=(0,l.eI)(t,s);console.log("[Init DB API] Creating video_notes table...");let{error:o}=await i.rpc("create_video_notes_table");if(o&&!o.message.includes("already exists"))return console.error("[Init DB API] Error creating video_notes table:",o),n.NextResponse.json({success:!1,error:"Database error",message:`Failed to create video_notes table: ${o.message}`},{status:500});console.log("[Init DB API] Creating file_notes table...");let{error:a}=await i.rpc("create_file_notes_table");if(a&&!a.message.includes("already exists"))return console.error("[Init DB API] Error creating file_notes table:",a),n.NextResponse.json({success:!1,error:"Database error",message:`Failed to create file_notes table: ${a.message}`},{status:500});console.log("[Init DB API] Creating text_notes table...");let{error:E}=await i.rpc("create_text_notes_table");if(E&&!E.message.includes("already exists"))return console.error("[Init DB API] Error creating text_notes table:",E),n.NextResponse.json({success:!1,error:"Database error",message:`Failed to create text_notes table: ${E.message}`},{status:500});console.log("[Init DB API] Creating user_profiles table...");let{error:u}=await i.rpc("create_user_profiles_table");if(u&&!u.message.includes("already exists"))return console.error("[Init DB API] Error creating user_profiles table:",u),n.NextResponse.json({success:!1,error:"Database error",message:`Failed to create user_profiles table: ${u.message}`},{status:500});console.log("[Init DB API] Setting up database stored procedures...");let c=`
      -- Function to create video_notes table if it doesn't exist
      CREATE OR REPLACE FUNCTION create_video_notes_table()
      RETURNS void AS $$
      BEGIN
        CREATE TABLE IF NOT EXISTS public.video_notes (
          id TEXT PRIMARY KEY,
          user_id UUID NOT NULL,
          video_url TEXT NOT NULL,
          video_id TEXT,
          title TEXT,
          thumbnail_url TEXT,
          content TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      END;
      $$ LANGUAGE plpgsql;

      -- Function to create file_notes table if it doesn't exist
      CREATE OR REPLACE FUNCTION create_file_notes_table()
      RETURNS void AS $$
      BEGIN
        CREATE TABLE IF NOT EXISTS public.file_notes (
          id TEXT PRIMARY KEY,
          user_id UUID NOT NULL,
          file_name TEXT,
          file_url TEXT,
          file_type TEXT,
          content TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      END;
      $$ LANGUAGE plpgsql;

      -- Function to create text_notes table if it doesn't exist
      CREATE OR REPLACE FUNCTION create_text_notes_table()
      RETURNS void AS $$
      BEGIN
        CREATE TABLE IF NOT EXISTS public.text_notes (
          id TEXT PRIMARY KEY,
          user_id UUID NOT NULL,
          raw_text TEXT,
          content TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      END;
      $$ LANGUAGE plpgsql;

      -- Function to create user_profiles table if it doesn't exist
      CREATE OR REPLACE FUNCTION create_user_profiles_table()
      RETURNS void AS $$
      BEGIN
        CREATE TABLE IF NOT EXISTS public.user_profiles (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
          email TEXT,
          user_type TEXT,
          interests TEXT[],
          onboarding_completed BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        
        -- Enable Row Level Security
        ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies
        CREATE POLICY IF NOT EXISTS "Users can view their own profile" 
          ON public.user_profiles 
          FOR SELECT 
          USING (auth.uid() = user_id);
          
        CREATE POLICY IF NOT EXISTS "Users can create their own profile" 
          ON public.user_profiles 
          FOR INSERT 
          WITH CHECK (auth.uid() = user_id);
          
        CREATE POLICY IF NOT EXISTS "Users can update their own profile" 
          ON public.user_profiles 
          FOR UPDATE 
          USING (auth.uid() = user_id);
          
        CREATE POLICY IF NOT EXISTS "Users can delete their own profile" 
          ON public.user_profiles 
          FOR DELETE 
          USING (auth.uid() = user_id);
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON public.user_profiles(user_type);
      END;
      $$ LANGUAGE plpgsql;
    `,{error:T}=await i.rpc("exec_sql",{sql:c});if(T){console.log("[Init DB API] exec_sql function not available, creating tables directly...");let e=`
        CREATE TABLE IF NOT EXISTS public.video_notes (
          id TEXT PRIMARY KEY,
          user_id UUID NOT NULL,
          video_url TEXT NOT NULL,
          video_id TEXT,
          title TEXT,
          thumbnail_url TEXT,
          content TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `,{error:r}=await i.from("video_notes").select("count").limit(1);if(r&&"42P01"===r.code){let{error:r}=await i.rpc("exec_sql",{sql:e});r&&console.error("[Init DB API] Error creating video_notes table directly:",r)}let t=`
        CREATE TABLE IF NOT EXISTS public.file_notes (
          id TEXT PRIMARY KEY,
          user_id UUID NOT NULL,
          file_name TEXT,
          file_url TEXT,
          file_type TEXT,
          content TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `,{error:s}=await i.from("file_notes").select("count").limit(1);if(s&&"42P01"===s.code){let{error:e}=await i.rpc("exec_sql",{sql:t});e&&console.error("[Init DB API] Error creating file_notes table directly:",e)}let o=`
        CREATE TABLE IF NOT EXISTS public.text_notes (
          id TEXT PRIMARY KEY,
          user_id UUID NOT NULL,
          raw_text TEXT,
          content TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `,{error:a}=await i.from("text_notes").select("count").limit(1);if(a&&"42P01"===a.code){let{error:e}=await i.rpc("exec_sql",{sql:o});e&&console.error("[Init DB API] Error creating text_notes table directly:",e)}let n=`
        CREATE TABLE IF NOT EXISTS public.user_profiles (
          id SERIAL PRIMARY KEY,
          user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
          email TEXT,
          user_type TEXT,
          interests TEXT[],
          onboarding_completed BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        
        ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY IF NOT EXISTS "Users can view their own profile" 
          ON public.user_profiles 
          FOR SELECT 
          USING (auth.uid() = user_id);
          
        CREATE POLICY IF NOT EXISTS "Users can create their own profile" 
          ON public.user_profiles 
          FOR INSERT 
          WITH CHECK (auth.uid() = user_id);
          
        CREATE POLICY IF NOT EXISTS "Users can update their own profile" 
          ON public.user_profiles 
          FOR UPDATE 
          USING (auth.uid() = user_id);
          
        CREATE POLICY IF NOT EXISTS "Users can delete their own profile" 
          ON public.user_profiles 
          FOR DELETE 
          USING (auth.uid() = user_id);
        
        CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON public.user_profiles(user_type);
      `,{error:l}=await i.from("user_profiles").select("count").limit(1);if(l&&"42P01"===l.code){let{error:e}=await i.rpc("exec_sql",{sql:n});e&&console.error("[Init DB API] Error creating user_profiles table directly:",e)}}return n.NextResponse.json({success:!0,message:"Database schema initialized successfully",tables:["video_notes","file_notes","text_notes","user_profiles"]})}catch(e){return console.error("[Init DB API] Unexpected error:",e),n.NextResponse.json({success:!1,error:"Server error",message:e.message||"An unexpected error occurred initializing the database"},{status:500})}}let u="force-dynamic",c=new i.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/init-db/route",pathname:"/api/init-db",filename:"route",bundlePath:"app/api/init-db/route"},resolvedPagePath:"/Users/janjedrach/Cursor/eduscribe/src/app/api/init-db/route.ts",nextConfigOutput:"standalone",userland:s}),{requestAsyncStorage:T,staticGenerationAsyncStorage:I,serverHooks:d}=c,p="/api/init-db/route";function _(){return(0,a.patchFetch)({serverHooks:d,staticGenerationAsyncStorage:I})}}};var r=require("../../../webpack-runtime.js");r.C(e);var t=e=>r(r.s=e),s=r.X(0,[9276,5972,3517],()=>t(11427));module.exports=s})();