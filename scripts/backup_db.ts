
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Error: Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BACKUP_DIR = path.join(process.cwd(), "backup");

// Tables to backup
const TABLES = [
    "media_releases",
    "portfolios",
    "exhibitions",
    "migrated_posts",
    "site_settings",
    "daily_stats",
    "visit_logs"
];

async function backup() {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    console.log(`📦 Starting backup to ${BACKUP_DIR}...`);

    for (const table of TABLES) {
        try {
            console.log(`Processing table: ${table}...`);
            // Fetch all data (limit 10000 for safety, can loop if needed but assuming small DB)
            const { data, error } = await supabase.from(table).select("*");

            if (error) {
                // Ignore "relation does not exist" indicating table doesn't exist
                if (error.code === '42P01') {
                    console.log(`⚠️ Table ${table} does not exist. Skipping.`);
                    continue;
                }
                console.error(`❌ Error backing up ${table}:`, error.message);
                continue;
            }

            if (!data || data.length === 0) {
                console.log(`ℹ️ Table ${table} is empty.`);
            }

            const filePath = path.join(BACKUP_DIR, `${table}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`✅ Saved ${data.length} rows to ${table}.json`);

        } catch (e: any) {
            console.error(`Unexpected error for ${table}:`, e.message);
        }
    }

    console.log("\n✨ Backup completed!");
    console.log(`📁 Files are located in: ${BACKUP_DIR}`);
}

backup();
