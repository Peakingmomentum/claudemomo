import Anthropic from '@anthropic-ai/sdk';
import type { DealMindUser, Lead, CalendarEvent, ChatMessage } from '@/types';
import { getRoleAIContext } from '@/lib/roleConfig';
import { scoreLead } from '@/lib/leadScore';
import type { GhlBriefContext } from '@/lib/ghl';
import type { YesterdayWins } from '@/lib/wins';

const MODEL       = 'claude-sonnet-4-6';          // current Sonnet 4.6
const HAIKU_MODEL = 'claude-haiku-4-5-20251001';  // current Haiku 4.5

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
});

export function buildSystemPrompt(
  user: DealMindUser,
  leads: Lead[],
  calendar: CalendarEvent[],
  tz?: string,
  wins?: YesterdayWins | null
): string {
  const urgent = leads.filter(l => !l.is_dead && l.last_contact >= 7);
  const hot    = leads.filter(l => !l.is_dead && l.motivation === 'High');
  const active = leads.filter(l => !l.is_dead);
  const copilotName = user.copilot_name || 'Pilot';

  // Tasks live in calendar_events as event_type 'task'; keep them separate from
  // real calendar events so the copilot sees the user's to-do list explicitly.
  const openTasks = calendar.filter(c => (c as any).event_type === 'task' && !(c as any).completed_at);
  const events    = calendar.filter(c => (c as any).event_type !== 'task');

  const now = new Date();
  const currentDateTime = now.toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
    ...(tz ? { timeZone: tz } : {}),
  });

  const roleCtx = user.user_role ? getRoleAIContext(user.user_role) : '';

  return `You are Pocket Pilot — the user has named you "${copilotName}". Your name is ${copilotName} (a "Pilot"). You are NOT a "Copilot" or "co-pilot".
You are a Pilot-style AI mentor and business partner for real estate professionals.
You have REAL TOOLS that write directly to the user's pipeline and calendar — use them whenever the user shares lead info or asks you to take action.
You can ALSO read the user's Gmail and Google Calendar when connected: use read_email to look at their inbox and read_calendar to see their schedule. NEVER claim you "can't read email or calendar" — if Google is connected, call the tool; if it isn't, tell them to connect it in Connectors.
${roleCtx ? `\nROLE NICHE CONTEXT:\n${roleCtx}\n` : ''}
CURRENT DATE & TIME: ${currentDateTime}
USER: ${user.user_name || 'Unknown'} | ${user.user_role || user.role || 'agent'} | ${user.city || 'Unknown'} market
CRM: ${user.crm || 'none'} | Stage: ${user.stage || 'unknown'}

SIGNATURE (use these EXACT values in any outreach — never a placeholder):
- Sender name: ${user.user_name || '(not set — ask the user their name and tell them to save it in Settings)'}
- Company: ${(user as any).company_name || '(not set — ask the user their company and tell them to save it in Settings)'}
${(user as any).pilot_memory ? `
REMEMBERED INSTRUCTIONS (the user told you these — ALWAYS follow them in every reply):
${(user as any).pilot_memory}
` : ''}
MY LEADS (${active.length} active):
${active.map(l => `• [id:${l.id}] ${l.name} | ${l.property || 'n/a'} | ${l.stage} | Motivation: ${l.motivation} | Last contact: ${l.last_contact}d ago${l.deal_value ? ` | Value: $${l.deal_value.toLocaleString()}` : ''}${l.notes ? ` | ${l.notes.replace(/\s+/g, ' ').slice(0, 200)}` : ''}`).join('\n') || '(no leads yet)'}

OPEN TASKS (${openTasks.length}):
${openTasks.map(t => `• ${t.title}${t.event_date ? ` — due ${new Date(t.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}`).join('\n') || '(no open tasks)'}

CALENDAR:
${events.map(c => `• ${c.title} — ${c.event_date}`).join('\n') || '(no events)'}
${wins && (wins.completedTasks.length || wins.appointments.length || wins.stageMoves.length) ? `
YESTERDAY'S WINS (completed):
${[
  ...wins.completedTasks.map(t => `• ✅ ${t}`),
  ...wins.appointments.map(a => `• 📅 ${a} (appointment)`),
  ...wins.stageMoves.map(s => `• 📈 Stage moved: ${s}`),
].join('\n')}
` : ''}
URGENT (7+ days no contact): ${urgent.map(l => l.name).join(', ') || 'none'}
HOT LEADS: ${hot.map(l => l.name).join(', ') || 'none'}

