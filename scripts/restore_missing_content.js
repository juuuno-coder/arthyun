const fs = require('fs');
const readline = require('readline');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SQL_PATH = path.join(__dirname, 'arthyun.co.kr-20190410-062700-679/database.sql');
const ENV_FILE = path.join(__dirname, '../.env.local');

function getEnvVars() {
    try {
        const content = fs.readFileSync(ENV_FILE, 'utf8');
        const env = {};
        content.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/"/g, '');
        });
        return env;
    } catch (e) {
        console.error("Error reading .env.local:", e);
        return {};
    }
}

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

async function restoreMissing() {
    console.log(`Starting restoration from: ${SQL_PATH}`);
    
    // 1. Setup Supabase
    const env = getEnvVars();
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
        console.log("Warning: Using ANON KEY. This might fail if RLS blocks insert. Prefer SERVICE_ROLE_KEY for admin tasks.");
    }
    const supabase = createClient(
        env.NEXT_PUBLIC_SUPABASE_URL, 
        env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // 2. Read SQL
    const fileStream = fs.createReadStream(SQL_PATH);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const toInsert = [];

    for await (const line of rl) {
        if (line.trim().startsWith('INSERT INTO `SERVMASK_PREFIX_posts`')) {
            const startIdx = line.indexOf('VALUES (');
            if (startIdx === -1) continue;
            
            let inner = line.substring(startIdx + 8).trim();
            if (inner.endsWith(');')) inner = inner.slice(0, -2);
            
            const cols = parseValues(inner);
            
            if (cols.length > 20) {
                const id = cols[0];
                const date = cols[2];
                let content = cols[4];
                const title = cols[5];
                const excerpt = cols[6];
                const status = cols[7];
                const slug = cols[11];
                const guid = cols[18]; // Usually GUID is col 18
                const type = cols[20];
                
                let shouldRestore = false;

                // Condition A: Draft Portfolios (The 7 items)
                if (type === 'portfolio' && status === 'draft') {
                    shouldRestore = true;
                }

                // Condition B: Attachments (The 237 items)
                // User wants them as 'posts' to manage.
                if (type === 'attachment' && status === 'inherit') {
                    shouldRestore = true;
                    // Enhance content for attachment to show the image/file
                    // Using GUID which is usually the original URL
                    // We wrap it in an img tag if it looks like an image, or link otherwise
                    const isImage = guid.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                    const mediaHtml = isImage 
                        ? `<img src="${guid}" alt="${title}" style="max-width:100%;" /><br/>` 
                        : `<a href="${guid}" target="_blank">Download File</a><br/>`;
                    
                    content = mediaHtml + "\n" + (content || ""); // Prepend to existing description
                }

                if (shouldRestore) {
                    // Sanitize content (basic unescape)
                    content = content.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\"/g, '"').replace(/\\'/g, "'");
                    
                    toInsert.push({
                        id: parseInt(id), // Keep original ID
                        title: title || '(No Title)',
                        content: content,
                        excerpt: excerpt,
                        date: date,
                        slug: slug || `restored-${id}`,
                        type: type, // Keep 'portfolio' or 'attachment'
                        status: status // 'draft' or 'inherit'
                    });
                }
            }
        }
    }

    console.log(`Found ${toInsert.length} items to restore.`);
    
    // 3. Batch Insert
    // Supabase usually handles specific ID inserts if we don't conflict.
    // We should use `upsert` or check existence? 
    // `upsert` is safer but might overwrite if we are not careful. 
    // Since these are "missing", they shouldn't exist. Upsert is fine.
    
    // Insert in chunks of 50
    const CHUNK_SIZE = 50;
    for (let i = 0; i < toInsert.length; i += CHUNK_SIZE) {
        const chunk = toInsert.slice(i, i + CHUNK_SIZE);
        console.log(`Inserting chunk ${i} to ${i + chunk.length}...`);
        
        const { error } = await supabase
            .from('migrated_posts')
            .upsert(chunk, { onConflict: 'id' });
            
        if (error) {
            console.error("Error inserting chunk:", error.message);
        } else {
            console.log("Success.");
        }
    }
    
    console.log("Restoration Complete!");
}

restoreMissing();
