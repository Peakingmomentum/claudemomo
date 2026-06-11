-- ─── 009 Affiliate System ────────────────────────────────────────────────────

-- Add referral_code to the users table (unique per user)
alter table public.users
  add column if not exists referral_code text unique;

-- Index for fast referral code lookups at signup
create unique index if not exists users_referral_code_idx
  on public.users (referral_code)
  where referral_code is not null;

-- ─── REFERRAL_CODES ──────────────────────────────────────────────────────────
-- Separate table for managing referral codes (allows multiple per user in future)
create table if not exists public.referral_codes (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references public.users(id) on delete cascade not null,
  code        text unique not null,
  created_at  timestamptz default now()
);

alter table public.referral_codes enable row level security;

create policy "referral_codes_own" on public.referral_codes
  for all using (auth.uid() = user_id);

-- Anyone can look up a referral code by code value (to attribute signup)
create policy "referral_codes_public_read" on public.referral_codes
  for select using (true);

-- ─── REFERRALS ───────────────────────────────────────────────────────────────
create table if not exists public.referrals (
  id               uuid default gen_random_uuid() primary key,
  referrer_id      uuid references public.users(id) on delete set null,
  referred_user_id uuid references public.users(id) on delete cascade not null unique,
  referral_code    text,
  signup_date      timestamptz default now(),
  status           text default 'pending',  -- pending | active | churned | paid
  commission_pct   numeric default 30,
  payout_amount    numeric default 0,
  payout_date      timestamptz,
  stripe_sub_id    text,  -- referred user's subscription for webhook correlation
  notes            text
);

alter table public.referrals enable row level security;

-- Referrers can see their own referrals
create policy "referrals_referrer_read" on public.referrals
  for select using (auth.uid() = referrer_id);

-- Service role inserts at signup
create policy "referrals_service_insert" on public.referrals
  for insert with check (true);

-- ─── Store referrer on users table for quick lookup ───────────────────────────
alter table public.users
  add column if not exists referred_by uuid references public.users(id) on delete set null;

-- ─── Function: generate a referral code from user email/name ─────────────────
create or replace function public.generate_referral_code(user_id uuid)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  base_code text;
  final_code text;
  counter   integer := 0;
begin
  -- Pull user name or email prefix to build a readable code
  select upper(
    regexp_replace(
      coalesce(user_name, split_part(email, '@', 1), 'USER'),
      '[^A-Za-z0-9]', '', 'g'
    )
  )
  into base_code
  from public.users
  where id = user_id;

  -- Truncate to 12 chars max
  base_code := left(base_code, 12);

  -- Ensure uniqueness
  final_code := base_code;
  loop
    exit when not exists (
      select 1 from public.users where referral_code = final_code and id != user_id
    );
    counter := counter + 1;
    final_code := base_code || counter::text;
  end loop;

  return final_code;
end;
$$;

-- ─── Auto-generate referral code for existing & new users ────────────────────
-- Backfill existing users
update public.users
set referral_code = public.generate_referral_code(id)
where referral_code is null;

-- Trigger for new users
create or replace function public.handle_new_user_referral()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Generate a referral code (retry if conflict due to race)
  begin
    new.referral_code := public.generate_referral_code(new.id);
  exception when unique_violation then
    new.referral_code := upper(replace(gen_random_uuid()::text, '-', ''));
  end;
  return new;
end;
$$;

drop trigger if exists on_user_created_referral on public.users;
create trigger on_user_created_referral
  before insert on public.users
  for each row
  when (new.referral_code is null)
  execute procedure public.handle_new_user_referral();
