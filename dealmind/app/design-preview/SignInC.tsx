'use client';
// Option C — Frosted Glass: light blue mesh gradient bg, glass card, platinum accents

export default function SignInC() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 40%, #f5f3ff 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Decorative blobs */}
      <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(74,144,217,.08)', filter: 'blur(60px)' }} />
      <div style={{ position: 'absolute', bottom: -60, left: -60, width: 280, height: 280, borderRadius: '50%', background: 'rgba(15,76,129,.08)', filter: 'blur(60px)' }} />

      <div style={{
        width: '100%', maxWidth: 400, position: 'relative',
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.9)',
        borderRadius: 20,
        boxShadow: '0 8px 32px rgba(74,144,217,.1), 0 1px 0 rgba(255,255,255,.8) inset',
        padding: '40px 36px'
      }}>

        {/* Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #4a90d9, #0f4c81)',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(74,144,217,.35)'
          }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 16 }}>D</span>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', letterSpacing: '-0.3px' }}>DealMind</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>Real Estate AI</div>
          </div>
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.8px', color: '#0f172a', marginBottom: 4 }}>
          Sign in
        </h1>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28 }}>
          Your AI copilot is ready.
        </p>

        {/* Google */}
        <button style={{
          width: '100%', padding: '11px 16px',
          border: '1px solid rgba(0,0,0,.08)',
          borderRadius: 10, background: 'rgba(255,255,255,.9)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          fontWeight: 600, fontSize: 14, color: '#0f172a', marginBottom: 20,
          boxShadow: '0 1px 4px rgba(0,0,0,.06)'
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
          Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,.07)' }} />
          <span style={{ fontSize: 12, color: '#94a3b8' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,.07)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          <input placeholder="Email address" type="email" style={{
            padding: '11px 14px',
            border: '1px solid rgba(0,0,0,.1)',
            borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit',
            background: 'rgba(255,255,255,.8)', color: '#0f172a',
            boxShadow: '0 1px 3px rgba(0,0,0,.04) inset'
          }} />
          <input placeholder="Password" type="password" style={{
            padding: '11px 14px',
            border: '1px solid rgba(0,0,0,.1)',
            borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit',
            background: 'rgba(255,255,255,.8)', color: '#0f172a',
            boxShadow: '0 1px 3px rgba(0,0,0,.04) inset'
          }} />
        </div>

        <button style={{
          width: '100%', padding: '12px',
          borderRadius: 10, border: 'none',
          background: 'linear-gradient(135deg, #4a90d9 0%, #0f4c81 100%)',
          color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(74,144,217,.4)',
          letterSpacing: '0.01em'
        }}>
          Sign In
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
          <span style={{ fontSize: 12, color: '#4a90d9', cursor: 'pointer' }}>Create account</span>
          <span style={{ fontSize: 12, color: '#94a3b8', cursor: 'pointer' }}>Magic link</span>
        </div>

        {/* Platinum footer */}
        <div style={{
          marginTop: 28, paddingTop: 20,
          borderTop: '1px solid rgba(0,0,0,.06)',
          display: 'flex', justifyContent: 'center', gap: 20
        }}>
          {['Secure', 'Private', '$97/mo'].map(t => (
            <span key={t} style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
