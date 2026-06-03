import Anthropic from '@anthropic-ai/sdk';
import type { DealMindUser, Lead, CalendarEvent, ChatMessage } from '@/types';

const MODEL       = 'claude-sonnet-4-6';          // current Sonnet 4.6
const HAIKU_MODEL = 'claude-haiku-4-5-20251001';  // current Haiku 4.5

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!
});

export function buildSystemPrompt(
  user: DealMindUser,
  leads: Lead[],
  calendar: CalendarEvent[]
): string {
  const urgent = leads.filter(l => !l.is_dead && l.last_contact >= 7);
  const hot    = leads.filter(l => !l.is_dead && l.motivation === 'High');
  const active = leads.filter(l => !l.is_dead);
  const copilotName = user.copilot_name || 'Copilot';

  const now = new Date();
  const currentDateTime = now.toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
  });

  return `You are Pocket Pilot Copilot — the user has named you "${copilotName}".
You are a Jarvis-style AI mentor and business partner for real estate professionals.
You have REAL TOOLS that write directly to the user's pipeline and calendar — use them whenever the user shares lead info or asks you to take action.

CURRENT DATE & TIME: ${currentDateTime}
USER: ${user.user_name || 'Unknown'} | ${user.role || 'agent'} | ${user.city || 'Unknown'} market
CRM: ${user.crm || 'none'} | Stage: ${user.stage || 'unknown'}

MY LEADS (${active.length} active):
${active.map(l => `• [id:${l.id}] ${l.name} | ${l.property || 'n/a'} | ${l.stage} | Motivation: ${l.motivation} | Last contact: ${l.last_contact}d ago${l.deal_value ? ` | Value: $${l.deal_value.toLocaleString()}` : ''} | ${l.notes || ''}`).join('\n') || '(no leads yet)'}

CALENDAR:
${calendar.map(c => `• ${c.title} — ${c.event_date}`).join('\n') || '(no events)'}

URGENT (7+ days no contact): ${urgent.map(l => l.name).join(', ') || 'none'}
HOT LEADS: ${hot.map(l => l.name).join(', ') || 'none'}

TONE: ${user.tone_description || 'Professional but conversational'}

RULES:
1. Always refer to yourself as ${copilotName}
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
12. If you find yourself about to ask "Can you give me their name?" or "What's the lead's name?" — STOP. Scroll back through the conversation. The name is there. Use it.`;
}

export function buildCoachingPrompt(user: DealMindUser): string {
  const copilotName = user.copilot_name || 'Coach';
  const now = new Date();
  const currentDateTime = now.toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  });

  return `You are a real estate business coach and mentor — the user has named you ${copilotName}.
You have 20+ years of experience coaching both investors and agents to scale their businesses.
Your role is TEACHING and ADVISING. You do NOT manage pipelines or take actions — you educate.

CURRENT DATE & TIME: ${currentDateTime}
STUDENT: ${user.user_name || 'Unknown'} | Role: ${user.role || 'agent'} | Market: ${user.city || 'Unknown'}
Stage: ${user.stage || 'unknown'} | CRM: ${user.crm || 'none'}
Tone preference: ${user.tone_description || 'Direct, tactical, no fluff'}

YOUR COACHING PHILOSOPHY:
- You draw from the full RE playbook: wholesaling, fix-and-flip, creative finance, listings, rentals, commercial.
- You adapt advice to the student's role (${user.role || 'agent'}), their specific market, and their stage.
- When asked for a script — you write the FULL script, copy-paste ready. Never just an outline.
- When asked for a process — you give a numbered step-by-step framework.
- When asked for strategy — you give ONE clear recommendation, then explain the reasoning.
- When you need context — you ask ONE sharp question, not a list.
- You challenge limiting assumptions. Good coaches do that.
- You give REAL numbers and benchmarks — not vague ranges.

COACHING RULES:
1. TEACH the principle behind every tactic so the student understands why, not just what.
2. Be SPECIFIC: reference their role (${user.role || 'agent'}), city (${user.city || 'their market'}), and stage in your answers.
3. Scripts must be COMPLETE and immediately usable — no placeholders except [Name] and [Property].
4. Responses should be proportional: concise for quick questions, thorough for strategy and scripts.
5. Never use hollow filler: "Great question!", "Absolutely!", "Certainly!" — get straight to the point.
6. End any response longer than 3 paragraphs with a bold "Coach's Challenge:" — one concrete action they can take in the next 24 hours.
7. You do NOT add leads, update pipeline stages, or schedule calendar events — tell them to use their AI copilot (the other tab) for those actions.
8. When discussing lead generation, always cover: effort level, expected timeline, cost range, and best fit (investor vs agent).
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
    description: 'Add a follow-up, appointment, or deadline to the user\'s calendar.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title:      { type: 'string' },
        event_date: { type: 'string', description: 'ISO 8601 datetime, e.g. 2026-06-01T10:00:00' },
        event_type: { type: 'string', description: 'follow_up, appointment, deadline, etc.' },
        lead_name:  { type: 'string', description: 'Associated lead name if any' },
      },
      required: ['title', 'event_date'],
    },
  },
  {
    name: 'text_lead',
    description: 'Send a text message (SMS) to a lead through the user\'s connected GoHighLevel account. Only works if the user has connected GHL. Use when the user asks you to text, message, or reach out to a lead by SMS. The lead must have a phone number.',
    input_schema: {
      type: 'object' as const,
      properties: {
        lead_id:   { type: 'string', description: 'The lead id from the pipeline list above' },
        lead_name: { type: 'string', description: 'Name of the lead (used if id unknown)' },
        message:   { type: 'string', description: 'The exact SMS text to send. Keep it under 320 characters and personal.' },
      },
      required: ['message'],
    },
  },
  {
    name: 'create_ghl_task',
    description: 'Create a task or reminder in the user\'s connected GoHighLevel account, attached to a lead (e.g. "Call John tomorrow at 2pm"). Only works if the user has connected GHL. Use when the user wants a call/text reminder tracked in their CRM.',
    input_schema: {
      type: 'object' as const,
      properties: {
        lead_id:   { type: 'string', description: 'The lead id from the pipeline list above' },
        lead_name: { type: 'string', description: 'Name of the lead (used if id unknown)' },
        title:     { type: 'string', description: 'Short task title, e.g. "Call John about offer"' },
        body:      { type: 'string', description: 'Optional task detail/notes' },
        due_date:  { type: 'string', description: 'ISO 8601 datetime when the task is due, e.g. 2026-06-04T14:00:00' },
      },
      required: ['title', 'due_date'],
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

export async function buildDailyBriefSplit(
  profile: DealMindUser,
  leads: Lead[],
  calendar: CalendarEvent[]
): Promise<any> {
  const active    = leads.filter(l => !l.is_dead);
  const urgent    = active.filter(l => l.last_contact >= 7);
  const hot       = active.filter(l => l.motivation === 'High');
  const noContact = active.filter(l => l.last_contact >= 14);
  const now       = new Date();
  const hour      = now.getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const dateStr   = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const context = `
