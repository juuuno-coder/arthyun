const fs = require('fs');
const path = require('path');

const SQL_FILE = path.join(__dirname, 'arthyun.co.kr-20190410-062700-679', 'database.sql');

function debugParser() {
    console.log("Reading SQL file...");
    const content = fs.readFileSync(SQL_FILE, 'utf8');
    
    // Find Postmeta insert
    const startIdx = content.indexOf('INSERT INTO `SERVMASK_PREFIX_postmeta`');
    if (startIdx === -1) {
        console.log("Could not find postmeta insert statement");
        return;
    }
    
    console.log(`Found postmeta insert at index ${startIdx}`);
    
    // Grab a chunk to look at
    const snippet = content.substring(startIdx, startIdx + 1000);
    console.log("--- Snippet ---");
    console.log(snippet);
    console.log("---------------");
    
    // Try regex again with known content structure
    // We expect: VALUES (1, 2, 'key', 'val'), (3, 4, 'key', 'val')...
    
    // Extract everything between VALUES and ;
    const valuesStart = content.indexOf('VALUES', startIdx);
    const valuesEnd = content.indexOf(';', valuesStart);
    
    if (valuesStart === -1 || valuesEnd === -1) {
        console.log("Could not localize VALUES block");
        return;
    }
    
    const valuesBlock = content.substring(valuesStart + 7, valuesEnd);
    console.log(`Values block length: ${valuesBlock.length}`);
    
    // Check if 4327 is in there
    if (valuesBlock.includes('4327')) {
        console.log("ID 4327 exists in postmeta values.");
    } else {
        console.log("ID 4327 NOT found in postmeta values.");
    }
    
    // Let's grab context around 4327
    const idIdx = valuesBlock.indexOf('4327');
    if (idIdx !== -1) {
        console.log("Context around 4327:");
        console.log(valuesBlock.substring(idIdx - 50, idIdx + 200));
    }
}

debugParser();
