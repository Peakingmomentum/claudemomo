// CLI for the list stacker.
//
// Usage:
//   npx tsx stack_lists.ts \
//     --absentee data/absentee.csv \
//     --pre_foreclosure data/pf.csv \
//     --trust_deed_sale data/td.csv \
//     --tax_deed data/tax.csv \
//     --out stacked.csv
//
// Any list flag is optional — pass only the ones you have.

import * as fs from 'fs';
import { stackLists, toCsv, summarize, ListType } from './src/tools/list_stacker.js';
import { loadCsv } from './src/tools/list_providers.js';

const LIST_FLAGS: ListType[] = ['absentee', 'pre_foreclosure', 'trust_deed_sale', 'tax_deed'];

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const val = argv[i + 1];
      if (val && !val.startsWith('--')) { out[key] = val; i++; }
      else out[key] = 'true';
    }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv);
  const outPath = args.out || 'stacked.csv';

  const sources = [];
  for (const lt of LIST_FLAGS) {
    if (args[lt]) {
      if (!fs.existsSync(args[lt])) {
        console.error(`File not found for --${lt}: ${args[lt]}`);
        process.exit(1);
      }
      console.log(`Loading ${lt} from ${args[lt]}`);
      sources.push(loadCsv(args[lt], lt));
    }
  }

  if (sources.length === 0) {
    console.error('No lists provided. Pass at least one of: ' + LIST_FLAGS.map(f => '--' + f).join(', '));
    process.exit(1);
  }

  const stacked = stackLists(sources);
  fs.writeFileSync(outPath, toCsv(stacked));
  console.log('');
  console.log(summarize(stacked));
  console.log('');
  console.log(`Wrote ${stacked.length} rows → ${outPath}`);
}

main().catch(err => { console.error(err); process.exit(1); });
