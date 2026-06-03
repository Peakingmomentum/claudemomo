import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse, LIMITS } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

// ─── Types (inline so no cross-workspace import needed) ───────

type ListType = 'absentee' | 'pre_foreclosure' | 'trust_deed_sale' | 'tax_deed';

const LIST_WEIGHTS: Record<ListType, number> = {
  absentee: 1, pre_foreclosure: 3, trust_deed_sale: 4, tax_deed: 3,
};

interface RawLead {
  apn?: string; address?: string; city?: string; state?: string; zip?: string;
  owner_name?: string; phone?: string; email?: string;
  estimated_value?: number; equity?: number; default_amount?: number;
  auction_date?: string; tax_owed?: number; [k: string]: any;
}

interface StackedLead {
  match_key: string; apn?: string; address: string;
  city?: string; state?: string; zip?: string;
  owner_name?: string; phone?: string; email?: string;
  on_lists: ListType[]; list_count: number; motivation_score: number;
  signals: Record<string, any>; sources: string[];
}

// ─── Address normalization ────────────────────────────────────

const SUFFIXES: Record<string, string> = {
  street: 'st', str: 'st', avenue: 'ave', av: 'ave',
  boulevard: 'blvd', drive: 'dr', road: 'rd', lane: 'ln',
  court: 'ct', circle: 'cir', place: 'pl', way: 'way',
  parkway: 'pkwy', highway: 'hwy', trail: 'trl', terrace: 'ter',
};
const DIRS: Record<string, string> = {
  north: 'n', south: 's', east: 'e', west: 'w',
  northeast: 'ne', northwest: 'nw', southeast: 'se', southwest: 'sw',
};

function normalizeAddress(raw: string): string {
  if (!raw) return '';
  let s = raw.toLowerCase().trim()
    .replace(/\b(apt|apartment|unit|suite|ste|#)\s*[\w-]+/gi, '')
    .replace(/[.,#]/g, ' ').replace(/\s+/g, ' ').trim();
  return s.split(' ').map(t => SUFFIXES[t] || DIRS[t] || t).join(' ');
}

function matchKeys(lead: RawLead): string[] {
  const keys: string[] = [];
  if (lead.apn?.trim()) keys.push(`apn:${lead.apn.replace(/[-\s]/g, '').toLowerCase()}`);
  if (lead.address && lead.zip) {
    const norm = normalizeAddress(lead.address);
    const zip5 = String(lead.zip).slice(0, 5);
    if (norm && zip5) keys.push(`addr:${norm}|${zip5}`);
  }
  return keys;
}

// ─── Union-Find ───────────────────────────────────────────────

class UF {
  p = new Map<string, string>();
  find(x: string): string {
    if (!this.p.has(x)) this.p.set(x, x);
    const r = this.p.get(x)!;
    if (r === x) return x;
    const root = this.find(r); this.p.set(x, root); return root;
  }
  union(a: string, b: string) {
    const ra = this.find(a), rb = this.find(b);
    if (ra !== rb) this.p.set(ra, rb);
  }
}

// ─── Stacker ──────────────────────────────────────────────────

function stackLists(sources: { list_type: ListType; source: string; leads: RawLead[] }[]): StackedLead[] {
  type Entry = { lead: RawLead; list_type: ListType; source: string; keys: string[] };
  const entries: Entry[] = [];
  const uf = new UF();
  for (const src of sources) {
    for (const lead of src.leads) {
      const keys = matchKeys(lead);
      if (!keys.length) continue;
      for (let i = 1; i < keys.length; i++) uf.union(keys[0], keys[i]);
      entries.push({ lead, list_type: src.list_type, source: src.source, keys });
    }
  }
  const buckets = new Map<string, Entry[]>();
  for (const e of entries) {
    const root = uf.find(e.keys[0]);
    if (!buckets.has(root)) buckets.set(root, []);
    buckets.get(root)!.push(e);
  }
  const stacked: StackedLead[] = [];
  for (const [key, group] of buckets) {
    const on_lists_set = new Set<ListType>();
    const sources_set = new Set<string>();
    const signals: Record<string, any> = {};
    let best = group[0].lead;
    for (const { lead, list_type, source } of group) {
      on_lists_set.add(list_type); sources_set.add(source);
      if (Object.values(lead).filter(v => v != null && v !== '').length >
          Object.values(best).filter(v => v != null && v !== '').length) best = lead;
      if (list_type === 'pre_foreclosure' && lead.default_amount != null) signals.default_amount = lead.default_amount;
      if (list_type === 'trust_deed_sale' && lead.auction_date) signals.auction_date = lead.auction_date;
      if (list_type === 'tax_deed' && lead.tax_owed != null) signals.tax_owed = lead.tax_owed;
      if (lead.equity != null) signals.equity = lead.equity;
      if (lead.estimated_value != null) signals.estimated_value = lead.estimated_value;
    }
    const on_lists = Array.from(on_lists_set);
    const sumW = on_lists.reduce((a, t) => a + LIST_WEIGHTS[t], 0);
    const overlap = Math.max(0, on_lists.length - 1) * 0.5;
    stacked.push({
      match_key: key, apn: best.apn, address: best.address || '',
      city: best.city, state: best.state, zip: best.zip,
      owner_name: best.owner_name, phone: best.phone, email: best.email,
      on_lists, list_count: on_lists.length,
      motivation_score: +(sumW * (1 + overlap)).toFixed(2),
      signals, sources: Array.from(sources_set),
    });
  }
  return stacked.sort((a, b) => b.motivation_score - a.motivation_score || b.list_count - a.list_count);
}

// ─── PropStream fetch ─────────────────────────────────────────

const PROPSTREAM_FILTERS: Record<ListType, Record<string, any>> = {
  absentee:         { owner_occupied: false },
  pre_foreclosure:  { foreclosure_status: 'pre_foreclosure' },
  trust_deed_sale:  { foreclosure_status: 'auction' },
  tax_deed:         { tax_status: 'delinquent' },
};

async function fetchFromPropStream(zip: string, state: string, apiKey: string, limit = 500) {
  const sources = [];
  for (const lt of Object.keys(LIST_WEIGHTS) as ListType[]) {
    try {
      const res = await fetch('https://api.propstream.com/v1/search', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters: { ...PROPSTREAM_FILTERS[lt], zip, state }, limit }),
      });
      if (!res.ok) continue;
      const json: any = await res.json();
      const records = json.results || json.records || json.data || [];
      sources.push({ list_type: lt, source: 'propstream', leads: records as RawLead[] });
    } catch { /* skip failed list types */ }
  }
  return sources;
}

// ─── Skip trace ───────────────────────────────────────────────

async function skipTraceLeads(leads: StackedLead[], apiKey: string, provider: 'reiskip' | 'batchskip') {
  const BATCH = 50;
  const enriched: any[] = [];

  for (let i = 0; i < leads.length; i += BATCH) {
    const batch = leads.slice(i, i + BATCH);
    const records = batch.map((l, idx) => {
      const [first, ...rest] = (l.owner_name || '').split(' ');
      return { id: String(idx), first_name: first || '', last_name: rest.join(' ') || '',
        property_address: l.address, property_city: l.city || '',
        property_state: l.state || '', property_zip: l.zip || '' };
    });

    try {
      const url = provider === 'reiskip'
        ? 'https://api.reiskip.com/v1/skip-trace'
        : 'https://api.batchleads.io/v2/skip-trace';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      });
      if (!res.ok) { enriched.push(...batch.map(l => ({ ...l, skip_status: 'miss', phones: [], emails: [] }))); continue; }
      const json: any = await res.json();
      const returned: any[] = json.results || json.data || [];
      for (let j = 0; j < batch.length; j++) {
        const match = returned.find((r: any) => String(r.id) === String(j));
        if (!match) { enriched.push({ ...batch[j], skip_status: 'miss', phones: [], emails: [] }); continue; }
        const phones = (match.phones || match.phone_numbers || [])
          .filter((p: any) => !p.is_dnc && !p.dnc)
          .map((p: any) => ({ number: p.number || p.phone || '', type: p.type || p.line_type || 'unknown', score: p.score || 50 }))
          .filter((p: any) => p.number)
          .sort((a: any, b: any) => b.score - a.score);
        const emails = (match.emails || []).map((e: any) => typeof e === 'string' ? e : e.email || '').filter(Boolean);
        enriched.push({ ...batch[j], skip_status: phones.length ? 'hit' : 'miss', phones, emails,
          mailing_address: match.mailing_address || null });
      }
    } catch {
      enriched.push(...batch.map(l => ({ ...l, skip_status: 'error', phones: [], emails: [] })));
    }
    if (i + BATCH < leads.length) await new Promise(r => setTimeout(r, 300));
  }
  return enriched;
}

