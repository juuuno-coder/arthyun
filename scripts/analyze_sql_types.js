const fs = require('fs');
const readline = require('readline');

const SQL_FILE = 'public/backup/extracted/arthyun.co.kr-20190410-062700-679/database.sql';

async function analyze() {
    const fileStream = fs.createReadStream(SQL_FILE);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const typeCounts = {};

    for await (const line of rl) {
        if (line.trim().startsWith('INSERT INTO `SERVMASK_PREFIX_posts`')) {
            // content might contain anything, so parsing from start is hard.
            // But the end structure is relatively stable:
            // ... , 'post_type', 'post_mime_type', comment_count );
            // Note: mime type can optionally be empty string ''
            // Regex to capture the 3rd to last quoted string or value?
            // Actually, let's just look for the known pattern at the end.
            
            // Example: ... 'http://url', 0, 'post', '', 1);
            // Matches: , 'post', '', 1);
            
            const match = line.match(/,\s*'([^']+)'\s*,\s*'[^']*'\s*,\s*-?\d+\s*\);$/);
            if (match) {
                const type = match[1];
                typeCounts[type] = (typeCounts[type] || 0) + 1;
            } else {
                // Try matching numbers if type is not quoted? (Unlikely for varchar)
                // Maybe match failure due to mime type containing something weird?
                // Or maybe whitespace variations.
                // console.log('No match:', line.substring(line.length - 100));
            }
        }
    }

    console.log('Post Types in SQL:', typeCounts);
}

analyze();
