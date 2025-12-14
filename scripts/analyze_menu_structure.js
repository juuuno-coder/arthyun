const fs = require('fs');
const path = require('path');

const SQL_FILE = path.join(__dirname, 'arthyun.co.kr-20190410-062700-679', 'database.sql');

// WordPress stores menus as terms in 'nav_menu' taxonomy.
// The actual items are posts of type 'nav_menu_item'.
// We need to link them.

// 1. Find the menu term ID.
// 2. Find object IDs associated with that term.
// 3. Find the post content/title for those object IDs (which are nav_menu_items).

async function analyzeMenus() {
    console.log("Reading SQL file...");
    const content = fs.readFileSync(SQL_FILE, 'utf8');
    
    // Naive parsing again - simpler than robust SQL parser for this task
    
    // Step 1: Find terms that look like menus
    // INSERT INTO `SERVMASK_PREFIX_terms` VALUES (term_id, 'name', 'slug', ...)
    console.log("Scanning Terms...");
    const termRegex = /\((\d+),\s*'([^']*)',\s*'([^']*)',\s*\d+\)/g;
    let match;
    const terms = {};
    while ((match = termRegex.exec(content)) !== null) {
        terms[match[1]] = { name: match[2], slug: match[3] };
    }
    
    // Step 2: Find taxonomies for these terms to confirm they are menus
    // INSERT INTO `SERVMASK_PREFIX_term_taxonomy` VALUES (tt_id, term_id, 'taxonomy', ...)
    console.log("Scanning Taxonomies...");
    const taxRegex = /\((\d+),\s*(\d+),\s*'([^']*)',/g;
    const menus = [];
    while ((match = taxRegex.exec(content)) !== null) {
        if (match[3] === 'nav_menu') {
            const termId = match[2];
            if (terms[termId]) {
                menus.push({ ...terms[termId], tt_id: match[1] });
            }
        }
    }
    
    console.log("--- Found Menus ---");
    console.table(menus);
    
    if (menus.length === 0) {
        console.log("No menus found.");
        return;
    }
    
    // Let's pick the likely main menu. Often named 'Main Menu', 'Gnb', etc.
    const mainMenu = menus.find(m => m.slug.includes('main') || m.slug.includes('gnb') || m.name.includes('메인')) || menus[0];
    console.log(`Analyzing Menu Item for: ${mainMenu.name} (tt_id: ${mainMenu.tt_id})`);
    
    // Step 3: Find relationships (objects in this menu)
    // INSERT INTO `SERVMASK_PREFIX_term_relationships` VALUES (object_id, term_taxonomy_id, order)
    // We need to capture line-by-line or chunk because this table can be huge
    
    // Let's just regex search for the specific tt_id in relationships
    const relRegex = new RegExp(`\\((\\d+),\\s*${mainMenu.tt_id},\\s*\\d+\\)`, 'g');
    const objectIds = [];
    while ((match = relRegex.exec(content)) !== null) {
        objectIds.push(match[1]);
    }
    
    console.log(`Found ${objectIds.length} menu items (post IDs).`);
    
    // Step 4: Find post details for these items
    // They are in `posts` table with post_type = 'nav_menu_item'
    // We want 'post_title' (label) and 'menu_order' (sorting)
    // Also meta to find what they point to (url).
    
    // Let's do a simplified scan for these IDs in the posts table
    // Values: (ID, author, date, date_gmt, content, title, ...)
    // It is hard to parse exact columns with simple regex due to variable content.
    // But usually title is the 6th element (index 5) or similar.
    
    // Let's dump the raw lines identifying these posts to see title clearly
    
    const items = [];
    
    for (const id of objectIds) {
        // Find the INSERT value tuple for this ID
        // \(ID,\s*\d+,
        const postRegex = new RegExp(`\\(${id},\\s*\\d+,[^)]*`, 'g'); 
        // This is risky, let's just find the text area
        
        // Simpler: Just extract the title if possible?
        // Let's use the 'find_posts' logic or similar. 
        // Or actually, just print the items found.
    }
    
    // Better strategy: Read Post Meta for these IDs to get _menu_item_url and _menu_item_title
    // meta_key: _menu_item_url, _menu_item_title (if custom), _menu_item_object_id (if linked to page)
    
    console.log("Resolving item details via postmeta...");
    
    const menuItems = [];
    
    for (const id of objectIds) {
        let label = '';
        let url = '';
        
        // Find meta
        const metaRegex = new RegExp(`\\(\\d+,\\s*${id},\\s*'([^']*)',\\s*'([^']*)'\\)`, 'g');
        let metaMatch;
        while ((metaMatch = metaRegex.exec(content)) !== null) {
            if (metaMatch[1] === '_menu_item_url') url = metaMatch[2];
            // Title is harder to find in meta, usually comes from the linked object title or post title
        }
        
        // Find Post Title (The Menu Label)
        // INSERT INTO ... VALUES (ID, ... 'Title', ...)
        // This is hard to regex reliably without full parse. 
        
        // Let's just output the ids so we can debug deeper if needed
        menuItems.push({ id, url });
    }
    
    // Try to find names from `posts` insert for these IDs
    // The `post_title` column in `nav_menu_item` is the Label if customized, or empty if default?
    // Actually usually it's in the title column.
    
    console.log("--- Menu Items (IDs) ---");
    console.log(objectIds);
    
    // Dump a snippet for one item to verify structure
    if (objectIds.length > 0) {
        const sampleId = objectIds[0];
        const snippetStart = content.indexOf(`(${sampleId},`);
        if (snippetStart !== -1) {
            console.log(`Snippet for ${sampleId}:`);
            console.log(content.substring(snippetStart, snippetStart + 300));
        }
    }
}

analyzeMenus();
