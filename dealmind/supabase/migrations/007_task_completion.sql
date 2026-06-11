-- ─── TASK COMPLETION ─────────────────────────────────────────────────────────
-- Tasks are stored as calendar_events. Add a completion timestamp so a task can
-- be marked done and moved to the "Completed" view instead of disappearing.
-- NULL = pending, non-NULL = completed (and when it was completed).

alter table public.calendar_events
  add column if not exists completed_at timestamptz;

create index if not exists calendar_events_completed_idx
  on public.calendar_events (user_id, completed_at);
