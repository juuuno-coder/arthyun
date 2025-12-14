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

async function fixAllPortfolios() {
    console.log("Reading SQL file...");
    const content = fs.readFileSync(SQL_FILE, 'utf8'); // Large read
    
    const env = getEnvVars();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const BUCKET_NAME = 'migration_uploads';
    const { data: { publicUrl: rootUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl('');
    const targetPrefix = rootUrl.endsWith('/') ? rootUrl : rootUrl + '/';

    console.log("Fetching portfolio posts...");
    const { data: posts } = await supabase.from('migrated_posts').select('*').eq('type', 'portfolio');
    console.log(`Found ${posts.length} portfolio items.`);
    
    let updatedCount = 0;

    for (const post of posts) {
        // Find meta for this post
        // Regex for _thumbnail_id
        // (meta_id, post_id, key, value)
        // \(\d+,\s*ID,\s*'_thumbnail_id',\s*'(\d+)'\)
        const thumbRegex = new RegExp(`\\(\\d+,\\s*${post.id},\\s*'_thumbnail_id',\\s*'(\\d+)'\\)`);
        const thumbMatch = content.match(thumbRegex);
        
        // Regex for be_gallery_images
        const galleryRegex = new RegExp(`\\(\\d+,\\s*${post.id},\\s*'be_gallery_images',\\s*'([^']*)'\\)`);
        const galleryMatch = content.match(galleryRegex);
        
        // Regex for oshine_gallery_images (alternative key?)
        // Let's stick to known ones.
        
        let idsToCheck = [];
        if (thumbMatch) idsToCheck.push(thumbMatch[1]);
        if (galleryMatch) idsToCheck.push(...galleryMatch[1].split(','));
        
        if (idsToCheck.length === 0) continue;
        
        // Find URLs for these IDs
        let imageUrls = [];
        
        for (const attachId of idsToCheck) {
            if (!attachId) continue;
            // Find attachment URL
            const attachRegex = new RegExp(`\\(${attachId},\\s*\\d+,.*?'(http[^']*)'`);
            const attachMatch = content.match(attachRegex);
            if (attachMatch) {
                imageUrls.push(attachMatch[1]);
            }
        }
        
        if (imageUrls.length === 0) continue;
        
        // Filter out images that are already in the content?
        // Some content might already have them.
        
        let newImagesHtml = '';
        imageUrls.forEach(url => {
            // url: http://arthyun.co.kr/wp-content/uploads/...
            let relative = url.split('/uploads/')[1];
            if (!relative) return;
            
            // Normalize path separators just in case
            relative = relative.replace(/\\/g, '/');
            
            const newUrl = targetPrefix + relative;
            
            // Avoid duplicates
            if (post.content && post.content.includes(newUrl)) return;
            // Also check old URL to avoid duplicate logic
            if (post.content && post.content.includes(url)) return; 
            
            newImagesHtml += `<img src="${newUrl}" alt="Gallery Image" class="w-full h-auto rounded shadow-sm mb-4" />`;
        });
        
        if (newImagesHtml.length > 0) {
            newImagesHtml = `<div class="restored-gallery mt-8 grid grid-cols-1 gap-4">${newImagesHtml}</div>`;
            
            const finalContent = (post.content || '') + newImagesHtml;
            const { error } = await supabase.from('migrated_posts').update({ content: finalContent }).eq('id', post.id);
            if (!error) {
                console.log(`Updated Post ${post.id}: Added ${imageUrls.length} images.`);
                updatedCount++;
            }
        }
    }
    
    console.log(`Total posts updated: ${updatedCount}`);
}

fixAllPortfolios().catch(console.error);
