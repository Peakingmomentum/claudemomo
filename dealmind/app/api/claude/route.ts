import { NextResponse, type NextRequest } from 'next/server';
import { buildSystemPrompt, buildCoachingPrompt, COPILOT_TOOLS, anthropic, enrichLeadWithHaiku } from '@/lib/claude';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { notifySlack } from '@/lib/slack';
import { checkRateLimit, rateLimitResponse, LIMITS } from '@/lib/ratelimit';
import { textLeadViaGhl, upsertGhlContact, createGhlTask, type GhlCreds } from '@/lib/ghl';

export const runtime = 'nodejs';

// ─── Tool executor ────────────────────────────────────────────

async function executeTool(
  toolName: string,
  input: Record<string, any>,
  userId: string,
  supabase: ReturnType<typeof createSupabaseServerClient>,
  leads: any[],
  slackWebhook: string | null,
  copilotName: string,
  ghl: GhlCreds | null
): Promise<{ result: string; action?: Record<string, any> }> {

  // Helper: resolve lead by id or name
  function findLead(id?: string, name?: string) {
    if (id) return leads.find(l => l.id === id);
    if (name) return leads.find(l => l.name.toLowerCase().includes(name.toLowerCase()));
    return null;
  }

  if (toolName === 'add_lead') {
    const { name, property, stage = 'New', motivation = 'Medium', phone, email, notes } = input;
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
    const { title, event_date, event_type, lead_name } = input;
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
    return {
      result: `Calendar event "${title}" added for ${new Date(event_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}.`,
      action: { type: 'event_added', event },
    };
  }

  if (toolName === 'text_lead') {
    if (!ghl) return { result: 'GoHighLevel is not connected. Ask the user to connect GHL in Connectors first.' };
    const lead = findLead(input.lead_id, input.lead_name);
    if (!lead) return { result: `Could not find lead "${input.lead_name || input.lead_id}".` };
    if (!lead.phone) return { result: `${lead.name} has no phone number on file — add one before texting.` };
    if (!input.message?.trim()) return { result: 'No message provided to send.' };

    const sent = await textLeadViaGhl(ghl, { name: lead.name, phone: lead.phone, email: lead.email }, input.message);
    if (!sent.ok) return { result: `Could not send text: ${sent.error}` };

    // Log the contact on the Pocket Pilot side too
    const timestamp = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const note = `[${timestamp}] Texted via GHL: "${input.message.slice(0, 100)}${input.message.length > 100 ? '…' : ''}"`;
    const notes = lead.notes ? `${lead.notes}\n${note}` : note;
    const { data: updated } = await supabase.from('leads')
      .update({ last_contact: 0, notes }).eq('id', lead.id).select().single();

    if (slackWebhook) {
      notifySlack(slackWebhook, {
        type: 'contact_logged', leadName: lead.name, property: lead.property,
        stage: lead.stage, motivation: lead.motivation,
        detail: `Texted via GHL: ${input.message.slice(0, 80)}`, agentName: copilotName,
      });
    }

    return {
      result: `Text sent to ${lead.name} via GoHighLevel. Contact logged.`,
      action: updated ? { type: 'lead_updated', lead: updated } : undefined,
    };
  }

  if (toolName === 'create_ghl_task') {
    if (!ghl) return { result: 'GoHighLevel is not connected. Ask the user to connect GHL in Connectors first.' };
    const lead = findLead(input.lead_id, input.lead_name);
    if (!lead) return { result: `Could not find lead "${input.lead_name || input.lead_id}".` };
    if (!input.title?.trim() || !input.due_date) return { result: 'Task needs a title and a due date.' };

    // Ensure the lead exists as a GHL contact, then attach the task
    const upsert = await upsertGhlContact(ghl, { name: lead.name, phone: lead.phone, email: lead.email });
    if (!upsert.ok) return { result: `Could not create task: ${upsert.error}` };

    const task = await createGhlTask(ghl, upsert.contactId, {
      title: input.title, body: input.body, dueDate: input.due_date,
    });
    if (!task.ok) return { result: `Could not create task: ${task.error}` };

    return {
      result: `Task "${input.title}" created in GoHighLevel for ${lead.name}, due ${new Date(input.due_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}.`,
    };
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

  const { message, context } = await req.json() as { message: string; context?: string };
  if (!message?.trim()) return NextResponse.json({ error: 'empty message' }, { status: 400 });

  const isCoaching = context === 'coaching';

  // Build history query filtered by context so coaching and copilot histories stay separate
  const historyBase = supabase.from('chat_messages').select('role, content')
    .eq('user_id', user.id).order('created_at', { ascending: true }).limit(50);
  const historyQuery = isCoaching
    ? historyBase.eq('context', 'coaching')
    : historyBase.or('context.is.null,context.eq.chat');

  const [{ data: profile }, { data: leads }, { data: calendar }, { data: history }] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('leads').select('*').eq('user_id', user.id).eq('is_dead', false),
    supabase.from('calendar_events').select('*').eq('user_id', user.id)
      .gte('event_date', new Date().toISOString()).order('event_date'),
    historyQuery,
  ]);

  if (!profile) return NextResponse.json({ error: 'no profile' }, { status: 400 });

  const slackWebhook = (profile as any).slack_webhook_url || null;
  const copilotName  = (profile as any).copilot_name || 'Pocket Pilot';
  const ghl: GhlCreds | null =
    (profile as any).ghl_connected && (profile as any).ghl_api_key && (profile as any).ghl_location_id
      ? { apiKey: (profile as any).ghl_api_key, locationId: (profile as any).ghl_location_id }
      : null;

  const systemPrompt = isCoaching
    ? buildCoachingPrompt(profile as any)
    : buildSystemPrompt(profile as any, (leads || []) as any, (calendar || []) as any);

  // Build message history
  const apiMessages: { role: 'user' | 'assistant'; content: any }[] = [
    ...(history || []).map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
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
        user.id, supabase, currentLeads, slackWebhook, copilotName, ghl
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
