'use client';

import { useState, useRef, useEffect } from 'react';
import { Icon } from '@/components/Icon';
import { AIAvatar } from '@/components/AIAvatar';
import { VoiceField } from '@/components/VoiceField';
import type { ChatMessage, DealMindUser, Lead } from '@/types';

interface Props {
  profile: DealMindUser;
  leads: Lead[];
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  onLeadChange?: () => void;
  onNavigateToLead?: (leadId: string) => void;
  embedded?: boolean;
  seedMessage?: string | null;
  onSeedConsumed?: () => void;
}

// ── Suggested prompts ─────────────────────────────────────────

const PROMPT_GROUPS = [
  {
    label: 'Pipeline',
    icon: 'pipeline' as const,
    color: '#4a90d9',
    prompts: [
      { label: 'Add a lead',           text: 'I want to add a new lead to my pipeline.' },
      { label: 'Pipeline summary',     text: 'Give me a quick summary of my current pipeline — stages, hot leads, and anything urgent.' },
      { label: 'Who needs follow-up?', text: 'Which leads need a follow-up from me today?' },
      { label: 'Hottest lead',         text: 'Who is my hottest lead right now and what should my next move be?' },
    ],
  },
  {
    label: 'Daily Focus',
    icon: 'spark' as const,
    color: '#10b981',
    prompts: [
      { label: 'What should I do today?', text: 'What are my top 3 priorities to work on today based on my pipeline?' },
      { label: 'Weekly game plan',        text: 'Give me a focused game plan for the next 7 days based on where my deals stand.' },
      { label: 'Pipeline at risk',        text: 'Which leads am I at risk of losing if I don\'t act soon?' },
      { label: 'Pipeline value',          text: 'What is my total estimated pipeline value right now?' },
    ],
  },
  {
    label: 'Lead Actions',
    icon: 'phone' as const,
    color: '#f59e0b',
    prompts: [
      { label: 'Log a contact',      text: 'I just spoke with a lead — help me log the contact and next steps.' },
      { label: 'Schedule follow-up', text: 'I need to schedule a follow-up call or appointment for a lead.' },
      { label: 'Update lead stage',  text: 'I want to move a lead to a different stage in my pipeline.' },
      { label: 'Dead lead',          text: 'A lead fell through — help me mark them and capture what happened.' },
    ],
  },
  {
    label: 'Analyze',
    icon: 'chart-bar' as const,
    color: '#0f4c81',
    prompts: [
      { label: 'Best outreach message', text: 'Draft me the best outreach message for my hottest lead right now.' },
      { label: 'Stalled leads',         text: 'Which leads have been stalled the longest? What should I say to re-engage them?' },
      { label: 'Motivation breakdown',  text: 'Break down my leads by motivation level and tell me where to focus.' },
      { label: 'This week\'s wins',     text: 'What progress have I made this week across my pipeline? Any wins to celebrate?' },
    ],
  },
];

// ── Lead name linker ──────────────────────────────────────────

function renderContent(
  text: string,
  leads: Lead[],
  onNavigate: (id: string) => void
): React.ReactNode {
  if (!leads.length) return text;
  const sorted = [...leads].sort((a, b) => b.name.length - a.name.length);
  const escaped = sorted.map(l => l.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'g');
  const parts = text.split(regex);
  return parts.map((part, i) => {
    const lead = leads.find(l => l.name === part);
    if (lead) {
      return (
        <button
          key={i}
          onClick={() => onNavigate(lead.id)}
          title={`Open ${lead.name}'s contact card`}
          style={{
            background: 'none', border: 'none', padding: 0,
            cursor: 'pointer', color: 'inherit',
            fontWeight: 700, textDecoration: 'underline',
            textDecorationStyle: 'dotted', textUnderlineOffset: 3,
            fontSize: 'inherit', fontFamily: 'inherit', opacity: 0.9,
          }}
        >
          {part}
        </button>
      );
    }
    return part;
  });
}

// ── Component ─────────────────────────────────────────────────

