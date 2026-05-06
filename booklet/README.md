# Warm Follow — Introductory Booklet

A 12-page PDF booklet to send to realtors and real estate investors as an
introduction to [warmfollow.com](https://warmfollow.com).

## Output

- `dist/WarmFollow-Booklet.pdf` — Letter (8.5" × 11"), 12 pages, print- or
  email-ready.

## Page-by-page

| # | Page                              | Purpose                                                       |
|---|-----------------------------------|---------------------------------------------------------------|
| 1 | Front cover                       | Hero stats: 227 appointments / $100K+ closed / zero human f/u |
| 2 | Welcome / inside this booklet     | Why Warm Follow exists, what's in the booklet                 |
| 3 | The problem — phone tag w/ ghosts | "Before Warm Follow" pain points                              |
| 4 | Introducing Warm Follow           | Responds · Reaches out · Books                                 |
| 5 | How it works                      | Three-step setup                                              |
| 6 | Feature toolkit                   | AI follow-up, multi-channel, CRM, scheduling, scoring         |
| 7 | For real estate investors         | Wholesalers, flippers, landlords playbooks                    |
| 8 | For real estate agents            | Sphere, open houses, expireds                                 |
| 9 | Proven results                    | Real numbers + founder quote                                  |
|10 | Everything runs on autopilot      | What runs in the background                                   |
|11 | Book a live demo                  | What you'll see in 30 minutes + dual CTA                      |
|12 | Back cover                        | Final CTA: warmfollow.com / hello@warmfollow.com              |

## Build

```bash
pip3 install reportlab
python3 build_booklet.py
```

The script writes to `dist/WarmFollow-Booklet.pdf`. Re-run any time copy
or pricing changes.

## Customizing

All copy lives in `build_booklet.py` inside the per-page `page_XX_*`
functions. Brand colors are at the top of the file:

```python
CORAL = "#F26B3A"   # warm primary CTA color
NAVY  = "#15263F"   # trust / sections
CREAM = "#FFF7F0"   # soft section background
```

Swap palette, headlines, stats, founder quote and pricing as the
warmfollow.com site evolves.
