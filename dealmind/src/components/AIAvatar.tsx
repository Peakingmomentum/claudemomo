'use client';

interface Props {
  active?: boolean;
  size?: number;
  name?: string;
}

export function AIAvatar({ active = false, size = 48, name }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div
        style={{
          width: size, height: size, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
          boxShadow: active ? '0 0 24px rgba(15,76,129,0.55)' : '0 0 0 transparent',
          transition: 'box-shadow .3s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 700, fontSize: size * 0.4
        }}
      >
        {(name?.[0] || 'C').toUpperCase()}
      </div>
      {name && (
        <div>
          <div style={{ fontWeight: 600 }}>{name}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{active ? 'Thinking…' : 'Ready'}</div>
        </div>
      )}
    </div>
  );
}
