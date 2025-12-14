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

async function verifyPortfolioDisplay() {
    const env = getEnvVars();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    // Fetch a few updated posts to show their new img src
    const { data: posts, error } = await supabase
        .from('migrated_posts')
        .select('id, title, content')
        .eq('type', 'portfolio')
        .limit(3);

    console.log('--- Verifying 3 Portfolio Items ---');
    for (const post of posts) {
        console.log(`ID: ${post.id} Title: ${post.title}`);
        const regex = /<img[^>]+src="([^">]+)"/g;
        let match;
        while ((match = regex.exec(post.content)) !== null) {
            console.log(`  Img Src: ${match[1]}`);
        }
    }
}

verifyPortfolioDisplay();
