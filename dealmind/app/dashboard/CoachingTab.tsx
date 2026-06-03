'use client';

import { useState, useRef, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { Icon } from '@/components/Icon';
import { VoiceField } from '@/components/VoiceField';
import type { ChatMessage, DealMindUser } from '@/types';

interface Props {
  profile: DealMindUser;
}

// ── Prompt library ────────────────────────────────────────────

const PROMPT_CATEGORIES = [
  {
    label: 'Lead Generation',
    icon: 'target' as const,
    color: '#4a90d9',
    prompts: [
      'Give me a door knocking script for an absentee owner neighborhood',
      'Design a direct mail sequence for probate leads — what should the copy say?',
      'How do I structure Facebook ads targeting distressed homeowners? Give me the audience settings and ad copy.',
      'Walk me through a driving-for-dollars system I can run in 2 hours a week',
      'Give me a cold calling opener that doesn\'t sound scripted — and the follow-up if they say "not interested"',
    ],
  },
  {
    label: 'Follow-Up Scripts',
    icon: 'phone' as const,
    color: '#10b981',
    prompts: [
      'Write a 5-touch SMS sequence for a seller who said "call me in 3 months"',
      'Give me a voicemail script that actually gets callbacks',
      'Write a 3-email drip for a warm lead who went quiet after our first call',
      'How do I follow up after a seller says "I\'m not ready yet" without being annoying?',
      'Write a breakup message for a lead I\'ve followed up with 8+ times',
    ],
  },
  {
    label: 'Offers & Contracts',
    icon: 'dollar' as const,
    color: '#f59e0b',
    prompts: [
      'Help me structure a subject-to offer — what do I say to the seller and what do I watch for in the contract?',
      'Give me a negotiation script for lowering an asking price by 20% without losing the deal',
      'What red flags should I look for when reviewing an as-is residential purchase agreement?',
      'How do I explain seller financing to a homeowner who\'s never heard of it?',
      'Walk me through comping a deal in a rural market with very few comparable sales',
    ],
  },
  {
    label: 'Strategy & Growth',
    icon: 'chart-bar' as const,
    color: '#0f4c81',
    prompts: [
      'I want to scale from 1-2 deals a month to 5+. What do I need to build or change?',
      'What KPIs should I track weekly to know if my pipeline is healthy?',
      'I have 30+ active leads. Walk me through how to prioritize them this week.',
      'What\'s the difference between wholesaling, fix-and-flip, and subject-to? Which fits my market?',
      'When does it make sense to hire a VA vs. a full-time acquisitions person?',
    ],
  },
];

// ── Component ─────────────────────────────────────────────────

export function CoachingTab({ profile }: Props) {
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

      {/* ── Prompt library toggle ── */}
      <div style={{ marginBottom: 10 }}>
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
            {promptsOpen ? '▲' : '▼'}
          </span>
        </button>
      </div>

      {/* ── Prompt library grid ── */}
      {promptsOpen && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 10, marginBottom: 14,
          maxHeight: 300, overflowY: 'auto',
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
                  <Icon name={cat.icon} size={13} />
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
              Pick a prompt above or ask anything — scripts, strategy, lead gen, growth.
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
