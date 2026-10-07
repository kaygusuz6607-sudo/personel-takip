const fs = require('fs');
const readline = require('readline');

async function main() {
  const fileStream = fs.createReadStream('C:\\Users\\User\\.gemini\\antigravity\\brain\\313863bc-1131-4c1b-8f80-ad561fb76f65\\.system_generated\\logs\\transcript.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineNum = 0;
  for await (const line of rl) {
    lineNum++;
    const lower = line.toLowerCase();
    
    // Check if line mentions zeliha or burunsuz anywhere
    if (lower.includes('zeliha') || lower.includes('burunsuz')) {
      try {
        const obj = JSON.parse(line);
        console.log(`\n=== MATCH ZELIHA at line ${lineNum} (type=${obj.type}) ===`);
        if (obj.content) console.log("Content:", typeof obj.content === 'string' ? obj.content.substring(0, 300) : obj.content);
        if (obj.tool_calls) {
          for (const tc of obj.tool_calls) {
            console.log("Tool call:", tc.name, JSON.stringify(tc.args).substring(0, 300));
          }
        }
      } catch {}
    }

    // Check lines 1111 to 1200 for Vodafone details
    if (lineNum >= 1111 && lineNum <= 1200 && lower.includes('vodafone')) {
      try {
        const obj = JSON.parse(line);
        console.log(`\n=== VODAFONE at line ${lineNum} (type=${obj.type}) ===`);
        if (obj.content) console.log("Content:", typeof obj.content === 'string' ? obj.content.substring(0, 300) : obj.content);
        if (obj.tool_calls) {
          for (const tc of obj.tool_calls) {
            console.log("Tool call:", tc.name, JSON.stringify(tc.args).substring(0, 300));
          }
        }
      } catch {}
    }
  }
}

main();
