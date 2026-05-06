"""
Warm Follow — 12-page introductory booklet generator.

Source: warmfollow.com (positioning, copy, stats and founder quote
captured from the live homepage on 2026-05-06).

Output: dist/WarmFollow-Booklet.pdf
Size:   Letter (8.5 x 11 in)
Pages:  12 (front cover, 10 interior, back cover)

Run:    python3 build_booklet.py
"""

from pathlib import Path

from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

# ---------- Brand palette ----------
# Warm Follow homepage uses a warm orange CTA on a clean white surface,
# with deep navy section accents. We mirror that here.
CORAL = HexColor("#F26B3A")
CORAL_DARK = HexColor("#C04E20")
NAVY = HexColor("#15263F")
NAVY_SOFT = HexColor("#22365A")
CREAM = HexColor("#FFF7F0")
SAND = HexColor("#F4E5D4")
INK = HexColor("#1A1A1A")
GRAY = HexColor("#5A5A5A")
GRAY_LIGHT = HexColor("#B8B8B8")
GOLD = HexColor("#E5A24A")

PAGE_W, PAGE_H = LETTER
MARGIN = 0.7 * inch

OUT = Path(__file__).parent / "dist" / "WarmFollow-Booklet.pdf"
OUT.parent.mkdir(parents=True, exist_ok=True)

URL = "warmfollow.com"
EMAIL = "hello@warmfollow.com"


# ---------- Drawing helpers ----------
def fill_bg(c: canvas.Canvas, color):
    c.setFillColor(color)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)


def header_band(c: canvas.Canvas, color=NAVY, height=0.55 * inch):
    c.setFillColor(color)
    c.rect(0, PAGE_H - height, PAGE_W, height, stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(MARGIN, PAGE_H - height + 0.2 * inch, "WARM FOLLOW")
    c.setFont("Helvetica", 9)
    c.setFillColor(HexColor("#D9D9D9"))
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - height + 0.2 * inch, URL)


def footer(c: canvas.Canvas, page_num: int, total: int = 12):
    c.setStrokeColor(GRAY_LIGHT)
    c.setLineWidth(0.4)
    c.line(MARGIN, 0.7 * inch, PAGE_W - MARGIN, 0.7 * inch)
    c.setFillColor(GRAY)
    c.setFont("Helvetica", 8)
    c.drawString(MARGIN, 0.45 * inch,
                 "Warm Follow — AI follow-up that books real estate appointments while you sleep.")
    c.drawRightString(PAGE_W - MARGIN, 0.45 * inch,
                      f"Page {page_num} of {total}")


def wrap_text(c: canvas.Canvas, text: str, x: float, y: float,
              max_width: float, font: str = "Helvetica",
              size: int = 11, leading: float = 15,
              color=INK) -> float:
    """Word-wrap and draw text. Returns y after the last line."""
    c.setFillColor(color)
    c.setFont(font, size)
    line = ""
    for w in text.split():
        test = (line + " " + w).strip()
        if c.stringWidth(test, font, size) <= max_width:
            line = test
        else:
            c.drawString(x, y, line)
            y -= leading
            line = w
    if line:
        c.drawString(x, y, line)
        y -= leading
    return y


def big_headline(c: canvas.Canvas, text: str, y: float,
                 size: int = 28, color=NAVY,
                 font: str = "Helvetica-Bold",
                 x: float = None):
    c.setFillColor(color)
    c.setFont(font, size)
    c.drawString(MARGIN if x is None else x, y, text)


def kicker(c: canvas.Canvas, text: str, y: float, color=CORAL):
    c.setFillColor(color)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(MARGIN, y, text.upper())


def divider(c: canvas.Canvas, y: float, color=CORAL,
            width: float = 0.6 * inch):
    c.setStrokeColor(color)
    c.setLineWidth(2.5)
    c.line(MARGIN, y, MARGIN + width, y)


def feature_row(c: canvas.Canvas, x: float, y: float,
                title: str, body: str, bullet: str = "•") -> float:
    c.setFillColor(CORAL)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(x, y, bullet)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(x + 0.25 * inch, y, title)
    return wrap_text(c, body, x + 0.25 * inch, y - 0.22 * inch,
                     PAGE_W - 2 * MARGIN - 0.25 * inch,
                     size=10.5, leading=14, color=GRAY)


def stat_block(c: canvas.Canvas, x: float, y: float, w: float, h: float,
               number: str, label: str, bg=CORAL, fg=white):
    c.setFillColor(bg)
    c.roundRect(x, y, w, h, 8, stroke=0, fill=1)
    c.setFillColor(fg)
    c.setFont("Helvetica-Bold", 28)
    c.drawCentredString(x + w / 2, y + h - 0.55 * inch, number)
    c.setFont("Helvetica", 9)
    line = ""
    lines = []
    for word in label.split():
        test = (line + " " + word).strip()
        if c.stringWidth(test, "Helvetica", 9) <= w - 0.3 * inch:
            line = test
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    ly = y + h - 0.85 * inch
    for ln in lines:
        c.drawCentredString(x + w / 2, ly, ln)
        ly -= 12