export function CopilotChat({ profile, leads, messages, setMessages, onLeadChange, onNavigateToLead, embedded, seedMessage, onSeedConsumed }: Props) {
  const [draft, setDraft]             = useState('');
  const [sending, setSending]         = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const didInitialScroll = useRef(false);
  const copilotName = profile.copilot_name || 'Pilot';

  // On open, jump straight to the most recent message (instant); animate smoothly
  // for messages added afterward.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: didInitialScroll.current ? 'smooth' : 'auto' });
    didInitialScroll.current = true;
  }, [messages.length]);

  async function send(text?: string) {
    const msg = (text ?? draft).trim();
    if (!msg || sending) return;
    setSending(true);
    setDraft('');
    setSuggestOpen(false);

    const optimistic: ChatMessage = {
      id: 'temp-' + Date.now(),
      user_id: profile.id,
      created_at: new Date().toISOString(),
      role: 'user', content: msg, context: 'chat',
    };
    setMessages(m => [...m, optimistic]);

    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          context: 'chat',
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
          tzOffset: new Date().getTimezoneOffset(),
        }),
      });
      const data = await res.json() as { reply?: string; error?: string; actions?: any[] };
      const reply: ChatMessage = {
        id: 'reply-' + Date.now(),
        user_id: profile.id,
        created_at: new Date().toISOString(),
        role: 'assistant',
        content: data.reply || (data.error ? `Error: ${data.error}` : 'No reply'),
        context: 'chat',
      };
      setMessages(m => [...m, reply]);
      if (data.actions?.length) onLeadChange?.();
    } finally {
      setSending(false);
    }
  }

  // Auto-send a seeded message (e.g. the morning check-in launched from Daily Intel).
  const seedSent = useRef<string | null>(null);
  useEffect(() => {
    if (seedMessage && seedSent.current !== seedMessage && !sending) {
      seedSent.current = seedMessage;
      send(seedMessage);
      onSeedConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedMessage]);

  const hasMessages = messages.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: embedded ? '100%' : 'calc(100vh - 180px)', flex: embedded ? 1 : undefined, overflow: 'hidden' }}>

      {/* ── Message scroller ── */}
      <div ref={scrollerRef} style={{
        flex: 1, overflowY: 'auto', padding: 8,
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>

        {/* Empty state — avatar + prompt grid */}
        {!hasMessages && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 24, gap: 24 }}>
            <div style={{ textAlign: 'center' }}>
              <AIAvatar name={copilotName} active size={72} />
              <p style={{ marginTop: 12, fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>
                {copilotName} is ready.
              </p>
              <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>
                Tap a prompt below or type anything.
              </p>
            </div>

            {/* Prompt grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 10, width: '100%', maxWidth: 860,
            }}>
              {PROMPT_GROUPS.map(group => (
                <div key={group.label} style={{
                  background: 'var(--card)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '12px 10px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: 6,
                      background: group.color + '20',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Icon name={group.icon} size={13} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 11.5, color: 'var(--text)' }}>{group.label}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {group.prompts.map(p => (
                      <button
                        key={p.label}
                        onClick={() => send(p.text)}
                        style={{
                          textAlign: 'left', background: 'var(--surface)',
                          border: '1px solid var(--border)', borderRadius: 8,
                          padding: '7px 10px', cursor: 'pointer',
                          fontSize: 12, color: 'var(--muted)', lineHeight: 1.4,
                          transition: 'border-color .12s, color .12s',
                          fontFamily: 'inherit',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = group.color;
                          e.currentTarget.style.color = 'var(--text)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'var(--border)';
                          e.currentTarget.style.color = 'var(--muted)';
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map(m => (
          <div key={m.id} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '80%', padding: '12px 16px', borderRadius: 16,
            background: m.role === 'user' ? 'var(--accent)' : 'var(--card)',
            border: m.role === 'assistant' ? '1px solid var(--border)' : 'none',
            color: m.role === 'user' ? 'white' : 'var(--text)',
            whiteSpace: 'pre-wrap', lineHeight: 1.6,
          }}>
            {m.role === 'assistant' && onNavigateToLead
              ? renderContent(m.content, leads, onNavigateToLead)
              : m.content}
          </div>
        ))}

        {sending && (
          <div style={{ alignSelf: 'flex-start', color: 'var(--muted)', fontStyle: 'italic', fontSize: 13 }}>
            {copilotName} is thinking…
          </div>
        )}
      </div>

      {/* ── Suggestions bar (active conversation) ── */}
      {hasMessages && (
        <div style={{ paddingTop: 8 }}>
          <button
            onClick={() => setSuggestOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--muted)', fontSize: 12, fontWeight: 600,
              padding: '2px 4px', marginBottom: suggestOpen ? 8 : 0,
            }}
          >
            <Icon name="spark" size={13} />
            Suggestions
            <span style={{ fontSize: 10 }}>{suggestOpen ? '▲' : '▼'}</span>
          </button>

          {suggestOpen && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {PROMPT_GROUPS.flatMap(g => g.prompts).map(p => (
                <button
                  key={p.label}
                  onClick={() => send(p.text)}
                  style={{
                    padding: '5px 11px', borderRadius: 999,
                    border: '1px solid var(--border)',
                    background: 'var(--card)', cursor: 'pointer',
                    fontSize: 12, color: 'var(--text)', fontFamily: 'inherit',
                    transition: 'border-color .12s, background .12s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.background = 'var(--accent)10';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.background = 'var(--card)';
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Input row ── */}
      <div data-tour="chat-input" style={{ display: 'flex', gap: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
        <div style={{ flex: 1 }}>
          <VoiceField
            value={draft}
            onChange={setDraft}
            placeholder={`Ask ${copilotName}… or tap 🎤 to speak`}
            summarize
            autoGrow
            onEnter={() => send()}
          />
        </div>
        <button className="btn" onClick={() => send()} disabled={!draft.trim() || sending}>
          <Icon name="send" />
        </button>
      </div>
    </div>
  );
}
