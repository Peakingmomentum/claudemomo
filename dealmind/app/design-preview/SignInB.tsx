'use client';
// Option B — Split Premium: dark brand panel left, clean white form right

export default function SignInB() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', background: '#fff',
      borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 48px rgba(0,0,0,.12)'
    }}>

      {/* Left brand panel */}
      <div style={{
        width: '45%', background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 100%)',
        padding: '40px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
      }}>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: '-0.5px'
          }}>
            <div style={{
              width: 28, height: 28, background: '#0f4c81', borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, fontSize: 13, color: '#fff'
            }}>D</div>
            DealMind
          </div>
        </div>

        <div>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1.35, letterSpacing: '-0.5px', marginBottom: 24 }}>
            Your AI-powered real estate edge.
          </p>
          {[
            'Stack motivated seller lists',
            'Daily deal intel briefing',
            'AI copilot that knows your market',
            'Gmail + Calendar sync',
          ].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#0f4c8120', border: '1px solid #0f4c8150', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: '#60a5fa', fontSize: 10 }}>✓</span>
              </div>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>{f}</span>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 11, color: '#475569' }}>$97/month · Cancel anytime</p>
      </div>

      {/* Right form */}
      <div style={{ flex: 1, padding: '40px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', color: '#0f172a', marginBottom: 4 }}>
          Sign in
        </h2>
        <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 28 }}>Welcome back.</p>

        <button style={{
          width: '100%', padding: '10px', border: '1px solid #e2e8f0',
          borderRadius: 8, background: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontWeight: 600, fontSize: 13, color: '#0f172a', marginBottom: 18,
        }}>
          <svg width="16" height="16" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
          Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
          <span style={{ fontSize: 11, color: '#cbd5e1' }}>or</span>
          <div style={{ flex: 1, height: 1, background: '#f1f5f9' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input placeholder="Email" type="email" style={{
            padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 7,
            fontSize: 13, outline: 'none', fontFamily: 'inherit', color: '#0f172a'
          }} />
          <input placeholder="Password" type="password" style={{
            padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 7,
            fontSize: 13, outline: 'none', fontFamily: 'inherit', color: '#0f172a'
          }} />
        </div>

        <button style={{
          width: '100%', padding: '11px', borderRadius: 8, border: 'none',
          background: 'linear-gradient(135deg, #0f4c81, #4a90d9)',
          color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', marginTop: 16
        }}>
          Sign In
        </button>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 16 }}>
          No account? <span style={{ color: '#0f4c81', cursor: 'pointer' }}>Create one</span>
          {' · '}
          <span style={{ color: '#94a3b8', cursor: 'pointer' }}>Magic link</span>
        </p>
      </div>
    </div>
  );
}
