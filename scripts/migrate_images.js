const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Paths
const ENV_FILE = path.join(__dirname, '../../../.env.local');
const UPLOADS_DIR = path.join(__dirname, '../www/wp-content/uploads');

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

function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case '.jpg':
        case '.jpeg': return 'image/jpeg';
        case '.png': return 'image/png';
        case '.gif': return 'image/gif';
        case '.svg': return 'image/svg+xml';
        case '.pdf': return 'application/pdf';
        default: return 'application/octet-stream';
    }
}

async function migrateImages() {
    const env = getEnvVars();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const BUCKET_NAME = 'migration_uploads';

    console.log('Fetching posts...');
    const { data: posts, error } = await supabase
        .from('migrated_posts')
        .select('id, content');

    if (error) {
        console.error('Error fetching posts:', error);
        return;
    }

    console.log(`Found ${posts.length} posts. Scanning for images...`);

    let updatedPostsCount = 0;
    const processedImages = new Map();

    for (const post of posts) {
        if (!post.content) continue;
        let content = post.content;
        let needsUpdate = false;

        // More robust regex
        // capture everything starting with http://arthyun.co.kr/wp-content/uploads/ until quote/space
        const regex = /http:\/\/arthyun\.co\.kr\/wp-content\/uploads\/([^"'\s<>\)]+)/g;
        
        let match;
        const matches = [];
        while ((match = regex.exec(content)) !== null) {
            matches.push({
                fullUrl: match[0],
                relativePath: match[1]
            });
        }

        if (matches.length > 0) {
            console.log(`Post ${post.id}: Found ${matches.length} matches.`);
        }

        for (let { fullUrl, relativePath } of matches) {
            // Clean relativePath from potential trailing characters if regex was greedy
            relativePath = relativePath.replace(/(&quot;|&amp;)$/, ''); 
            
            if (processedImages.has(fullUrl)) {
                content = content.replace(fullUrl, processedImages.get(fullUrl));
                needsUpdate = true;
                continue;
            }

            const decodedPath = decodeURIComponent(relativePath).split('/').join(path.sep);
            const localFilePath = path.join(UPLOADS_DIR, decodedPath);

            console.log(`Checking: ${decodedPath}`);

            if (fs.existsSync(localFilePath)) {
                // console.log(`Found local file: ${decodedPath}`);
                try {
                    const fileBody = fs.readFileSync(localFilePath);
                    const { data, error } = await supabase.storage
                        .from(BUCKET_NAME)
                        .upload(decodedPath, fileBody, {
                            contentType: getMimeType(decodedPath),
                            upsert: true
                        });

                    if (error) {
                        console.error(`Upload error for ${decodedPath}: ${error.message}`);
                    } else {
                        const { data: { publicUrl } } = supabase.storage
                            .from(BUCKET_NAME)
                            .getPublicUrl(decodedPath);
                        
                        console.log(`Uploaded: ${publicUrl}`);
                        processedImages.set(fullUrl, publicUrl);
                        content = content.replace(fullUrl, publicUrl);
                        needsUpdate = true;
                    }
                } catch (e) {
                    console.error(`Exception processing ${decodedPath}:`, e);
                }
            } else {
                console.warn(`File NOT found locally: ${decodedPath}`);
                // Try fuzzy match? (e.g. stripped resolution suffix)
                // If 1-1-150x150.jpg not found, look for 1-1.jpg?
                // Logic: content often links to resized versions.
                // We could upload the original and link to it? 
                // But replacing 150x150 with original might break layout (too big).
                // But Supabase can transform images on demand if we use the pro plan or image resizer. 
                // For now, simple migration.
            }
        }

        if (needsUpdate) {
            const { error: updateError } = await supabase
                .from('migrated_posts')
                .update({ content: content })
                .eq('id', post.id);

            if (updateError) console.error(`Error updating post ${post.id}:`, updateError);
            else updatedPostsCount++;
        }
    }

    console.log(`Migration complete. Updated ${updatedPostsCount} posts.`);
}

migrateImages().catch(console.error);
