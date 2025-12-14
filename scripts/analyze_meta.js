const fs = require('fs');
const readline = require('readline');
const path = require('path');

const SQL_FILE = path.join(__dirname, 'arthyun.co.kr-20190410-062700-679', 'database.sql');
const TARGET_POST_ID = 3952;

async function analyzePostMeta() {
    const fileStream = fs.createReadStream(SQL_FILE);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    console.log(`Searching for postmeta for post_id ${TARGET_POST_ID}...`);

    let inPostMeta = false;
    let metaFound = [];

    for await (const line of rl) {
        if (line.includes('INSERT INTO `SERVMASK_PREFIX_postmeta`')) {
            inPostMeta = true;
        }

        if (inPostMeta) {
            // Regex to match (meta_id, post_id, meta_key, meta_value)
            // Value can be complex, so simple regex might fail on complex serialized data,
            // but for simple keys it's fine.
            // Data format: (1, 2, 'key', 'value')
            
            // We just look for the post_id pattern in the line
            if (line.includes(`, ${TARGET_POST_ID},`)) {
                 // Naive split by ),( might break if content has it, but let's try to just dump the line first?
                 // Actually this file seems to have one INSERT statement with MANY values.
                 // So we have to parse the huge line if it's one line. 
                 // But typically dumps usually have multiple inserts or batched.
                 
                 // If it is one huge line, we are in trouble with simple regex.
                 // Let's assume standard mysqldump extended inserts.
                 
                 // Let's try to match specifically `(number, 4327, 'key', 'val')`
                 const regex = new RegExp(`\\(\\d+, ${TARGET_POST_ID}, '([^']+)', '([^']*)'\\)`, 'g');
                 let match;
                 while ((match = regex.exec(line)) !== null) {
                     metaFound.push({ key: match[1], value: match[2] });
                 }
                 
                 // Also match value enclosed in quotes that might be serialized (basic check)
                 // This is fragile but let's see.
            }
        }
        
        if (line.includes('UNLOCK TABLES')) {
            inPostMeta = false;
        }
    }

    console.log('--- Meta Found ---');
    console.table(metaFound);
}

analyzePostMeta();
