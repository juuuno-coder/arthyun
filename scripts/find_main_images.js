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
    envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
  }
});

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function findOldMainImages() {
  console.log("🔍 Searching for old main/slider images...");

  // Search logic: look for posts with 'slider', 'main', 'banner' in title/content
  // or attachments (if kept in migrated_posts)
  const keywords = ['main', 'slider', 'banner', '메인', '슬라이더', '배너'];
  const results = [];

  const { data: posts, error } = await supabase
    .from('migrated_posts')
    .select('id, title, content, type, created_at');

  if (error) {
    console.error(error);
    return;
  }

  for (const post of posts) {
    const titleLower = (post.title || '').toLowerCase();
    const contentLower = (post.content || '').toLowerCase();
    
    // Check keyword match
    const isMatch = keywords.some(k => titleLower.includes(k) || contentLower.includes(k));
    
    // Extract Image
    const imgMatch = post.content ? post.content.match(/src="([^"]+)"/) : null;
    const firstImage = imgMatch ? imgMatch[1] : null;

    if (isMatch || (firstImage && (post.type === 'attachment' || post.type === 'nav_menu_item'))) {
        if (firstImage) {
            results.push({
                id: post.id,
                title: post.title,
                image: firstImage,
                reason: isMatch ? 'Keyword Match' : 'Potential Asset',
                date: post.created_at
            });
        }
    }
  }

  console.log(`✅ Found ${results.length} potential main images:`);
  console.log("---------------------------------------------------");
  results.forEach(item => {
      console.log(`[${item.date.split('T')[0]}] ${item.title} (${item.reason})`);
      console.log(`   -> ${item.image}`);
      console.log("---------------------------------------------------");
  });
}

findOldMainImages();
