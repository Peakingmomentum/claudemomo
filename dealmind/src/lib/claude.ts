import Anthropic from '@anthropic-ai/sdk';
import type { DealMindUser, Lead, CalendarEvent, ChatMessage } from '@/types';

const MODEL = 'claude-sonnet-4-20250514';

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

  return `You are DealMind Copilot — the user has named you "${copilotName}".
You are a Jarvis-style AI mentor and business partner for real estate professionals.

USER: ${user.user_name || 'Unknown'} | ${user.role || 'agent'} | ${user.city || 'Unknown'} market
CRM: ${user.crm || 'none'} | Stage: ${user.stage || 'unknown'}

MY LEADS (${active.length} active):
${active.map(l => `• ${l.name} | ${l.property || 'n/a'} | ${l.stage} | Last contact: ${l.last_contact}d ago | ${l.notes || ''}`).join('\n') || '(no leads yet)'}

CALENDAR:
${calendar.map(c => `• ${c.title} — ${c.event_date}`).join('\n') || '(no events)'}

URGENT (7+ days): ${urgent.map(l => l.name).join(', ') || 'none'}
READY TO CLOSE: ${hot.map(l => l.name).join(', ') || 'none'}

TONE: ${user.tone_description || 'Professional but conversational'}

RULES:
1. Always refer to yourself as ${copilotName}
2. Remember everything about their leads and conversations
3. Proactively surface leads going cold
4. Mentor not just answer — real strategic advice
5. End every response with one clear Next Move`;
}

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
