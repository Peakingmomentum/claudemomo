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
          boxShadow: active ? '0 0 24px rgba(240,120,30,0.55)' : '0 0 0 transparent',
          transition: 'box-shadow .3s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt={name || 'Pilot'} width={size} height={size} style={{ objectFit: 'contain' }} />
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
