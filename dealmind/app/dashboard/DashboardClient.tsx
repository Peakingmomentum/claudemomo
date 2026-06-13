'use client';

import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { Icon } from '@/components/Icon';
import type { DealMindUser, Lead, ChatMessage, CalendarEvent } from '@/types';
import { useMobile } from '@/hooks/useMobile';
import { DailyIntel } from './DailyIntel';
import { CopilotChat } from './CopilotChat';
import { MyLeads } from './MyLeads';
import { CalendarView } from './CalendarView';
import { Connectors } from './Connectors';
import { Settings } from './Settings';
import { CoachingTab } from './CoachingTab';
import { TasksView } from './TasksView';
import { CalculatorsTab } from './CalculatorsTab';
import { AffiliateTab } from './AffiliateTab';

type Tab = 'intel' | 'copilot' | 'coaching' | 'leads' | 'tasks' | 'calendar' | 'connectors' | 'settings' | 'calculators' | 'affiliate';

interface Props {
  profile: DealMindUser;
  initialLeads: Lead[];
  initialMessages: ChatMessage[];
  initialCalendar: CalendarEvent[];
}

function HudStat({ value, label, color }: { value: any; label: string; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 16, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color }}>{value}</div>
      <div style={{ fontSize: 9, color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</div>
    </div>
  );
}

const DESKTOP_NAV: Array<[Tab, string, any]> = [
  ['intel',       'Daily Intel',  'spark'],
  ['leads',       'Pipeline',     'pipeline'],
  ['tasks',       'Tasks',        'check'],
  ['calendar',    'Calendar',     'calendar'],
  ['calculators', 'Calculators',  'dollar'],
  ['coaching',    'Coaching',     'bulb'],
  ['connectors',  'Connectors',   'link'],
  ['affiliate',   'Affiliate',    'link'],
  ['settings',    'Settings',     'user'],
];

const MOBILE_NAV: Array<[Tab, string, any]> = [
  ['intel',    'Intel',    'spark'],
  ['leads',    'Pipeline', 'pipeline'],
  ['copilot',  'Pilot',    'send'],
  ['coaching', 'Coaching', 'bulb'],
];

// Tabs that live behind the mobile "More" sheet so the bottom bar stays uncluttered
const MORE_NAV: Array<[Tab, string, any]> = [
  ['tasks',       'Tasks',        'check'],
  ['calendar',    'Calendar',     'calendar'],
  ['calculators', 'Calculators',  'dollar'],
  ['affiliate',   'Affiliate',    'link'],
  ['connectors',  'Connectors',   'link'],
  ['settings',    'Settings',     'user'],
];

const PAGE_TITLES: Record<Tab, string> = {
  intel:       'Daily Intel',
  copilot:     'AI Copilot',
  coaching:    'Coaching',
  leads:       'Pipeline',
  tasks:       'Tasks',
  calendar:    'Calendar',
  connectors:  'Connectors',
  settings:    'Settings',
  calculators: 'Calculators',
  affiliate:   'Affiliate',
};

