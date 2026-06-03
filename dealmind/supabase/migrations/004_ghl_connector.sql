-- ─── GOHIGHLEVEL CONNECTOR ──────────────────────────────────────────────────
-- Stores each user's own GHL (LeadConnector) Private Integration credentials so
-- the agent can text leads and create tasks/reminders inside their GHL location.
-- These are sensitive credentials — only ever read server-side with the service
-- role key (see src/lib/ghl.ts), never exposed to the client.

alter table public.users
  add column if not exists ghl_api_key     text,
  add column if not exists ghl_location_id text,
  add column if not exists ghl_connected   boolean not null default false;
