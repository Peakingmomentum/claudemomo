'use client';

// Audio recorder built on MediaRecorder + getUserMedia. Unlike the browser
// Web Speech API (which is unreliable on iPadOS/iOS Safari), this records a
// short clip and hands it back as a Blob to be transcribed server-side.
export interface AudioRecorder {
  supported: boolean;
  start(): Promise<boolean>; // resolves true once recording actually begins
  stop(): void;              // triggers onStop with the recorded audio
}

interface Handlers {
  onStop:  (audio: Blob) => void;
  onError: (message: string) => void;
}

function pickMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  // iOS Safari → mp4/aac; Chrome/Firefox → webm. Whisper accepts both.
  if (MediaRecorder.isTypeSupported('audio/mp4'))  return 'audio/mp4';
  if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm';
  return '';
}

export function createAudioRecorder(handlers: Handlers): AudioRecorder {
  const unsupported =
    typeof window === 'undefined' ||
    !navigator?.mediaDevices?.getUserMedia ||
    typeof MediaRecorder === 'undefined';

  if (unsupported) {
    return { supported: false, async start() { return false; }, stop() {} };
  }

  let recorder: MediaRecorder | null = null;
  let stream: MediaStream | null = null;
  let chunks: BlobPart[] = [];

  return {
    supported: true,

    async start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e: any) {
        const name = e?.name || '';
        handlers.onError(
          name === 'NotAllowedError' || name === 'SecurityError'
            ? 'Mic blocked — allow microphone access for this site'
            : name === 'NotFoundError'
              ? 'No microphone found'
              : 'Could not start microphone'
        );
        return false;
      }

      chunks = [];
      const mimeType = pickMimeType();
      try {
        recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      } catch {
        recorder = new MediaRecorder(stream);
      }

      recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        stream?.getTracks().forEach(t => t.stop());
        stream = null;
        const type = recorder?.mimeType || mimeType || 'audio/webm';
        handlers.onStop(new Blob(chunks, { type }));
      };

      recorder.start();
      return true;
    },

    stop() {
      try { recorder?.stop(); } catch { /* already stopped */ }
    },
  };
}
