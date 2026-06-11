'use client';

import { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { Icon } from '@/components/Icon';
import type { Lead, DealMindUser, CalendarEvent, UserRole } from '@/types';
import { useMobile } from '@/hooks/useMobile';
import { getStages } from '@/lib/roleConfig';

function parseNotes(raw: string | null): { date: string | null; text: string }[] {
  if (!raw?.trim()) return [];
  const lines = raw.split('\n').filter(l => l.trim());
  const entries: { date: string | null; text: string }[] = [];
  let current: { date: string | null; text: string } | null = null;
  for (const line of lines) {
    const m = line.match(/^\[([^\]]+)\]\s*(.*)$/);
    if (m) {
      if (current) entries.push(current);
      current = { date: m[1], text: m[2] };
    } else if (current) {
      current.text += ' ' + line;
    } else {
      entries.push({ date: null, text: line });
    }
  }
  if (current) entries.push(current);
  return entries.reverse(); // newest first
}

function appendNote(existing: string | null, text: string): string {
  const d = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  return existing?.trim() ? `${existing.trim()}\n[${d}] ${text.trim()}` : `[${d}] ${text.trim()}`;
}

// STAGES is now role-specific — computed inside the component from profile.user_role
const MOTIVATIONS = ['Unknown', 'Low', 'Medium', 'High'];

// ─── Lead scoring ─────────────────────────────────────────────────────────────
// Returns 0–100 normalized score. Notes activity + AI urgency both contribute.

function scoreLead(lead: Lead): number {
  let raw = 0;

  // Motivation (0–40)
  raw += ({ High: 40, Medium: 25, Low: 10, Unknown: 5 } as Record<string, number>)[lead.motivation] ?? 5;

  // Stage (0–35) — closer to close = more valuable
  raw += ({
    Negotiating: 35, 'Under Contract': 30, Contacted: 20,
    Nurturing: 15, 'New Lead': 10, Closed: 0, Dead: 0,
  } as Record<string, number>)[lead.stage] ?? 5;

  // Recency of last contact (0–25) — fresh contact = higher score
  if      (lead.last_contact === 0)  raw += 25;
  else if (lead.last_contact <= 3)   raw += 20;
  else if (lead.last_contact <= 7)   raw += 12;
  else if (lead.last_contact <= 14)  raw += 5;

  // AI urgency from enrichment — includes note analysis (0–20)
  if (lead.ai_enrichment) {
    raw += ({ high: 20, medium: 12, low: 5 } as Record<string, number>)[lead.ai_enrichment.urgency] ?? 0;
  }

  // Notes activity: each timestamped entry signals engagement (0–15)
  if (lead.notes) {
    const entryCount = (lead.notes.match(/^\[/gm) || []).length;
    raw += Math.min(entryCount * 3, 15);
  }

  // Contact completeness — more info = more actionable (0–5)
  if (lead.phone) raw += 3;
  if (lead.email) raw += 2;

  // Normalize to 0–100 (max raw ≈ 140)
  return Math.min(100, Math.round((raw / 140) * 100));
}

// Real "latest activity" recency (ms since epoch), high = most recent.
// 1) newest timestamp parsed from the Activity Log notes, else
// 2) the lead's updated_at, else
// 3) a fallback derived from last_contact (days-ago).
function activityTs(lead: Lead): number {
  const notes = lead.notes || '';
  let newest = 0;
  for (const m of notes.matchAll(/\[([^\]]+)\]/g)) {
    const raw = m[1];
    const withYear = /\d{4}/.test(raw) ? raw : `${raw} ${new Date().getFullYear()}`;
    const t = Date.parse(withYear);
    if (!Number.isNaN(t)) newest = Math.max(newest, t);
  }
  if (newest) return newest;
  const updated = (lead as any).updated_at;
  if (updated) {
    const t = Date.parse(updated);
    if (!Number.isNaN(t)) return t;
  }
  return Date.now() - (lead.last_contact || 0) * 86_400_000;
}

type SortMode = 'score' | 'activity' | 'alpha';

const SCORE_TIER = (s: number) =>
  s >= 70 ? { label: 'Hot',  color: '#ef4444' } :
  s >= 45 ? { label: 'Warm', color: '#f59e0b' } :
            { label: 'Cool', color: '#4a90d9' };

