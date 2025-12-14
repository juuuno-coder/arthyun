const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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
        return {};
    }
}

async function fixBucket() {
    const env = getEnvVars();
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("Missing ENV vars.");
        return;
    }
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    
    console.log("Updating 'migration_uploads' to public...");
    
    const { data, error } = await supabase
        .storage
        .updateBucket('migration_uploads', {
            public: true,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
            fileSizeLimit: 52428800 // 50MB
        });
        
    if (error) {
        console.error("Error updating bucket:", error);
        // Try creating if not exists?
        if (error.message.includes('not found')) {
             console.log("Bucket not found. Creating...");
             const { data: createData, error: createError } = await supabase.storage.createBucket('migration_uploads', { public: true });
             if (createError) console.error("Create failed:", createError);
             else console.log("Bucket created.");
        }
    } else {
        console.log("Bucket updated successfully:", data);
    }

    // Also fix 'images' and 'og_images' just in case
    await supabase.storage.updateBucket('images', { public: true });
    await supabase.storage.updateBucket('og_images', { public: true });
    console.log("Secured generic buckets.");
}

fixBucket();
