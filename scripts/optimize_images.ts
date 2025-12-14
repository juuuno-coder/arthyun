
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import sharp from "sharp";
import fs from "fs";
import path from "path";

// Load environment variables
dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Must use Service Role Key for storage access

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Error: Missing Supabase credentials. Make sure SUPABASE_SERVICE_ROLE_KEY is set in .env.local");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Buckets to optimize
const TARGET_BUCKETS = ["portfolio-images", "media-uploads", "images", "og_images"]; // Adjust based on your findings or needs

async function optimizeStorage() {
    console.log("🚀 Starting Image Optimization Process...");

    // 1. Get Buckets
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets) {
        console.log("❌ No buckets found or permission denied.");
        return;
    }

    for (const bucket of buckets) {
        // Option to filter specific buckets if needed
        // if (!TARGET_BUCKETS.includes(bucket.id)) continue; 

        console.log(`\n📂 Scanning Bucket: [${bucket.id}]`);

        // Helper to list all files recursively
        const getFiles = async (path: string = ""): Promise<any[]> => {
             const { data, error } = await supabase.storage.from(bucket.id).list(path, { limit: 100 });
             if (error) {
                 console.error(`Error listing ${bucket.id}/${path}:`, error.message);
                 return [];
             }
             
             let allFiles: any[] = [];
             for (const item of data || []) {
                 if (item.id === null) { // Folder
                     const subFiles = await getFiles(`${path ? path + '/' : ''}${item.name}`);
                     allFiles = [...allFiles, ...subFiles];
                 } else {
                     allFiles.push({ ...item, fullPath: `${path ? path + '/' : ''}${item.name}` });
                 }
             }
             return allFiles;
        }

        const files = await getFiles();
        console.log(`   Found ${files.length} files.`);

        for (const file of files) {
            const ext = path.extname(file.name).toLowerCase();
            // Optimize only images
            if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) continue;

            // Skip if small enough (e.g., < 200KB)
            if (file.metadata?.size && file.metadata.size < 200 * 1024) {
                // console.log(`   Skipping ${file.name} (Already small: ${(file.metadata.size/1024).toFixed(1)}KB)`);
                continue;
            }

            console.log(`   🔸 Processing: ${file.fullPath} (${(file.metadata.size/1024/1024).toFixed(2)} MB)`);

            try {
                // 1. Download
                const { data: blob, error: downloadError } = await supabase.storage
                    .from(bucket.id)
                    .download(file.fullPath);
                
                if (downloadError || !blob) {
                    console.error(`      Failed to download: ${downloadError?.message}`);
                    continue;
                }

                const buffer = await blob.arrayBuffer();

                // 2. Compress with Sharp
                // Convert to WebP? Or keep original format but compress?
                // WebP is usually best for web. Let's convert to WebP or optimize current.
                // Keeping extension same is safer for DB references unless we update DB.
                // So we will keep format but optimize quality.
                
                let pipeline = sharp(Buffer.from(buffer));
                const meta = await pipeline.metadata();

                // Resize if too huge (e.g. > 1920px width)
                if (meta.width && meta.width > 1920) {
                     pipeline = pipeline.resize({ width: 1920 });
                }

                let outputBuffer;
                let newContentType = file.metadata.mimetype;

                if (ext === '.png') {
                    // PNG compression
                    outputBuffer = await pipeline.png({ quality: 80, compressionLevel: 9 }).toBuffer();
                } else if (ext === '.webp') {
                    outputBuffer = await pipeline.webp({ quality: 80 }).toBuffer();
                } else {
                    // JPG/JPEG
                    outputBuffer = await pipeline.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
                }

                // Check savings
                const savings = (blob.size - outputBuffer.length) / 1024 / 1024;
                if (savings > 0.1) { // Only upload if saved > 0.1 MB
                    console.log(`      ✨ Optimized! Saved: ${savings.toFixed(2)} MB`);
                    
                    // 3. Upload (Overwrite)
                    const { error: uploadError } = await supabase.storage
                        .from(bucket.id)
                        .upload(file.fullPath, outputBuffer, { 
                            upsert: true, 
                            contentType: newContentType,
                            cacheControl: '3600'
                        });
                    
                    if (uploadError) {
                         console.error(`      Failed to upload optimized file: ${uploadError.message}`);
                    }
                } else {
                    console.log(`      Skipping upload (Savings minimal)`);
                }

            } catch (e: any) {
                console.error(`      Error processing ${file.name}: ${e.message}`);
            }
        }
    }

    console.log("\n✅ Storage Optimization Complete!");
}

optimizeStorage();
