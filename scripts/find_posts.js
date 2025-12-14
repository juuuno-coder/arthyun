const fs = require("fs");
const readline = require("readline");

const fileStream = fs.createReadStream(
  "c:/Users/주노/Desktop/arthyun/public/backup/extracted/arthyun.co.kr-20190410-062700-679/database.sql"
);

const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity,
});

let lineNum = 0;
rl.on("line", (line) => {
  lineNum++;
  if (line.includes("INSERT INTO `SERVMASK_PREFIX_posts`")) {
    console.log(`Found at line: ${lineNum}`);
    console.log(line.substring(0, 200)); // Print start of line
    // Don't exit immediately, let's find all occurrences? usually it's one big insert or multiple.
    // Let's just exit on first to see.
    process.exit(0);
  }
});
