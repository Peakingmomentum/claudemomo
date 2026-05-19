-- ─── USERS ───────────────────────────────────────────────────────────────────
create table public.users (
  id                uuid references auth.users primary key,
  email             text unique not null,
  created_at        timestamptz default now(),

  user_name         text,
  role              text,
  copilot_name      text,
  market_type       text,
  city              text,
  stage             text,
  lead_count        text,
  crm               text,
  crm_usage         text,
  tools             text[],
  lead_tools        text[],
  website_url       text,
  no_website        boolean default false,
  tone_description  text,

  onboarding_complete boolean default false,
  onboarding_step     integer default 0,

  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  subscription_status    text default 'inactive',
  plan_activated_at      timestamptz,

  gmail_access_token   text,
  gmail_refresh_token  text,
  gmail_token_expiry   timestamptz,
  gcal_access_token    text,
  gcal_refresh_token   text,
  gcal_connected       boolean default false,
  gmail_connected      boolean default false
);

-- ─── LEADS ───────────────────────────────────────────────────────────────────
create table public.leads (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references public.users(id) on delete cascade,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),

  name            text not null,
  property        text,
  stage           text default 'New Lead',
  motivation      text default 'Unknown',
  last_contact    integer default 0,
  days_in_pipeline integer default 0,
  notes           text,
  phone           text,
  email           text,
  is_dead         boolean default false
);

-- ─── CHAT HISTORY ────────────────────────────────────────────────────────────
create table public.chat_messages (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references public.users(id) on delete cascade,
  created_at timestamptz default now(),
  role       text not null,
  content    text not null,
  context    text
);

-- ─── KNOWLEDGE BASE ──────────────────────────────────────────────────────────
create table public.knowledge_files (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.users(id) on delete cascade,
  created_at  timestamptz default now(),
  file_name   text,
  file_type   text,
  storage_path text,
  processed   boolean default false,
  summary     text
);

-- ─── INTERNAL FLAGS ──────────────────────────────────────────────────────────
create table public.internal_flags (
  id          uuid default gen_random_uuid() primary key,
  created_at  timestamptz default now(),
  flag_type   text not null,
  user_id     uuid references public.users(id),
  user_email  text,
  user_name   text,
  data        jsonb,
  actioned    boolean default false,
  actioned_at timestamptz,
  actioned_by text,
  notes       text
);

-- ─── CALENDAR EVENTS ─────────────────────────────────────────────────────────
create table public.calendar_events (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.users(id) on delete cascade,
  created_at  timestamptz default now(),
  title       text,
  event_date  timestamptz,
  event_type  text,
  lead_id     uuid references public.leads(id),
  synced_from text
);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────
alter table public.users           enable row level security;
alter table public.leads           enable row level security;
alter table public.chat_messages   enable row level security;
alter table public.knowledge_files enable row level security;
alter table public.internal_flags  enable row level security;
alter table public.calendar_events enable row level security;

create policy "users_own_data"     on public.users           for all using (auth.uid() = id);
create policy "leads_own_data"     on public.leads           for all using (auth.uid() = user_id);
create policy "chat_own_data"      on public.chat_messages   for all using (auth.uid() = user_id);
create policy "files_own_data"     on public.knowledge_files for all using (auth.uid() = user_id);
create policy "calendar_own_data"  on public.calendar_events for all using (auth.uid() = user_id);

-- Internal flags — readable/writable only via service role
create policy "flags_service_only" on public.internal_flags  for all using (false);

-- ─── AUTO-CREATE user row on auth signup ─────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── updated_at trigger for leads ────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
  before update on public.leads
  for each row execute procedure public.set_updated_at();
