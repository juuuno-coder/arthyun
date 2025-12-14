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

async function extractAndFix() {
    const content = fs.readFileSync(SQL_FILE, 'utf8');
    
    // Regex for: (meta_id, 3952, 'key', 'value')
    // We match literally (, then digits, then comma, then 3952, then comma, then 'key', then comma, then 'value')
    
    // Look for _thumbnail_id
    // (13527, 3952, '_thumbnail_id', '4328')
    const thumbRegex = /\(\d+,\s*3952,\s*'_thumbnail_id',\s*'(\d+)'\)/;
    const thumbMatch = content.match(thumbRegex);
    
    let thumbId = null;
    if (thumbMatch) {
         thumbId = thumbMatch[1];
         console.log(`Found Thumbnail ID: ${thumbId}`);
    }
    
    // Look for Oshin gallery
    const galleryRegex = /\(\d+,\s*3952,\s*'be_gallery_images',\s*'([^']*)'\)/;
    const galleryMatch = content.match(galleryRegex);
    
    let galleryIds = [];
    if (galleryMatch) {
        console.log(`Found Gallery IDs: ${galleryMatch[1]}`);
        galleryIds = galleryMatch[1].split(',');
    }
    
    const allIds = [];
    if (thumbId) allIds.push(thumbId);
    if (galleryIds.length > 0) allIds.push(...galleryIds);
    
    if (allIds.length === 0) {
        console.log("No images found for 3952.");
        return;
    }
    
    console.log(`Looking up paths for IDs: ${allIds.join(', ')}`);
    
    // Now find paths
    const imageUrls = [];
    
    for (const id of allIds) {
        const postRegex = new RegExp(`\\(${id},\\s*\\d+,.*?'(http[^']*)'`);
        const match = content.match(postRegex);
        if (match) {
            console.log(`Found URL for ${id}: ${match[1]}`);
            imageUrls.push(match[1]);
        } else {
            console.log(`Could not find URL for attachment ${id}`);
        }
    }
    
    // Now update Supabase
    if (imageUrls.length > 0) {
        const env = getEnvVars();
        const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
        
        const BUCKET_NAME = 'migration_uploads';
        const { data: { publicUrl: rootUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl('');
        const targetPrefix = rootUrl.endsWith('/') ? rootUrl : rootUrl + '/';
        
        let html = `<div class="portfolio-gallery space-y-8 my-8">`;
        
        imageUrls.forEach(url => {
            // http://arthyun.co.kr/wp-content/uploads/2019/03/IMG_2838.jpg
            let relative = url.split('/uploads/')[1];
            if (relative) {
                const newUrl = targetPrefix + relative;
                html += `<img src="${newUrl}" alt="Portfolio Detail" class="w-full h-auto rounded shadow-sm" />`;
            }
        });
        html += `</div>`;
        
        // Append to current content
        const { data: post } = await supabase.from('migrated_posts').select('content').eq('id', 4327).single();
        const newContent = post.content + html;
        
        const { error } = await supabase.from('migrated_posts').update({ content: newContent }).eq('id', 4327);
        
        if (error) console.error("Update failed:", error);
        else console.log("Successfully updated Kijang post with images.");
    }
}

extractAndFix();
