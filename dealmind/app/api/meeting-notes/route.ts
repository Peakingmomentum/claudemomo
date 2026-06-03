// Inbound webhook for AI note-taking apps (Granola, Otter.ai, Fireflies.ai, etc.)
// POST /api/meeting-notes
// Body: { token: string, lead_name: string, summary: string, source?: string }
//
// How to set up:
//   1. The user's Pocket Pilot token = their Supabase user ID (visible in Settings)
//   2. Configure your AI note-taker to POST to this endpoint after each meeting
//   3. Include the lead name so we can match it to the pipeline

import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();

  let body: { token?: string; lead_name?: string; summary?: string; source?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const { token, lead_name, summary, source = 'meeting' } = body;
  if (!token || !lead_name || !summary) {
    return NextResponse.json({ error: 'token, lead_name, and summary are required' }, { status: 400 });
  }

  // Token is the user's ID — verify they exist
  const { data: profile } = await supabase
    .from('users').select('id').eq('id', token).single();
  if (!profile) return NextResponse.json({ error: 'invalid token' }, { status: 401 });

  // Find lead by name (fuzzy)
  const { data: leads } = await supabase
    .from('leads')
    .select('id, name, notes')
    .eq('user_id', token)
    .eq('is_dead', false);

  const lead = leads?.find(l =>
    l.name.toLowerCase().includes(lead_name.toLowerCase()) ||
    lead_name.toLowerCase().includes(l.name.toLowerCase())
  );

  if (!lead) {
    return NextResponse.json({ error: `No active lead matching "${lead_name}"` }, { status: 404 });
  }

  // Append as a timestamped note
  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  const noteEntry = `[${date}] ${source.charAt(0).toUpperCase() + source.slice(1)} notes: ${summary.slice(0, 800)}${summary.length > 800 ? '…' : ''}`;
  const updatedNotes = lead.notes ? `${lead.notes}\n${noteEntry}` : noteEntry;

  await supabase.from('leads').update({ notes: updatedNotes }).eq('id', lead.id);

  return NextResponse.json({ ok: true, lead_id: lead.id, lead_name: lead.name });
}
