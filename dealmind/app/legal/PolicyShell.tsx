import Link from 'next/link';

export function PolicyShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--body)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", sans-serif',
      }}
    >
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 96px' }}>
        <Link
          href="/"
          style={{ fontSize: 13, color: 'var(--accent-label)', textDecoration: 'none', fontWeight: 600 }}
        >
          ← Back to Pocket Pilot
        </Link>

        <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text)', margin: '20px 0 6px' }}>
          {title}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--faint)', marginBottom: 32 }}>Last updated: {updated}</p>

        <div style={{ fontSize: 15, lineHeight: 1.7 }}>{children}</div>

        <footer style={{ marginTop: 56, paddingTop: 24, borderTop: '1px solid var(--border)', display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <Link href="/privacy" style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>Privacy</Link>
          <Link href="/terms" style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>Terms</Link>
          <Link href="/accessibility" style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>Accessibility</Link>
        </footer>
      </div>
    </main>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 19, fontWeight: 700, color: 'var(--text)', margin: '32px 0 10px' }}>{children}</h2>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: '0 0 14px' }}>{children}</p>;
}

export function UL({ children }: { children: React.ReactNode }) {
  return <ul style={{ margin: '0 0 14px', paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</ul>;
}

export function Note({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="note"
      style={{
        margin: '0 0 20px', padding: '12px 16px', borderRadius: 10,
        background: 'var(--accent-soft)', border: '1px solid var(--border-mid)',
        fontSize: 13.5, color: 'var(--muted)',
      }}
    >
      {children}
    </div>
  );
}
