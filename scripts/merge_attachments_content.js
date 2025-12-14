const fs = require('fs');
const readline = require('readline');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SQL_PATH = path.join(__dirname, 'arthyun.co.kr-20190410-062700-679/database.sql');
const ENV_FILE = path.join(__dirname, '../.env.local');

const STORAGE_URL = "https://kvsadfmyikjrvmjsmnsm.supabase.co/storage/v1/object/public/migration_uploads"; // derived from user env usually, but I'll fetch from env file if possible or hardcode based on known value? 
// User env is in .env.local.
// I will read env to get PROJECT_URL.

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
        if (escape) { current += char; escape = false; continue; }
        if (char === '\\') { current += char; escape = true; continue; }
        if (char === "'") { inString = !inString; current += char; continue; }
        if (char === ',' && !inString) { values.push(current.trim().replace(/^'|'$/g, '')); current = ''; } 
        else { current += char; }
    }
    values.push(current.trim().replace(/^'|'$/g, ''));
    return values;
}

function getCorrectImageUrl(originalUrl) {
    // Logic from ArchivePage
    // Remove /wp-content/uploads/ prefix and map to STORAGE_URL
    const match = originalUrl.match(/\/wp-content\/uploads\/(.+)$/);
    if (match) {
        const relativePath = match[1];
        let encodedPath = relativePath;
        try {
            const decoded = decodeURIComponent(relativePath);
            encodedPath = decoded.split('/').map(p => encodeURIComponent(p)).join('/');
        } catch (e) { }
        
        // Use env var ideally, but for script I need to construct it.
        // Assuming env is loaded.
        return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/migration_uploads/${encodedPath}`;
    }
    return originalUrl; // Fallback
}

async function mergeAttachments() {
    const env = getEnvVars();
    process.env.NEXT_PUBLIC_SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL; // For helper
    
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("Missing credentials.");
        return;
    }

    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    console.log("Connected to Supabase.");

    // 1. Build Map from SQL: AttachmentID -> ParentID
    console.log("Scanning SQL for Parent relationships...");
    const parentMap = new Map(); // ID -> ParentID
    const guidMap = new Map(); // ID -> OriginalURL (fallback)

    const fileStream = fs.createReadStream(SQL_PATH);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    for await (const line of rl) {
        if (line.trim().startsWith('INSERT INTO `SERVMASK_PREFIX_posts`')) {
            const startIdx = line.indexOf('VALUES (');
            if (startIdx === -1) continue;
            let inner = line.substring(startIdx + 8).trim();
            if (inner.endsWith(');')) inner = inner.slice(0, -2);
            
            const cols = parseValues(inner);
            if (cols.length > 20) {
                const id = parseInt(cols[0]);
                const parentId = parseInt(cols[17]);
                const guid = cols[18];
                const type = cols[20];
                
                if (type === 'attachment' && parentId > 0) {
                    parentMap.set(id, parentId);
                    guidMap.set(id, guid);
                }
            }
        }
    }
    console.log(`Found ${parentMap.size} attachments with parents.`);

    // 2. Fetch all Migrated Posts (Parents and Attachments)
    const { data: allPosts, error } = await supabase
        .from('migrated_posts')
        .select('*');

    if (error) {
        console.error("Fetch error:", error);
        return;
    }

    // Index existing posts by ID for lookup
    const postMap = new Map();
    allPosts.forEach(p => postMap.set(p.id, p));

    const updates = [];
    const mergedIds = [];

    // 3. Process Merging
    for (const attach of allPosts) {
        if (attach.type === 'attachment') {
            const parentId = parentMap.get(attach.id);
            
            if (parentId) {
                const parent = postMap.get(parentId);
                if (parent) {
                    // Found Parent!
                    // Construct Image HTML
                    // Extract URL from attachment content (or use GUID map)
                    let imgUrl = guidMap.get(attach.id);
                    // Or parse from content if I injected it earlier
                    const match = attach.content?.match(/src="([^"]+)"/);
                    if (match) imgUrl = match[1];

                    if (imgUrl) {
                        const correctUrl = getCorrectImageUrl(imgUrl);
                        const imgHtml = `<p><img src="${correctUrl}" alt="${attach.title}" style="max-width:100%; display:block; margin: 20px auto;" /></p>`;
                        
                        // Append to Parent Content
                        parent.content = (parent.content || "") + "\n" + imgHtml;
                        
                        // Mark Parent for Update
                        // We might update same parent multiple times, so update the object in map
                        // and push unique parents to update list later
                    }
                    
                    // Mark Attachment for "Deletion" (Merge status)
                    attach.status = 'merged';
                    updates.push(attach);
                    mergedIds.push(attach.id);
                }
            }
        }
    }

    // Collect modified parents
    const modifiedParents = Array.from(postMap.values()).filter(p => {
        // Check if content changed? 
        // Comparing with original is hard unless we stored original.
        // Actually, I modified p.content in place above.
        // But `allPosts` are the original objects.
        // I need to identify which parents were touched.
        // Let's iterate `mergedIds`, find their parents, add to set.
        return false; // logic changed below
    });
    
    // Better way:
    const parentsToUpdate = new Set();
    mergedIds.forEach(attId => {
        const pId = parentMap.get(attId);
        if (postMap.has(pId)) parentsToUpdate.add(postMap.get(pId));
    });

    console.log(`merging ${mergedIds.length} attachments into ${parentsToUpdate.size} parents.`);

    // 4. Batch Update Parents
    // We update content.
    let updateCount = 0;
    for (const p of parentsToUpdate) {
        const { error } = await supabase
            .from('migrated_posts')
            .update({ content: p.content })
            .eq('id', p.id);
            
        if (error) console.error(`Failed to update parent ${p.id}:`, error);
        else updateCount++;
    }
    console.log(`Updated ${updateCount} parents.`);

    // 5. Batch Update Attachments (Hide them)
    // Set status = 'merged'
    if (mergedIds.length > 0) {
        // Chunk it
        for (let i = 0; i < mergedIds.length; i += 50) {
            const chunk = mergedIds.slice(i, i + 50);
            const { error } = await supabase
                .from('migrated_posts')
                .update({ status: 'merged' })
                .in('id', chunk);
                
            if (error) console.error("Failed to hide attachments:", error);
            else console.log(`Marked ${chunk.length} attachments as merged.`);
        }
    }
    
    console.log("Merge Complete!");
}

mergeAttachments();
