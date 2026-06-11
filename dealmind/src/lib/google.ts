import { google } from 'googleapis';

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!
  );
}

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  // calendar.events grants read AND write of events (needed to create events)
  'https://www.googleapis.com/auth/calendar.events'
];

export function getGoogleAuthUrl(state: string) {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: GOOGLE_SCOPES,
    prompt: 'consent',
    state
  });
}

// Build an authenticated client from a user's stored tokens. googleapis will
// transparently refresh the access token using the refresh token when it expires.
export function clientFromTokens(accessToken: string, refreshToken?: string | null) {
  const client = createOAuth2Client();
  client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken || undefined,
  });
  return client;
}

type Authed = ReturnType<typeof clientFromTokens>;

export type EmailSummary = { from: string; subject: string; date: string; snippet: string };

// Read recent inbox emails (metadata + snippet only). Requires gmail.readonly.
export async function listRecentEmails(auth: Authed, query = 'in:inbox', max = 10): Promise<EmailSummary[]> {
  const gmail = google.gmail({ version: 'v1', auth });
  const list = await gmail.users.messages.list({ userId: 'me', maxResults: max, q: query });
  const ids = (list.data.messages || []).map(m => m.id!).filter(Boolean);
  const msgs = await Promise.all(ids.map(id =>
    gmail.users.messages.get({
      userId: 'me', id, format: 'metadata',
      metadataHeaders: ['From', 'Subject', 'Date'],
    })
  ));
  return msgs.map(r => {
    const headers = r.data.payload?.headers || [];
    const h = (n: string) => headers.find(x => x.name === n)?.value || '';
    return { from: h('From'), subject: h('Subject'), date: h('Date'), snippet: r.data.snippet || '' };
  });
}

export type CalendarItem = { summary: string; start: string; end: string; location: string };

// Read upcoming calendar events. Works with calendar.readonly or calendar.events.
export async function listCalendarEvents(auth: Authed, days = 7): Promise<CalendarItem[]> {
  const cal = google.calendar({ version: 'v3', auth });
  const now = new Date();
  const res = await cal.events.list({
    calendarId: 'primary',
    timeMin: now.toISOString(),
    timeMax: new Date(now.getTime() + days * 86400000).toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 50,
  });
  return (res.data.items || []).map(e => ({
    summary: e.summary || '(no title)',
    start: e.start?.dateTime || e.start?.date || '',
    end: e.end?.dateTime || e.end?.date || '',
    location: e.location || '',
  }));
}

// Create a real Google Calendar event. Requires the calendar.events scope —
// throws if the connected token only has readonly (caller handles fallback).
export async function createCalendarEvent(
  auth: Authed,
  opts: { title: string; startISO: string; endISO?: string; description?: string }
): Promise<{ id: string; htmlLink: string }> {
  const cal = google.calendar({ version: 'v3', auth });
  const start = new Date(opts.startISO);
  const endISO = opts.endISO || new Date(start.getTime() + 3600000).toISOString();
  const res = await cal.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: opts.title,
      description: opts.description || undefined,
      start: { dateTime: opts.startISO },
      end: { dateTime: endISO },
    },
  });
  return { id: res.data.id || '', htmlLink: res.data.htmlLink || '' };
}
