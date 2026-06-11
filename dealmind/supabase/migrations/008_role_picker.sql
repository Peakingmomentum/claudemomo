-- ─── 008 Role Picker ─────────────────────────────────────────────────────────
-- Adds user_role (the 5-niche role system) to the users table.
-- Separate from the existing 'role' column (investor/agent/both/brokerage)
-- which was used during onboarding. user_role drives role-specific UX.

alter table public.users
  add column if not exists user_role text,
  add column if not exists user_role_set_at timestamptz;

-- Allowed values: wholesaler | realtor | storage_investor | commercial_re | industrial
-- Enforced at app level (not a PG enum so we can add values without migrations).

comment on column public.users.user_role is
  'Role picked from the 5-niche role picker: wholesaler | realtor | storage_investor | commercial_re | industrial';