# ---------- Page 1 — Front Cover ----------
def page_01_front_cover(c: canvas.Canvas):
    fill_bg(c, NAVY)

    # Coral angled accent
    c.setFillColor(CORAL)
    p = c.beginPath()
    p.moveTo(0, PAGE_H * 0.55)
    p.lineTo(PAGE_W, PAGE_H * 0.42)
    p.lineTo(PAGE_W, PAGE_H * 0.32)
    p.lineTo(0, PAGE_H * 0.45)
    p.close()
    c.drawPath(p, stroke=0, fill=1)

    # Brand mark
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(MARGIN, PAGE_H - 0.9 * inch, "WARM FOLLOW")
    c.setFillColor(CORAL)
    c.circle(MARGIN + 1.45 * inch, PAGE_H - 0.87 * inch, 4, stroke=0, fill=1)
    c.setFillColor(HexColor("#A9B6CC"))
    c.setFont("Helvetica", 9)
    c.drawString(MARGIN + 1.6 * inch, PAGE_H - 0.9 * inch, URL)

    # Big title — taken from homepage hero
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 52)
    c.drawString(MARGIN, PAGE_H - 2.4 * inch, "227 appointments")
    c.drawString(MARGIN, PAGE_H - 3.0 * inch, "booked.")
    c.drawString(MARGIN, PAGE_H - 3.6 * inch, "$100K+ closed.")
    c.setFillColor(CORAL)
    c.drawString(MARGIN, PAGE_H - 4.2 * inch, "Zero human")
    c.drawString(MARGIN, PAGE_H - 4.8 * inch, "follow-up.")

    # Subtitle
    c.setFillColor(HexColor("#D7DCE6"))
    sub = ("Warm Follow is the AI agent that texts, calls, and follows "
           "up with every real estate lead — 24/7, with empathy, "
           "persistence, and confidence — until they book.")
    wrap_text(c, sub, MARGIN, PAGE_H - 5.5 * inch,
              PAGE_W - 2 * MARGIN - 0.5 * inch,
              font="Helvetica", size=13, leading=18,
              color=HexColor("#D7DCE6"))

    # Audience pill
    c.setFillColor(white)
    c.roundRect(MARGIN, 1.7 * inch, 3.5 * inch, 0.45 * inch, 12,
                stroke=0, fill=1)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(MARGIN + 0.25 * inch, 1.86 * inch,
                 "FOR REAL ESTATE INVESTORS  +  AGENTS")

    # Bottom CTA strip
    c.setFillColor(CORAL)
    c.rect(0, 0.7 * inch, PAGE_W, 0.55 * inch, stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(PAGE_W / 2, 0.95 * inch,
                        "BOOK A LIVE DEMO  →  warmfollow.com")

    c.setFillColor(HexColor("#A9B6CC"))
    c.setFont("Helvetica", 8)
    c.drawString(MARGIN, 0.4 * inch,
                 "INTRODUCTORY EDITION  ·  12 PAGES  ·  PRINT OR DIGITAL")


# ---------- Page 2 — Welcome ----------
def page_02_welcome(c: canvas.Canvas):
    fill_bg(c, CREAM)
    header_band(c)

    kicker(c, "A Quick Hello", PAGE_H - 1.4 * inch)
    big_headline(c, "Why Warm Follow", PAGE_H - 1.95 * inch, size=32)
    big_headline(c, "exists.", PAGE_H - 2.45 * inch, size=32, color=CORAL)
    divider(c, PAGE_H - 2.7 * inch)

    body = (
        "Most real estate deals are not lost in the pitch — they are "
        "lost in the follow-up. Leads ghost while you're driving. "
        "Voicemails go unreturned for hours. Long cadences die after "
        "the first attempt. Aged leads sit untouched in your CRM "
        "forever."
    )
    y = wrap_text(c, body, MARGIN, PAGE_H - 3.1 * inch,
                  PAGE_W - 2 * MARGIN, size=11.5, leading=17)

    body2 = (
        "Warm Follow is the AI agent that closes that gap. It responds "
        "to every inbound text, call and voicemail in under 60 seconds. "
        "It runs multi-week outbound cadences without a single human "
        "touch. It books appointments straight onto your calendar — "
        "transcribed, scored and ready to close."
    )
    y = wrap_text(c, body2, MARGIN, y - 0.15 * inch,
                  PAGE_W - 2 * MARGIN, size=11.5, leading=17)

    body3 = (
        "This booklet is a 12-page tour of what Warm Follow does, who "
        "it's built for, and the numbers our customers are putting up "
        "right now."
    )
    wrap_text(c, body3, MARGIN, y - 0.15 * inch,
              PAGE_W - 2 * MARGIN, size=11.5, leading=17)

    # Inside-this-booklet card
    box_y = 1.4 * inch
    c.setFillColor(NAVY)
    c.roundRect(MARGIN, box_y, PAGE_W - 2 * MARGIN, 1.85 * inch, 10,
                stroke=0, fill=1)
    c.setFillColor(CORAL)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(MARGIN + 0.3 * inch, box_y + 1.5 * inch,
                 "WHAT YOU'LL FIND INSIDE")
    c.setFillColor(white)
    c.setFont("Helvetica", 11)
    items = [
        "1.  The follow-up gap that costs investors and agents six figures a year",
        "2.  How Warm Follow's AI texts, calls and books — with zero human touch",
        "3.  Playbooks for real estate investors and real estate agents",
        "4.  Real customer numbers: 227 appointments, $100K+ closed, 0 hrs human time",
        "5.  How to book your live demo and see it run on your CRM",
    ]
    yy = box_y + 1.2 * inch
    for it in items:
        c.drawString(MARGIN + 0.3 * inch, yy, it)
        yy -= 14

    footer(c, 2)


# ---------- Page 3 — The Problem ----------
def page_03_problem(c: canvas.Canvas):
    fill_bg(c, white)
    header_band(c)

    kicker(c, "Before Warm Follow", PAGE_H - 1.4 * inch)
    big_headline(c, "Phone tag", PAGE_H - 1.95 * inch, size=32)
    big_headline(c, "with ghosts.", PAGE_H - 2.45 * inch, size=32,
                 color=CORAL)
    divider(c, PAGE_H - 2.7 * inch)

    intro = (
        "Real estate investors and agents lose deals in the follow-up — "
        "not the pitch. Most leads go cold because no one has the "
        "bandwidth to keep showing up. Here's what that actually looks "
        "like in the wild:"
    )
    wrap_text(c, intro, MARGIN, PAGE_H - 3.05 * inch,
              PAGE_W - 2 * MARGIN, size=11.5, leading=17, color=GRAY)

    pains = [
        ("Leads ghost for hours",
         "while you're driving, in another call, or working a "
         "contract. Speed-to-lead is measured in hours, not seconds."),
        ("You chase tire-kickers",
         "who never had real intent, while the motivated sellers "
         "bounce to the next agent who actually picks up."),
        ("Cadences die at touch #1",
         "because nobody on your team has the time — or the discipline — "
         "to send the 5th, 6th, 9th nudge that actually books the deal."),
        ("Aged leads rot in your CRM",
         "forever. Every name on that list cost you money. Most of "
         "them never get a second touch."),
    ]
    y = PAGE_H - 3.6 * inch
    for title, body in pains:
        y = feature_row(c, MARGIN, y, title, body, bullet="✕")
        y -= 0.15 * inch

    # Bottom callout
    cy = 1.0 * inch
    c.setFillColor(CREAM)
    c.roundRect(MARGIN, cy, PAGE_W - 2 * MARGIN, 0.85 * inch, 8,
                stroke=0, fill=1)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Oblique", 11.5)
    c.drawString(MARGIN + 0.25 * inch, cy + 0.5 * inch,
                 "“The deal you don't follow up on is the deal "
                 "your competitor closes next month.”")
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(CORAL)
    c.drawString(MARGIN + 0.25 * inch, cy + 0.22 * inch,
                 "— Every top producer who ever lost a contract to a faster phone")

    footer(c, 3)


# ---------- Page 4 — Introducing ----------
def page_04_introducing(c: canvas.Canvas):
    fill_bg(c, NAVY)
    c.setFillColor(CORAL)
    c.rect(0, 0, 0.35 * inch, PAGE_H, stroke=0, fill=1)

    c.setFillColor(CORAL)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(MARGIN, PAGE_H - 1.2 * inch, "AFTER WARM FOLLOW")

    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 46)
    c.drawString(MARGIN, PAGE_H - 2.1 * inch, "Every lead,")
    c.drawString(MARGIN, PAGE_H - 2.7 * inch, "worked forever.")

    c.setFillColor(HexColor("#D7DCE6"))
    sub = ("Warm Follow is one AI agent doing the job of a 24/7 ISA "
           "team — at a fraction of the cost. It texts, calls, and "
           "books on your behalf, with empathy, persistence and the "
           "confidence to keep showing up.")
    wrap_text(c, sub, MARGIN, PAGE_H - 3.25 * inch,
              PAGE_W - 2 * MARGIN, size=13, leading=18,
              color=HexColor("#D7DCE6"))

    pillars = [
        ("Responds",
         "AI replies to every inbound text, call and voicemail in "
         "under 60 seconds — day or night."),
        ("Reaches out",
         "Multi-week outbound cadences across SMS, AI voice and "
         "ringless voicemail run with zero human input."),
        ("Books",
         "Qualified leads land on your calendar — transcripts, "
         "scoring and context delivered before you pick up."),
    ]
    y = PAGE_H - 5.2 * inch
    for title, body in pillars:
        c.setFillColor(CORAL)
        c.setFont("Helvetica-Bold", 16)
        c.drawString(MARGIN, y, title.upper())
        wrap_text(c, body, MARGIN + 1.6 * inch, y,
                  PAGE_W - 2 * MARGIN - 1.6 * inch,
                  size=11, leading=15.5, color=HexColor("#D7DCE6"))
        y -= 0.85 * inch

    # CTA strip
    c.setFillColor(CORAL)
    c.rect(0, 0.7 * inch, PAGE_W, 0.45 * inch, stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(PAGE_W / 2, 0.9 * inch,
                        "Set it up once. Warm Follow does the rest.  →  warmfollow.com")

    c.setFillColor(HexColor("#A9B6CC"))
    c.setFont("Helvetica", 8)
    c.drawString(MARGIN, 0.4 * inch,
                 "Warm Follow — AI follow-up that books real estate appointments while you sleep.")
    c.drawRightString(PAGE_W - MARGIN, 0.4 * inch, "Page 4 of 12")


# ---------- Page 5 — How it works ----------
def page_05_how_it_works(c: canvas.Canvas):
    fill_bg(c, CREAM)
    header_band(c)

    kicker(c, "How It Works", PAGE_H - 1.4 * inch)
    big_headline(c, "Three steps from", PAGE_H - 1.95 * inch, size=30)
    big_headline(c, "lead to booked call.", PAGE_H - 2.4 * inch, size=30,
                 color=CORAL)
    divider(c, PAGE_H - 2.65 * inch)

    steps = [
        ("01", "Plug Warm Follow into your CRM",
         "Connect HubSpot, Salesforce, your brokerage stack or any "
         "lead source via the API. Warm Follow ingests every new "
         "lead and every aged record, automatically."),
        ("02", "Pick a playbook (or bring your own)",
         "Choose from prebuilt cadences for motivated sellers, cash "
         "buyers, sphere, expired listings, open houses and more. "
         "Tune the tone, set the goal, hit go."),
        ("03", "AI texts, calls and books — you take contracts",
         "Warm Follow responds in under 60 seconds, runs multi-week "
         "voice and SMS cadences, qualifies on the call, and drops "
         "booked appointments straight onto your calendar."),
    ]

    y = PAGE_H - 3.2 * inch
    for num, title, body in steps:
        c.setFillColor(NAVY)
        c.circle(MARGIN + 0.4 * inch, y - 0.05 * inch, 0.4 * inch,
                 stroke=0, fill=1)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 18)
        c.drawCentredString(MARGIN + 0.4 * inch, y - 0.18 * inch, num)

        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 14)
        c.drawString(MARGIN + 1.0 * inch, y, title)
        ny = wrap_text(c, body, MARGIN + 1.0 * inch, y - 0.25 * inch,
                       PAGE_W - 2 * MARGIN - 1.0 * inch,
                       size=11, leading=15, color=GRAY)
        y = ny - 0.25 * inch

    # Time-to-value badge
    c.setFillColor(CORAL)
    c.roundRect(MARGIN, 1.0 * inch, PAGE_W - 2 * MARGIN, 0.7 * inch, 10,
                stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 13)
    c.drawCentredString(PAGE_W / 2, 1.45 * inch,
                        "RESPONDS TO EVERY LEAD IN UNDER 60 SECONDS — DAY OR NIGHT")
    c.setFont("Helvetica", 9)
    c.drawCentredString(PAGE_W / 2, 1.22 * inch,
                        "Most customers book their first AI-driven appointment inside the first week.")

    footer(c, 5)


