'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { Icon } from '@/components/Icon';
import type { DealMindUser, Lead, CalendarEvent } from '@/types';
import { useMobile } from '@/hooks/useMobile';

type Filter = 'all' | 'pending' | 'completed';

const TYPE_COLOR: Record<string, string> = {
  follow_up: '#4a90d9', appointment: '#10b981', deadline: '#ef4444',
};

interface Props {
  profile: DealMindUser;
  leads: Lead[];
  calendar: CalendarEvent[];
  onCalendarChange: () => Promise<void>;
}

export function TasksView({ profile, leads, calendar, onCalendarChange }: Props) {
  const supabase = createSupabaseBrowserClient();
  const isMobile = useMobile();
  const [filter, setFilter] = useState<Filter>('pending');
  const [busy, setBusy] = useState<string | null>(null);

  const leadMap = Object.fromEntries(leads.map(l => [l.id, l]));

  const pending   = calendar.filter(e => !e.completed_at);
  const completed = calendar.filter(e => !!e.completed_at);

  // Pending: soonest first. Completed: most recently completed first.
  const pendingSorted = [...pending].sort(
    (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  );
  const completedSorted = [...completed].sort(
    (a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime()
  );

  const visible =
    filter === 'pending'   ? pendingSorted   :
    filter === 'completed' ? completedSorted :
    [...pendingSorted, ...completedSorted];

  async function setDone(evt: CalendarEvent, done: boolean) {
    setBusy(evt.id);
    await supabase
      .from('calendar_events')
      .update({ completed_at: done ? new Date().toISOString() : null })
      .eq('id', evt.id);
    await onCalendarChange();
    setBusy(null);
  }

  const FILTERS: Array<[Filter, string, number]> = [
    ['all',       'All',       calendar.length],
    ['pending',   'Pending',   pending.length],
    ['completed', 'Completed', completed.length],
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Filter toggle */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {FILTERS.map(([key, label, count]) => (
          <button key={key} onClick={() => setFilter(key)} style={{
            padding: '8px 16px', borderRadius: 8,
            border: `1px solid ${filter === key ? 'var(--accent)' : 'var(--border)'}`,
            background: filter === key ? 'var(--accent)' : 'transparent',
            color: filter === key ? '#fff' : 'var(--muted)',
            fontWeight: 600, fontSize: 13, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 7,
          }}>
            {label}
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 999,
              background: filter === key ? 'rgba(255,255,255,.25)' : 'var(--bg-hover)',
              color: filter === key ? '#fff' : 'var(--muted)',
            }}>{count}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 0' }}>
          <Icon name="check" size={26} color="var(--muted)" />
          <div style={{ marginTop: 10, fontSize: 13 }}>
            {filter === 'completed'
              ? 'No completed tasks yet. Check one off and it will land here.'
              : filter === 'pending'
              ? 'No pending tasks. Add follow-ups via the Copilot or in a lead card.'
              : 'No tasks yet. Add follow-ups via the Copilot or in a lead card.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {visible.map(evt => {
            const lead    = evt.lead_id ? leadMap[evt.lead_id] : null;
            const done    = !!evt.completed_at;
            const color   = TYPE_COLOR[evt.event_type || 'follow_up'] || '#4a90d9';
            const overdue = !done && new Date(evt.event_date) < new Date();
            return (
              <div key={evt.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 16px', borderRadius: 10,
                background: done ? 'var(--surface)' : `${color}08`,
                border: `1px solid ${done ? 'var(--border)' : color + '30'}`,
                opacity: done ? 0.65 : 1,
              }}>
                {/* Checkbox */}
                <button
                  onClick={() => setDone(evt, !done)}
                  disabled={busy === evt.id}
                  aria-label={done ? 'Mark as pending' : 'Mark as complete'}
                  style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    border: `2px solid ${done ? '#10b981' : color}`,
                    background: done ? '#10b981' : 'transparent',
                    cursor: busy === evt.id ? 'wait' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                  }}>
                  {done && <span style={{ color: '#fff', fontSize: 12, fontWeight: 800 }}>✓</span>}
                </button>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, textDecoration: done ? 'line-through' : 'none' }}>
                    {evt.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {lead && (
                      <span style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Icon name="user" size={11} color="var(--accent)" />{lead.name}
                      </span>
                    )}
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Icon name="clock" size={11} />
                      {new Date(evt.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {' · '}
                      {new Date(evt.event_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </span>
                    {overdue && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 999, background: 'rgba(239,68,68,.12)', color: '#ef4444' }}>
                        Overdue
                      </span>
                    )}
                    {done && (
                      <span style={{ fontSize: 11 }}>
                        Completed {new Date(evt.completed_at!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>

                {!isMobile && (
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: `${color}15`, color, flexShrink: 0 }}>
                    {evt.event_type || 'follow_up'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
