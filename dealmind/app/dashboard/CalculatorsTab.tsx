'use client';

import { useState } from 'react';
import type { DealMindUser } from '@/types';
import { type UserRole, getCalculators, type Calculator, type CalcResult, ROLE_LABELS } from '@/lib/roleConfig';
import { Icon } from '@/components/Icon';

interface Props {
  profile: DealMindUser & { user_role?: UserRole | null };
}

function formatResult(value: number, format: CalcResult['format']): string {
  if (format === 'dollar') {
    if (value >= 1_000_000) return '$' + (value / 1_000_000).toFixed(2) + 'M';
    if (value >= 1_000)     return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return '$' + value.toFixed(2);
  }
  if (format === 'percent') return value.toFixed(2) + '%';
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function CalcCard({ calc }: { calc: Calculator }) {
  const initialVals: Record<string, number> = {};
  calc.fields.forEach(f => { if (f.default !== undefined) initialVals[f.id] = f.default; });

  const [vals, setVals]       = useState<Record<string, string>>({});
  const [results, setResults] = useState<CalcResult[] | null>(null);
  const [error, setError]     = useState<string | null>(null);

  function getNumVals(): Record<string, number> {
    const out: Record<string, number> = {};
    calc.fields.forEach(f => {
      const raw = vals[f.id];
      out[f.id] = raw !== undefined && raw !== '' ? parseFloat(raw) : (f.default ?? 0);
    });
    return out;
  }

  function calculate() {
    setError(null);
    try {
      const numVals = getNumVals();
      const res = calc.formula(numVals);
      setResults(res);
    } catch (e: any) {
      setError('Check your inputs and try again.');
    }
  }

  function reset() {
    setVals({});
    setResults(null);
    setError(null);
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{calc.label}</div>
        <div style={{ fontSize: 13, color: 'var(--muted)' }}>{calc.description}</div>
      </div>

      {/* Fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {calc.fields.map(field => (
          <div key={field.id}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {field.label}
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              {field.prefix && (
                <span style={{ position: 'absolute', left: 12, fontSize: 14, color: 'var(--muted)', pointerEvents: 'none', zIndex: 1 }}>
                  {field.prefix}
                </span>
              )}
              <input
                type="number"
                value={vals[field.id] ?? ''}
                onChange={e => setVals(v => ({ ...v, [field.id]: e.target.value }))}
                placeholder={field.placeholder ?? String(field.default ?? '')}
                style={{
                  width: '100%', padding: `10px ${field.suffix ? '50px' : '12px'} 10px ${field.prefix ? '28px' : '12px'}`,
                  border: '1px solid var(--border)', borderRadius: 8,
                  fontSize: 14, fontFamily: 'inherit', background: 'var(--surface)', color: 'var(--text)',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
              {field.suffix && (
                <span style={{ position: 'absolute', right: 12, fontSize: 12, color: 'var(--muted)', pointerEvents: 'none' }}>
                  {field.suffix}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn" onClick={calculate} style={{ flex: 1 }}>
          <Icon name="spark" size={14} /> Calculate
        </button>
        <button className="btn btn-ghost" onClick={reset}>
          Reset
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</div>
      )}

      {/* Results */}
      {results && (
        <div style={{
          borderRadius: 10, overflow: 'hidden',
          border: '1px solid rgba(74,144,217,.2)',
          background: 'linear-gradient(135deg, rgba(74,144,217,.04), rgba(15,76,129,.04))',
        }}>
          <div style={{ padding: '8px 14px', borderBottom: '1px solid rgba(74,144,217,.15)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="spark" size={12} color="var(--accent)" />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-label)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Results</span>
          </div>
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {results.map((r, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: r.highlight ? '10px 12px' : '6px 0',
                borderRadius: r.highlight ? 8 : 0,
                background: r.highlight ? 'var(--surface)' : 'transparent',
                border: r.highlight ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{ fontSize: r.highlight ? 14 : 13, color: 'var(--muted)', fontWeight: r.highlight ? 600 : 400 }}>
                  {r.label}
                </span>
                <span style={{
                  fontSize: r.highlight ? 18 : 14,
                  fontWeight: r.highlight ? 800 : 600,
                  color: r.highlight ? 'var(--accent-label)' : 'var(--text)',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {formatResult(r.value, r.format)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function CalculatorsTab({ profile }: Props) {
  const userRole = (profile as any).user_role as UserRole | null;
  const calcs = getCalculators(userRole);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ margin: '0 0 6px' }}>Calculators</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>
          {userRole ? `${ROLE_LABELS[userRole]} calculators — tuned for your role.` : 'Real estate calculators.'}
          {' '}Change your role in Settings to get different calculators.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 20,
        alignItems: 'start',
      }}>
        {calcs.map(calc => (
          <CalcCard key={calc.id} calc={calc} />
        ))}
      </div>
    </div>
  );
}
