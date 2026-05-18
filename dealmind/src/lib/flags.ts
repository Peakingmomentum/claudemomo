import type { FlagType, DealMindUser } from '@/types';
import { createSupabaseAdminClient } from './supabase/server';

interface FlagPayload {
  type: FlagType;
  user: Pick<DealMindUser,
    'id' | 'email' | 'user_name' | 'role' | 'city' | 'stage' | 'lead_count' | 'crm'
  >;
  context?: Record<string, unknown>;
}

const SLACK_MESSAGES: Record<FlagType, (u: FlagPayload['user']) => string> = {
  NO_CRM:       u => `🚨 New DealMind user with NO CRM — warm lead for Warm Follow\n*${u.user_name}* | ${u.role} | ${u.city} | ${u.lead_count} leads`,
  CRM_NOT_USED: u => `⚠️ DealMind user barely uses their CRM — warm lead for agency\n*${u.user_name}* | CRM: ${u.crm} | ${u.city}`,
  NO_WEBSITE:   u => `🌐 DealMind user has NO WEBSITE — flag for website creation outreach\n*${u.user_name}* | ${u.role} | ${u.city}`,
  HIGH_LEAD_COUNT: u => `📈 DealMind user has a HIGH LEAD COUNT — potential team/agency upsell\n*${u.user_name}* | ${u.role} | ${u.city} | ${u.lead_count} leads`
};

export async function flagInternal({ type, user, context = {} }: FlagPayload) {
  const supabase = createSupabaseAdminClient();

  const flagRow = {
    flag_type:  type,
    user_id:    user.id,
    user_email: user.email,
    user_name:  user.user_name,
    data: {
      ...context,
      role:    user.role,
      market:  user.city,
      stage:   user.stage,
      leads:   user.lead_count,
      crm:     user.crm,
      timestamp: new Date().toISOString()
    }
  };

  await supabase.from('internal_flags').insert(flagRow);

  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: SLACK_MESSAGES[type](user) })
      });
    } catch {
      // Slack failures should not block onboarding.
    }
  }

  if (process.env.INTERNAL_ALERT_EMAIL && process.env.RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'DealMind Alerts <alerts@dealmind.ai>',
          to: process.env.INTERNAL_ALERT_EMAIL,
          subject: `[DealMind Flag] ${type} — ${user.user_name}`,
          text: SLACK_MESSAGES[type](user) + `\n\nContext:\n${JSON.stringify(flagRow.data, null, 2)}`
        })
      });
    } catch {
      // Email failures should not block onboarding.
    }
  }
}
