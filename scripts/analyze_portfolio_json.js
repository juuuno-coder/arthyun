const fs = require('fs');
const path = require('path');

const PORTFOLIO_FILE = path.join(__dirname, 'portfolio.json');

function analyzePortfolioJson() {
    console.log("Reading portfolio.json...");
    try {
        if (!fs.existsSync(PORTFOLIO_FILE)) {
            console.log("portfolio.json not found!");
            return;
        }
        const rawData = fs.readFileSync(PORTFOLIO_FILE, 'utf8');
        const posts = JSON.parse(rawData);
        
        console.log(`Total items in portfolio.json: ${posts.length}`);

        const typeCounts = {};
        const statusCounts = {};
        
        posts.forEach(p => {
            const t = p.type || 'undefined';
            const s = p.status || 'undefined';
            typeCounts[t] = (typeCounts[t] || 0) + 1;
            statusCounts[s] = (statusCounts[s] || 0) + 1;
        });

        console.log("\n--- Portfolio JSON Distribution ---");
        console.log("Types:", JSON.stringify(typeCounts, null, 2));
        console.log("Statuses:", JSON.stringify(statusCounts, null, 2));

        // List all titles to see if user recognizes missing ones
        // console.log("\n--- Portfolio Titles ---");
        // posts.forEach(p => console.log(`[${p.id}] ${p.title}`));

    } catch (e) {
        console.error("Error reading portfolio.json:", e);
    }
}

analyzePortfolioJson();
