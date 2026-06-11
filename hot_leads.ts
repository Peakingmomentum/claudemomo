// Hot Leads Generator — pull motivated-seller lists for a zip code,
// stack them by overlap, skip-trace top results, output ready-to-dial list.
//
// Usage:
//   npx tsx hot_leads.ts --zip 85001 --state AZ --top 50 --out hot_leads.csv
//   npx tsx hot_leads.ts --zip 85001 --state AZ --provider propstream --top 100
//
// Required env vars (at least one list source + one skip trace):
//   PROPSTREAM_API_KEY or BATCHLEADS_API_KEY   ← list pulling
//   REISKIP_API_KEY or BATCHLEADS_API_KEY       ← skip tracing
//
// You can also supply local CSVs instead of API pulling:
//   npx tsx hot_leads.ts \
//     --absentee data/absentee.csv \
//     --pre_foreclosure data/pf.csv \
//     --zip 85001 --top 50

import * as fs from 'fs';
import { stackLists, summarize, ListType } from './src/tools/list_stacker.js';
import { loadCsv, fetchPropStream, fetchBatchLeads } from './src/tools/list_providers.js';
import { skipTrace, toEnrichedCsv, summarizeEnriched } from './src/tools/skip_tracer.js';

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
  const zip = args.zip;
  const state = args.state;
  const topN = parseInt(args.top || '50', 10);
  const outPath = args.out || `hot_leads_${zip || 'output'}.csv`;
  const listProvider = (args.provider || 'propstream') as 'propstream' | 'batchleads';
  const skipProvider = args.skip_provider as 'reiskip' | 'batchskip' | undefined;
  const noSkip = args.no_skip === 'true';
  const minScore = parseInt(args.min_score || '60', 10);

  // ── 1. Load lists ──────────────────────────────────────────

  const sources = [];

  // Local CSV overrides
  let hasCsv = false;
  for (const lt of LIST_FLAGS) {
    if (args[lt]) {
      if (!fs.existsSync(args[lt])) { console.error(`File not found: ${args[lt]}`); process.exit(1); }
      console.log(`  CSV  ${lt}: ${args[lt]}`);
      sources.push(loadCsv(args[lt], lt));
      hasCsv = true;
    }
  }

  // API pull if no CSVs supplied
  if (!hasCsv) {
    if (!zip) { console.error('Provide --zip <zip_code> or local CSV flags.'); process.exit(1); }
    console.log(`\nPulling lists for zip ${zip}${state ? ', ' + state : ''} via ${listProvider}…`);
    const pullOpts = { zip, state, limit: 500 };

    if (listProvider === 'propstream') {
      if (!process.env.PROPSTREAM_API_KEY) { console.error('PROPSTREAM_API_KEY not set'); process.exit(1); }
      for (const lt of LIST_FLAGS) {
        try {
          console.log(`  Fetching ${lt}…`);
          sources.push(await fetchPropStream({ list_type: lt, ...pullOpts }));
        } catch (e: any) {
          console.warn(`  Warning: ${lt} fetch failed — ${e.message}`);
        }
      }
    } else {
      if (!process.env.BATCHLEADS_API_KEY) { console.error('BATCHLEADS_API_KEY not set'); process.exit(1); }
      for (const lt of LIST_FLAGS) {
        const listId = args[`${lt}_list_id`];
        if (!listId) { console.warn(`  Skipping ${lt} (no --${lt}_list_id)`); continue; }
        try {
          console.log(`  Fetching ${lt} (list ${listId})…`);
          sources.push(await fetchBatchLeads({ list_type: lt, list_id: listId, ...pullOpts }));
        } catch (e: any) {
          console.warn(`  Warning: ${lt} fetch failed — ${e.message}`);
        }
      }
    }
  }

  if (sources.length === 0) {
    console.error('No list sources loaded. Check your API keys or CSV paths.');
    process.exit(1);
  }

  // ── 2. Stack ───────────────────────────────────────────────

  console.log('\nStacking lists…');
  const stacked = stackLists(sources);
  console.log(summarize(stacked));

  const topLeads = stacked.slice(0, topN);
  console.log(`\nTaking top ${topLeads.length} leads for skip-tracing…`);

  // ── 3. Skip trace ──────────────────────────────────────────

  if (noSkip) {
    // Write stacked-only output
    const { toCsv } = await import('./src/tools/list_stacker.js');
    fs.writeFileSync(outPath, toCsv(topLeads));
    console.log(`\nWrote ${topLeads.length} stacked leads (no skip trace) → ${outPath}`);
    return;
  }

  console.log('\nSkip-tracing…');
  const enriched = await skipTrace(topLeads, {
    provider: skipProvider,
    minScore,
    skipDNC: true,
  });

  // ── 4. Write output ────────────────────────────────────────

  fs.writeFileSync(outPath, toEnrichedCsv(enriched));
  console.log('\n' + summarizeEnriched(enriched));
  console.log(`\nWrote ${enriched.length} enriched leads → ${outPath}`);
}

main().catch(err => { console.error(err); process.exit(1); });
