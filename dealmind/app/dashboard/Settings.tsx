'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import type { DealMindUser, UserRole } from '@/types';
import { ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_ICONS } from '@/lib/roleConfig';
import { WhiteLabelSettings } from './WhiteLabelSettings';

interface Props { profile: DealMindUser; }

export function Settings({ profile }: Props) {
  const supabase = createSupabaseBrowserClient();

  const [newPass, setNewPass]     = useState('');
  const [confirmPass, setConfirm] = useState('');
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [name, setName]           = useState(profile.user_name || '');
  const [company, setCompany]     = useState(profile.company_name || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg]       = useState<string | null>(null);

  // Role change
  const [selectedRole, setSelectedRole] = useState<UserRole>(profile.user_role ?? 'wholesaler');
  const [savingRole, setSavingRole]     = useState(false);
  const [roleMsg, setRoleMsg]           = useState<string | null>(null);

  async function saveRole(e: React.FormEvent) {
    e.preventDefault();
    setSavingRole(true);
    setRoleMsg(null);
    const { error } = await supabase.from('users')
      .update({ user_role: selectedRole, user_role_set_at: new Date().toISOString() })
      .eq('id', profile.id);
    setRoleMsg(error ? `Error: ${error.message}` : 'Role updated ✓ — reload the page for full effect.');
    setSavingRole(false);
    setTimeout(() => setRoleMsg(null), 5000);
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    const { error } = await supabase.from('users')
      .update({ user_name: name.trim() || null, company_name: company.trim() || null })
      .eq('id', profile.id);
    setProfileMsg(error ? `Error: ${error.message}` : 'Saved ✓');
    setSavingProfile(false);
    setTimeout(() => setProfileMsg(null), 3000);
  }

  async function setPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPass.length < 8) { setMsg({ type: 'err', text: 'Password must be at least 8 characters.' }); return; }
    if (newPass !== confirmPass) { setMsg({ type: 'err', text: 'Passwords don\'t match.' }); return; }
    setSaving(true);
    setMsg(null);
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) setMsg({ type: 'err', text: error.message });
    else {
      setMsg({ type: 'ok', text: 'Password set! You can now sign in with email + password.' });
      setNewPass('');
      setConfirm('');
    }
    setSaving(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 520 }}>
      <div>
        <h2 style={{ marginBottom: 4 }}>Account Settings</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>Manage your login credentials.</p>
      </div>

      {/* Account info */}
      <div className="card">
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 12 }}>
          Signed in as
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #4a90d9, #0f4c81)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 16
          }}>
            {(profile.user_name || profile.email || 'U')[0].toUpperCase()}
          </div>
          <div>
            {profile.user_name && <div style={{ fontWeight: 700, fontSize: 14 }}>{profile.user_name}</div>}
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>{profile.email}</div>
          </div>
        </div>
      </div>

      {/* Outreach identity — feeds the signature on agent-sent texts */}
      <div className="card">
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 4 }}>
          Your Outreach Identity
        </div>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
          Used to sign texts your copilot sends. Set these so messages never go out with a placeholder.
        </p>
        <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your full name (e.g. Justin Rayside)"
            aria-label="Your name"
            style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, fontFamily: 'inherit', background: 'var(--surface)' }}
          />
          <input
            value={company}
            onChange={e => setCompany(e.target.value)}
            placeholder="Your company (e.g. Certified Cash Offers)"
            aria-label="Your company"
            style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, fontFamily: 'inherit', background: 'var(--surface)' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn" type="submit" disabled={savingProfile} style={{ alignSelf: 'flex-start' }}>
              {savingProfile ? 'Saving…' : 'Save'}
            </button>
            {profileMsg && <span style={{ fontSize: 13, color: profileMsg.startsWith('Error') ? 'var(--danger)' : '#10b981' }}>{profileMsg}</span>}
          </div>
        </form>
      </div>

      {/* Set / change password */}
      <div className="card">
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 4 }}>
          Set Password
        </div>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
          Set a password so you can sign in with email + password instead of magic link.
        </p>
        <form onSubmit={setPassword} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            type='password'
            placeholder='New password (min 8 chars)'
            aria-label='New password'
            autoComplete='new-password'
            value={newPass}
            onChange={e => setNewPass(e.target.value)}
            required
            style={inputStyle}
          />
          <input
            type='password'
            placeholder='Confirm new password'
            aria-label='Confirm new password'
            autoComplete='new-password'
            value={confirmPass}
            onChange={e => setConfirm(e.target.value)}
            required
            style={inputStyle}
          />
          <button
            type='submit'
            className='btn'
            disabled={saving}
            style={{ alignSelf: 'flex-start', padding: '10px 24px' }}
          >
            {saving ? 'Saving…' : 'Set Password'}
          </button>
        </form>

        {msg && (
          <div style={{
            marginTop: 14, padding: '10px 14px', borderRadius: 10, fontSize: 13,
            background: msg.type === 'err' ? 'rgba(239,68,68,.08)' : 'rgba(16,185,129,.08)',
            color: msg.type === 'err' ? '#dc2626' : '#059669',
            border: `1px solid ${msg.type === 'err' ? 'rgba(239,68,68,.2)' : 'rgba(16,185,129,.2)'}`,
          }}>
            {msg.text}
          </div>
        )}
      </div>

      {/* Role picker — change your niche */}
      <div className="card">
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 4 }}>
          Your Role / Niche
        </div>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
          Changing your role updates your pipeline stages, calculators, and AI coaching prompts.
        </p>
        <form onSubmit={saveRole} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
            {(Object.keys(ROLE_LABELS) as UserRole[]).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRole(r)}
                style={{
                  padding: '10px 14px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                  border: `2px solid ${selectedRole === r ? 'var(--accent)' : 'var(--border)'}`,
                  background: selectedRole === r ? 'rgba(74,144,217,0.08)' : 'var(--surface)',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontSize: 20, marginBottom: 4 }}>{ROLE_ICONS[r]}</div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{ROLE_LABELS[r]}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{ROLE_DESCRIPTIONS[r]}</div>
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
            <button className="btn" type="submit" disabled={savingRole} style={{ alignSelf: 'flex-start' }}>
              {savingRole ? 'Saving…' : 'Save Role'}
            </button>
            {roleMsg && <span style={{ fontSize: 13, color: roleMsg.startsWith('Error') ? 'var(--danger)' : '#10b981' }}>{roleMsg}</span>}
          </div>
        </form>
      </div>

      {/* White-Label / Brand Settings */}
      <WhiteLabelSettings profile={profile} />

      {/* Legal & policies */}
      <div className="card">
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 12 }}>
          Legal &amp; Policies
        </div>
        <nav aria-label="Legal" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            ['Privacy Policy', '/privacy'],
            ['Terms of Service', '/terms'],
            ['Accessibility Statement', '/accessibility'],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ padding: '10px 0', fontSize: 14, color: 'var(--accent-label)', textDecoration: 'none', borderBottom: '1px solid var(--border)' }}
            >
              {label} ↗
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10,
  fontSize: 14, outline: 'none', fontFamily: 'inherit',
  background: 'var(--surface)', color: 'var(--text)',
};
