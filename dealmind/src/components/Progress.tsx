interface Props {
  current: number;
  total: number;
}

export function Progress({ current, total }: Props) {
  const pct = Math.min(100, Math.max(0, (current / total) * 100));
  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: 12, color: 'var(--muted)', marginBottom: 6
      }}>
        <span>Step {current} of {total}</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div style={{
        width: '100%', height: 6, borderRadius: 999,
        background: 'var(--surface)', overflow: 'hidden'
      }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: 'linear-gradient(90deg, var(--accent), var(--accent2))',
          transition: 'width .3s'
        }} />
      </div>
    </div>
  );
}
