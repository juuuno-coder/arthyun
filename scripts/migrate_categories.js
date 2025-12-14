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

async function migrateCategories() {
    const env = getEnvVars();
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("Missing ENV vars.");
        return;
    }
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    
    console.log("Migrating Categories...");
    
    // 1. Portfolios
    // Public Art -> Culture
    const { error: err1 } = await supabase.from('portfolios')
        .update({ category: 'Culture' })
        .eq('category', 'Public Art');
    if (err1) console.error("Error migrating Public Art:", err1);
    else console.log("Migrated Public Art -> Culture");

    // Design -> PublicArtDesign
    const { error: err2 } = await supabase.from('portfolios')
        .update({ category: 'PublicArtDesign' })
        .eq('category', 'Design');
    if (err2) console.error("Error migrating Design:", err2);
    else console.log("Migrated Design -> PublicArtDesign");

    // Archive -> Education
    const { error: err3 } = await supabase.from('portfolios')
        .update({ category: 'Education' })
        .eq('category', 'Archive');
    if (err3) console.error("Error migrating Archive:", err3);
    else console.log("Migrated Archive -> Education");

    // 2. Exhibitions (Check if table exists and has category)
    // We try, if column doesn't exist it will error safely? or we check first?
    // User requested "Category of Sculpture... Public Art...".
    // Usually implies Portfolios.
    // I'll try update exhibitions too just in case.
    try {
         await supabase.from('exhibitions').update({ category: 'Culture' }).eq('category', 'Public Art');
         await supabase.from('exhibitions').update({ category: 'PublicArtDesign' }).eq('category', 'Design');
         await supabase.from('exhibitions').update({ category: 'Education' }).eq('category', 'Archive');
         console.log("Tried migrating Exhibitions (if applicable).");
    } catch (e) {
        console.log("Exhibitions migration skipped/failed (maybe no column).");
    }

    console.log("Migration Complete.");
}

migrateCategories();
