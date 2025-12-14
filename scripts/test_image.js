const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '../www/wp-content/uploads');
const testFile = '2019/03/무제-2_대지-1.jpg'; // From json snippet earlier, line 88? No, line 88 was 'http://arthyun.co.kr/wp-content/uploads/2019/03/무제-2_대지-1.jpg'

// Actually looking at lists '2018', '2019' are dirs.
const possiblePath = path.join(UPLOADS_DIR, '2019', '03', '무제-2_대지-1.jpg');

console.log('Testing path:', possiblePath);
console.log('Exists:', fs.existsSync(possiblePath));

// Also check flat path
const flatPath = path.join(UPLOADS_DIR, '무제-2_대지-1.jpg');
console.log('Testing flat path:', flatPath);
console.log('Exists:', fs.existsSync(flatPath));
