const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SQL_FILE = path.join(__dirname, 'arthyun.co.kr-20190410-062700-679', 'database.sql');
const ENV_FILE = path.join(__dirname, '../../../.env.local');

function getEnvVars() {
    const content = fs.readFileSync(ENV_FILE, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/"/g, '');
    });
    return env;
}

async function inspectAndFix() {
    const env = getEnvVars();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    // 1. Read SQL file and extract Postmeta and Attachments (simplified)
    const sqlContent = fs.readFileSync(SQL_FILE, 'utf8');
    
    // --- Helper to parse SQL Values ---
    // This is a naive parser for the specific mysqldump format
    function parseValues(tableName) {
        const rows = [];
        const pattern = new RegExp(`INSERT INTO \`${tableName}\` VALUES (.*);`);
        const match = sqlContent.match(pattern);
        
        if (match) {
            let valuesStr = match[1];
            // Split by ),( 
            // Warning: logic might fail if data contains '),' 
            // A safer split regex for SQL dump values:
            const entries = valuesStr.split(/\),\(/);
            
            entries.forEach(entry => {
                // Remove leading ( and trailing )
                let cleaned = entry.replace(/^\(/, '').replace(/\)$/, '');
                
                // Split by , honoring quotes
                // This regex matches: 'string' | number | NULL
                const cols = [];
                let current = '';
                let inQuote = false;
                let escaped = false;
                
                for (let i = 0; i < cleaned.length; i++) {
                    const char = cleaned[i];
                    if (escaped) {
                        current += char;
                        escaped = false;
                        continue;
                    }
                    if (char === '\\') {
                        escaped = true;
                        // current += char; // Don't keep backslash if unescaping? Mysql string escaping.
                        // Actually let's keep it simple.
                        continue;
                    }
                    if (char === "'" && !escaped) {
                        inQuote = !inQuote;
                        continue;
                    }
                    if (char === ',' && !inQuote) {
                        cols.push(current.trim());
                        current = '';
                        continue;
                    }
                    current += char;
                }
                cols.push(current.trim());
                rows.push(cols);
            });
        }
        return rows;
    }
    
    console.log("Parsing postmeta...");
    // postmeta structure: meta_id, post_id, meta_key, meta_value
    const postmetaRows = parseValues('SERVMASK_PREFIX_postmeta');
    
    console.log("Parsing posts (for attachments)...");
    // posts structure is complex (20+ columns). 
    // ID is index 0, guid is index 18 (usually, need to verify).
    // Let's rely on finding "http" in the string for guid.
    const postsRows = parseValues('SERVMASK_PREFIX_posts');
    
    // Function to find attachment URL by ID
    // We look for post_type = 'attachment' (index 20) and ID same as requested.
    // Or just ID lookup since ID is unique.
    function findAttachmentUrl(attachId) {
        const row = postsRows.find(r => r[0] == attachId);
        if (row) {
            // Guid is often the URL. 
            // In the dump, let's look for the one starting with http
            const guid = row.find(c => c.includes('http') && c.includes('/uploads/'));
            return guid;
        }
        return null;
    }

    // --- Fix Logic ---
    const TARGET_ID = 4327;
    console.log(`Looking for meta for Post ${TARGET_ID}`);
    
    const metas = postmetaRows.filter(r => r[1] == TARGET_ID);
    console.log(`Found ${metas.length} meta entries.`);
    
    let imagesToAttach = [];
    
    // Check Featured Image
    const thumbMeta = metas.find(r => r[2] === '_thumbnail_id');
    if (thumbMeta) {
        console.log(`Found Featured Image ID: ${thumbMeta[3]}`);
        const url = findAttachmentUrl(thumbMeta[3]);
        if (url) imagesToAttach.push(url);
    }
    
    // Check Oshin Gallery IDs
    // Possible keys: 'be_gallery_images', 'image_array', etc.
    const galleryMeta = metas.find(r => r[2] === 'be_gallery_images'); // Example key
    if (galleryMeta) {
         console.log(`Found Gallery Meta: ${galleryMeta[3]}`);
         const ids = galleryMeta[3].split(',');
         ids.forEach(id => {
             const url = findAttachmentUrl(id);
             if (url) imagesToAttach.push(url);
         });
    }
    
    // Check master slider?
    
    console.log("Images found:", imagesToAttach);
    
    if (imagesToAttach.length > 0) {
        console.log("Constructing new content...");
        
        let newContentHtml = `<div class="portfolio-gallery space-y-8">`;
        
        // Convert to Supabase URLs
        const BUCKET_NAME = 'migration_uploads';
        const { data: { publicUrl: rootUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl('');
        const targetPrefix = rootUrl.endsWith('/') ? rootUrl : rootUrl + '/';
        
        imagesToAttach.forEach(oldUrl => {
             // oldUrl: http://arthyun.co.kr/wp-content/uploads/2019/03/filename.jpg
             // Target: targetPrefix + 2019/03/filename.jpg
             
             let relative = oldUrl.split('/uploads/')[1];
             if (!relative) return;
             
             // Clean quotes if any
             relative = relative.replace(/^'|'$/g, '');
             
             const newUrl = targetPrefix + relative;
             newContentHtml += `<img src="${newUrl}" alt="Portfolio Image" class="w-full h-auto rounded-lg shadow-md" />`;
        });
        
        newContentHtml += `</div>`;
        
        // Append to existing content or replace?
        // User wants detailed images.
        // Let's prepend or append.
        
        const { data: currentPost } = await supabase.from('migrated_posts').select('content').eq('id', TARGET_ID).single();
        let finalContent = currentPost.content + newContentHtml;
        
        // Update
        const { error } = await supabase.from('migrated_posts').update({ content: finalContent }).eq('id', TARGET_ID);
        if (error) console.error("Update failed:", error);
        else console.log("Update SUCCESS!");
    } else {
        console.log("No images found in meta to attach.");
    }
    
    // --- Dump all meta keys for inspection ---
    console.log("All meta keys for this post:");
    metas.forEach(m => console.log(`${m[2]}: ${m[3]}`));
}

inspectAndFix();
