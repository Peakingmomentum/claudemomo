'use client';

import { useEffect, useRef, useState } from 'react';
import { createVoiceSession } from '@/lib/voice';
import { Icon } from './Icon';

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  multiline?: boolean;
  summarize?: boolean;
}

export function VoiceField({ value, onChange, placeholder, multiline, summarize }: Props) {
  const [supported,  setSupported]  = useState(false); // drives mic button visibility
  const [listening,  setListening]  = useState(false);
  const [condensing, setCondensing] = useState(false);
  const [micError,   setMicError]   = useState('');
  const sessionRef   = useRef<ReturnType<typeof createVoiceSession> | null>(null);
  const baseRef      = useRef('');
  const onChangeRef  = useRef(onChange);
  const summarizeRef = useRef(summarize);
  useEffect(() => { onChangeRef.current  = onChange;  }, [onChange]);
  useEffect(() => { summarizeRef.current = summarize; }, [summarize]);

  useEffect(() => {
    const session = createVoiceSession(
      // live interim update
      (transcript) => {
        setMicError('');
        onChangeRef.current(baseRef.current + transcript);
      },
      // onEnd — receives final transcript from voice.ts
      async (finalTranscript) => {
        setListening(false);
        const raw = (baseRef.current + finalTranscript).trim();

        if (!summarizeRef.current || raw.length < 120) {
          onChangeRef.current(raw);
          return;
        }

        setCondensing(true);
        try {
          const res  = await fetch('/api/voice-summarize', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ transcript: raw }),
          });
          const data = await res.json() as { summary?: string };
          onChangeRef.current(data.summary || raw);
        } catch {
          onChangeRef.current(raw);
        } finally {
          setCondensing(false);
        }
      },
      // onError — mic denied or hardware error
      (errMsg) => {
        setListening(false);
        setMicError(errMsg);
      }
    );

    sessionRef.current = session;
    // Set supported state so the mic button actually renders
    setSupported(session.supported);
  }, []); // runs once after mount

  const toggle = () => {
    if (!supported || condensing) return;
    setMicError('');
    if (listening) {
      sessionRef.current!.stop();
      // onEnd handles setListening(false)
    } else {
      baseRef.current = value ? value + ' ' : '';
      sessionRef.current!.start();
      setListening(true);
    }
  };

  const Tag = multiline ? 'textarea' : 'input';
  const micBg    = listening ? 'var(--danger)' : condensing ? '#f59e0b' : 'var(--surface)';
  const micTitle = listening ? 'Stop recording' : condensing ? 'Summarizing…' : 'Start voice input';

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <Tag
        value={value}
        onChange={e => onChange((e.target as HTMLInputElement).value)}
        placeholder={condensing ? 'Summarizing…' : placeholder}
        disabled={condensing}
        style={{
          width: '100%',
          paddingRight: supported ? 48 : undefined,
          minHeight: multiline ? 96 : undefined,
          opacity: condensing ? 0.6 : 1,
        }}
      />

      {supported && (
        <button
          type="button"
          onClick={toggle}
          disabled={condensing}
          aria-label={micTitle}
          title={micTitle}
          style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            background: micBg,
            border: '1px solid var(--border)',
            borderRadius: 8, padding: 6,
            color: listening ? 'white' : 'var(--text)',
            transition: 'background .2s',
            cursor: condensing ? 'wait' : 'pointer',
            lineHeight: 0,
          }}
        >
          {condensing
            ? <span style={{ fontSize: 11, padding: '0 2px', lineHeight: 1 }}>…</span>
            : <Icon name="mic" size={16} />
          }
        </button>
      )}

      {listening && (
        <div style={{
          position: 'absolute', bottom: -20, right: 8,
          fontSize: 11, color: 'var(--danger)',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--danger)',
            display: 'inline-block',
            animation: 'pulse 1s infinite',
          }} />
          Listening…
        </div>
      )}

      {micError && (
        <div style={{
          position: 'absolute', bottom: -20, right: 8,
          fontSize: 11, color: '#dc2626',
        }}>
          {micError}
        </div>
      )}
    </div>
  );
}
