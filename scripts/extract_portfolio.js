const fs = require('fs');
const readline = require('readline');

const SQL_FILE = 'public/backup/extracted/arthyun.co.kr-20190410-062700-679/database.sql';
const OUTPUT_FILE = 'public/backup/extracted/portfolio.json';

// Simple SQL Value Parser
function parseValues(valueStr) {
    const values = [];
    let current = '';
    let inString = false;
    let escape = false;

    // Remove opening ( and closing )
    // The line usually looks like: VALUES (1, ... );
    // We assume valueStr passed here is the inner part: "1, ... "
    
    for (let i = 0; i < valueStr.length; i++) {
        const char = valueStr[i];
        
        if (escape) {
            current += char;
            escape = false;
            continue;
        }

        if (char === '\\') {
            current += char;
            escape = true; // Next char is literal
            continue;
        }

        if (char === "'") {
            // Check for SQL quote escaping: '' is a literal ' inside a string? 
            // But usually backslash is used in standard dumps or '' in pure SQL.
            // WP dumps usually use mysqldump which escapes with backslash usually? 
            // Let's assume standard behavior: toggle inString.
            inString = !inString;
            current += char;
            continue;
        }

        if (char === ',' && !inString) {
            values.push(current.trim().replace(/^'|'$/g, '')); // Remove outer quotes
            current = '';
        } else {
            current += char;
        }
    }
    // Push last value
    values.push(current.trim().replace(/^'|'$/g, ''));
    
    return values;
}

// Better parser that handles the line context
function extractSQLRows(line) {
    // Finds "VALUES (...);" or "VALUES (...), (...);"
    // We assume one INSERT per line widely used in this dump based on previous `view_file`
    // Line starts: INSERT INTO `...` VALUES (...);
    
    const startIdx = line.indexOf('VALUES (');
    if (startIdx === -1) return [];

    const rawValues = line.substring(startIdx + 8).trim(); 
    // Now we have "1, ... );" or "1, ...), (2, ...);"
    // This is hard to split if multiple tuples exist. 
    // Let's iterate.
    
    const rows = [];
    let currentRow = [];
    let currentVal = '';
    let inString = false;
    let escape = false;
    let bracketDepth = 0; // for () inside? SQL values usually don't have nested parens unless function calls? WP dump usually raw data.
    
    // We want to split by ")," which indicates end of a tuple?
    // Let's implement character walk for the whole string.
    
    // Actually, simple regex to find the `), (` separator is risky.
    // Let's stick to the single tuple per line assumption if valid?
    // Step 355 showed: `INSERT ... VALUES (1, ...);`
    // Step 355 lines were huge. This implies 1 row per line?? 
    // Wait, line 7909 starts with INSERT and ends with );
    // Line 7910 starts with INSERT and ends with );
    // It seems it generates one INSERT statement per row in this dump (common for readability or specific flags).
    // If multiple rows were combined, we'd see `INSERT ... VALUES (..), (..), (..);`
    // Let's assume 1 row per line based on view.
    
    // We strip the trailing ");" or ";" and leading "("?
    // Actually, `parseValues` above assumes a comma sep list.
    // The string to parse is everything inside `VALUES (...)`.
    
    const innerContent = rawValues.replace(/^\(/, '').replace(/\);$/, '');
    return [parseValues(innerContent)];
}


async function extract() {
    const fileStream = fs.createReadStream(SQL_FILE);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const portfolios = [];

    for await (const line of rl) {
        if (line.trim().startsWith('INSERT INTO `SERVMASK_PREFIX_posts`')) {
            const rows = extractSQLRows(line);
            
            for (const cols of rows) {
                // Check if we parsed enough columns?
                // Schema has ~23 columns.
                // 21st column (index 20) is post_type
                
                if (cols.length < 21) {
                    console.log('Skipping malformed row, length:', cols.length);
                    continue;
                }
                
                const type = cols[20];
                const status = cols[7];
                
                if (type === 'portfolio' && status === 'publish') {
                   // Map format for Supabase
                   // id (0), author(1), date(2), content(4), title(5), excerpt(6), status(7), slug(11), type(20)
                   portfolios.push({
                       id: cols[0],
                       author: cols[1],
                       date: cols[2],
                       content: cols[4].replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\"/g, '"').replace(/\\'/g, "'"), 
                       // Unescape SQL text which might be double escaped in JSON later? 
                       // The parser kept the raw string. JS strings need unescaping if they were SQL escaped.
                       // parseValues already includes raw chars. 
                       // Check: "Hello \'World\'" -> parseValues keeps \'? No, I handled escape. 
                       // Actually my parseValues loop handles `\'`->`'` if I implemented it right.
                       // Re-checking parseValues logic:
                       // if char is \ -> escape=true. Next char is added literally.
                       // So `\'` becomes `'` in `current`. Correct.
                       // But double check `\\n`? `\` then `n` -> `n`. No, `\n` is literal newline char?
                       // In SQL string: 'line1\nline2'. JS stream reads `\` then `n`?
                       // If the file text is literal backslash + n, we get `\` then `n`.
                       // My parser: `\` sets escape. Next `n` is appended. Result `n`. 
                       // So `\n` becomes `n`? That's wrong for newlines.
                       // `\n` in SQL usually means newline.
                       // I should probably map common escapes: \n, \r, \t, etc.
                       
                       title: cols[5],
                       excerpt: cols[6],
                       status: cols[7],
                       slug: cols[11],
                       type: cols[20]
                   });
                }
            }
        }
    }

    console.log(`Extracted ${portfolios.length} portfolio items.`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(portfolios, null, 2));
}

extract();
