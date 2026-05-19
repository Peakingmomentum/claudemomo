---
name: dealmind-eod
slash: /dealmind-eod
description: Generates the user's End-of-Day recap from their DealMind workspace — what got done, what slipped, and tomorrow's top 3 priorities. Use at the end of the workday or when the user asks to debrief.
---

When invoked:

1. Call `dealmind.getLeads` to load the current pipeline.
2. Call `dealmind.getActivity` with `since=today_start` to see what changed today (new leads, stage changes, contact events).
3. Call `dealmind.getCalendar` with `date=tomorrow` to see what's on deck.

Render the recap:

```
EOD — {date}, {user_name}

WHAT MOVED TODAY
• {activity item}
• ...

WHAT SLIPPED
• {cold or stalled lead worth noting}
• ...

TOMORROW — TOP 3
1. {action} — {lead or context}
2. ...
3. ...
```

Then ask: "Want me to draft any of these into messages now, or send the EOD to your inbox?"

Keep it under 200 words. No fluff.
