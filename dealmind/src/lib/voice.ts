'use client';

type SpeechRecognitionEventLike = {
  results: ArrayLike<ArrayLike<{ transcript: string; isFinal?: boolean }>>;
};

type ResultListener = (transcript: string) => void;
type EndListener   = (finalTranscript: string) => void;
type ErrorListener = (message: string) => void;

export interface VoiceSession {
  start(): void;
  stop(): void;
  supported: boolean;
}

export function createVoiceSession(
  onResult: ResultListener,
  onEnd?:   EndListener,
  onError?: ErrorListener,
): VoiceSession {
  if (typeof window === 'undefined') {
    return { start() {}, stop() {}, supported: false };
  }

  const SR: any =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  if (!SR) {
    return { start() {}, stop() {}, supported: false };
  }

  const recog = new SR();
  recog.continuous     = true;
  recog.interimResults = true;
  recog.lang           = 'en-US';

  let accumulated = '';
  let isActive    = false; // true while user wants to be recording

  recog.onresult = (e: SpeechRecognitionEventLike) => {
    let transcript = '';
    for (let i = 0; i < e.results.length; i++) {
      transcript += e.results[i][0].transcript;
    }
    accumulated = transcript;
    onResult(transcript);
  };

  recog.onerror = (e: any) => {
    const code: string = e?.error || 'unknown';

    // Transient errors — restart silently if we're still supposed to be listening
    if (code === 'network' || code === 'aborted' || code === 'no-speech') {
      if (isActive) {
        setTimeout(() => { try { recog.start(); } catch {} }, 150);
      }
      return; // don't surface these to the user
    }

    // Fatal errors — stop and report
    isActive = false;
    const messages: Record<string, string> = {
      'not-allowed':   'Mic access denied — check browser permissions',
      'audio-capture': 'No microphone found',
    };
    const msg = messages[code] ?? `Voice error: ${code}`;
    if (msg) onError?.(msg);
    onEnd?.(accumulated);
  };

  recog.onend = () => {
    // Chrome auto-stops after silence even with continuous=true — restart if still active
    if (isActive) {
      setTimeout(() => { try { recog.start(); } catch {} }, 150);
      return;
    }
    // User stopped — deliver final transcript
    onEnd?.(accumulated);
  };

  return {
    supported: true,
    start: () => { accumulated = ''; isActive = true; recog.start(); },
    stop:  () => { isActive = false; recog.stop(); },
  };
}
