const fs = require('fs');
const readline = require('readline');
const path = require('path');

// Configuration
const INPUT_FILE = 'c:/Users/주노/Desktop/arthyun/public/backup/extracted/arthyun.co.kr-20190410-062700-679/database.sql';
const OUTPUT_FILE = 'c:/Users/주노/Desktop/arthyun/public/backup/extracted/posts.json';

// Mapping of columns based on observed CREATE TABLE
// ID, post_author, post_date, post_date_gmt, post_content, post_title, post_excerpt, post_status, comment_status, ping_status, 
// post_password, post_name, to_ping, pinged, post_modified, post_modified_gmt, post_content_filtered, post_parent, guid, menu_order, 
// post_type, post_mime_type, comment_count

const COL_IDX = {
    ID: 0,
    post_date: 2,
    post_content: 4,
    post_title: 5,
    post_excerpt: 6,
    post_status: 7,
    post_name: 11, // slug
    post_type: 20
};

// Simple SQL Value Parser
function parseSqlValues(line) {
    // Find the start of values: VALUES (...);
    // Be careful, line starts with "INSERT INTO ... VALUES ("
    const valuesStart = line.indexOf('VALUES (');
    if (valuesStart === -1) return null;
    
    let content = line.substring(valuesStart + 8); 
    // Remove last ); or ); at end of line
    content = content.trim().replace(/\);$/, '').replace(/\)$/, '');

    const values = [];
    let currentVal = '';
    let inString = false;
    let escape = false;

    // Scan chars
    for (let i = 0; i < content.length; i++) {
        const char = content[i];

        if (inString) {
            if (escape) {
                currentVal += char;
                escape = false;
            } else {
                if (char === '\\') {
                    escape = true; // next is escaped
                    // Keep the backslash? SQL strings often need it if they escape ' with \'. 
                    // But simpler to just keep it for now or handle standard SQL escaping.
                    // Standard SQL escapes ' as ''. MySQL often uses \. 
                    // Let's keep \ for now to handle \'.
                    currentVal += char; 
                } else if (char === "'") {
                    inString = false;
                } else {
                    currentVal += char;
                }
            }
        } else {
            if (char === "'") {
                inString = true;
            } else if (char === ',') {
                values.push(cleanValue(currentVal));
                currentVal = '';
            } else {
                currentVal += char;
            }
        }
    }
    values.push(cleanValue(currentVal)); // last value

    return values;
}

function cleanValue(val) {
    val = val.trim();
    if (val.startsWith("'") && val.endsWith("'")) {
        // Remove surrounding quotes
        val = val.substring(1, val.length - 1);
        // Unescape MySQL escapes if needed
        val = val.replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
        // Also handle \n, \r
        val = val.replace(/\\n/g, "\n").replace(/\\r/g, "\r");
    } else if (val === 'NULL') {
        return null;
    }
    return val;
}

async function extract() {
    const fileStream = fs.createReadStream(INPUT_FILE);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const posts = [];

    for await (const line of rl) {
        if (line.includes('INSERT INTO `SERVMASK_PREFIX_posts`')) {
            const values = parseSqlValues(line);
            if (!values) continue;

            const post = {
                id: values[COL_IDX.ID],
                title: values[COL_IDX.post_title],
                content: values[COL_IDX.post_content],
                date: values[COL_IDX.post_date],
                slug: values[COL_IDX.post_name],
                status: values[COL_IDX.post_status],
                type: values[COL_IDX.post_type],
                excerpt: values[COL_IDX.post_excerpt]
            };

            // Filter
            // We want 'post' and maybe 'page' (usually user wants pages too for site migration)
            // But let's mainly focus on 'post' or just keep all 'publish' public ones.
            // User requested "save the site", so likely pages + posts.
            // Also revisions, nav_menu_item etc should be ignored.
            
            if (['post', 'page'].includes(post.type) && post.status === 'publish') {
                posts.push(post);
            }
        }
    }

    // Write output
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(posts, null, 2));
    console.log(`Extracted ${posts.length} posts/pages to ${OUTPUT_FILE}`);
}

extract().catch(console.error);
