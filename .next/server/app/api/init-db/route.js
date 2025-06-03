(()=>{var e={};e.id=6102,e.ids=[6102],e.modules={20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},78893:e=>{"use strict";e.exports=require("buffer")},84770:e=>{"use strict";e.exports=require("crypto")},17702:e=>{"use strict";e.exports=require("events")},32615:e=>{"use strict";e.exports=require("http")},35240:e=>{"use strict";e.exports=require("https")},98216:e=>{"use strict";e.exports=require("net")},68621:e=>{"use strict";e.exports=require("punycode")},76162:e=>{"use strict";e.exports=require("stream")},82452:e=>{"use strict";e.exports=require("tls")},17360:e=>{"use strict";e.exports=require("url")},71568:e=>{"use strict";e.exports=require("zlib")},58359:()=>{},93739:()=>{},11427:(e,t,r)=>{"use strict";r.r(t),r.d(t,{originalPathname:()=>I,patchFetch:()=>_,requestAsyncStorage:()=>d,routeModule:()=>T,serverHooks:()=>p,staticGenerationAsyncStorage:()=>E});var s={};r.r(s),r.d(s,{POST:()=>l,dynamic:()=>u});var i=r(49303),o=r(88716),a=r(60670),n=r(87070),c=r(23517);async function l(e){console.log("[Init DB API] Initializing database schema...");try{let t=!1;{let r=e.headers.get("authorization");if(!r||!r.startsWith("Bearer "))return console.error("[Init DB API] Authentication missing"),n.NextResponse.json({success:!1,error:"Authentication required",message:"Valid Bearer token is required"},{status:401});t=!0}if(!t)return n.NextResponse.json({success:!1,error:"Authentication required",message:"Valid Bearer token is required"},{status:401});let r="https://xhljckmlzdshxibnqsbj.supabase.co",s="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhobGpja21semRzaHhpYm5xc2JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NDIwNzIsImV4cCI6MjA2MzQxODA3Mn0.UuU3QBxwY3-DsSpXB-UiKarjgZWiFAFIzFbgUqacmIA";if(!r||!s)return console.error("[Init DB API] Missing Supabase environment variables"),n.NextResponse.json({success:!1,error:"Configuration error",message:"Supabase URL or key not configured"},{status:500});let i=(0,c.eI)(r,s);console.log("[Init DB API] Creating video_notes table...");let{error:o}=await i.rpc("create_video_notes_table");if(o&&!o.message.includes("already exists"))return console.error("[Init DB API] Error creating video_notes table:",o),n.NextResponse.json({success:!1,error:"Database error",message:`Failed to create video_notes table: ${o.message}`},{status:500});console.log("[Init DB API] Creating file_notes table...");let{error:a}=await i.rpc("create_file_notes_table");if(a&&!a.message.includes("already exists"))return console.error("[Init DB API] Error creating file_notes table:",a),n.NextResponse.json({success:!1,error:"Database error",message:`Failed to create file_notes table: ${a.message}`},{status:500});console.log("[Init DB API] Creating text_notes table...");let{error:l}=await i.rpc("create_text_notes_table");if(l&&!l.message.includes("already exists"))return console.error("[Init DB API] Error creating text_notes table:",l),n.NextResponse.json({success:!1,error:"Database error",message:`Failed to create text_notes table: ${l.message}`},{status:500});console.log("[Init DB API] Setting up database stored procedures...");let u=`
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
    `,{error:T}=await i.rpc("exec_sql",{sql:u});if(T){console.log("[Init DB API] exec_sql function not available, creating tables directly...");let e=`
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
      `,{error:t}=await i.from("video_notes").select("count").limit(1);if(t&&"42P01"===t.code){let{error:t}=await i.rpc("exec_sql",{sql:e});t&&console.error("[Init DB API] Error creating video_notes table directly:",t)}let r=`
        CREATE TABLE IF NOT EXISTS public.file_notes (
          id TEXT PRIMARY KEY,
          user_id UUID NOT NULL,
          file_name TEXT,
          file_url TEXT,
          file_type TEXT,
          content TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `,{error:s}=await i.from("file_notes").select("count").limit(1);if(s&&"42P01"===s.code){let{error:e}=await i.rpc("exec_sql",{sql:r});e&&console.error("[Init DB API] Error creating file_notes table directly:",e)}let o=`
        CREATE TABLE IF NOT EXISTS public.text_notes (
          id TEXT PRIMARY KEY,
          user_id UUID NOT NULL,
          raw_text TEXT,
          content TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `,{error:a}=await i.from("text_notes").select("count").limit(1);if(a&&"42P01"===a.code){let{error:e}=await i.rpc("exec_sql",{sql:o});e&&console.error("[Init DB API] Error creating text_notes table directly:",e)}}return n.NextResponse.json({success:!0,message:"Database schema initialized successfully",tables:["video_notes","file_notes","text_notes"]})}catch(e){return console.error("[Init DB API] Unexpected error:",e),n.NextResponse.json({success:!1,error:"Server error",message:e.message||"An unexpected error occurred initializing the database"},{status:500})}}let u="force-dynamic",T=new i.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/init-db/route",pathname:"/api/init-db",filename:"route",bundlePath:"app/api/init-db/route"},resolvedPagePath:"/Users/janjedrach/Cursor/eduscribe/src/app/api/init-db/route.ts",nextConfigOutput:"standalone",userland:s}),{requestAsyncStorage:d,staticGenerationAsyncStorage:E,serverHooks:p}=T,I="/api/init-db/route";function _(){return(0,a.patchFetch)({serverHooks:p,staticGenerationAsyncStorage:E})}}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[9276,5972,3517],()=>r(11427));module.exports=s})();