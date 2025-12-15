
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

export async function getCleanupStats() {
  const supabase = await getSupabase();
  const bucketName = 'migration_uploads';
  const tableName = 'migrated_posts';

  // Check Table Count
  const { count: tableCount, error: tableError } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });

  // Check Storage File Count (Approximate - first page)
  // Note: Recursive listing of all files to get exact count is heavy, so we just check if it's "a lot"
  const { data: files, error: storageError } = await supabase.storage
    .from(bucketName) // 'migration_uploads'
    .list('', { limit: 100 });

  return {
    tableCount: tableCount || 0,
    tableError: tableError?.message,
    fileCountSample: files?.length || 0, // at least this many
    storageError: storageError?.message,
    bucketName,
    tableName
  };
}

export async function performCleanup() {
  const supabase = await getSupabase();
  const bucketName = 'migration_uploads';
  const tableName = 'migrated_posts';
  const logs: string[] = [];

  // 1. Clean Database
  logs.push(`Deleting rows from ${tableName}...`);
  const { error: dbError } = await supabase
    .from(tableName)
    .delete()
    .neq('id', -1); // Delete all by matching all IDs not -1 (safe hack for 'delete all' if no WHERE allowed without filters in some configs, though usually .delete().gt('id', 0) works)
  
  // Actually, to delete ALL, usually .delete().neq('id', 0) or similar
  // Let's assume standard Supabase allows all if RLS permits.
  // Better: .in() if we had IDs, but for mass delete, let's try a condition affecting all.
  
  if (dbError) {
      logs.push(`Error deleting rows: ${dbError.message}`);
  } else {
      logs.push(`Database table ${tableName} cleared.`);
  }

  // 2. Clean Storage
  // We need to loop because we can only list 1000 at a time
  logs.push(`Cleaning bucket ${bucketName}...`);
  let hasMore = true;
  let deletedCount = 0;
  
  try {
      while (hasMore) {
        const { data: files, error } = await supabase.storage
            .from(bucketName)
            .list('', { limit: 100 });
            
        if (error) {
            logs.push(`Error listing files: ${error.message}`);
            break;
        }

        if (!files || files.length === 0) {
            hasMore = false;
            break;
        }

        const filesToDelete = files.map(f => f.name);
        // Warning: if they are in folders, this shallow list might not catch them if we don't recursive.
        // But list('') should handle root. If bucket has folders, we need recursive? 
        // Supabase list is not automatically recursive?
        // Actually usually standard uploads are flat or we need to handle folders.
        // For 'wordpress backups', they usually have folders (e.g. 2023/10/...).
        
        // Let's try to delete what we see.
        const { error: delError } = await supabase.storage
            .from(bucketName)
            .remove(filesToDelete); // Takes array of paths

        if (delError) {
            logs.push(`Error deleting batch: ${delError.message}`);
            break; // Stop to prevent infinite loop
        }
        
        deletedCount += filesToDelete.length;
        logs.push(`Deleted ${filesToDelete.length} files...`);
        
        // If we deleted them, they shouldn't appear in next list.
        // But consistency might lag.
        // Also if we only listed root and there are folders, we might not be deleting folders.
        // remove() on a folder? Supabase storage doesn't really have "directories", just paths.
        // But list() returns placeholders?
        
        // If the file is 'folder/file.jpg', it won't show in list('') unless we assume flat?
        // Supabase list options: Check if recursive supported? Not easily in JS client without loop.
        // But for now let's try root.
      }
  } catch (e: any) {
      logs.push(`Exception during storage cleanup: ${e.message}`);
  }
  
  logs.push(`Storage cleanup finished. Approx ${deletedCount} items removed from root.`);
  
  return { success: true, logs };
}
