'use client';

import { useState } from 'react';
import type { Lead, DealMindUser } from '@/types';

export function EndOfDay({ profile, leads }: { profile: DealMindUser; leads: Lead[] }) {
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    setSummary('');
    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message:
            'Generate my End-of-Day recap: what got done today, what slipped, and the 3 priorities for tomorrow. Reference my pipeline. Keep it tight.',
          context: 'eod'
        })
      });
      const data = await res.json();
      setSummary(data.reply || data.error || 'No reply');
    } finally {
      setLoading(false);
    }
  }

  const active = leads.filter(l => !l.is_dead);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <section className="card">
        <h2>End of Day</h2>
        <p style={{ color: 'var(--muted)', marginTop: 8 }}>
          Let {profile.copilot_name || 'Pilot'} debrief the day and set tomorrow's plan.
        </p>
        <button className="btn" onClick={generate} disabled={loading} style={{ marginTop: 16 }}>
          {loading ? 'Generating…' : 'Run EOD recap'}
        </button>
      </section>

      {summary && (
        <section className="card" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
          {summary}
        </section>
      )}

      <section className="card">
        <h3 style={{ marginBottom: 8 }}>Snapshot</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, color: 'var(--muted)' }}>
          <div>Active leads</div><div style={{ color: 'var(--text)', fontWeight: 600 }}>{active.length}</div>
          <div>Avg days in pipeline</div>
          <div style={{ color: 'var(--text)', fontWeight: 600 }}>
            {active.length ? Math.round(active.reduce((s, l) => s + l.days_in_pipeline, 0) / active.length) : 0}
          </div>
          <div>Cold &gt;= 7 days</div>
          <div style={{ color: 'var(--text)', fontWeight: 600 }}>
            {active.filter(l => l.last_contact >= 7).length}
          </div>
        </div>
      </section>
    </div>
  );
}