interface Props {
  profile: DealMindUser;
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  calendar: CalendarEvent[];
  focusLeadId?: string | null;
  onFocusCleared?: () => void;
}

// ─── Import helpers ───────────────────────────────────────────────────────────

function parseFile(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function guessCol(headers: string[], ...patterns: string[]): string {
  for (const p of patterns) {
    const h = headers.find(h => h.toLowerCase().includes(p.toLowerCase()));
    if (h) return h;
  }
  return '';
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MyLeads({ profile, leads, setLeads, calendar, focusLeadId, onFocusCleared }: Props) {
  const supabase = createSupabaseBrowserClient();
  const isMobile = useMobile();
  // Role-specific pipeline stages (falls back to wholesaler stages if no role set yet)
  const STAGES = getStages(profile.user_role ?? 'wholesaler');
  const [sortBy, setSortBy] = useState<SortMode>('score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  function handleSort(mode: SortMode) {
    if (mode === sortBy) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(mode);
      // Sensible default per mode: score = hottest first, activity = most recent first, alpha = A–Z
      setSortDir(mode === 'alpha' ? 'asc' : 'desc');
    }
  }
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Partial<Lead>>({ name: '', property: '', stage: 'New Lead', motivation: 'Unknown' });
  const importRef = useRef<HTMLInputElement | null>(null);
  const [importing, setImporting] = useState(false);
  const [importRows, setImportRows] = useState<Record<string, string>[] | null>(null);
  const [colMap, setColMap] = useState<Record<string, string>>({});
  const [importProgress, setImportProgress] = useState<{ done: number; total: number } | null>(null);

  async function handleImportFile(file: File) {
    setImporting(true);
    try {
      const rows = await parseFile(file);
      if (!rows.length) { alert('No rows found in file.'); setImporting(false); return; }
      const headers = Object.keys(rows[0]);
      setColMap({
        name:     guessCol(headers, 'owner name', 'owner', 'name', 'contact', 'first name'),
        property: guessCol(headers, 'property address', 'address', 'situs', 'prop addr', 'street'),
        phone:    guessCol(headers, 'phone', 'mobile', 'cell', 'telephone'),
        email:    guessCol(headers, 'email'),
        notes:    guessCol(headers, 'notes', 'comment', 'description'),
      });
      setImportRows(rows);
    } catch {
      alert('Could not parse file. Make sure it is a valid CSV or XLSX.');
    }
    setImporting(false);
  }

  async function confirmImport() {
    if (!importRows) return;
    setImportProgress({ done: 0, total: importRows.length });
    const CHUNK = 100;
    const newLeads: Lead[] = [];

    for (let i = 0; i < importRows.length; i += CHUNK) {
      const batch = importRows.slice(i, i + CHUNK).map(row => ({
        user_id:    profile.id,
        name:       (colMap.name    ? row[colMap.name]    : '') || 'Unknown',
        property:   colMap.property ? row[colMap.property] : null,
        phone:      colMap.phone    ? row[colMap.phone]    : null,
        email:      colMap.email    ? row[colMap.email]    : null,
        notes:      colMap.notes    ? row[colMap.notes]    : null,
        stage:      'New Lead',
        motivation: 'Unknown',
      }));
      const { data, error } = await supabase.from('leads').insert(batch).select();
      if (!error && data) newLeads.push(...(data as Lead[]));
      setImportProgress({ done: Math.min(i + CHUNK, importRows.length), total: importRows.length });
    }

    setLeads(l => [...newLeads, ...l]);
    setImportRows(null);
    setImportProgress(null);

    // Enrich imported leads in background — stagger requests to avoid hammering API
    newLeads.forEach((lead, i) => {
      setTimeout(() => {
        fetch('/api/enrich-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lead_id: lead.id }),
        })
          .then(r => r.json())
          .then(({ enrichment }) => {
            if (enrichment) {
              setLeads(l => l.map(x => x.id === lead.id ? { ...x, ai_enrichment: enrichment } : x));
            }
          })
          .catch(() => {});
      }, i * 200); // 200ms stagger per lead
    });
  }

  async function addLead() {
    if (!draft.name?.trim()) return;
    const { data, error } = await supabase
      .from('leads')
      .insert({ ...draft, user_id: profile.id })
      .select()
      .single();
    if (!error && data) {
      setLeads(l => [data as Lead, ...l]);
      setDraft({ name: '', property: '', stage: 'New Lead', motivation: 'Unknown' });
      setAdding(false);
    }
  }

  async function updateLead(id: string, patch: Partial<Lead>) {
    const { data, error } = await supabase.from('leads').update(patch).eq('id', id).select().single();
    if (!error && data) {
      setLeads(l => l.map(x => x.id === id ? (data as Lead) : x));
    }
  }

  async function deleteLead(id: string) {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (!error) setLeads(l => l.filter(x => x.id !== id));
  }

  const active = leads.filter(l => !l.is_dead);
  const pipelineValue = active.reduce((sum, l) => sum + (l.deal_value || 0), 0);

  const sorted = [...active].sort((a, b) => {
    let cmp: number;
    if (sortBy === 'alpha')         cmp = a.name.localeCompare(b.name);
    else if (sortBy === 'activity') cmp = activityTs(a) - activityTs(b);
    else                            cmp = scoreLead(a) - scoreLead(b); // ascending base
    return sortDir === 'asc' ? cmp : -cmp;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 8 : 0 }}>
        <div>
          <h2 style={{ margin: 0 }}>{active.length} active leads</h2>
          {pipelineValue > 0 && (
            <div style={{ fontSize: 13, color: '#10b981', fontWeight: 700, marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Icon name="dollar" size={13} color="#10b981" />
              ${pipelineValue.toLocaleString()} pipeline value
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input ref={importRef} type="file" accept=".csv,.xlsx,.xls"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleImportFile(f); e.target.value = ''; }} />
          <button className="btn btn-ghost" onClick={() => importRef.current?.click()} disabled={importing}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icon name="upload" size={15} />{importing ? 'Reading…' : 'Import CSV / XLS'}
          </button>
          <button className="btn" onClick={() => setAdding(a => !a)}>
            <Icon name="plus" /> Add lead
          </button>
        </div>
      </div>

      {/* Sort bar */}
      {active.length > 1 && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 4 }}>Sort</span>
          {([
            ['score',    'Lead Score',      'spark'],
            ['activity', 'Latest Activity', 'clock'],
            ['alpha',    'A – Z',           'pipeline'],
          ] as Array<[SortMode, string, any]>).map(([mode, label, icon]) => {
            const isActive = sortBy === mode;
            // Label reflects direction so the toggle is obvious
            const dirLabel = mode === 'alpha'
              ? (isActive && sortDir === 'desc' ? 'Z – A' : 'A – Z')
              : label;
            const caret = isActive ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';
            return (
              <button key={mode} onClick={() => handleSort(mode)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                background: isActive ? 'var(--accent)' : 'transparent',
                color: isActive ? '#fff' : 'var(--muted)',
                cursor: 'pointer',
              }}>
                <Icon name={icon} size={12} />{dirLabel}{caret}
              </button>
            );
          })}
        </div>
      )}

      {/* Import progress */}
      {importProgress && (
        <div className="card" style={{ color: 'var(--muted)', fontSize: 13 }}>
          Importing… {importProgress.done} / {importProgress.total}
          <div style={{ marginTop: 8, background: 'var(--border)', borderRadius: 4, height: 6 }}>
            <div style={{
              height: 6, borderRadius: 4, background: 'var(--accent)',
              width: `${(importProgress.done / importProgress.total) * 100}%`,
              transition: 'width .2s'
            }} />
          </div>
        </div>
      )}

      {/* Column mapping modal */}
      {importRows && !importProgress && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>
              Map columns — {importRows.length.toLocaleString()} rows detected
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              We auto-detected these. Fix any that look wrong before importing.
            </div>
          </div>
          {(['name','property','phone','email','notes'] as const).map(field => {
            const headers = ['(skip)', ...Object.keys(importRows[0])];
            return (
              <div key={field} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 90, fontWeight: 600, fontSize: 13, textTransform: 'capitalize' }}>{field}</div>
                <select
                  value={colMap[field] || '(skip)'}
                  onChange={e => setColMap(m => ({ ...m, [field]: e.target.value === '(skip)' ? '' : e.target.value }))}
                  style={{ flex: 1 }}
                >
                  {headers.map(h => <option key={h}>{h}</option>)}
                </select>
                {colMap[field] && importRows[0][colMap[field]] && (
                  <div style={{ fontSize: 12, color: 'var(--muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    e.g. {importRows[0][colMap[field]]}
                  </div>
                )}
              </div>
            );
          })}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={confirmImport}>
              Import {importRows.length.toLocaleString()} leads
            </button>
            <button className="btn btn-ghost" onClick={() => setImportRows(null)}>Cancel</button>
          </div>
        </div>
      )}

      {adding && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input placeholder="Lead name" value={draft.name || ''} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} />
          <input placeholder="Property / address" value={draft.property || ''} onChange={e => setDraft(d => ({ ...d, property: e.target.value }))} />
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8 }}>
            <input placeholder="Phone" value={draft.phone || ''} onChange={e => setDraft(d => ({ ...d, phone: e.target.value }))} />
            <input placeholder="Email" value={draft.email || ''} onChange={e => setDraft(d => ({ ...d, email: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8 }}>
            <select value={draft.stage || 'New Lead'} onChange={e => setDraft(d => ({ ...d, stage: e.target.value }))}>
              {STAGES.map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={draft.motivation || 'Unknown'} onChange={e => setDraft(d => ({ ...d, motivation: e.target.value }))}>
              {MOTIVATIONS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={addLead}>Save</button>
            <button className="btn btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {sorted.map(l => (
        <LeadCard
          key={l.id}
          lead={l}
          stages={STAGES}
          score={sortBy === 'score' ? scoreLead(l) : undefined}
          calendarEvents={calendar.filter(e => e.lead_id === l.id)}
          onUpdate={patch => updateLead(l.id, patch)}
          onDelete={() => deleteLead(l.id)}
          isMobile={isMobile}
          focusLead={l.id === focusLeadId}
          onFocused={onFocusCleared}
        />
      ))}

      {active.length === 0 && !adding && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)' }}>
          No leads yet. Click "Add lead" to start.
        </div>
      )}
    </div>
  );
}

