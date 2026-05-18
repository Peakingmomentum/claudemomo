'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function SignInClient() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const supabase = createSupabaseBrowserClient();

  async function signInWithGoogle() {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  }

  async function signInWithEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    });
    setLoading(false);
    if (!error) setMagicSent(true);
  }

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24
    }}>
      <div className="card" style={{ maxWidth: 440, width: '100%' }}>
        <h1 style={{ fontSize: 32, marginBottom: 8 }}>DealMind</h1>
        <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
          Your AI-powered real estate business partner.
        </p>

        <button className="btn" style={{ width: '100%', marginBottom: 16 }}
          onClick={signInWithGoogle} disabled={loading}>
          Continue with Google
        </button>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          margin: '20px 0', color: 'var(--muted)', fontSize: 12
        }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          OR
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {magicSent ? (
          <p style={{ color: 'var(--success)' }}>
            Magic link sent — check your inbox.
          </p>
        ) : (
          <form onSubmit={signInWithEmail} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <button className="btn btn-ghost" type="submit" disabled={loading}>
              Email me a magic link
            </button>
          </form>
        )}

        <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 24, textAlign: 'center' }}>
          $97/month. Full access. Cancel anytime.
        </p>
      </div>
    </main>
  );
}
