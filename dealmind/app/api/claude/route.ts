import { NextResponse, type NextRequest } from 'next/server';
import { buildSystemPrompt, buildCoachingPrompt, COPILOT_TOOLS, anthropic, enrichLeadWithHaiku } from '@/lib/claude';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { notifySlack } from '@/lib/slack';
import { checkRateLimit, rateLimitResponse, LIMITS } from '@/lib/ratelimit';
import { textLeadViaGhl, upsertGhlContact, fetchGhlBriefContext, type GhlCreds } from '@/lib/ghl';
import { clientFromTokens, listRecentEmails, listCalendarEvents, createCalendarEvent } from '@/lib/google';

type GoogleCreds = { accessToken: string; refreshToken: string | null };

export const runtime = 'nodejs';

// Detect unfilled placeholders so we never send a client a message with
// "[Your Name]" or "{{company}}" still in it. Returns the offending tokens.
function findPlaceholders(msg: string): string[] {
  const hits = new Set<string>();
  const bracketed = msg.match(/\[[^\]]*\]|\{\{[^}]*\}\}|<[^>]+>/g);
  if (bracketed) bracketed.forEach(b => hits.add(b.trim()));
  if (/\byour name\b/i.test(msg))    hits.add('your name');
  if (/\byour company\b/i.test(msg)) hits.add('your company');
  if (/\bagent name\b/i.test(msg))   hits.add('agent name');
  if (/\bcompany name\b/i.test(msg)) hits.add('company name');
  return [...hits];
}

// Convert a model-generated datetime to a correct UTC ISO string.
// The model emits naive local wall-clock time (e.g. "2026-06-10T10:00:00").
// tzOffsetMin is the browser's getTimezoneOffset() (UTC - local, in minutes).
// If the string already carries a timezone (Z or ±hh:mm), it's returned as-is.
function normalizeToUtc(dt: string | undefined, tzOffsetMin: number): string | undefined {
  if (!dt) return dt;
  const s = dt.trim();
  if (/(?:[zZ]|[+-]\d{2}:?\d{2})$/.test(s)) return s;
  const asIfUtc = new Date(s + 'Z').getTime();
  if (Number.isNaN(asIfUtc)) return dt;
  return new Date(asIfUtc + tzOffsetMin * 60000).toISOString();
}

// ─── Tool executor ────────────────────────────────────────────

