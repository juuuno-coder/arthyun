const fs = require('fs');
// Read raw buffer and inspect bytes to guess encoding?
// Or just assume utf8 and print with replacement chars?

const buffer = fs.readFileSync('public/backup/extracted/post_3942.txt');
console.log('Buffer length:', buffer.length);
// print first 200 chars as string
console.log(buffer.toString('utf8').substring(0, 500));

// Search for 'http'
const str = buffer.toString('utf8');
const idx = str.indexOf('http');
console.log('Index of http:', idx);
if (idx !== -1) {
    console.log('Substring around http:', str.substring(idx, idx + 100));
}
