-- ─── 011 Affiliate: missing columns ─────────────────────────────────────────
-- 009_affiliate.sql was only partially applied to the live DB: the
-- users.referral_code / users.referred_by columns and the referrals payout
-- columns were missing, which made /api/affiliate error and crash the tab.
-- This backfills exactly what the affiliate code reads/writes.

alter table public.users
  add column if not exists referral_code text unique,
  add column if not exists referred_by uuid references public.users(id) on delete set null;

alter table public.referrals
  add column if not exists payout_amount numeric default 0,
  add column if not exists payout_date timestamptz;

-- NOTE: the live DB also has a CHECK constraint enforcing user_role values:
--   users_user_role_check: user_role in
--     ('wholesaler','realtor','storage_unit','commercial_re','industrial')
-- The app role keys must match this exactly (storage_unit, NOT storage_investor).
