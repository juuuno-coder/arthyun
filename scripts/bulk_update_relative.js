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

async function bulkUpdateRelativeLinks() {
    const env = getEnvVars();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const BUCKET_NAME = 'migration_uploads';
    const { data: { publicUrl: rootUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl('');
    const targetPrefix = rootUrl.endsWith('/') ? rootUrl : rootUrl + '/';
    
    console.log(`Targeting relative paths to: ${targetPrefix}`);
    
    // We target ANY string containing /wp-content/uploads/ and replace up to the filename?
    // No, we should replace the prefix.
    // Common prefixes:
    // http://arthyun.co.kr/wp-content/uploads/ (Done)
    // https://arthyun.co.kr/wp-content/uploads/ (Done)
    // /wp-content/uploads/ (Relative root)
    // http://www.arthyun.co.kr... ?
    // Escaped versions?
    
    // Let's replace "/wp-content/uploads/" with the target URL everywhere.
    // But we must be careful not to double replace.
    // The target URL is ".../migration_uploads/". 
    // If we replace "/wp-content/uploads/" it becomes ".../migration_uploads/".
    // This assumes the file structure under uploads/ matches storage.
    // Yes, mirror_uploads.js preserves structure (2018/12/...).
    
    const { data: posts, error } = await supabase.from('migrated_posts').select('id, content');
    if (error) return console.error(error);

    let count = 0;
    for (const post of posts) {
        if (!post.content) continue;
        
        let newContent = post.content;
        
        // Replace absolute with www if missed
        newContent = newContent.split('http://www.arthyun.co.kr/wp-content/uploads/').join(targetPrefix);
        
        // Replace root relative
        // We use a regex to ensure we don't break things that are already replaced?
        // Actually, if we just replace "/wp-content/uploads/", it might replace the middle of a URL.
        // But "/wp-content/uploads/" is quite specific.
        // Wait, if I already replaced http://.../wp-content... with https://supabase.../migration_uploads/
        // Then that string no longer contains /wp-content/uploads/. 
        // So it's safe to replace remaining ones.
        
        newContent = newContent.split('/wp-content/uploads/').join(targetPrefix);

        if (newContent !== post.content) {
            const { error: upErr } = await supabase.from('migrated_posts').update({ content: newContent }).eq('id', post.id);
            if (upErr) console.error(`Error updating ${post.id}:`, upErr);
            else count++;
        }
    }
    
    console.log(`Relative link update complete. Updated ${count} posts.`);
}

bulkUpdateRelativeLinks();
