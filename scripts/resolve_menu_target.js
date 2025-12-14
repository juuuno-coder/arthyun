const fs = require('fs');
const path = require('path');

const SQL_FILE = path.join(__dirname, 'arthyun.co.kr-20190410-062700-679', 'database.sql');

async function resolveMenuLink() {
    const content = fs.readFileSync(SQL_FILE, 'utf8');
    
    // Find meta for 3833
    // (.., 3833, '_menu_item_object_id', 'TARGET_ID')
    
    const regex = /\(\d+,\s*3833,\s*'_menu_item_object_id',\s*'(\d+)'\)/;
    const match = content.match(regex);
    
    if (match) {
        const targetId = match[1];
        console.log(`TARGET_ID:${targetId}`);
        
        // Now find content of that target ID
        // (ID, ..., 'Content', ...)
        // Since content can be huge, let's just find the start position
        
        const postInsertStart = content.indexOf(`(${targetId},`);
        if (postInsertStart !== -1) {
            console.log("--- Content Snippet of Target Page ---");
            // Basic extraction: grab 2000 chars
            console.log(content.substring(postInsertStart, postInsertStart + 2000));
        } else {
             console.log("Could not find post definition.");
        }
    } else {
        console.log("Could not resolve menu target.");
    }
}

resolveMenuLink();
