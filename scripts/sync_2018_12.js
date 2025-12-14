const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
// const mime = require('mime-types'); // Removed

const ENV_FILE = path.join(__dirname, '../../../.env.local');
const LOCAL_ROOT = path.join(__dirname, '../www/wp-content/uploads');
const TARGET_YEAR_MONTH = '2018/12';

function getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const map = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.pdf': 'application/pdf',
        '.mp4': 'video/mp4'
    };
    return map[ext] || 'application/octet-stream';
}

function getEnvVars() {
    const content = fs.readFileSync(ENV_FILE, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/"/g, '');
    });
    return env;
}

async function syncFolder() {
    const env = getEnvVars();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const BUCKET = 'migration_uploads';

    const localDir = path.join(LOCAL_ROOT, TARGET_YEAR_MONTH);
    
    console.log(`Reading local directory: ${localDir}`);
    const files = fs.readdirSync(localDir);
    
    console.log(`Found ${files.length} files locally.`);

    // List remote files to compare
    // Note: limit is 1000 per request. If more files, need pagination.
    // 2018/12 seems to have 1328 files, so we NEED pagination.
    
    let remoteFiles = new Set();
    let offset = 0;
    while(true) {
        const { data, error } = await supabase.storage.from(BUCKET).list(TARGET_YEAR_MONTH, {
            limit: 1000,
            offset: offset
        });
        if (error) {
            console.error("List error:", error);
            break;
        }
        if (!data || data.length === 0) break;
        
        data.forEach(f => remoteFiles.add(f.name.normalize('NFC'))); // Normalize to NFC for comparison
        offset += 1000;
        console.log(`Listed ${remoteFiles.size} remote files so far...`);
    }

    console.log(`Total remote files: ${remoteFiles.size}`);
    
    for (const file of files) {
        const normalizedFile = file.normalize('NFC');
        
        if (remoteFiles.has(normalizedFile)) {
            // console.log(`Skipping existing: ${file}`);
            continue;
        }
        
        console.log(`Uploading MISSING file: ${file}`);
        
        const filePath = path.join(localDir, file);
        const fileBuffer = fs.readFileSync(filePath);
        const mimeType = getMimeType(filePath);
        
        const targetPath = `${TARGET_YEAR_MONTH}/${file}`; // Unix style path for storage
        
        const { error: uploadError } = await supabase.storage
            .from(BUCKET)
            .upload(targetPath, fileBuffer, {
                contentType: mimeType,
                upsert: true
            });
            
        if (uploadError) {
            console.error(`FAILED to upload ${file}:`, uploadError);
        } else {
            console.log(`SUCCESS: ${file}`);
        }
    }
    
    console.log("Sync completed for 2018/12.");
}

syncFolder();