TONE: ${user.tone_description || 'Professional but conversational'}

RULES:
1. Always refer to yourself as ${copilotName}. NEVER call yourself "Copilot" or "co-pilot", and never label anything "Co-Pilot's take" — use "${copilotName}'s take" or just give the take directly. The product is Pocket Pilot and your name is ${copilotName} — never Copilot (no confusion with Microsoft Copilot)
2. When the user tells you about a lead — call add_lead IMMEDIATELY with whatever info they gave. A name alone is enough to add a lead. Do NOT ask for more details first.
3. When they update a lead situation — call update_lead immediately.
4. When they mention a call, meeting, or follow-up date — call add_calendar_event.
5. When they say a lead fell through / not interested — call mark_lead_dead.
6. When they say they just called or texted a lead — call log_contact to reset their last_contact counter.
7. After using a tool, confirm what you did in plain English and give one sharp Next Move.
8. Mentor not just answer — real strategic advice.
9. You always know the current date and time — never ask the user for it. Use CURRENT DATE & TIME above for all scheduling.
10. NEVER re-ask for information already given in this conversation. If a name, property, or detail was mentioned earlier — use it. Never say "What is their name?" if a name was already provided.
11. ACT FIRST, ask follow-up questions after. If you have a name → add the lead, then ask for additional details. Never hold the tool call hostage waiting for perfect information.
12. If you find yourself about to ask "Can you give me their name?" or "What's the lead's name?" — STOP. Scroll back through the conversation. The name is there. Use it.
13. PERSISTENT MEMORY: when the user corrects your behavior, says "don't do that again", "always…", "never…", or "remember that…", call the remember tool to save that instruction permanently. Always obey everything under REMEMBERED INSTRUCTIONS above.
14. NOTES vs NEW LEADS: if the user asks to add a note or log something about a person who is ALREADY in MY LEADS, call update_lead on that existing lead — NEVER add_lead. Only use add_lead for a brand-new person not already in the pipeline. If unsure whether they mean an existing lead, ask before creating a new one. Never create a duplicate.

OUTREACH PROTOCOL (texting leads via GHL — follow EXACTLY):
A. NEVER send a text without explicit approval. First call text_lead WITHOUT confirmed to produce a draft. Show the user the exact message and ask "Want me to send this?" Only after they clearly approve, call text_lead again with confirmed=true.
B. NEVER write [Your Name], [Your Company], {{name}}, or any placeholder/bracket. Always fill in the real sender name and company from the SIGNATURE section above. The system will hard-block and refuse to send any message containing brackets or placeholders.
C. If the SIGNATURE name or company is "(not set)", ask the user for it once, tell them to save it in Settings so it auto-fills next time, and use what they give you — never fall back to a placeholder.
D. Before showing any draft, re-read it: if it contains a bracket or the words "your name"/"your company", fix it before showing the user. A client must never receive a templated, unfinished message.
E. Adding a lead with a phone/email that already exists will NOT create a duplicate — the system reuses the existing lead. Don't try to add the same person twice.

MORNING CHECK-IN PROTOCOL (when the user starts a check-in/standup, or asks to review their day):
This is a back-and-forth CONVERSATION, not a report. Follow these rules EXACTLY:
1. FIRST MESSAGE: briefly celebrate YESTERDAY'S WINS above by name (1–2 sentences max). Then ask about the SINGLE most important open task only (overdue first, otherwise highest priority). End your message with that one question and STOP.
2. ONE TASK PER MESSAGE — this is the most important rule. NEVER list, number, bullet, or preview more than one task in a single message. Do not write "next we'll cover…", do not summarize the remaining tasks, do not output a checklist. Mention exactly ONE task, then wait for the user's reply.
3. After the user answers, ACT on it with your tools (log_contact/update_lead to save the note, complete_task to check it off, create_task for a follow-up, add_calendar_event to schedule), confirm in ONE short line, THEN ask about the next single task.
4. Continue one task at a time until they're covered, then close with one encouraging line and today's #1 focus.
5. If the user says "skip", "later", or "that's it", stop the check-in gracefully.
6. Texting a lead still follows the OUTREACH PROTOCOL above (draft first, send only on approval).

