const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Paths
const ENV_FILE = path.join(__dirname, '../../../.env.local');
const UPLOADS_DIR = path.join(__dirname, '../www/wp-content/uploads');

function getEnvVars() {
    if (!fs.existsSync(ENV_FILE)) process.exit(1);
    const content = fs.readFileSync(ENV_FILE, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/"/g, ''); 
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
        default: return 'application/octet-stream';
    }
}

function toHex(str) {
    let result = '';
    for (let i = 0; i < str.length; i++) {
        result += str.charCodeAt(i).toString(16).padStart(4, '0') + ' ';
    }
    return result;
}

function buildFileIndex(dir, index = {}, limit = 5) {
    const files = fs.readdirSync(dir);
    let count = 0;
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            buildFileIndex(fullPath, index);
        } else {
            // Index BOTH NFC and NFD
            index[file.normalize('NFC')] = fullPath;
            index[file.normalize('NFD')] = fullPath;
            
            if (file.includes('문화가')) {
                console.log(`[FS Found] ${file}`);
                console.log(`[FS Hex] ${toHex(file)}`);
            }
        }
    }
    return index;
}

async function debugMigration() {
    const env = getEnvVars();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const BUCKET_NAME = 'migration_uploads';

    console.log('Building file index...');
    const fileIndex = buildFileIndex(UPLOADS_DIR);
    console.log(`Indexed ${Object.keys(fileIndex).length} keys.`);

    // Fetch specific post
    const { data: posts, error } = await supabase
        .from('migrated_posts')
        .select('*')
        .eq('id', 3952) // Explicit ID
        .limit(1);

    if (error) return console.error(error);
    if (!posts || posts.length === 0) return console.log('Post not found');

    const post = posts[0];
    console.log(`Target Post: ${post.title} (ID: ${post.id})`);
    
    const content = post.content;
    const matches = [...content.matchAll(/http:\/\/arthyun\.co\.kr\/wp-content\/uploads\/([^"'\s<>\)]+)/g)];
    
    console.log(`Found ${matches.length} matches in content.`);

    for (const match of matches) {
        const fullUrl = match[0];
        const relativeUrlPath = match[1];
        
        let filename = decodeURIComponent(relativeUrlPath.split('/').pop());
        console.log(`[DB Target] ${filename}`);
        console.log(`[DB Hex] ${toHex(filename)}`);
        
        let localPath = fileIndex[filename.normalize('NFC')] || fileIndex[filename.normalize('NFD')];
        
        if (localPath) {
            console.log(`MATCH SUCCESS! Path: ${localPath}`);
            // Attempt upload
            try {
                const fileBody = fs.readFileSync(localPath);
                const uploadPath = `restored/${post.id}/${path.basename(localPath)}`;
                const { error: upErr } = await supabase.storage.from(BUCKET_NAME).upload(uploadPath, fileBody, {
                    contentType: getMimeType(localPath),
                    upsert: true
                });
                
                if (upErr) console.error('Upload Error:', upErr);
                else console.log('Upload Success');
            } catch (e) { console.error(e); }
        } else {
            console.log('MATCH FAILED');
            // Try fuzzy?
            const originalFilename = filename.replace(/-\d+x\d+(\.[a-zA-Z]+)$/, '$1');
            console.log(`[Fuzzy Target] ${originalFilename}`);
            localPath = fileIndex[originalFilename.normalize('NFC')];
            if (localPath) {
                console.log(`FUZZY MATCH SUCCESS! Path: ${localPath}`);
                 // Attempt upload
                try {
                    const fileBody = fs.readFileSync(localPath);
                    const uploadPath = `restored/${post.id}/${path.basename(localPath)}`;
                    const { error: upErr } = await supabase.storage.from(BUCKET_NAME).upload(uploadPath, fileBody, {
                        contentType: getMimeType(localPath),
                        upsert: true
                    });
                    
                    if (upErr) console.error('Upload Error:', upErr);
                    else console.log('Upload Success');
                } catch (e) { console.error(e); }
            } else {
                console.log('FUZZY MATCH FAILED');
            }
        }
    }
}

debugMigration();
