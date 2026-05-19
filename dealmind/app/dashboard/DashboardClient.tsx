'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { AIAvatar } from '@/components/AIAvatar';
import { Icon } from '@/components/Icon';
import type { DealMindUser, Lead, ChatMessage, CalendarEvent } from '@/types';
import { DailyIntel } from './DailyIntel';
import { CopilotChat } from './CopilotChat';
import { MyLeads } from './MyLeads';
import { EndOfDay } from './EndOfDay';

type Tab = 'intel' | 'copilot' | 'leads' | 'eod';

interface Props {
  profile: DealMindUser;
  initialLeads: Lead[];
  initialMessages: ChatMessage[];
  initialCalendar: CalendarEvent[];
}

export default function DashboardClient({ profile, initialLeads, initialMessages, initialCalendar }: Props) {
  const [tab, setTab] = useState<Tab>('intel');
  const [leads, setLeads] = useState(initialLeads);
  const [messages, setMessages] = useState(initialMessages);
  const supabase = createSupabaseBrowserClient();

  const copilotName = profile.copilot_name || 'Copilot';

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <main style={{ minHeight: '100vh' }}>
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px', borderBottom: '1px solid var(--border)',
        background: 'var(--surface)'
      }}>
        <AIAvatar name={copilotName} />
        <button className="btn btn-ghost" onClick={signOut} style={{ padding: '8px 12px' }}>
          <Icon name="logout" size={16} /> Sign out
        </button>
      </header>

      <nav style={{
        display: 'flex', gap: 4, padding: '0 24px',
        borderBottom: '1px solid var(--border)', overflowX: 'auto'
      }}>
        {([
          ['intel',   'Daily Intel',  'spark'],
          ['copilot', `Ask ${copilotName}`, 'send'],
          ['leads',   'My Leads',     'pipeline'],
          ['eod',     'EOD',          'calendar']
        ] as Array<[Tab, string, any]>).map(([key, label, icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: '14px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${tab === key ? 'var(--accent)' : 'transparent'}`,
              color: tab === key ? 'var(--text)' : 'var(--muted)',
              fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            <Icon name={icon} size={16} /> {label}
          </button>
        ))}
      </nav>

      <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
        {tab === 'intel'   && <DailyIntel profile={profile} leads={leads} calendar={initialCalendar} />}
        {tab === 'copilot' && <CopilotChat profile={profile} messages={messages} setMessages={setMessages} />}
        {tab === 'leads'   && <MyLeads profile={profile} leads={leads} setLeads={setLeads} />}
        {tab === 'eod'     && <EndOfDay profile={profile} leads={leads} />}
      </div>
    </main>
  );
}
