-- ─── RATE LIMITING ────────────────────────────────────────────────────────────
-- Fixed-window counters keyed by an arbitrary identifier (user id or client IP).
-- Used by src/lib/ratelimit.ts via the check_rate_limit() RPC.

create table if not exists public.rate_limits (
  key          text not null,
  window_start timestamptz not null,
  count        integer not null default 0,
  primary key (key, window_start)
);

-- No RLS policies: this table is only ever touched by the security-definer
-- function below (called with the service-role key). Locking it down keeps
-- counters tamper-proof from the client.
alter table public.rate_limits enable row level security;

-- Atomically bump the counter for the current window and report whether the
-- caller is still under the limit. Returns true when the request is allowed.
create or replace function public.check_rate_limit(
  p_key             text,
  p_limit           integer,
  p_window_seconds  integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window timestamptz;
  v_count  integer;
begin
  -- Snap "now" down to the start of the current fixed window.
  v_window := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.rate_limits (key, window_start, count)
    values (p_key, v_window, 1)
  on conflict (key, window_start)
    do update set count = public.rate_limits.count + 1
  returning count into v_count;

  return v_count <= p_limit;
end;
$$;

-- Best-effort cleanup of stale windows. Call opportunistically; safe to ignore.
create or replace function public.prune_rate_limits()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.rate_limits where window_start < now() - interval '1 hour';
$$;
