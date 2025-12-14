const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '../.env.local');

function getEnvVars() {
    try {
        const content = fs.readFileSync(ENV_FILE, 'utf8');
        const env = {};
        content.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/"/g, '');
        });
        return env;
    } catch (e) {
        return {};
    }
}

async function analyze() {
    const env = getEnvVars();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    
    console.log("Searching for broken KakaoTalk posts...");
    
    const { data: posts, error } = await supabase
        .from('migrated_posts')
        .select('id, title, content')
        .ilike('content', '%KakaoTalk%')
        .limit(3);

    if (error) {
        console.error("Error:", error);
        return;
    }

    if (posts && posts.length > 0) {
        posts.forEach(post => {
            console.log("\n------------------------------------------------");
            console.log(`Post ID: ${post.id}, Title: ${post.title}`);
            
            const imgRegex = /<img[^>]+src="([^">]+)"/g;
            let match;
            while ((match = imgRegex.exec(post.content)) !== null) {
                console.log(`Found SRC: ${match[1]}`);
            }
        });
    } else {
        console.log("No posts found with 'KakaoTalk' in content.");
    }
}

analyze();
