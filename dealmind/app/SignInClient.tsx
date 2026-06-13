'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { Icon } from '@/components/Icon';

type Mode = 'signin' | 'signup' | 'magic' | 'reset';

// Google sign-in is hidden for beta until the OAuth consent screen is branded
// and verified. Flip to true to restore the "Continue with Google" button.
const SHOW_GOOGLE_SIGNIN = false;

const FEATURES = [
  { icon: 'spark'    as const, title: 'Named AI Copilot',        desc: 'Knows your leads, market, and deals' },
  { icon: 'bolt'     as const, title: 'Daily Intel Brief',       desc: 'Personalized action plan every morning' },
  { icon: 'pipeline' as const, title: 'Smart Pipeline',          desc: 'Stage every lead with a single sentence' },
  { icon: 'bulb'     as const, title: 'AI Coaching & Scripts',   desc: 'Prompts, strategies, and scripts on demand' },
  { icon: 'mic'      as const, title: 'Voice-Powered Input',     desc: 'Talk to your copilot, hands-free' },
  { icon: 'calendar' as const, title: 'Calendar & Gmail Sync',   desc: 'Appointments and follow-ups in one place' },
];

export default function SignInClient() {
  const supabase = createSupabaseBrowserClient();
  const [mode, setMode]         = useState<Mode>('signin');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [message, setMessage]   = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  function setErr(text: string) { setMessage({ type: 'error',   text }); }
  function setOk(text: string)  { setMessage({ type: 'success', text }); }

  async function signInWithGoogle() {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setMessage(null);

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setErr('Wrong email or password. Try magic link if you signed up that way.');
      else window.location.href = '/auth/callback?code=';

    } else if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
      });
      // If account already exists, just sign in with the provided password
      if (error && (error.message.toLowerCase().includes('already') || error.message.toLowerCase().includes('registered'))) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (!signInErr) { window.location.href = '/auth/callback?code='; return; }
        else { setErr('Account exists — wrong password. Try "Forgot password?" below.'); setLoading(false); return; }
      }
      if (error) { setErr(error.message); }
      else {
        // Try signing in immediately (works when email confirm is disabled)
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
        if (!signInErr) window.location.href = '/auth/callback?code=';
        else setOk('Account created! Check your email to confirm, then sign in.');
      }

    } else if (mode === 'magic') {
      const { error } = await supabase.auth.signInWithOtp({
        email, options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
      });
      if (error) setErr(error.message);
      else setOk('Magic link sent — check your inbox.');

    } else if (mode === 'reset') {
      // Always use the canonical custom domain (never a protected *.vercel.app)
      // and a clean path with no query string so it matches the redirect allow list.
      const base = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${base}/auth/reset`
      });
      if (error) setErr(error.message);
      else setOk('Password reset email sent — check your inbox. Open the link to set a new password.');
    }

    setLoading(false);
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 40%, #f5f3ff 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, position: 'relative', overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif'
    }}>
      {/* Decorative blobs */}
      <div style={{ position: 'fixed', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(74,144,217,.07)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: -80, left: -80, width: 350, height: 350, borderRadius: '50%', background: 'rgba(15,76,129,.07)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      {/* Outer column: auth card + feature strip */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, width: '100%', maxWidth: 880, position: 'relative' }}>

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

        {/* Heading */}
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.7px', color: '#0f172a', marginBottom: 4, lineHeight: 1.2 }}>
          {mode === 'signup' ? 'Create account' : mode === 'magic' ? 'Magic link' : mode === 'reset' ? 'Reset password' : 'Sign in'}
        </h1>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28 }}>
          {mode === 'signup' ? 'Start your AI real estate edge.' : mode === 'magic' ? "We'll email you a one-click link." : mode === 'reset' ? "We'll send a reset link." : 'Your AI copilot is ready.'}
        </p>

        {/* Sign-in / Sign-up tabs */}
        {(mode === 'signin' || mode === 'signup') && (
          <div style={{ display: 'flex', gap: 4, marginBottom: 22, background: 'rgba(0,0,0,.04)', borderRadius: 10, padding: 4 }}>
            {(['signin', 'signup'] as Mode[]).map(m => (
              <button key={m} type="button" onClick={() => { setMode(m); setMessage(null); }} style={{
                flex: 1, padding: '8px 0', border: 'none', borderRadius: 8, cursor: 'pointer',
                fontWeight: 600, fontSize: 13, transition: 'all .15s', fontFamily: 'inherit',
                background: mode === m ? '#fff' : 'transparent',
                color: mode === m ? '#0f172a' : '#94a3b8',
                boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
              }}>
                {m === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>
        )}

        {/* Google */}
        {SHOW_GOOGLE_SIGNIN && (mode === 'signin' || mode === 'signup') && (
          <>
            <button onClick={signInWithGoogle} disabled={loading} style={{
              width: '100%', padding: '11px 16px',
              border: '1px solid rgba(0,0,0,.08)', borderRadius: 10,
              background: 'rgba(255,255,255,.9)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              fontWeight: 600, fontSize: 14, color: '#0f172a', marginBottom: 18,
              boxShadow: '0 1px 4px rgba(0,0,0,.06)', fontFamily: 'inherit'
            }}>
              <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
              Continue with Google
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,.07)' }} />
              <span style={{ fontSize: 12, color: '#94a3b8' }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,.07)' }} />
            </div>
          </>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input type="email" placeholder="Email address" aria-label="Email address"
            autoComplete="email" value={email}
            onChange={e => setEmail(e.target.value)} required style={inputStyle} />

          {(mode === 'signin' || mode === 'signup') && (
            <input type="password" placeholder="Password" aria-label="Password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={e => setPassword(e.target.value)} required minLength={6} style={inputStyle} />
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '12px', borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #4a90d9 0%, #0f4c81 100%)',
            color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(74,144,217,.35)',
            fontFamily: 'inherit', marginTop: 4, opacity: loading ? 0.7 : 1
          }}>
            {loading ? '…' : mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : mode === 'magic' ? 'Send Magic Link' : 'Send Reset Email'}
          </button>
        </form>

        {/* Secondary links */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
          {(mode === 'signin' || mode === 'signup') ? (
            <>
              <button type="button" style={linkStyle} onClick={() => { setMode('magic'); setMessage(null); }}>
                Email magic link
              </button>
              {mode === 'signin' && (
                <button type="button" style={linkStyle} onClick={() => { setMode('reset'); setMessage(null); }}>
                  Forgot password?
                </button>
              )}
            </>
          ) : (
            <button type="button" style={linkStyle} onClick={() => { setMode('signin'); setMessage(null); }}>
              ← Back to sign in
            </button>
          )}
        </div>

        {/* Feedback */}
        {message && (
          <div style={{
            marginTop: 16, padding: '10px 14px', borderRadius: 10, fontSize: 13,
            background: message.type === 'error' ? 'rgba(239,68,68,.08)' : 'rgba(34,197,94,.08)',
            color: message.type === 'error' ? '#dc2626' : '#16a34a',
            border: `1px solid ${message.type === 'error' ? 'rgba(239,68,68,.2)' : 'rgba(34,197,94,.2)'}`
          }}>
            {message.text}
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(0,0,0,.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
            {['Secure', 'Private', '$97/mo'].map(t => (
              <span key={t} style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{t}</span>
            ))}
          </div>
          <nav aria-label="Legal" style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <a href="/privacy" style={{ fontSize: 11, color: '#94a3b8', textDecoration: 'none' }}>Privacy</a>
            <a href="/terms" style={{ fontSize: 11, color: '#94a3b8', textDecoration: 'none' }}>Terms</a>
            <a href="/accessibility" style={{ fontSize: 11, color: '#94a3b8', textDecoration: 'none' }}>Accessibility</a>
          </nav>
          <p style={{ fontSize: 10, color: '#cbd5e1', textAlign: 'center', lineHeight: 1.5, maxWidth: 340 }}>
            By continuing you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>

      {/* ── Feature showcase strip ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(128px, 1fr))',
        gap: 10, width: '100%',
      }}>
        {FEATURES.map(f => (
          <div key={f.title} style={{
            background: 'rgba(255,255,255,0.55)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.85)',
            borderRadius: 14, padding: '14px 12px',
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8,
            boxShadow: '0 2px 12px rgba(74,144,217,.06)',
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'linear-gradient(135deg, rgba(74,144,217,.14), rgba(15,76,129,.09))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name={f.icon} size={15} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 11.5, color: '#0f172a', lineHeight: 1.3 }}>{f.title}</div>
              <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 3, lineHeight: 1.4 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      </div>{/* end outer column */}
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '11px 14px', border: '1px solid rgba(0,0,0,.1)', borderRadius: 10,
  fontSize: 14, outline: 'none', fontFamily: 'inherit', color: '#0f172a',
  background: 'rgba(255,255,255,.85)',
  boxShadow: '0 1px 3px rgba(0,0,0,.04) inset'
};

const linkStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  color: '#4a90d9', fontSize: 12, padding: 0, fontFamily: 'inherit'
};
