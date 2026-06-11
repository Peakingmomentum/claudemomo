import { NextResponse, type NextRequest } from 'next/server';
import { checkRateLimit, getClientIp, rateLimitResponse, LIMITS } from '@/lib/ratelimit';

export const runtime = 'nodejs';

// Transcribe an uploaded audio clip with OpenAI Whisper.
// Used by the in-app mic so voice input works on iPad/iOS, where the browser
// Web Speech API is unreliable. Audio is recorded client-side (MediaRecorder)
// and posted here as multipart/form-data under the "audio" field.
export async function POST(req: NextRequest) {
  // Unauthenticated endpoint — limit by client IP to cap abuse/cost.
  const allowed = await checkRateLimit(`transcribe:${getClientIp(req)}`, LIMITS.voice);
  if (!allowed) return rateLimitResponse(LIMITS.voice);

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: 'Transcription is not configured.' }, { status: 503 });
  }

  let file: Blob | null = null;
  try {
    const form = await req.formData();
    const f = form.get('audio');
    if (f instanceof Blob) file = f;
  } catch {
    return NextResponse.json({ error: 'Invalid upload.' }, { status: 400 });
  }
  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'No audio received.' }, { status: 400 });
  }
  // Guard cost/latency — cap at ~25MB (Whisper's limit).
  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: 'Recording too long.' }, { status: 413 });
  }

  const name = (file as any).name || 'audio.webm';
  const oaForm = new FormData();
  oaForm.append('file', file, name);
  oaForm.append('model', 'whisper-1');
  oaForm.append('language', 'en');

  try {
    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      body: oaForm,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('Whisper error', res.status, detail.slice(0, 300));
      return NextResponse.json({ error: 'Transcription failed.' }, { status: 502 });
    }
    const data = await res.json() as { text?: string };
    return NextResponse.json({ transcript: (data.text || '').trim() });
  } catch (e) {
    console.error('Whisper request failed', e);
    return NextResponse.json({ error: 'Transcription failed.' }, { status: 502 });
  }
}
