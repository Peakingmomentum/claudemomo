import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// Supabase OAuth provider redirects here with ?code=...
// We exchange for a session, then route the user based on their state.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const redirectTo = url.searchParams.get('redirect');

  const supabase = createSupabaseServerClient();

  const skip = process.env.SKIP_SUBSCRIPTION_CHECK === 'true';

  // Password login sets session via cookie directly — no code needed, just route the user
  if (!code) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.redirect(new URL('/', req.url));
    if (skip) return NextResponse.redirect(new URL('/dashboard', req.url));
    const { data: profile } = await supabase
      .from('users').select('subscription_status, onboarding_complete')
      .eq('id', user.id).maybeSingle();
    if (profile?.subscription_status === 'active' && profile.onboarding_complete)
      return NextResponse.redirect(new URL('/dashboard', req.url));
    if (profile?.onboarding_complete)
      return NextResponse.redirect(new URL('/checkout', req.url));
    return NextResponse.redirect(new URL('/onboarding', req.url));
  }

  await supabase.auth.exchangeCodeForSession(code);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/', req.url));

  // Only allow same-origin redirects — reject absolute URLs to prevent open redirect
  if (redirectTo) {
    const safe = redirectTo.startsWith('/') ? redirectTo : '/dashboard';
    return NextResponse.redirect(new URL(safe, req.url));
  }
  if (skip) return NextResponse.redirect(new URL('/dashboard', req.url));

  const { data: profile } = await supabase
    .from('users')
    .select('subscription_status, onboarding_complete')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.subscription_status === 'active' && profile.onboarding_complete) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  if (profile?.onboarding_complete) {
    return NextResponse.redirect(new URL('/checkout', req.url));
  }
  return NextResponse.redirect(new URL('/onboarding', req.url));
}
