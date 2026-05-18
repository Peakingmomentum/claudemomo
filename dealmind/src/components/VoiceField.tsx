'use client';

import { useEffect, useRef, useState } from 'react';
import { createVoiceSession } from '@/lib/voice';
import { Icon } from './Icon';

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  multiline?: boolean;
}

export function VoiceField({ value, onChange, placeholder, multiline }: Props) {
  const [listening, setListening] = useState(false);
  const sessionRef = useRef<ReturnType<typeof createVoiceSession> | null>(null);
  const baseRef = useRef('');

  useEffect(() => {
    sessionRef.current = createVoiceSession(
      (transcript) => onChange(baseRef.current + transcript),
      () => setListening(false)
    );
  }, [onChange]);

  const toggle = () => {
    if (!sessionRef.current?.supported) return;
    if (listening) {
      sessionRef.current.stop();
      setListening(false);
    } else {
      baseRef.current = value ? value + ' ' : '';
      sessionRef.current.start();
      setListening(true);
    }
  };

  const Tag = multiline ? 'textarea' : 'input';

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <Tag
        value={value}
        onChange={e => onChange((e.target as HTMLInputElement).value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          paddingRight: 48,
          minHeight: multiline ? 96 : undefined
        }}
      />
      {sessionRef.current?.supported && (
        <button
          type="button"
          onClick={toggle}
          aria-label={listening ? 'Stop voice input' : 'Start voice input'}
          style={{
            position: 'absolute', right: 8, top: 8,
            background: listening ? 'var(--danger)' : 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8, padding: 6, color: 'white'
          }}
        >
          <Icon name="mic" size={16} />
        </button>
      )}
    </div>
  );
}
