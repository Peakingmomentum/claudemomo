// Pocket Pilot → GoHighLevel (LeadConnector) integration.
// Each user connects their OWN GHL location via a Private Integration token
// + Location ID. The agent uses these to text leads and create tasks/reminders
// inside the user's GHL account.
//
// API docs: https://highlevel.stoplight.io/docs/integrations
// Base URL:  https://services.leadconnectorhq.com
// Auth:      Authorization: Bearer <token>  +  Version: 2021-07-28 header

const GHL_BASE = 'https://services.leadconnectorhq.com';
const GHL_VERSION = '2021-07-28';

export interface GhlCreds {
  apiKey: string;
  locationId: string;
}

function ghlHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    Version: GHL_VERSION,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

/**
 * Create or update a contact in the user's GHL location and return its id.
 * Upsert is keyed on phone/email by GHL, so re-running is safe.
 */
export async function upsertGhlContact(
  creds: GhlCreds,
  contact: { name?: string; phone?: string; email?: string },
): Promise<{ ok: true; contactId: string } | { ok: false; error: string }> {
  if (!contact.phone && !contact.email) {
    return { ok: false, error: 'Lead needs a phone or email to sync to GHL.' };
  }

  const [firstName, ...rest] = (contact.name || '').trim().split(' ');
  const body = {
    locationId: creds.locationId,
    firstName: firstName || undefined,
    lastName: rest.join(' ') || undefined,
    phone: contact.phone || undefined,
    email: contact.email || undefined,
  };

  try {
    const res = await fetch(`${GHL_BASE}/contacts/upsert`, {
      method: 'POST',
      headers: ghlHeaders(creds.apiKey),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text();
      return { ok: false, error: `GHL contact upsert failed (${res.status}): ${txt.slice(0, 200)}` };
    }
    const json: any = await res.json();
    const contactId = json.contact?.id || json.id;
    if (!contactId) return { ok: false, error: 'GHL did not return a contact id.' };
    return { ok: true, contactId };
  } catch (e) {
    return { ok: false, error: `GHL request failed: ${(e as Error).message}` };
  }
}

/**
 * Send an SMS to a GHL contact through the user's connected location.
 * The contact must already exist — call upsertGhlContact first.
 */
export async function sendGhlSms(
  creds: GhlCreds,
  contactId: string,
  message: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${GHL_BASE}/conversations/messages`, {
      method: 'POST',
      headers: ghlHeaders(creds.apiKey),
      body: JSON.stringify({ type: 'SMS', contactId, message }),
    });
    if (!res.ok) {
      const txt = await res.text();
      return { ok: false, error: `GHL SMS send failed (${res.status}): ${txt.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `GHL request failed: ${(e as Error).message}` };
  }
}

/**
 * Create a task / reminder on a GHL contact (e.g. "Call John tomorrow at 2pm").
 */
export async function createGhlTask(
  creds: GhlCreds,
  contactId: string,
  task: { title: string; body?: string; dueDate: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${GHL_BASE}/contacts/${contactId}/tasks`, {
      method: 'POST',
      headers: ghlHeaders(creds.apiKey),
      body: JSON.stringify({
        title: task.title,
        body: task.body || '',
        dueDate: task.dueDate,
        completed: false,
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      return { ok: false, error: `GHL task create failed (${res.status}): ${txt.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `GHL request failed: ${(e as Error).message}` };
  }
}

// ─── Brief context ───────────────────────────────────────────
// Pulls recent activity from the user's GHL location to enrich the daily brief:
// who replied, who's gone quiet, and what's booked.

export interface GhlBriefContext {
  conversations: {
    name: string;
    lastMessage: string;
    direction: 'inbound' | 'outbound' | 'unknown';
    unread: boolean;
    lastMessageDate?: string;
  }[];
  appointments: {
    title: string;
    startTime: string;
    contactName?: string;
  }[];
}

/**
 * Fetch recent conversations and upcoming appointments from GHL for the brief.
 * Best-effort: any sub-fetch that fails is skipped rather than failing the brief.
 */
export async function fetchGhlBriefContext(
  creds: GhlCreds,
): Promise<GhlBriefContext> {
  const ctx: GhlBriefContext = { conversations: [], appointments: [] };

  // Recent conversations — surfaces who messaged back / who's hot.
  try {
    const res = await fetch(
      `${GHL_BASE}/conversations/search?locationId=${encodeURIComponent(creds.locationId)}&sortBy=last_message_date&sort=desc&limit=20`,
      { headers: ghlHeaders(creds.apiKey) },
    );
    if (res.ok) {
      const json: any = await res.json();
      const convos: any[] = json.conversations || json.data || [];
      ctx.conversations = convos.map(c => ({
        name: c.contactName || c.fullName || c.name || 'Unknown',
        lastMessage: (c.lastMessageBody || c.lastMessage || '').slice(0, 200),
        direction: (c.lastMessageDirection === 'inbound' || c.lastMessageDirection === 'outbound')
          ? c.lastMessageDirection : 'unknown' as const,
        unread: (c.unreadCount ?? 0) > 0,
        lastMessageDate: c.lastMessageDate || c.dateUpdated,
      })).filter(c => c.lastMessage);
    }
  } catch { /* skip conversations on failure */ }

  // Upcoming appointments (next 48h) — best effort; GHL needs a time window.
  try {
    const now = Date.now();
    const end = now + 48 * 3600 * 1000;
    const res = await fetch(
      `${GHL_BASE}/calendars/events?locationId=${encodeURIComponent(creds.locationId)}&startTime=${now}&endTime=${end}`,
      { headers: ghlHeaders(creds.apiKey) },
    );
    if (res.ok) {
      const json: any = await res.json();
      const events: any[] = json.events || json.data || [];
      ctx.appointments = events.map(e => ({
        title: e.title || e.appointmentStatus || 'Appointment',
        startTime: e.startTime || e.start_time || '',
        contactName: e.contactName || e.contact?.name,
      })).filter(a => a.startTime);
    }
  } catch { /* skip appointments on failure */ }

  return ctx;
}

/**
 * Convenience: upsert the lead as a contact, then text them. Returns the
 * GHL contactId on success so the caller can attach follow-up tasks.
 */
export async function textLeadViaGhl(
  creds: GhlCreds,
  lead: { name?: string; phone?: string | null; email?: string | null },
  message: string,
): Promise<{ ok: true; contactId: string } | { ok: false; error: string }> {
  const upsert = await upsertGhlContact(creds, {
    name: lead.name,
    phone: lead.phone || undefined,
    email: lead.email || undefined,
  });
  if (!upsert.ok) return upsert;

  const sms = await sendGhlSms(creds, upsert.contactId, message);
  if (!sms.ok) return sms;

  return { ok: true, contactId: upsert.contactId };
}
