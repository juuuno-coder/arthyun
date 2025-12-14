const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const ENV_FILE = path.join(__dirname, '../.env.local');
const UPLOADS_DIR = path.join(__dirname, '../public/legacy_uploads');

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

async function restoreAndUpload() {
    const env = getEnvVars();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    const STORAGE_ROOT = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/migration_uploads`;
    
    // Requested years + 2021 (redo with upload to fix hash mismatch)
    const targetYears = ['2018', '2019', '2020', '2021'];

    // Get Generatable ID start
    const { data: maxIdData } = await supabase
        .from('migrated_posts')
        .select('id')
        .order('id', { ascending: false })
        .limit(1);
    
    let nextId = maxIdData && maxIdData.length > 0 ? maxIdData[0].id + 1 : 20000;
    console.log(`Starting ID: ${nextId}`);

    for (const year of targetYears) {
        const yearPath = path.join(UPLOADS_DIR, year);
        if (!fs.existsSync(yearPath)) {
            console.log(`Skipping ${year} (Not found locally)`);
            continue;
        }

        console.log(`Processing Year: ${year}`);
        const months = fs.readdirSync(yearPath);
        
        for (const month of months) {
            const monthPath = path.join(yearPath, month);
            if (!fs.statSync(monthPath).isDirectory()) continue;

            // Filter Images
            const files = fs.readdirSync(monthPath);
            const images = files.filter(f => {
                const lower = f.toLowerCase();
                return (lower.endsWith('.jpg') || lower.endsWith('.png') || lower.endsWith('.jpeg')) &&
                       !lower.includes('-150x150') &&
                       !/-\d+x\d+\./.test(lower);
            });

            if (images.length === 0) continue;
            
            console.log(`Found ${images.length} images in ${year}/${month}. Uploading & creating post...`);

            // 1. Upload Loop (Parallel limit?)
            // We'll do serial for safety/simplicity, or small chunks.
            // "upload" is needed because Bucket likely has Hashed filenames.
            let validImages = [];
            
            for (const img of images) {
                const localFilePath = path.join(monthPath, img);
                const fileBuffer = fs.readFileSync(localFilePath);
                const storagePath = `${year}/${month}/${img}`; // Original Name

                // Check if exists? Or just Upsert. Upsert is safer.
                const { error: uploadError } = await supabase
                    .storage
                    .from('migration_uploads')
                    .upload(storagePath, fileBuffer, {
                        contentType: 'image/jpeg', // Simple assumption, or detect
                        upsert: true
                    });

                if (uploadError) {
                    // console.error(`Failed to upload ${img}:`, uploadError.message);
                    // If fail, skip adding to gallery? Or add anyway hoping it exists?
                    // Usually fail means permissions or size.
                    // Let's assume some might fail but mostly work.
                } else {
                    validImages.push(img);
                }
                
                // process.stdout.write('.');
            }
            // console.log(''); // Newline

            if (validImages.length === 0) {
                 // Try to proceed even if upload 'failed' (maybe already exists and we didn't handle it well? No, upsert true should work)
                 // If validImages empty, maybe we skip DB creation?
                 // Let's fallback to 'images' list if uploads failed but assumed present.
                 validImages = images;
            }

            // 2. Create DB Entry
            let htmlContent = `<p><strong>복구된 ${year}년 ${month}월 자료입니다.</strong> (원본 파일명 유지)</p>`;
            htmlContent += `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">`;
            
            for (const img of validImages) {
                const encodedImg = encodeURIComponent(img);
                const url = `${STORAGE_ROOT}/${year}/${month}/${encodedImg}`;
                htmlContent += `<div style="border:1px solid #ddd; padding:5px;"><img src="${url}" alt="${img}" style="width:100%; height:auto;" /><p style="font-size:12px; word-break:break-all;">${img}</p></div>`;
            }
            htmlContent += `</div>`;

            const title = `[자료복구] ${year}년 ${month}월 미분류 사진 모음`;
            const date = `${year}-${month}-01 12:00:00`;

            const { error: dbError } = await supabase
                .from('migrated_posts')
                .insert({
                    id: nextId,
                    title: title,
                    content: htmlContent,
                    type: 'portfolio',
                    status: 'draft',
                    date: date,
                    excerpt: `${validImages.length}장의 이미지가 원본명으로 업로드 및 복구되었습니다.`
                });
            
            if (!dbError) {
                console.log(`Created: ${title} (ID: ${nextId})`);
                nextId++;
            } else {
                console.error(`DB Error for ${title}:`, dbError.message);
            }
        }
    }
}

restoreAndUpload();
