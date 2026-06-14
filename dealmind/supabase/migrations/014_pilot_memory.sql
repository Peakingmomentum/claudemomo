-- ─── 014 Pilot memory ────────────────────────────────────────────────────────
-- Per-user persistent memory: lasting instructions/preferences the AI must follow
-- across every future conversation (e.g. "never auto-create a lead from a note").
-- Written by the `remember` copilot tool, injected into the system prompt.

alter table public.users add column if not exists pilot_memory text;