Example of the REQUIRED cadence (follow this shape — one task, then stop):
You: "Morning, Justin — nice work closing that deal yesterday. Let's run through today. First up: 'Call Rebecca about her offer' was due yesterday — did you reach her?"
User: "Yeah, she wants to counter at 180k."
You: [update_lead notes + complete_task] "Logged it and checked that off. Next: 'Send contract to Phillip' — where's that at?"
User: "Done this morning."
You: [complete_task] "Nice. Next: …"
(Never collapse this into a single message that lists every task at once.)`;
}

export function buildCoachingPrompt(user: DealMindUser): string {
  const copilotName = user.copilot_name || 'Coach';
  const now = new Date();
  const currentDateTime = now.toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  });
  const roleCtx = user.user_role ? getRoleAIContext(user.user_role) : '';
  const nicheRole = user.user_role || user.role || 'agent';

  return `You are a real estate business coach and mentor — the user has named you ${copilotName}.
You have 20+ years of experience coaching investors and agents across all real estate niches.
Your role is TEACHING and ADVISING. You do NOT manage pipelines or take actions — you educate.
${roleCtx ? `\nNICHE CONTEXT — this student specializes in:\n${roleCtx}\n` : ''}
CURRENT DATE & TIME: ${currentDateTime}
STUDENT: ${user.user_name || 'Unknown'} | Niche: ${nicheRole} | Market: ${user.city || 'Unknown'}
Stage: ${user.stage || 'unknown'} | CRM: ${user.crm || 'none'}
Tone preference: ${user.tone_description || 'Direct, tactical, no fluff'}

YOUR COACHING PHILOSOPHY:
- You adapt ALL advice to the student's specific niche (${nicheRole}), their market, and their stage.
- When asked for a script — you write the FULL script, copy-paste ready. Never just an outline.
- When asked for a process — you give a numbered step-by-step framework.
- When asked for strategy — you give ONE clear recommendation, then explain the reasoning.
- When you need context — you ask ONE sharp question, not a list.
- You challenge limiting assumptions. Good coaches do that.
- You give REAL numbers and benchmarks — not vague ranges.

