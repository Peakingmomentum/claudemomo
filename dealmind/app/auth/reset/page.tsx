'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

type Phase = 'verifying' | 'ready' | 'invalid' | 'done';

export default function ResetPasswordPage() {
  const supabase = createSupabaseBrowserClient();
  const [phase, setPhase]       = useState<Phase>('verifying');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  // Establish the recovery session. Normally /auth/callback has already
  // exchanged the code and set the session cookie before redirecting here;
  // we also handle a raw ?code= as a fallback.
  useEffect(() => {
    let active = true;

    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) { if (active) setPhase('ready'); return; }

      const code = new URLSearchParams(window.location.search).get('code');
      if (code) {
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
        if (!active) return;
        if (!exErr) { setPhase('ready'); return; }
        const { data: { session: s2 } } = await supabase.auth.getSession();
        if (active) setPhase(s2 ? 'ready' : 'invalid');
        return;
      }

      if (active) setPhase('invalid');
    }

    init();
    return () => { active = false; };
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }

    setSaving(true);
    const { error: updErr } = await supabase.auth.updateUser({ password });
    if (updErr) { setError(updErr.message); setSaving(false); return; }

    setPhase('done');
    // Session is now valid — route the user onward (dashboard / onboarding).
    setTimeout(() => { window.location.href = '/auth/callback'; }, 1400);
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 40%, #f5f3ff 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, position: 'relative', overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif'
    }}>
      <div style={{ position: 'fixed', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(74,144,217,.07)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: -80, left: -80, width: 350, height: 350, borderRadius: '50%', background: 'rgba(15,76,129,.07)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <div style={{
        width: '100%', maxWidth: 420, position: 'relative',
        background: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.95)',
        borderRadius: 20,
        boxShadow: '0 8px 40px rgba(74,144,217,.10), 0 1px 0 rgba(255,255,255,.9) inset',
        padding: '40px 36px'
      }}>
        {/* Logo badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Pocket Pilot" width={38} height={38} style={{ flexShrink: 0, objectFit: 'contain' }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', letterSpacing: '-0.3px', lineHeight: 1 }}>Pocket Pilot</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Real Estate AI</div>
          </div>
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.7px', color: '#0f172a', marginBottom: 4, lineHeight: 1.2 }}>
          {phase === 'done' ? 'Password updated' : 'Set a new password'}
        </h1>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28 }}>
          {phase === 'verifying' && 'Verifying your reset link…'}
          {phase === 'ready'     && 'Choose a new password for your account.'}
          {phase === 'invalid'   && 'This reset link is invalid or has expired.'}
          {phase === 'done'      && 'Signing you in…'}
        </p>

        {phase === 'ready' && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input type="password" placeholder="New password (min 8 chars)" aria-label="New password"
              autoComplete="new-password" value={password}
              onChange={e => setPassword(e.target.value)} required minLength={8} style={inputStyle} />
            <input type="password" placeholder="Confirm new password" aria-label="Confirm new password"
              autoComplete="new-password" value={confirm}
              onChange={e => setConfirm(e.target.value)} required minLength={8} style={inputStyle} />

            <button type="submit" disabled={saving} style={{
              width: '100%', padding: '12px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #4a90d9 0%, #0f4c81 100%)',
              color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(74,144,217,.35)',
              fontFamily: 'inherit', marginTop: 4, opacity: saving ? 0.7 : 1
            }}>
              {saving ? '…' : 'Update Password'}
            </button>
          </form>
        )}

        {phase === 'invalid' && (
          <a href="/" style={{
            display: 'block', textAlign: 'center', width: '100%', padding: '12px', borderRadius: 10,
            background: 'linear-gradient(135deg, #4a90d9 0%, #0f4c81 100%)', color: '#fff',
            fontWeight: 700, fontSize: 14, textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(74,144,217,.35)'
          }}>
            Back to sign in
          </a>
        )}

        {error && (
          <div style={{
            marginTop: 16, padding: '10px 14px', borderRadius: 10, fontSize: 13,
            background: 'rgba(239,68,68,.08)', color: '#dc2626',
            border: '1px solid rgba(239,68,68,.2)'
          }}>
            {error}
          </div>
        )}

        {phase !== 'invalid' && (
          <div style={{ marginTop: 18, textAlign: 'center' }}>
            <a href="/" style={{ color: '#4a90d9', fontSize: 12, textDecoration: 'none' }}>← Back to sign in</a>
          </div>
        )}
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '11px 14px', border: '1px solid rgba(0,0,0,.1)', borderRadius: 10,
  fontSize: 14, outline: 'none', fontFamily: 'inherit', color: '#0f172a',
  background: 'rgba(255,255,255,.85)',
  boxShadow: '0 1px 3px rgba(0,0,0,.04) inset'
};
