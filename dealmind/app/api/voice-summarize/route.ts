import { NextResponse, type NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { checkRateLimit, rateLimitResponse, LIMITS } from '@/lib/ratelimit';

export const runtime = 'nodejs';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: NextRequest) {
  // Require auth — this calls Anthropic, so it must not be an open cost vector.
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  // Rate-limit per user to cap abuse/cost.
  const allowed = await checkRateLimit(`voice:${user.id}`, LIMITS.voice);
  if (!allowed) return rateLimitResponse(LIMITS.voice);

  const { transcript } = await req.json() as { transcript: string };
  if (!transcript?.trim()) return NextResponse.json({ error: 'empty transcript' }, { status: 400 });

  // Don't summarize short inputs — just return as-is
  if (transcript.trim().length < 120) {
    return NextResponse.json({ summary: transcript.trim() });
  }

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `You are a transcription assistant for a real estate professional. Condense this voice note into a clean, concise message that captures all the key details (names, addresses, numbers, action items). Remove filler words and repetition. Keep it in first-person. Under 3 sentences unless details require more.\n\nVoice note:\n${transcript}`
    }]
  });

  const summary = response.content[0]?.type === 'text' ? response.content[0].text.trim() : transcript;
  return NextResponse.json({ summary });
}
