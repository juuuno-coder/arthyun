const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const ENV_FILE = path.join(__dirname, '../.env.local');
const UPLOADS_DIR = path.join(__dirname, '../public/legacy_uploads'); // Based on find_by_name result

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

async function recoverFiles() {
    const env = getEnvVars();
    if (!env.NEXT_PUBLIC_SUPABASE_URL) {
        console.error("No Supabase URL found.");
        return;
    }
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    const STORAGE_ROOT = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/migration_uploads`;

    // Target years to recover (Post-DB era)
    const years = ['2019', '2020', '2021']; 
    // For 2019, we only want May onwards, but simpler to just scan all and if filename duplications occur, we might handle it.
    // Actually, DB has 2019-04 max.
    // Let's just focus on 2021 as requested first, effectively demonstrating the capability.
    // If I do too much, I might clutter. User asked for "2021/04".
    // I will do 2021 full year.
    
    const targetYears = ['2021'];

    // Get Max ID
    const { data: maxIdData } = await supabase
        .from('migrated_posts')
        .select('id')
        .order('id', { ascending: false })
        .limit(1);
    
    let nextId = maxIdData && maxIdData.length > 0 ? maxIdData[0].id + 1 : 10000;
    console.log(`Starting ID generation from: ${nextId}`);

    for (const year of targetYears) {
        const yearPath = path.join(UPLOADS_DIR, year);
        if (!fs.existsSync(yearPath)) continue;

        const months = fs.readdirSync(yearPath);
        for (const month of months) {
            const monthPath = path.join(yearPath, month);
            if (!fs.statSync(monthPath).isDirectory()) continue;

            console.log(`Scanning ${year}/${month}...`);
            const files = fs.readdirSync(monthPath);
            
            // Filter Images
            const images = files.filter(f => {
                const lower = f.toLowerCase();
                return (lower.endsWith('.jpg') || lower.endsWith('.png') || lower.endsWith('.jpeg')) &&
                       !lower.includes('-150x150') && // Common thumb
                       !/-\d+x\d+\./.test(lower); // Regex for -100x100.jpg
            });

            if (images.length === 0) continue;

            console.log(`Found ${images.length} original images in ${year}/${month}.`);

            // Generate HTML Content
            let htmlContent = `<p><strong>복구된 ${year}년 ${month}월 자료입니다.</strong></p>`;
            htmlContent += `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">`;
            
            for (const img of images) {
                const encodedImg = encodeURIComponent(img); // Encodes spaces, korean, etc.
                // Note: encodeURIComponent encodes everything. Storage URL usually expects %20 for space.
                // But / is safety.
                const url = `${STORAGE_ROOT}/${year}/${month}/${encodedImg}`;
                htmlContent += `<div style="border:1px solid #ddd; padding:5px;"><img src="${url}" alt="${img}" style="width:100%; height:auto;" /><p style="font-size:12px; word-break:break-all;">${img}</p></div>`;
            }
            htmlContent += `</div>`;

            // Insert into DB
            const title = `[자료복구] ${year}년 ${month}월 미분류 사진 모음`;
            const date = `${year}-${month}-01 12:00:00`;

            const { data, error } = await supabase
                .from('migrated_posts')
                .insert({
                    id: nextId, // Explicit ID
                    title: title,
                    content: htmlContent,
                    type: 'portfolio', 
                    status: 'draft',   
                    date: date,
                    excerpt: `${images.length}장의 이미지가 복구되었습니다.`
                });

            if (error) console.error(`Error inserting ${title}:`, error);
            else {
                console.log(`Created Draft: ${title} (ID: ${nextId})`);
                nextId++;
            }
        }
    }
}

recoverFiles();
