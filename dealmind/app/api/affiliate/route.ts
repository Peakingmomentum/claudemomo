import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// GET /api/affiliate — return affiliate stats for the current user
export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  // Fetch user's referral code
  const { data: profile } = await supabase
    .from('users')
    .select('referral_code, user_name')
    .eq('id', user.id)
    .single();

  if (!profile) return NextResponse.json({ error: 'no profile' }, { status: 400 });

  // If no code yet, generate one
  let referralCode = profile.referral_code;
  if (!referralCode) {
    // Generate from name/email
    const base = (profile.user_name || user.email || 'USER')
      .replace(/[^A-Za-z0-9]/g, '')
      .toUpperCase()
      .slice(0, 12);
    referralCode = base || 'USER' + Math.random().toString(36).slice(2, 6).toUpperCase();
    await supabase.from('users').update({ referral_code: referralCode }).eq('id', user.id);
  }

  // Fetch referral stats
  const { data: referrals } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', user.id)
    .order('signup_date', { ascending: false });

  const total  = (referrals || []).length;
  const active = (referrals || []).filter(r => r.status === 'active').length;
  const paid   = (referrals || []).filter(r => r.status === 'paid');
  const totalEarnings = paid.reduce((sum: number, r: any) => sum + (r.payout_amount || 0), 0);

  return NextResponse.json({
    referralCode,
    referrals: referrals || [],
    stats: { total, active, totalEarnings, commissionPct: 30 },
  });
}

// POST /api/affiliate/attribute — attribute a signup to a referrer
// Called from auth callback if pp_ref cookie is present
export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { referralCode } = await req.json() as { referralCode: string };
  if (!referralCode) return NextResponse.json({ error: 'no code' }, { status: 400 });

  // Look up referrer
  const { data: referrer } = await supabase
    .from('users')
    .select('id')
    .eq('referral_code', referralCode.toUpperCase())
    .maybeSingle();

  if (!referrer || referrer.id === user.id) {
    return NextResponse.json({ ok: false, reason: 'invalid or self-referral' });
  }

  // Check if already attributed
  const { data: existing } = await supabase
    .from('referrals')
    .select('id')
    .eq('referred_user_id', user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: false, reason: 'already attributed' });
  }

  // Insert referral record
  await supabase.from('referrals').insert({
    referrer_id:      referrer.id,
    referred_user_id: user.id,
    referral_code:    referralCode.toUpperCase(),
    status:           'pending',
    commission_pct:   30,
  });

  // Tag the referred user
  await supabase.from('users').update({ referred_by: referrer.id }).eq('id', user.id);

  return NextResponse.json({ ok: true });
}