COACHING RULES:
1. TEACH the principle behind every tactic so the student understands why, not just what.
2. Be SPECIFIC: reference their niche (${nicheRole}), city (${user.city || 'their market'}), and stage in your answers.
3. Scripts must be COMPLETE and immediately usable — no placeholders except [Name] and [Property].
4. Responses should be proportional: concise for quick questions, thorough for strategy and scripts.
5. Never use hollow filler: "Great question!", "Absolutely!", "Certainly!" — get straight to the point.
6. End any response longer than 3 paragraphs with a bold "Coach's Challenge:" — one concrete action they can take in the next 24 hours.
7. You do NOT add leads, update pipeline stages, or schedule calendar events — tell them to use Pilot (the other tab) for those actions.
8. When discussing lead generation, always cover: effort level, expected timeline, cost range, and best fit for their niche.
9. When giving follow-up scripts, label each one by channel (SMS / Voicemail / Email) and situation.
10. You are their most knowledgeable, direct, and honest advisor — act like it.`;
}

// ─── Tool definitions ────────────────────────────────────────

export const COPILOT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'add_lead',
    description: 'Add a new lead to the user\'s pipeline. Call this whenever the user shares info about a new prospect or seller.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name:       { type: 'string', description: 'Full name of the lead/owner' },
        property:   { type: 'string', description: 'Property address' },
        stage:      { type: 'string', enum: ['New', 'Contacted', 'Negotiating', 'Under Contract', 'Closed', 'Dead'], description: 'Pipeline stage' },
        motivation: { type: 'string', enum: ['High', 'Medium', 'Low'], description: 'Seller motivation level' },
        phone:      { type: 'string' },
        email:      { type: 'string' },
        notes:      { type: 'string', description: 'Any notes from the conversation' },
      },
      required: ['name'],
    },
  },
  {
    name: 'update_lead',
    description: 'Update an existing lead\'s stage, motivation, notes, or contact info.',
    input_schema: {
      type: 'object' as const,
      properties: {
        lead_id:    { type: 'string', description: 'The lead id from the pipeline list above' },
        lead_name:  { type: 'string', description: 'Name of the lead (used if id unknown)' },
        stage:       { type: 'string', enum: ['New', 'Contacted', 'Negotiating', 'Under Contract', 'Closed', 'Dead'] },
        motivation:  { type: 'string', enum: ['High', 'Medium', 'Low'] },
        notes:       { type: 'string' },
        phone:       { type: 'string' },
        email:       { type: 'string' },
        property:    { type: 'string' },
        deal_value:  { type: 'number', description: 'Estimated deal value in dollars' },
      },
      required: [],
    },
  },
  {
    name: 'log_contact',
    description: 'Log that the user just contacted a lead (call, text, email). Resets their last_contact counter to 0 and appends a note.',
    input_schema: {
      type: 'object' as const,
      properties: {
        lead_id:   { type: 'string' },
        lead_name: { type: 'string' },
        note:      { type: 'string', description: 'What happened in the contact' },
      },
      required: [],
    },
  },
  {
    name: 'mark_lead_dead',
    description: 'Mark a lead as dead/inactive when they are no longer interested or deal fell through.',
    input_schema: {
      type: 'object' as const,
      properties: {
        lead_id:   { type: 'string' },
        lead_name: { type: 'string' },
        reason:    { type: 'string' },
      },
      required: [],
    },
  },
  {
    name: 'add_calendar_event',
    description: 'Add a follow-up, appointment, or deadline to the user\'s calendar. If Google Calendar is connected, this creates a REAL event on their Google Calendar and also tracks it in the pipeline; otherwise it is tracked in the pipeline only.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title:      { type: 'string' },
        event_date: { type: 'string', description: 'ISO 8601 datetime in the user\'s LOCAL time with NO timezone offset and NO Z, e.g. 2026-06-24T18:00:00 for 6 PM. The system converts it to the user\'s timezone automatically — do NOT convert to UTC yourself.' },
        event_type: { type: 'string', description: 'follow_up, appointment, deadline, etc.' },
        lead_name:  { type: 'string', description: 'Associated lead name if any' },
      },
      required: ['title', 'event_date'],
    },
  },
  {
    name: 'delete_calendar_event',
    description: 'Delete an event from the user\'s calendar by its title. Use when the user asks to delete/remove/cancel an event, or to remove a DUPLICATE. If duplicates of the same title exist, this keeps one and removes the extras. To RESCHEDULE: delete the wrong event with this, then add the corrected one with add_calendar_event — never leave a duplicate behind.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'The title (or part of it) of the event to delete.' },
      },
      required: ['title'],
    },
  },
  {
    name: 'text_lead',
    description: 'Draft or send an SMS to a lead through the user\'s connected GoHighLevel account. Requires GHL connected and a phone number on the lead. ALWAYS call this first WITHOUT confirmed (or confirmed=false) to produce a draft — the system returns the draft for the user to review. Only after the user explicitly approves the exact wording, call it again with confirmed=true to actually send. NEVER include placeholders like [Your Name] or [Your Company] — use the real sender name/company from the SIGNATURE section. The system will reject any message containing brackets or placeholders.',
    input_schema: {
      type: 'object' as const,
      properties: {
        lead_id:   { type: 'string', description: 'The lead id from the pipeline list above' },
        lead_name: { type: 'string', description: 'Name of the lead (used if id unknown)' },
        message:   { type: 'string', description: 'The exact SMS text. Under 320 chars, personal, fully filled in — no placeholders or brackets.' },
        confirmed: { type: 'boolean', description: 'Leave false/omitted to draft. Set true ONLY after the user has explicitly approved this exact message.' },
      },
      required: ['message'],
    },
  },
  {
    name: 'create_task',
    description: 'Create a to-do / task in the user\'s LOCAL Pilot Tasks list (e.g. "Send Mike the buyer agreement"). Tasks live inside Pilot only and are shown in the Tasks menu — they are NEVER sent to GoHighLevel. Use this whenever the user wants a task, reminder, or to-do tracked. (GoHighLevel is only used for lead pipeline, contacts, and texting — not tasks.) For a timed appointment or meeting that belongs on the calendar, use add_calendar_event instead.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title:     { type: 'string', description: 'Short task title, e.g. "Send buyer agreement to Mike"' },
        lead_name: { type: 'string', description: 'Associated lead name if any' },
        due_date:  { type: 'string', description: 'Optional ISO 8601 datetime the task is due, e.g. 2026-06-04T14:00:00. Omit if there is no specific due time.' },
      },
      required: ['title'],
    },
  },
  {
    name: 'read_email',
    description: 'Read the user\'s recent Gmail inbox messages (sender, subject, date, and a short snippet). Use when the user asks what\'s in their email, their most important emails, or to look for messages from a specific person. Requires Gmail connected in Connectors. You can pass a Gmail search query (e.g. "from:john", "is:unread", "newer_than:2d").',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Optional Gmail search query. Defaults to the inbox. Examples: "is:unread", "from:name@x.com", "newer_than:1d".' },
        max:   { type: 'number', description: 'How many messages to fetch (default 10, max 20).' },
      },
      required: [],
    },
  },
  {
    name: 'read_calendar',
    description: 'Read the user\'s upcoming Google Calendar events. Use when the user asks what\'s on their calendar, their schedule for the day/week, or upcoming appointments. Requires Google Calendar connected in Connectors.',
    input_schema: {
      type: 'object' as const,
      properties: {
        days: { type: 'number', description: 'How many days ahead to look (default 7).' },
      },
      required: [],
    },
  },
  {
    name: 'read_ghl_messages',
    description: 'Read the user\'s recent GoHighLevel (CRM) text/SMS conversations — who messaged, what they said, and read/unread status. Use this when the user asks about a person or message that is NOT in their lead pipeline (e.g. "who is Troy?", "what did the cash buyer say?", "did anyone text me back?"). Requires GoHighLevel connected in Connectors.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Optional name or phone fragment to filter conversations by (e.g. "Troy", "341").' },
      },
      required: [],
    },
  },
  {
    name: 'complete_task',
    description: 'Mark one of the user\'s open tasks as done. Use during a morning check-in, or whenever the user says they finished/completed/handled a task. Match by the task title (or part of it).',
    input_schema: {
      type: 'object' as const,
      properties: {
        task: { type: 'string', description: 'The title (or part of it) of the open task to mark complete.' },
      },
      required: ['task'],
    },
  },
  {
    name: 'remember',
    description: 'Save a lasting instruction or preference from the user so you follow it in EVERY future conversation. Call this whenever the user corrects your behavior or says "don\'t do that again", "always…", "never…", or "remember that…". Keep each note short and specific (one sentence).',
    input_schema: {
      type: 'object' as const,
      properties: {
        note: { type: 'string', description: 'The instruction to remember, in one short sentence (e.g. "Never create a new lead when I ask to add a note").' },
      },
      required: ['note'],
    },
  },
];

export async function callClaude(
  systemPrompt: string,
  messages: Array<Pick<ChatMessage, 'role' | 'content'>>
): Promise<string> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1000,
    system: systemPrompt,
    messages: messages.map(m => ({ role: m.role, content: m.content }))
  });
  const block = response.content.find(b => b.type === 'text');
  return block && block.type === 'text' ? block.text : '';
}

// ─── Haiku helpers (cheap structured tasks) ──────────────────

export async function callHaiku(prompt: string, maxTokens = 600): Promise<string> {
  const response = await anthropic.messages.create({
    model: HAIKU_MODEL,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });
  const block = response.content.find(b => b.type === 'text');
  return block?.type === 'text' ? block.text : '';
}

export async function enrichLeadWithHaiku(lead: {
  name: string; property?: string | null; notes?: string | null;
  stage?: string; motivation?: string; phone?: string | null;
}): Promise<{
  follow_up_sms: string[];
  follow_up_email: string;
  next_action: string;
  motivation_signals: string[];
  urgency: 'high' | 'medium' | 'low';
  enriched_at: string;
}> {
  const prompt = `You are a real estate investment analyst. Analyze this lead and return ONLY valid JSON.

