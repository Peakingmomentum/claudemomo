'use client';
// Option A — Vercel Minimal: pure white, razor-thin borders, electric blue, confident type

export default function SignInA() {
  return (
    <div style={{
      minHeight: '100vh', background: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo mark */}
        <div style={{ marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            fontWeight: 800, fontSize: 20, letterSpacing: '-0.5px', color: '#0a0a0a'
          }}>
            <div style={{
              width: 32, height: 32, background: '#0a0a0a', borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 900, fontSize: 14
            }}>D</div>
            DealMind
          </div>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.8px', color: '#0a0a0a', marginBottom: 6 }}>
          Welcome back
        </h1>
        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 32 }}>
          Sign in to your AI real estate copilot.
        </p>

        {/* Google */}
        <button style={{
          width: '100%', padding: '11px 16px', border: '1px solid #e5e7eb',
          borderRadius: 8, background: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          fontWeight: 600, fontSize: 14, color: '#0a0a0a', marginBottom: 20,
          transition: 'border-color .15s, box-shadow .15s',
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
          Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: '#f3f4f6' }} />
          <span style={{ fontSize: 12, color: '#9ca3af' }}>or</span>
          <div style={{ flex: 1, height: 1, background: '#f3f4f6' }} />
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          <input placeholder="Email address" type="email" style={{
            padding: '11px 14px', border: '1px solid #e5e7eb', borderRadius: 8,
            fontSize: 14, outline: 'none', color: '#0a0a0a', background: '#fff',
            fontFamily: 'inherit'
          }} />
          <input placeholder="Password" type="password" style={{
            padding: '11px 14px', border: '1px solid #e5e7eb', borderRadius: 8,
            fontSize: 14, outline: 'none', color: '#0a0a0a', background: '#fff',
            fontFamily: 'inherit'
          }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
          <span style={{ fontSize: 12, color: '#4a90d9', cursor: 'pointer' }}>Forgot password?</span>
        </div>

        <button style={{
          width: '100%', padding: '12px', borderRadius: 8, border: 'none',
          background: '#0a0a0a', color: '#fff', fontWeight: 700, fontSize: 14,
          cursor: 'pointer', letterSpacing: '0.01em'
        }}>
          Sign In →
        </button>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#9ca3af', marginTop: 20 }}>
          No account? <span style={{ color: '#4a90d9', cursor: 'pointer', fontWeight: 600 }}>Create one</span>
        </p>
      </div>
    </div>
  );
}
