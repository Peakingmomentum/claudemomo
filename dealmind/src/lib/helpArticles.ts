// In-app documentation. Plain-text bodies (rendered with line breaks + simple
// bullets) so a new user can learn the whole product without leaving the app.

export interface HelpArticle {
  id: string;
  category: string;
  title: string;
  body: string;
  tour?: string; // optional area-tour key (see src/lib/tours.ts)
}

export const HELP_CATEGORIES = ['Getting Started', 'Leads & Pipeline', 'Pilot (AI)', 'Daily Workflow', 'Tools', 'Growth', 'Account'];

export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'quick-start', category: 'Getting Started', title: 'Quick start — your first win',
    body:
`Pocket Pilot is your AI real-estate copilot. The fastest way to feel it work:

1. Open the chat with Pilot (the panel on the right, or the Pilot tab on mobile).
2. Type a lead in plain English, e.g. "Add John Smith, motivated seller, 555-1234".
3. Press Enter. Pilot adds the lead to your pipeline instantly.
4. Open the Pipeline tab — your new lead is there.

That's it — you just used the AI to do real work. From here, talk to Pilot the way you'd talk to an assistant.`,
    tour: 'copilot',
  },
  {
    id: 'getting-started-checklist', category: 'Getting Started', title: 'The Getting Started checklist',
    body:
`On the Daily Intel tab you'll see a short checklist. Finishing it gets you set up in minutes:

- Add your first lead (via Pilot or the Add lead button).
- Set your outreach identity (Settings) so texts are signed correctly.
- Try the Copilot — ask it anything.
- Connect Google or GoHighLevel (optional, unlocks email/calendar/texting).

The checklist ticks itself off as you go and disappears once you're set up.`,
  },
  {
    id: 'pipeline-views', category: 'Leads & Pipeline', title: 'List vs Board view',
    body:
`Your Pipeline tab has two views — toggle at the top, and your choice is remembered:

- LIST: a scrollable directory of every lead. Sort by score, latest activity, or A–Z.
- BOARD: a temperature funnel with 5 columns — New Lead → Cold → Warm → Hot → Closed.

On the Board, change a lead's stage with the dropdown on its card. Click a card to open its full detail.`,
    tour: 'pipeline',
  },
  {
    id: 'lead-card', category: 'Leads & Pipeline', title: 'Working a lead',
    body:
`Click a lead (in List, or a Board card) to expand it. There you can:

- Set Status (New / Cold / Warm / Hot / Closed) and Motivation (Unknown / Low / Medium / High).
- Add notes to the Activity Log — every note is timestamped.
- Edit phone, email, property, and deal value.

The Lead Score (0–100) is computed from motivation, stage, recency, AI urgency, notes activity, and contact info — higher = hotter.`,
  },
  {
    id: 'archive-restore', category: 'Leads & Pipeline', title: 'Archiving & restoring leads',
    body:
`Nothing is ever lost by accident:

- "Mark dead" or "Delete" ARCHIVES a lead (soft delete) — it leaves your active pipeline but is kept.
- Open the Archived view (🗄 button on the Pipeline tab) to see archived leads.
- Restore any of them with one click (they come back as a New Lead).
- Permanent deletion is a separate, confirm-gated action inside the Archived view.`,
  },
  {
    id: 'pilot-basics', category: 'Pilot (AI)', title: 'What Pilot can do',
    body:
`Pilot is an agentic copilot — it takes real actions, not just chats. Examples:

- "Add Sarah, 555-0100, high motivation" → creates the lead.
- "Move Rebecca to Hot" → updates her stage.
- "I just called John, he wants a callback Friday at 2pm" → logs the contact and schedules it.
- "Text John a follow-up" → drafts a message (you approve before it sends).
- "What should I do today?" → prioritizes your pipeline.

Tip: press Enter to send, Shift+Enter for a new line, and tap 🎤 to talk instead of type.`,
    tour: 'copilot',
  },
  {
    id: 'pilot-memory', category: 'Pilot (AI)', title: 'Pilot remembers your rules',
    body:
`Tell Pilot a preference and it keeps it forever — across every future chat:

- "Remember: never create a new lead when I ask to add a note."
- "Always confirm before texting anyone."
- "Don't do that again."

Pilot saves the instruction and follows it from then on. This is per-account and private to you.`,
  },
  {
    id: 'draft-first', category: 'Pilot (AI)', title: 'Texting safety (draft-first)',
    body:
`When Pilot texts a lead through GoHighLevel, it never sends without you:

1. Pilot shows you the exact draft message.
2. You review it.
3. Only after you clearly approve does it send.

It will also never send a message containing placeholders like [Your Name]. Set your real name and company in Settings → outreach identity so messages sign correctly.`,
  },
  {
    id: 'daily-intel', category: 'Daily Workflow', title: 'Daily Intel briefing',
    body:
`The Daily Intel tab is your morning command center:

- Top Priority Leads (your 10 highest-scoring active leads).
- Tasks: due today and overdue.
- Appointments in the next 48 hours.
- Yesterday's Wins: tasks completed, appointments held, and stage moves.
- Pilot's insight + lead-gen suggestions.

Hit Refresh to regenerate it.`,
    tour: 'intel',
  },
  {
    id: 'morning-checkin', category: 'Daily Workflow', title: 'The morning check-in',
    body:
`Click "Start Morning Check-in" on Daily Intel (Pilot also starts it automatically once a day on desktop).

Pilot celebrates yesterday's wins, then walks you through your open tasks ONE at a time, asking what happened. As you answer, it logs notes, checks off finished tasks, creates follow-ups, and schedules appointments — so your pipeline stays current with zero busywork.`,
  },
  {
    id: 'tasks-calendar', category: 'Daily Workflow', title: 'Tasks & Calendar',
    body:
`Tasks: your to-do list. Filter by All / Pending / Completed. Pilot can create and complete tasks for you.

Calendar: your appointments and follow-ups. If you connect Google Calendar, real events sync in automatically, and Pilot can book events straight to your Google Calendar.`,
  },
  {
    id: 'calculators', category: 'Tools', title: 'Calculators',
    body:
`Role-specific deal calculators that compute live as you type. Depending on your niche you'll see things like ARV / max offer, cap rate, cash-on-cash, DSCR, commission splits, and break-even occupancy. Pick your niche in Settings to tailor them.`,
    tour: 'calculators',
  },
  {
    id: 'connectors', category: 'Tools', title: 'Connectors (Google & GoHighLevel)',
    body:
`Connectors tab links your tools:

- GoHighLevel: paste a Private Integration token + Location ID. Lets Pilot text leads and create CRM tasks, and feeds replies/appointments into your brief.
- Google (Gmail + Calendar): connect to let Pilot read your inbox and read/create calendar events.

Each connector shows a "Connected" badge when it's set.`,
  },
  {
    id: 'coaching', category: 'Tools', title: 'Coaching',
    body:
`The Coaching tab is your on-demand mentor. Pick a category (scripts, objection handling, negotiation, marketing, etc. — tailored to your niche) and get tactical, real-estate-specific guidance. Unlike Pilot, Coaching is advice-only — it doesn't change your pipeline.`,
  },
  {
    id: 'affiliate', category: 'Growth', title: 'Affiliate program',
    body:
`Earn 30% recurring commission. Share your referral link from the Affiliate tab — every paying subscriber you refer pays you 30% of their subscription monthly, for as long as they stay. Track referrals, active subscribers, and estimated earnings right there.`,
    tour: 'affiliate',
  },
  {
    id: 'white-label', category: 'Growth', title: 'White-label / brand',
    body:
`In Settings → White Label you can brand Pocket Pilot for your team or brokerage: set your brand name, logo, primary color, and a custom domain. Invite teammates by email. Point a CNAME from your domain to cname.vercel-dns.com, then enter the domain.`,
  },
  {
    id: 'settings-role', category: 'Account', title: 'Your role & settings',
    body:
`Settings is where you tune Pocket Pilot:

- Your Role / Niche: changes your pipeline focus, calculators, and how Pilot coaches you.
- Outreach identity: your name + company, used to sign texts.
- Password, theme, and white-label options.

You can change your role any time with the "Change Role" button.`,
  },
];
