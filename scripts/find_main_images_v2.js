const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load Env
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key) envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function findOldMainImages() {
  console.log("🔍 Searching for old main/slider images V2...");

  // Select only fields we know exist or select all (*) to be safe
  const { data: posts, error } = await supabase
    .from('migrated_posts')
    .select('*'); // Select all to avoid column error

  if (error) {
    console.error("Fetch Error:", error.message);
    return;
  }

  const keywords = ['main', 'slider', 'banner', '메인', '슬라이더', '배너', 'background'];
  let foundCount = 0;

  console.log("---------------------------------------------------");
  for (const post of posts) {
    const titleLower = (post.title || '').toLowerCase();
    const contentLower = (post.content || '').toLowerCase();
    
    // Check keyword match
    const isMatch = keywords.some(k => titleLower.includes(k) || contentLower.includes(k));
    
    // Extract Image
    const imgMatch = post.content ? post.content.match(/src="([^"]+)"/) : null;
    const firstImage = imgMatch ? imgMatch[1] : null;

    if (isMatch && firstImage) {
        console.log(`[Found] ${post.title}`);
        console.log(`   -> URL: ${firstImage}`);
        foundCount++;
    }
  }
  
  if (foundCount === 0) {
      console.log("No images found with keywords: main, slider, banner.");
      console.log("Trying to list ALL images from attachments...");
      
      const attachments = posts.filter(p => p.type === 'attachment' || (p.content && p.content.includes('<img')));
      attachments.slice(0, 10).forEach(p => { // Show first 10
        const img = p.content?.match(/src="([^"]+)"/)?.[1];
        if(img) console.log(`[Attachment] ${p.title}: ${img}`);
      });
  }
  
  console.log("---------------------------------------------------");
}

findOldMainImages();
