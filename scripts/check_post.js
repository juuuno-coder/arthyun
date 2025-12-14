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

async function checkPost() {
    const env = getEnvVars();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    // Check ID 9
    const { data: post } = await supabase.from('migrated_posts').select('content').eq('id', 9).single();
    if (post) {
        console.log('--- Post 9 Content Analysis ---');
        console.log('Total Length:', post.content.length);
        const idx = post.content.indexOf('<img'); // Check for img tag
        if (idx !== -1) {
            console.log('Found <img at index:', idx);
            console.log('Snippet:', post.content.substring(idx, idx + 200));
        } else {
             console.log('No <img found in content.');
        }
    }
}

checkPost();
