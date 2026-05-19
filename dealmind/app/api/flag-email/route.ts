import { NextResponse, type NextRequest } from 'next/server';
import { flagInternal } from '@/lib/flags';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { FlagType } from '@/types';

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { type, context } = await req.json() as { type: FlagType; context?: Record<string, unknown> };

  const { data: profile } = await supabase
    .from('users')
    .select('id, email, user_name, role, city, stage, lead_count, crm')
    .eq('id', authUser.id)
    .single();

  if (!profile) return NextResponse.json({ error: 'no profile' }, { status: 400 });

  await flagInternal({ type, user: profile as any, context });
  return NextResponse.json({ ok: true });
}