async function executeTool(
  toolName: string,
  input: Record<string, any>,
  userId: string,
  supabase: ReturnType<typeof createSupabaseServerClient>,
  leads: any[],
  slackWebhook: string | null,
  copilotName: string,
  ghl: GhlCreds | null,
  senderName: string,
  senderCompany: string | null,
  google: GoogleCreds | null,
  tzOffsetMin: number
): Promise<{ result: string; action?: Record<string, any> }> {

  // Helper: resolve lead by id or name
  function findLead(id?: string, name?: string) {
    if (id) return leads.find(l => l.id === id);
    if (name) return leads.find(l => l.name.toLowerCase().includes(name.toLowerCase()));
    return null;
  }

  if (toolName === 'add_lead') {
    const { name, property, stage = 'New', motivation = 'Medium', phone, email, notes } = input;

    // Dedup — never create a second lead with the same phone or email.
    const digits = (phone || '').replace(/\D/g, '');
    const emailNorm = (email || '').trim().toLowerCase();
    if (digits || emailNorm) {
      const existing = leads.find(l => {
        const lp = (l.phone || '').replace(/\D/g, '');
        const le = (l.email || '').trim().toLowerCase();
        return (digits && lp && lp.slice(-10) === digits.slice(-10)) ||
               (emailNorm && le && le === emailNorm);
      });
      if (existing) {
        return {
          result: `${existing.name} is already in the pipeline (matched by ${digits && existing.phone ? 'phone number' : 'email'}). Did not create a duplicate — using the existing lead.`,
          action: { type: 'lead_updated', lead: existing },
        };
      }
    }

    const { data: lead, error } = await supabase.from('leads').insert({
      user_id: userId, name, property: property || null,
      stage, motivation, last_contact: 0, days_in_pipeline: 0,
      phone: phone || null, email: email || null, notes: notes || null, is_dead: false,
    }).select().single();
    if (error) return { result: `Error adding lead: ${error.message}` };

    // Enrich immediately with Haiku (~300ms) — cheap enough to run inline
    try {
      const enrichment = await enrichLeadWithHaiku({ name, property, notes, stage, motivation });
      await supabase.from('leads').update({ ai_enrichment: enrichment }).eq('id', lead.id);
      lead.ai_enrichment = enrichment;
    } catch { /* enrichment is best-effort */ }

    // Slack notification
    if (slackWebhook) {
      notifySlack(slackWebhook, {
        type: 'lead_added', leadName: name, property, stage, motivation,
        detail: notes ? `"${notes.slice(0, 120)}${notes.length > 120 ? '…' : ''}"` : undefined,
        agentName: copilotName,
      });
    }

    return {
      result: `Lead "${name}" added to pipeline at stage "${stage}" with ${motivation} motivation.`,
      action: { type: 'lead_added', lead },
    };
  }

  if (toolName === 'update_lead') {
    const lead = findLead(input.lead_id, input.lead_name);
    if (!lead) return { result: `Could not find lead "${input.lead_name || input.lead_id}".` };
    const patch: Record<string, any> = {};
    if (input.stage)                   patch.stage       = input.stage;
    if (input.motivation)              patch.motivation  = input.motivation;
    if (input.notes) {
      // Append new note with timestamp instead of overwriting
      const timestamp = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const newNote = `[${timestamp}] ${input.notes}`;
      patch.notes = lead.notes ? `${lead.notes}\n${newNote}` : newNote;
    }
    if (input.phone)                   patch.phone       = input.phone;
    if (input.email)                   patch.email       = input.email;
    if (input.property)                patch.property    = input.property;
    if (input.deal_value !== undefined) patch.deal_value = input.deal_value;
    const { data: updated, error } = await supabase.from('leads').update(patch).eq('id', lead.id).select().single();
    if (error) return { result: `Error updating lead: ${error.message}` };

    // Slack — only ping for meaningful stage/motivation changes
    if (slackWebhook && (patch.stage || patch.motivation)) {
      const changes = Object.entries(patch)
        .filter(([k]) => ['stage', 'motivation'].includes(k))
        .map(([k, v]) => `${k} → ${v}`)
        .join(', ');
      notifySlack(slackWebhook, {
        type: patch.stage ? 'stage_change' : 'lead_updated',
        leadName: lead.name, property: updated.property,
        stage: updated.stage, motivation: updated.motivation,
        detail: changes, agentName: copilotName,
      });
    }

    return {
      result: `Lead "${lead.name}" updated: ${Object.entries(patch).map(([k, v]) => `${k}→${v}`).join(', ')}.`,
      action: { type: 'lead_updated', lead: updated },
    };
  }

  if (toolName === 'log_contact') {
    const lead = findLead(input.lead_id, input.lead_name);
    if (!lead) return { result: `Could not find lead "${input.lead_name || input.lead_id}".` };
    const existingNotes = lead.notes || '';
    const timestamp = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const newNote = input.note ? `[${timestamp}] ${input.note}` : `[${timestamp}] Contact logged`;
    const notes = existingNotes ? `${existingNotes}\n${newNote}` : newNote;
    const { data: updated, error } = await supabase.from('leads')
      .update({ last_contact: 0, notes }).eq('id', lead.id).select().single();
    if (error) return { result: `Error logging contact: ${error.message}` };

    if (slackWebhook && input.note) {
      notifySlack(slackWebhook, {
        type: 'contact_logged', leadName: lead.name, property: lead.property,
        stage: lead.stage, motivation: lead.motivation,
        detail: input.note, agentName: copilotName,
      });
    }

    return {
      result: `Contact logged for "${lead.name}". Last contact reset to today.`,
      action: { type: 'lead_updated', lead: updated },
    };
  }

  if (toolName === 'mark_lead_dead') {
    const lead = findLead(input.lead_id, input.lead_name);
    if (!lead) return { result: `Could not find lead "${input.lead_name || input.lead_id}".` };
    const notes = input.reason
      ? `${lead.notes || ''}\n[Dead] ${input.reason}`.trim()
      : lead.notes;
    const { data: updated, error } = await supabase.from('leads')
      .update({ is_dead: true, stage: 'Dead', notes }).eq('id', lead.id).select().single();
    if (error) return { result: `Error marking lead dead: ${error.message}` };

    if (slackWebhook) {
      notifySlack(slackWebhook, {
        type: 'lead_dead', leadName: lead.name, property: lead.property,
        detail: input.reason || 'No reason given', agentName: copilotName,
      });
    }

    return {
      result: `Lead "${lead.name}" marked as dead.${input.reason ? ` Reason: ${input.reason}` : ''}`,
      action: { type: 'lead_updated', lead: updated },
    };
  }

  if (toolName === 'add_calendar_event') {
    const { title, event_type, lead_name } = input;
    const event_date = normalizeToUtc(input.event_date, tzOffsetMin);
    if (!event_date) return { result: 'Event needs a date/time.' };
    let lead_id = null;
    if (lead_name) {
      const lead = findLead(undefined, lead_name);
      if (lead) lead_id = lead.id;
    }
    const { data: event, error } = await supabase.from('calendar_events').insert({
      user_id: userId, title, event_date,
      event_type: event_type || 'follow_up', lead_id,
    }).select().single();
    if (error) return { result: `Error adding event: ${error.message}` };

    // If Google Calendar is connected, also create a real event on their calendar.
    let googleNote = '';
    if (google) {
      try {
        const auth = clientFromTokens(google.accessToken, google.refreshToken);
        await createCalendarEvent(auth, { title, startISO: event_date, description: lead_name ? `Lead: ${lead_name}` : undefined });
        googleNote = ' Synced to Google Calendar.';
      } catch (e: any) {
        const msg = e?.response?.data?.error?.message || e?.message || '';
        googleNote = /insufficient|scope|permission/i.test(msg)
          ? ' (Tracked in pipeline only — reconnect Google Calendar in Connectors to grant create-event access, then it will sync.)'
          : ' (Could not sync to Google Calendar.)';
      }
    }

    return {
      result: `Calendar event "${title}" added for ${new Date(event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}.${googleNote}`,
      action: { type: 'event_added', event },
    };
  }

  if (toolName === 'read_email') {
    if (!google) return { result: 'Gmail is not connected. Tell the user to connect Gmail in Connectors first.' };
    try {
      const auth = clientFromTokens(google.accessToken, google.refreshToken);
      const max = Math.min(Math.max(Number(input.max) || 10, 1), 20);
      const emails = await listRecentEmails(auth, input.query || 'in:inbox', max);
      if (!emails.length) return { result: 'No emails found for that query.' };
      const formatted = emails.map((e, i) =>
        `${i + 1}. From: ${e.from}\n   Subject: ${e.subject}\n   Date: ${e.date}\n   ${e.snippet}`
      ).join('\n\n');
      return { result: `Recent emails:\n\n${formatted}` };
    } catch (e: any) {
      return { result: `Could not read email: ${e?.response?.data?.error?.message || e?.message || 'unknown error'}. The user may need to reconnect Gmail in Connectors.` };
    }
  }

  if (toolName === 'read_calendar') {
    if (!google) return { result: 'Google Calendar is not connected. Tell the user to connect it in Connectors first.' };
    try {
      const auth = clientFromTokens(google.accessToken, google.refreshToken);
      const days = Math.min(Math.max(Number(input.days) || 7, 1), 60);
      const events = await listCalendarEvents(auth, days);
      if (!events.length) return { result: `No events on the calendar in the next ${days} days.` };
      const formatted = events.map(ev => {
        const when = new Date(ev.start).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
        return `• ${when} — ${ev.summary}${ev.location ? ` (${ev.location})` : ''}`;
      }).join('\n');
      return { result: `Upcoming events (next ${days} days):\n\n${formatted}` };
    } catch (e: any) {
      return { result: `Could not read calendar: ${e?.response?.data?.error?.message || e?.message || 'unknown error'}. The user may need to reconnect Google Calendar in Connectors.` };
    }
  }

  if (toolName === 'read_ghl_messages') {
    if (!ghl) return { result: 'GoHighLevel is not connected. Tell the user to connect it in Connectors to read CRM messages.' };
    try {
      const ctx = await fetchGhlBriefContext(ghl);
      const q = String(input.query || '').toLowerCase().trim();
      let convos = ctx.conversations;
      if (q) convos = convos.filter(c =>
        c.name.toLowerCase().includes(q) || (c.phone || '').includes(q) || c.lastMessage.toLowerCase().includes(q));
      if (!convos.length) return { result: q ? `No GoHighLevel conversations matching "${input.query}".` : 'No recent GoHighLevel conversations found.' };
      const formatted = convos.slice(0, 15).map(c => {
        const dir = c.direction === 'inbound' ? 'they texted' : c.direction === 'outbound' ? 'you texted' : 'message';
        return `• ${c.name}${c.unread ? ' (UNREAD)' : ''} — ${dir}: "${c.lastMessage.slice(0, 140)}"`;
      }).join('\n');
      return { result: `Recent GoHighLevel messages:\n\n${formatted}` };
    } catch (e: any) {
      return { result: `Could not read GoHighLevel messages: ${e?.message || 'unknown error'}.` };
    }
  }

  if (toolName === 'text_lead') {
    if (!ghl) return { result: 'GoHighLevel is not connected. Ask the user to connect GHL in Connectors first.' };
    const lead = findLead(input.lead_id, input.lead_name);
    if (!lead) return { result: `Could not find lead "${input.lead_name || input.lead_id}".` };
    if (!lead.phone) return { result: `${lead.name} has no phone number on file — add one before texting.` };
    const message = (input.message || '').trim();
    if (!message) return { result: 'No message provided.' };

    // HARD BLOCK: never send a client a message with unfilled placeholders.
    const placeholders = findPlaceholders(message);
    if (placeholders.length) {
      return {
        result: `BLOCKED — this message still has placeholders: ${placeholders.join(', ')}. ` +
          `Replace them with the real values before sending. The sender is ${senderName}` +
          `${senderCompany ? ` with ${senderCompany}` : ''}. Rewrite the draft cleanly and show it to the user again.`,
      };
    }

    // DRAFT-FIRST: do not send until the user has explicitly approved the exact text.
    if (!input.confirmed) {
      return {
        result: `DRAFT for ${lead.name} (${lead.phone}):\n\n"${message}"\n\n` +
          `Show this to the user verbatim and ask them to approve it. Only call text_lead again ` +
          `with confirmed=true after they clearly say to send it. Do NOT claim it was sent yet.`,
        action: { type: 'text_draft', lead: { id: lead.id, name: lead.name, phone: lead.phone }, message },
      };
    }

    const sent = await textLeadViaGhl(ghl, { name: lead.name, phone: lead.phone, email: lead.email }, message);
    if (!sent.ok) return { result: `Could not send text: ${sent.error}` };

    // Log the contact on the Pocket Pilot side too
    const timestamp = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const note = `[${timestamp}] Texted via GHL: "${message.slice(0, 100)}${message.length > 100 ? '…' : ''}"`;
    const notes = lead.notes ? `${lead.notes}\n${note}` : note;
    const { data: updated } = await supabase.from('leads')
      .update({ last_contact: 0, notes }).eq('id', lead.id).select().single();

    if (slackWebhook) {
      notifySlack(slackWebhook, {
        type: 'contact_logged', leadName: lead.name, property: lead.property,
        stage: lead.stage, motivation: lead.motivation,
        detail: `Texted via GHL: ${message.slice(0, 80)}`, agentName: copilotName,
      });
    }

    return {
      result: `Text sent to ${lead.name} via GoHighLevel. Contact logged.`,
      action: updated ? { type: 'lead_updated', lead: updated } : undefined,
    };
  }

  if (toolName === 'create_task') {
    // Tasks are LOCAL to Pilot (the Tasks menu) — never pushed to GoHighLevel.
    const title = (input.title || '').trim();
    if (!title) return { result: 'Task needs a title.' };
    let lead_id = null;
    if (input.lead_name) {
      const lead = findLead(undefined, input.lead_name);
      if (lead) lead_id = lead.id;
    }
    const eventDate = normalizeToUtc(input.due_date, tzOffsetMin) || new Date().toISOString();
    const { error } = await supabase.from('calendar_events').insert({
      user_id: userId, title, event_date: eventDate, event_type: 'task', lead_id,
    });
    if (error) return { result: `Error creating task: ${error.message}` };
    const due = input.due_date
      ? `, due ${new Date(input.due_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`
      : '';
    return { result: `Task "${title}" added to your Tasks list${due}.` };
  }

  return { result: `Unknown tool: ${toolName}` };
}

