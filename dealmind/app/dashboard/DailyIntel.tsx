'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@/components/Icon';
import type { DealMindUser, Lead, CalendarEvent } from '@/types';
import { useMobile } from '@/hooks/useMobile';

interface Prospecting { action: string; detail: string; }
interface PriorityLead { id: string; name: string; score: number; stage: string; reason: string; }
interface TaskItem { id: string; title: string; due: string; }
interface Appt { title: string; when: string; source: 'app' | 'ghl'; }
interface GhlReply { name: string; lead: string; message: string; unread: boolean; }
interface GhlHeadsUp { name: string; message: string; unread: boolean; }
interface Brief {
  greeting: string;
  focus: string;
  insight: string;
  prospecting: Prospecting[];
  priorityLeads: PriorityLead[];
  tasksDueToday: TaskItem[];
  tasksOverdue: TaskItem[];
  appointments: Appt[];
  ghlReplies: GhlReply[];
  ghlHeadsUp: GhlHeadsUp[];
  ghlConnected: boolean;
}

const scoreColor = (s: number) => s >= 70 ? '#ef4444' : s >= 45 ? '#f59e0b' : '#4a90d9';

interface Props { profile: DealMindUser; leads: Lead[]; calendar: CalendarEvent[]; }

export function DailyIntel({ profile, leads, calendar }: Props) {
  const [brief, setBrief]       = useState<Brief | null>(null);
  const [loading, setLoading]   = useState(true);
  const [briefError, setBriefError] = useState<string | null>(null);
  const [refresh, setRefresh]   = useState(false);
  const [eodOpen, setEodOpen]   = useState(false);
  const isMobile = useMobile();

  const active  = leads.filter(l => !l.is_dead);
  const urgent  = active.filter(l => l.last_contact >= 7);
  const hot     = active.filter(l => l.motivation === 'High');
  const today   = new Date().toDateString();
  const todayEvents = calendar.filter(c => !c.completed_at && new Date(c.event_date).toDateString() === today);

  useEffect(() => {
    setLoading(true);
    setBriefError(null);
    const url = refresh ? '/api/daily-brief?refresh=1' : '/api/daily-brief';
    fetch(url)
      .then(r => r.json())
      .then(d => {
        if (d.brief) setBrief(d.brief);
        else setBriefError(d.error || 'No brief returned');
      })
      .catch(err => setBriefError(String(err)))
      .finally(() => { setLoading(false); setRefresh(false); });
  }, [refresh]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Active Leads',  value: active.length,      color: '#4a90d9' },
          { label: 'Going Cold',    value: urgent.length,      color: '#ef4444' },
          { label: 'Hot Leads',     value: hot.length,         color: '#10b981' },
          { label: 'Events Today',  value: todayEvents.length, color: '#f59e0b' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ padding: '16px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 30, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* AI Brief */}
      <div className="card" style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, #4a90d9, #0f4c81)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 800, color: '#fff'
            }}>
              {(profile.copilot_name || 'Pilot')[0]}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{profile.copilot_name || 'Pilot'}'s Daily Brief</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>
          <button onClick={() => { setBrief(null); setRefresh(true); }}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8,
              padding: '6px 12px', fontSize: 12, cursor: 'pointer', color: 'var(--muted)',
              display: 'flex', alignItems: 'center', gap: 5 }}>
            <Icon name="refresh" size={13} /> Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--muted)' }}>
            <div style={{ fontSize: 13, marginBottom: 8 }}>
              {profile.copilot_name || 'Pilot'} is reviewing your pipeline…
            </div>
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)',
                  animation: 'pulse 1.4s ease-in-out infinite',
                  animationDelay: `${i * 0.2}s`, opacity: 0.7
                }} />
              ))}
            </div>
          </div>
        ) : brief ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Greeting + focus */}
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{brief.greeting}</p>
              <p style={{ fontSize: 13, color: 'var(--muted)', padding: '10px 14px', background: 'var(--surface)', borderRadius: 8, borderLeft: '3px solid var(--accent)', display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                <Icon name="target" size={14} color="var(--accent)" /><span><strong>Today's focus:</strong> {brief.focus}</span>
              </p>
            </div>

            {/* GHL heads-up — messages from people NOT in the pipeline (only if GHL connected) */}
            {brief.ghlConnected && brief.ghlHeadsUp.length > 0 && (
              <div>
                <SectionHead>⚠️ New in GoHighLevel — not in your pipeline</SectionHead>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {brief.ghlHeadsUp.map((h, i) => (
                    <div key={i} style={{ padding: '11px 14px', borderRadius: 10, background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.25)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{h.name}</span>
                        {h.unread && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 999, background: '#ef4444', color: '#fff' }}>UNREAD</span>}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--muted)' }}>&ldquo;{h.message}&rdquo;</div>
                      <div style={{ fontSize: 11, color: 'var(--accent-label)', marginTop: 4 }}>Review in GoHighLevel — add to your pipeline if it&rsquo;s a real lead.</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GHL replies from your leads (only if GHL connected) */}
            {brief.ghlConnected && brief.ghlReplies.length > 0 && (
              <div>
                <SectionHead>💬 Replies from your leads (GoHighLevel)</SectionHead>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {brief.ghlReplies.map((r, i) => (
                    <div key={i} style={{ padding: '11px 14px', borderRadius: 10, background: 'rgba(16,185,129,.07)', border: '1px solid rgba(16,185,129,.22)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{r.lead}</span>
                        {r.unread && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 999, background: '#ef4444', color: '#fff' }}>UNREAD</span>}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--muted)' }}>&ldquo;{r.message}&rdquo;</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top priority leads (by AI score) */}
            {brief.priorityLeads.length > 0 && (
              <div>
                <SectionHead>🔥 Top Priority Leads</SectionHead>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {brief.priorityLeads.map(l => (
                    <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                      <div style={{ width: 36, textAlign: 'center', fontWeight: 800, fontSize: 16, color: scoreColor(l.score) }}>{l.score}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{l.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{l.stage} · {l.reason}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tasks — overdue + due today */}
            <div>
              <SectionHead>✅ Tasks</SectionHead>
              {brief.tasksOverdue.length === 0 && brief.tasksDueToday.length === 0 ? (
                <EmptyLine>No tasks due today — add follow-ups from the Tasks tab.</EmptyLine>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {brief.tasksOverdue.map(t => <TaskRow key={t.id} title={t.title} tag={`Overdue · ${t.due}`} color="#ef4444" />)}
                  {brief.tasksDueToday.map(t => <TaskRow key={t.id} title={t.title} tag="Due today" color="#f59e0b" />)}
                </div>
              )}
            </div>

            {/* Appointments — next 48h */}
            <div>
              <SectionHead>📅 Appointments (next 48h)</SectionHead>
              {brief.appointments.length === 0 ? (
                <EmptyLine>Nothing booked in the next 48 hours.</EmptyLine>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {brief.appointments.map((a, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 13 }}>
                      <Icon name="calendar" size={13} color="var(--accent)" />
                      <span style={{ flex: 1 }}>{a.title}</span>
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{a.when}{a.source === 'ghl' ? ' · GHL' : ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Prospecting */}
            {(brief.prospecting || []).length > 0 && (
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: 10 }}>
                  Lead Generation
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {brief.prospecting.map((p, i) => (
                    <div key={i} style={{ padding: '11px 14px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)' }}>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 6 }}><Icon name="target" size={13} color="var(--accent)" />{p.action}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{p.detail}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Insight */}
            {brief.insight && (
              <div style={{
                padding: '12px 16px', borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(74,144,217,.06), rgba(15,76,129,.06))',
                border: '1px solid rgba(74,144,217,.15)'
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-label)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon name="bulb" size={13} color="var(--accent-label)" />{profile.copilot_name || 'Pilot'}'s Insight
                </div>
                <div style={{ fontSize: 13, color: 'var(--text)' }}>{brief.insight}</div>
              </div>
            )}

            {/* Clock Out / EOD */}
            {!eodOpen ? (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <button
                  onClick={() => setEodOpen(true)}
                  style={{
                    width: '100%', padding: '11px', borderRadius: 10, border: '1px dashed var(--border)',
                    background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}>
                  <Icon name="clock" size={14} /> Clock Out — Generate EOD Report
                </button>
              </div>
            ) : (
              <EodReport
                profile={profile}
                leads={leads}
                calendar={calendar}
                brief={brief}
                onClose={() => setEodOpen(false)}
              />
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px 0' }}>
            <div style={{ marginBottom: 8, fontSize: 13 }}>Could not load brief.</div>
            {briefError && (
              <div style={{ fontSize: 11, color: '#ef4444', marginBottom: 10, padding: '6px 12px', borderRadius: 7, background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.15)', maxWidth: 400, margin: '0 auto 10px' }}>
                {briefError}
              </div>
            )}
            <button onClick={() => setRefresh(true)} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>Try again</button>
          </div>
        )}
      </div>

    </div>
  );
}

function SectionHead({ children }: { children: any }) {
  return <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: 10 }}>{children}</h3>;
}

function EmptyLine({ children }: { children: any }) {
  return <div style={{ fontSize: 13, color: 'var(--muted)', padding: '9px 14px', borderRadius: 8, border: '1px dashed var(--border)', textAlign: 'center' }}>{children}</div>;
}

function TaskRow({ title, tag, color }: { title: string; tag: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{title}</span>
      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: color + '20', color, textTransform: 'uppercase', flexShrink: 0 }}>{tag}</span>
    </div>
  );
}

// ─── EOD Report ──────────────────────────────────────────────────────────────

function EodReport({
  profile, leads, calendar, brief, onClose,
}: {
  profile: DealMindUser;
  leads: Lead[];
  calendar: CalendarEvent[];
  brief: Brief;
  onClose: () => void;
}) {
  const active       = leads.filter(l => !l.is_dead);
  const contacted    = active.filter(l => l.last_contact === 0);
  const goingCold    = active.filter(l => l.last_contact >= 7);
  const hot          = active.filter(l => l.motivation === 'High');
  const tomorrow     = new Date(Date.now() + 86400000).toDateString();
  const tomorrowEvts = calendar.filter(c => !c.completed_at && new Date(c.event_date).toDateString() === tomorrow);
  const topTodos     = [...(brief.tasksOverdue || []), ...(brief.tasksDueToday || [])].slice(0, 3);
  const copilotName  = profile.copilot_name || 'Pilot';
  const hour         = new Date().getHours();
  const sign         = hour < 17 ? 'afternoon' : 'evening';

  return (
    <div style={{
      borderTop: '1px solid var(--border)', paddingTop: 16,
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="clock" size={14} color="var(--accent)" /> End of Day — {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 13 }}>✕</button>
      </div>

      {/* Greeting */}
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
        Good {sign}, {profile.user_name?.split(' ')[0] || 'there'}! Here's how your day looks.
      </div>

      {/* Pipeline stats */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: 2 }}>Pipeline Today</div>
        {[
          { label: 'Active leads',          value: active.length,     color: '#4a90d9' },
          { label: 'Contacted today',        value: contacted.length,  color: '#10b981' },
          { label: 'Hot leads (High motive)', value: hot.length,       color: '#ef4444' },
          { label: 'Going cold (7+ days)',   value: goingCold.length,  color: '#f59e0b' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '7px 12px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: 13, color: 'var(--text)' }}>{label}</span>
            <span style={{ fontSize: 14, fontWeight: 800, color }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Tomorrow's schedule */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: 6 }}>Tomorrow's Schedule</div>
        {tomorrowEvts.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {tomorrowEvts.map(e => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 13 }}>
                <Icon name="clock" size={13} color="var(--accent)" />
                <span>{e.title}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)' }}>
                  {new Date(e.event_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--muted)', padding: '7px 12px', borderRadius: 8, border: '1px dashed var(--border)', textAlign: 'center' }}>
            Nothing scheduled — a great time to add follow-ups
          </div>
        )}
      </div>

      {/* Top priorities carry-over */}
      {topTodos.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)', marginBottom: 6 }}>Carry-Over Tasks</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {topTodos.map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, padding: '7px 12px', borderRadius: 8, background: 'rgba(239,68,68,.05)', border: '1px solid rgba(239,68,68,.15)', fontSize: 13 }}>
                <Icon name="target" size={13} color="#ef4444" />
                <span>{t.title}{t.due ? ` — ${t.due}` : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sign off */}
      <div style={{
        padding: '12px 16px', borderRadius: 10,
        background: 'linear-gradient(135deg, rgba(74,144,217,.06), rgba(15,76,129,.06))',
        border: '1px solid rgba(74,144,217,.15)', fontSize: 13, color: 'var(--text)',
      }}>
        {contacted.length > 0
          ? `Solid day — you touched ${contacted.length} lead${contacted.length > 1 ? 's' : ''}. Stay consistent and the pipeline will move.`
          : goingCold.length > 0
          ? `${goingCold.length} lead${goingCold.length > 1 ? 's are' : ' is'} going cold. Tomorrow, make outreach your first move.`
          : 'Great hustle. Rest up and come back strong tomorrow.'}{' '}
        — {copilotName}
      </div>
    </div>
  );
}
