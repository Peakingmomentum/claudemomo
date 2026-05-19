'use client';

interface Option {
  value: string;
  label: string;
}

interface Props {
  options: Option[];
  value: string | string[];
  onChange: (val: any) => void;
  multi?: boolean;
}

export function PillSelect({ options, value, onChange, multi = false }: Props) {
  const isActive = (v: string) =>
    multi ? Array.isArray(value) && value.includes(v) : value === v;

  const toggle = (v: string) => {
    if (multi) {
      const arr = Array.isArray(value) ? value : [];
      onChange(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
    } else {
      onChange(v);
    }
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => toggle(opt.value)}
          style={{
            padding: '10px 16px',
            borderRadius: 999,
            border: `1px solid ${isActive(opt.value) ? 'var(--accent)' : 'var(--border)'}`,
            background: isActive(opt.value) ? 'rgba(90,141,238,0.15)' : 'var(--surface)',
            color: isActive(opt.value) ? 'var(--accent)' : 'var(--text)',
            fontWeight: 500,
            transition: 'all .15s'
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
