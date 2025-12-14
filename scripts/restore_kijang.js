const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read large posts.json
const POSTS_FILE = path.join(__dirname, 'posts.json');

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

// Extract original content for Kijang from JSON
function getOriginalContent() {
    const data = fs.readFileSync(POSTS_FILE, 'utf8');
    const posts = JSON.parse(data);
    
    // Fuzzy search
    const post = posts.find(p => p.title.includes('기장 대룡마을 벽화'));
    if (post) {
        console.log(`Original Content Length: ${post.content.length}`);
        console.log('Original Content Snippet:');
        console.log(post.content.substring(0, 500));
        
        // Return for re-upload
        return post;
    }
    return null;
}

async function restoreContent(originalPost) {
    const env = getEnvVars();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    console.log(`Restoring content for ID ${originalPost.id}...`);
    
    // We need to re-apply the cleanup script logic but BETTER.
    let content = originalPost.content;
    
    // 1. Unescape first! 
    content = content.replace(/\\"/g, '"').replace(/\\'/g, "'");
    
    // 2. Extract [tatsu_image]
    content = content.replace(/\[tatsu_image[^\]]*image="([^"]+)"[^\]]*\]/g, (match, url) => {
        return `<img src="${url}" alt="Migrated Image" class="block w-full h-auto my-4" />`;
    });
    
    // 3. Extract [tatsu_section ... bg_image="..."]
    content = content.replace(/\[tatsu_section[^\]]*bg_image="([^"]+)"[^\]]*\]/g, (match, url) => {
        return `<div class="mb-8"><img src="${url}" alt="Background Image" class="block w-full h-auto rounded-lg shadow-md" /></div>`;
    });
    
    // Strip other shortcodes
    content = content.replace(/\[\/?tatsu_[^\]]*\]/g, '');
    content = content.replace(/\[\/?be_[^\]]*\]/g, '');
    
    // Link Replacement (using what we know from bulk_update)
    const BUCKET_NAME = 'migration_uploads';
    const { data: { publicUrl: rootUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl('');
    const targetPrefix = rootUrl.endsWith('/') ? rootUrl : rootUrl + '/';
    
    content = content.split('http://arthyun.co.kr/wp-content/uploads/').join(targetPrefix);
    
    console.log('--- Restored Content Preview ---');
    console.log(content.substring(0, 500));
    
    const { error } = await supabase.from('migrated_posts').update({ content: content }).eq('id', originalPost.id);
    
    if (error) console.error('Error updating:', error);
    else console.log('Successfully restored content.');
}

const original = getOriginalContent();
if (original) {
    restoreContent(original);
} else {
    // Try checking portfolio.json since it might be there
    const PORTFOLIO_FILE = path.join(__dirname, 'portfolio.json');
    if (fs.existsSync(PORTFOLIO_FILE)) {
        const pData = fs.readFileSync(PORTFOLIO_FILE, 'utf8');
        const portfolios = JSON.parse(pData);
        const pPost = portfolios.find(p => p.title.includes('기장 대룡마을 벽화'));
        if (pPost) {
            console.log('Found in portfolio.json');
            restoreContent(pPost);
        } else {
            console.log('Not found in JSON either.');
        }
    }
}
