const fs = require('fs');
const path = require('path');

const SQL_FILE = path.join(__dirname, 'arthyun.co.kr-20190410-062700-679', 'database.sql');

async function extractMenuTitles() {
    const content = fs.readFileSync(SQL_FILE, 'utf8');
    
    // IDs from previous run (Hardcoded for speed, can be dynamic)
    const menuIds = ['3823', '3819', '3820', '3822', '3824']; 
    // Wait, the output from previous step was truncated or I missed the list.
    // Let's re-find the IDs and then find their titles.
    
    // 1. Find Main Menu ID again
    // We saw "Scanning Taxonomies..." then output.
    // Let's assume there is a menu.
    
    // Let's brute force search for 'nav_menu_item' posts and their titles.
    // INSERT INTO `...posts` ... 'nav_menu_item'
    
    console.log("Searching for nav_menu_items...");
    
    // We look for patterns like:
    // (3823, ..., 'Title', ..., 'nav_menu_item')
    // Title is usually index 5 (6th item)
    // Post Type is index 20 (21st item)
    
    // Since parsing is hard, let's just grep lines with 'nav_menu_item'
    // and try to extract the title string which is usually in quotes earlier in the tuple.
    
    const regex = /\((\d+),\s*\d+,\s*'[^']*',\s*'[^']*',\s*'[^']*',\s*'([^']*)',[^)]*'nav_menu_item'/g;
    
    let match;
    const items = [];
    while ((match = regex.exec(content)) !== null) {
        items.push({ id: match[1], title: match[2] });
    }
    
    console.log("--- Found Menu Candidates ---");
    console.table(items);
    
    // Now let's try to map them to the "Main Menu" term we found earlier if possible.
    // But typically there is only one main visible menu.
    // Let's filter for non-empty titles.
    
    const validItems = items.filter(i => i.title.trim() !== '');
    console.log("--- Labeled Items ---");
    console.table(validItems);
}

extractMenuTitles();
