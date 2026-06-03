'use client';

import { useState } from 'react';
import type { DealMindUser } from '@/types';

interface Phone { number: string; type: string; score: number; }

interface HotLead {
  address: string; city?: string; state?: string; zip?: string;
  owner_name?: string; apn?: string;
  on_lists: string[]; list_count: number; motivation_score: number;
  signals: Record<string, any>;
  phones: Phone[]; emails: string[];
  mailing_address?: string;
  skip_status: 'hit' | 'miss' | 'error';
}

interface Props { profile: DealMindUser; }

const LIST_COLORS: Record<string, string> = {
  absentee: '#4a90d9',
  pre_foreclosure: '#ef4444',
  trust_deed_sale: '#f97316',
  tax_deed: '#f59e0b',
};

const LIST_LABELS: Record<string, string> = {
  absentee: 'Absentee',
  pre_foreclosure: 'Pre-FC',
  trust_deed_sale: 'TD Sale',
  tax_deed: 'Tax Deed',
};

const SCORE_COLOR = (s: number) => s >= 20 ? '#ef4444' : s >= 10 ? '#f97316' : s >= 5 ? '#f59e0b' : '#4a90d9';

export function HotLeads({ profile }: Props) {
  const [zip, setZip]         = useState('');
  const [state, setState]     = useState(profile.city?.split(',')[1]?.trim() || '');
  const [topN, setTopN]       = useState(50);
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<{ zip: string; total: number; hits: number; leads: HotLead[] } | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [filter, setFilter]   = useState<'all' | 'hit'>('hit');
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const hasListConnector  = !!(profile.propstream_api_key || profile.batchleads_api_key);
  const hasSkipConnector  = !!(profile.reiskip_api_key || profile.batchleads_api_key);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    if (!zip.trim()) return;
    setLoading(true); setError(null); setResult(null); setSelected(new Set());
    try {
      const res = await fetch('/api/hot-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zip: zip.trim(), state: state.trim(), top_n: topN }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || 'Failed to generate list.');
      else setResult(data);
    } catch {
      setError('Network error. Try again.');
    }
    setLoading(false);
  }

  function pushToLeads(leads: HotLead[]) {
    // TODO: wire to /api/leads bulk insert
    alert(`Push ${leads.length} leads to pipeline — coming soon!`);
  }

  function downloadCsv() {
    if (!result) return;
    const headers = ['Score','Lists','Address','City','State','Zip','Owner','Phone 1','Phone Type','Phone 2','Email','Mailing Address','Equity','Default Amt','Auction Date'];
    const rows = result.leads.map(l => [
      l.motivation_score, l.on_lists.join('|'), l.address, l.city, l.state, l.zip,
      l.owner_name, l.phones[0]?.number, l.phones[0]?.type, l.phones[1]?.number,
      l.emails[0], l.mailing_address,
      l.signals.equity, l.signals.default_amount, l.signals.auction_date,
    ].map(v => v == null ? '' : String(v).includes(',') ? `"${v}"` : v).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `hot_leads_${result.zip}.csv`; a.click();
  }

  const displayLeads = result?.leads.filter(l => filter === 'all' || l.skip_status === 'hit') || [];
  const selectedLeads = displayLeads.filter((_, i) => selected.has(i));

  function toggleSelect(i: number) {
    setSelected(s => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; });
  }
  function selectAll() { setSelected(new Set(displayLeads.map((_, i) => i))); }
  function clearAll() { setSelected(new Set()); }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div>
        <h2 style={{ marginBottom: 4 }}>Hot Lead Generator</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          Enter a zip code → pulls motivated-seller lists → stacks overlaps → skip-traces top results → ready-to-dial list.
        </p>
      </div>

      {/* Connector warnings */}
      {(!hasListConnector || !hasSkipConnector) && (
        <div style={{ padding: '14px 16px', borderRadius: 10, background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.2)', fontSize: 13 }}>
          <strong>⚠ Setup needed in Connectors tab:</strong>
          <ul style={{ margin: '6px 0 0', paddingLeft: 20, color: 'var(--muted)' }}>
            {!hasListConnector && <li>Connect <strong>PropStream</strong> or <strong>BatchLeads</strong> to pull lists</li>}
            {!hasSkipConnector && <li>Connect <strong>REISkip</strong> or <strong>BatchLeads</strong> for skip tracing</li>}
          </ul>
        </div>
      )}

      {/* Form */}
      <div className="card">
        <form onSubmit={generate} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Zip Code *</label>
            <input value={zip} onChange={e => setZip(e.target.value)} required maxLength={5}
              placeholder='85001' style={{ ...inputStyle, width: 110 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>State</label>
            <input value={state} onChange={e => setState(e.target.value)} maxLength={2}
              placeholder='AZ' style={{ ...inputStyle, width: 60 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top N leads</label>
            <select value={topN} onChange={e => setTopN(Number(e.target.value))} style={{ ...inputStyle, width: 90 }}>
              {[25, 50, 100, 250].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <button type='submit' className='btn' disabled={loading || !hasListConnector || !hasSkipConnector}
            style={{ padding: '10px 24px', height: 40 }}>
            {loading ? '⏳ Generating…' : '🔥 Generate Hot Leads'}
          </button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.2)', color: '#dc2626', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
          <div style={{ fontSize: 14, marginBottom: 10 }}>Pulling lists, stacking overlaps, and skip-tracing…</div>
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444',
                animation: 'pulse 1.4s ease-in-out infinite', animationDelay: `${i * 0.2}s`, opacity: 0.8 }} />
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { label: 'Total Properties', value: result.total, color: '#4a90d9' },
              { label: 'Skip-Traced Hits', value: result.hits, color: '#10b981' },
              { label: 'Miss / No Data',   value: result.total - result.hits, color: '#94a3b8' },
              { label: 'Hit Rate',         value: `${Math.round((result.hits / result.total) * 100)}%`, color: '#f59e0b' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card" style={{ padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 2, background: 'var(--surface)', borderRadius: 8, padding: 3, border: '1px solid var(--border)' }}>
              {(['hit', 'all'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600,
                  background: filter === f ? 'var(--card)' : 'transparent',
                  color: filter === f ? 'var(--text)' : 'var(--muted)',
                  boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
                }}>
                  {f === 'hit' ? '📞 With Contact' : 'All Results'}
                </button>
              ))}
            </div>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{displayLeads.length} showing</span>
            <div style={{ flex: 1 }} />
            <button onClick={selectAll} style={ghostBtn}>Select All</button>
            <button onClick={clearAll} style={ghostBtn}>Clear</button>
            {selected.size > 0 && (
              <button className="btn" style={{ padding: '6px 14px', fontSize: 12 }}
                onClick={() => pushToLeads(selectedLeads)}>
                ➕ Add {selected.size} to Pipeline
              </button>
            )}
            <button onClick={downloadCsv} style={ghostBtn}>⬇ Export CSV</button>
          </div>

          {/* Table */}
          <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                  <th style={th}></th>
                  <th style={th}>Score</th>
                  <th style={th}>Address</th>
                  <th style={th}>Owner</th>
                  <th style={th}>Lists</th>
                  <th style={th}>Phone</th>
                  <th style={th}>Email</th>
                  <th style={th}>Signals</th>
                </tr>
              </thead>
              <tbody>
                {displayLeads.map((lead, i) => (
                  <tr key={i} onClick={() => toggleSelect(i)} style={{
                    borderBottom: '1px solid var(--border)', cursor: 'pointer',
                    background: selected.has(i) ? 'rgba(74,144,217,.04)' : 'var(--card)',
                    transition: 'background .1s',
                  }}>
                    <td style={{ ...td, width: 36, textAlign: 'center' }}>
                      <div style={{
                        width: 16, height: 16, borderRadius: 4, border: '2px solid var(--border)',
                        background: selected.has(i) ? '#4a90d9' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto',
                      }}>
                        {selected.has(i) && <span style={{ color: '#fff', fontSize: 9 }}>✓</span>}
                      </div>
                    </td>
                    <td style={td}>
                      <span style={{
                        fontWeight: 800, fontSize: 14, color: SCORE_COLOR(lead.motivation_score)
                      }}>{lead.motivation_score}</span>
                    </td>
                    <td style={td}>
                      <div style={{ fontWeight: 600 }}>{lead.address}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{[lead.city, lead.state, lead.zip].filter(Boolean).join(', ')}</div>
                    </td>
                    <td style={td}>
                      <div>{lead.owner_name || '—'}</div>
                      {lead.mailing_address && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{lead.mailing_address}</div>}
                    </td>
                    <td style={td}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {lead.on_lists.map(lt => (
                          <span key={lt} style={{
                            fontSize: 10, padding: '2px 6px', borderRadius: 999, fontWeight: 700,
                            background: (LIST_COLORS[lt] || '#94a3b8') + '18',
                            color: LIST_COLORS[lt] || '#94a3b8',
                          }}>{LIST_LABELS[lt] || lt}</span>
                        ))}
                      </div>
                    </td>
                    <td style={td}>
                      {lead.phones.length > 0 ? (
                        <div>
                          {lead.phones.slice(0, 2).map((p, j) => (
                            <div key={j} style={{ fontSize: 12 }}>
                              <a href={`tel:${p.number}`} onClick={e => e.stopPropagation()}
                                style={{ color: '#4a90d9', textDecoration: 'none', fontWeight: 600 }}>
                                {p.number}
                              </a>
                              <span style={{ color: 'var(--muted)', marginLeft: 4, fontSize: 10 }}>{p.type}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--muted)', fontSize: 11 }}>—</span>
                      )}
                    </td>
                    <td style={td}>
                      {lead.emails[0]
                        ? <a href={`mailto:${lead.emails[0]}`} onClick={e => e.stopPropagation()}
                            style={{ color: '#4a90d9', fontSize: 12, textDecoration: 'none' }}>{lead.emails[0]}</a>
                        : <span style={{ color: 'var(--muted)', fontSize: 11 }}>—</span>
                      }
                    </td>
                    <td style={td}>
                      <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {lead.signals.equity && <span>💰 Equity ${Number(lead.signals.equity).toLocaleString()}</span>}
                        {lead.signals.default_amount && <span>⚠ Default ${Number(lead.signals.default_amount).toLocaleString()}</span>}
                        {lead.signals.auction_date && <span>📅 Auction {lead.signals.auction_date}</span>}
                        {lead.signals.tax_owed && <span>🏛 Tax ${Number(lead.signals.tax_owed).toLocaleString()}</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8,
  fontSize: 13, fontFamily: 'inherit', background: 'var(--surface)', color: 'var(--text)', outline: 'none',
};
const th: React.CSSProperties = {
  padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)',
};
const td: React.CSSProperties = { padding: '10px 14px', verticalAlign: 'top' };
const ghostBtn: React.CSSProperties = {
  padding: '6px 12px', fontSize: 12, background: 'none',
  border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', color: 'var(--muted)',
};
