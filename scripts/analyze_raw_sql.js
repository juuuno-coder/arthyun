const fs = require('fs');
const readline = require('readline');
const path = require('path');

// Determine path to SQL file
// Based on previous tool output, it's in public/backup/extracted/... or similar
// Let's use the absolute path I saw earlier or relative to scripts
const SQL_PATH = path.join(__dirname, 'arthyun.co.kr-20190410-062700-679/database.sql');

function parseValues(valueStr) {
    const values = [];
    let current = '';
    let inString = false;
    let escape = false;

    for (let i = 0; i < valueStr.length; i++) {
        const char = valueStr[i];
        
        if (escape) {
            current += char;
            escape = false;
            continue;
        }

        if (char === '\\') {
            current += char;
            escape = true;
            continue;
        }

        if (char === "'") {
            inString = !inString;
            current += char;
            continue;
        }

        if (char === ',' && !inString) {
            values.push(current.trim().replace(/^'|'$/g, ''));
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current.trim().replace(/^'|'$/g, ''));
    return values;
}

async function analyzeRawSql() {
    console.log(`Analyzing raw SQL file: ${SQL_PATH}`);
    
    if (!fs.existsSync(SQL_PATH)) {
        console.error("SQL file not found!");
        return;
    }

    const fileStream = fs.createReadStream(SQL_PATH);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const stats = {};
    let totalRows = 0;
    
    // We also want to capture sample titles for each type/status combo to identify them
    const samples = {};

    for await (const line of rl) {
        if (line.trim().startsWith('INSERT INTO `SERVMASK_PREFIX_posts`')) {
            const startIdx = line.indexOf('VALUES (');
            if (startIdx === -1) continue;
            
            // Extract the content inside VALUES (...)
            // Assuming simplified 1 row per line for this specific dump format
            let inner = line.substring(startIdx + 8).trim();
            if (inner.endsWith(');')) inner = inner.slice(0, -2);
            
            const cols = parseValues(inner);
            
            // Check column count roughly (WP posts usually has many)
            if (cols.length > 20) {
                const type = cols[20];
                const status = cols[7];
                const title = cols[5];
                
                const key = `[${type}] ${status}`;
                stats[key] = (stats[key] || 0) + 1;
                totalRows++;
                
                if (type === 'attachment') {
                    const parentId = cols[17];
                    const guid = cols[18];
                    if (!samples[key]) samples[key] = [];
                    if (samples[key].length < 10) samples[key].push(`ID:${cols[0]} | Parent:${parentId} | GUID:${guid}`);
                } else {
                    if (!samples[key]) samples[key] = [];
                    if (samples[key].length < 3) samples[key].push(`(${cols[0]}) ${title}`);
                }
            }
        }
    }

    let output = `\n=== RAW SQL DUMP ANALYSIS ===\nTotal Rows in 'posts' table: ${totalRows}\n\n--- Distribution (Type & Status) ---\n`;
    
    const sortedKeys = Object.keys(stats).sort();
    sortedKeys.forEach(key => {
        output += `\n${key}: ${stats[key]} items\n`;
        output += "   Samples:\n";
        samples[key].forEach(s => output += `   - ${s}\n`);
    });

    const outPath = path.join(__dirname, 'final_sql_analysis.txt');
    fs.writeFileSync(outPath, output);
    console.log(`Analysis saved to ${outPath}`);
}

analyzeRawSql();
