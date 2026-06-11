// Skip Tracer — enriches stacked leads with phone, email, and owner contact info.
//
// Supported providers:
//   REISkip   → set REISKIP_API_KEY
//   BatchSkip → set BATCHLEADS_API_KEY (uses BatchLeads skip-trace endpoint)
//
// Usage:
//   import { skipTrace } from './skip_tracer.js';
//   const enriched = await skipTrace(stackedLeads, { provider: 'reiskip', batchSize: 50 });

import type { StackedLead } from './list_stacker.js';

// ─── Types ───────────────────────────────────────────────────

export interface SkipTraceResult {
  phones: PhoneResult[];
  emails: string[];
  relatives: string[];
  mailing_address?: string;
  do_not_call: boolean;
}

export interface PhoneResult {
  number: string;
  type: 'mobile' | 'landline' | 'voip' | 'unknown';
  score: number; // 0–100 confidence
  do_not_call: boolean;
}

export interface EnrichedLead extends StackedLead {
  skip_trace?: SkipTraceResult;
  skip_status: 'hit' | 'miss' | 'pending' | 'skipped';
}

export type SkipProvider = 'reiskip' | 'batchskip';

export interface SkipTraceOpts {
  provider?: SkipProvider;
  batchSize?: number;       // records per API call (default 50)
  minScore?: number;        // min phone confidence to include (default 60)
  skipDNC?: boolean;        // exclude DNC numbers (default true)
  concurrency?: number;     // parallel batch requests (default 3)
}

// ─── Main entry point ─────────────────────────────────────────

export async function skipTrace(
  leads: StackedLead[],
  opts: SkipTraceOpts = {}
): Promise<EnrichedLead[]> {
  const {
    provider = detectProvider(),
    batchSize = 50,
    minScore = 60,
    skipDNC = true,
    concurrency = 3,
  } = opts;

  if (!provider) {
    console.warn('[skip_tracer] No API key found. Set REISKIP_API_KEY or BATCHLEADS_API_KEY.');
    return leads.map(l => ({ ...l, skip_status: 'skipped' as const }));
  }

  console.log(`[skip_tracer] Skip-tracing ${leads.length} leads via ${provider} (batch=${batchSize})`);

  // Split into batches
  const batches: StackedLead[][] = [];
  for (let i = 0; i < leads.length; i += batchSize) {
    batches.push(leads.slice(i, i + batchSize));
  }

  const results: EnrichedLead[] = [];
  // Process with concurrency limit
  for (let i = 0; i < batches.length; i += concurrency) {
    const chunk = batches.slice(i, i + concurrency);
    const settled = await Promise.allSettled(
      chunk.map(batch =>
        provider === 'reiskip'
          ? batchREISkip(batch, minScore, skipDNC)
          : batchBatchSkip(batch, minScore, skipDNC)
      )
    );
    for (const result of settled) {
      if (result.status === 'fulfilled') results.push(...result.value);
      else console.error('[skip_tracer] Batch error:', result.reason?.message);
    }
    if (i + concurrency < batches.length) {
      await delay(300); // brief pause between concurrency windows
    }
  }

  const hits = results.filter(r => r.skip_status === 'hit').length;
  console.log(`[skip_tracer] Done. Hits: ${hits}/${leads.length}`);
  return results;
}

// ─── REISkip adapter ─────────────────────────────────────────

async function batchREISkip(
  leads: StackedLead[],
  minScore: number,
  skipDNC: boolean
): Promise<EnrichedLead[]> {
  const apiKey = process.env.REISKIP_API_KEY;
  if (!apiKey) throw new Error('REISKIP_API_KEY not set');

  const records = leads.map((l, idx) => {
    const [first, ...rest] = (l.owner_name || '').split(' ');
    return {
      id: String(idx),
      first_name: first || '',
      last_name: rest.join(' ') || '',
      property_address: l.address,
      property_city: l.city || '',
      property_state: l.state || '',
      property_zip: l.zip || '',
    };
  });

  const res = await fetch('https://api.reiskip.com/v1/skip-trace', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ records }),
  });

  if (!res.ok) throw new Error(`REISkip ${res.status}: ${await res.text()}`);
  const json: any = await res.json();
  const returned: any[] = json.results || json.records || json.data || [];

  return leads.map((lead, idx) => {
    const match = returned.find((r: any) => String(r.id) === String(idx) || r.id === idx);
    if (!match) return { ...lead, skip_status: 'miss' as const };
    return { ...lead, skip_status: 'hit' as const, skip_trace: parseREISkipResult(match, minScore, skipDNC) };
  });
}

function parseREISkipResult(r: any, minScore: number, skipDNC: boolean): SkipTraceResult {
  const rawPhones: any[] = r.phones || r.phone_numbers || [];
  const phones: PhoneResult[] = rawPhones
    .map((p: any) => ({
      number: p.number || p.phone || '',
      type: (p.type || 'unknown').toLowerCase() as PhoneResult['type'],
      score: Number(p.score || p.confidence || 50),
      do_not_call: !!(p.dnc || p.do_not_call),
    }))
    .filter(p => p.number && p.score >= minScore && !(skipDNC && p.do_not_call))
    .sort((a, b) => b.score - a.score);

  const emails: string[] = (r.emails || r.email_addresses || [])
    .map((e: any) => (typeof e === 'string' ? e : e.email || e.address || ''))
    .filter(Boolean);

  return {
    phones,
    emails,
    relatives: (r.relatives || r.associated_people || []).map((x: any) => x.name || x).filter(Boolean),
    mailing_address: r.mailing_address || r.owner_address || undefined,
    do_not_call: !!(r.dnc || r.do_not_call),
  };
}

