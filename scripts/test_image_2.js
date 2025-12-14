const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '../www/wp-content/uploads');
// 2019/03/1513690800645.jpg
const asciiFile = path.join(UPLOADS_DIR, '2019', '03', '1513690800645.jpg');

console.log('Testing ASCII path:', asciiFile);
console.log('Exists:', fs.existsSync(asciiFile));

// Check directory listing of 2019/03 using fs
console.log('Listing 2019/03:');
const dirPath = path.join(UPLOADS_DIR, '2019', '03');
if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach(file => {
        if (file.includes('1513690800645.jpg') || file.includes('무제')) {
            console.log('Found:', file);
        }
    });
} else {
    console.log('Dir 2019/03 not found');
}
