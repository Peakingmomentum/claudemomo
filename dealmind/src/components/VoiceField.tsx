'use client';

import { useEffect, useRef, useState } from 'react';
import { createAudioRecorder, type AudioRecorder } from '@/lib/voice';
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
  const [listening,  setListening]  = useState(false); // recording in progress
  const [condensing, setCondensing] = useState(false); // transcribing / summarizing
  const [micError,   setMicError]   = useState('');
  const recorderRef  = useRef<AudioRecorder | null>(null);
  const baseRef      = useRef('');
  const onChangeRef  = useRef(onChange);
  const summarizeRef = useRef(summarize);
  useEffect(() => { onChangeRef.current  = onChange;  }, [onChange]);
  useEffect(() => { summarizeRef.current = summarize; }, [summarize]);

  useEffect(() => {
    const recorder = createAudioRecorder({
      onError: (msg) => {
        setListening(false);
        setCondensing(false);
        setMicError(msg);
      },
      // Recording stopped — transcribe the audio server-side, then optionally summarize.
      onStop: async (audio) => {
        setListening(false);
        setCondensing(true);
        try {
          const ext = audio.type.includes('mp4') ? 'm4a' : audio.type.includes('webm') ? 'webm' : 'm4a';
          const fd = new FormData();
          fd.append('audio', audio, `voice.${ext}`);

          const res  = await fetch('/api/transcribe', { method: 'POST', body: fd });
          const data = await res.json() as { transcript?: string; error?: string };
          const text = (data.transcript || '').trim();
          if (!text) {
            setMicError(data.error || 'No speech detected — try again');
            return;
          }

          let combined = (baseRef.current + text).trim();
          if (summarizeRef.current && combined.length >= 120) {
            try {
              const sres = await fetch('/api/voice-summarize', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ transcript: combined }),
              });
              const sdata = await sres.json() as { summary?: string };
              combined = sdata.summary || combined;
            } catch { /* keep raw transcript on summarize failure */ }
          }
          onChangeRef.current(combined);
        } catch {
          setMicError('Transcription failed — try again');
        } finally {
          setCondensing(false);
        }
      },
    });

    recorderRef.current = recorder;
    setSupported(recorder.supported);
  }, []); // runs once after mount

  const toggle = async () => {
    if (!supported || condensing) return;
    setMicError('');
    if (listening) {
      recorderRef.current!.stop(); // onStop handles transcription + setListening(false)
    } else {
      baseRef.current = value ? value + ' ' : '';
      const started = await recorderRef.current!.start();
      if (started) setListening(true); // onError already surfaced if it failed
    }
  };

  const Tag = multiline ? 'textarea' : 'input';
  const micBg    = listening ? 'var(--danger)' : condensing ? '#f59e0b' : 'var(--surface)';
  const micTitle = listening ? 'Stop recording' : condensing ? 'Transcribing…' : 'Start voice input';

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <Tag
        value={value}
        onChange={e => onChange((e.target as HTMLInputElement).value)}
        placeholder={condensing ? 'Transcribing…' : placeholder}
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
          Recording…
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
