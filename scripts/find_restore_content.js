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

async function findSpecificContent() {
    const env = getEnvVars();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    // Find About
    const { data: aboutPages } = await supabase
        .from('migrated_posts')
        .select('*')
        .or('title.ilike.%About%,title.ilike.%소개%,title.ilike.%인사말%');
        
    console.log("--- Found About Candidates ---");
    aboutPages.forEach(p => console.log(`${p.id}: ${p.title} (${p.type})`));
    
    if (aboutPages.length > 0) {
        console.log("Previewing content of first match:");
        console.log(aboutPages[0].content.substring(0, 500));
    }
    
    // Find Media/News (assuming they are 'post' type or 'portfolio' with specific category?)
    // User said "Press" -> "MEDIA". Maybe category was "Press"?
    // But we don't have categories migrated yet in a structured way maybe.
    // Let's check 'post' type items that are NOT 'Hello world'.
    
    const { data: posts } = await supabase
        .from('migrated_posts')
        .select('id, title')
        .eq('type', 'post')
        .neq('title', 'Hello world!')
        .neq('title', '상단영역') // Exclusion
        .limit(20);
        
    console.log("--- Found Potnetial Media Posts ---");
    posts.forEach(p => console.log(`${p.id}: ${p.title}`));
}

findSpecificContent();
