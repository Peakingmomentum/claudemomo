import { NextResponse, type NextRequest } from 'next/server';
import { buildSystemPrompt, callClaude } from '@/lib/claude';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { message, context } = await req.json() as { message: string; context?: string };
  if (!message?.trim()) {
    return NextResponse.json({ error: 'empty message' }, { status: 400 });
  }

  const [{ data: profile }, { data: leads }, { data: calendar }, { data: history }] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('leads').select('*').eq('user_id', user.id).eq('is_dead', false),
    supabase.from('calendar_events').select('*').eq('user_id', user.id).gte('event_date', new Date().toISOString()).order('event_date'),
    supabase.from('chat_messages').select('role, content').eq('user_id', user.id).order('created_at', { ascending: true }).limit(20)
  ]);

  if (!profile) return NextResponse.json({ error: 'no profile' }, { status: 400 });

  const systemPrompt = buildSystemPrompt(profile as any, (leads || []) as any, (calendar || []) as any);

  const messages = [
    ...(history || []).map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
    { role: 'user' as const, content: message }
  ];

  const reply = await callClaude(systemPrompt, messages);

  await supabase.from('chat_messages').insert([
    { user_id: user.id, role: 'user',      content: message, context: context || null },
    { user_id: user.id, role: 'assistant', content: reply,   context: context || null }
  ]);

  return NextResponse.json({ reply });
}
