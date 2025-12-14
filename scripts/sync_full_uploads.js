const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '../../../.env.local');
const LOCAL_ROOT = path.join(__dirname, '../www/wp-content/uploads');

function getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const map = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.pdf': 'application/pdf',
        '.mp4': 'video/mp4',
        '.zip': 'application/zip'
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

async function syncAll() {
    const env = getEnvVars();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const BUCKET = 'migration_uploads';

    console.log("Starting full sync...");

    // Get all year folders
    const years = fs.readdirSync(LOCAL_ROOT).filter(f => /^\d{4}$/.test(f));
    
    for (const year of years) {
        const yearPath = path.join(LOCAL_ROOT, year);
        if (!fs.statSync(yearPath).isDirectory()) continue;
        
        const months = fs.readdirSync(yearPath);
        for (const month of months) {
            if (month === '2018/12') continue; // Skip currently running one? No, this is month folder name like '01'
            if (year === '2018' && month === '12') {
                console.log("Skipping 2018/12 (handled by other script)");
                continue; 
            }
            
            const monthPath = path.join(yearPath, month);
            if (!fs.statSync(monthPath).isDirectory()) continue;
            
            const targetFolder = `${year}/${month}`;
            console.log(`Syncing ${targetFolder}...`);
            
            await syncFolder(supabase, BUCKET, monthPath, targetFolder);
        }
    }
    
    // Also sync root files if any (e.g. not in year/month)
    // skipping for now
    
    console.log("Full sync completed.");
}

async function syncFolder(supabase, bucket, localDir, targetRelativeDir) {
    const files = fs.readdirSync(localDir);
    if (files.length === 0) return;

    // Build remote set
    let remoteFiles = new Set();
    let offset = 0;
    while(true) {
        const { data, error } = await supabase.storage.from(bucket).list(targetRelativeDir, {
            limit: 1000,
            offset: offset
        });
        if (error || !data || data.length === 0) break;
        data.forEach(f => remoteFiles.add(f.name.normalize('NFC')));
        offset += 1000;
    }

    // Upload missing
    for (const file of files) {
        if (fs.statSync(path.join(localDir, file)).isDirectory()) continue; // Skip subdirs
        
        const normalized = file.normalize('NFC');
        if (remoteFiles.has(normalized)) continue;
        
        console.log(`[${targetRelativeDir}] Uploading ${file}...`);
        
        try {
            const filePath = path.join(localDir, file);
            const fileBuffer = fs.readFileSync(filePath);
            const mimeType = getMimeType(filePath);
            const targetPath = `${targetRelativeDir}/${file}`;
            
            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(targetPath, fileBuffer, {
                    contentType: mimeType,
                    upsert: true
                });
                
            if (uploadError) console.error(`Failed ${file}:`, uploadError.message);
        } catch (e) {
            console.error(`Error reading ${file}:`, e.message);
        }
    }
}

syncAll();
