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

async function checkPostTypes() {
    const env = getEnvVars();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    const { data: posts, error } = await supabase.from('migrated_posts').select('type');
    
    if (error) {
        console.error(error);
        return;
    }

    const typeCounts = {};
    posts.forEach(p => {
        typeCounts[p.type] = (typeCounts[p.type] || 0) + 1;
    });

    console.log('Post Types Found in DB:', typeCounts);
}

checkPostTypes();
