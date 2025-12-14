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

async function migrateMural() {
    const env = getEnvVars();
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("Missing ENV vars.");
        return;
    }
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    
    console.log("Migrating Mural -> Painting...");
    
    // Portfolios
    const { error: err1 } = await supabase.from('portfolios')
        .update({ category: 'Painting' })
        .eq('category', 'Mural');
    if (err1) console.error("Error migrating Mural:", err1);
    else console.log("Migrated Portfolios: Mural -> Painting");

    // Exhibitions (if applicable)
    try {
        await supabase.from('exhibitions')
            .update({ category: 'Painting' })
            .eq('category', 'Mural');
        console.log("Migrated Exhibitions: Mural -> Painting");
    } catch (e) {
        console.log("Exhibitions migration skipped.");
    }

    console.log("Done.");
}

migrateMural();
