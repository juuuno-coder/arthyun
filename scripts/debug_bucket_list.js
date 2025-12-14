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

async function debugBucket() {
    const env = getEnvVars();
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    
    console.log("Checking Bucket 'migration_uploads'...");
    
    // Check 2021/04
    const { data: files2021, error: error2021 } = await supabase
        .storage
        .from('migration_uploads')
        .list('2021/04');
    
    if (error2021) {
        console.error("Error listing 2021/04:", error2021);
    } else {
        console.log(`Found ${files2021.length} files in 2021/04.`);
        console.log("Sample files:", files2021.slice(0, 5).map(f => f.name));
        
        // Check for specific file
        const kakao = files2021.find(f => f.name.includes("KakaoTalk"));
        if (kakao) console.log("Success: KakaoTalk file found!", kakao.name);
        else console.log("Warning: No KakaoTalk file found in bucket.");
    }

    // Check 2018/12
    const { data: files2018, error: error2018 } = await supabase
        .storage
        .from('migration_uploads')
        .list('2018/12');
        
    if (error2018) {
        console.error("Error listing 2018/12:", error2018);
    } else {
        console.log(`Found ${files2018.length} files in 2018/12.`);
        console.log("Sample files:", files2018.slice(0, 5).map(f => f.name));
    }
}

debugBucket();
