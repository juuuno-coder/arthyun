const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Load Environment Variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, ''); // remove quotes
  }
});

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
// Use Service Role Key for Admin privileges (bypass RLS) if available, otherwise Anon Key
const SUPABASE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Error: Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function migratePortfolios() {
  console.log("🚀 Starting Portfolio Migration via Script...");

  // 1. Check if 'portfolios' table exists (simple query)
  const { error: tableError } = await supabase.from('portfolios').select('id').limit(1);
  if (tableError && tableError.code === '42P01') {
    console.error("❌ Error: 'portfolios' table does not exist.");
    console.log("   Please run the 'CREATE TABLE' SQL first in Supabase SQL Editor.");
    return;
  }

  // 2. Fetch Source Data
  console.log("📦 Fetching 'portfolio' items from migrated_posts...");
  const { data: sourcePosts, error: sourceError } = await supabase
    .from('migrated_posts')
    .select('*')
    .eq('type', 'portfolio');

  if (sourceError) {
    console.error("❌ Fetch Error:", sourceError.message);
    return;
  }

  console.log(`✅ Found ${sourcePosts.length} posts to migrate.`);

  // 3. Transform and Insert
  let successCount = 0;
  let failCount = 0;

  for (const post of sourcePosts) {
    // Extract first image src
    let thumbnail_url = null;
    const imgMatch = post.content ? post.content.match(/src="([^"]+)"/) : null;
    if (imgMatch) thumbnail_url = imgMatch[1];

    // Transform date (handle invalid dates)
    let completion_date = null;
    if (post.created_at) {
        try {
            completion_date = new Date(post.created_at).toISOString().split('T')[0];
        } catch (e) {}
    }

    const newPortfolio = {
      title: post.title,
      description: post.content,
      artist: 'ART HYUN',
      category: 'Archive',
      client: null,
      location: null,
      completion_date: completion_date,
      thumbnail_url: thumbnail_url,
      images: [], // Can be populated later
      is_visible: true,
      created_at: post.created_at // Preserve original date
    };

    const { error: insertError } = await supabase
      .from('portfolios')
      .insert(newPortfolio);

    if (insertError) {
      console.error(`   Failed to insert "${post.title}":`, insertError.message);
      failCount++;
    } else {
      process.stdout.write('.'); // Progress dot
      successCount++;
    }
  }

  console.log("\n\n🎉 Migration Completed!");
  console.log(`   Success: ${successCount}`);
  console.log(`   Failed:  ${failCount}`);
}

migratePortfolios();