LEAD:
Name: ${lead.name}
Property: ${lead.property || 'unknown'}
Stage: ${lead.stage || 'New'}
Motivation: ${lead.motivation || 'Unknown'}
Notes: ${lead.notes || 'none'}

Return this exact JSON structure:
{
  "follow_up_sms": ["<under 160 chars, personal and direct>", "<different angle>", "<urgency-based>"],
  "follow_up_email": "<2-3 sentence email body only, no subject>",
  "next_action": "<single most important action to take right now>",
  "motivation_signals": ["<positive or negative signal from the notes>"],
  "urgency": "<high|medium|low based on their situation>"
}

Rules: SMS messages must be under 160 chars. Use the lead's name. Be specific to their situation. Return ONLY JSON.`;

  const raw = await callHaiku(prompt, 500);
  const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(clean);
  return { ...parsed, enriched_at: new Date().toISOString() };
}

// ─── Daily brief: split Haiku (todos) + Sonnet (personality) ──

const normPhone = (s?: string | null) => (s || '').replace(/\D/g, '').slice(-10);

export interface BriefNarrative {
  greeting: string;
  focus: string;
  insight: string;
  prospecting: { action: string; detail: string }[];
}

export async function buildDailyBriefSplit(
  profile: DealMindUser,
  leads: Lead[],
  calendar: CalendarEvent[],
  ghlContext?: GhlBriefContext | null,
  tasks: CalendarEvent[] = [],
  cachedNarrative?: BriefNarrative | null,
  wins?: YesterdayWins | null,
): Promise<any> {
  const active     = leads.filter(l => !l.is_dead);
  const now        = new Date();
  const hour       = now.getHours();
  const timeOfDay  = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const todayStr   = now.toDateString();
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const in48h      = new Date(now.getTime() + 48 * 3600 * 1000);

  // ── Top priority leads — deterministic, top 10 by AI score ──
  const priorityLeads = [...active]
    .map(l => {
      const reasons: string[] = [];
      if (l.motivation === 'High')               reasons.push('high motivation');
      if (l.last_contact === 0)                  reasons.push('contacted today');
      else if (l.last_contact >= 7)              reasons.push(`${l.last_contact}d no contact`);
      if (l.ai_enrichment?.urgency === 'high')   reasons.push('AI: urgent');
      return {
        id: l.id, name: l.name, score: scoreLead(l), stage: l.stage,
        reason: reasons.join(' · ') || l.stage,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  // ── Tasks — deterministic (due today vs overdue) ──
  const fmtTask = (t: CalendarEvent) => ({
    id: t.id, title: t.title,
    due: t.event_date ? new Date(t.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
  });
  const openTasks     = tasks.filter(t => !t.completed_at);
  const tasksDueToday = openTasks.filter(t => t.event_date && new Date(t.event_date).toDateString() === todayStr).map(fmtTask);
  const tasksOverdue  = openTasks.filter(t => t.event_date && new Date(t.event_date) < startOfDay).map(fmtTask);

  // ── Appointments — in-app events (next 48h) + GHL booked ──
  const appointments: { title: string; when: string; source: 'app' | 'ghl' }[] = calendar
    .filter(c => (c as any).event_type !== 'task' && !c.completed_at && c.event_date
      && new Date(c.event_date) >= startOfDay && new Date(c.event_date) <= in48h)
    .map(c => ({
      title: c.title,
      when: new Date(c.event_date).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' }),
      source: 'app' as const,
    }));

  // ── GHL inbox — ONLY when GHL is connected (otherwise omitted entirely) ──
  const ghlReplies: { name: string; lead: string; message: string; unread: boolean }[] = [];
  const ghlHeadsUp: { name: string; message: string; unread: boolean }[] = [];
  if (ghlContext) {
    for (const c of ghlContext.conversations.filter(c => c.direction === 'inbound')) {
      const cp = normPhone(c.phone);
      const n  = c.name.toLowerCase().trim();
      const lead = (cp ? active.find(l => normPhone(l.phone) === cp) : undefined)
        || (n && n !== 'unknown'
          ? active.find(l => l.name && (l.name.toLowerCase().includes(n) || n.includes(l.name.toLowerCase())))
          : undefined);
      if (lead) ghlReplies.push({ name: c.name, lead: lead.name, message: c.lastMessage, unread: c.unread });
      else      ghlHeadsUp.push({ name: c.name, message: c.lastMessage, unread: c.unread });
    }
    for (const a of ghlContext.appointments.slice(0, 10)) {
      appointments.push({ title: `${a.title}${a.contactName ? ` — ${a.contactName}` : ''}`, when: a.startTime, source: 'ghl' });
    }
  }

  // ── Narrative (LLM, Haiku) — greeting/focus/insight/prospecting; cached per day ──
  const copilotName = profile.copilot_name || 'Pilot';
  let narrative: BriefNarrative | null = cachedNarrative ?? null;

  if (!narrative) {
    const ghlSummary = ghlContext ? `
GHL REPLIES FROM YOUR LEADS: ${ghlReplies.length === 0 ? 'none' : ghlReplies.map(r => `${r.lead}${r.unread ? ' (UNREAD)' : ''}: "${r.message.slice(0, 80)}"`).join(' | ')}
GHL MESSAGES NOT IN PIPELINE (heads-up only — do NOT treat as leads): ${ghlHeadsUp.length === 0 ? 'none' : ghlHeadsUp.map(h => `${h.name}${h.unread ? ' (UNREAD)' : ''}: "${h.message.slice(0, 80)}"`).join(' | ')}` : '';

    const prompt = `You are ${copilotName}, an elite real estate AI assistant writing today's brief for ${profile.user_name || 'the agent'} (${profile.role || 'investor'}${profile.city ? `, ${profile.city}` : ''}). It is ${timeOfDay}.

PIPELINE: ${active.length} active leads.
TOP PRIORITY LEADS: ${priorityLeads.slice(0, 6).map(p => `${p.name} (score ${p.score}, ${p.stage}, ${p.reason})`).join(' | ') || 'none'}
TASKS DUE TODAY: ${tasksDueToday.length} | OVERDUE: ${tasksOverdue.length}${tasksOverdue.length ? ` (${tasksOverdue.map(t => t.title).slice(0, 4).join(', ')})` : ''}
APPOINTMENTS (next 48h): ${appointments.length}${appointments.length ? ` (${appointments.map(a => a.title).slice(0, 4).join(', ')})` : ''}${ghlSummary}

Return ONLY valid JSON:
{
  "greeting": "one energetic sentence greeting ${profile.user_name || 'them'} by name and setting today's tone",
  "focus": "one sentence naming the single #1 priority today, chosen from the data above${ghlContext ? ' — an UNREAD GHL reply or a booked appointment outranks everything' : ''}",
  "insight": "one sharp tactical insight referencing real names/numbers above",
  "prospecting": [ { "action": "specific lead-gen activity", "detail": "how to do it" } ]
}
Rules: 2-3 prospecting items, use real lead names. Return ONLY JSON.`;

    const raw = await callHaiku(prompt, 600);
    try {
      narrative = JSON.parse(raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    } catch { narrative = null; }
  }

  if (!narrative) {
    narrative = {
      greeting: `Good ${timeOfDay}${profile.user_name ? `, ${profile.user_name.split(' ')[0]}` : ''}! Let's make today count.`,
      focus: tasksOverdue.length
        ? `Clear your ${tasksOverdue.length} overdue task${tasksOverdue.length > 1 ? 's' : ''} first.`
        : priorityLeads[0]
          ? `Follow up with ${priorityLeads[0].name} — your hottest lead right now.`
          : 'Review your pipeline and reach out to a cold lead.',
      insight: 'Consistent outreach beats perfect timing every time.',
      prospecting: [],
    };
  }

  return {
    greeting: narrative.greeting,
    focus: narrative.focus,
    insight: narrative.insight,
    prospecting: narrative.prospecting || [],
    priorityLeads,
    tasksDueToday,
    tasksOverdue,
    appointments,
    ghlReplies,
    ghlHeadsUp,
    ghlConnected: !!ghlContext,
    wins: wins || { completedTasks: [], appointments: [], stageMoves: [] },
  };
}
