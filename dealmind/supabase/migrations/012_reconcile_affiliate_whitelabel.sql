-- ─── 012 Reconcile 009/010 with the live DB ─────────────────────────────────
-- The live database was provisioned from an earlier variant of 009/010 and was
-- missing several columns the affiliate + white-label code reads/writes.

-- referrals: the affiliate POST inserts referral_code; notes is in the 009 spec.
alter table public.referrals
  add column if not exists referral_code text,
  add column if not exists notes text;

-- tenant_members: the tenant PUT (invite) writes invite_email.
alter table public.tenant_members
  add column if not exists invite_email text;

-- users.tenant_id (010) — which white-label tenant a user belongs to.
alter table public.users
  add column if not exists tenant_id uuid references public.tenant_brands(id) on delete set null;

-- tenant_brands.updated_at auto-touch trigger (function already existed; trigger did not).
drop trigger if exists tenant_brands_set_updated_at on public.tenant_brands;
create trigger tenant_brands_set_updated_at
  before update on public.tenant_brands
  for each row execute procedure public.set_updated_at();

-- ─── Deliberately NOT applied from 009 ──────────────────────────────────────
-- handle_new_user_referral() + on_user_created_referral trigger: in a BEFORE
-- INSERT the public.users row isn't visible, so generate_referral_code() falls
-- back to 'USER'/'USER1'… AND, being non-null, blocks the better lazy code
-- generation that GET /api/affiliate already does from user_name/email.
-- The redundant partial indexes (users_referral_code_idx, tenant_brands_domain_idx)
-- are already covered by the UNIQUE constraints on those columns.
--
-- RLS: referrals INSERT is service_role-only in the live DB, so the affiliate
-- POST handler uses the admin (service-role) client for attribution.
