# DealMind

AI-powered real estate business partner — onboarding, named AI Copilot, lead pipeline, daily briefings, automated outreach.

**Stack:** Next.js 14 (App Router) · Supabase (auth + Postgres + storage) · Stripe Subscriptions · Anthropic Claude (`claude-sonnet-4-20250514`) · Google OAuth (Gmail + Calendar)

---

## Quick start

```bash
cd dealmind
cp .env.example .env.local   # fill in real keys
npm install
npm run dev
```

Open http://localhost:3000.

## Required services

1. **Supabase** — create a project, then in the SQL editor run `supabase/migrations/001_initial.sql`. Create a public storage bucket named `knowledge` for uploaded brand/tone files. Enable **Google** as an Auth provider.
2. **Stripe** — create one $97/month recurring price, copy its ID into `STRIPE_PRICE_ID`. Register `/api/stripe-webhook` as a webhook endpoint with these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.paused`
   - `invoice.payment_failed`
3. **Anthropic** — `ANTHROPIC_API_KEY`.
4. **Google Cloud** — OAuth client with redirect URI `${APP_URL}/api/gmail-oauth`, scopes for Gmail send/read + Calendar read.
5. **(Optional) Resend + Slack** — internal flag alerts.

## Routes

| Path              | Purpose                                    |
|-------------------|--------------------------------------------|
| `/`               | Sign in (Google OAuth or magic link)       |
| `/auth/callback`  | Supabase OAuth callback                    |
| `/onboarding`     | 8-step onboarding, saves each step         |
| `/checkout`       | Stripe paywall                             |
| `/dashboard`      | Daily Intel · Copilot · My Leads · EOD     |
| `/api/create-checkout`  | Creates Stripe Checkout session      |
| `/api/stripe-webhook`   | Receives Stripe webhooks             |
| `/api/claude`           | Proxied Claude call (server-side key) |
| `/api/gmail-oauth`      | Starts/completes Google OAuth        |
| `/api/flag-email`       | Triggers internal flag alerts        |

## Internal flag triggers

Set during onboarding, sent to Supabase + Slack + Resend email:

- `NO_CRM` — step 5, user has no CRM
- `CRM_NOT_USED` — step 5, "barely use it"
- `NO_WEBSITE` — step 7, no website
- `HIGH_LEAD_COUNT` — step 4, 50+ leads

## Deploy (Vercel)

```bash
vercel
```

Set all env vars from `.env.example`. After deploy:

- Register the production webhook URL in Stripe
- Add the production redirect URI in Google Cloud Console
- Add your production domain to Supabase Auth allowed URLs