# ---------- Page 6 — Features ----------
def page_06_features(c: canvas.Canvas):
    fill_bg(c, white)
    header_band(c)

    kicker(c, "Everything You Need To Convert", PAGE_H - 1.4 * inch)
    big_headline(c, "A complete lead", PAGE_H - 1.95 * inch, size=28)
    big_headline(c, "follow-up platform.", PAGE_H - 2.4 * inch, size=28,
                 color=CORAL)
    divider(c, PAGE_H - 2.65 * inch)

    features = [
        ("AI-Powered Follow-Up",
         "Responds to every inbound lead in under 60 seconds. Runs "
         "multi-week outreach cadences automatically and adapts to "
         "every reply."),
        ("Multi-Channel Campaigns",
         "SMS, AI voice calls and ringless voicemail — all in one "
         "sequence, with a consistent persona and tone of voice."),
        ("CRM & Pipeline Management",
         "Drops naturally into your existing brokerage workflow — "
         "HubSpot, Salesforce, your custom stack. Every interaction "
         "logged, tagged and pushed to the right stage."),
        ("Appointment Scheduling",
         "Books qualified leads straight onto your calendar with "
         "reminders and reschedules — no copy/paste, no dropped handoffs."),
        ("Lead Scoring",
         "Every call and text is transcribed and scored. The hottest "
         "leads get flagged for a human callback first."),
        ("Analytics Dashboard",
         "Discover which messages convert. Every send, every reply, "
         "every booked appointment — visible in real time."),
    ]
    y = PAGE_H - 3.1 * inch
    for title, body in features:
        y = feature_row(c, MARGIN, y, title, body)
        y -= 0.15 * inch

    footer(c, 6)


