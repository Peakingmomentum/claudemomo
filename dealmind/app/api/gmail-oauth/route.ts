import { NextResponse, type NextRequest } from 'next/server';
import { createOAuth2Client, getGoogleAuthUrl } from '@/lib/google';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/gmail-oauth          → kicks off the OAuth flow (redirect to Google)
// GET /api/gmail-oauth?code=...  → handles the callback
export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  // surface a failure on the dashboard instead of dying silently
  const fail = (detail: string) => {
    console.error('[gmail-oauth] failed:', detail);
    const to = new URL('/dashboard', req.url);
    to.searchParams.set('error', 'google_oauth');
    to.searchParams.set('detail', detail);
    return NextResponse.redirect(to);
  };

  // Google itself can bounce back an error (access_denied, etc.)
  const googleError = url.searchParams.get('error');
  if (googleError) return fail(`google:${googleError}`);

  const code = url.searchParams.get('code');
  const stateParam = url.searchParams.get('state');
  const supabase = createSupabaseServerClient();

  // ── Initial leg: start the flow. Requires an authenticated session so we can
  //    stamp the user id into `state` and verify it on the way back.
  if (!code) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return fail('no_session');
    return NextResponse.redirect(getGoogleAuthUrl(user.id));
  }

  // ── Callback leg. The browser frequently drops the Supabase session cookie on
  //    the cross-site redirect back from accounts.google.com, so getUser() can be
  //    null here even for a valid user. We therefore resolve the user id from the
  //    session when present, and otherwise fall back to the `state` we issued.
  const { data: { user } } = await supabase.auth.getUser();
  let userId: string | null = null;
  if (user) {
    if (!stateParam || stateParam !== user.id) return fail('invalid_state');
    userId = user.id;
  } else if (stateParam && UUID_RE.test(stateParam)) {
    userId = stateParam;
  } else {
    return fail('no_session_no_state');
  }

  let tokens;
  try {
    const oauth = createOAuth2Client();
    ({ tokens } = await oauth.getToken(code));
  } catch (e: any) {
    return fail(`token_exchange:${e?.response?.data?.error || e?.message || 'unknown'}`);
  }

  const admin = createSupabaseAdminClient();
  const { data: updated, error: dbError } = await admin.from('users').update({
    gmail_access_token:  tokens.access_token,
    gmail_refresh_token: tokens.refresh_token,
    // also write to gcal_ columns so calendar sync can read them
    gcal_access_token:   tokens.access_token,
    gcal_refresh_token:  tokens.refresh_token,
    gmail_token_expiry:  tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
    gmail_connected: true,
    gcal_connected:  true
  }).eq('id', userId).select('id');

  if (dbError) return fail(`db:${dbError.message}`);
  if (!updated || updated.length === 0) return fail('user_not_found');

  return NextResponse.redirect(new URL('/dashboard?connected=google', req.url));
}
