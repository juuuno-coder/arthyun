const fs = require('fs');
const path = require('path');

const SQL_FILE = path.join(__dirname, 'arthyun.co.kr-20190410-062700-679', 'database.sql');

async function extractAbout() {
    const content = fs.readFileSync(SQL_FILE, 'utf8');
    
    // Find ID of post with title 'About' and type 'page'
    // Regex is tricky, let's scan.
    
    // Pattern: (ID, ..., 'About', ..., 'page', ...)
    // But title is usually earlier.
    
    // Let's dump surrounding lines of 'About'
    const index = content.indexOf("'About'");
    if (index !== -1) {
        console.log("--- Snippet around 'About' ---");
        console.log(content.substring(index - 100, index + 300));
        
        // Try to find the start of the tuple
        const tupleStart = content.lastIndexOf('(', index);
        if (tupleStart !== -1) {
            console.log("--- Tuple Start ---");
            console.log(content.substring(tupleStart, tupleStart + 500));
        }
    }
}

extractAbout();
