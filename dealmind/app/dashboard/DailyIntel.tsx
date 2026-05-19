'use client';

import { Icon } from '@/components/Icon';
import type { DealMindUser, Lead, CalendarEvent } from '@/types';

interface Props {
  profile: DealMindUser;
  leads: Lead[];
  calendar: CalendarEvent[];
}

export function DailyIntel({ profile, leads, calendar }: Props) {
  const active = leads.filter(l => !l.is_dead);
  const urgent = active.filter(l => l.last_contact >= 7);
  const hot    = active.filter(l => l.motivation === 'High');
  const today  = new Date().toDateString();
  const todayEvents = calendar.filter(c => new Date(c.event_date).toDateString() === today);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <section className="card">
        <h2 style={{ marginBottom: 8 }}>Good {timeOfDay()}, {profile.user_name || 'there'}.</h2>
        <p style={{ color: 'var(--muted)' }}>
          Here's what {profile.copilot_name || 'your Copilot'} is watching today.
        </p>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <Tile icon="flame"    label="Urgent (7+ days cold)" value={urgent.length} color="var(--danger)" />
        <Tile icon="spark"    label="Ready to close"        value={hot.length}    color="var(--success)" />
        <Tile icon="pipeline" label="Active leads"          value={active.length} color="var(--accent)" />
        <Tile icon="calendar" label="Events today"          value={todayEvents.length} color="var(--accent2)" />
      </div>

      {urgent.length > 0 && (
        <section className="card">
          <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="flame" color="var(--danger)" /> Going cold
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {urgent.slice(0, 5).map(l => (
              <li key={l.id} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: 12, background: 'var(--surface)', borderRadius: 10
              }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{l.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>{l.property || ''}</div>
                </div>
                <div style={{ color: 'var(--danger)', fontWeight: 600 }}>{l.last_contact}d</div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Tile({ icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <div className="card">
      <Icon name={icon} color={color} size={24} />
      <div style={{ fontSize: 36, fontWeight: 700, marginTop: 8 }}>{value}</div>
      <div style={{ color: 'var(--muted)', fontSize: 13 }}>{label}</div>
    </div>
  );
}

function timeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
