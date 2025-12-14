const fs = require('fs');
// Read logs and extract useful info (lines containing 'Checking:', 'Found:', 'Fuzzy match:')
const log = fs.readFileSync('public/backup/extracted/migration_log_2.txt', 'utf16le'); 
// Powershell > often produces UTF16.
// But `type` showed garbage chars "?쒕룞..." which suggests encoding mismatch in display vs file.
// Node `fs` reads buffer.

// Let's try reading as utf16le just in case, or utf8.
// The garbage output in `type` output ?쒕룞 implies UTF8 read as ANSI or similar.
// Let's just grep for "Fuzzy match" line or "Exact match".

const lines = log.split('\n');
const fuzzyMatches = lines.filter(l => l.includes('Fuzzy match'));
const exactMatches = lines.filter(l => l.includes('Exact match'));
const notFound = lines.filter(l => l.includes('Not found'));
const uploads = lines.filter(l => l.includes('Fixed') || l.includes('Upload')); // migrate_images_fuzzy doesn't log "Upload Success" explicitly? 
// It logs `console.error` for failure.
// It logged "Fixed: ..." commented out? No.
// It didn't log success? 
// Code: `pChanged = true;` no console log for success in Step 441 code except if I uncommented it?
// Step 441 code: `if (localPath) { ... if (!upErr) { ... pChanged = true; } else { console.error... } }`
// The log `Checking:` is printed.

console.log(`Fuzzy Matches: ${fuzzyMatches.length}`);
if (fuzzyMatches.length > 0) console.log(fuzzyMatches[0]);

console.log(`Exact Matches: ${exactMatches.length}`);
if (exactMatches.length > 0) console.log(exactMatches[0]);

console.log(`Not Found: ${notFound.length}`);
if (notFound.length > 0) console.log(notFound[0]);

// Dump a bit of the log around the first "Checking:"
const checkIdx = lines.findIndex(l => l.includes('Checking:'));
if (checkIdx !== -1) {
    console.log('--- Log around Checking ---');
    console.log(lines.slice(checkIdx, checkIdx + 10).join('\n'));
}

