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

async function createOgBucket() {
    const env = getEnvVars();
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceRoleKey) {
        console.error("SUPABASE_SERVICE_ROLE_KEY is missing");
        return;
    }

    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey);
    const BUCKET_NAME = 'og_images';

    console.log(`Creating/Checking bucket: ${BUCKET_NAME}...`);

    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
        console.error("Error listed buckets:", listError);
        return;
    }

    const exists = buckets.find(b => b.name === BUCKET_NAME);

    if (exists) {
        console.log("Bucket already exists.");
        // Make sure it's public
        const { error: updateError } = await supabase.storage.updateBucket(BUCKET_NAME, {
            public: true,
            fileSizeLimit: 5242880, // 5MB
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
        });
        if (updateError) console.error("Error updating bucket:", updateError);
        else console.log("Bucket updated to public.");
    } else {
        const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
            public: true,
            fileSizeLimit: 5242880,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
        });
        
        if (error) console.error("Error creating bucket:", error);
        else console.log("Bucket created successfully.");
    }
}

createOgBucket();
