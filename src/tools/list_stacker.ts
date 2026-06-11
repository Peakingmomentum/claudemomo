// List Stacker — combines real-estate motivated-seller lists, identifies overlap,
// and ranks properties by motivation score.

import * as fs from 'fs';

// ─── Types ───────────────────────────────────────────────────

export type ListType = 'absentee' | 'pre_foreclosure' | 'trust_deed_sale' | 'tax_deed';

export interface RawLead {
  apn?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  owner_name?: string;
  owner_mailing_address?: string;
  phone?: string;
  email?: string;
  estimated_value?: number;
  equity?: number;
  loan_balance?: number;
  auction_date?: string;
  default_amount?: number;
  tax_owed?: number;
  years_owned?: number;
  [key: string]: any;
}

export interface ListSource {
  list_type: ListType;
  source: string;
  leads: RawLead[];
}

export interface StackedLead {
  match_key: string;
  apn?: string;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  owner_name?: string;
  phone?: string;
  email?: string;
  on_lists: ListType[];
  list_count: number;
  motivation_score: number;
  signals: Record<string, any>;
  sources: string[];
}

// ─── Weights ─────────────────────────────────────────────────

export const LIST_WEIGHTS: Record<ListType, number> = {
  absentee: 1,
  pre_foreclosure: 3,
  trust_deed_sale: 4,
  tax_deed: 3,
};

const OVERLAP_MULTIPLIER = 0.5;

// ─── Address normalization ───────────────────────────────────

const STREET_SUFFIXES: Record<string, string> = {
  street: 'st', str: 'st', st: 'st',
  avenue: 'ave', av: 'ave', ave: 'ave',
  boulevard: 'blvd', blvd: 'blvd',
  drive: 'dr', dr: 'dr',
  road: 'rd', rd: 'rd',
  lane: 'ln', ln: 'ln',
  court: 'ct', ct: 'ct',
  circle: 'cir', cir: 'cir',
  place: 'pl', pl: 'pl',
  terrace: 'ter', ter: 'ter',
  way: 'way',
  parkway: 'pkwy', pkwy: 'pkwy',
  highway: 'hwy', hwy: 'hwy',
  trail: 'trl', trl: 'trl',
};

const DIRECTIONALS: Record<string, string> = {
  north: 'n', n: 'n',
  south: 's', s: 's',
  east: 'e', e: 'e',
  west: 'w', w: 'w',
  northeast: 'ne', ne: 'ne',
  northwest: 'nw', nw: 'nw',
  southeast: 'se', se: 'se',
  southwest: 'sw', sw: 'sw',
};

