const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SQL_FILE = path.join(__dirname, 'arthyun.co.kr-20190410-062700-679', 'database.sql');
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

async function restoreContent() {
    console.log("Reading SQL...");
    const sqlContent = fs.readFileSync(SQL_FILE, 'utf8');
    const env = getEnvVars();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    // 1. Restore About (Post 9)
    console.log("Restoring About (Post 9)...");
    const post9Regex = /\(9,\s*\d+,\s*'[^']*',\s*'[^']*',\s*'([^']*)',\s*'([^']*)'/; 
    // This regex is too simple and risky. 
    // Content is 5th element in tuple? (ID, author, date, date_gmt, content, title...)
    
    // Use substring search for safety
    const insertStart = sqlContent.indexOf('(9,');
    if (insertStart !== -1) {
        // Extract a chunk
        const chunk = sqlContent.substring(insertStart, insertStart + 10000);
        // Parse loosely: find ' and ' boundaries
        // Value 1: ID 9
        // Value 2: Author
        // Value 3: Date
        // Value 4: Date GMT
        // Value 5: CONTENT (starts with ')
        
        let pos = 0;
        let count = 0;
        let contentStart = -1;
        let contentEnd = -1;
        
        // Naive parser assuming simple CSV with quoting... which SQL NOT always is (escaped quotes).
        // Since we know the content likely starts with '<' and contains html.
        
        const contentMatch = chunk.match(/\(9,\s*\d+,\s*'[^']*',\s*'[^']*',\s*'([\s\S]*?)',\s*'/);
        
        if (contentMatch) {
            let content = contentMatch[1];
            // Fix SQL escapes
            content = content.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, "\\").replace(/\\r\\n/g, "\n");
            
            console.log(`Extracted About Content: ${content.substring(0, 100)}...`);
            
            const { error } = await supabase.from('migrated_posts').upsert({
                id: 9,
                title: 'About',
                content: content,
                date: new Date().toISOString(),
                type: 'page',
                status: 'publish',
                slug: 'about'
            });
            
            if (error) console.error("Error upserting About:", error);
            else console.log("About restored.");
        } else {
            console.log("Failed to parse Post 9 content regex.");
        }
    } else {
        console.log("Post 9 not found in SQL.");
    }

    // 2. Restore Media Posts (type='post')
    // We want to find all rows where post_type = 'post'
    // They are usually at the end of the tuple: ..., 'post') or 'post', ...
    
    // We will scan for `(ID, ..., 'post')` patterns.
    // Given the complexity of regex parsing the huge file for all items, 
    // and that we previously might have only migrated 'portfolio',
    // let's try to grab a few known or general posts using a stronger regex loop.
    
    console.log("Scanning for posts (News/Media)...");
    // Regex for: (ID, ..., 'post_title', ..., 'post_type')
    // Let's assume title is index 5 and type is index 20.
    
    // Simplified: Find lines containing 'post' as type.
    // We'll search for `,'post')` or `,'post',` at the end of a values group?
    // Value tuple ends with `);` or `,(`.
    // Common types: 'post', 'page', 'attachment', 'revision', 'nav_menu_item', 'custom_css', 'customize_changeset', 'oembed_cache', 'user_request', 'wp_block', 'scheduled-action', 'guest-author'
    
    // We only want 'post'.
    
    // Let's iterate over `VALUES` chunks? Use a library? No library available.
    // Try to regex for Type Position.
    
    const postsFound = [];
    const postTypeRegex = /\((\d+),(\d+),'([^']*)','([^']*)','([\s\S]*?)','([^']*)',[^\)]*?'post'/g;
    // This is very heavy and might fail on nested quotes.
    
    // Alternative: List IDs that are likely posts.
    // We can't do that easily.
    
    // Let's rely on the previous migration script logic but apply it to 'post' type.
    // Do we have the `import_portfolio.js` script? We can adapt it.
    
}

restoreContent();
