const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
// glob not used, using recursive directory walk

// We can use a recursive find helper since glob might not be available in environment.

// Paths
const ENV_FILE = path.join(__dirname, '../../../.env.local');
const UPLOADS_DIR = path.join(__dirname, '../www/wp-content/uploads');

function getEnvVars() {
    if (!fs.existsSync(ENV_FILE)) {
        process.exit(1);
    }
    const content = fs.readFileSync(ENV_FILE, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const val = parts.slice(1).join('=').trim().replace(/"/g, ''); 
            env[key] = val;
        }
    });
    return env;
}

function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case '.jpg':
        case '.jpeg': return 'image/jpeg';
        case '.png': return 'image/png';
        case '.gif': return 'image/gif';
        case '.svg': return 'image/svg+xml';
        default: return 'application/octet-stream';
    }
}

// Build a file index: fileName -> fullPath
function buildFileIndex(dir, index = {}) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            buildFileIndex(fullPath, index);
        } else {
            // NFC normalize for consistent matching
            index[file.normalize('NFC')] = fullPath;
        }
    }
    return index;
}

async function migrateImagesFuzzy() {
    const env = getEnvVars();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const BUCKET_NAME = 'migration_uploads';

    console.log('Building file index...');
    const fileIndex = buildFileIndex(UPLOADS_DIR);
    console.log(`Indexed ${Object.keys(fileIndex).length} files.`);

    console.log('Fetching portfolio posts...');
    const { data: posts, error } = await supabase
        .from('migrated_posts')
        .select('id, content, title')
        .eq('type', 'portfolio');

    if (error) return console.error(error);

    let updatedCount = 0;

    for (const post of posts) {
        if (!post.content) continue;
        let content = post.content;
        let pChanged = false;

        // Pattern: http://arthyun.co.kr/wp-content/uploads/...
        // Note: Some URLs might be escaped/encoded in content
        const matches = [...content.matchAll(/http:\/\/arthyun\.co\.kr\/wp-content\/uploads\/([^"'\s<>\)]+)/g)];
        
        if (matches.length > 0) {
             console.log(`Post [${post.title}] has ${matches.length} image candidates.`);
             
             // DEBUG: Break after first post
             // break; // Wait, I need to process the items inside loop first.
        }

        for (const match of matches) {
            // ... (existing code)
            const fullUrl = match[0];
            const relativeUrlPath = match[1]; 
            
            // 1. Try exact decode
            let rawFilename = relativeUrlPath.split('/').pop();
            let filename = decodeURIComponent(rawFilename).normalize('NFC');
            
            console.log(`Checking: ${filename} (Raw: ${rawFilename})`);
            // ...
            
            // 2. Lookup in index
            let localPath = fileIndex[filename];
            
            if (!localPath) {
                 console.log(`  FileIndex keys sample:`, Object.keys(fileIndex).slice(0, 5));
                 console.log(`  Is filename in keys?`, filename in fileIndex);
                 // Check if it's in keys but maybe normalization issue?
                 // Let's try to find if ANY key contains part of the filename?
                 // Too expensive for loop.
            }
            
            // ... (rest of logic)
        }

        if (pChanged) {
            await supabase.from('migrated_posts').update({ content: content }).eq('id', post.id);
            updatedCount++;
        }
        
        // if (matches.length > 0) return; // Exit after processing one post
    }
    
    console.log(`Fuzzy migration done. Updated ${updatedCount} posts.`);
}

migrateImagesFuzzy().catch(console.error);
