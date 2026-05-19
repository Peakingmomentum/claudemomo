import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// Supabase OAuth provider redirects here with ?code=...
// We exchange for a session, then route the user based on their state.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const redirectTo = url.searchParams.get('redirect');

  if (!code) return NextResponse.redirect(new URL('/', req.url));

  const supabase = createSupabaseServerClient();
  await supabase.auth.exchangeCodeForSession(code);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/', req.url));

  const { data: profile } = await supabase
    .from('users')
    .select('subscription_status, onboarding_complete')
    .eq('id', user.id)
    .maybeSingle();

  if (redirectTo) {
    return NextResponse.redirect(new URL(redirectTo, req.url));
  }

  if (profile?.subscription_status === 'active' && profile.onboarding_complete) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  if (profile?.onboarding_complete) {
    return NextResponse.redirect(new URL('/checkout', req.url));
  }
  return NextResponse.redirect(new URL('/onboarding', req.url));
}
