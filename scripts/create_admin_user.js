const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '../../../.env.local');

function getEnvVars() {
    const content = fs.readFileSync(ENV_FILE, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/"/g, '');
    });
    return env;
}

async function createAdminUser() {
    const env = getEnvVars();
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceRoleKey) {
        console.error("SUPABASE_SERVICE_ROLE_KEY is missing in .env.local");
        return;
    }

    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey);
    
    const email = "designdlab@designdlab.co.kr";
    const password = "elwkdlselfoq1!";

    console.log(`Creating user: ${email}...`);

    const { data, error } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true // 자동 이메일 인증 처리
    });

    if (error) {
        console.error("Error creating user:", error.message);
    } else {
        console.log("User created successfully:", data.user.id);
    }
}

createAdminUser();
