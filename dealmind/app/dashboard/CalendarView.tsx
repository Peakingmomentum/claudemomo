'use client';

import { useState, useEffect, useRef } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { Icon } from '@/components/Icon';
import type { DealMindUser, Lead, CalendarEvent } from '@/types';
import { useMobile } from '@/hooks/useMobile';

const EVENT_COLORS: Record<string, string> = {
  follow_up:   '#4a90d9',
  appointment: '#10b981',
  deadline:    '#ef4444',
  reminder:    '#f59e0b',
};
const eventColor = (type: string | null) => EVENT_COLORS[type || ''] || '#4a90d9';

const DAYS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

interface Props {
  profile: DealMindUser;
  leads: Lead[];
  calendar: CalendarEvent[];
  onCalendarChange: () => Promise<void>;
}

interface AddForm {
  title: string;
  date: string;
  time: string;
  type: string;
  lead_id: string;
  description: string;
}

export function CalendarView({ profile, leads, calendar, onCalendarChange }: Props) {
  const supabase  = createSupabaseBrowserClient();
  const isMobile  = useMobile();

  const today     = new Date();
  const [view, setView]               = useState<'month' | 'agenda'>('month');
  const [cursor, setCursor]           = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showAdd, setShowAdd]         = useState(false);
  const [syncing, setSyncing]         = useState(false);
  const [syncMsg, setSyncMsg]         = useState<string | null>(null);
  const [saving, setSaving]           = useState(false);
  const [form, setForm]               = useState<AddForm>({
    title: '', date: today.toISOString().split('T')[0],
    time: '09:00', type: 'follow_up', lead_id: '', description: '',
  });

  const activeleads = leads.filter(l => !l.is_dead);

  // ── Month grid helpers ─────────────────────────────────────────────────────

  function daysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
  }

  const year  = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  const totalDays = daysInMonth(year, month);
  // Cells: pad start + days + pad end to fill 6 rows
  const totalCells = 42;
  const cells: Array<{ date: Date | null }> = [];
  for (let i = 0; i < firstDow; i++) cells.push({ date: null });
  for (let d = 1; d <= totalDays; d++) cells.push({ date: new Date(year, month, d) });
  while (cells.length < totalCells) cells.push({ date: null });

  // Events keyed by YYYY-MM-DD
  // Key by LOCAL calendar date (not the UTC slice) so an evening event in a
  // negative-offset zone (e.g. 6pm Pacific = 1am UTC next day) lands on the
  // correct local day instead of rolling to tomorrow.
  function dateKey(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  const eventsByDay: Record<string, CalendarEvent[]> = {};
  for (const e of calendar) {
    const key = dateKey(new Date(e.event_date));
    (eventsByDay[key] = eventsByDay[key] || []).push(e);
  }

  // ── Agenda: upcoming events grouped by day ─────────────────────────────────

  const upcoming = [...calendar]
    .filter(e => new Date(e.event_date) >= new Date(today.getFullYear(), today.getMonth(), today.getDate()))
    .sort((a, b) => a.event_date.localeCompare(b.event_date));

  const agendaGroups: { label: string; events: CalendarEvent[] }[] = [];
  for (const e of upcoming) {
    const d    = new Date(e.event_date);
    const key  = dateKey(d);
    const todayKey = dateKey(today);
    const tomorrowKey = dateKey(new Date(Date.now() + 86400000));
    const label = key === todayKey ? 'Today'
                : key === tomorrowKey ? 'Tomorrow'
                : d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const last = agendaGroups[agendaGroups.length - 1];
    if (last && last.label === label) last.events.push(e);
    else agendaGroups.push({ label, events: [e] });
  }

  const leadMap = Object.fromEntries(leads.map(l => [l.id, l]));

  // ── Add event ──────────────────────────────────────────────────────────────

  async function saveEvent() {
    if (!form.title.trim()) return;
    setSaving(true);
    const event_date = `${form.date}T${form.time}:00`;
    const { error } = await supabase.from('calendar_events').insert({
      user_id:    profile.id,
      title:      form.title.trim(),
      event_date,
      event_type: form.type,
      lead_id:    form.lead_id || null,
      description: form.description.trim() || null,
    });
    if (!error) {
      await onCalendarChange();
      setForm({ title: '', date: today.toISOString().split('T')[0], time: '09:00', type: 'follow_up', lead_id: '', description: '' });
      setShowAdd(false);
    }
    setSaving(false);
  }

  async function deleteEvent(id: string) {
    await supabase.from('calendar_events').delete().eq('id', id);
    await onCalendarChange();
  }

  // ── Google Calendar sync ───────────────────────────────────────────────────

  async function syncGcal() {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const r = await fetch('/api/sync-gcal', { method: 'POST' });
      const d = await r.json();
      if (d.synced !== undefined) {
        setSyncMsg(`Synced ${d.synced} events from Google Calendar`);
        await onCalendarChange();
      } else {
        setSyncMsg(d.error || 'Sync failed');
      }
    } catch {
      setSyncMsg('Network error — try again');
    }
    setSyncing(false);
    setTimeout(() => setSyncMsg(null), 4000);
  }

  // Auto-sync once when the calendar opens, so Google events appear without a manual click.
  const autoSynced = useRef(false);
  useEffect(() => {
    if (autoSynced.current) return;
    if (!(profile as any).gcal_connected) return;
    autoSynced.current = true;
    syncGcal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────

  const selectedDayEvents = selectedDay
    ? (eventsByDay[dateKey(selectedDay)] || [])
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Month nav (only for month view) */}
          {view === 'month' && (
            <>
              <button className="btn btn-ghost" style={{ padding: '6px 10px' }}
                onClick={() => setCursor(new Date(year, month - 1, 1))}>
                <Icon name="chevron-left" size={16} />
              </button>
              <span style={{ fontWeight: 700, fontSize: 16, minWidth: 160, textAlign: 'center' }}>
                {MONTHS[month]} {year}
              </span>
              <button className="btn btn-ghost" style={{ padding: '6px 10px' }}
                onClick={() => setCursor(new Date(year, month + 1, 1))}>
                <Icon name="chevron-right" size={16} />
              </button>
              <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 11 }}
                onClick={() => { setCursor(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedDay(today); }}>
                Today
              </button>
            </>
          )}
          {view === 'agenda' && (
            <span style={{ fontWeight: 700, fontSize: 16 }}>Upcoming Events</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* View toggle */}
          {(['month', 'agenda'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: `1px solid ${view === v ? 'var(--accent)' : 'var(--border)'}`,
              background: view === v ? 'var(--accent)' : 'transparent',
              color: view === v ? '#fff' : 'var(--muted)', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 5,
            }}>
              <Icon name={v === 'month' ? 'calendar' : 'pipeline'} size={12} />
              {v === 'month' ? 'Month' : 'Agenda'}
            </button>
          ))}

          {/* Google sync */}
          {profile.gcal_connected && (
            <button onClick={syncGcal} disabled={syncing} className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Icon name="refresh" size={12} />{syncing ? 'Syncing…' : 'Sync Google'}
            </button>
          )}
          {!profile.gcal_connected && (
            <a href="/api/gmail-oauth?scope=calendar" className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Icon name="link" size={12} />Connect Google Calendar
            </a>
          )}

          {/* Add event */}
          <button className="btn" onClick={() => setShowAdd(s => !s)} style={{ padding: '6px 14px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Icon name="plus" size={12} />Add Event
          </button>
        </div>
      </div>

      {/* Sync message */}
      {syncMsg && (
        <div style={{ padding: '8px 14px', borderRadius: 8, fontSize: 12, background: 'rgba(74,144,217,.08)', border: '1px solid rgba(74,144,217,.2)', color: '#4a90d9' }}>
          {syncMsg}
        </div>
      )}

      {/* Add event form */}
      {showAdd && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>New Event</div>
          <input placeholder="Title — e.g. Call with John Smith" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8 }}>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8 }}>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              <option value="follow_up">Follow-up</option>
              <option value="appointment">Appointment</option>
              <option value="deadline">Deadline</option>
              <option value="reminder">Reminder</option>
            </select>
            <select value={form.lead_id} onChange={e => setForm(f => ({ ...f, lead_id: e.target.value }))}>
              <option value="">No lead linked</option>
              {activeleads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <input placeholder="Notes (optional)" value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={saveEvent} disabled={saving || !form.title.trim()}>
              {saving ? 'Saving…' : 'Save Event'}
            </button>
            <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Month grid */}
      {view === 'month' && (
        <div className="card" style={{ padding: isMobile ? 8 : 16 }}>
          {/* Day-of-week headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'var(--muted)', padding: '4px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {isMobile ? d[0] : d}
              </div>
            ))}
          </div>

          {/* Date cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gridAutoRows: isMobile ? '56px' : '96px', gap: 2 }}>
            {cells.map((cell, i) => {
              if (!cell.date) return <div key={i} />;
              const key   = dateKey(cell.date);
              const evts  = eventsByDay[key] || [];
              const isToday = key === dateKey(today);
              const isSel   = selectedDay && key === dateKey(selectedDay);
              return (
                <div
                  key={i}
                  onClick={() => setSelectedDay(cell.date)}
                  style={{
                    height: '100%', overflow: 'hidden',
                    padding: isMobile ? '3px 2px' : '6px',
                    borderRadius: 8, cursor: 'pointer',
                    background: isSel ? 'rgba(74,144,217,.1)' : isToday ? 'rgba(74,144,217,.05)' : 'transparent',
                    border: `1px solid ${isSel ? 'var(--accent)' : isToday ? 'rgba(74,144,217,.3)' : 'transparent'}`,
                    transition: 'background .1s',
                  }}>
                  <div style={{
                    fontSize: isMobile ? 10 : 12, fontWeight: isToday ? 800 : 500,
                    color: isToday ? 'var(--accent)' : 'var(--text)',
                    marginBottom: 3, textAlign: isMobile ? 'center' : 'left',
                  }}>
                    {cell.date.getDate()}
                  </div>
                  {!isMobile && evts.slice(0, 3).map((e, j) => (
                    <div key={j} style={{
                      fontSize: 10, padding: '1px 5px', borderRadius: 4, marginBottom: 2,
                      background: eventColor(e.event_type) + '20',
                      color: eventColor(e.event_type),
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      fontWeight: 600,
                    }}>
                      {new Date(e.event_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} {e.title}
                    </div>
                  ))}
                  {isMobile && evts.length > 0 && (
                    <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                      {evts.slice(0, 3).map((e, j) => (
                        <div key={j} style={{ width: 6, height: 6, borderRadius: '50%', background: eventColor(e.event_type) }} />
                      ))}
                    </div>
                  )}
                  {evts.length > 3 && !isMobile && (
                    <div style={{ fontSize: 9, color: 'var(--muted)', paddingLeft: 5 }}>+{evts.length - 3} more</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected day panel */}
          {selectedDay && (
            <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
                {selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: 12, marginLeft: 8 }}>
                  {selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? 's' : ''}
                </span>
              </div>
              {selectedDayEvents.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--muted)', opacity: 0.6 }}>Nothing scheduled — <button onClick={() => { setForm(f => ({ ...f, date: dateKey(selectedDay) })); setShowAdd(true); }} style={{ background: 'none', border: 'none', color: '#4a90d9', cursor: 'pointer', fontSize: 13 }}>Add an event</button></div>
              ) : (
                <EventList events={selectedDayEvents} leadMap={leadMap} onDelete={deleteEvent} />
              )}
            </div>
          )}
        </div>
      )}

      {/* Agenda view */}
      {view === 'agenda' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {agendaGroups.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: '32px 0', fontSize: 13 }}>
              No upcoming events. Add one with the button above or ask your copilot to schedule a follow-up.
            </div>
          ) : agendaGroups.map(g => (
            <div key={g.label}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 8 }}>
                {g.label}
              </div>
              <EventList events={g.events} leadMap={leadMap} onDelete={deleteEvent} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Shared event list ────────────────────────────────────────────────────────

