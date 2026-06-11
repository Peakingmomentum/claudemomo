'use client';

import { useState, useEffect } from 'react';
import type { DealMindUser } from '@/types';
import { Icon } from '@/components/Icon';

interface Props {
  profile: DealMindUser;
}

interface TenantBrand {
  id?: string;
  brand_name: string;
  logo_url: string;
  primary_color: string;
  custom_domain: string;
}

const DEFAULT_BRAND: TenantBrand = {
  brand_name:    '',
  logo_url:      '',
  primary_color: '#0f4c81',
  custom_domain: '',
};

export function WhiteLabelSettings({ profile }: Props) {
  const [brand, setBrand]         = useState<TenantBrand>(DEFAULT_BRAND);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting]   = useState(false);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);
  const [members, setMembers]     = useState<any[]>([]);

  useEffect(() => {
    // Load existing tenant brand config
    fetch('/api/tenant?domain=__me__')
      .then(() => {
        // Fetch tenant for current user via Supabase directly on client (no route needed)
        // We'll use the POST to also fetch in GET — or we can just trust local state
      })
      .catch(() => {});

    // Fetch from Supabase via the GET endpoint (we pass a dummy query here)
    // Actually, load from Supabase client directly
    import('@/lib/supabase/browser').then(({ createSupabaseBrowserClient }) => {
      const supabase = createSupabaseBrowserClient();
      supabase.from('tenant_brands').select('*, tenant_members(*)').eq('owner_user_id', profile.id).maybeSingle()
        .then(({ data }) => {
          if (data) {
            setBrand({
              brand_name:    data.brand_name || '',
              logo_url:      data.logo_url || '',
              primary_color: data.primary_color || '#0f4c81',
              custom_domain: data.custom_domain || '',
            });
            setMembers(data.tenant_members || []);
          }
          setLoading(false);
        });
    });
  }, [profile.id]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brand),
      });
      const data = await res.json();
      if (data.error) setMsg({ type: 'err', text: data.error });
      else setMsg({ type: 'ok', text: 'Brand settings saved ✓' });
    } catch {
      setMsg({ type: 'err', text: 'Save failed — try again.' });
    }
    setSaving(false);
    setTimeout(() => setMsg(null), 4000);
  }

  async function inviteMember(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.includes('@')) return;
    setInviting(true);
    setInviteMsg(null);
    try {
      const res = await fetch('/api/tenant', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const data = await res.json();
      if (data.error) {
        setInviteMsg('Error: ' + data.error);
      } else {
        setInviteMsg(data.joined
          ? `${inviteEmail} added to your team.`
          : `Invite recorded for ${inviteEmail}. They'll be added when they sign up.`);
        setInviteEmail('');
        // Refresh members
        if (data.ok) {
          setMembers(m => [...m, { invite_email: inviteEmail, role: 'member', joined_at: data.joined ? new Date().toISOString() : null }]);
        }
      }
    } catch {
      setInviteMsg('Failed to invite — try again.');
    }
    setInviting(false);
    setTimeout(() => setInviteMsg(null), 5000);
  }

  if (loading) {
    return <div style={{ color: 'var(--muted)', padding: 24 }}>Loading brand settings…</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 580 }}>

      <div>
        <h2 style={{ margin: '0 0 6px' }}>White Label Settings</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>
          Brand Pocket Pilot for your team or brokerage. Point a custom domain at us and your agents will see your logo, name, and colors.
        </p>
      </div>

      {/* Brand config form */}
      <div className="card">
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 16 }}>
          Brand Identity
        </div>
        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Brand / Company Name</label>
            <input
              value={brand.brand_name}
              onChange={e => setBrand(b => ({ ...b, brand_name: e.target.value }))}
              placeholder="e.g. Certified Cash Offers"
              style={inputStyle}
            />
            <div style={hintStyle}>This replaces "Pocket Pilot" in the app header.</div>
          </div>

          <div>
            <label style={labelStyle}>Logo URL</label>
            <input
              value={brand.logo_url}
              onChange={e => setBrand(b => ({ ...b, logo_url: e.target.value }))}
              placeholder="https://yoursite.com/logo.png"
              style={inputStyle}
            />
            <div style={hintStyle}>Paste a public URL (PNG or SVG, 512×512 ideal). Must be hosted somewhere accessible.</div>
          </div>

          <div>
            <label style={labelStyle}>Primary Color</label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                type="color"
                value={brand.primary_color}
                onChange={e => setBrand(b => ({ ...b, primary_color: e.target.value }))}
                style={{ width: 44, height: 44, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', padding: 2 }}
              />
              <input
                value={brand.primary_color}
                onChange={e => setBrand(b => ({ ...b, primary_color: e.target.value }))}
                placeholder="#0f4c81"
                style={{ ...inputStyle, maxWidth: 140 }}
              />
              <div style={{
                width: 44, height: 44, borderRadius: 8,
                background: brand.primary_color,
                border: '1px solid var(--border)',
                flexShrink: 0,
              }} />
            </div>
            <div style={hintStyle}>Used for buttons, active nav items, and accent colors.</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button type="submit" className="btn" disabled={saving} style={{ alignSelf: 'flex-start' }}>
              {saving ? 'Saving…' : 'Save Brand Settings'}
            </button>
            {msg && (
              <span style={{ fontSize: 13, color: msg.type === 'err' ? 'var(--danger)' : '#10b981' }}>
                {msg.text}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Custom domain */}
      <div className="card">
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 12 }}>
          Custom Domain
        </div>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
          Point your own domain (e.g. <code>app.yourcompany.com</code>) to Pocket Pilot so your team never sees our branding.
        </p>
        <input
          value={brand.custom_domain}
          onChange={e => setBrand(b => ({ ...b, custom_domain: e.target.value.toLowerCase().trim() }))}
          placeholder="app.yourcompany.com"
          style={{ ...inputStyle, marginBottom: 12 }}
        />

        {/* DNS instructions */}
        <div style={{
          background: 'var(--bg-hover)', borderRadius: 10, padding: '14px 16px',
          border: '1px solid var(--border)', fontSize: 13,
        }}>
          <div style={{ fontWeight: 700, marginBottom: 10, color: 'var(--text)' }}>DNS Setup (Vercel-style)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Step 1 — Add CNAME record in your DNS provider:</div>
              <code style={{
                display: 'block', padding: '8px 12px', borderRadius: 6,
                background: 'var(--surface)', border: '1px solid var(--border)',
                fontSize: 12, color: 'var(--accent-label)',
              }}>
                {brand.custom_domain || 'app.yourcompany.com'} → cname.vercel-dns.com
              </code>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Step 2 — Email us your domain:</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                Send <strong>{brand.custom_domain || 'your domain'}</strong> to{' '}
                <a href="mailto:peakingmomentum@gmail.com" style={{ color: 'var(--accent-label)' }}>peakingmomentum@gmail.com</a>.
                We'll add it to Vercel and your brand will go live within 24 hours.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team management */}
      <div className="card">
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 12 }}>
          Team Members
        </div>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
          Invite teammates. They'll operate under your brand when they sign in.
        </p>
        <form onSubmit={inviteMember} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            type="email"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            placeholder="teammate@email.com"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button type="submit" className="btn" disabled={inviting || !inviteEmail.includes('@')} style={{ flexShrink: 0 }}>
            {inviting ? 'Inviting…' : 'Invite'}
          </button>
        </form>
        {inviteMsg && (
          <div style={{ fontSize: 13, color: inviteMsg.startsWith('Error') ? 'var(--danger)' : '#10b981', marginBottom: 12 }}>
            {inviteMsg}
          </div>
        )}

        {members.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {members.map((m, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'var(--surface)',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{m.invite_email || m.user_id}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{m.role} · {m.joined_at ? 'Active' : 'Invited'}</div>
                </div>
                <span style={{
                  fontSize: 11, padding: '2px 9px', borderRadius: 999, fontWeight: 700,
                  background: m.joined_at ? 'rgba(16,185,129,.12)' : 'rgba(245,158,11,.12)',
                  color: m.joined_at ? '#10b981' : '#f59e0b',
                }}>
                  {m.joined_at ? 'Active' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '16px 0' }}>
            No team members yet. Invite your first teammate above.
          </div>
        )}
      </div>

      {/* Preview banner */}
      {(brand.brand_name || brand.logo_url) && (
        <div style={{
          padding: '14px 18px', borderRadius: 12,
          background: brand.primary_color + '10',
          border: `1px solid ${brand.primary_color}30`,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>
            Brand Preview
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {brand.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.logo_url} alt="Logo" width={36} height={36} style={{ objectFit: 'contain', borderRadius: 6 }} />
            )}
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: brand.primary_color }}>
                {brand.brand_name || 'Your Brand Name'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Powered by Pocket Pilot</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 700,
  color: 'var(--muted)', marginBottom: 6,
  textTransform: 'uppercase', letterSpacing: '0.04em',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: '1px solid var(--border)', borderRadius: 10,
  fontSize: 14, outline: 'none', fontFamily: 'inherit',
  background: 'var(--surface)', color: 'var(--text)',
  boxSizing: 'border-box',
};

const hintStyle: React.CSSProperties = {
  fontSize: 11, color: 'var(--muted)', marginTop: 5,
};