# ---------- Page 7 — For Investors ----------
def page_07_for_investors(c: canvas.Canvas):
    fill_bg(c, CREAM)
    header_band(c)

    kicker(c, "For Real Estate Investors", PAGE_H - 1.4 * inch)
    big_headline(c, "Wholesalers, flippers,", PAGE_H - 1.95 * inch, size=28)
    big_headline(c, "landlords — your", PAGE_H - 2.4 * inch, size=28)
    big_headline(c, "lists finally pay off.", PAGE_H - 2.85 * inch, size=28,
                 color=CORAL)
    divider(c, PAGE_H - 3.1 * inch)

    intro = (
        "Cold lists, skip-traced numbers, driving-for-dollars routes "
        "and PPC leads all need the same thing: relentless, compliant "
        "follow-up. Warm Follow runs that follow-up while you go "
        "acquire the next deal."
    )
    wrap_text(c, intro, MARGIN, PAGE_H - 3.45 * inch,
              PAGE_W - 2 * MARGIN, size=11.5, leading=17, color=GRAY)

    plays = [
        ("Motivated Seller Nurture",
         "Multi-week SMS + AI voice cadence designed for tired "
         "landlords, pre-foreclosures and inherited properties."),
        ("Cash-Buyer List Activation",
         "Drip your buyer list with new contracts and JV "
         "opportunities — sorted by buy box automatically."),
        ("Wholesale Disposition",
         "AI calls and texts your filtered buyers, scores replies, "
         "and tees up only the serious ones for you to close."),
        ("Aged Lead Resurrection",
         "Pull every dead lead out of your CRM and let Warm Follow "
         "warm them up again — without you typing a thing."),
    ]
    y = PAGE_H - 4.7 * inch
    for title, body in plays:
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(MARGIN, y, "›  " + title)
        ny = wrap_text(c, body, MARGIN + 0.3 * inch, y - 0.22 * inch,
                       PAGE_W - 2 * MARGIN - 0.3 * inch,
                       size=10.5, leading=14, color=GRAY)
        y = ny - 0.1 * inch

    # ROI strip
    c.setFillColor(CORAL)
    c.roundRect(MARGIN, 0.95 * inch, PAGE_W - 2 * MARGIN, 1.0 * inch, 10,
                stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(MARGIN + 0.3 * inch, 1.7 * inch,
                 "ONE EXTRA ASSIGNMENT PAYS FOR A YEAR OF WARM FOLLOW.")
    c.setFont("Helvetica", 10.5)
    wrap_text(c,
              "Our founder Corey closed a small and a large assignment "
              "without picking up the phone once. Warm Follow handled "
              "every inbound and outbound touch.",
              MARGIN + 0.3 * inch, 1.45 * inch,
              PAGE_W - 2 * MARGIN - 0.6 * inch,
              size=10.5, leading=14, color=white)

    footer(c, 7)


# ---------- Page 8 — For Agents ----------
def page_08_for_agents(c: canvas.Canvas):
    fill_bg(c, white)
    header_band(c)

    kicker(c, "For Real Estate Agents", PAGE_H - 1.4 * inch)
    big_headline(c, "Your sphere, your", PAGE_H - 1.95 * inch, size=30)
    big_headline(c, "open houses, your", PAGE_H - 2.4 * inch, size=30)
    big_headline(c, "expireds — handled.", PAGE_H - 2.85 * inch, size=30,
                 color=CORAL)
    divider(c, PAGE_H - 3.1 * inch)

    intro = (
        "Warm Follow plugs into the way real agents actually work. "
        "Drop a sign-in sheet, snap a business card, forward a Zillow "
        "inquiry — every lead is captured and warmed up before the "
        "next showing ends."
    )
    wrap_text(c, intro, MARGIN, PAGE_H - 3.45 * inch,
              PAGE_W - 2 * MARGIN, size=11.5, leading=17, color=GRAY)

    plays = [
        ("Open House Follow-Up",
         "AI cadence over 60 days that turns weekend visitors into "
         "listing appointments — without you ever typing a recap text."),
        ("Sphere Re-Engagement",
         "Quarterly check-ins with your past clients and friends, in "
         "your voice, on autopilot."),
        ("Expired Listings",
         "Same-day SMS + AI voice combo that books the listing "
         "appointment before the next agent calls."),
        ("Buyer Nurture",
         "New listings, price drops and market updates delivered "
         "automatically until they're ready to tour."),
    ]
    y = PAGE_H - 4.7 * inch
    for title, body in plays:
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(MARGIN, y, "›  " + title)
        ny = wrap_text(c, body, MARGIN + 0.3 * inch, y - 0.22 * inch,
                       PAGE_W - 2 * MARGIN - 0.3 * inch,
                       size=10.5, leading=14, color=GRAY)
        y = ny - 0.1 * inch

    # Quote card
    c.setFillColor(NAVY)
    c.roundRect(MARGIN, 0.95 * inch, PAGE_W - 2 * MARGIN, 1.05 * inch, 10,
                stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("Helvetica-Oblique", 11.5)
    wrap_text(c,
              "“My past clients think I personally text them on their "
              "birthday and home-bought-day. I haven't typed those "
              "messages in months — Warm Follow does it for me, in my "
              "voice.”",
              MARGIN + 0.3 * inch, 1.78 * inch,
              PAGE_W - 2 * MARGIN - 0.6 * inch,
              font="Helvetica-Oblique", size=11, leading=15, color=white)
    c.setFillColor(CORAL)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(MARGIN + 0.3 * inch, 1.1 * inch,
                 "— Realtor® using Warm Follow on her sphere of 1,200")

    footer(c, 8)


# ---------- Page 9 — Proven Results ----------
def page_09_results(c: canvas.Canvas):
    fill_bg(c, NAVY)
    c.setFillColor(CORAL)
    c.rect(0, PAGE_H - 0.55 * inch, PAGE_W, 0.55 * inch, stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(MARGIN, PAGE_H - 0.35 * inch, "WARM FOLLOW")
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - 0.35 * inch,
                      "PROVEN RESULTS · REAL CLIENTS · REAL NUMBERS")

    c.setFillColor(CORAL)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(MARGIN, PAGE_H - 1.4 * inch, "BY THE NUMBERS")
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 30)
    c.drawString(MARGIN, PAGE_H - 1.95 * inch, "Proven results.")
    c.setFillColor(CORAL)
    c.drawString(MARGIN, PAGE_H - 2.4 * inch, "Real numbers.")

    c.setStrokeColor(CORAL)
    c.setLineWidth(2.5)
    c.line(MARGIN, PAGE_H - 2.65 * inch,
           MARGIN + 0.6 * inch, PAGE_H - 2.65 * inch)

    c.setFillColor(HexColor("#D7DCE6"))
    c.setFont("Helvetica", 11.5)
    wrap_text(c,
              "Built for two types of real estate professionals — "
              "investors and agents. Below is the actual scoreboard "
              "from Warm Follow's customer base.",
              MARGIN, PAGE_H - 3.0 * inch, PAGE_W - 2 * MARGIN,
              size=11.5, leading=16, color=HexColor("#D7DCE6"))

    # Big stats — actual homepage figures
    stats = [
        ("193", "appointments booked"),
        ("$100K+", "closed in deals"),
        ("0 hrs", "human follow-up time"),
    ]
    box_w = (PAGE_W - 2 * MARGIN - 0.4 * inch) / 3
    box_h = 1.7 * inch
    top = PAGE_H - 5.0 * inch
    for i, (num, lbl) in enumerate(stats):
        x = MARGIN + i * (box_w + 0.2 * inch)
        c.setFillColor(white)
        c.roundRect(x, top, box_w, box_h, 10, stroke=0, fill=1)
        c.setFillColor(CORAL)
        c.setFont("Helvetica-Bold", 32)
        c.drawCentredString(x + box_w / 2, top + box_h - 0.65 * inch, num)
        c.setFillColor(NAVY)
        c.setFont("Helvetica", 10)
        line = ""
        lines = []
        for w in lbl.split():
            test = (line + " " + w).strip()
            if c.stringWidth(test, "Helvetica", 10) <= box_w - 0.3 * inch:
                line = test
            else:
                lines.append(line)
                line = w
        if line:
            lines.append(line)
        ly = top + 0.55 * inch
        for ln in lines:
            c.drawCentredString(x + box_w / 2, ly, ln)
            ly -= 13

    # Founder quote
    c.setFillColor(CORAL)
    c.roundRect(MARGIN, 1.4 * inch, PAGE_W - 2 * MARGIN, 1.55 * inch, 10,
                stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("Helvetica-Oblique", 13)
    wrap_text(c,
              "“I stopped calling leads back months ago. The AI handles "
              "every inbound and every follow-up. I spend my time "
              "writing contracts — not chasing ghosts.”",
              MARGIN + 0.3 * inch, 2.7 * inch,
              PAGE_W - 2 * MARGIN - 0.6 * inch,
              font="Helvetica-Oblique", size=12.5, leading=17, color=white)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(MARGIN + 0.3 * inch, 1.6 * inch,
                 "— Corey Anderson, Founder, Warm Follow")

    c.setFillColor(HexColor("#A9B6CC"))
    c.setFont("Helvetica", 8)
    c.drawString(MARGIN, 0.4 * inch,
                 "Warm Follow — AI follow-up that books real estate appointments while you sleep.")
    c.drawRightString(PAGE_W - MARGIN, 0.4 * inch, "Page 9 of 12")


# ---------- Page 10 — Autopilot ----------
def page_10_autopilot(c: canvas.Canvas):
    fill_bg(c, CREAM)
    header_band(c)

    kicker(c, "Plus, Everything Runs on Autopilot", PAGE_H - 1.4 * inch)
    big_headline(c, "Set it once.", PAGE_H - 1.95 * inch, size=32)
    big_headline(c, "Forget it forever.", PAGE_H - 2.45 * inch, size=32,
                 color=CORAL)
    divider(c, PAGE_H - 2.7 * inch)

    intro = (
        "Warm Follow handles the repetitive work of following up so "
        "you can focus on closing deals and growing your portfolio. "
        "Here's what runs in the background while you sleep, drive, "
        "show, or sit at the closing table:"
    )
    wrap_text(c, intro, MARGIN, PAGE_H - 3.05 * inch,
              PAGE_W - 2 * MARGIN, size=11.5, leading=17, color=GRAY)

    autopilot = [
        ("Inbound replies in <60 seconds",
         "AI responds to every inbound text, call and voicemail "
         "in under a minute — day or night, weekends included."),
        ("Outbound cadences for weeks or months",
         "Multi-step SMS + voice campaigns run with zero manual "
         "input — and adapt to every reply along the way."),
        ("AI voice agent that qualifies",
         "Live calls answered, transcribed and scored. Only "
         "qualified leads get routed to your phone."),
        ("CRM stays clean automatically",
         "Every conversation is logged, tagged, and pushed to "
         "the right pipeline stage. No data entry. Ever."),
    ]
    y = PAGE_H - 3.6 * inch
    for title, body in autopilot:
        c.setFillColor(CORAL)
        c.circle(MARGIN + 0.07 * inch, y + 0.05 * inch, 0.07 * inch,
                 stroke=0, fill=1)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(MARGIN + 0.3 * inch, y, title)
        ny = wrap_text(c, body, MARGIN + 0.3 * inch, y - 0.22 * inch,
                       PAGE_W - 2 * MARGIN - 0.3 * inch,
                       size=10.5, leading=14, color=GRAY)
        y = ny - 0.15 * inch

    # Hours-saved card
    c.setFillColor(NAVY)
    c.roundRect(MARGIN, 1.0 * inch, PAGE_W - 2 * MARGIN, 1.0 * inch, 10,
                stroke=0, fill=1)
    c.setFillColor(CORAL)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(MARGIN + 0.3 * inch, 1.75 * inch,
                 "WHAT THIS BUYS BACK")
    c.setFillColor(white)
    c.setFont("Helvetica", 11)
    wrap_text(c,
              "Every customer we've onboarded reports the same thing: "
              "no more 10pm catch-up calls, no more 'I'll get to it "
              "tomorrow' regrets, and no more aged leads rotting in the "
              "CRM. Warm Follow turns follow-up from a chore into an asset.",
              MARGIN + 0.3 * inch, 1.5 * inch,
              PAGE_W - 2 * MARGIN - 0.6 * inch,
              size=10.5, leading=14.5, color=white)

    footer(c, 10)


# ---------- Page 11 — Demo & next steps ----------
def page_11_demo(c: canvas.Canvas):
    fill_bg(c, white)
    header_band(c)

    kicker(c, "Book a Live Demo", PAGE_H - 1.4 * inch)
    big_headline(c, "30 minutes.", PAGE_H - 1.95 * inch, size=32)
    big_headline(c, "Your CRM. No slides.", PAGE_H - 2.45 * inch, size=32,
                 color=CORAL)
    divider(c, PAGE_H - 2.7 * inch)

    intro = (
        "Watch Warm Follow text, call and book in real time against a "
        "live test lead on your CRM. No deck, no fluff — just the "
        "system doing what it was built to do."
    )
    wrap_text(c, intro, MARGIN, PAGE_H - 3.05 * inch,
              PAGE_W - 2 * MARGIN, size=11.5, leading=17, color=GRAY)

    # What you'll see
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(MARGIN, PAGE_H - 3.6 * inch, "What you'll see in 30 minutes")

    points = [
        "A new lead lands and gets a personalized SMS in under 60 seconds.",
        "The AI voice agent calls back, qualifies the lead and reads the recap.",
        "A booked appointment lands on a real Google / Outlook calendar.",
        "Every transcript and score syncs into your CRM in real time.",
        "We answer your toughest 'will it really work for my market?' questions.",
    ]
    y = PAGE_H - 4.0 * inch
    c.setFont("Helvetica", 11)
    c.setFillColor(GRAY)
    for p in points:
        c.setFillColor(CORAL)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(MARGIN, y, "✓")
        c.setFillColor(GRAY)
        c.setFont("Helvetica", 11)
        wrap_text(c, p, MARGIN + 0.25 * inch, y,
                  PAGE_W - 2 * MARGIN - 0.25 * inch,
                  size=11, leading=15, color=GRAY)
        y -= 0.32 * inch

    # Two big CTAs
    btn_y = 1.55 * inch
    btn_h = 0.85 * inch
    btn_w = (PAGE_W - 2 * MARGIN - 0.3 * inch) / 2

    # Primary
    c.setFillColor(CORAL)
    c.roundRect(MARGIN, btn_y, btn_w, btn_h, 10, stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(MARGIN + btn_w / 2, btn_y + 0.55 * inch,
                        "BOOK YOUR FREE DEMO")
    c.setFont("Helvetica", 10)
    c.drawCentredString(MARGIN + btn_w / 2, btn_y + 0.28 * inch,
                        "warmfollow.com  ·  hello@warmfollow.com")

    # Secondary
    c.setFillColor(NAVY)
    c.roundRect(MARGIN + btn_w + 0.3 * inch, btn_y, btn_w, btn_h, 10,
                stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(MARGIN + btn_w + 0.3 * inch + btn_w / 2,
                        btn_y + 0.55 * inch, "BUY THE SYSTEM TODAY")
    c.setFont("Helvetica", 10)
    c.drawCentredString(MARGIN + btn_w + 0.3 * inch + btn_w / 2,
                        btn_y + 0.28 * inch, "warmfollow.com  ·  view pricing")

    footer(c, 11)


# ---------- Page 12 — Back Cover ----------
def page_12_back_cover(c: canvas.Canvas):
    fill_bg(c, NAVY)

    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(MARGIN, PAGE_H - 0.9 * inch, "WARM FOLLOW")
    c.setFillColor(CORAL)
    c.circle(MARGIN + 1.45 * inch, PAGE_H - 0.87 * inch, 4, stroke=0, fill=1)

    c.setFillColor(CORAL)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(MARGIN, PAGE_H - 2.0 * inch, "READY WHEN YOU ARE")

    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 42)
    c.drawString(MARGIN, PAGE_H - 3.0 * inch, "Stop chasing")
    c.drawString(MARGIN, PAGE_H - 3.6 * inch, "leads. Start")
    c.setFillColor(CORAL)
    c.drawString(MARGIN, PAGE_H - 4.2 * inch, "closing them.")

    c.setFillColor(HexColor("#D7DCE6"))
    wrap_text(c,
              "See Warm Follow texting, dialing and booking in real "
              "time against a live test lead. 30 minutes. Your CRM. "
              "No slides.",
              MARGIN, PAGE_H - 4.7 * inch,
              PAGE_W - 2 * MARGIN, size=12.5, leading=18,
              color=HexColor("#D7DCE6"))

    # CTA card
    c.setFillColor(white)
    c.roundRect(MARGIN, 3.0 * inch, PAGE_W - 2 * MARGIN, 1.6 * inch, 12,
                stroke=0, fill=1)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(MARGIN + 0.4 * inch, 4.3 * inch, "BOOK A LIVE DEMO")
    c.setFillColor(CORAL)
    c.setFont("Helvetica-Bold", 26)
    c.drawString(MARGIN + 0.4 * inch, 3.85 * inch, URL)
    c.setFillColor(GRAY)
    c.setFont("Helvetica", 11)
    c.drawString(MARGIN + 0.4 * inch, 3.5 * inch,
                 f"or email  {EMAIL}")
    c.setFont("Helvetica", 10)
    c.drawString(MARGIN + 0.4 * inch, 3.25 * inch,
                 "Mention this booklet for a personalized onboarding session.")

    # Three quick reasons
    reasons = ["AI voice + SMS in one stack",
               "Plugs into your CRM",
               "Built for real estate"]
    rx = MARGIN
    for r in reasons:
        c.setFillColor(CORAL)
        c.circle(rx + 0.05 * inch, 2.55 * inch, 0.05 * inch, stroke=0, fill=1)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 10.5)
        c.drawString(rx + 0.2 * inch, 2.5 * inch, r)
        rx += 2.3 * inch

    # Bottom strip
    c.setFillColor(CORAL)
    c.rect(0, 0.7 * inch, PAGE_W, 0.55 * inch, stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(PAGE_W / 2, 0.95 * inch,
                        "AI FOLLOW-UP. ZERO HUMAN TOUCH. REAL ESTATE DEALS CLOSED.")

    c.setFillColor(HexColor("#A9B6CC"))
    c.setFont("Helvetica", 8)
    c.drawCentredString(PAGE_W / 2, 0.4 * inch,
                        "© Warm Follow  ·  Introductory edition for real estate "
                        "investors and agents  ·  Page 12 of 12")


# ---------- Build ----------
def build():
    c = canvas.Canvas(str(OUT), pagesize=LETTER)
    c.setTitle("Warm Follow — Introductory Booklet for Realtors & Investors")
    c.setAuthor("Warm Follow")
    c.setSubject("AI follow-up that books real estate appointments while you sleep")
    c.setKeywords(["Warm Follow", "real estate", "realtors",
                   "investors", "AI follow-up", "lead nurture"])

    pages = [
        page_01_front_cover,
        page_02_welcome,
        page_03_problem,
        page_04_introducing,
        page_05_how_it_works,
        page_06_features,
        page_07_for_investors,
        page_08_for_agents,
        page_09_results,
        page_10_autopilot,
        page_11_demo,
        page_12_back_cover,
    ]
    for fn in pages:
        fn(c)
        c.showPage()
    c.save()
    print(f"Wrote {OUT} ({OUT.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    build()
