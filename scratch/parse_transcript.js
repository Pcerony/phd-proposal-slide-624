const fs = require('fs');
const readline = require('readline');

async function main() {
  const fileStream = fs.createReadStream('/Users/heisei/.gemini/antigravity/brain/2f72d974-60ee-4ed7-aa13-264e4d7ab8a0/.system_generated/logs/transcript.jsonl');
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const outPath = '/Users/heisei/Library/CloudStorage/OneDrive-个人/Desktop/博士材料/624报告/scratch/reconstruct_logs.txt';
  const outStream = fs.createWriteStream(outPath);

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.tool_calls) {
        obj.tool_calls.forEach(tc => {
          const argsStr = JSON.stringify(tc.args || {});
          if (tc.name === 'run_command' || argsStr.includes('design-topic-card') || argsStr.includes('research-design-grid') || argsStr.includes('design-sankey-stage')) {
            outStream.write(`=== Step ${obj.step_index} (${obj.type}) ===\n`);
            outStream.write(`Tool: ${tc.name}\n`);
            outStream.write(JSON.stringify(tc.args, null, 2) + '\n\n');
          }
        });
      }
    } catch (err) {
      // ignore
    }
  }
  outStream.end();
  console.log('Logs written to scratch/reconstruct_logs.txt');
}

main().catch(console.error);
