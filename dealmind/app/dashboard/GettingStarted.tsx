'use client';

import type { DealMindUser } from '@/types';

interface Props {
  profile: DealMindUser;
  leadsCount: number;
  hasChatted: boolean;
  onGoTo: (tab: string) => void;
  onTryCopilot: () => void;
  onStartTour: () => void;
  onDismiss: () => void;
}

export function GettingStarted({ profile, leadsCount, hasChatted, onGoTo, onTryCopilot, onStartTour, onDismiss }: Props) {
  const items = [
    { done: leadsCount > 0, label: 'Add your first lead', hint: 'Tell Pilot “add a lead” or use Add lead', action: onTryCopilot },
    { done: hasChatted, label: 'Try the Copilot', hint: 'Ask Pilot anything', action: onTryCopilot },
    { done: !!(profile.user_name && (profile as any).company_name), label: 'Set your outreach identity', hint: 'So texts are signed correctly', action: () => onGoTo('settings') },
    { done: !!(profile.gmail_connected || profile.gcal_connected || profile.ghl_connected), label: 'Connect a tool (optional)', hint: 'Google or GoHighLevel', action: () => onGoTo('connectors') },
  ];
  const completed = items.filter(i => i.done).length;
  if (completed === items.length) return null; // fully set up — hide

  return (
    <div className="card" style={{ marginBottom: 16, position: 'relative', border: '1px solid var(--accent)', background: 'var(--accent-soft)' }}>
      <button onClick={onDismiss} aria-label="Dismiss" title="Dismiss"
        style={{ position: 'absolute', top: 10, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 16 }}>×</button>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12, paddingRight: 20 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--accent-label)' }}>
          🚀 Get set up — {completed}/{items.length} done
        </div>
        <button onClick={onStartTour} className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 12px', flexShrink: 0 }}>
          Take the tour
        </button>
      </div>

      <div style={{ height: 6, borderRadius: 4, background: 'var(--border)', marginBottom: 14 }}>
        <div style={{ height: 6, borderRadius: 4, background: 'var(--accent)', width: `${(completed / items.length) * 100}%`, transition: 'width .3s' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((it, i) => (
          <button key={i} onClick={it.done ? undefined : it.action}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10,
              border: '1px solid var(--border)', background: it.done ? 'transparent' : 'var(--surface)',
              cursor: it.done ? 'default' : 'pointer', textAlign: 'left', opacity: it.done ? 0.6 : 1, width: '100%',
            }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
              border: `2px solid ${it.done ? '#10b981' : 'var(--border-mid)'}`,
              background: it.done ? '#10b981' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11,
            }}>{it.done ? '✓' : ''}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14, textDecoration: it.done ? 'line-through' : 'none' }}>{it.label}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{it.hint}</div>
            </div>
            {!it.done && <span style={{ color: 'var(--muted)', fontSize: 16 }} aria-hidden>→</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
