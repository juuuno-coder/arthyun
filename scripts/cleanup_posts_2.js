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

async function cleanupPosts() {
    const env = getEnvVars();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    console.log('Fetching posts...');
    const { data: posts, error } = await supabase.from('migrated_posts').select('*');
    if (error) return console.error(error);

    console.log(`Found ${posts.length} posts. Starting cleanup...`);
    let count = 0;

    for (const post of posts) {
        if (!post.content) continue;
        let content = post.content;
        const originalContent = content;

        // 1. Convert [tatsu_image image="..."] to <img>
        // We match explicitly to replace the whole tag
        content = content.replace(/\[tatsu_image[^\]]*image="([^"]+)"[^\]]*\]/g, (match, url) => {
            return `<img src="${url}" alt="Migrated Image" class="migration-img" />`;
        });

        // 2. Extract bg_image from sections or rows 
        // [tatsu_section ... bg_image="..."] -> <div><img...></div> + content (stripped)
        // Actually, since we strip tokens later, if we just insert the <img>, it persists.
        // We want to KEEP the inner content of section, but remove the wrapper [tatsu_section].
        // If we replace [tatsu_section bg="..."] with <img...>, the inner content stays because [tatsu_section] is just the opening tag.
        // So:
        content = content.replace(/\[(tatsu_section|tatsu_row|tatsu_column)[^\]]*bg_image="([^"]+)"[^\]]*\]/g, (match, tag, url) => {
            // We return an image tag AND the cleaning comment? No, just the image.
            // The shortcode stripping pass will remove [tatsu_section...] if we don't replace it here?
            // Wait, "replace" consumes the matched string.
            // So [tatsu_section ... ] matches. We replace it with <img ...>.
            // The structural "<div>" that tatsu_section provided is gone.
            // That's fine, we are stripping shortcodes anyway.
            return `<div class="migrated-bg-image"><img src="${url}" alt="Background Image" /></div>`;
        });

        // 3. Handle [team image="..."]
        content = content.replace(/\[team[^\]]*image="([^"]+)"[^\]]*\]/g, (match, url) => {
             return `<img src="${url}" alt="Team Image" class="migration-img" />`;
        });

        // 4. Strip remnants
        content = content.replace(/\[\/?tatsu_[^\]]*\]/g, '');
        content = content.replace(/\[\/?be_[^\]]*\]/g, '');
        content = content.replace(/\[\/?portfolio[^\]]*\]/g, '');
        content = content.replace(/\[\/?animate_icon[^\]]*\]/g, '');
        content = content.replace(/\[\/?special_sub_title[^\]]*\]/g, '');
        content = content.replace(/\[\/?contact_form[^\]]*\]/g, '');
        content = content.replace(/\[\/?team[^\]]*\]/g, ''); // Strip remaining team tags

        if (content !== originalContent) {
            const { error: upErr } = await supabase.from('migrated_posts').update({ content: content }).eq('id', post.id);
            if (upErr) console.error(upErr);
            else count++;
        }
    }
    console.log(`Cleanup complete. Updated ${count} posts.`);
}

cleanupPosts().catch(console.error);