// ─── Route handler ────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const allowed = await checkRateLimit(`hot-leads:${user.id}`, LIMITS.hotLeads);
  if (!allowed) return rateLimitResponse(LIMITS.hotLeads);

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();
  if (!profile) return NextResponse.json({ error: 'no profile' }, { status: 400 });

  const body = await req.json();
  const { zip, state = '', top_n = 50 } = body;
  if (!zip) return NextResponse.json({ error: 'zip required' }, { status: 400 });

  // Determine which APIs are available
  const propstreamKey = profile.propstream_api_key;
  const batchleadsKey = profile.batchleads_api_key;
  const reiskipKey    = profile.reiskip_api_key;
  const batchskipKey  = batchleadsKey; // BatchLeads doubles as BatchSkip

  if (!propstreamKey && !batchleadsKey) {
    return NextResponse.json({ error: 'Connect PropStream or BatchLeads in Connectors first.' }, { status: 400 });
  }
  if (!reiskipKey && !batchskipKey) {
    return NextResponse.json({ error: 'Connect REISkip or BatchLeads (for skip tracing) in Connectors first.' }, { status: 400 });
  }

  // 1. Pull lists
  let sources: any[] = [];
  if (propstreamKey) {
    sources = await fetchFromPropStream(zip, state, propstreamKey, 500);
  }
  // TODO: add BatchLeads list pulling when batchleadsKey is set

  if (sources.length === 0) {
    return NextResponse.json({ error: 'No leads returned from list provider for that zip.' }, { status: 404 });
  }

  // 2. Stack
  const stacked = stackLists(sources).slice(0, top_n);

  // 3. Skip trace
  const skipProvider: 'reiskip' | 'batchskip' = reiskipKey ? 'reiskip' : 'batchskip';
  const skipKey = reiskipKey || batchskipKey!;
  const enriched = await skipTraceLeads(stacked, skipKey, skipProvider);

  // 4. Stats
  const hits = enriched.filter((l: any) => l.skip_status === 'hit').length;

  return NextResponse.json({
    zip,
    total: enriched.length,
    hits,
    leads: enriched,
  });
}
