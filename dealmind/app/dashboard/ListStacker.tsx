'use client';

import { useState, useRef, useCallback } from 'react';
import { Icon } from '@/components/Icon';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import type { DealMindUser } from '@/types';
import { useMobile } from '@/hooks/useMobile';

// ─── Config ────────────────────────────────────────────────────────────────────

const LIST_TYPES = [
  { key: 'absentee',        label: 'Absentee Owner',    color: '#5A8DEE', icon: 'home' as const },
  { key: 'pre_foreclosure', label: 'Pre-Foreclosure',   color: '#FF5C7C', icon: 'warning' as const },
  { key: 'trust_deed',      label: 'Trust Deed Sale',   color: '#FFB84D', icon: 'building' as const },
  { key: 'tax_deed',        label: 'Tax Deed',          color: '#3DDC97', icon: 'dollar' as const },
] as const;

type ListType = typeof LIST_TYPES[number]['key'];

interface StackedRow {
  address_normalized: string;
  owner_name: string;
  phone: string;
  email: string;
  list_types: string[];
  stack_count: number;
}

interface UploadState {
  status: 'idle' | 'parsing' | 'uploading' | 'done' | 'error';
  count: number;
  error?: string;
  listId?: string;
}

// ─── CSV Parser ────────────────────────────────────────────────────────────────

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());

  return lines.slice(1)
    .map(line => {
      const vals = parseCSVLine(line);
      return Object.fromEntries(headers.map((h, i) => [h, (vals[i] || '').trim()]));
    })
    .filter(row => Object.values(row).some(v => v));
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

