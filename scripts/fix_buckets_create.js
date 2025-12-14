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
    
    console.log("Fixing 'images' bucket...");

    // Try to Get Bucket
    const { data: bucket, error: getError } = await supabase.storage.getBucket('images');

    if (getError) {
        console.log("'images' bucket check failed (likely missing). Creating...");
        const { data: newBucket, error: createError } = await supabase.storage.createBucket('images', {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf'],
            fileSizeLimit: 10485760
        });
        if (createError) {
             // If error is "already exists" then update.
             console.error("Error creating bucket:", createError);
        } else {
             console.log("Created 'images' bucket successfully.");
        }
    } else {
        console.log("'images' bucket exists. Updating to PUBLIC...");
        const { error: updateError } = await supabase.storage.updateBucket('images', {
            public: true
        });
        if (updateError) console.error("Update failed:", updateError);
        else console.log("Updated 'images' bucket to PUBLIC.");
    }
    
    console.log("Done.");
}

fixBuckets();
