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

async function debugPortfolioImages() {
    const env = getEnvVars();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    // Get a portfolio item
    const { data: posts } = await supabase
        .from('migrated_posts')
        .select('*')
        .eq('type', 'portfolio')
        .limit(3);

    console.log(`Checking ${posts.length} portfolio items...`);

    for (const post of posts) {
        console.log(`\n--- Post ID ${post.id}: ${post.title} ---`);
        // Extract image URLs
        const regex = /<img[^>]+src="([^">]+)"/g;
        let match;
        while ((match = regex.exec(post.content)) !== null) {
            console.log(`Image Src: ${match[1]}`);
        }
        
        // Also check for raw http links if cleanup didn't make them imgs yet?
        // But I ran cleanup.
        // Let's also look for http://arthyun.co.kr
        const rawRegex = /http:\/\/arthyun\.co\.kr\/wp-content\/uploads\/[^"'\s]+/g;
        let rawMatch;
        while ((rawMatch = rawRegex.exec(post.content)) !== null) {
             console.log(`Raw URL found: ${rawMatch[0]}`);
        }
    }
}

debugPortfolioImages();
