'use client';

import { useState, useRef, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { Icon } from '@/components/Icon';
import { VoiceField } from '@/components/VoiceField';
import type { ChatMessage, DealMindUser } from '@/types';
import { getPromptCategories } from '@/lib/roleConfig';

interface Props {
  profile: DealMindUser;
}

// ── Component ─────────────────────────────────────────────────

export function CoachingTab({ profile }: Props) {
  // Role-specific prompt categories
  const PROMPT_CATEGORIES = getPromptCategories(profile.user_role ?? 'wholesaler');
  const [messages, setMessages]       = useState<ChatMessage[]>([]);
  const [draft, setDraft]             = useState('');
  const [sending, setSending]         = useState(false);
  const [promptsOpen, setPromptsOpen] = useState(true);
  const [loadingHist, setLoadingHist] = useState(true);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const supabase = createSupabaseBrowserClient();

  // Load coaching history on mount
  useEffect(() => {
    supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', profile.id)
      .eq('context', 'coaching')
      .order('created_at', { ascending: true })
      .limit(50)
      .then(({ data }) => {
        if (data) setMessages(data as ChatMessage[]);
        setLoadingHist(false);
      });
  }, [profile.id]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  function selectPrompt(text: string) {
    setDraft(text);
    setPromptsOpen(false);
    // Scroll to bottom so input is visible
    setTimeout(() => scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight }), 50);
  }

  async function send() {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setDraft('');

    const optimistic: ChatMessage = {
      id: 'temp-' + Date.now(),
      user_id: profile.id,
      created_at: new Date().toISOString(),
      role: 'user',
      content: text,
      context: 'coaching',
    };
    setMessages(m => [...m, optimistic]);

    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, context: 'coaching' }),
      });
      const data = await res.json() as { reply?: string; error?: string };
      const reply: ChatMessage = {
        id: 'reply-' + Date.now(),
        user_id: profile.id,
        created_at: new Date().toISOString(),
        role: 'assistant',
        content: data.reply || (data.error ? `Error: ${data.error}` : 'No reply'),
        context: 'coaching',
      };
      setMessages(m => [...m, reply]);
    } finally {
      setSending(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)' }}>

      {/* ── Message scroller ── */}
      <div ref={scrollerRef} style={{
        flex: 1, overflowY: 'auto', padding: '4px 8px',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        {!loadingHist && messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', marginTop: 32 }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%', margin: '0 auto 14px',
              background: 'linear-gradient(135deg, #4a90d9, #0f4c81)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="bulb" size={26} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
              Your real estate coach is ready.
            </p>
            <p style={{ fontSize: 13, marginTop: 6 }}>
              Pick a prompt below or ask anything — scripts, strategy, lead gen, growth.
            </p>
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '82%',
            padding: '12px 16px',
            borderRadius: 16,
            background: m.role === 'user' ? 'var(--accent)' : 'var(--card)',
            border: m.role === 'assistant' ? '1px solid var(--border)' : 'none',
            color: m.role === 'user' ? 'white' : 'var(--text)',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.6,
          }}>
            {m.content}
          </div>
        ))}
        {sending && (
          <div style={{ alignSelf: 'flex-start', color: 'var(--muted)', fontStyle: 'italic', fontSize: 13 }}>
            Coach is thinking…
          </div>
        )}
      </div>

      {/* ── Prompt library (below chat, above input — no seam) ── */}
      {promptsOpen && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 10, marginTop: 12, marginBottom: 4,
          maxHeight: 260, overflowY: 'auto',
          paddingRight: 4,
        }}>
          {PROMPT_CATEGORIES.map(cat => (
            <div key={cat.label} style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '12px 10px',
            }}>
              {/* Category header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 7,
                  background: cat.color + '22',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  <Icon name={cat.icon as any} size={13} />
                </div>
                <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--text)' }}>{cat.label}</span>
              </div>
              {/* Prompt buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {cat.prompts.map(p => (
                  <button
                    key={p}
                    onClick={() => selectPrompt(p)}
                    style={{
                      textAlign: 'left', background: 'var(--surface)',
                      border: '1px solid var(--border)', borderRadius: 8,
                      padding: '7px 10px', cursor: 'pointer',
                      fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.4,
                      transition: 'border-color .12s, color .12s',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget).style.borderColor = cat.color;
                      (e.currentTarget).style.color = 'var(--text)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget).style.borderColor = 'var(--border)';
                      (e.currentTarget).style.color = 'var(--muted)';
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Prompt library toggle (sits right above the input) ── */}
      <div style={{ marginTop: 10 }}>
        <button
          onClick={() => setPromptsOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '8px 14px', cursor: 'pointer',
            color: 'var(--text)', fontWeight: 600, fontSize: 13,
          }}
        >
          <Icon name="bulb" size={15} />
          {promptsOpen ? 'Hide prompt library' : 'Browse coaching prompts'}
          <span style={{ marginLeft: 2, fontSize: 11, color: 'var(--muted)' }}>
            {promptsOpen ? '▼' : '▲'}
          </span>
        </button>
      </div>

      {/* ── Input row ── */}
      <div style={{ display: 'flex', gap: 8, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
        <div style={{ flex: 1 }}>
          <VoiceField
            value={draft}
            onChange={setDraft}
            placeholder="Ask your coach — strategy, scripts, objections, growth…"
            summarize
          />
        </div>
        <button
          className="btn"
          onClick={send}
          onKeyDown={handleKey}
          disabled={!draft.trim() || sending}
        >
          <Icon name="send" />
        </button>
      </div>
    </div>
  );
}