export function normalizeAddress(raw: string): string {
  if (!raw) return '';
  let s = raw.toLowerCase().trim();
  s = s.replace(/\b(apt|apartment|unit|suite|ste|#)\s*[\w-]+/gi, '');
  s = s.replace(/[.,#]/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  const tokens = s.split(' ').map(t => {
    if (STREET_SUFFIXES[t]) return STREET_SUFFIXES[t];
    if (DIRECTIONALS[t]) return DIRECTIONALS[t];
    return t;
  });
  return tokens.join(' ');
}

export function matchKeys(lead: RawLead): string[] {
  const keys: string[] = [];
  if (lead.apn && lead.apn.trim()) {
    keys.push(`apn:${lead.apn.replace(/[-\s]/g, '').toLowerCase()}`);
  }
  if (lead.address && lead.zip) {
    const norm = normalizeAddress(lead.address);
    const zip5 = lead.zip.toString().slice(0, 5);
    if (norm && zip5) keys.push(`addr:${norm}|${zip5}`);
  }
  return keys;
}

// ─── Stacker ─────────────────────────────────────────────────

class UnionFind {
  parent = new Map<string, string>();
  find(x: string): string {
    if (!this.parent.has(x)) this.parent.set(x, x);
    let p = this.parent.get(x)!;
    if (p === x) return x;
    const root = this.find(p);
    this.parent.set(x, root);
    return root;
  }
  union(a: string, b: string) {
    const ra = this.find(a), rb = this.find(b);
    if (ra !== rb) this.parent.set(ra, rb);
  }
}

export function stackLists(sources: ListSource[]): StackedLead[] {
  type Entry = { lead: RawLead; list_type: ListType; source: string; keys: string[] };
  const entries: Entry[] = [];
  const uf = new UnionFind();

  let skipped = 0;
  for (const src of sources) {
    for (const lead of src.leads) {
      const keys = matchKeys(lead);
      if (keys.length === 0) { skipped++; continue; }
      for (let i = 1; i < keys.length; i++) uf.union(keys[0], keys[i]);
      entries.push({ lead, list_type: src.list_type, source: src.source, keys });
    }
  }
  if (skipped > 0) {
    console.warn(`[list_stacker] Skipped ${skipped} leads with no APN and no address+zip`);
  }

  const buckets = new Map<string, Entry[]>();
  for (const e of entries) {
    const root = uf.find(e.keys[0]);
    if (!buckets.has(root)) buckets.set(root, []);
    buckets.get(root)!.push(e);
  }

  const stacked: StackedLead[] = [];
  for (const [key, group] of Array.from(buckets.entries())) {
    const on_lists_set = new Set<ListType>();
    const sources_set = new Set<string>();
    const signals: Record<string, any> = {};
    let best: RawLead = group[0].lead;

    for (const { lead, list_type, source } of group) {
      on_lists_set.add(list_type);
      sources_set.add(source);
      if (Object.keys(lead).filter(k => lead[k] != null && lead[k] !== '').length >
          Object.keys(best).filter(k => best[k] != null && best[k] !== '').length) {
        best = lead;
      }
      if (list_type === 'pre_foreclosure' && lead.default_amount != null) signals.default_amount = lead.default_amount;
      if (list_type === 'trust_deed_sale' && lead.auction_date) signals.auction_date = lead.auction_date;
      if (list_type === 'tax_deed' && lead.tax_owed != null) signals.tax_owed = lead.tax_owed;
      if (lead.equity != null) signals.equity = lead.equity;
      if (lead.estimated_value != null) signals.estimated_value = lead.estimated_value;
    }

    const on_lists = Array.from(on_lists_set);
    const summedWeight = on_lists.reduce((acc, t) => acc + LIST_WEIGHTS[t], 0);
    const overlapBonus = Math.max(0, on_lists.length - 1) * OVERLAP_MULTIPLIER;
    const motivation_score = +(summedWeight * (1 + overlapBonus)).toFixed(2);

    stacked.push({
      match_key: key,
      apn: best.apn,
      address: best.address || '',
      city: best.city,
      state: best.state,
      zip: best.zip,
      owner_name: best.owner_name,
      phone: best.phone,
      email: best.email,
      on_lists,
      list_count: on_lists.length,
      motivation_score,
      signals,
      sources: Array.from(sources_set),
    });
  }

  stacked.sort((a, b) =>
    b.motivation_score - a.motivation_score ||
    b.list_count - a.list_count
  );
  return stacked;
}

// ─── Output helpers ──────────────────────────────────────────

export function toCsv(rows: StackedLead[]): string {
  const headers = [
    'match_key', 'apn', 'address', 'city', 'state', 'zip',
    'owner_name', 'phone', 'email',
    'list_count', 'on_lists', 'motivation_score',
    'estimated_value', 'equity', 'default_amount', 'auction_date', 'tax_owed',
    'sources',
  ];
  const esc = (v: any) => {
    if (v == null) return '';
    const s = Array.isArray(v) ? v.join('|') : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push([
      r.match_key, r.apn, r.address, r.city, r.state, r.zip,
      r.owner_name, r.phone, r.email,
      r.list_count, r.on_lists, r.motivation_score,
      r.signals.estimated_value, r.signals.equity,
      r.signals.default_amount, r.signals.auction_date, r.signals.tax_owed,
      r.sources,
    ].map(esc).join(','));
  }
  return lines.join('\n');
}

export function summarize(rows: StackedLead[]): string {
  const total = rows.length;
  const byCount = new Map<number, number>();
  for (const r of rows) byCount.set(r.list_count, (byCount.get(r.list_count) || 0) + 1);
  const top = rows.slice(0, 10);
  const lines = [
    `Stacked ${total} unique properties`,
    ...Array.from(byCount.entries()).sort((a, b) => b[0] - a[0])
      .map(([n, c]) => `  on ${n} list${n === 1 ? '' : 's'}: ${c} properties`),
    '',
    'Top 10 most motivated:',
    ...top.map((r, i) =>
      `  ${i + 1}. [${r.motivation_score}] ${r.address}, ${r.zip || ''} — on ${r.on_lists.join(', ')}`
    ),
  ];
  return lines.join('\n');
}

// ─── Agent tool integration (optional) ───────────────────────

import { loadCsv, fetchPropStream, fetchBatchLeads } from './list_providers.js';

export const stackListsToolDef = {
  name: 'stack_real_estate_lists',
  description:
    'Stack motivated-seller lists (absentee, pre-foreclosure, trust-deed-sale, tax-deed) and rank properties by motivation. ' +
    'Each `lists` item provides either a CSV `path` OR a `provider` API source. Returns the top N stacked leads.',
  input_schema: {
    type: 'object',
    properties: {
      lists: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            list_type: { type: 'string', enum: ['absentee', 'pre_foreclosure', 'trust_deed_sale', 'tax_deed'] },
            path: { type: 'string', description: 'Local CSV path (use this OR provider)' },
            provider: { type: 'string', enum: ['propstream', 'batchleads'] },
            provider_opts: {
              type: 'object',
              properties: {
                state: { type: 'string' }, county: { type: 'string' }, zip: { type: 'string' },
                limit: { type: 'number' }, list_id: { type: 'string' },
              },
            },
          },
          required: ['list_type'],
        },
      },
      top_n: { type: 'number' },
      out_csv: { type: 'string' },
    },
    required: ['lists'],
  },
};

export async function handleStackLists(args: any): Promise<string> {
  const lists = args?.lists || [];
  if (!Array.isArray(lists) || lists.length === 0) return 'Error: provide at least one list via `lists`.';
  const sources: ListSource[] = [];
  for (const item of lists) {
    const lt = item.list_type as ListType;
    if (item.path) {
      sources.push(loadCsv(item.path, lt));
    } else if (item.provider === 'propstream') {
      sources.push(await fetchPropStream({ list_type: lt, ...(item.provider_opts || {}) }));
    } else if (item.provider === 'batchleads') {
      const opts = item.provider_opts || {};
      if (!opts.list_id) return `Error: batchleads requires provider_opts.list_id for ${lt}`;
      sources.push(await fetchBatchLeads({ list_type: lt, ...opts }));
    } else {
      return `Error: list entry for ${lt} needs either path or provider.`;
    }
  }
  const stacked = stackLists(sources);
  const topN = args?.top_n ?? 25;
  if (args?.out_csv) fs.writeFileSync(args.out_csv, toCsv(stacked));
  const lines = [summarize(stacked.slice(0, topN))];
  if (args?.out_csv) lines.push(`\nFull ranked CSV: ${args.out_csv}`);
  return lines.join('\n');
}
