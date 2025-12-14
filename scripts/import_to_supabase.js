const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Paths
const DATA_FILE = path.join(__dirname, 'posts.json');
const ENV_FILE = path.join(__dirname, '../../../.env.local'); // Up to project root

// Helper to parse .env
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
            const val = parts.slice(1).join('=').trim().replace(/"/g, ''); // Simple cleanup
            env[key] = val;
        }
    });
    return env;
}

async function importData() {
    const env = getEnvVars();
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Error: NEXT_PUBLIC_SUPABASE_URL or Key not found in .env.local');
        return;
    }

    console.log('Connecting to Supabase at:', supabaseUrl);
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Read posts
    const posts = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    console.log(`Read ${posts.length} items from JSON.`);

    // Map to table schema
    const rows = posts.map(p => ({
        id: parseInt(p.id),
        title: p.title,
        content: p.content,
        date: p.date === '0000-00-00 00:00:00' ? null : new Date(p.date), // Handle weird WP dates
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
            // Check if table exists
            if (error.code === '42P01') {
                console.error('\nCRITICAL: Table "migrated_posts" does not exist.');
                console.error('Please run the content of "create_table.sql" in your Supabase SQL Editor first!');
                return;
            }
        } else {
            console.log(`Inserted batch ${i} - ${i + batch.length} successfully.`);
        }
    }
    console.log('Done.');
}

importData().catch(console.error);
