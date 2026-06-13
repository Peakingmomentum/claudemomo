-- ─── 013 Temperature stages + stage-change history ──────────────────────────
-- The pipeline moves to 5 universal temperature stages
--   New Lead · Cold Lead · Warm Lead · Hot Lead · Closed
-- (role-specific stages retired; Role Picker still drives coaching/calculators/AI).
-- lead_stage_changes records every move so the daily brief can report progress.

create table if not exists public.lead_stage_changes (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references public.users(id) on delete cascade not null,
  lead_id    uuid references public.leads(id) on delete cascade not null,
  from_stage text,
  to_stage   text not null,
  changed_at timestamptz default now()
);
alter table public.lead_stage_changes enable row level security;
create policy "lsc_own" on public.lead_stage_changes for all using (auth.uid() = user_id);
create index if not exists lsc_user_time_idx on public.lead_stage_changes (user_id, changed_at desc);

-- Consolidate legacy 'Dead' stage into is_dead.
update public.leads set is_dead = true where lower(coalesce(stage, '')) = 'dead';

-- Remap surviving leads to the 5 stages (preserve New; seed rest from motivation).
update public.leads set stage = case
  when lower(coalesce(stage, '')) like '%clos%'          then 'Closed'
  when lower(coalesce(stage, '')) in ('new', 'new lead') then 'New Lead'
  when motivation = 'High'   then 'Hot Lead'
  when motivation = 'Medium' then 'Warm Lead'
  when motivation = 'Low'    then 'Cold Lead'
  else 'New Lead'
end
where coalesce(is_dead, false) = false;
