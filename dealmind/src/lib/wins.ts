// Yesterday's hard-signal wins — tasks completed and appointments that happened
// yesterday. Used by the daily brief (recap display) and the copilot (morning
// check-in context). Deliberately limited to facts we can know reliably.

export interface YesterdayWins {
  completedTasks: string[];
  appointments: string[];
  stageMoves: string[];
}

export async function fetchYesterdayWins(supabase: any, userId: string): Promise<YesterdayWins> {
  const startToday = new Date();
  startToday.setHours(0, 0, 0, 0);
  const startYesterday = new Date(startToday.getTime() - 86400000);

  const [{ data: tasks }, { data: events }, { data: moves }] = await Promise.all([
    // Tasks checked off yesterday.
    supabase.from('calendar_events').select('title')
      .eq('user_id', userId).eq('event_type', 'task')
      .gte('completed_at', startYesterday.toISOString())
      .lt('completed_at', startToday.toISOString()),
    // Appointments/events that fell on yesterday.
    supabase.from('calendar_events').select('title, event_type')
      .eq('user_id', userId)
      .gte('event_date', startYesterday.toISOString())
      .lt('event_date', startToday.toISOString()),
    // Lead stage changes yesterday (progress signal).
    supabase.from('lead_stage_changes').select('to_stage, leads(name)')
      .eq('user_id', userId)
      .gte('changed_at', startYesterday.toISOString())
      .lt('changed_at', startToday.toISOString())
      .order('changed_at'),
  ]);

  return {
    completedTasks: (tasks || []).map((t: any) => t.title).filter(Boolean),
    appointments: (events || [])
      .filter((e: any) => e.event_type !== 'task')
      .map((e: any) => e.title).filter(Boolean),
    stageMoves: (moves || []).slice(0, 10)
      .map((m: any) => `${(Array.isArray(m.leads) ? m.leads[0]?.name : m.leads?.name) || 'A lead'} → ${m.to_stage}`),
  };
}
