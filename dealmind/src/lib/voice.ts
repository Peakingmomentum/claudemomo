'use client';

type SpeechRecognitionEventLike = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type Listener = (transcript: string) => void;

export interface VoiceSession {
  start(): void;
  stop(): void;
  supported: boolean;
}

export function createVoiceSession(onResult: Listener, onEnd?: () => void): VoiceSession {
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
  recog.continuous = true;
  recog.interimResults = true;
  recog.lang = 'en-US';

  recog.onresult = (e: SpeechRecognitionEventLike) => {
    let transcript = '';
    for (let i = 0; i < e.results.length; i++) {
      transcript += e.results[i][0].transcript;
    }
    onResult(transcript);
  };

  recog.onend = () => { onEnd?.(); };

  return {
    supported: true,
    start: () => recog.start(),
    stop:  () => recog.stop()
  };
}
