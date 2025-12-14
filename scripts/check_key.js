const fs = require('fs');
const path = require('path');
const ENV_FILE = path.join(__dirname, '../../../.env.local');
const content = fs.readFileSync(ENV_FILE, 'utf8');
if (content.includes('SUPABASE_SERVICE_ROLE_KEY')) {
    console.log('Service Role Key PRESENT');
} else {
    console.log('Service Role Key MISSING');
}
