'use client';

import { useState, useEffect } from 'react';
import type { DealMindUser } from '@/types';
import { Icon } from '@/components/Icon';

interface Props {
  profile: DealMindUser;
}

interface AffiliateStats {
  referralCode: string;
  stats: {
    total: number;
    active: number;
    totalEarnings: number;
    commissionPct: number;
  };
  referrals: Array<{
    id: string;
    referred_user_id: string;
    signup_date: string;
    status: 'pending' | 'active' | 'churned' | 'paid';
    commission_pct: number;
    payout_amount: number;
    payout_date: string | null;
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  active:  '#10b981',
  churned: '#ef4444',
  paid:    '#4a90d9',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  active:  'Active',
  churned: 'Churned',
  paid:    'Paid Out',
};

export function AffiliateTab({ profile }: Props) {
  const [data, setData]     = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    fetch('/api/affiliate')
      .then(r => r.json())
      .then(d => {
        // Only accept a well-formed payload — an error shape (e.g. { error })
        // must never reach render, or field access below would crash the page.
        if (d && d.stats && Array.isArray(d.referrals)) {
          setData(d);
        } else {
          setError(d?.error || 'Could not load affiliate data. Please try again.');
        }
        setLoading(false);
      })
      .catch(() => { setError('Could not load affiliate data. Please try again.'); setLoading(false); });
  }, []);

  const baseUrl = typeof window !== 'undefined'
    ? window.location.origin
    : 'https://pilot.warmfollow.com';

  const refLink = data?.referralCode
    ? `${baseUrl}/ref/${data.referralCode}`
    : '';

  function copyLink() {
    if (!refLink) return;
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  const estimatedMonthly = data
    ? data.stats.active * 49 * (data.stats.commissionPct / 100)
    : 0;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--muted)' }}>
        Loading affiliate data…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, height: 200, color: 'var(--muted)', textAlign: 'center' }}>
        <div style={{ fontSize: 28 }}>⚠️</div>
        <div style={{ fontWeight: 600 }}>{error || 'Could not load affiliate data.'}</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 680 }}>

      {/* Header */}
      <div>
        <h2 style={{ margin: '0 0 6px' }}>Affiliate Program</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>
          Earn <strong style={{ color: 'var(--accent-label)' }}>30% recurring commission</strong> for every Pocket Pilot subscriber you refer — paid monthly for as long as they stay subscribed.
        </p>
      </div>

      {/* Referral link */}
      <div className="card">
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 12 }}>
          Your Referral Link
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
          <div style={{
            flex: 1, padding: '11px 14px', borderRadius: 10,
            border: '1.5px solid var(--border)',
            background: 'var(--bg-hover)',
            fontSize: 13, fontFamily: 'monospace',
            color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {refLink || '—'}
          </div>
          <button
            onClick={copyLink}
            className="btn"
            style={{ flexShrink: 0, minWidth: 90, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Icon name={copied ? 'check' : 'link'} size={14} />
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        {data?.referralCode && (
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--muted)' }}>
            Your code: <strong style={{ color: 'var(--accent-label)', fontFamily: 'monospace' }}>{data.referralCode}</strong>
            {' '}— share your link anywhere. Each click is tracked automatically.
          </div>
        )}
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <StatCard
          icon="pipeline"
          label="Total Referrals"
          value={String(data?.stats.total ?? 0)}
          color="#4a90d9"
        />
        <StatCard
          icon="check"
          label="Active Subscribers"
          value={String(data?.stats.active ?? 0)}
          color="#10b981"
        />
        <StatCard
          icon="dollar"
          label="Est. Monthly Earnings"
          value={`$${estimatedMonthly.toFixed(0)}`}
          color="#f59e0b"
          sub="at $49/mo avg"
        />
        <StatCard
          icon="spark"
          label="Total Paid Out"
          value={`$${(data?.stats.totalEarnings ?? 0).toFixed(2)}`}
          color="#0f4c81"
        />
      </div>

      {/* How it works */}
      <div className="card">
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 16 }}>
          How It Works
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { step: '1', title: 'Share your link', desc: 'Send your referral link to anyone in real estate — investors, agents, wholesalers, brokers.' },
            { step: '2', title: 'They sign up & subscribe', desc: 'When they create an account and start a paid plan, the referral is automatically credited to you.' },
            { step: '3', title: 'Earn 30% monthly', desc: 'You earn 30% of their monthly subscription for every month they stay active. No cap.' },
            { step: '4', title: 'Get paid', desc: 'Payouts are processed manually each month. Email us when you\'re ready to withdraw — Stripe payouts coming soon.' },
          ].map(item => (
            <div key={item.step} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #0f4c81, #4a90d9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: 13,
              }}>
                {item.step}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Referral history */}
      <div className="card">
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 12 }}>
          Referral History
        </div>
        {!data?.referrals.length ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📣</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>No referrals yet</div>
            <div style={{ fontSize: 13 }}>Share your link to start earning. Your referrals will appear here.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 120px 100px 100px',
              padding: '6px 12px', fontSize: 11, fontWeight: 700, color: 'var(--muted)',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              borderBottom: '1px solid var(--border)',
            }}>
              <div>Signup Date</div>
              <div>Status</div>
              <div>Commission</div>
              <div>Paid</div>
            </div>
            {data.referrals.map(r => (
              <div key={r.id} style={{
                display: 'grid', gridTemplateColumns: '1fr 120px 100px 100px',
                padding: '12px 12px', fontSize: 13,
                borderBottom: '1px solid var(--border)',
                alignItems: 'center',
              }}>
                <div style={{ color: 'var(--muted)' }}>
                  {new Date(r.signup_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div>
                  <span style={{
                    padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
                    background: (STATUS_COLORS[r.status] || '#888') + '18',
                    color: STATUS_COLORS[r.status] || '#888',
                  }}>
                    {STATUS_LABELS[r.status] || r.status}
                  </span>
                </div>
                <div style={{ fontWeight: 600 }}>{r.commission_pct}%</div>
                <div style={{ color: r.payout_amount > 0 ? '#10b981' : 'var(--muted)' }}>
                  {r.payout_amount > 0 ? `$${r.payout_amount.toFixed(2)}` : '—'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payout info */}
      <div style={{
        padding: '14px 18px', borderRadius: 12,
        background: 'rgba(74,144,217,.06)', border: '1px solid rgba(74,144,217,.2)',
        fontSize: 13, color: 'var(--muted)',
      }}>
        <strong style={{ color: 'var(--accent-label)' }}>Payout info:</strong> Commissions are paid manually each month.
        Email <a href="mailto:peakingmomentum@gmail.com" style={{ color: 'var(--accent-label)' }}>peakingmomentum@gmail.com</a> to
        request a payout. Automated Stripe payouts are on the roadmap.
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, sub }: {
  icon: string; label: string; value: string; color: string; sub?: string;
}) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '18px 12px' }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, margin: '0 auto 10px',
        background: color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon as any} size={18} color={color} />
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--faint)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}