export default function DashboardClient({ profile: initialProfile, initialLeads, initialMessages, initialCalendar }: Props) {
  const [tab, setTab] = useState<Tab>('intel');
  const [leads, setLeads] = useState(initialLeads);
  const [messages, setMessages] = useState(initialMessages);
  const [profile, setProfile] = useState(initialProfile);
  const [calendar, setCalendar] = useState(initialCalendar);
  const [focusLeadId, setFocusLeadId] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [checkinSeed, setCheckinSeed] = useState<string | null>(null);
  const CHECKIN_PROMPT = "Let's do my morning check-in. Celebrate yesterday's wins, then walk me through my open and overdue tasks one at a time — ask what happened with each and log the updates (notes, completed tasks, new follow-ups, appointments) as we go.";

  // Automatic kick-off: once per day, on desktop, Pilot starts the check-in itself.
  // (Mobile is left to the button so we don't yank the user into the chat on load.)
  useEffect(() => {
    if (isMobile) return;
    try {
      const key = `pp-checkin-${profile.id}-${new Date().toISOString().slice(0, 10)}`;
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, '1');
      setCheckinSeed(CHECKIN_PROMPT);
    } catch { /* storage unavailable — skip auto kick-off */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const supabase = createSupabaseBrowserClient();
  const copilotName = profile.copilot_name || 'Pilot';
  const isMobile = useMobile();

  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
    setTheme(stored ?? 'light');
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'));
  }

  const activeLeads = leads.filter(l => !l.is_dead);
  const now = new Date();
  const todayStr = now.toDateString();
  const tasksDueToday = calendar.filter(
    e => !e.completed_at && new Date(e.event_date).toDateString() === todayStr
  ).length;

  const totalPipeline = activeLeads
    .reduce((sum, l) => sum + (l.deal_value || 0), 0)
    .toLocaleString();

  const pageTitle = PAGE_TITLES[tab];

  async function refreshLeads() {
    const { data } = await supabase.from('leads').select('*').eq('user_id', profile.id).eq('is_dead', false);
    if (data) setLeads(data as Lead[]);
  }

  async function refreshCalendar() {
    const { data } = await supabase.from('calendar_events').select('*').eq('user_id', profile.id).order('event_date');
    if (data) setCalendar(data as CalendarEvent[]);
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <div
      className="app-shell"
      style={{ color: 'var(--body)', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", sans-serif' }}
    >

      {/* ── Desktop Sidebar ── */}
      <aside className="sidebar">
        {/* Logo */}
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Pocket Pilot" width={36} height={36} style={{ flexShrink: 0, objectFit: 'contain' }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--text)' }}>Pocket Pilot</div>
            <div style={{ fontSize: 10, color: 'var(--faint)' }}>Real Estate AI</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {DESKTOP_NAV.map(([key, label, icon]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px',
                borderRadius: 8, border: 'none',
                background: tab === key ? 'var(--bg-hover)' : 'none',
                color: tab === key ? 'var(--accent-label)' : 'var(--muted)',
                fontSize: 13, fontWeight: 500, width: '100%', textAlign: 'left', cursor: 'pointer',
                transition: 'all .15s',
              }}
            >
              <Icon name={icon} size={16} />
              {label}
              {key === 'leads' && activeLeads.length > 0 && (
                <span style={{ marginLeft: 'auto', background: '#0f4c81', color: '#fff', fontSize: 10, padding: '1px 6px', borderRadius: 999, fontWeight: 700 }}>
                  {activeLeads.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '12px 10px 20px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={signOut}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
              borderRadius: 8, border: '1px solid var(--border)',
              background: 'none', color: 'var(--muted)', fontSize: 12, fontWeight: 500,
              width: '100%', textAlign: 'left', cursor: 'pointer',
            }}
          >
            <Icon name="logout" size={14} />
            Sign out
          </button>

          {/* Agent pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'var(--accent-soft)', border: '1px solid rgba(15,76,129,.25)', borderRadius: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-label)' }}>{copilotName}</div>
              <div style={{ fontSize: 10, color: 'var(--faint)' }}>Active · Ready</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main column ── */}
      <div className="main-col">

        {/* Header */}
        <header style={{ height: 56, background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0 16px' : '0 24px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 20, minWidth: 0 }}>
            <div style={{ fontSize: isMobile ? 15 : 16, fontWeight: 700, color: 'var(--text)', flexShrink: 0 }}>{pageTitle}</div>
            {!isMobile && (
              <div style={{ display: 'flex', gap: 20 }}>
                <HudStat value={activeLeads.length} label="Active Leads" color="var(--accent-label)" />
                <HudStat value={tasksDueToday} label="Due Today" color="var(--warning)" />
                <HudStat value={`$${totalPipeline}`} label="Pipeline" color="var(--success)" />
              </div>
            )}
            {isMobile && (
              <div style={{ display: 'flex', gap: 12 }}>
                <HudStat value={activeLeads.length} label="Leads" color="var(--accent-label)" />
                <HudStat value={tasksDueToday} label="Today" color="var(--warning)" />
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-pressed={theme === 'dark'}
              style={{ width: 48, height: 26, borderRadius: 999, border: '1.5px solid var(--border-mid)', background: 'var(--bg-hover)', cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', padding: 3, flexShrink: 0 }}
            >
              <div aria-hidden="true" style={{
                width: 18, height: 18, borderRadius: '50%',
                background: 'linear-gradient(135deg, #0f4c81, #4a90d9)',
                transform: theme === 'dark' ? 'translateX(0)' : 'translateX(22px)',
                transition: 'transform .2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9,
              }}>
                {theme === 'dark' ? '🌙' : '☀️'}
              </div>
            </button>
          </div>
        </header>

        {/* Content area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? 12 : 20, minHeight: 0 }}>
          {tab === 'intel'       && <DailyIntel profile={profile} leads={leads} calendar={calendar} onStartCheckin={() => { setCheckinSeed("Let's do my morning check-in. Celebrate yesterday's wins, then walk me through my open and overdue tasks one at a time — ask what happened with each and log the updates (notes, completed tasks, new follow-ups, appointments) as we go."); if (isMobile) setTab('copilot'); }} />}
          {tab === 'leads'       && <MyLeads profile={profile} leads={leads} setLeads={setLeads} calendar={calendar} focusLeadId={focusLeadId} onFocusCleared={() => setFocusLeadId(null)} />}
          {tab === 'tasks'       && <TasksView profile={profile} leads={leads} calendar={calendar} onCalendarChange={refreshCalendar} />}
          {tab === 'coaching'    && <CoachingTab profile={profile} />}
          {tab === 'calendar'    && <CalendarView profile={profile} leads={leads} calendar={calendar} onCalendarChange={refreshCalendar} />}
          {tab === 'connectors'  && <Connectors profile={profile} onProfileUpdate={patch => setProfile(p => ({ ...p, ...patch }))} />}
          {tab === 'settings'    && <Settings profile={profile} />}
          {tab === 'calculators' && <CalculatorsTab profile={profile} />}
          {tab === 'affiliate'   && <AffiliateTab profile={profile} />}
          {isMobile && tab === 'copilot' && (
            <CopilotChat
              profile={profile}
              leads={activeLeads}
              messages={messages}
              setMessages={setMessages}
              onLeadChange={() => { refreshLeads(); refreshCalendar(); }}
              onNavigateToLead={id => { setFocusLeadId(id); setTab('leads'); }}
              seedMessage={checkinSeed}
              onSeedConsumed={() => setCheckinSeed(null)}
            />
          )}
        </div>
      </div>

      {/* ── Desktop AI Panel (right) ── */}
      {!isMobile && (
        <div className="ai-panel">
          {/* AI header */}
          <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt={copilotName} width={32} height={32} style={{ objectFit: 'contain', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{copilotName}</div>
              <div style={{ fontSize: 10, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: '#10b981' }} />
                Online · {activeLeads.length} leads loaded
              </div>
            </div>
          </div>

          {/* CopilotChat fills the rest */}
          <CopilotChat
            profile={profile}
            leads={activeLeads}
            messages={messages}
            setMessages={setMessages}
            onLeadChange={() => { refreshLeads(); refreshCalendar(); }}
            onNavigateToLead={id => { setFocusLeadId(id); setTab('leads'); }}
            embedded
            seedMessage={checkinSeed}
            onSeedConsumed={() => setCheckinSeed(null)}
          />
        </div>
      )}

      {/* ── Mobile "More" sheet ── */}
      {showMore && (
        <div
          onClick={() => setShowMore(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 40, display: 'flex', alignItems: 'flex-end' }}
        >
          <div
            role="dialog"
            aria-label="More navigation"
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', background: 'var(--surface)', borderTop: '1px solid var(--border)', borderRadius: '16px 16px 0 0', padding: '8px 8px calc(8px + env(safe-area-inset-bottom, 0px))' }}
          >
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-mid)', margin: '8px auto 12px' }} />
            {MORE_NAV.map(([key, label, icon]) => (
              <button
                key={key}
                onClick={() => { setTab(key); setShowMore(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '14px 16px',
                  border: 'none', borderRadius: 12, background: tab === key ? 'var(--bg-hover)' : 'none',
                  color: tab === key ? 'var(--accent-label)' : 'var(--text)',
                  fontSize: 15, fontWeight: 500, cursor: 'pointer', textAlign: 'left',
                }}
              >
                <Icon name={icon} size={20} />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Mobile bottom nav ── */}
      <nav className="bottom-nav" aria-label="Primary">
        {MOBILE_NAV.map(([key, label, icon]) => (
          <button
            key={key}
            onClick={() => { setTab(key); setShowMore(false); }}
            aria-label={label}
            aria-current={tab === key ? 'page' : undefined}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '6px 4px', border: 'none', background: 'none',
              color: tab === key ? 'var(--accent)' : 'var(--muted)',
              fontSize: 10, fontWeight: 500, borderRadius: 10, cursor: 'pointer',
            }}
          >
            <Icon name={icon} size={22} />
            {label}
          </button>
        ))}
        {(() => {
          const moreActive = MORE_NAV.some(([k]) => k === tab);
          return (
            <button
              onClick={() => setShowMore(s => !s)}
              aria-label="More"
              aria-expanded={showMore}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '6px 4px', border: 'none', background: 'none',
                color: moreActive || showMore ? 'var(--accent)' : 'var(--muted)',
                fontSize: 10, fontWeight: 500, borderRadius: 10, cursor: 'pointer',
              }}
            >
              <Icon name="menu" size={22} />
              More
            </button>
          );
        })()}
      </nav>

    </div>
  );
}
