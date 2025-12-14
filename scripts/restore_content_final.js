const fs = require('fs');
const readline = require('readline');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SQL_FILE = path.join(__dirname, 'arthyun.co.kr-20190410-062700-679', 'database.sql');
const ENV_FILE = path.join(__dirname, '../../../.env.local');

function getEnvVars() {
    const content = fs.readFileSync(ENV_FILE, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/"/g, '');
    });
    return env;
}

function parseValues(valueStr) {
    const values = [];
    let current = '';
    let inString = false;
    let escape = false;

    // Remove opening ( and closing )
    // valueStr passed is usually "1, ... " inside VALUES (...)
    
    for (let i = 0; i < valueStr.length; i++) {
        const char = valueStr[i];
        
        if (escape) {
            // Handle standard SQL escapes
            if (char === 'n') current += '\n';
            else if (char === 'r') current += '\r';
            else if (char === 't') current += '\t';
            else if (char === '0') current += '\0';
            else current += char; // literal for others like ' or " or \
            
            escape = false;
            continue;
        }

        if (char === '\\') {
            escape = true;
            continue;
        }

        if (char === "'") {
            inString = !inString;
            // Don't add the surrounding quotes to content? 
            // In SQL 'value', we want value.
            // But if we just toggle, we are skipping the quote char?
            // Wait, previous logic: if string, current += char?
            // "if char == ' ... inString = !inString; current += char;"
            // This kept the quotes in the output string.
            // But `values.push(current.trim().replace(/^'|'$/g, ''))` removed them later.
            // OK let's keep it simple: keep the quote, strip later.
            // But wait, if I have 'It\'s', the \' becomes ' via escape.
            // Then I have 'It's'.
            // The logic needs to be careful not to end string on the inner quote if it was escaped.
            // My escape logic runs BEFORE this check, so escaped quote is already handled and loop continues.
            // So unescaped quote toggles inString.
            // BUT: Do we want to keep the quote in `current`?
            // If I have 'A,B', and I parse, I want A,B as one value.
            // If I keep quotes: 'A,B'. Then I strip. OK.
            // But if I have 'A''B' (SQL escaped quote via doubling)? 
            // This parser doesn't handle '' -> '.
            // Let's assume backslash escaping which is standard for mysqldump.
            
            // I will NOT add the surrounding quotes to `current` to avoid ambiguous trimming later?
            // No, easiest is to capture everything and strip outer.
            current += char;
            continue;
        }

        if (char === ',' && !inString) {
            // End of value
            values.push(cleanValue(current));
            current = '';
        } else {
            current += char;
        }
    }
    values.push(cleanValue(current));
    
    return values;
}

function cleanValue(val) {
    val = val.trim();
    if (val.startsWith("'") && val.endsWith("'")) {
        return val.slice(1, -1);
    }
    return val;
}

function extractSQLRows(line) {
    const startIdx = line.indexOf('VALUES (');
    if (startIdx === -1) return [];

    let rawValues = line.substring(startIdx + 8).trim(); 
    if (rawValues.endsWith(';')) rawValues = rawValues.slice(0, -1);
    if (rawValues.endsWith(')')) rawValues = rawValues.slice(0, -1);
    
    // rawValues is "1, ... " (one tuple assumed per line for this file based on checking)
    return [parseValues(rawValues)];
}

async function run() {
    const env = getEnvVars();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const fileStream = fs.createReadStream(SQL_FILE);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const itemsToUpsert = [];

    console.log("Scanning SQL Dump for Post 9 and Media posts...");

    for await (const line of rl) {
        if (line.trim().startsWith('INSERT INTO `SERVMASK_PREFIX_posts`')) {
            const rows = extractSQLRows(line);
            
            for (const cols of rows) {
                if (cols.length < 21) continue;

                const id = parseInt(cols[0]);
                const type = cols[20];
                const status = cols[7];
                const title = cols[5];

                // 1. Post 9 (About)
                if (id === 9) {
                    console.log("Found Post 9 (About)!");
                    itemsToUpsert.push({
                        id: id,
                        author: cols[1],
                        date: cols[2],
                        content: cols[4],
                        title: title,
                        excerpt: cols[6],
                        status: status,
                        slug: cols[11] || 'about',
                        type: 'page'
                    });
                }
                
                // 2. Media Posts (type='post' and status='publish')
                if (type === 'post' && status === 'publish' && title !== 'Hello world!') {
                     // Exclude "상단영역" etc if needed
                     if (title.includes('상단영역')) continue;
                     
                     itemsToUpsert.push({
                        id: id,
                        author: cols[1],
                        date: cols[2],
                        content: cols[4],
                        title: title,
                        excerpt: cols[6],
                        status: status,
                        slug: cols[11],
                        type: 'post'
                    });
                }
            }
        }
    }
    
    console.log(`Found ${itemsToUpsert.length} items to restore.`);
    if (itemsToUpsert.length > 0) {
        console.log("First item preview:", itemsToUpsert[0].title);
    }
    
    // Upsert to Supabase
    for (const item of itemsToUpsert) {
        const { error } = await supabase.from('migrated_posts').upsert(item);
        if (error) console.error(`Failed to upsert ${item.id}:`, error.message);
        else console.log(`Restored: ${item.title} (${item.id})`);
    }
}

run();
