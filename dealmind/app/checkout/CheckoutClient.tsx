'use client';

import { useState } from 'react';
import { AIAvatar } from '@/components/AIAvatar';

export default function CheckoutClient({
  copilotName,
  userName
}: { copilotName: string | null | undefined; userName: string | null | undefined }) {
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    const res = await fetch('/api/create-checkout', { method: 'POST' });
    const { url } = await res.json();
    if (url) window.location.href = url;
    else setLoading(false);
  }

  return (
    <main style={{ minHeight: '100vh', padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ maxWidth: 480, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <AIAvatar name={copilotName || 'Copilot'} active size={64} />
        </div>

        <h1 style={{ fontSize: 28, marginBottom: 8, textAlign: 'center' }}>
          {userName ? `${userName}, ready to unlock ${copilotName || 'your Copilot'}?` : `Ready to unlock ${copilotName || 'your Copilot'}?`}
        </h1>
        <p style={{ color: 'var(--muted)', textAlign: 'center', marginBottom: 32 }}>
          One plan. Full access. Cancel anytime.
        </p>

        <div style={{
          textAlign: 'center', margin: '24px 0',
          fontSize: 56, fontWeight: 800,
          background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          $97<span style={{ fontSize: 20, color: 'var(--muted)', WebkitTextFillColor: 'var(--muted)' }}>/month</span>
        </div>

        <ul style={{ listStyle: 'none', padding: 0, marginBottom: 32, color: 'var(--text)' }}>
          {[
            'Your named AI Copilot — knows you, your market, your leads',
            'Daily Intel briefings',
            'Full pipeline tracking',
            'Automated outreach drafts',
            'Gmail + Calendar sync',
            'EOD recap & next-day plan'
          ].map(item => (
            <li key={item} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
              <span style={{ color: 'var(--success)' }}>✓</span>{item}
            </li>
          ))}
        </ul>

        <button className="btn" onClick={start} disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Loading…' : 'Activate my Copilot'}
        </button>
        <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', marginTop: 12 }}>
          Secure checkout via Stripe.
        </p>
      </div>
    </main>
  );
}
