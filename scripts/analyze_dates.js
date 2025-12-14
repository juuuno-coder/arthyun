const fs = require('fs');
const readline = require('readline');
const path = require('path');

const SQL_PATH = path.join(__dirname, 'arthyun.co.kr-20190410-062700-679/database.sql');

function parseValues(valueStr) {
    const values = [];
    let current = '';
    let inString = false;
    let escape = false;
    for (let i = 0; i < valueStr.length; i++) {
        const char = valueStr[i];
        if (escape) { current += char; escape = false; continue; }
        if (char === '\\') { current += char; escape = true; continue; }
        if (char === "'") { inString = !inString; current += char; continue; }
        if (char === ',' && !inString) { values.push(current.trim().replace(/^'|'$/g, '')); current = ''; } 
        else { current += char; }
    }
    values.push(current.trim().replace(/^'|'$/g, ''));
    return values;
}

async function checkDbDates() {
    console.log(`Checking dates in: ${SQL_PATH}`);
    
    const fileStream = fs.createReadStream(SQL_PATH);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let minDate = '9999-99-99';
    let maxDate = '0000-00-00';
    let rowCount = 0;

    for await (const line of rl) {
        if (line.trim().startsWith('INSERT INTO `SERVMASK_PREFIX_posts`')) {
            const startIdx = line.indexOf('VALUES (');
            if (startIdx === -1) continue;
            let inner = line.substring(startIdx + 8).trim();
            if (inner.endsWith(');')) inner = inner.slice(0, -2);
            
            const cols = parseValues(inner);
            if (cols.length > 20) {
                const date = cols[2]; // post_date
                // Date format usually 'YYYY-MM-DD HH:mm:ss'
                if (date.length > 10) {
                    if (date < minDate && date > '1990-01-01') minDate = date;
                    if (date > maxDate) maxDate = date;
                }
                rowCount++;
            }
        }
    }

    console.log(`Analyzed ${rowCount} rows.`);
    console.log(`Earliest Post: ${minDate}`);
    console.log(`Latest Post:   ${maxDate}`);
}

checkDbDates();
