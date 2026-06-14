'use client';

import { useState, useRef, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { Icon } from '@/components/Icon';
import type { Lead, DealMindUser, CalendarEvent, UserRole } from '@/types';
import { useMobile } from '@/hooks/useMobile';
import { getStages } from '@/lib/roleConfig';
import { scoreLead } from '@/lib/leadScore';

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

// ─── Component ────────────────────────────────────────────────────────────────

export function MyLeads({ profile, leads, setLeads, calendar, focusLeadId, onFocusCleared }: Props) {
  const supabase = createSupabaseBrowserClient();
  const isMobile = useMobile();
  // Role-specific pipeline stages (falls back to wholesaler stages if no role set yet)
  const STAGES = getStages(profile.user_role ?? 'wholesaler');
  const [viewMode, setViewMode] = useState<'list' | 'board'>(() => {
    if (typeof window === 'undefined') return 'list';
    try { return (localStorage.getItem(`pp-view-${profile.id}`) as 'list' | 'board') || 'list'; } catch { return 'list'; }
  });
  function changeView(v: 'list' | 'board') {
    setViewMode(v);
    try { localStorage.setItem(`pp-view-${profile.id}`, v); } catch { /* ignore */ }
  }
  const [showArchived, setShowArchived] = useState(false);
  const [archived, setArchived] = useState<Lead[]>([]);
  function toggleArchived() {
    const next = !showArchived;
    setShowArchived(next);
    if (next) loadArchived();
  }
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
    const prev = leads.find(l => l.id === id);
    const { data, error } = await supabase.from('leads').update(patch).eq('id', id).select().single();
    if (!error && data) {
      setLeads(l => l.map(x => x.id === id ? (data as Lead) : x));
      // Record stage transitions so the brief can report progress.
      if (patch.stage && prev && prev.stage !== patch.stage) {
        supabase.from('lead_stage_changes').insert({
          user_id: profile.id, lead_id: id, from_stage: prev.stage, to_stage: patch.stage,
        }).then(() => {}, () => {});
      }
    }
  }

  // "Delete" now ARCHIVES (soft-delete) so nothing is lost; permanent deletion
  // lives in the Archived view behind a confirm.
  async function deleteLead(id: string) {
    const { error } = await supabase.from('leads').update({ is_dead: true }).eq('id', id);
    if (!error) setLeads(l => l.map(x => x.id === id ? { ...x, is_dead: true } : x));
  }

  async function loadArchived() {
    const { data } = await supabase.from('leads').select('*')
      .eq('user_id', profile.id).eq('is_dead', true).order('updated_at', { ascending: false });
    setArchived((data || []) as Lead[]);
  }

  async function restoreLead(id: string) {
    const { error } = await supabase.from('leads').update({ is_dead: false, stage: 'New Lead' }).eq('id', id);
    if (!error) {
      setArchived(a => a.filter(x => x.id !== id));
      setLeads(l => l.map(x => x.id === id ? { ...x, is_dead: false, stage: 'New Lead' } : x));
    }
  }

  async function permanentDelete(id: string) {
    if (typeof window !== 'undefined' && !window.confirm('Permanently delete this lead? This cannot be undone.')) return;
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (!error) {
      setArchived(a => a.filter(x => x.id !== id));
      setLeads(l => l.filter(x => x.id !== id));
    }
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
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'var(--surface)', borderRadius: 8, padding: 2, border: '1px solid var(--border)' }}>
            {(['list', 'board'] as const).map(v => (
              <button key={v} onClick={() => changeView(v)} style={{
                padding: '6px 12px', border: 'none', borderRadius: 6, cursor: 'pointer',
                fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
                background: viewMode === v ? 'var(--accent)' : 'transparent',
                color: viewMode === v ? '#fff' : 'var(--muted)',
              }}>
                {v === 'list' ? 'List' : 'Board'}
              </button>
            ))}
          </div>
          <button className="btn btn-ghost" onClick={toggleArchived}
            style={{ fontSize: 12, color: showArchived ? 'var(--accent)' : 'var(--muted)' }}>
            🗄 {showArchived ? 'Back to pipeline' : 'Archived'}
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

      {showArchived ? (
        <ArchivedPanel leads={archived} onRestore={restoreLead} onDelete={permanentDelete} />
      ) : viewMode === 'board' ? (
        <BoardView leads={sorted} stages={STAGES} onMove={(id, stage) => updateLead(id, { stage })} isMobile={isMobile} />
      ) : (
        sorted.map(l => (
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
        ))
      )}

      {!showArchived && active.length === 0 && !adding && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)' }}>
          No leads yet. Click "Add lead" to start.
        </div>
      )}
    </div>
  );
}

const STAGE_COLOR: Record<string, string> = {
  'New Lead': '#94a3b8', 'Cold Lead': '#4a90d9', 'Warm Lead': '#f59e0b', 'Hot Lead': '#ef4444', 'Closed': '#10b981',
};

function BoardView({ leads, stages, onMove, isMobile }: {
  leads: Lead[]; stages: string[]; onMove: (id: string, stage: string) => void; isMobile: boolean;
}) {
  return (
    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, alignItems: 'flex-start' }}>
      {stages.map(stage => {
        const col = leads.filter(l => l.stage === stage);
        const color = STAGE_COLOR[stage] || 'var(--accent)';
        return (
          <div key={stage} style={{ minWidth: isMobile ? 230 : 250, flex: isMobile ? '0 0 auto' : '1 1 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 2px', borderBottom: `2px solid ${color}` }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{stage}</span>
              <span style={{ fontSize: 11, color, background: color + '20', borderRadius: 999, padding: '1px 8px', fontWeight: 700 }}>{col.length}</span>
            </div>
            {col.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--muted)', padding: '14px 12px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 10 }}>—</div>
            ) : col.map(l => (
              <div key={l.id} style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{l.name}</div>
                {l.property && <div style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.property}</div>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span title="Lead score" style={{ fontSize: 11, fontWeight: 800, color }}>{scoreLead(l)}</span>
                  <select value={l.stage} onChange={e => onMove(l.id, e.target.value)} aria-label={`Move ${l.name} to a stage`}
                    style={{ flex: 1, fontSize: 12, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg, #fff)', color: 'var(--text)', cursor: 'pointer' }}>
                    {stages.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function ArchivedPanel({ leads, onRestore, onDelete }: {
  leads: Lead[]; onRestore: (id: string) => void; onDelete: (id: string) => void;
}) {
  if (!leads.length) {
    return (
      <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
        No archived leads. Leads you mark dead or remove land here — and can be restored any time.
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
        {leads.length} archived lead{leads.length > 1 ? 's' : ''} — restore any time, or delete permanently.
      </div>
      {leads.map(l => (
        <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{l.name}</div>
            {l.property && <div style={{ fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.property}</div>}
          </div>
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => onRestore(l.id)}>Restore</button>
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 12px', color: 'var(--danger)' }} onClick={() => onDelete(l.id)}>Delete</button>
        </div>
      ))}
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
