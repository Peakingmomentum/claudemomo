# DealMind for Claude

Skill bundle that plugs your DealMind workspace into Claude. Five slash commands:

| Command              | What it does |
|----------------------|--------------|
| `/dealmind-brief`    | Daily Intel briefing — urgent leads, hot leads, today's calendar, next move |
| `/dealmind-leads`    | Query your pipeline — filter by stage, motivation, days-cold, or name |
| `/dealmind-eod`      | End-of-day recap + tomorrow's top 3 |
| `/dealmind-followup` | Draft a follow-up in your tone for a specific lead |
| `/dealmind-add-lead` | Log a new lead from chat |

## Requires

An active DealMind subscription ($97/mo at https://dealmind.ai). Generate an API key at https://app.dealmind.ai/settings/api and paste it when the plugin prompts on first use.

## Install (developer / personal)

1. In Claude → Customize → Personal plugins → "+" → Upload plugin
2. Select this `dealmind-skill/` folder (or zip it first)
3. Paste your API key when prompted

## Backend requirements (DealMind side)

This bundle assumes the DealMind app exposes an API surface at `app.dealmind.ai/api/plugin` with these endpoints (see `connectors/dealmind-api.json` for the contract):

- `GET  /profile`
- `GET  /leads`, `GET /leads/:id`, `POST /leads`
- `GET  /activity`
- `GET  /calendar`
- `POST /messages/send`, `POST /messages/draft`

API key auth via `X-DealMind-Key` header. Each key is scoped to one user.

> These routes are not yet implemented in the `dealmind/` Next.js app — they're the next backend deliverable.

## Submitting to the marketplace

Anthropic's plugin marketplace is currently curated. To submit:

1. Polish prompts and test each skill locally via Upload plugin
2. Record a 60-second Loom of each slash command working end-to-end
3. Apply via Anthropic's partner / marketplace submission form (check https://www.anthropic.com for the current intake)

Monetization stays on the SaaS side (Stripe at dealmind.ai). The plugin is free to install; value is gated behind your DealMind subscription.
