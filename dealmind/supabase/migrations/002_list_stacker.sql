-- ─── LEAD LISTS ───────────────────────────────────────────────────────────────
create table public.lead_lists (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references public.users(id) on delete cascade,
  created_at timestamptz default now(),
  name       text not null,
  list_type  text not null check (list_type in ('absentee','pre_foreclosure','trust_deed','tax_deed')),
  row_count  integer default 0
);

-- ─── LIST ENTRIES ──────────────────────────────────────────────────────────────
create table public.list_entries (
  id                 uuid default gen_random_uuid() primary key,
  list_id            uuid references public.lead_lists(id) on delete cascade,
  user_id            uuid references public.users(id) on delete cascade,
  created_at         timestamptz default now(),
  address            text,
  address_normalized text,
  owner_name         text,
  phone              text,
  email              text
);

create index list_entries_user_addr_idx on public.list_entries(user_id, address_normalized);

-- ─── RLS ───────────────────────────────────────────────────────────────────────
alter table public.lead_lists   enable row level security;
alter table public.list_entries enable row level security;

create policy "lists_own"   on public.lead_lists   for all using (auth.uid() = user_id);
create policy "entries_own" on public.list_entries for all using (auth.uid() = user_id);

-- ─── STACKING FUNCTION ─────────────────────────────────────────────────────────
create or replace function public.stack_lists(p_user_id uuid)
returns table (
  address_normalized text,
  owner_name         text,
  phone              text,
  email              text,
  list_types         text[],
  stack_count        bigint
)
language sql security definer
as $$
  select
    le.address_normalized,
    max(le.owner_name)                                          as owner_name,
    max(le.phone)                                               as phone,
    max(le.email)                                               as email,
    array_agg(distinct ll.list_type order by ll.list_type)     as list_types,
    count(distinct ll.list_type)                               as stack_count
  from public.list_entries le
  join public.lead_lists   ll on le.list_id = ll.id
  where le.user_id = p_user_id
    and le.address_normalized is not null
    and le.address_normalized != ''
  group by le.address_normalized
  order by stack_count desc, le.address_normalized;
$$;
