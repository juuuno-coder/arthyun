const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

async function bulkUpdateLinks() {
    const env = getEnvVars();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const BUCKET_NAME = 'migration_uploads';
    // Construct public URL prefix
    // usually: [SUPABASE_URL]/storage/v1/object/public/[BUCKET]
    const { data: { publicUrl: rootUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl('');
    // rootUrl usually ends with bucket name. 
    // e.g. https://.../migration_uploads
    // But check if it has trailing slash.
    
    // We want to replace "http://arthyun.co.kr/wp-content/uploads/" 
    // with rootUrl + "/"
    // If rootUrl is "..../migration_uploads", we need "..../migration_uploads/"
    
    const targetPrefix = rootUrl.endsWith('/') ? rootUrl : rootUrl + '/';
    console.log(`Target Prefix: ${targetPrefix}`);
    
    console.log('Fetching posts...');
    const { data: posts, error } = await supabase.from('migrated_posts').select('id, content').not('content', 'is', null);
    
    if (error) return console.error(error);

    let count = 0;
    for (const post of posts) {
        if (!post.content) continue;
        
        let newContent = post.content.split('http://arthyun.co.kr/wp-content/uploads/').join(targetPrefix);
        
        // Also handle https if present?
        newContent = newContent.split('https://arthyun.co.kr/wp-content/uploads/').join(targetPrefix);

        if (newContent !== post.content) {
            const { error: upErr } = await supabase.from('migrated_posts').update({ content: newContent }).eq('id', post.id);
            if (upErr) console.error(`Error updating ${post.id}:`, upErr);
            else count++;
        }
    }
    
    console.log(`Bulk link update complete. Updated ${count} posts.`);
}

bulkUpdateLinks();
