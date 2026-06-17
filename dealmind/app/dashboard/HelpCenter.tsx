'use client';

import { useState } from 'react';
import { HELP_ARTICLES, HELP_CATEGORIES, type HelpArticle } from '@/lib/helpArticles';
import { runWelcomeTour, runTour } from '@/lib/tours';

export function HelpCenter() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<HelpArticle | null>(null);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? HELP_ARTICLES.filter(a => a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q) || a.category.toLowerCase().includes(q))
    : HELP_ARTICLES;

  if (open) {
    return (
      <div style={{ maxWidth: 760 }}>
        <button onClick={() => setOpen(null)} className="btn btn-ghost" style={{ fontSize: 13, marginBottom: 16 }}>← All help</button>
        <div className="card">
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent-label)', marginBottom: 6 }}>{open.category}</div>
          <h2 style={{ margin: '0 0 14px' }}>{open.title}</h2>
          <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-line' }}>{open.body}</div>
          {open.tour && (
            <button onClick={() => runTour(open.tour!)} className="btn" style={{ marginTop: 18, fontSize: 13 }}>
              ▶ Take the {open.category} tour
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h2 style={{ margin: '0 0 6px' }}>Help & Documentation</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>Learn everything about Pocket Pilot — or take a guided tour.</p>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => runWelcomeTour()} className="btn" style={{ fontSize: 13 }}>▶ Replay the welcome tour</button>
        <button onClick={() => runTour('pipeline')} className="btn btn-ghost" style={{ fontSize: 13 }}>Pipeline tour</button>
        <button onClick={() => runTour('copilot')} className="btn btn-ghost" style={{ fontSize: 13 }}>Pilot tour</button>
        <button onClick={() => runTour('intel')} className="btn btn-ghost" style={{ fontSize: 13 }}>Daily Intel tour</button>
      </div>

      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search help…"
        style={{ padding: '11px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, background: 'var(--surface)', color: 'var(--text)' }}
      />

      {HELP_CATEGORIES.map(cat => {
        const arts = filtered.filter(a => a.category === cat);
        if (!arts.length) return null;
        return (
          <div key={cat}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', marginBottom: 8 }}>{cat}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {arts.map(a => (
                <button key={a.id} onClick={() => setOpen(a)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '11px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{a.title}</span>
                  <span style={{ color: 'var(--muted)', fontSize: 16 }} aria-hidden>→</span>
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {q && !filtered.length && (
        <div className="card" style={{ textAlign: 'center', color: 'var(--muted)' }}>No help articles match “{query}”.</div>
      )}
    </div>
  );
}
