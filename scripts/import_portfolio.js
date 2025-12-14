const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Paths
const DATA_FILE = path.join(__dirname, 'portfolio.json');
const ENV_FILE = path.join(__dirname, '../../../.env.local');

// Helper to parse .env since dotenv might not be installed or configured for this path
function getEnvVars() {
    if (!fs.existsSync(ENV_FILE)) {
        console.error('Error: .env.local file not found at', ENV_FILE);
        process.exit(1);
    }
    const content = fs.readFileSync(ENV_FILE, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const val = parts.slice(1).join('=').trim().replace(/"/g, ''); 
            env[key] = val;
        }
    });
    return env;
}

const env = getEnvVars();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL or Key not found in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function importData() {
    console.log(`Connecting to Supabase at: ${supabaseUrl}`);

    // Read posts
    const posts = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    console.log(`Read ${posts.length} items from JSON.`);

    // Map to table schema
    const rows = posts.map(p => ({
        id: parseInt(p.id),
        title: p.title,
        content: p.content,
        // SQL Parser might have left raw date string 'YYYY-MM-DD HH:mm:ss'
        date: (!p.date || p.date.startsWith('0000')) ? null : new Date(p.date), 
        slug: p.slug,
        status: p.status,
        type: p.type,
        excerpt: p.excerpt
    }));

    // Insert in batches
    const BATCH_SIZE = 50;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from('migrated_posts').upsert(batch);
        
        if (error) {
            console.error('Error inserting batch:', error);
        } else {
            console.log(`Inserted batch ${i} - ${i + batch.length} successfully.`);
        }
    }
    console.log('Done.');
}

importData().catch(e => console.error(e));
