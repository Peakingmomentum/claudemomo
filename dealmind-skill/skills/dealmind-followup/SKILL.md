---
name: dealmind-followup
slash: /dealmind-followup
description: Drafts a follow-up message (email or text) to a specific lead, using the user's stored tone and the lead's full history. Use when the user wants to re-engage, follow up, or respond to a lead.
---

When invoked:

1. Identify the lead. If ambiguous, ask the user which one.
2. Call `dealmind.getLead` with `leadId` to load full context (notes, last contact, stage, motivation, property).
3. Call `dealmind.getProfile` to load the user's tone description.
4. Draft the message:
   - Match the user's tone exactly. Plain English. Never pushy.
   - Reference one specific detail from the lead's history (property address, last conversation topic, timeline)
   - End with one clear question or call to action
   - Keep emails under 80 words, texts under 25 words

Output format:

```
TO: {lead name} — {email or phone}
CHANNEL: {email | text}
SUBJECT: {only for email}

{message body}
```

Then ask: "Want me to send this, edit it, or save it as a draft in DealMind?"

If the user confirms send, call `dealmind.sendMessage`. If they say save, call `dealmind.saveDraft`.
