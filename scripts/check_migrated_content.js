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

async function checkContent() {
    const env = getEnvVars();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    // Check Pages
    const { data: pages } = await supabase
        .from('migrated_posts')
        .select('id, title, status')
        .eq('type', 'page');
        
    console.log("--- Pages ---");
    console.table(pages);
    
    // Check Posts (Media)
    const { data: posts } = await supabase
        .from('migrated_posts')
        .select('id, title, status, date')
        .eq('type', 'post')
        .order('date', { ascending: false });
        
    console.log("--- Posts (Potential Media) ---");
    console.table(posts);
}

checkContent();
