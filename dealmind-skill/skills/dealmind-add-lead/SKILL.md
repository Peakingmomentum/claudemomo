---
name: dealmind-add-lead
slash: /dealmind-add-lead
description: Adds a new lead to the user's DealMind pipeline. Use when the user mentions a new prospect, forwards a lead, or asks to log someone.
---

When invoked:

1. Extract from the user's message:
   - `name` (required)
   - `property` (address or description)
   - `phone`, `email`
   - `stage` (default: "New Lead")
   - `motivation` ("Low" | "Medium" | "High" | "Unknown")
   - `notes` (anything else relevant)
2. If `name` is missing, ask for it. Don't ask for anything else — infer defaults.
3. Show the user a one-line preview:

```
+ {name} · {property} · {stage} · {motivation} motivation
```

4. Ask: "Add this to your pipeline?"
5. On confirmation, call `dealmind.createLead` with the extracted fields.
6. Confirm with: "Added. {name} is now in your pipeline at {stage}."

If the lead looks like a duplicate (same name + property), warn the user and ask if they want to update the existing lead instead.
