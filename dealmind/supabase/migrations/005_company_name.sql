-- ─── COMPANY NAME ───────────────────────────────────────────────────────────
-- Used as the sender company in agent-drafted outreach so messages never go out
-- with a "[Your Company]" placeholder.

alter table public.users
  add column if not exists company_name text;
