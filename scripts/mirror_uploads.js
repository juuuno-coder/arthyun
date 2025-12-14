const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Paths
const ENV_FILE = path.join(__dirname, '../../../.env.local');
const UPLOADS_DIR = path.join(__dirname, '../www/wp-content/uploads');

function getEnvVars() {
    if (!fs.existsSync(ENV_FILE)) {
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

// Recursive walk
async function *walk(dir) {
    const dirents = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const dirent of dirents) {
        const res = path.resolve(dir, dirent.name);
        if (dirent.isDirectory()) {
            yield* walk(res);
        } else {
            yield res;
        }
    }
}

async function mirrorUploads() {
    const env = getEnvVars();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const BUCKET_NAME = 'migration_uploads';

    console.log(`Starting Mirror Upload from ${UPLOADS_DIR} to bucket ${BUCKET_NAME}`);
    
    let success = 0;
    let errors = 0;
    let skipped = 0;

    for await (const filePath of walk(UPLOADS_DIR)) {
        // Calculate relative path: e.g. 2018/12/foo.jpg
        const relativePath = path.relative(UPLOADS_DIR, filePath);
        // Normalize separators to slash for URL/Storage
        const storagePath = relativePath.split(path.sep).join('/');
        
        // console.log(`Processing: ${storagePath}`);

        try {
            const fileBody = fs.readFileSync(filePath);
            
            // Upload
            const { error } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(storagePath, fileBody, {
                    contentType: getMimeType(filePath),
                    upsert: true 
                });

            if (error) {
                console.error(`Failed ${storagePath}: ${error.message}`);
                errors++;
            } else {
                // console.log(`Uploaded ${storagePath}`);
                success++;
                if (success % 50 === 0) console.log(`Uploaded ${success} files...`);
            }
        } catch (e) {
            console.error(`Error reading ${filePath}: ${e.message}`);
            errors++;
        }
    }

    console.log(`Mirror complete. Success: ${success}, Errors: ${errors}, Skipped: ${skipped}`);
}

mirrorUploads().catch(console.error);