AGENT: ${profile.user_name || 'Agent'} | ${profile.role || 'investor'} | ${profile.city || 'unknown'}
TIME: ${timeOfDay} on ${dateStr}
LEADS (${active.length} active):
${active.slice(0, 20).map(l => `• ${l.name} | ${l.stage} | ${l.motivation} motivation | ${l.last_contact}d no contact${l.notes ? ' | ' + l.notes.slice(0, 60) : ''}`).join('\n') || 'NONE'}
GOING COLD (7+ days): ${urgent.map(l => l.name).join(', ') || 'none'}
DEAD COLD (14+ days): ${noContact.map(l => l.name).join(', ') || 'none'}
HOT LEADS: ${hot.map(l => l.name).join(', ') || 'none'}
CALENDAR TODAY: ${calendar.length === 0 ? 'nothing scheduled' : calendar.map(c => c.title).join(', ')}`;

  // ── Haiku: generate structured todos + prospecting (cheap) ──
  const todosPrompt = `${context}

Generate a prioritized action list for this real estate agent. Return ONLY valid JSON:
{
  "todos": [
    { "priority": "high|medium|low", "time": "9:00 AM", "task": "specific action", "reason": "why now", "lead": "lead name or null" }
  ],
  "prospecting": [
    { "action": "specific activity", "detail": "how to do it" }
  ]
}
Rules: 5-7 todos sorted by priority. Use real lead names. 2-3 prospecting items. Times realistic for ${timeOfDay}. Return ONLY JSON.`;

  // ── Sonnet: generate personality-driven greeting + insight ──
  const copilotName = profile.copilot_name || 'Ace';
  const insightPrompt = `You are ${copilotName}, an elite real estate AI copilot.
${context}

Return ONLY valid JSON:
{
  "greeting": "one energetic sentence greeting ${profile.user_name || 'them'} and setting the tone",
  "focus": "one sentence on the single #1 priority today",
  "insight": "one sharp tactical insight about their pipeline or positioning"
}
Return ONLY JSON.`;

  // Run both in parallel
  const [todosRaw, insightRaw] = await Promise.all([
    callHaiku(todosPrompt, 700),
    anthropic.messages.create({
      model: MODEL, max_tokens: 300,
      messages: [{ role: 'user', content: insightPrompt }],
    }).then(r => (r.content.find(b => b.type === 'text') as any)?.text || '{}'),
  ]);

  let parsedTodos: any = { todos: [], prospecting: [] };
  let parsedInsight: any = {
    greeting: `Good ${timeOfDay}! Let's get to work.`,
    focus: 'Review your pipeline and follow up with any cold leads.',
    insight: 'Consistent outreach beats perfect timing every time.',
  };

  try {
    parsedTodos = JSON.parse(todosRaw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
  } catch { /* keep fallback */ }

  try {
    parsedInsight = JSON.parse(insightRaw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
  } catch { /* keep fallback */ }

  return { ...parsedInsight, ...parsedTodos };
}
