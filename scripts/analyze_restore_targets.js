const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '../../../.env.local');
const SQL_FILE = path.join(__dirname, 'arthyun.co.kr-20190410-062700-679', 'database.sql');

function getEnvVars() {
    const content = fs.readFileSync(ENV_FILE, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/"/g, '');
    });
    return env;
}

async function analyzeContentToRestore() {
    // We can also grep the SQL file or use existing migrated_posts if we dumped everything.
    // The previous migration script mainly focused on 'post', 'page', 'portfolio'.
    // Let's check for 'product' (WooCommerce) and specific page titles.
    
    const content = fs.readFileSync(SQL_FILE, 'utf8');
    
    // Check for Products
    const productMatch = content.match(/'product'/g);
    console.log(`'product' count in DB: ${productMatch ? productMatch.length : 0}`);
    
    // Find About Page
    // Usually post_type='page' and post_title like 'About' or '소개'
    // Let's look for specific titles in the SQL dump lines
    
    const titlesOfInterest = ['About', '소개', 'CEO', '인사말', 'News', '언론', '보도', 'Shop', 'Store'];
    
    console.log("Scanning for specific pages/posts...");
    
    // Regex to capture ID and Title for 'page' or 'post' or 'product'
    // INSERT INTO ... VALUES (ID, ..., 'Title', ..., 'post_type')
    // This is rough but likely effective for finding the ID
    
    // We'll iterate lines of the giant INSERT (simulated by regex global)
    // Matches: (ID, ..., 'Title', ..., 'post_status', 'comment_status', 'ping_status', 'password', 'name', 'to_ping', 'pinged', 'modified', 'modified_gmt', 'content_filtered', 'parent', 'guid', 'menu_order', 'type', ...)
    // Standard WP posts schema helps.
    // Index 20 is post_type usually.
    
    // Let's simpler scan: find rows where title matches keywords
    
    const relevantItems = [];
    
    // Helper to find context around matches
    titlesOfInterest.forEach(title => {
        const regex = new RegExp(`'${title}'`, 'g');
        // This is too broad, matches content. 
        // Let's try to look for post titles specifically?
        // In WP dumps, title is often surrounded by dates or author ID.
    });
    
    // Let's rely on extracting `post_type` = 'product' or 'page'
    
    const productIds = [];
    // Search for 'product'
    let regex = /\((\d+),[^\)]+?'product'/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        productIds.push(match[1]);
    }
    console.log(`Found ${productIds.length} items with post_type='product'`);
    
    // Identify "About" page ID
    // We look for a page with slug 'about' or title 'About'
    // Slug is usually index 11 or so.
    
    // Scan for slug 'about'
    if (content.includes("'about'")) {
        console.log("Found 'about' slug/string.");
    }
    
    // Scan for 'news' or 'media'
    const newsIds = [];
    // We might have missed some posts if we only migrated 'portfolio'.
    // Standard posts are 'post'. Let's see if there are posts that are NOT portfolio.
    
    const env = getEnvVars();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const { data: existingPosts } = await supabase.from('migrated_posts').select('id, title, type');
    console.log(`Existing migrated posts: ${existingPosts.length}`);
    
    // Check types
    const types = {};
    existingPosts.forEach(p => {
        types[p.type] = (types[p.type] || 0) + 1;
    });
    console.table(types);
    
    // If we have 'post' type, those might be News.
    const potentialNews = existingPosts.filter(p => p.type === 'post');
    if (potentialNews.length > 0) {
        console.log("Potential News posts:");
        potentialNews.slice(0, 5).forEach(p => console.log(`- ${p.title} (${p.id})`));
    }
    
    // Check if we missed Products in migration
    // If productIds > 0, we need to migrate them.
}

analyzeContentToRestore();
