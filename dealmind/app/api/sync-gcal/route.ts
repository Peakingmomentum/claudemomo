import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createOAuth2Client } from '@/lib/google';
import { google } from 'googleapis';

export const runtime = 'nodejs';

export async function POST() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { data: profile } = await supabase
    .from('users')
    .select('gcal_connected, gcal_access_token, gcal_refresh_token, gmail_token_expiry')
    .eq('id', user.id)
    .single();

  if (!profile?.gcal_connected || !profile.gcal_access_token) {
    return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 });
  }

  try {
    const auth = createOAuth2Client();
    auth.setCredentials({
      access_token:  profile.gcal_access_token,
      refresh_token: profile.gcal_refresh_token,
      expiry_date:   profile.gmail_token_expiry ? new Date(profile.gmail_token_expiry).getTime() : undefined,
    });

    // Refresh token if needed and persist
    auth.on('tokens', async (tokens) => {
      const patch: Record<string, string> = {};
      if (tokens.access_token) patch.gcal_access_token = tokens.access_token;
      if (tokens.expiry_date)  patch.gmail_token_expiry = new Date(tokens.expiry_date).toISOString();
      if (Object.keys(patch).length) {
        await supabase.from('users').update(patch).eq('id', user.id);
      }
    });

    const gcal  = google.calendar({ version: 'v3', auth });
    const now   = new Date();
    const min   = now.toISOString();
    const max   = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 days ahead

    const res = await gcal.events.list({
      calendarId:   'primary',
      timeMin:      min,
      timeMax:      max,
      maxResults:   250,
      singleEvents: true,
      orderBy:      'startTime',
    });

    const items = res.data.items || [];
    let synced = 0;

    for (const evt of items) {
      if (!evt.id || !evt.summary) continue;
      const startRaw = evt.start?.dateTime || evt.start?.date;
      if (!startRaw) continue;

      const event_date = evt.start?.dateTime
        ? new Date(evt.start.dateTime).toISOString()
        : new Date(startRaw + 'T00:00:00').toISOString();

      // Upsert by gcal_event_id to avoid duplicates
      await supabase.from('calendar_events').upsert({
        user_id:       user.id,
        gcal_event_id: evt.id,
        title:         evt.summary,
        event_date,
        event_type:    'appointment',
        description:   evt.description || null,
        synced_from:   'google',
        lead_id:       null,
      }, { onConflict: 'gcal_event_id' });

      synced++;
    }

    return NextResponse.json({ synced });
  } catch (err: any) {
    console.error('[sync-gcal]', err);
    return NextResponse.json({ error: err.message || 'Sync failed' }, { status: 500 });
  }
}
