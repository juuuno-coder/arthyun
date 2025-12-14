const fs = require('fs');
const path = require('path');

const SQL_FILE = path.join(__dirname, 'arthyun.co.kr-20190410-062700-679', 'database.sql');

async function debugMenu() {
    const content = fs.readFileSync(SQL_FILE, 'utf8');
    
    // Look for term "Primary Menu" or similar
    const termMatch = content.match(/\((\d+),\s*'([^']*)',\s*'[^']*',\s*0\)/g);
    // Print all terms to see what menu is named
    if (termMatch) {
        console.log("Terms found:");
        termMatch.forEach(t => {
            if (t.includes('Menu') || t.includes('menu') || t.includes('gnb')) console.log(t);
        });
    }
    
    // Find nav_menu_item lines
    const lines = content.split('\n');
    let navItems = [];
    
    // Find the giant INSERT statement for posts
    // We can't split lines because it's one huge line.
    
    // Regex scan for 'nav_menu_item'
    const re = /\((\d+),[^\)]+?'([^']+?)',[^\)]+?'nav_menu_item'/g;
    
    // Let's rely on the previous run's finding if it worked? 
    // It outputted a table but it was empty/truncated in logs.
    
    // Let's try raw string search for menu names we expect: "About", "Contact", "Portfolio", "Archive"
    
    const keywords = ['About', 'Contact', 'Portfolio', 'Archive', 'Notice', 'News', '소개', '공지사항', '포트폴리오', '문의'];
    
    keywords.forEach(kw => {
        if (content.includes(`'${kw}'`)) {
            console.log(`Found keyword in DB: ${kw}`);
        }
    });
}

debugMenu();
