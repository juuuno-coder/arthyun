const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ENV_FILE = path.join(__dirname, '../../../.env.local');
const LOCAL_ROOT = path.join(__dirname, '../www/wp-content/uploads');

function getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const map = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.pdf': 'application/pdf',
        '.mp4': 'video/mp4'
    };
    return map[ext] || 'application/octet-stream';
}

function getEnvVars() {
    const content = fs.readFileSync(ENV_FILE, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/"/g, '');
    });
    return env;
}

async function repairUnicode() {
    const env = getEnvVars();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const BUCKET = 'migration_uploads';

    console.log("Starting Unicode Repair...");

    // Iterate all years/months
    const years = fs.readdirSync(LOCAL_ROOT).filter(f => /^\d{4}$/.test(f));
    
    for (const year of years) {
        const yearPath = path.join(LOCAL_ROOT, year);
        const months = fs.readdirSync(yearPath);
        
        for (const month of months) {
            const monthPath = path.join(yearPath, month);
            if (!fs.statSync(monthPath).isDirectory()) continue;
            
            const files = fs.readdirSync(monthPath);
            for (const file of files) {
                // Check for non-ASCII characters
                if (/[^\x00-\x7F]/.test(file)) {
                    await processFile(supabase, BUCKET, year, month, file);
                }
            }
        }
    }
    console.log("Repair completed.");
}

async function processFile(supabase, bucket, year, month, filename) {
    const localDir = path.join(LOCAL_ROOT, year, month);
    const filePath = path.join(localDir, filename);
    
    // Generate Hash Name
    const ext = path.extname(filename);
    const hash = crypto.createHash('md5').update(filename).digest('hex');
    const newFilename = `${hash}${ext}`;
    
    const targetPath = `${year}/${month}/${newFilename}`;
    
    console.log(`[${year}/${month}] Unicode File: ${filename} -> ${newFilename}`);
    
    // 1. Upload new file
    // Check if exists first to save bandwidth?
    // Just upload with upsert=true
    try {
        const buffer = fs.readFileSync(filePath);
        const mimeType = getMimeType(filePath);
        
        const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(targetPath, buffer, {
                contentType: mimeType,
                upsert: true
            });
            
        if (uploadError) {
            console.error(`  Upload FAILED: ${uploadError.message}`);
            return;
        }
        console.log(`  Upload OK.`);
        
        // 2. Update DB
        // We replace occurrences of the OLD filename with the NEW filename
        // Search patterns:
        // 1. Literal: filename
        // 2. Encoded: encodeURI(filename)
        
        const patterns = [filename, encodeURI(filename)];
        
        for (const pattern of patterns) {
            // Note: Supabase doesn't support complex string replace in one query easily via JS SDK unless calling RPC.
            // But we can do: select content where content contains pattern, then modify and update.
            // Since there are only ~50 portfolios, scanning matches is feasible.
            
            // Or use SQL RPC if available? No, let's use JS client.
            
            // Fetch posts containing the pattern
            // pattern might include quotes, but here we search for the file part.
            
            const { data: posts, error: searchError } = await supabase
                .from('migrated_posts')
                .select('id, content')
                .ilike('content', `%${pattern}%`);
                
            if (searchError) {
                console.error("  Search Error:", searchError.message);
                continue;
            }
            
            if (posts && posts.length > 0) {
                console.log(`  Found ${posts.length} posts containing '${pattern}'`);
                
                for (const post of posts) {
                    let newContent = post.content.split(pattern).join(newFilename);
                    
                    const { error: updateError } = await supabase
                        .from('migrated_posts')
                        .update({ content: newContent })
                        .eq('id', post.id);
                        
                    if (updateError) console.error(`    Update Post ${post.id}: FAILED`);
                    else console.log(`    Update Post ${post.id}: SUCCESS`);
                }
            }
        }

    } catch (e) {
        console.error(`  Process Error: ${e.message}`);
    }
}

repairUnicode();
