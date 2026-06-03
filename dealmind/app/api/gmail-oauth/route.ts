import { NextResponse, type NextRequest } from 'next/server';
import { createOAuth2Client, getGoogleAuthUrl } from '@/lib/google';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';

// GET /api/gmail-oauth          → kicks off the OAuth flow (redirect to Google)
// GET /api/gmail-oauth?code=...  → handles the callback
export async function GET(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/', req.url));

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const stateParam = url.searchParams.get('state');

  if (!code) {
    // user.id is passed as state so we can verify it on callback
    return NextResponse.redirect(getGoogleAuthUrl(user.id));
  }

  // CSRF check — state must match the authenticated user's id
  if (!stateParam || stateParam !== user.id) {
    return NextResponse.json({ error: 'invalid state' }, { status: 400 });
  }

  const oauth = createOAuth2Client();
  const { tokens } = await oauth.getToken(code);

  const admin = createSupabaseAdminClient();
  await admin.from('users').update({
    gmail_access_token:  tokens.access_token,
    gmail_refresh_token: tokens.refresh_token,
    // also write to gcal_ columns so calendar sync can read them
    gcal_access_token:   tokens.access_token,
    gcal_refresh_token:  tokens.refresh_token,
    gmail_token_expiry:  tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
    gmail_connected: true,
    gcal_connected:  true
  }).eq('id', user.id);

  return NextResponse.redirect(new URL('/dashboard?connected=google', req.url));
}
