'use client';
import { useState } from 'react';
import SignInA from './SignInA';
import SignInB from './SignInB';
import SignInC from './SignInC';

const OPTIONS = ['A — Vercel Minimal', 'B — Split Premium', 'C — Frosted Glass'];

export default function DesignPreview() {
  const [active, setActive] = useState(0);
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif', background: '#f0f0f0', minHeight: '100vh' }}>
      <div style={{ display: 'flex', gap: 8, padding: '16px 24px', background: '#fff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10 }}>
        <span style={{ fontWeight: 700, marginRight: 16, alignSelf: 'center' }}>Design Preview</span>
        {OPTIONS.map((label, i) => (
          <button key={i} onClick={() => setActive(i)} style={{
            padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
            background: active === i ? '#5A8DEE' : '#f5f5f5', color: active === i ? '#fff' : '#444'
          }}>{label}</button>
        ))}
      </div>
      <div style={{ padding: 24, maxWidth: 520, margin: '0 auto' }}>
        {active === 0 && <SignInA />}
        {active === 1 && <SignInB />}
        {active === 2 && <SignInC />}
      </div>
    </div>
  );
}
