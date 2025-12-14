const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '../../../.env.local');
const LOCAL_ROOT = path.join(__dirname, '../www/wp-content/uploads');

function getEnvVars() {
    const content = fs.readFileSync(ENV_FILE, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/"/g, '');
    });
    return env;
}

async function debugUpload() {
    const env = getEnvVars();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const BUCKET = 'migration_uploads';

    const filename = '문화가있는날1차.jpg';
    const localPath = path.join(LOCAL_ROOT, '2018/12', filename);
    const crypto = require('crypto');
    const hash = crypto.createHash('md5').update(filename).digest('hex');
    const targetPath = `2018/12/${hash}.jpg`;
    
    console.log(`Path: ${localPath}`);
    console.log(`Exists: ${fs.existsSync(localPath)}`);
    
    if (!fs.existsSync(localPath)) return;
    
    const buffer = fs.readFileSync(localPath);
    console.log(`Buffer size: ${buffer.length}`);
    
    const { data, error } = await supabase.storage
        .from(BUCKET)
        .upload(targetPath, buffer, {
            contentType: 'image/jpeg',
            upsert: true
        });
        
    if (error) {
        console.error("Upload Error:", error);
    } else {
        console.log("Upload Success:", data);
        
        // Verify public URL
        const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(targetPath);
        console.log("Public URL:", publicUrl);
    }
}

debugUpload();