// ─── Route ───────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const allowed = await checkRateLimit(`copilot:${user.id}`, LIMITS.copilot);
  if (!allowed) return rateLimitResponse(LIMITS.copilot);

  const { message, context, tz, tzOffset } = await req.json() as
    { message: string; context?: string; tz?: string; tzOffset?: number };
  // getTimezoneOffset() minutes from the browser (e.g. 420 for PDT). Used to
  // convert the model's naive local datetimes into correct UTC instants.
  const tzOffsetMin = typeof tzOffset === 'number' ? tzOffset : 0;
  if (!message?.trim()) return NextResponse.json({ error: 'empty message' }, { status: 400 });

  const isCoaching = context === 'coaching';

  // Build history query filtered by context so coaching and copilot histories stay separate
  // Most recent 50 messages (descending), reversed to chronological below.
  // NOTE: must be descending — ascending+limit would pin the model to the
  // OLDEST 50 messages and it would never see recent context.
  const historyBase = supabase.from('chat_messages').select('role, content')
    .eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
  const historyQuery = isCoaching
    ? historyBase.eq('context', 'coaching')
    : historyBase.or('context.is.null,context.eq.chat');

  const [{ data: profile }, { data: leads }, { data: calendar }, { data: history }] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('leads').select('*').eq('user_id', user.id).eq('is_dead', false),
    supabase.from('calendar_events').select('*').eq('user_id', user.id)
      // Future events/appointments PLUS any still-open task (incl. overdue) so
      // the copilot always sees the user's outstanding to-dos.
      .or(`event_date.gte.${new Date().toISOString()},and(event_type.eq.task,completed_at.is.null)`)
      .order('event_date'),
    historyQuery,
  ]);

  if (!profile) return NextResponse.json({ error: 'no profile' }, { status: 400 });

  const slackWebhook = (profile as any).slack_webhook_url || null;
  const copilotName  = (profile as any).copilot_name || 'Pilot';
  const ghl: GhlCreds | null =
    (profile as any).ghl_connected && (profile as any).ghl_api_key && (profile as any).ghl_location_id
      ? { apiKey: (profile as any).ghl_api_key, locationId: (profile as any).ghl_location_id }
      : null;
  const senderName    = (profile as any).user_name || '';
  const senderCompany = (profile as any).company_name || null;
  const google: GoogleCreds | null =
    (profile as any).gmail_connected && (profile as any).gmail_access_token
      ? { accessToken: (profile as any).gmail_access_token, refreshToken: (profile as any).gmail_refresh_token || null }
      : null;

  const systemPrompt = isCoaching
    ? buildCoachingPrompt(profile as any)
    : buildSystemPrompt(profile as any, (leads || []) as any, (calendar || []) as any, tz);

  // Build message history
  const apiMessages: { role: 'user' | 'assistant'; content: any }[] = [
    ...(history || []).slice().reverse().map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
    { role: 'user', content: message },
  ];

  const actions: Record<string, any>[] = [];
  let finalReply = '';

  // Mutable leads copy — updated after any add/update so subsequent tool
  // calls in the same agentic loop can find leads created earlier this turn.
  let currentLeads = [...(leads || [])];

  // ── Agentic tool loop ──────────────────────────────────────
  let currentMessages = apiMessages;
  const maxIterations = isCoaching ? 1 : 5;
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: isCoaching ? 2000 : 1500,
      system: systemPrompt,
      messages: currentMessages,
      ...(isCoaching ? {} : { tools: COPILOT_TOOLS }),
    } as any);

    // Collect any text from this turn
    const textBlock = response.content.find(b => b.type === 'text');
    if (textBlock?.type === 'text') finalReply = textBlock.text;

    // If no tool calls, we're done
    const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');
    if (toolUseBlocks.length === 0 || response.stop_reason === 'end_turn') break;

    // Execute all tool calls in this turn
    const toolResults: { type: 'tool_result'; tool_use_id: string; content: string }[] = [];
    let leadsChanged = false;
    for (const block of toolUseBlocks) {
      if (block.type !== 'tool_use') continue;
      const { result, action } = await executeTool(
        block.name, block.input as Record<string, any>,
        user.id, supabase, currentLeads, slackWebhook, copilotName, ghl, senderName, senderCompany, google, tzOffsetMin
      );
      if (action) {
        actions.push(action);
        if (action.type === 'lead_added') {
          currentLeads = [...currentLeads, action.lead];
        } else if (action.type === 'lead_updated') {
          currentLeads = currentLeads.map(l => l.id === action.lead.id ? action.lead : l);
        }
        leadsChanged = true;
      }
      toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result });
    }

    // Re-fetch leads after mutations to pick up any DB-side computed fields
    if (leadsChanged) {
      const { data: fresh } = await supabase
        .from('leads').select('*').eq('user_id', user.id).eq('is_dead', false);
      if (fresh) currentLeads = fresh;
    }

    // Feed results back for next iteration
    currentMessages = [
      ...currentMessages,
      { role: 'assistant', content: response.content },
      { role: 'user', content: toolResults },
    ];
  }

  // Save conversation
  await supabase.from('chat_messages').insert([
    { user_id: user.id, role: 'user',      content: message,    context: context || null },
    { user_id: user.id, role: 'assistant', content: finalReply, context: context || null },
  ]);

  return NextResponse.json({ reply: finalReply, actions });
}
