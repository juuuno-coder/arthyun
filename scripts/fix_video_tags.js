const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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

async function fixVideoTags() {
    const env = getEnvVars();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    
    console.log("Connect to Supabase...");
    
    const { data: posts, error } = await supabase
        .from('migrated_posts')
        .select('*')
        .like('content', '%<img %.mp4"%'); // Simple SQL filter attempt? likely won't work well for exact logic, let's fetch content with 'img'
        
    // Supabase .like regex is limited. Let's fetch all or large chunk, OR use text search if enabled.
    // Fetching all is safest for 300 items.
    
    const { data: allPosts } = await supabase.from('migrated_posts').select('*');
    
    let fixCount = 0;
    
    for (const p of allPosts) {
        if (!p.content) continue;
        
        // Regex to find img tag with .mp4 or .mov src
        // <img src="...file.mp4" ... />
        if (/<img[^>]+src="[^"]+\.(mp4|mov|webm)"/i.test(p.content)) {
            console.log(`Found video in IMG tag: [${p.id}] ${p.title}`);
            
            // Replace logic
            const newContent = p.content.replace(
                /<img[^>]+src="([^"]+\.(?:mp4|mov|webm))"[^>]*>/gi,
                (match, url) => {
                    return `<video src="${url}" controls style="max-width:100%; display:block; margin: 20px auto;"></video>`;
                }
            );
            
            await supabase.from('migrated_posts').update({ content: newContent }).eq('id', p.id);
            fixCount++;
        }
    }
    
    console.log(`Fixed ${fixCount} video tags.`);
}

fixVideoTags();
