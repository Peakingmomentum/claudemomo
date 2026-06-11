import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// Supabase OAuth provider redirects here with ?code=...
// We exchange for a session, then route the user based on their state.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const redirectTo = url.searchParams.get('redirect');

  const supabase = createSupabaseServerClient();

  const skip = process.env.SKIP_SUBSCRIPTION_CHECK === 'true';

  // ── Helper: attribute referral if pp_ref cookie is set ──────────────────────
  async function attributeReferral(userId: string) {
    try {
      const cookieStore = cookies();
      const refCookie = cookieStore.get('pp_ref');
      if (!refCookie?.value) return;
      await fetch(new URL('/api/affiliate', req.url).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': req.headers.get('cookie') || '' },
        body: JSON.stringify({ referralCode: refCookie.value }),
      });
    } catch {
      // non-blocking
    }
  }

  // ── Helper: determine next route based on profile ────────────────────────────
  function nextRoute(profile: { subscription_status?: string; onboarding_complete?: boolean; user_role?: string | null } | null) {
    if (!profile) return '/onboarding';
    const active = profile.subscription_status === 'active';
    const done   = profile.onboarding_complete === true;
    const hasRole = !!profile.user_role;
    if (active && done && hasRole) return '/dashboard';
    if (active && done && !hasRole) return '/role-picker';
    if (done) return '/checkout';
    return '/onboarding';
  }

  // Password login sets session via cookie directly — no code needed, just route the user
  if (!code) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.redirect(new URL('/', req.url));
    if (skip) return NextResponse.redirect(new URL('/dashboard', req.url));
    const { data: profile } = await supabase
      .from('users').select('subscription_status, onboarding_complete, user_role')
      .eq('id', user.id).maybeSingle();
    return NextResponse.redirect(new URL(nextRoute(profile), req.url));
  }

  await supabase.auth.exchangeCodeForSession(code);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/', req.url));

  // Attribute referral for new signups (non-blocking)
  attributeReferral(user.id);

  // Only allow same-origin redirects — reject absolute URLs to prevent open redirect
  if (redirectTo) {
    const safe = redirectTo.startsWith('/') ? redirectTo : '/dashboard';
    return NextResponse.redirect(new URL(safe, req.url));
  }
  if (skip) return NextResponse.redirect(new URL('/dashboard', req.url));

  const { data: profile } = await supabase
    .from('users')
    .select('subscription_status, onboarding_complete, user_role')
    .eq('id', user.id)
    .maybeSingle();

  return NextResponse.redirect(new URL(nextRoute(profile), req.url));
}
