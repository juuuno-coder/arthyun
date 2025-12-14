const fs = require('fs');
const posts = JSON.parse(fs.readFileSync('public/backup/extracted/posts.json', 'utf8'));
const post = posts.find(p => p.id == 53);
if (post) {
    console.log(post.content);
}
