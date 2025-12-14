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

async function fixBuckets() {
    const env = getEnvVars();
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("Missing ENV vars.");
        return;
    }
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    
    console.log("Setting buckets to PUBLIC...");

    // 1. images bucket
    const { data: d1, error: e1 } = await supabase.storage.updateBucket('images', {
        public: true,
        allowedMimeTypes: ['image/*', 'application/pdf'], 
        fileSizeLimit: 10485760 // 10MB
    });
    if (e1) console.error("Error updating 'images' bucket:", e1);
    else console.log("Updated 'images' bucket to PUBLIC.");

    // 2. migration_uploads bucket
    const { data: d2, error: e2 } = await supabase.storage.updateBucket('migration_uploads', {
        public: true
    });
    if (e2) console.error("Error updating 'migration_uploads' bucket:", e2);
    else console.log("Updated 'migration_uploads' bucket to PUBLIC.");

    // 3. og_images bucket (for thumbnails)
    const { data: d3, error: e3 } = await supabase.storage.updateBucket('og_images', {
        public: true
    });
    if (e3) console.error("Error updating 'og_images' bucket:", e3);
    else console.log("Updated 'og_images' bucket to PUBLIC.");

    console.log("Done.");
}

fixBuckets();