function findCol(row: Record<string, string>, ...patterns: string[]): string {
  for (const p of patterns) {
    const match = Object.entries(row).find(([k]) => k.includes(p));
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return '';
}

function extractFields(row: Record<string, string>) {
  const street  = findCol(row, 'property address', 'prop addr', 'situs address', 'street address', 'address');
  const city    = findCol(row, 'property city', 'situs city', 'city');
  const state   = findCol(row, 'property state', 'situs state', 'state');
  const zip     = findCol(row, 'property zip', 'situs zip', 'zip', 'postal');
  const address = [street, city, state, zip].filter(Boolean).join(', ').replace(/,\s*,/g, ',');

  const owner_name = findCol(row,
    'owner name', 'owner 1 full name', 'owner full name', 'first name', 'contact name', 'name'
  );
  const phone = findCol(row,
    'phone 1', 'mobile', 'cell', 'phone number', 'telephone', 'phone'
  ).replace(/[^\d+]/g, '').replace(/^(\d{10})$/, '($1)'.replace(/\((\d{3})(\d{3})(\d{4})\)/, '($1) $2-$3'));

  const email = findCol(row, 'email', 'e-mail', 'email address');

  return { address, owner_name, phone, email };
}

function normalizeAddress(addr: string): string {
  return addr
    .toLowerCase()
    .replace(/[.,#'"]/g, '')
    .replace(/\bstreet\b/g, 'st')
    .replace(/\bavenue\b/g, 'ave')
    .replace(/\bboulevard\b/g, 'blvd')
    .replace(/\bdrive\b/g, 'dr')
    .replace(/\broad\b/g, 'rd')
    .replace(/\blane\b/g, 'ln')
    .replace(/\bcourt\b/g, 'ct')
    .replace(/\bcircle\b/g, 'cir')
    .replace(/\bplace\b/g, 'pl')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Component ─────────────────────────────────────────────────────────────────

interface Props {
  profile: DealMindUser;
}

export function ListStacker({ profile }: Props) {
  const supabase = createSupabaseBrowserClient();
  const isMobile = useMobile();
  const [uploads, setUploads] = useState<Record<ListType, UploadState>>(
    () => Object.fromEntries(LIST_TYPES.map(t => [t.key, { status: 'idle', count: 0 }])) as any
  );
  const [stacked, setStacked]   = useState<StackedRow[] | null>(null);
  const [loading, setLoading]   = useState(false);
  const [minStack, setMinStack] = useState(2);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pushing, setPushing]   = useState(false);
  const [pushDone, setPushDone] = useState(0);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const uploadedCount = Object.values(uploads).filter(u => u.status === 'done').length;

  // ── Upload a CSV for one list type ──────────────────────────────────────────
  async function handleFile(listType: ListType, file: File) {
    setUploads(u => ({ ...u, [listType]: { status: 'parsing', count: 0 } }));

    const text = await file.text();
    const rows = parseCSV(text);
    if (!rows.length) {
      setUploads(u => ({ ...u, [listType]: { status: 'error', count: 0, error: 'No rows found — check CSV format' } }));
      return;
    }

    setUploads(u => ({ ...u, [listType]: { status: 'uploading', count: rows.length } }));

    // Delete old list of same type for this user, then insert new
    const { data: existing } = await supabase
      .from('lead_lists')
      .select('id')
      .eq('user_id', profile.id)
      .eq('list_type', listType);

    if (existing?.length) {
      await supabase.from('lead_lists').delete().in('id', existing.map(r => r.id));
    }

    const { data: listRow, error: listErr } = await supabase
      .from('lead_lists')
      .insert({ user_id: profile.id, name: file.name, list_type: listType, row_count: rows.length })
      .select()
      .single();

    if (listErr || !listRow) {
      setUploads(u => ({ ...u, [listType]: { status: 'error', count: 0, error: listErr?.message || 'Failed to create list' } }));
      return;
    }

    // Batch insert entries in chunks of 500
    const entries = rows.map(row => {
      const { address, owner_name, phone, email } = extractFields(row);
      return {
        list_id:            listRow.id,
        user_id:            profile.id,
        address:            address || null,
        address_normalized: address ? normalizeAddress(address) : null,
        owner_name:         owner_name || null,
        phone:              phone || null,
        email:              email || null,
      };
    }).filter(e => e.address_normalized);

    const CHUNK = 500;
    for (let i = 0; i < entries.length; i += CHUNK) {
      const { error } = await supabase.from('list_entries').insert(entries.slice(i, i + CHUNK));
      if (error) {
        setUploads(u => ({ ...u, [listType]: { status: 'error', count: 0, error: error.message } }));
        return;
      }
    }

    setUploads(u => ({ ...u, [listType]: { status: 'done', count: entries.length, listId: listRow.id } }));
    setStacked(null); // reset results when lists change
  }

  // ── Run stacking ─────────────────────────────────────────────────────────────
  async function runStack() {
    setLoading(true);
    setStacked(null);
    setSelected(new Set());
    try {
      const res = await fetch('/api/stack-lists');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setStacked(json.data || []);
    } catch (e: any) {
      alert('Stacking failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Push selected to leads ────────────────────────────────────────────────────
  async function pushToLeads() {
    if (!stacked) return;
    setPushing(true);
    const rows = stacked.filter(r => selected.has(r.address_normalized));
    let count = 0;
    for (const row of rows) {
      const listLabel = row.list_types.map(t =>
        LIST_TYPES.find(l => l.key === t)?.label || t
      ).join(' + ');

      await supabase.from('leads').insert({
        user_id:    profile.id,
        name:       row.owner_name || row.address_normalized,
        property:   row.address_normalized,
        phone:      row.phone || null,
        email:      row.email || null,
        stage:      'New Lead',
        motivation: row.stack_count >= 3 ? 'High' : row.stack_count === 2 ? 'Medium' : 'Low',
        notes:      `Stacked from: ${listLabel} (${row.stack_count} lists)`,
      });
      count++;
    }
    setPushDone(count);
    setSelected(new Set());
    setPushing(false);
  }

  function toggleSelect(addr: string) {
    setSelected(s => {
      const next = new Set(s);
      next.has(addr) ? next.delete(addr) : next.add(addr);
      return next;
    });
  }

  function toggleAll(rows: StackedRow[]) {
    if (selected.size === rows.length) setSelected(new Set());
    else setSelected(new Set(rows.map(r => r.address_normalized)));
  }

  const visibleRows = stacked?.filter(r => r.stack_count >= minStack) || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div>
        <h2 style={{ marginBottom: 4 }}>List Stacker</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          Upload up to 4 list types. Properties appearing on multiple lists are your most motivated sellers.
        </p>
      </div>

      {/* Upload zones */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        {LIST_TYPES.map(lt => {
          const u = uploads[lt.key];
          return (
            <div key={lt.key} className="card" style={{
              borderColor: u.status === 'done' ? lt.color : 'var(--border)',
              borderWidth: u.status === 'done' ? 2 : 1,
              cursor: 'pointer',
              transition: 'border-color .2s',
            }}
              onClick={() => fileRefs.current[lt.key]?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) handleFile(lt.key, file);
              }}
            >
              <input
                ref={el => { fileRefs.current[lt.key] = el; }}
                type="file" accept=".csv" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(lt.key, f); e.target.value = ''; }}
              />
              <div style={{ marginBottom: 8, color: lt.color }}><Icon name={lt.icon} size={22} color={lt.color} /></div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{lt.label}</div>

              {u.status === 'idle' && (
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Drop CSV or click to upload</div>
              )}
              {(u.status === 'parsing' || u.status === 'uploading') && (
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {u.status === 'parsing' ? 'Parsing…' : `Uploading ${u.count} rows…`}
                </div>
              )}
              {u.status === 'done' && (
                <div style={{ fontSize: 12, color: lt.color, fontWeight: 600 }}>
                  ✓ {u.count.toLocaleString()} properties
                </div>
              )}
              {u.status === 'error' && (
                <div style={{ fontSize: 12, color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="warning" size={12} color="var(--danger)" />{u.error}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Stack button */}
      {uploadedCount >= 2 && (
        <button
          className="btn"
          onClick={runStack}
          disabled={loading}
          style={{ alignSelf: 'flex-start', fontSize: 15 }}
        >
          {loading ? 'Stacking…' : <><Icon name="bolt" size={15} />{` Stack ${uploadedCount} Lists`}</>}
        </button>
      )}
      {uploadedCount === 1 && (
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>
          Upload at least one more list to start stacking.
        </p>
      )}

      {/* Results */}
      {stacked !== null && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Summary pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <span style={{ fontWeight: 600 }}>
              {stacked.length.toLocaleString()} total properties stacked
            </span>
            {[4, 3, 2, 1].map(n => {
              const count = stacked.filter(r => r.stack_count >= n).length;
              return (
                <button
                  key={n}
                  onClick={() => setMinStack(n)}
                  style={{
                    padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                    border: `1px solid ${minStack === n ? 'var(--accent)' : 'var(--border)'}`,
                    background: minStack === n ? 'var(--accent)' : 'var(--surface)',
                    color: minStack === n ? '#fff' : 'var(--muted)',
                    cursor: 'pointer',
                  }}
                >
                  {n === 1 ? 'All' : `${n}+ lists`} ({count})
                </button>
              );
            })}
          </div>

          {/* Push bar */}
          {selected.size > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px', background: 'var(--surface)',
              borderRadius: 10, border: '1px solid var(--border)'
            }}>
              <span style={{ fontSize: 13 }}>{selected.size} selected</span>
              <button className="btn" style={{ padding: '8px 16px', fontSize: 13 }}
                onClick={pushToLeads} disabled={pushing}>
                {pushing ? 'Adding…' : '→ Add to Leads'}
              </button>
              <button className="btn btn-ghost" style={{ padding: '8px 12px', fontSize: 13 }}
                onClick={() => setSelected(new Set())}>
                Clear
              </button>
              {pushDone > 0 && (
                <span style={{ color: 'var(--success)', fontSize: 13, fontWeight: 600 }}>
                  ✓ {pushDone} added to leads
                </span>
              )}
            </div>
          )}

          {/* Table */}
          {visibleRows.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--muted)' }}>
              No properties match {minStack}+ lists. Try lowering the filter.
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', width: 32 }}>
                      <input type="checkbox"
                        checked={selected.size === visibleRows.length && visibleRows.length > 0}
                        onChange={() => toggleAll(visibleRows)} />
                    </th>
                    <th style={thStyle}>Address</th>
                    <th style={thStyle}>Owner</th>
                    <th style={thStyle}>Phone</th>
                    <th style={thStyle}>Lists</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row, i) => (
                    <tr key={row.address_normalized}
                      style={{
                        borderBottom: i < visibleRows.length - 1 ? '1px solid var(--border)' : 'none',
                        background: selected.has(row.address_normalized) ? 'rgba(90,141,238,0.06)' : undefined,
                        cursor: 'pointer',
                      }}
                      onClick={() => toggleSelect(row.address_normalized)}
                    >
                      <td style={{ padding: '10px 12px' }}>
                        <input type="checkbox" checked={selected.has(row.address_normalized)}
                          onChange={() => toggleSelect(row.address_normalized)}
                          onClick={e => e.stopPropagation()} />
                      </td>
                      <td style={tdStyle}>{row.address_normalized}</td>
                      <td style={tdStyle}>{row.owner_name || <span style={{ color: 'var(--muted)' }}>—</span>}</td>
                      <td style={tdStyle}>{row.phone || <span style={{ color: 'var(--muted)' }}>—</span>}</td>
                      <td style={{ ...tdStyle, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {row.list_types.map(t => {
                          const lt = LIST_TYPES.find(l => l.key === t);
                          return lt ? (
                            <span key={t} style={{
                              padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                              background: lt.color + '22', color: lt.color
                            }}>
                              {lt.label}
                            </span>
                          ) : null;
                        })}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 28, height: 28, borderRadius: '50%', fontWeight: 700,
                          fontSize: 13,
                          background: row.stack_count === 4 ? '#3DDC97' :
                                      row.stack_count === 3 ? '#FFB84D' :
                                      row.stack_count === 2 ? '#FF5C7C33' : 'var(--surface)',
                          color: row.stack_count >= 3 ? '#fff' : 'var(--text)',
                        }}>
                          {row.stack_count}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--muted)', fontSize: 12
};
const tdStyle: React.CSSProperties = {
  padding: '10px 12px', verticalAlign: 'middle'
};
