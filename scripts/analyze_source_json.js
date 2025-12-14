const fs = require('fs');
const path = require('path');

const POSTS_FILE = path.join(__dirname, 'posts.json');

function analyzeSourceJson() {
    console.log("Reading posts.json...");
    try {
        const rawData = fs.readFileSync(POSTS_FILE, 'utf8');
        const posts = JSON.parse(rawData);
        
        console.log(`Total items in posts.json: ${posts.length}`);

        const typeCounts = {};
        const statusCounts = {};
        const typeStatusCounts = {};
        
        posts.forEach(p => {
            const t = p.type || 'undefined';
            const s = p.status || 'undefined';
            
            typeCounts[t] = (typeCounts[t] || 0) + 1;
            statusCounts[s] = (statusCounts[s] || 0) + 1;
            
            const key = `${t} (${s})`;
            typeStatusCounts[key] = (typeStatusCounts[key] || 0) + 1;
        });

        console.log("\n--- Source JSON Distribution (What was expected to be imported) ---");
        console.log(JSON.stringify(typeStatusCounts, null, 2));

        // Let's look specifically for things that look like Portfolios or Projects but might be named differently
        // or have 'attachment' type if user meant image files.
        // Also look for 'draft' or 'trash' that might hide content.
        
        console.log("\n--- Searching for 'portfolio' related terms in JSON ---");
        const portfolioCandidates = posts.filter(p => {
             const jsonStr = JSON.stringify(p).toLowerCase();
             return jsonStr.includes('project') || jsonStr.includes('portfolio') || jsonStr.includes('gallery');
        });
        console.log(`Found ${portfolioCandidates.length} items containing 'project', 'portfolio', or 'gallery'`);
        
        // Show a few samples of candidates that are NOT type='portfolio'
        const hiddenGems = portfolioCandidates.filter(p => p.type !== 'portfolio' && p.type !== 'nav_menu_item' && p.type !== 'revision');
        console.log(`\n--- Potential Hidden Projects (Not type='portfolio') ---`);
        hiddenGems.slice(0, 20).forEach(p => {
            console.log(`[${p.id}] Type: ${p.type}, Status: ${p.status}, Title: ${p.title}`);
        });

    } catch (e) {
        console.error("Error reading/parsing posts.json:", e);
    }
}

analyzeSourceJson();
