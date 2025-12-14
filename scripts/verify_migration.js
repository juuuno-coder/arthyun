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

async function verify() {
    const env = getEnvVars();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    // Check ID 53
    const { data: post } = await supabase.from('migrated_posts').select('content').eq('id', 53).single();
    if (post) {
        if (post.content.includes('supabase.co') || post.content.includes('/storage/v1/object/public')) {
            console.log('SUCCESS: Found Supabase URL in post 53');
        } else {
            console.log('FAILURE: No Supabase URL in post 53');
            console.log('Content snippet:', post.content.substring(0, 500));
        }
    }
}

verify();
