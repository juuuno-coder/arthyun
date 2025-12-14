const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

async function checkSupabaseFile() {
    const env = getEnvVars();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const BUCKET = 'migration_uploads';
    const FOLDER = '2018/12';
    const FILENAME = '문화가있는날1차.jpg';
    
    console.log(`Checking for ${FOLDER}/${FILENAME} in bucket ${BUCKET}...`);
    
    // 1. List files in folder to see what's actually there
    const { data: files, error } = await supabase.storage.from(BUCKET).list(FOLDER, {
        limit: 1000,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' },
    });
    
    if (error) {
        console.error("List error:", error);
        return;
    }
    
    const found = files.find(f => f.name === FILENAME);
    if (found) {
        console.log("File FOUND in list:", found);
    } else {
        console.log("File NOT FOUND in list.");
        // Dump similar files
        console.log("Files in folder starting with '문':");
        files.filter(f => f.name.startsWith('문')).forEach(f => console.log(f.name));
    }
    
    // 2. Normalize check
    const normalizedName = FILENAME.normalize('NFC');
    const foundNorm = files.find(f => f.name.normalize('NFC') === normalizedName);
    if (foundNorm) {
         console.log("File FOUND via NFC normalization match:", foundNorm.name);
    }
}

checkSupabaseFile();
