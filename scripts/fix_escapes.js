const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const ENV_FILE = path.join(__dirname, '../../../.env.local');
function getEnvVars() {
    if (!fs.existsSync(ENV_FILE)) process.exit(1);
    const content = fs.readFileSync(ENV_FILE, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/"/g, ''); 
    });
    return env;
}

async function fixEscapes() {
    const env = getEnvVars();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    console.log('Fetching posts...');
    const { data: posts, error } = await supabase.from('migrated_posts').select('id, content');
    if (error) return console.error(error);

    let count = 0;
    for (const post of posts) {
        if (!post.content) continue;
        let original = post.content;
        
        // Remove backslash escapes for quotes
        let fixed = original.replace(/\\"/g, '"').replace(/\\'/g, "'");
        
        // Also fix \\n to \n if any?
        // JSON string \\n is \n in memory. But if DB has literal \n chars?
        // Let's stick to quotes which are visible destroyers of HTML tags.

        if (fixed !== original) {
            const { error: upErr } = await supabase
                .from('migrated_posts')
                .update({ content: fixed })
                .eq('id', post.id);
            if (upErr) console.error(upErr);
            else count++;
        }
    }
    console.log(`Fixed escapes in ${count} posts.`);
}

fixEscapes().catch(console.error);