function EventList({
  events, leadMap, onDelete,
}: {
  events: CalendarEvent[];
  leadMap: Record<string, Lead>;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState<string | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {events.map(evt => {
        const lead  = evt.lead_id ? leadMap[evt.lead_id] : null;
        const color = EVENT_COLORS[evt.event_type || ''] || '#4a90d9';
        const time  = new Date(evt.event_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        return (
          <div key={evt.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            padding: '12px 14px', borderRadius: 10,
            background: 'var(--surface)', border: '1px solid var(--border)',
          }}>
            {/* Color strip */}
            <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, background: color, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{evt.title}</div>
              {lead && (
                <div style={{ fontSize: 12, color: '#4a90d9', marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="user" size={11} color="#4a90d9" />{lead.name}
                  {lead.motivation === 'High' && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 999, background: 'rgba(239,68,68,.12)', color: '#ef4444' }}>Hot</span>
                  )}
                </div>
              )}
              {evt.description && (
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{evt.description}</div>
              )}
              {evt.synced_from && (
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  <Icon name="link" size={10} />synced from {evt.synced_from}
                </div>
              )}
            </div>
            <div style={{ flexShrink: 0, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>{time}</div>
              <div style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, background: `${color}15`, color }}>{evt.event_type || 'event'}</div>
              {!evt.synced_from && (
                <button
                  onClick={() => { if (deleting === evt.id) { onDelete(evt.id); setDeleting(null); } else setDeleting(evt.id); }}
                  style={{ fontSize: 10, color: deleting === evt.id ? '#ef4444' : 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  {deleting === evt.id ? 'Confirm delete' : 'Remove'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
