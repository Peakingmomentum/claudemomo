'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import {
  type UserRole,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  ROLE_ICONS,
} from '@/lib/roleConfig';

const ROLES: UserRole[] = [
  'wholesaler',
  'realtor',
  'storage_investor',
  'commercial_re',
  'industrial',
];

// Extra detail bullets per role
const ROLE_BULLETS: Record<UserRole, string[]> = {
  wholesaler:       ['Lead → Analyzed → Under Contract → Assigned pipeline', 'ARV, MAO & assignment fee calculators', 'Wholesaler scripts & offer negotiation prompts'],
  realtor:          ['Prospect → Showing → Offer → Under Contract → Closed pipeline', 'Commission split, buyer net & seller net calculators', 'Listing descriptions & buyer outreach scripts'],
  storage_investor: ['Identified → Analyzed → LOI → Due Diligence → Closed pipeline', 'Occupancy rate, unit mix revenue & cap rate calculators', 'Storage market analysis & LOI drafting prompts'],
  commercial_re:    ['Identified → Underwriting → LOI → Due Diligence → Closed pipeline', 'Cap rate, NOI, DSCR & cash-on-cash return calculators', 'Commercial deal analysis & underwriting prompts'],
  industrial:       ['Identified → Underwriting → LOI → Due Diligence → Closed pipeline', 'Warehouse SF pricing, lease rate analysis & industrial cap rate calculators', 'Industrial market & lease negotiation prompts'],
};

interface Props {
  userName: string | null;
}

export default function RolePickerClient({ userName }: Props) {
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  async function confirm() {
    if (!selected || saving) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/'); return; }
    await supabase.from('users').update({
      user_role: selected,
      user_role_set_at: new Date().toISOString(),
    }).eq('id', user.id);
    router.push('/dashboard');
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--bg, #f5f6fa)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'flex-start', padding: '40px 16px 80px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", sans-serif',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', maxWidth: 600, marginBottom: 40 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Pocket Pilot" width={52} height={52} style={{ objectFit: 'contain', marginBottom: 16 }} />
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 10px', color: 'var(--text, #111)' }}>
          {userName ? `Welcome, ${userName}!` : 'Welcome to Pocket Pilot!'}
        </h1>
        <p style={{ fontSize: 16, color: 'var(--muted, #666)', margin: 0, lineHeight: 1.5 }}>
          Tell us what you do. We'll tune your pipeline, calculators, and AI copilot to match — you can change this anytime in Settings.
        </p>
      </div>

      {/* Role cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 16,
        width: '100%',
        maxWidth: 900,
        marginBottom: 32,
      }}>
        {ROLES.map(role => {
          const isSelected = selected === role;
          return (
            <button
              key={role}
              onClick={() => setSelected(role)}
              style={{
                textAlign: 'left',
                padding: '20px 20px',
                borderRadius: 16,
                border: `2px solid ${isSelected ? '#0f4c81' : '#e0e4ef'}`,
                background: isSelected ? 'rgba(15,76,129,.06)' : '#fff',
                cursor: 'pointer',
                transition: 'all .15s',
                boxShadow: isSelected ? '0 0 0 3px rgba(15,76,129,.15)' : '0 1px 4px rgba(0,0,0,.06)',
                position: 'relative',
              }}
            >
              {/* Selected check */}
              {isSelected && (
                <div style={{
                  position: 'absolute', top: 14, right: 14,
                  width: 22, height: 22, borderRadius: '50%',
                  background: '#0f4c81',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 12, fontWeight: 800,
                }}>✓</div>
              )}

              {/* Icon + label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 28 }}>{ROLE_ICONS[role]}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: isSelected ? '#0f4c81' : '#111' }}>
                    {ROLE_LABELS[role]}
                  </div>
                </div>
              </div>

              {/* Description */}
              <p style={{ fontSize: 13, color: '#666', margin: '0 0 12px', lineHeight: 1.5 }}>
                {ROLE_DESCRIPTIONS[role]}
              </p>

              {/* Bullets */}
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {ROLE_BULLETS[role].map((b, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: '#444' }}>
                    <span style={{ color: '#0f4c81', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
                    {b}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      {/* CTA */}
      <button
        onClick={confirm}
        disabled={!selected || saving}
        style={{
          padding: '16px 48px',
          borderRadius: 12,
          border: 'none',
          background: selected ? '#0f4c81' : '#c0c8d8',
          color: '#fff',
          fontSize: 16,
          fontWeight: 700,
          cursor: selected ? 'pointer' : 'not-allowed',
          transition: 'background .15s',
          minWidth: 220,
        }}
      >
        {saving ? 'Setting up your workspace…' : selected ? `Continue as ${ROLE_LABELS[selected]} →` : 'Select a role to continue'}
      </button>

      {selected && !saving && (
        <p style={{ marginTop: 14, fontSize: 12, color: '#999' }}>
          You can change your role at any time in Settings → Account.
        </p>
      )}
    </main>
  );
}
