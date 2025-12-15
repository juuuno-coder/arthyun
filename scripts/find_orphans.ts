
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Must use Service Role Key to delete files

// Migrated to Firebase. This script is likely deprecated or should be disabled to prevent build errors.
// But valid syntax is required for build.
if (!SUPABASE_URL || !SUPABASE_KEY) {
    // console.error("❌ Error: Missing Supabase credentials. Make sure SUPABASE_SERVICE_ROLE_KEY is set in .env.local");
    // process.exit(1);
    // Don't exit during build scan
}

const supabase = createClient(SUPABASE_URL || "", SUPABASE_KEY || "");

async function findOrphanedFiles() {
    if (!SUPABASE_URL) return;

    console.log("🔍 Analyzing storage for orphaned files...");

    // 1. Get List of all used images from DB
    const usedImages = new Set<string>();

    // Portfolio
    const { data: portfolios } = await supabase.from("portfolios").select("poster_url, description");
    portfolios?.forEach(p => {
        if (p.poster_url) usedImages.add(p.poster_url);
        // Extract images from description HTML if needed
         const matches = p.description?.match(/src="([^"]+)"/g);
         matches?.forEach((m: string) => { // Fixed: Type annotation
             const url = m.match(/src="([^"]+)"/)?.[1];
             if (url) usedImages.add(url);
         });
    });

    // Media
    const { data: media } = await supabase.from("media_releases").select("image_url, content");
    media?.forEach(m => {
        if (m.image_url) usedImages.add(m.image_url);
        const matches = m.content?.match(/src="([^"]+)"/g);
         matches?.forEach((m: string) => { // Fixed: Type annotation
             const url = m.match(/src="([^"]+)"/)?.[1];
             if (url) usedImages.add(url);
         });
    });

    // Site Settings (Logos etc)
    const { data: settings } = await supabase.from("site_settings").select("*");
    settings?.forEach(s => {
        Object.values(s.value || {}).forEach((v: any) => {
             if (typeof v === 'string' && v.startsWith('http')) usedImages.add(v);
        });
    });

    console.log(`✅ Found ${usedImages.size} images currently referenced in Database.`);

    // 2. Scan Buckets
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets) {
        console.log("❌ No buckets found or permission denied.");
        return;
    }

    let totalOrphans = 0;
    let totalSize = 0;

    for (const bucket of buckets) {
        if (bucket.id === 'backup') continue; // Skip backup folder if exists

        console.log(`\n📂 Scanning Bucket: [${bucket.id}]`);
        
        // Helper to list all files recursively
        const getFiles = async (path: string = ""): Promise<any[]> => {
             const { data, error } = await supabase.storage.from(bucket.id).list(path, { limit: 100, offset: 0 });
             if (error) {
                 console.error(`Error listing ${bucket.id}/${path}:`, error.message);
                 return [];
             }
             
             let allFiles: any[] = [];
             for (const item of data || []) {
                 if (item.id === null) {
                     // It is a folder
                     const subFiles = await getFiles(`${path ? path + '/' : ''}${item.name}`);
                     allFiles = [...allFiles, ...subFiles];
                 } else {
                     allFiles.push({ ...item, fullPath: `${path ? path + '/' : ''}${item.name}` });
                 }
             }
             return allFiles;
        }

        const bucketFiles = await getFiles();
        
        const orphans = bucketFiles.filter(file => {
             // Construct Public URL to compare
             const publicUrl = supabase.storage.from(bucket.id).getPublicUrl(file.fullPath).data.publicUrl;
             return !usedImages.has(publicUrl);
        });

        if (orphans.length > 0) {
            console.log(`⚠️ Found ${orphans.length} orphaned files in ${bucket.id}:`);
            orphans.forEach(file => {
                const sizeMB = (file.metadata?.size || 0) / 1024 / 1024;
                console.log(`   - ${file.fullPath} (${sizeMB.toFixed(2)} MB)`);
                totalSize += file.metadata?.size || 0;
            });
            totalOrphans += orphans.length;
        } else {
            console.log(`✨ No orphaned files found in ${bucket.id}.`);
        }
    }

    console.log(`\n==================================================`);
    console.log(`🚫 Total Orphaned Files Found: ${totalOrphans}`);
    console.log(`💾 Potential Space Reclaimable: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`==================================================`);
}

findOrphanedFiles();
