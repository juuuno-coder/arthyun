
"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
           try {
             cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
           } catch { }
        },
      },
    }
  );
}

// NOTE: This tries to fetch table counts and a few rows as JSON.
// It is NOT a full DDL dump because we don't have direct CLI access.
// We'll treat this as a "Data Snapshot" which is safer than nothing.
export async function backupDatabase() {
  const supabase = await getSupabase();
  
  // List of tables we care about
  const tables = ['portfolios', 'media_releases', 'inquiries', 'site_settings', 'users'];
  
  const backupData: Record<string, any> = {};
  const logs: string[] = [];

  logs.push("Starting backup snapshot...");
  
  for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*');
      if (error) {
          logs.push(`Error backing up ${table}: ${error.message}`);
          // If table doesn't exist, ignore
      } else {
          backupData[table] = data;
          logs.push(`Backed up ${table}: ${data.length} rows`);
      }
  }
  
  // We can't write to local file system from Server Action easily if we want to give it to the user.
  // Instead, we will return it to the client to trigger a download.
  
  return { 
      success: true, 
      data: JSON.stringify(backupData, null, 2), 
      logs 
  };
}
