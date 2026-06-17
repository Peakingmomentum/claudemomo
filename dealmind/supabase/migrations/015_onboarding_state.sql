-- ─── 015 Onboarding state ────────────────────────────────────────────────────
-- Per-user onboarding/learning state — which product tours have been seen,
-- whether the Getting-Started checklist was dismissed, etc. Driven by the
-- in-app driver.js tours + the Getting-Started checklist on Daily Intel.

alter table public.users add column if not exists onboarding_state jsonb not null default '{}'::jsonb;
