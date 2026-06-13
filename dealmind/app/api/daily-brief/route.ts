import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { buildDailyBriefSplit } from '@/lib/claude';
import { fetchYesterdayWins } from '@/lib/wins';
import { fetchGhlBriefContext, type GhlBriefContext } from '@/lib/ghl';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const [{ data: profile }, { data: leads }, { data: calendar }, { data: tasks }] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('leads').select('*').eq('user_id', user.id).eq('is_dead', false),
    supabase.from('calendar_events').select('*').eq('user_id', user.id)
      .gte('event_date', new Date().toISOString())
      .lte('event_date', new Date(Date.now() + 86400000).toISOString())
      .order('event_date'),
    // All still-open tasks (incl. overdue) so the brief reflects real workload.
    supabase.from('calendar_events').select('*').eq('user_id', user.id)
      .eq('event_type', 'task').is('completed_at', null).order('event_date'),
  ]);

  if (!profile) return NextResponse.json({ error: 'no profile' }, { status: 400 });

  // Bust cache when ?refresh=1
  const forceRefresh = new URL(req.url).searchParams.has('refresh');
  const today = new Date().toISOString().split('T')[0];

  // The day cache holds ONLY the LLM narrative (greeting/focus/insight/prospecting).
  // Deterministic sections (priority leads, tasks, appointments, GHL inbox) are
  // always recomputed live below so they stay current through the day.
  let cachedNarrative = null;
  if (!forceRefresh && profile.daily_brief_date === today && profile.daily_brief_cache) {
    try { cachedNarrative = JSON.parse(profile.daily_brief_cache); } catch { /* regenerate */ }
  }

  // Pull GHL CRM activity (replies, appointments) when connected — best effort.
  let ghlContext: GhlBriefContext | null = null;
  if (profile.ghl_connected && profile.ghl_api_key && profile.ghl_location_id) {
    try {
      ghlContext = await fetchGhlBriefContext({
        apiKey: profile.ghl_api_key,
        locationId: profile.ghl_location_id,
      });
    } catch { /* brief still works without GHL */ }
  }

  try {
    const wins = await fetchYesterdayWins(supabase, user.id);
    const brief = await buildDailyBriefSplit(
      profile as any,
      (leads || []) as any,
      (calendar || []) as any,
      ghlContext,
      (tasks || []) as any,
      cachedNarrative,
      wins
    );

    // Persist just the narrative for the rest of today if we generated it fresh.
    if (!cachedNarrative) {
      const narrative = {
        greeting: brief.greeting, focus: brief.focus,
        insight: brief.insight, prospecting: brief.prospecting,
      };
      await supabase.from('users').update({
        daily_brief_cache: JSON.stringify(narrative),
        daily_brief_date: today,
      }).eq('id', user.id);
    }

    return NextResponse.json({ brief });
  } catch (err) {
    console.error('[daily-brief] generation failed:', err);
    return NextResponse.json(
      { error: 'Failed to generate brief. Check API key and try refreshing.' },
      { status: 500 }
    );
  }
}
