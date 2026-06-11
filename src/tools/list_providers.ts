// Providers for the list stacker — CSV upload + API adapter stubs.
//
// Env vars (optional, only needed for API providers):
//   PROPSTREAM_API_KEY=...
//   BATCHLEADS_API_KEY=...

import * as fs from 'fs';
import { ListType, RawLead, ListSource } from './list_stacker.js';

// ─── CSV loader ──────────────────────────────────────────────

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c === '\r') { /* skip */ }
      else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  if (rows.length === 0) return [];
  const headers = rows[0].map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  return rows.slice(1)
    .filter(r => r.some(c => c.trim() !== ''))
    .map(r => Object.fromEntries(headers.map((h, i) => [h, (r[i] || '').trim()])));
}

// Map common column-name variants → RawLead fields
const COLUMN_ALIASES: Record<string, string> = {
  apn: 'apn', parcel: 'apn', parcel_number: 'apn', parcel_id: 'apn', assessor_parcel_number: 'apn',
  property_address: 'address', site_address: 'address', address: 'address', situs_address: 'address',
  property_city: 'city', city: 'city', situs_city: 'city',
  property_state: 'state', state: 'state', situs_state: 'state',
  property_zip: 'zip', zip: 'zip', zip_code: 'zip', situs_zip: 'zip', postal_code: 'zip',
  owner_name: 'owner_name', owner: 'owner_name', owner_full_name: 'owner_name',
  mailing_address: 'owner_mailing_address', owner_mailing_address: 'owner_mailing_address',
  phone: 'phone', phone_number: 'phone', primary_phone: 'phone',
  email: 'email', primary_email: 'email',
  estimated_value: 'estimated_value', avm: 'estimated_value', market_value: 'estimated_value',
  equity: 'equity', estimated_equity: 'equity',
  loan_balance: 'loan_balance', mortgage_balance: 'loan_balance',
  auction_date: 'auction_date', sale_date: 'auction_date', trustee_sale_date: 'auction_date',
  default_amount: 'default_amount', amount_in_default: 'default_amount',
  tax_owed: 'tax_owed', delinquent_taxes: 'tax_owed', taxes_owed: 'tax_owed',
  years_owned: 'years_owned', ownership_length: 'years_owned',
};

function toNumber(v: string): number | undefined {
  if (!v) return undefined;
  const n = Number(v.replace(/[$,]/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

function mapRow(row: Record<string, string>): RawLead {
  const out: RawLead = {};
  for (const [k, v] of Object.entries(row)) {
    const target = COLUMN_ALIASES[k];
    if (!target) { out[k] = v; continue; }
    if (['estimated_value', 'equity', 'loan_balance', 'default_amount', 'tax_owed', 'years_owned'].includes(target)) {
      (out as any)[target] = toNumber(v);
    } else {
      (out as any)[target] = v;
    }
  }
  return out;
}

export function loadCsv(filePath: string, list_type: ListType): ListSource {
  const text = fs.readFileSync(filePath, 'utf8');
  const rows = parseCsv(text);
  return {
    list_type,
    source: `csv:${filePath.split('/').pop()}`,
    leads: rows.map(mapRow),
  };
}

// ─── API provider adapters ───────────────────────────────────
// Endpoint URLs/payload shapes below are PLACEHOLDERS — confirm against your
// account's actual API docs before pointing at real data.
//
// Other providers to consider adding: ListSource, REISift, DealMachine,
// PropertyRadar — same pattern (fetch → map → return ListSource).

export interface ProviderFetchOpts {
  list_type: ListType;
  county?: string;
  state?: string;
  zip?: string;
  limit?: number;
}

export async function fetchPropStream(opts: ProviderFetchOpts): Promise<ListSource> {
  const apiKey = process.env.PROPSTREAM_API_KEY;
  if (!apiKey) throw new Error('PROPSTREAM_API_KEY not set');

  const filterMap: Record<ListType, Record<string, any>> = {
    absentee: { owner_occupied: false },
    pre_foreclosure: { foreclosure_status: 'pre_foreclosure' },
    trust_deed_sale: { foreclosure_status: 'auction' },
    tax_deed: { tax_status: 'delinquent' },
  };

  const res = await fetch('https://api.propstream.com/v1/search', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filters: { ...filterMap[opts.list_type], state: opts.state, zip: opts.zip, county: opts.county },
      limit: opts.limit ?? 1000,
    }),
  });
  if (!res.ok) throw new Error(`PropStream ${res.status}: ${await res.text()}`);
  const json: any = await res.json();
  const records = json.results || json.records || json.data || [];
  return {
    list_type: opts.list_type,
    source: 'propstream',
    leads: records.map(mapApiRecord),
  };
}

export async function fetchBatchLeads(opts: ProviderFetchOpts & { list_id: string }): Promise<ListSource> {
  const apiKey = process.env.BATCHLEADS_API_KEY;
  if (!apiKey) throw new Error('BATCHLEADS_API_KEY not set');
  const res = await fetch(`https://api.batchleads.io/v1/lists/${opts.list_id}/records?limit=${opts.limit ?? 1000}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });
  if (!res.ok) throw new Error(`BatchLeads ${res.status}: ${await res.text()}`);
  const json: any = await res.json();
  return {
    list_type: opts.list_type,
    source: `batchleads:${opts.list_id}`,
    leads: (json.records || json.data || []).map(mapApiRecord),
  };
}

function mapApiRecord(rec: any): RawLead {
  const flat: Record<string, any> = {};
  const merge = (obj: any) => { if (obj && typeof obj === 'object') for (const k in obj) flat[k.toLowerCase()] = obj[k]; };
  merge(rec);
  merge(rec.property);
  merge(rec.owner);
  merge(rec.address);
  const out: RawLead = {};
  for (const [k, v] of Object.entries(flat)) {
    const target = COLUMN_ALIASES[k];
    if (target) (out as any)[target] = v;
    else out[k] = v;
  }
  return out;
}
