# Pocket Pilot (dealmind) — Project Guide

AI copilot for real estate professionals. Lead pipeline, an agentic chat copilot,
a coaching AI, daily briefs, and CRM/connector integrations.

Live at **pilot.warmfollow.com** (also dealmind-six.vercel.app).

## Stack & layout
- **Next.js 14 (App Router), TypeScript**, deployed on Vercel.
- App lives in this `dealmind/` folder (inside the `claudemomo` git repo).
- **Supabase** for auth + DB. Project: **RE_COPILOT** (`cqovwibacehqzbqnniuk`).
- **Anthropic** Claude (Sonnet for chat, Haiku for cheap structured tasks) via `ANTHROPIC_API_KEY`.
- Key dirs: `app/` (routes + dashboard components), `src/lib/` (clients), `src/types/`, `supabase/migrations/`.

## Deploy — IMPORTANT
- Production branch is **`main`**. Deploy with: `git push origin main` (Vercel auto-builds ~45s) OR `vercel --prod --yes` from this dir.
- **Git author email must be valid** or Vercel silently BLOCKS every deploy (commit-author protection). If deploys show "Blocked"/UNKNOWN with 0ms build, check `git config --global user.email` — it must be a clean email (`peakingmomentum@gmail.com`), no pasted commands. This caused 5 days of blocked deploys once.
- Don't run `vercel` attached and wait — it streams logs and can look hung. Builds continue server-side even if the CLI is killed. Check status with `vercel ls dealmind`.

## Conventions
- 2-space indent, single quotes, no semicolons unless the file already uses them.
- API keys in env / `.env.local` only — never hardcoded.
- Route handlers are Next.js API routes (not imported elsewhere).
- Migrations: add a numbered file in `supabase/migrations/` AND apply to the live DB.

## Core files
- `app/api/claude/route.ts` — the agentic copilot tool loop + `executeTool` (add_lead, update_lead, text_lead, create_ghl_task, etc.).
- `src/lib/claude.ts` — system prompts, `COPILOT_TOOLS`, daily-brief builder.
- `src/lib/ghl.ts` — GoHighLevel (LeadConnector) client.
- `src/lib/ratelimit.ts`, `src/lib/slack.ts`, `src/lib/google.ts`, `src/lib/stripe.ts`.
- `app/dashboard/*` — MyLeads (pipeline), CopilotChat, CoachingTab, Connectors, Settings, etc.

## Integrations
- **GoHighLevel**: each user connects their OWN GHL (Private Integration token + Location ID, stored on `users.ghl_api_key/ghl_location_id/ghl_connected`). The copilot can text leads and create CRM tasks through it, and GHL activity (replies, appointments) feeds the daily brief. Connector UI in `Connectors.tsx`.
- **Stripe** subscriptions, **Slack** notifications, **Supabase** auth.

## AI Autopilot guardrails (enforced in code — keep them)
- **Dedup**: `add_lead` skips leads matching an existing phone/email.
- **Placeholder block**: `findPlaceholders()` in `route.ts` refuses to send any text containing brackets/`[Your Name]`/`{{...}}`/"your name"/"your company".
- **Draft-first**: `text_lead` returns a draft unless `confirmed=true` (set only after explicit user approval).
- **Signature**: real sender name + `company_name` injected into the system prompt; users set them in Settings → Your Outreach Identity.

## Open items / TODO
1. ~~Gmail + Google Calendar OAuth is broken~~ **FIXED 2026-06-03.** Real OAuth web client created in Google Cloud (`836422471433-….apps.googleusercontent.com`); Gmail + Calendar APIs enabled; consent screen in **Testing** mode (only added test users can connect — publish later for public use). Redirect URIs registered: `https://pilot.warmfollow.com/api/gmail-oauth` + `http://localhost:3000/api/gmail-oauth`. Vercel prod env set: `GOOGLE_CLIENT_ID/SECRET`, `GOOGLE_REDIRECT_URI=https://pilot.warmfollow.com/api/gmail-oauth`, `NEXT_PUBLIC_APP_URL=https://pilot.warmfollow.com`. Note: `vercel env pull` shows these blank (Encrypted) — that's normal; trust `vercel env ls`.
   - **Root cause of "connector connects but nothing saves":** `SUPABASE_SERVICE_ROLE_KEY` in Vercel was invalid, so the admin client (`createSupabaseAdminClient`) silently failed every write. Fixed 2026-06-03 with the real `service_role` key. If admin writes ever fail silently again, check that key first. (`vercel env pull` shows it blank because it's Encrypted — verify by testing the key against `/rest/v1/` directly.)
   - **Callback hardening:** `app/api/gmail-oauth/route.ts` now surfaces failures to `/dashboard?error=google_oauth&detail=…` and falls back to the `state` (user UUID) when the Supabase session cookie is dropped on the cross-site redirect back from Google.
   - **Agent Gmail/Calendar tools (added 2026-06-03):** `read_email`, `read_calendar`, and `add_calendar_event` (now creates a REAL Google event) in `app/api/claude/route.ts`, backed by helpers in `src/lib/google.ts`. Scope upgraded to `calendar.events` (read+write) — users connected before this must **reconnect Google Calendar once** to grant write access for event creation; reads work on the old `calendar.readonly` token.
   - **Calendar sync + UI (added 2026-06-04):** `CalendarView.tsx` auto-syncs Google events on open via `/api/sync-gcal` (upserts into `calendar_events` by `gcal_event_id`). Month grid uses fixed `gridAutoRows` (56px mobile / 96px desktop) so rows stay uniform. The desktop + mobile `CopilotChat` `onLeadChange` now also calls `refreshCalendar()` so agent-booked events appear without a reload.
   - **Still needs a one-time user action:** the live token was granted `calendar.readonly`, so agent event *creation* to real Google Calendar fails until the user **reconnects Google Calendar once** (the code already requests `calendar.events`). Reads + in-platform events work now.
2. **Outlook** connector is a stub — needs a full Microsoft Graph OAuth build.
3. **Draft-approval UI card** — the `text_lead` draft is enforced by the model setting `confirmed=true`. For a 100% structural guarantee, add a Send/Cancel card in CopilotChat that calls a dedicated send route (action type `text_draft` is already emitted by `text_lead`).
4. **Tasks history menu** — `TasksView.tsx` is the dedicated tasks page; build a completed/pending filter toggle (All / Pending / Completed) so finished tasks move to a history view instead of disappearing. (The redundant tasks tab on `DailyIntel.tsx` was removed 2026-06-04 — it was derived from calendar events, not real tasks.)

## Misc UI notes (2026-06-04)
- Lead cards: the "Nd cold" badge was removed; the lead **score** badge has a hover tooltip (`title`) explaining the scoring breakdown — see `scoreLead()` in `MyLeads.tsx`.
- Chat opens on the most recent conversation: `app/dashboard/page.tsx` loads the latest 50 `chat_messages` (descending + reverse), and `CopilotChat` jumps to the bottom instantly on first render.
- Sidebar logo: `<AIAvatar size={36} />` (no `name` prop) so it shows just the "C" circle + "Pocket Pilot" — passing `name` also renders a "Ready/Thinking…" label (avoid in the sidebar).
