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

async function checkUrls() {
    const env = getEnvVars();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    // Fetch portfolio posts
    const { data: posts } = await supabase
        .from('migrated_posts')
        .select('id, title, content')
        .eq('type', 'portfolio');

    console.log(`Checking ${posts.length} portfolio items.`);

    let wpContentCount = 0;
    
    for (const post of posts) {
        if (!post.content) continue;
        if (post.content.includes('/wp-content/uploads/')) {
            wpContentCount++;
            console.log(`[ID ${post.id}] Found /wp-content/uploads/`);
            // Print a snippet
            const idx = post.content.indexOf('/wp-content/uploads/');
            console.log('Context:', post.content.substring(idx - 50, idx + 100));
        }
    }
    
    console.log(`Total posts with generic /wp-content/uploads/: ${wpContentCount}`);
}

checkUrls();
