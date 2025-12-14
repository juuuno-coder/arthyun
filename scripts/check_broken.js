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

async function checkBrokenPost() {
    const env = getEnvVars();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    // Title from screenshot: "서동 미로예술마을 - 문화로 논 DAY"
    const { data: posts } = await supabase
        .from('migrated_posts')
        .select('*')
        .ilike('title', '%서동 미로예술마을%')
        .limit(1);

    if (posts && posts.length > 0) {
        const post = posts[0];
        console.log(`Found Post ID: ${post.id}`);
        console.log(`Title: ${post.title}`);
        console.log('--- Content Preview ---');
        console.log(post.content);
        
        // Extract Image URLs
        const imgRegex = /<img[^>]+src="([^">]+)"/g;
        let match;
        while ((match = imgRegex.exec(post.content)) !== null) {
            console.log(`Image Source: ${match[1]}`);
        }
    } else {
        console.log('Post not found');
    }
}

checkBrokenPost();
