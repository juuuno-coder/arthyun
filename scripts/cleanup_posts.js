const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Paths
const ENV_FILE = path.join(__dirname, '../../../.env.local');

// Helper to parse .env
function getEnvVars() {
    if (!fs.existsSync(ENV_FILE)) {
        console.error('Error: .env.local file not found at', ENV_FILE);
        process.exit(1);
    }
    const content = fs.readFileSync(ENV_FILE, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const val = parts.slice(1).join('=').trim().replace(/"/g, ''); 
            env[key] = val;
        }
    });
    return env;
}

async function cleanupPosts() {
    const env = getEnvVars();
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Error: NEXT_PUBLIC_SUPABASE_URL or Key not found');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Fetch all posts
    console.log('Fetching posts...');
    const { data: posts, error } = await supabase
        .from('migrated_posts')
        .select('*');

    if (error) {
        console.error('Error fetching posts:', error);
        return;
    }

    console.log(`Found ${posts.length} posts. Starting cleanup...`);

    let updatedCount = 0;

    for (const post of posts) {
        let content = post.content || '';

        // Strategy:
        // 1. Convert [tatsu_image image="URL"] to <img src="URL" />
        // 2. Remove all other [shortcode] tags (opening and closing)
        
        const originalContent = content;

        // 1. Extract Images
        // Regex matches [tatsu_image ... image="http..." ...]
        // Note: attributes can be in any order, so we look for 'image="'
        content = content.replace(/\[tatsu_image[^\]]*image="([^"]+)"[^\]]*\]/g, (match, url) => {
            return `<img src="${url}" alt="Migrated Image" class="migration-img" />`;
        });

        // Also handle [team image="..."] seen in json
        content = content.replace(/\[team[^\]]*image="([^"]+)"[^\]]*\]/g, (match, url) => {
             return `<img src="${url}" alt="Team Image" class="migration-img" />`;
        });
        
        // 2. Strip all tatsu shortcodes (and potentially others)
        // We iterate to remove nested structures if needed, but a global replace of tags handles it.
        // Matches [tag] or [/tag] or [tag attr="val"]
        // We specifically target tatsu_ prefixes to be safe, or just everything?
        // Let's target specific known builders 'tatsu', 'vc', 'be_'. 
        // Generically removing ALL [...] might break normal text in brackets like "Case [A]".
        // So we strictly look for known WP patterns: starts with letter, no spaces.
        
        // Remove tatsu shortcodes
        content = content.replace(/\[\/?tatsu_[^\]]*\]/g, '');
        
        // Remove be_ shortcodes (seen be_special_heading6)
        content = content.replace(/\[\/?be_[^\]]*\]/g, '');

        // Remove other common WP shortcodes seen in examples (portfolio, team, etc)
        content = content.replace(/\[\/?portfolio[^\]]*\]/g, '');
        content = content.replace(/\[\/?animate_icon[^\]]*\]/g, '');
        content = content.replace(/\[\/?special_sub_title[^\]]*\]/g, '');
        content = content.replace(/\[\/?contact_form[^\]]*\]/g, '');
        
        // 3. Clean up empty divs or p tags that might be left over? (Optional)
        // For now, let's stick to shortcode removal.

        // Update if changed
        if (content !== originalContent) {
            const { error: updateError } = await supabase
                .from('migrated_posts')
                .update({ content: content })
                .eq('id', post.id);

            if (updateError) {
                console.error(`Error updating post ${post.id}:`, updateError);
            } else {
                updatedCount++;
                // console.log(`Cleaned post ${post.id}`);
            }
        }
    }

    console.log(`Cleanup complete. Updated ${updatedCount} posts.`);
}

cleanupPosts().catch(console.error);
