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

async function findPostsWithImages() {
    const env = getEnvVars();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    // Select all posts
    const { data: posts } = await supabase.from('migrated_posts').select('id, title, content').not('content', 'is', null);
    
    let count = 0;
    for (const post of posts) {
        if (post.content && post.content.includes('arthyun.co.kr/wp-content/uploads')) {
            console.log(`ID: ${post.id}, Title: ${post.title}`);
            // Count Occurrences
            const matches = post.content.match(/arthyun\.co\.kr\/wp-content\/uploads/g);
            console.log(`   - URLs found: ${matches.length}`);
            count++;
            if (count >= 5) break; 
        }
    }
    
    if (count === 0) console.log('No posts with arthyun.co.kr/wp-content/uploads found.');
}

findPostsWithImages();
