-- ─── 010 White-Label Tenant System ───────────────────────────────────────────

-- ─── TENANT_BRANDS ───────────────────────────────────────────────────────────
create table if not exists public.tenant_brands (
  id             uuid default gen_random_uuid() primary key,
  owner_user_id  uuid references public.users(id) on delete cascade not null unique,
  brand_name     text not null default 'Pocket Pilot',
  logo_url       text,
  primary_color  text default '#0f4c81',
  custom_domain  text unique,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

alter table public.tenant_brands enable row level security;

-- Owner can read and write their own brand config
create policy "tenant_brands_owner" on public.tenant_brands
  for all using (auth.uid() = owner_user_id);

-- Anyone can read a brand by custom domain (needed for white-label app loading)
create policy "tenant_brands_public_domain_read" on public.tenant_brands
  for select using (true);

-- updated_at trigger
create trigger tenant_brands_set_updated_at
  before update on public.tenant_brands
  for each row execute procedure public.set_updated_at();

-- ─── TENANT_MEMBERS ──────────────────────────────────────────────────────────
create table if not exists public.tenant_members (
  id          uuid default gen_random_uuid() primary key,
  tenant_id   uuid references public.tenant_brands(id) on delete cascade not null,
  user_id     uuid references public.users(id) on delete cascade not null,
  role        text default 'member',  -- owner | admin | member
  invited_at  timestamptz default now(),
  joined_at   timestamptz,
  invite_email text,  -- email of invited user before they sign up
  unique (tenant_id, user_id)
);

alter table public.tenant_members enable row level security;

-- Members can read their own membership
create policy "tenant_members_self_read" on public.tenant_members
  for select using (auth.uid() = user_id);

-- Tenant owners can read all members
create policy "tenant_members_owner_read" on public.tenant_members
  for select using (
    exists (
      select 1 from public.tenant_brands
      where id = tenant_id and owner_user_id = auth.uid()
    )
  );

-- Only owners can insert/update/delete members
create policy "tenant_members_owner_write" on public.tenant_members
  for all using (
    exists (
      select 1 from public.tenant_brands
      where id = tenant_id and owner_user_id = auth.uid()
    )
  );

-- ─── Add tenant_id to users for quick lookup ─────────────────────────────────
-- Which white-label tenant does this user belong to?
alter table public.users
  add column if not exists tenant_id uuid references public.tenant_brands(id) on delete set null;

-- Index for domain lookups
create index if not exists tenant_brands_domain_idx
  on public.tenant_brands (custom_domain)
  where custom_domain is not null;
