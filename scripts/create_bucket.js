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

async function createBucket() {
    const env = getEnvVars();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const BUCKET_NAME = 'migration_uploads';

    console.log(`Checking bucket: ${BUCKET_NAME}`);
    
    // List buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
        console.error('Error listing buckets:', error);
        return;
    }

    const exists = buckets.find(b => b.name === BUCKET_NAME);
    if (exists) {
        console.log('Bucket exists.');
    } else {
        console.log('Bucket not found. Creating...');
        const { data, error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
            public: true
        });
        
        if (createError) {
            console.error('Error creating bucket:', createError);
        } else {
            console.log('Bucket created successfully.');
        }
    }
}

createBucket();
