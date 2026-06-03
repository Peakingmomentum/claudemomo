// Pocket Pilot → Slack notifications via Incoming Webhooks
// Docs: https://api.slack.com/messaging/webhooks

export interface SlackLeadEvent {
  type: 'lead_added' | 'lead_updated' | 'lead_dead' | 'stage_change' | 'contact_logged';
  leadName: string;
  property?: string | null;
  stage?: string;
  motivation?: string;
  detail?: string;         // e.g. "stage → Negotiating" or reason for dead
  agentName?: string;      // copilot name
}

function stageColor(stage?: string): string {
  if (!stage) return '#718096';
  if (['Negotiating', 'Under Contract'].includes(stage)) return '#10b981';
  if (stage === 'Contacted') return '#4a90d9';
  if (stage === 'Closed') return '#f59e0b';
  if (stage === 'Dead') return '#ef4444';
  return '#718096';
}

function motivationIcon(motivation?: string): string {
  if (motivation === 'High')   return '🔴';
  if (motivation === 'Medium') return '🟡';
  if (motivation === 'Low')    return '🟢';
  return '⚪';
}

export async function notifySlack(webhookUrl: string, event: SlackLeadEvent): Promise<void> {
  const { type, leadName, property, stage, motivation, detail, agentName } = event;

  const headerText =
    type === 'lead_added'     ? `New lead added` :
    type === 'lead_dead'      ? `Lead marked dead` :
    type === 'stage_change'   ? `Stage updated` :
    type === 'contact_logged' ? `Contact logged` :
                                `Lead updated`;

  const color = type === 'lead_dead' ? '#ef4444' :
                type === 'lead_added' ? '#4a90d9' :
                stageColor(stage);

  const fields: { type: string; text: { type: string; text: string } }[] = [];

  if (property) {
    fields.push({ type: 'mrkdwn', text: { type: 'plain_text', text: property } });
  }
  if (stage) {
    fields.push({
      type: 'mrkdwn',
      text: { type: 'plain_text', text: `Stage: ${stage}` }
    });
  }
  if (motivation) {
    fields.push({
      type: 'mrkdwn',
      text: { type: 'plain_text', text: `Motivation: ${motivationIcon(motivation)} ${motivation}` }
    });
  }

  const body = {
    attachments: [
      {
        color,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${headerText}* — <${leadName}>\n${detail ? `_${detail}_` : ''}`,
            },
          },
          ...(fields.length ? [{
            type: 'section',
            fields: fields.map(f => ({ type: 'mrkdwn', text: f.text.text })),
          }] : []),
          {
            type: 'context',
            elements: [{
              type: 'mrkdwn',
              text: `Pocket Pilot${agentName ? ` · ${agentName}` : ''}`,
            }],
          },
        ],
      },
    ],
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    // Slack notifications are best-effort — never block the main flow
  }
}
