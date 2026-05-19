---
name: dealmind-leads
slash: /dealmind-leads
description: Shows the user's DealMind pipeline — filterable by stage, motivation, or days-cold. Use when the user asks about leads, their pipeline, who's cold, who's hot, or wants to find a specific lead.
---

When invoked:

1. Parse the user's request for filters (stage, motivation, days-cold threshold, or a name to find).
2. Call `dealmind.getLeads` with the filters mapped to query params.
3. Render a compact table:

```
NAME             STAGE          MOT.    COLD   NOTES
Jamal Hightower  Negotiating    High    3d     Counter at 285k
...
```

4. After the table, surface:
   - One observation ("3 leads stalled in 'Nurturing' over 14 days")
   - One question to the user ("Want me to draft a re-engagement message for them?")

If the user asks for a specific lead, return:
- Full profile (name, property, phone, email)
- Last 3 notes
- Suggested next action

Never modify leads from this skill — that's `/dealmind-add-lead` or asking the user to confirm an update.
