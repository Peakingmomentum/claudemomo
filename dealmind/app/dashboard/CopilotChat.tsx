'use client';

import { useState, useRef, useEffect } from 'react';
import { Icon } from '@/components/Icon';
import { AIAvatar } from '@/components/AIAvatar';
import { VoiceField } from '@/components/VoiceField';
import type { ChatMessage, DealMindUser } from '@/types';

interface Props {
  profile: DealMindUser;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export function CopilotChat({ profile, messages, setMessages }: Props) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

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
      context: 'chat'
    };
    setMessages(m => [...m, optimistic]);

    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, context: 'chat' })
      });
      const data = await res.json() as { reply?: string; error?: string };
      const reply: ChatMessage = {
        id: 'reply-' + Date.now(),
        user_id: profile.id,
        created_at: new Date().toISOString(),
        role: 'assistant',
        content: data.reply || (data.error ? `Error: ${data.error}` : 'No reply'),
        context: 'chat'
      };
      setMessages(m => [...m, reply]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)' }}>
      <div ref={scrollerRef} style={{
        flex: 1, overflowY: 'auto', padding: 8,
        display: 'flex', flexDirection: 'column', gap: 16
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', marginTop: 60 }}>
            <AIAvatar name={profile.copilot_name || 'Copilot'} active size={80} />
            <p style={{ marginTop: 16 }}>
              Ask anything. {profile.copilot_name || 'Your Copilot'} knows your business.
            </p>
          </div>
        )}
        {messages.map(m => (
          <div key={m.id} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '80%',
            padding: '12px 16px',
            borderRadius: 16,
            background: m.role === 'user' ? 'var(--accent)' : 'var(--card)',
            border: m.role === 'assistant' ? '1px solid var(--border)' : 'none',
            color: m.role === 'user' ? 'white' : 'var(--text)',
            whiteSpace: 'pre-wrap'
          }}>
            {m.content}
          </div>
        ))}
        {sending && (
          <div style={{ alignSelf: 'flex-start', color: 'var(--muted)', fontStyle: 'italic' }}>
            {profile.copilot_name || 'Copilot'} is thinking…
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <div style={{ flex: 1 }}>
          <VoiceField
            value={draft}
            onChange={setDraft}
            placeholder={`Ask ${profile.copilot_name || 'Copilot'}…`}
          />
        </div>
        <button className="btn" onClick={send} disabled={!draft.trim() || sending}>
          <Icon name="send" />
        </button>
      </div>
    </div>
  );
}