// ─── BatchLeads BatchSkip adapter ────────────────────────────

async function batchBatchSkip(
  leads: StackedLead[],
  minScore: number,
  skipDNC: boolean
): Promise<EnrichedLead[]> {
  const apiKey = process.env.BATCHLEADS_API_KEY;
  if (!apiKey) throw new Error('BATCHLEADS_API_KEY not set');

  const records = leads.map((l, idx) => ({
    id: String(idx),
    property_address: l.address,
    property_city: l.city || '',
    property_state: l.state || '',
    property_zip: l.zip || '',
    owner_name: l.owner_name || '',
  }));

  const res = await fetch('https://api.batchleads.io/v2/skip-trace', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ records }),
  });

  if (!res.ok) throw new Error(`BatchSkip ${res.status}: ${await res.text()}`);
  const json: any = await res.json();
  const returned: any[] = json.results || json.data || [];

  return leads.map((lead, idx) => {
    const match = returned.find((r: any) => String(r.id) === String(idx));
    if (!match) return { ...lead, skip_status: 'miss' as const };
    return { ...lead, skip_status: 'hit' as const, skip_trace: parseBatchSkipResult(match, minScore, skipDNC) };
  });
}

function parseBatchSkipResult(r: any, minScore: number, skipDNC: boolean): SkipTraceResult {
  const rawPhones: any[] = r.phones || r.phone_results || [];
  const phones: PhoneResult[] = rawPhones
    .map((p: any) => ({
      number: p.number || p.phone_number || '',
      type: mapPhoneType(p.line_type || p.type || ''),
      score: Number(p.score || p.rank || 50),
      do_not_call: !!(p.is_dnc || p.do_not_call),
    }))
    .filter(p => p.number && p.score >= minScore && !(skipDNC && p.do_not_call))
    .sort((a, b) => b.score - a.score);

  const emails: string[] = (r.emails || [])
    .map((e: any) => (typeof e === 'string' ? e : e.email || ''))
    .filter(Boolean);

  return {
    phones,
    emails,
    relatives: (r.relatives || []).map((x: any) => x.name || x).filter(Boolean),
    mailing_address: r.mailing_address || undefined,
    do_not_call: !!(r.is_dnc || r.do_not_call),
  };
}

function mapPhoneType(raw: string): PhoneResult['type'] {
  const s = raw.toLowerCase();
  if (s.includes('mobile') || s.includes('cell') || s.includes('wireless')) return 'mobile';
  if (s.includes('land') || s.includes('fixed')) return 'landline';
  if (s.includes('voip')) return 'voip';
  return 'unknown';
}

// ─── Output helpers ───────────────────────────────────────────

export function toEnrichedCsv(rows: EnrichedLead[]): string {
  const headers = [
    'motivation_score', 'list_count', 'on_lists',
    'address', 'city', 'state', 'zip', 'apn',
    'owner_name',
    'phone_1', 'phone_1_type', 'phone_1_score',
    'phone_2', 'phone_2_type',
    'phone_3', 'phone_3_type',
    'email_1', 'email_2',
    'mailing_address',
    'do_not_call',
    'estimated_value', 'equity', 'default_amount', 'auction_date', 'tax_owed',
    'skip_status', 'sources',
  ];
  const esc = (v: any) => {
    if (v == null) return '';
    const s = Array.isArray(v) ? v.join('|') : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(',')];
  for (const r of rows) {
    const st = r.skip_trace;
    const p = st?.phones || [];
    lines.push([
      r.motivation_score, r.list_count, r.on_lists,
      r.address, r.city, r.state, r.zip, r.apn,
      r.owner_name,
      p[0]?.number, p[0]?.type, p[0]?.score,
      p[1]?.number, p[1]?.type,
      p[2]?.number, p[2]?.type,
      st?.emails[0], st?.emails[1],
      st?.mailing_address,
      st?.do_not_call ? 'Y' : 'N',
      r.signals.estimated_value, r.signals.equity,
      r.signals.default_amount, r.signals.auction_date, r.signals.tax_owed,
      r.skip_status, r.sources,
    ].map(esc).join(','));
  }
  return lines.join('\n');
}

export function summarizeEnriched(rows: EnrichedLead[]): string {
  const hits = rows.filter(r => r.skip_status === 'hit');
  const withPhone = hits.filter(r => (r.skip_trace?.phones.length ?? 0) > 0);
  const withMobile = hits.filter(r => r.skip_trace?.phones.some(p => p.type === 'mobile'));
  const withEmail = hits.filter(r => (r.skip_trace?.emails.length ?? 0) > 0);
  const dnc = hits.filter(r => r.skip_trace?.do_not_call);

  const lines = [
    `Skip-trace results: ${hits.length}/${rows.length} hits`,
    `  With phone:  ${withPhone.length}  |  Mobile: ${withMobile.length}`,
    `  With email:  ${withEmail.length}`,
    `  DNC flagged: ${dnc.length}`,
    '',
    'Top 10 hot leads (score × contact info):',
    ...rows
      .filter(r => r.skip_status === 'hit' && (r.skip_trace?.phones.length ?? 0) > 0)
      .slice(0, 10)
      .map((r, i) => {
        const p = r.skip_trace!.phones[0];
        return `  ${i + 1}. [${r.motivation_score}] ${r.address}, ${r.zip} — ${p.number} (${p.type}) | ${r.on_lists.join(', ')}`;
      }),
  ];
  return lines.join('\n');
}

// ─── Utilities ────────────────────────────────────────────────

function detectProvider(): SkipProvider | null {
  if (process.env.REISKIP_API_KEY) return 'reiskip';
  if (process.env.BATCHLEADS_API_KEY) return 'batchskip';
  return null;
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }
