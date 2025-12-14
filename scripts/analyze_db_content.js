const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Adjust path to .env.local
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
        console.error("Error reading .env.local:", e);
        return {};
    }
}

async function checkContent() {
    const env = getEnvVars();
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.error("Missing Supabase credentials in .env.local");
        return;
    }

    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    console.log("Connect to Supabase...");

    // 1. Fetch all migrated_posts basic info
    const { data: allPosts, error } = await supabase
        .from('migrated_posts')
        .select('id, type, status, title');

    if (error) {
        console.error("Error fetching migrated_posts:", error.message);
        return;
    }

    // 2. Aggregate counts
    const typeCounts = {};
    const statusCounts = {};
    const typeStatusCounts = {};

    allPosts.forEach(p => {
        // Count by Type
        typeCounts[p.type] = (typeCounts[p.type] || 0) + 1;
        
        // Count by Status
        statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;

        // Count by Type + Status
        const key = `${p.type} (${p.status})`;
        typeStatusCounts[key] = (typeStatusCounts[key] || 0) + 1;
    });

    console.log("\n=== SUMMARY of 'migrated_posts' TABLE ===");
    console.log(`Total Rows: ${allPosts.length}`);
    
    console.log("\n--- By Type ---");
    console.log(JSON.stringify(typeCounts, null, 2));

    console.log("\n--- By Status ---");
    console.log(JSON.stringify(statusCounts, null, 2));

    console.log("\n--- Detailed Breakdown ---");
    console.log(JSON.stringify(typeStatusCounts, null, 2));

    // 3. List "Page" items to see if they are useful
    const pageItems = allPosts.filter(p => p.type === 'page');
    console.log(`\n\n=== Found ${pageItems.length} 'Page' Items (Likely Old Content) ===`);
    
    // Save to file for full inspection
    const listContent = pageItems.map(p => `[${p.id}] ${p.title}`).join('\n');
    fs.writeFileSync(path.join(__dirname, 'pages_list.txt'), listContent);
    console.log("Full list of '" + pageItems.length + "' pages saved to scripts/pages_list.txt");

    // 4. List some "Draft" or "Trash" items if any
    const nonPublished = allPosts.filter(p => p.status !== 'publish');
    if (nonPublished.length > 0) {
        console.log(`\n\n=== Found ${nonPublished.length} Non-Published Items (candidates for revival or deletion) ===`);
        // Show all
        nonPublished.forEach(p => console.log(`[${p.id}] ${p.type} / ${p.status}: ${p.title}`));
    } else {
        console.log("\nNo non-published items found. Everything seems to be 'publish' status.");
    }
}

checkContent();
