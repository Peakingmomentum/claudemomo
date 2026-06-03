import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { enrichLeadWithHaiku } from '@/lib/claude';
import { checkRateLimit, rateLimitResponse, LIMITS } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const allowed = await checkRateLimit(`enrich:${user.id}`, LIMITS.enrich);
  if (!allowed) return rateLimitResponse(LIMITS.enrich);

  const { lead_id } = await req.json();
  if (!lead_id) return NextResponse.json({ error: 'lead_id required' }, { status: 400 });

  // Fetch lead — verify ownership
  const { data: lead, error: fetchErr } = await supabase
    .from('leads').select('*').eq('id', lead_id).eq('user_id', user.id).single();
  if (fetchErr || !lead) return NextResponse.json({ error: 'lead not found' }, { status: 404 });

  // Skip if already enriched in last 24h
  if (lead.ai_enrichment?.enriched_at) {
    const age = Date.now() - new Date(lead.ai_enrichment.enriched_at).getTime();
    if (age < 86400000) return NextResponse.json({ enrichment: lead.ai_enrichment, cached: true });
  }

  const enrichment = await enrichLeadWithHaiku({
    name:       lead.name,
    property:   lead.property,
    notes:      lead.notes,
    stage:      lead.stage,
    motivation: lead.motivation,
    phone:      lead.phone,
  });

  await supabase.from('leads').update({ ai_enrichment: enrichment }).eq('id', lead_id);

  return NextResponse.json({ enrichment, cached: false });
}