const URGENCY_COLOR = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };

function LeadCard({
  lead, stages, score, calendarEvents, onUpdate, onDelete, isMobile, focusLead, onFocused
}: {
  lead: Lead;
  stages: string[];
  score?: number;
  calendarEvents: CalendarEvent[];
  onUpdate: (patch: Partial<Lead>) => void;
  onDelete: () => void;
  isMobile: boolean;
  focusLead?: boolean;
  onFocused?: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded]   = useState(false);

  useEffect(() => {
    if (!focusLead) return;
    setExpanded(true);
    // Small delay so the tab switch + render settles before scrolling
    setTimeout(() => {
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      onFocused?.();
    }, 120);
  }, [focusLead]);
  const [aiTab, setAiTab]         = useState<'sms' | 'email' | 'signals'>('sms');
  const [copied, setCopied]       = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const ai = lead.ai_enrichment;
  const upcomingEvents = calendarEvents
    .filter(e => new Date(e.event_date) >= new Date())
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div ref={cardRef} className="card" style={{ scrollMarginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
           onClick={() => setExpanded(e => !e)}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 16 }}>{lead.name}</span>
            {ai && (
              <span style={{
                fontSize: 10, padding: '2px 7px', borderRadius: 999, fontWeight: 700,
                background: (URGENCY_COLOR[ai.urgency] || '#4a90d9') + '15',
                color: URGENCY_COLOR[ai.urgency] || '#4a90d9',
              }}>
                {ai.urgency} urgency
              </span>
            )}
            {ai && <span style={{ fontSize: 10, color: '#10b981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}><Icon name="spark" size={10} color="#10b981" />AI ready</span>}
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span>{lead.property || ''} · {lead.stage} · {lead.motivation} motivation</span>
            {lead.deal_value ? (
              <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 999, background: 'rgba(16,185,129,.12)', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <Icon name="dollar" size={10} color="#10b981" />${lead.deal_value.toLocaleString()}
              </span>
            ) : null}
          </div>
          {ai?.next_action && !expanded && (
            <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 3 }}>
              → {ai.next_action}
            </div>
          )}
          {upcomingEvents.length > 0 && !expanded && (
            <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 3, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Icon name="clock" size={12} color="#f59e0b" />
              {upcomingEvents[0].title} · {new Date(upcomingEvents[0].event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          {score !== undefined && (() => {
            const tier = SCORE_TIER(score);
            return (
              <div
                title={'Lead Score (0–100) — higher = hotter.\n• Motivation: High 40 / Medium 25 / Low 10\n• Stage: Negotiating 35 → Under Contract 30 → Contacted 20 → New 10\n• Recency: contacted today 25 → within 3d 20 → 7d 12 → 14d 5\n• AI urgency: up to 20\n• Notes & activity: up to 15\n• Phone/email on file: up to 5'}
                style={{
                display: 'flex', alignItems: 'center', gap: 4, cursor: 'help',
                padding: '3px 9px', borderRadius: 999, fontSize: 11, fontWeight: 800,
                background: tier.color + '15', color: tier.color, border: `1px solid ${tier.color}30`,
              }}>
                <Icon name="spark" size={10} color={tier.color} />
                {score} · {tier.label}
              </div>
            );
          })()}
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Upcoming follow-ups / tasks */}
          {upcomingEvents.length > 0 && (
            <div style={{ borderRadius: 10, border: '1px solid rgba(245,158,11,.25)', overflow: 'hidden' }}>
              <div style={{
                padding: '8px 14px',
                background: 'linear-gradient(135deg, rgba(245,158,11,.06), rgba(245,158,11,.02))',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Icon name="clock" size={12} color="#f59e0b" />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Upcoming Follow-ups
                </span>
              </div>
              <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcomingEvents.slice(0, 3).map(evt => {
                  const evtDate = new Date(evt.event_date);
                  const isToday = evtDate.toDateString() === new Date().toDateString();
                  const script = ai?.follow_up_sms?.[0];
                  return (
                    <div key={evt.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '8px 12px', borderRadius: 8,
                        background: isToday ? 'rgba(245,158,11,.08)' : 'var(--surface)',
                        border: `1px solid ${isToday ? 'rgba(245,158,11,.25)' : 'var(--border)'}`,
                      }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{evt.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                            {isToday ? 'Today · ' : ''}{evtDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            {' · '}{evtDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </div>
                        </div>
                        {isToday && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#f59e0b20', color: '#f59e0b' }}>Today</span>
                        )}
                      </div>
                      {/* AI script for this follow-up */}
                      {script && (
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, paddingLeft: 8 }}>
                          <div style={{ flex: 1, padding: '7px 11px', borderRadius: 8, fontSize: 12, color: 'var(--muted)', background: 'var(--surface)', border: '1px solid var(--border)', lineHeight: 1.5 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-label)', display: 'block', marginBottom: 3 }}>AI SCRIPT</span>
                            {script}
                          </div>
                          <button
                            onClick={() => { navigator.clipboard.writeText(script); setCopied(`evt-${evt.id}`); setTimeout(() => setCopied(null), 2000); }}
                            style={{ flexShrink: 0, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--muted)' }}>
                            {copied === `evt-${evt.id}` ? '✓' : 'Copy'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Enrichment panel */}
          {ai && (
            <div style={{ borderRadius: 10, border: '1px solid rgba(74,144,217,.2)', overflow: 'hidden' }}>
              <div style={{
                padding: '8px 14px', background: 'linear-gradient(135deg, rgba(74,144,217,.06), rgba(15,76,129,.06))',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-label)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="spark" size={11} color="var(--accent)" />AI Suggestions
                </span>
                <div style={{ display: 'flex', gap: 2 }}>
                  {(['sms', 'email', 'signals'] as const).map(t => (
                    <button key={t} onClick={() => setAiTab(t)} style={{
                      padding: '3px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11,
                      fontWeight: 600,
                      background: aiTab === t ? 'var(--accent)' : 'transparent',
                      color: aiTab === t ? '#fff' : 'var(--muted)',
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}>
                      <Icon name={t === 'signals' ? 'chart-bar' : t === 'sms' ? 'message' : 'mail'} size={11} />
                      {t === 'signals' ? 'Signals' : t === 'sms' ? 'SMS' : 'Email'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ padding: '12px 14px' }}>
                {aiTab === 'sms' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {ai.follow_up_sms.map((msg, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{
                          flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 13,
                          background: 'var(--surface)', border: '1px solid var(--border)'
                        }}>{msg}</div>
                        <button onClick={() => copy(msg, `sms-${i}`)} style={{
                          flexShrink: 0, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)',
                          background: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--muted)'
                        }}>
                          {copied === `sms-${i}` ? '✓' : 'Copy'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {aiTab === 'email' && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{
                      flex: 1, padding: '10px 12px', borderRadius: 8, fontSize: 13, whiteSpace: 'pre-wrap',
                      background: 'var(--surface)', border: '1px solid var(--border)'
                    }}>{ai.follow_up_email}</div>
                    <button onClick={() => copy(ai.follow_up_email, 'email')} style={{
                      flexShrink: 0, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)',
                      background: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--muted)'
                    }}>
                      {copied === 'email' ? '✓' : 'Copy'}
                    </button>
                  </div>
                )}
                {aiTab === 'signals' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 2 }}>MOTIVATION SIGNALS</div>
                    {ai.motivation_signals.map((s, i) => (
                      <div key={i} style={{ fontSize: 13, padding: '6px 10px', borderRadius: 7, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                        {s}
                      </div>
                    ))}
                    <div style={{ marginTop: 6, padding: '8px 12px', borderRadius: 8, background: 'rgba(74,144,217,.06)', border: '1px solid rgba(74,144,217,.15)', fontSize: 13 }}>
                      <strong>Next move:</strong> {ai.next_action}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lead fields */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8 }}>
            <select value={lead.stage} onChange={e => onUpdate({ stage: e.target.value })}>
              {stages.map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={lead.motivation} onChange={e => onUpdate({ motivation: e.target.value })}>
              {MOTIVATIONS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: 8 }}>
            <input
              value={lead.property || ''}
              onChange={e => onUpdate({ property: e.target.value })}
              placeholder="Property address — e.g. 123 Main St, Phoenix AZ"
              style={{ opacity: lead.property ? 1 : 0.6 }}
            />
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: 14, pointerEvents: 'none' }}>$</span>
              <input
                type="number"
                min="0"
                value={lead.deal_value ?? ''}
                onChange={e => onUpdate({ deal_value: e.target.value ? Number(e.target.value) : null })}
                placeholder="Deal value"
                style={{ paddingLeft: 24, opacity: lead.deal_value ? 1 : 0.6 }}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8 }}>
            <input
              type="tel"
              value={lead.phone || ''}
              onChange={e => onUpdate({ phone: e.target.value })}
              placeholder="Phone — no number yet"
              style={{ opacity: lead.phone ? 1 : 0.6 }}
            />
            <input
              type="email"
              value={lead.email || ''}
              onChange={e => onUpdate({ email: e.target.value })}
              placeholder="Email — no address yet"
              style={{ opacity: lead.email ? 1 : 0.6 }}
            />
          </div>
          <input type="number" min="0" value={lead.last_contact}
                 onChange={e => onUpdate({ last_contact: Number(e.target.value) })}
                 placeholder="Days since last contact (auto-resets on contact log)" />
          {/* Activity log */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: 2 }}>
              Activity Log
            </div>
            {/* Add note input */}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                placeholder="Add a note — what happened, next steps, anything…"
                style={{ flex: 1, fontSize: 13 }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && noteInput.trim()) {
                    onUpdate({ notes: appendNote(lead.notes, noteInput) });
                    setNoteInput('');
                  }
                }}
              />
              <button
                className="btn"
                style={{ padding: '10px 16px', fontSize: 13, flexShrink: 0 }}
                disabled={!noteInput.trim()}
                onClick={() => {
                  if (!noteInput.trim()) return;
                  onUpdate({ notes: appendNote(lead.notes, noteInput) });
                  setNoteInput('');
                }}
              >
                Add
              </button>
            </div>
            {/* Timeline entries */}
            {parseNotes(lead.notes).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto', paddingRight: 4 }}>
                {parseNotes(lead.notes).map((entry, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: 10, padding: '8px 12px', borderRadius: 8,
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    fontSize: 13, alignItems: 'flex-start'
                  }}>
                    {entry.date && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: 'var(--muted)',
                        whiteSpace: 'nowrap', paddingTop: 2, minWidth: 52
                      }}>{entry.date}</span>
                    )}
                    <span style={{ flex: 1, color: 'var(--text)', lineHeight: 1.4 }}>{entry.text}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--muted)', opacity: 0.5, padding: '8px 12px', borderRadius: 8, border: '1px dashed var(--border)', textAlign: 'center' }}>
                No notes yet — add the first one above
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => onUpdate({ is_dead: true })}>Mark dead</button>
            <button className="btn btn-ghost" onClick={onDelete} style={{ color: 'var(--danger)' }}>Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}
