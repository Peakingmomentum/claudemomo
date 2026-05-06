# Warm Follow — Introductory Booklet

A 12-page PDF booklet to send to **real estate investors and agents** as
an introduction to [warmfollow.com](https://warmfollow.com).

## Output

- `dist/WarmFollow-Booklet.pdf` — Letter (8.5" × 11"), 12 pages,
  print- or email-ready (~28 KB).

## Page-by-page

| #  | Page                                        | Purpose                                                         |
|----|---------------------------------------------|-----------------------------------------------------------------|
| 1  | Front cover                                 | Hero: "Your leads deserve a faster reply than you can give."    |
| 2  | Welcome / inside this booklet               | Why Warm Follow exists, what's in the booklet                   |
| 3  | The problem — phone tag with ghosts         | Before / After Warm Follow side-by-side                         |
| 4  | One agent. Four channels. Running 24/7.     | Six-channel breakdown: SMS, voice, outbound, voicemail, calendar, GHL |
| 5  | Live conversation case study                | James Williams · 49-day cadence · 5 touches · 0 human minutes   |
| 6  | ROI · Real Numbers                          | Full ROI table: 193 appts, 192 confirmed (99%), $100K+, ~480 hrs saved, "Priceless" |
| 7  | For Real Estate Investors                   | Wholesalers, flippers, landlords + Corey Vickers founder quote  |
| 8  | For Real Estate Agents                      | Sphere, open houses, expireds, buyer nurture                    |
| 9  | Voice Agent Dashboard                       | 79 calls / 91% positive / 42 sec avg · screenshot mock           |
| 10 | Built on your CRM                           | GoHighLevel-native rollout · live in 7 days                     |
| 11 | Pricing                                     | Starter $99 / Professional $499 / Enterprise $1,497 + add-ons   |
| 12 | Back cover                                  | Final CTA: warmfollow.com / hello@warmfollow.com                |

## Source

Copy, stats, founder details, real customer numbers (193 appointments,
$100K+ closed, 47s response, 91% positive sentiment, 1,521 active
opportunities, ~480 hours saved), the James Williams case study and
pricing tiers were captured directly from the live warmfollow.com pages
on 2026-05-06.

## Build

```bash
pip3 install reportlab
python3 build_booklet.py
```

The script writes to `dist/WarmFollow-Booklet.pdf`. Re-run any time
copy, pricing or stats change.

## Customizing

All copy lives in `build_booklet.py` inside the per-page `page_XX_*`
functions. Brand palette is at the top of the file:

```python
CORAL    = "#F26B3A"   # warm primary CTA color
NAVY     = "#15263F"   # trust / dark sections
SKY      = "#DCE8F8"   # AI accent (matches site's "After" panel)
SKY_TEXT = "#1F4FA8"   # secondary headline accent
CREAM    = "#FFF7F0"   # soft section background
```

Swap palette, headlines, stats, founder quote and pricing as the
warmfollow.com site evolves.
