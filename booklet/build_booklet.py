"""
Warm Follow — 12-page introductory booklet generator.

Source: warmfollow.com (positioning, copy, stats, real customer numbers,
case study, pricing and founder quote captured from the live homepage on
2026-05-06).

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
# warmfollow.com uses a flame-orange CTA color and deep navy text on a
# clean cream/white surface, with a soft sky-blue "AI" accent on the
# "After Warm Follow" panels. Mirrored here.
CORAL = HexColor("#F26B3A")
CORAL_DARK = HexColor("#C04E20")
NAVY = HexColor("#15263F")
NAVY_SOFT = HexColor("#22365A")
SKY = HexColor("#DCE8F8")
SKY_TEXT = HexColor("#1F4FA8")
CREAM = HexColor("#FFF7F0")
SAND = HexColor("#F4E5D4")
INK = HexColor("#1A1A1A")
GRAY = HexColor("#5A5A5A")
GRAY_LIGHT = HexColor("#B8B8B8")
GOLD = HexColor("#E5A24A")
GREEN = HexColor("#1F9E5C")

PAGE_W, PAGE_H = LETTER
MARGIN = 0.7 * inch

OUT = Path(__file__).parent / "dist" / "WarmFollow-Booklet.pdf"
OUT.parent.mkdir(parents=True, exist_ok=True)

URL = "warmfollow.com"
EMAIL = "hello@warmfollow.com"


# ---------- Drawing helpers ----------
def fill_bg(c, color):
    c.setFillColor(color)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)


def flame_mark(c, x, y, size=12, dot_color=CORAL):
    """Draw a small flame dot + WARM FOLLOW wordmark."""
    c.setFillColor(dot_color)
    c.circle(x, y + size * 0.35, size * 0.32, stroke=0, fill=1)
    c.setFillColor(NAVY if dot_color == CORAL else white)
    c.setFont("Helvetica-Bold", size)
    c.drawString(x + size * 0.55, y, "WARM FOLLOW")


def header_band(c, color=NAVY, height=0.55 * inch):
    c.setFillColor(color)
    c.rect(0, PAGE_H - height, PAGE_W, height, stroke=0, fill=1)
    c.setFillColor(CORAL)
    c.circle(MARGIN + 0.07 * inch, PAGE_H - height + 0.27 * inch,
             0.07 * inch, stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(MARGIN + 0.22 * inch, PAGE_H - height + 0.2 * inch,
                 "WARM FOLLOW")
    c.setFont("Helvetica", 9)
    c.setFillColor(HexColor("#D9D9D9"))
    c.drawRightString(PAGE_W - MARGIN, PAGE_H - height + 0.2 * inch, URL)


def footer(c, page_num, total=12, tagline=None):
    c.setStrokeColor(GRAY_LIGHT)
    c.setLineWidth(0.4)
    c.line(MARGIN, 0.7 * inch, PAGE_W - MARGIN, 0.7 * inch)
    c.setFillColor(GRAY)
    c.setFont("Helvetica", 8)
    line = tagline or ("Warm Follow — AI follow-up that books real "
                       "estate appointments while you sleep.")
    c.drawString(MARGIN, 0.45 * inch, line)
    c.drawRightString(PAGE_W - MARGIN, 0.45 * inch,
                      f"Page {page_num} of {total}")


def wrap_text(c, text, x, y, max_width, font="Helvetica",
              size=11, leading=15, color=INK):
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


def big_headline(c, text, y, size=28, color=NAVY,
                 font="Helvetica-Bold", x=None):
    c.setFillColor(color)
    c.setFont(font, size)
    c.drawString(MARGIN if x is None else x, y, text)


def kicker(c, text, y, color=SKY_TEXT):
    c.setFillColor(color)
    c.circle(MARGIN + 0.06 * inch, y + 0.04 * inch, 0.06 * inch,
             stroke=0, fill=1)
    c.setFillColor(color)
    c.setFont("Helvetica-Bold", 9.5)
    c.drawString(MARGIN + 0.22 * inch, y, text.upper())


def divider(c, y, color=CORAL, width=0.6 * inch):
    c.setStrokeColor(color)
    c.setLineWidth(2.5)
    c.line(MARGIN, y, MARGIN + width, y)


def feature_row(c, x, y, title, body, bullet="•"):
    c.setFillColor(CORAL)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(x, y, bullet)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(x + 0.25 * inch, y, title)
    return wrap_text(c, body, x + 0.25 * inch, y - 0.22 * inch,
                     PAGE_W - 2 * MARGIN - 0.25 * inch,
                     size=10.5, leading=14, color=GRAY)


def stat_card(c, x, y, w, h, number, label, accent="white",
              fg=NAVY, sub_color=GRAY):
    c.setFillColor(white)
    c.setStrokeColor(GRAY_LIGHT)
    c.setLineWidth(0.5)
    c.roundRect(x, y, w, h, 8, stroke=1, fill=1)
    c.setFillColor(fg if accent == "white" else CORAL)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(x + 0.2 * inch, y + h - 0.3 * inch, accent.upper()
                 if accent != "white" else "")
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 26)
    c.drawString(x + 0.2 * inch, y + 0.55 * inch, number)
    c.setFillColor(sub_color)
    c.setFont("Helvetica", 9)
    line = ""
    lines = []
    for word in label.split():
        test = (line + " " + word).strip()
        if c.stringWidth(test, "Helvetica", 9) <= w - 0.4 * inch:
            line = test
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    ly = y + 0.3 * inch
    for ln in lines:
        c.drawString(x + 0.2 * inch, ly, ln)
        ly -= 11


# ---------- Page 1 — Front Cover ----------
def page_01_front_cover(c):
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

    # Brand mark + URL
    c.setFillColor(CORAL)
    c.circle(MARGIN + 0.07 * inch, PAGE_H - 0.83 * inch, 0.09 * inch,
             stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(MARGIN + 0.25 * inch, PAGE_H - 0.9 * inch, "WARM FOLLOW")
    c.setFillColor(HexColor("#A9B6CC"))
    c.setFont("Helvetica", 9)
    c.drawString(MARGIN + 1.6 * inch, PAGE_H - 0.9 * inch, URL)

    # Live system pill (mirrors site)
    c.setFillColor(white)
    c.roundRect(MARGIN, PAGE_H - 1.55 * inch, 4.6 * inch, 0.32 * inch, 16,
                stroke=0, fill=1)
    c.setFillColor(GREEN)
    c.circle(MARGIN + 0.2 * inch, PAGE_H - 1.39 * inch, 0.06 * inch,
             stroke=0, fill=1)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(MARGIN + 0.35 * inch, PAGE_H - 1.43 * inch,
                 "LIVE SYSTEM  ·  REAL RESULTS  ·  REAL ESTATE")

    # Hero headline (verbatim from site, broken to separate lines)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 48)
    c.drawString(MARGIN, PAGE_H - 2.4 * inch, "Your leads deserve")
    c.setFillColor(SKY)
    c.drawString(MARGIN, PAGE_H - 3.05 * inch, "a faster reply")
    c.setFillColor(white)
    c.drawString(MARGIN, PAGE_H - 3.7 * inch, "than you can give.")

    # Subhead (verbatim from site, lightly tightened)
    c.setFillColor(HexColor("#D7DCE6"))
    sub = ("Warm Follow is the AI agent that texts, calls, and follows "
           "up with every motivated seller and every active buyer — "
           "inbound and outbound — until they book. One investor used "
           "it to close six figures in wholesale assignments while his "
           "phone stayed silent.")
    wrap_text(c, sub, MARGIN, PAGE_H - 4.3 * inch,
              PAGE_W - 2 * MARGIN - 0.4 * inch,
              font="Helvetica", size=12.5, leading=17.5,
              color=HexColor("#D7DCE6"))

    # Proof strip
    proof_y = 2.4 * inch
    c.setFillColor(white)
    c.roundRect(MARGIN, proof_y, PAGE_W - 2 * MARGIN, 1.0 * inch, 10,
                stroke=0, fill=1)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(MARGIN + 0.3 * inch, proof_y + 0.78 * inch,
                 "SEE THE PROOF")
    items = [
        ("193+", "appointments booked"),
        ("$100K+", "assignments closed"),
        ("47s", "avg AI response"),
        ("0 hrs", "human follow-up"),
    ]
    cell_w = (PAGE_W - 2 * MARGIN - 0.6 * inch) / 4
    for i, (n, l) in enumerate(items):
        cx = MARGIN + 0.3 * inch + i * cell_w
        c.setFillColor(CORAL)
        c.setFont("Helvetica-Bold", 18)
        c.drawString(cx, proof_y + 0.45 * inch, n)
        c.setFillColor(GRAY)
        c.setFont("Helvetica", 9)
        c.drawString(cx, proof_y + 0.22 * inch, l)

    # Audience pill
    c.setFillColor(CORAL)
    c.roundRect(MARGIN, 1.7 * inch, 4.0 * inch, 0.45 * inch, 12,
                stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(MARGIN + 0.25 * inch, 1.86 * inch,
                 "FOR REAL ESTATE INVESTORS  +  AGENTS")

    # CTA strip
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
def page_02_welcome(c):
    fill_bg(c, CREAM)
    header_band(c)

    kicker(c, "A Quick Hello", PAGE_H - 1.4 * inch)
    big_headline(c, "Why Warm Follow", PAGE_H - 1.95 * inch, size=32)
    big_headline(c, "exists.", PAGE_H - 2.45 * inch, size=32, color=CORAL)
    divider(c, PAGE_H - 2.7 * inch)

    body = (
        "Whether you're an investor working motivated sellers or an "
        "agent working buyers and listings, deals are not lost in the "
        "pitch — they're lost in the follow-up. Hot leads go cold "
        "while you're in a contract. Sellers slip to whoever calls "
        "them first. Manual follow-up doesn't scale past one person."
    )
    y = wrap_text(c, body, MARGIN, PAGE_H - 3.1 * inch,
                  PAGE_W - 2 * MARGIN, size=11.5, leading=17)

    body2 = (
        "Warm Follow closes that gap. It's an AI agent that responds "
        "to every inbound text, call and voicemail in under a minute, "
        "and runs multi-week outbound cadences for months without a "
        "human touching them. Only booked, qualified appointments land "
        "on your calendar."
    )
    y = wrap_text(c, body2, MARGIN, y - 0.15 * inch,
                  PAGE_W - 2 * MARGIN, size=11.5, leading=17)

    body3 = (
        "This 12-page tour walks you through what Warm Follow does, "
        "the actual numbers our customers are putting up right now, "
        "and how to get it live on your CRM in under a week."
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
        "2.  One agent. Four channels. Running 24/7.",
        "3.  A real cadence: 5 touches, 49 days, 0 human minutes — booked",
        "4.  Live customer numbers: 193+ appts, $100K+ closed, 91% positive sentiment",
        "5.  Pricing, GHL onboarding and how to book a live demo",
    ]
    yy = box_y + 1.2 * inch
    for it in items:
        c.drawString(MARGIN + 0.3 * inch, yy, it)
        yy -= 14

    footer(c, 2)


# ---------- Page 3 — The Problem ----------
def page_03_problem(c):
    fill_bg(c, white)
    header_band(c)

    kicker(c, "The Problem", PAGE_H - 1.4 * inch)

    big_headline(c, "Real estate pros lose", PAGE_H - 1.95 * inch, size=24)
    big_headline(c, "deals in the follow-up —", PAGE_H - 2.4 * inch, size=24)
    big_headline(c, "not the pitch.", PAGE_H - 2.85 * inch, size=24,
                 color=CORAL)
    divider(c, PAGE_H - 3.1 * inch)

    intro = (
        "Whether you work motivated sellers, cash buyers, expireds, "
        "open-house sign-ins or your own sphere — most leads go cold "
        "because nobody reaches back fast enough. Tire-kickers eat "
        "your hours. Hot prospects slip to whoever calls them first. "
        "Manual follow-up doesn't scale past one person."
    )
    wrap_text(c, intro, MARGIN, PAGE_H - 3.5 * inch,
              PAGE_W - 2 * MARGIN, size=11.5, leading=17, color=GRAY)

    # Before/After two-column
    col_w = (PAGE_W - 2 * MARGIN - 0.25 * inch) / 2
    top = 1.0 * inch
    box_h = 4.0 * inch
    base_y = top
    pad = 0.25 * inch

    # Before card
    c.setFillColor(CREAM)
    c.roundRect(MARGIN, base_y + 0.4 * inch, col_w, box_h, 10,
                stroke=0, fill=1)
    c.setFillColor(GRAY)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(MARGIN + pad, base_y + 0.4 * inch + box_h - 0.3 * inch,
                 "BEFORE WARM FOLLOW")
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(MARGIN + pad, base_y + 0.4 * inch + box_h - 0.65 * inch,
                 "Phone tag with ghosts")
    pains = [
        "Leads sit for hours while you're in a contract or on another call",
        "You chase tire-kickers who never had real intent",
        "Long follow-up sequences die after touch #2",
        "Speed-to-lead measured in hours, not seconds",
        "Aged leads sit untouched in your CRM forever",
    ]
    py = base_y + 0.4 * inch + box_h - 1.0 * inch
    for p in pains:
        c.setFillColor(CORAL_DARK)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(MARGIN + pad, py, "—")
        wrap_text(c, p, MARGIN + pad + 0.2 * inch, py,
                  col_w - 2 * pad - 0.2 * inch,
                  size=10, leading=13, color=GRAY)
        py -= 0.55 * inch

    # After card
    bx = MARGIN + col_w + 0.25 * inch
    c.setFillColor(SKY)
    c.roundRect(bx, base_y + 0.4 * inch, col_w, box_h, 10,
                stroke=0, fill=1)
    c.setFillColor(SKY_TEXT)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(bx + pad, base_y + 0.4 * inch + box_h - 0.3 * inch,
                 "AFTER WARM FOLLOW")
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(bx + pad, base_y + 0.4 * inch + box_h - 0.65 * inch,
                 "Every lead, worked forever.")
    wins = [
        "AI responds to inbound texts, calls and voicemails in under a minute",
        "Outbound cadences run for months without a human touching them",
        "Only booked, qualified appointments land on your calendar",
        "Voice agent handles live inbound calls — transcribed and scored",
        "You spend time writing contracts, not dialing back dead leads",
    ]
    py = base_y + 0.4 * inch + box_h - 1.0 * inch
    for w in wins:
        c.setFillColor(SKY_TEXT)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(bx + pad, py, "✓")
        wrap_text(c, w, bx + pad + 0.2 * inch, py,
                  col_w - 2 * pad - 0.2 * inch,
                  size=10, leading=13, color=NAVY)
        py -= 0.55 * inch

    footer(c, 3)


# ---------- Page 4 — One agent. Four channels. ----------
def page_04_one_agent(c):
    fill_bg(c, NAVY)
    c.setFillColor(CORAL)
    c.rect(0, 0, 0.35 * inch, PAGE_H, stroke=0, fill=1)

    c.setFillColor(SKY)
    c.setFont("Helvetica-Bold", 9.5)
    c.circle(MARGIN + 0.06 * inch, PAGE_H - 1.16 * inch, 0.06 * inch,
             stroke=0, fill=1)
    c.drawString(MARGIN + 0.22 * inch, PAGE_H - 1.2 * inch,
                 "HOW IT WORKS")

    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 42)
    c.drawString(MARGIN, PAGE_H - 2.0 * inch, "One agent.")
    c.drawString(MARGIN, PAGE_H - 2.6 * inch, "Four channels.")
    c.setFillColor(CORAL)
    c.drawString(MARGIN, PAGE_H - 3.2 * inch, "Running 24/7.")

    c.setFillColor(HexColor("#D7DCE6"))
    sub = ("Warm Follow listens on every channel your leads use — "
           "investor or agent — and only hands off when there's a "
           "confirmed appointment waiting.")
    wrap_text(c, sub, MARGIN, PAGE_H - 3.75 * inch,
              PAGE_W - 2 * MARGIN, size=12, leading=16,
              color=HexColor("#D7DCE6"))

    # Six channel cards (2 columns x 3 rows)
    channels = [
        ("01", "Inbound text & reply",
         "AI reads the thread, references the property, and replies in your tone. No canned lines. No delays.",
         "Median response 47 seconds"),
        ("02", "Inbound voice agent",
         "Live voice AI picks up calls your team misses, qualifies the lead, and books to your calendar.",
         "Full transcript · sentiment scored"),
        ("03", "Outbound cadences",
         "Multi-week SMS + voice sequences nudge cold leads back into conversation. Branches on reply, time and intent.",
         "Up to 11 touches · zero manual work"),
        ("04", "Voicemail + SMS drops",
         "Short, human-sounding voicemail followed by text the same minute. Catches sellers who ignore calls.",
         "Paired drop + immediate SMS"),
        ("05", "Calendar booking",
         "Once intent is confirmed, AI books the slot, sends reminders, and writes to your pipeline automatically.",
         "193+ appointments booked to date"),
        ("06", "Built on your CRM",
         "Drops into GoHighLevel and fires through your numbers, your brand, your cadences. Live in under a week.",
         "GHL-native · live in 7 days"),
    ]
    col_w = (PAGE_W - 2 * MARGIN - 0.2 * inch) / 2
    row_h = 1.45 * inch
    top = PAGE_H - 6.05 * inch
    for i, (num, title, body, foot) in enumerate(channels):
        row = i // 2
        col = i % 2
        x = MARGIN + col * (col_w + 0.2 * inch)
        y = top - row * (row_h + 0.15 * inch)
        c.setFillColor(NAVY_SOFT)
        c.roundRect(x, y, col_w, row_h, 8, stroke=0, fill=1)
        c.setFillColor(SKY)
        c.setFont("Helvetica-Bold", 8)
        c.drawRightString(x + col_w - 0.2 * inch, y + row_h - 0.25 * inch, num)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(x + 0.2 * inch, y + row_h - 0.35 * inch, title)
        wrap_text(c, body, x + 0.2 * inch, y + row_h - 0.6 * inch,
                  col_w - 0.4 * inch, size=9.5, leading=12.5,
                  color=HexColor("#C7CFDD"))
        c.setFillColor(SKY)
        c.setFont("Helvetica-Bold", 8.5)
        c.drawString(x + 0.2 * inch, y + 0.2 * inch, foot + "  →")

    # Bottom strip
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


# ---------- Page 5 — Live conversation case ----------
def page_05_live_thread(c):
    fill_bg(c, CREAM)
    header_band(c)

    kicker(c, "Live Conversations", PAGE_H - 1.4 * inch)
    big_headline(c, "Real threads that", PAGE_H - 1.95 * inch, size=30)
    big_headline(c, "booked real appts.", PAGE_H - 2.4 * inch, size=30,
                 color=CORAL)
    divider(c, PAGE_H - 2.65 * inch)

    intro = (
        "Every message below was sent or received by the AI agent — "
        "no human in the loop. Identifying details preserved from the "
        "actual customer workspace."
    )
    wrap_text(c, intro, MARGIN, PAGE_H - 3.0 * inch,
              PAGE_W - 2 * MARGIN, size=11, leading=15, color=GRAY)

    # Two-column case study layout
    col_w = (PAGE_W - 2 * MARGIN - 0.25 * inch) / 2
    top = 1.4 * inch
    box_h = 4.7 * inch

    # Left: SMS thread mock
    c.setFillColor(white)
    c.setStrokeColor(GRAY_LIGHT)
    c.setLineWidth(0.5)
    c.roundRect(MARGIN, top, col_w, box_h, 10, stroke=1, fill=1)

    # Header in card
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(MARGIN + 0.3 * inch, top + box_h - 0.35 * inch,
                 "James Williams")
    c.setFillColor(GRAY)
    c.setFont("Helvetica", 9)
    c.drawString(MARGIN + 0.3 * inch, top + box_h - 0.55 * inch,
                 "Lead · 3306 Meadowbridge Rd")

    # Tags
    tag_y = top + box_h - 0.85 * inch
    c.setFillColor(SKY)
    c.roundRect(MARGIN + 0.3 * inch, tag_y, 0.55 * inch, 0.2 * inch, 8,
                stroke=0, fill=1)
    c.setFillColor(SKY_TEXT)
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(MARGIN + 0.3 * inch + 0.275 * inch, tag_y + 0.06 * inch,
                        "AI HANDLED")
    c.setFillColor(HexColor("#D7F5DC"))
    c.roundRect(MARGIN + 0.95 * inch, tag_y, 0.5 * inch, 0.2 * inch, 8,
                stroke=0, fill=1)
    c.setFillColor(GREEN)
    c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(MARGIN + 0.95 * inch + 0.25 * inch, tag_y + 0.06 * inch,
                        "BOOKED")

    # Date pill
    c.setFillColor(HexColor("#EFE6DA"))
    c.roundRect(MARGIN + col_w / 2 - 0.55 * inch, tag_y - 0.5 * inch,
                1.1 * inch, 0.25 * inch, 10, stroke=0, fill=1)
    c.setFillColor(GRAY)
    c.setFont("Helvetica", 9)
    c.drawCentredString(MARGIN + col_w / 2, tag_y - 0.34 * inch,
                        "Feb 14, 2026")

    # Bubble (AI message in coral)
    bubble_x = MARGIN + 0.3 * inch
    bubble_w = col_w - 0.9 * inch
    bubble_y = tag_y - 0.7 * inch
    bubble_h = 2.3 * inch
    c.setFillColor(SKY_TEXT)
    c.roundRect(bubble_x, bubble_y - bubble_h, bubble_w, bubble_h, 10,
                stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(bubble_x + 0.15 * inch, bubble_y - 0.2 * inch,
                 "AI · WARM FOLLOW")
    msg = ("James, it's Corey. Did you sell the house yet? If not "
           "let's talk — I need to commit to a purchase before end of "
           "month. Call or text when you get a chance.")
    wrap_text(c, msg, bubble_x + 0.15 * inch, bubble_y - 0.4 * inch,
              bubble_w - 0.3 * inch,
              size=10, leading=13.5, color=white)
    c.setFillColor(HexColor("#A9C0E5"))
    c.setFont("Helvetica", 8)
    c.drawString(bubble_x + 0.15 * inch, bubble_y - bubble_h + 0.15 * inch,
                 "09:56 AM")

    # Right: "What happened" panel
    px = MARGIN + col_w + 0.25 * inch
    c.setFillColor(NAVY)
    c.roundRect(px, top, col_w, box_h, 10, stroke=0, fill=1)
    c.setFillColor(SKY)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(px + 0.3 * inch, top + box_h - 0.35 * inch,
                 "WHAT HAPPENED")
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(px + 0.3 * inch, top + box_h - 0.7 * inch,
                 "Warm Follow ran")
    c.drawString(px + 0.3 * inch, top + box_h - 0.95 * inch,
                 "this cadence for")
    c.setFillColor(CORAL)
    c.drawString(px + 0.3 * inch, top + box_h - 1.2 * inch,
                 "49 days.")

    body = ("Five touches over seven weeks. No human intervention. The "
            "lead went cold at touch #2, warmed again at touch #4, and "
            "eventually converted on a later outbound call.")
    wrap_text(c, body, px + 0.3 * inch, top + box_h - 1.55 * inch,
              col_w - 0.6 * inch,
              size=10.5, leading=14.5, color=HexColor("#C7CFDD"))

    # Stat grid 2x2
    grid_top = top + 0.3 * inch
    cells = [("TOUCHES", "5"), ("DAYS IN CADENCE", "49"),
             ("AI TOKENS USED", "2,141"), ("HUMAN MINUTES", "0")]
    cw = (col_w - 0.6 * inch) / 2
    ch = 0.95 * inch
    for i, (lbl, val) in enumerate(cells):
        cr = i // 2
        cc = i % 2
        cx = px + 0.3 * inch + cc * (cw + 0.05 * inch)
        cy = grid_top + (1 - cr) * (ch + 0.1 * inch)
        c.setStrokeColor(HexColor("#3a4a64"))
        c.setLineWidth(0.5)
        c.line(cx, cy, cx + cw, cy)
        c.setFillColor(SKY)
        c.setFont("Helvetica-Bold", 8.5)
        c.drawString(cx, cy + 0.6 * inch, lbl)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 22)
        c.drawString(cx, cy + 0.2 * inch, val)

    footer(c, 5)


# ---------- Page 6 — By the numbers + ROI table ----------
def page_06_numbers(c):
    fill_bg(c, white)
    header_band(c)

    kicker(c, "ROI · Real Numbers", PAGE_H - 1.4 * inch)
    big_headline(c, "Six figures in", PAGE_H - 1.95 * inch, size=28)
    big_headline(c, "assignments. Zero", PAGE_H - 2.4 * inch, size=28)
    big_headline(c, "hours dialing dead", PAGE_H - 2.85 * inch, size=28,
                 color=CORAL)
    big_headline(c, "leads.", PAGE_H - 3.3 * inch, size=28, color=CORAL)
    divider(c, PAGE_H - 3.55 * inch)

    intro = ("The math on one investor's Warm Follow engagement, "
             "Dec 8, 2025 → Apr 18, 2026. Every figure pulled directly "
             "from the customer's GoHighLevel workspace. Agent customers "
             "report similar lift on sphere, expired and open-house "
             "pipelines.")
    wrap_text(c, intro, MARGIN, PAGE_H - 3.95 * inch,
              PAGE_W - 2 * MARGIN, size=11, leading=15, color=GRAY)

    # ROI table card (mirrors site)
    card_y = 1.0 * inch
    card_h = 5.2 * inch
    c.setFillColor(white)
    c.setStrokeColor(GRAY_LIGHT)
    c.setLineWidth(0.6)
    c.roundRect(MARGIN, card_y, PAGE_W - 2 * MARGIN, card_h, 10,
                stroke=1, fill=1)

    rows = [
        ("Appointments booked by AI", "193"),
        ("Confirmed (vs. cancelled)", "192  ·  99%"),
        ("Wholesale assignments closed", "$100,000+"),
        ("Active opportunities worked", "1,521"),
        ("Avg AI response (inbound text)", "47 s"),
        ("Call sentiment (scored calls)", "91% positive"),
        ("Human follow-up hours spent", "0"),
        ("Hours saved vs. manual dialing*", "~480 hrs"),
    ]
    row_h = (card_h - 1.3 * inch) / len(rows)
    for i, (label, val) in enumerate(rows):
        ry = card_y + card_h - 0.4 * inch - (i + 1) * row_h
        c.setFillColor(NAVY)
        c.setFont("Helvetica", 11.5)
        c.drawString(MARGIN + 0.35 * inch, ry + row_h - 0.28 * inch, label)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 13)
        c.drawRightString(PAGE_W - MARGIN - 0.35 * inch,
                          ry + row_h - 0.28 * inch, val)
        c.setStrokeColor(HexColor("#E5E5E5"))
        c.setLineWidth(0.4)
        c.line(MARGIN + 0.35 * inch, ry,
               PAGE_W - MARGIN - 0.35 * inch, ry)

    # Effective value row
    ev_y = card_y + 0.45 * inch
    c.setStrokeColor(NAVY)
    c.setLineWidth(1.2)
    c.line(MARGIN + 0.35 * inch, ev_y + 0.35 * inch,
           PAGE_W - MARGIN - 0.35 * inch, ev_y + 0.35 * inch)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(MARGIN + 0.35 * inch, ev_y + 0.05 * inch,
                 "Effective value")
    c.setFillColor(SKY_TEXT)
    c.setFont("Helvetica-Bold", 22)
    c.drawRightString(PAGE_W - MARGIN - 0.35 * inch, ev_y + 0.05 * inch,
                      "Priceless.")

    # Footnote
    wrap_text(c,
              "* Based on 1,521 leads × avg. 3 touches × 6 min/touch "
              "if worked manually. Figures pulled from client's GHL "
              "workspace; raw export available on request.",
              MARGIN + 0.35 * inch, card_y + 0.3 * inch,
              PAGE_W - 2 * MARGIN - 0.7 * inch,
              font="Helvetica-Oblique", size=8.5, leading=11, color=GRAY)

    footer(c, 6)


# ---------- Page 7 — For Investors ----------
def page_07_for_investors(c):
    fill_bg(c, CREAM)
    header_band(c)

    kicker(c, "For Real Estate Investors", PAGE_H - 1.4 * inch)
    big_headline(c, "Wholesalers, flippers,", PAGE_H - 1.95 * inch, size=28)
    big_headline(c, "landlords — every", PAGE_H - 2.4 * inch, size=28)
    big_headline(c, "lead, worked forever.", PAGE_H - 2.85 * inch, size=28,
                 color=CORAL)
    divider(c, PAGE_H - 3.1 * inch)

    intro = (
        "Cold lists, skip-traced numbers, driving-for-dollars routes, "
        "PPC leads — they all need the same thing: relentless, "
        "compliant follow-up. Warm Follow runs that follow-up while "
        "you go acquire the next deal."
    )
    wrap_text(c, intro, MARGIN, PAGE_H - 3.45 * inch,
              PAGE_W - 2 * MARGIN, size=11.5, leading=17, color=GRAY)

    plays = [
        ("Motivated Seller Nurture",
         "Multi-week SMS + AI voice cadence for tired landlords, "
         "pre-foreclosures and inherited properties. Branches on "
         "reply, time-of-day and intent."),
        ("Cash-Buyer List Activation",
         "Drip your buyer list with new contracts and JV "
         "opportunities. AI calls, qualifies and tees up only the "
         "serious ones."),
        ("Wholesale Disposition",
         "Texts every filtered buyer the same minute a contract "
         "lands. Books showings and assignment calls automatically."),
        ("Aged Lead Resurrection",
         "Pull every dead lead out of your CRM and let Warm Follow "
         "warm them back up. The James Williams case (page 5) was a "
         "49-day resurrection."),
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

    # Founder quote ROI strip
    c.setFillColor(CORAL)
    c.roundRect(MARGIN, 0.95 * inch, PAGE_W - 2 * MARGIN, 1.15 * inch, 10,
                stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("Helvetica-Oblique", 11.5)
    wrap_text(c,
              "“I stopped calling leads back months ago. The AI handles "
              "every inbound and every follow-up. I spend my time "
              "writing contracts — not chasing ghosts.”",
              MARGIN + 0.3 * inch, 1.92 * inch,
              PAGE_W - 2 * MARGIN - 0.6 * inch,
              font="Helvetica-Oblique", size=11, leading=14.5, color=white)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(MARGIN + 0.3 * inch, 1.15 * inch,
                 "— Corey Vickers, Founder · VA Home Offer (six figures in assignments closed)")

    footer(c, 7)


# ---------- Page 8 — For Agents ----------
def page_08_for_agents(c):
    fill_bg(c, white)
    header_band(c)

    kicker(c, "For Real Estate Agents", PAGE_H - 1.4 * inch)
    big_headline(c, "Your sphere, your", PAGE_H - 1.95 * inch, size=28)
    big_headline(c, "open houses, your", PAGE_H - 2.4 * inch, size=28)
    big_headline(c, "expireds — handled.", PAGE_H - 2.85 * inch, size=28,
                 color=CORAL)
    divider(c, PAGE_H - 3.1 * inch)

    intro = (
        "Warm Follow plugs into the way real agents actually work. "
        "Drop a sign-in sheet, snap a business card, forward a Zillow "
        "inquiry — every lead is captured, qualified by AI voice, and "
        "warmed up before the next showing ends."
    )
    wrap_text(c, intro, MARGIN, PAGE_H - 3.45 * inch,
              PAGE_W - 2 * MARGIN, size=11.5, leading=17, color=GRAY)

    plays = [
        ("Open House Follow-Up",
         "Inbound voice agent answers when buyers call back from "
         "the sign. Outbound cadence turns weekend visitors into "
         "listing appointments."),
        ("Sphere Re-Engagement",
         "Quarterly check-ins to past clients in your voice. They "
         "think you personally remembered their home-bought-day."),
        ("Expired Listings",
         "Same-day SMS + AI voice combo books the listing "
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

    # Why agents choose card
    c.setFillColor(NAVY)
    c.roundRect(MARGIN, 0.95 * inch, PAGE_W - 2 * MARGIN, 1.15 * inch, 10,
                stroke=0, fill=1)
    c.setFillColor(CORAL)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(MARGIN + 0.3 * inch, 1.85 * inch,
                 "WHY REAL ESTATE PROS CHOOSE WARM FOLLOW")
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 11)
    items = [
        "Save Time — automate routine follow-up so you can close",
        "Increase Revenue — convert more leads with AI nurturing",
        "Stay Compliant — TCPA, CAN-SPAM and carrier rules built in",
    ]
    yy = 1.6 * inch
    for it in items:
        c.setFillColor(CORAL)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(MARGIN + 0.3 * inch, yy, "✓")
        c.setFillColor(white)
        c.setFont("Helvetica", 10.5)
        c.drawString(MARGIN + 0.55 * inch, yy, it)
        yy -= 0.2 * inch

    footer(c, 8)


# ---------- Page 9 — Voice agent dashboard ----------
def page_09_voice_dash(c):
    fill_bg(c, CREAM)
    header_band(c)

    kicker(c, "Voice Agent Dashboard", PAGE_H - 1.4 * inch)
    big_headline(c, "79 inbound calls.", PAGE_H - 1.95 * inch, size=26)
    big_headline(c, "91% positive.", PAGE_H - 2.4 * inch, size=26,
                 color=CORAL)
    big_headline(c, "Average 42 seconds.", PAGE_H - 2.85 * inch, size=26)
    divider(c, PAGE_H - 3.1 * inch)

    intro = (
        "Thirty-day slice of one Warm Follow customer's voice agent "
        "activity. The AI handles every inbound call that would "
        "otherwise go to voicemail — and triggers actions in the CRM "
        "automatically."
    )
    wrap_text(c, intro, MARGIN, PAGE_H - 3.45 * inch,
              PAGE_W - 2 * MARGIN, size=11.5, leading=17, color=GRAY)

    # Dashboard mock card
    dash_y = 1.0 * inch
    dash_h = 4.55 * inch
    c.setFillColor(white)
    c.setStrokeColor(GRAY_LIGHT)
    c.setLineWidth(0.6)
    c.roundRect(MARGIN, dash_y, PAGE_W - 2 * MARGIN, dash_h, 10,
                stroke=1, fill=1)

    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 14)
    c.drawString(MARGIN + 0.3 * inch, dash_y + dash_h - 0.4 * inch,
                 "AI Agents · Dashboard & Logs")
    c.setFillColor(GRAY)
    c.setFont("Helvetica", 10)
    c.drawString(MARGIN + 0.3 * inch, dash_y + dash_h - 0.6 * inch,
                 "Mar 19  →  Apr 18, 2026  ·  All agents")

    # Tab pills
    tab_y = dash_y + dash_h - 1.05 * inch
    c.setFillColor(NAVY)
    c.roundRect(MARGIN + 0.3 * inch, tab_y, 0.9 * inch, 0.3 * inch, 8,
                stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(MARGIN + 0.3 * inch + 0.45 * inch,
                        tab_y + 0.1 * inch, "Inbound")
    c.setFillColor(GRAY)
    c.setFont("Helvetica", 10)
    c.drawString(MARGIN + 1.3 * inch, tab_y + 0.1 * inch, "Outbound")

    # Three big metric cards
    metrics = [
        ("TOTAL CALLS", "79", "↑ 12 vs. previous 30 days"),
        ("ACTIONS TRIGGERED", "9", "Appts booked, leads updated, notes written"),
        ("SENTIMENT", "91 %", "Positive · scored on every completed call"),
    ]
    cw = (PAGE_W - 2 * MARGIN - 0.6 * inch - 0.3 * inch) / 3
    ch = 1.6 * inch
    cy = dash_y + 1.4 * inch
    for i, (lbl, val, sub) in enumerate(metrics):
        cx = MARGIN + 0.3 * inch + i * (cw + 0.15 * inch)
        c.setFillColor(CREAM if i != 1 else SKY)
        c.roundRect(cx, cy, cw, ch, 8, stroke=0, fill=1)
        c.setFillColor(GRAY)
        c.setFont("Helvetica-Bold", 8.5)
        c.drawString(cx + 0.2 * inch, cy + ch - 0.3 * inch, lbl)
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 30)
        c.drawString(cx + 0.2 * inch, cy + 0.6 * inch, val)
        c.setFillColor(GRAY)
        c.setFont("Helvetica", 8.5)
        wrap_text(c, sub, cx + 0.2 * inch, cy + 0.4 * inch,
                  cw - 0.4 * inch, size=8.5, leading=11, color=GRAY)

    # Bottom info row — total/avg call duration
    sub_y = cy - 1.05 * inch
    c.setFillColor(GRAY)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(MARGIN + 0.3 * inch, sub_y + 0.7 * inch, "TOTAL DURATION")
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(MARGIN + 0.3 * inch, sub_y + 0.4 * inch, "54")
    c.setFont("Helvetica", 12)
    c.drawString(MARGIN + 0.85 * inch, sub_y + 0.42 * inch, "mins")

    c.setFillColor(GRAY)
    c.setFont("Helvetica-Bold", 8.5)
    c.drawString(MARGIN + 3.3 * inch, sub_y + 0.7 * inch,
                 "AVERAGE CALL DURATION")
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(MARGIN + 3.3 * inch, sub_y + 0.4 * inch, "0.7")
    c.setFont("Helvetica", 12)
    c.drawString(MARGIN + 3.85 * inch, sub_y + 0.42 * inch, "mins")

    footer(c, 9)


# ---------- Page 10 — Built on your CRM (GHL) ----------
def page_10_ghl(c):
    fill_bg(c, NAVY)
    c.setFillColor(CORAL)
    c.rect(0, 0, 0.35 * inch, PAGE_H, stroke=0, fill=1)

    c.setFillColor(SKY)
    c.setFont("Helvetica-Bold", 9.5)
    c.circle(MARGIN + 0.06 * inch, PAGE_H - 1.16 * inch, 0.06 * inch,
             stroke=0, fill=1)
    c.drawString(MARGIN + 0.22 * inch, PAGE_H - 1.2 * inch,
                 "ROLLOUT")

    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 38)
    c.drawString(MARGIN, PAGE_H - 2.0 * inch, "Drops into your CRM.")
    c.setFillColor(CORAL)
    c.drawString(MARGIN, PAGE_H - 2.55 * inch, "Live in 7 days.")

    c.setFillColor(HexColor("#D7DCE6"))
    sub = ("Warm Follow is GoHighLevel-native. It plugs into your "
           "existing GHL sub-account and fires through your numbers, "
           "your brand, your cadences. Your team keeps the records — "
           "AI does all the reaching out.")
    wrap_text(c, sub, MARGIN, PAGE_H - 3.2 * inch,
              PAGE_W - 2 * MARGIN, size=12.5, leading=18,
              color=HexColor("#D7DCE6"))

    # Rollout timeline
    days = [
        ("DAY 1", "Kickoff & GHL connect",
         "30-min onboarding call. We connect to your GHL sub-account, "
         "map cadences, set the AI voice + tone."),
        ("DAY 2-4", "Cadences + voice training",
         "Prebuilt motivated-seller and cash-buyer playbooks loaded "
         "and tuned to your market and pricing scripts."),
        ("DAY 5-7", "Test, go live",
         "Live test against a sandbox lead. Numbers warmed and "
         "registered. AI starts answering inbound and running "
         "outbound on day 7."),
    ]
    y = PAGE_H - 4.6 * inch
    for tag, title, body in days:
        c.setFillColor(CORAL)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(MARGIN, y, tag)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 14)
        c.drawString(MARGIN + 1.2 * inch, y, title)
        wrap_text(c, body, MARGIN + 1.2 * inch, y - 0.22 * inch,
                  PAGE_W - 2 * MARGIN - 1.2 * inch,
                  size=10.5, leading=14, color=HexColor("#C7CFDD"))
        y -= 0.95 * inch

    # Bottom strip
    c.setFillColor(CORAL)
    c.rect(0, 0.7 * inch, PAGE_W, 0.45 * inch, stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(PAGE_W / 2, 0.9 * inch,
                        "GHL-NATIVE  ·  LIVE IN 7 DAYS  ·  warmfollow.com")
    c.setFillColor(HexColor("#A9B6CC"))
    c.setFont("Helvetica", 8)
    c.drawString(MARGIN, 0.4 * inch,
                 "Warm Follow — AI follow-up that books real estate appointments while you sleep.")
    c.drawRightString(PAGE_W - MARGIN, 0.4 * inch, "Page 10 of 12")


# ---------- Page 11 — Pricing ----------
def page_11_pricing(c):
    fill_bg(c, white)
    header_band(c)

    kicker(c, "Choose Your Plan", PAGE_H - 1.4 * inch)
    big_headline(c, "Scale your real estate", PAGE_H - 1.95 * inch, size=26)
    big_headline(c, "business with AI.", PAGE_H - 2.4 * inch, size=26,
                 color=CORAL)
    divider(c, PAGE_H - 2.65 * inch)

    intro = ("Start small or go all-in. Every plan includes the AI Voice "
             "Agent, AI SMS Agent, Appointment Scheduling and "
             "Integrations — only the volume and white-glove level changes.")
    wrap_text(c, intro, MARGIN, PAGE_H - 3.0 * inch,
              PAGE_W - 2 * MARGIN, size=11, leading=15, color=GRAY)

    plans = [
        ("STARTER", "$99", "/mo", "$500 onboarding",
         "Agents getting started with AI nurturing.",
         ["Unlimited contacts",
          "5 active campaigns",
          "Basic analytics",
          "AI Voice + SMS Agents",
          "Appointment scheduling",
          "Integrations"],
         False, False),
        ("PROFESSIONAL", "$499", "/mo", "$999 onboarding",
         "Teams ready to scale with full AI capabilities.",
         ["Unlimited contacts",
          "Unlimited campaigns",
          "Advanced analytics",
          "AI Voice + SMS Agents",
          "Dedicated account manager",
          "75 VA hours / month"],
         True, False),
        ("ENTERPRISE", "$1,497", "/mo", "$1,500 onboarding",
         "White-glove with website + ad management.",
         ["Everything in Professional",
          "150 VA hours / month",
          "Custom website build",
          "Ad management included",
          "Dedicated success manager",
          "Quarterly strategy reviews"],
         False, True),
    ]
    box_w = (PAGE_W - 2 * MARGIN - 0.3 * inch) / 3
    box_h = 4.4 * inch
    top = PAGE_H - 7.65 * inch
    for i, (name, price, suffix, onboard, blurb, perks,
            popular, best) in enumerate(plans):
        x = MARGIN + i * (box_w + 0.15 * inch)
        bg = NAVY if popular else white
        border = NAVY if popular else GRAY_LIGHT
        head_color = CORAL if popular else NAVY
        sub_color = white if popular else NAVY
        body_color = HexColor("#D7DCE6") if popular else GRAY

        c.setStrokeColor(border)
        c.setLineWidth(1)
        c.setFillColor(bg)
        c.roundRect(x, top, box_w, box_h, 10, stroke=1, fill=1)

        if popular or best:
            c.setFillColor(CORAL if popular else GOLD)
            c.roundRect(x, top + box_h - 0.3 * inch, box_w, 0.3 * inch, 10,
                        stroke=0, fill=1)
            c.setFillColor(white if popular else NAVY)
            c.setFont("Helvetica-Bold", 9)
            c.drawCentredString(x + box_w / 2, top + box_h - 0.2 * inch,
                                "MOST POPULAR" if popular else "BEST VALUE")

        c.setFillColor(head_color)
        c.setFont("Helvetica-Bold", 12)
        c.drawCentredString(x + box_w / 2, top + box_h - 0.7 * inch, name)

        c.setFillColor(sub_color)
        c.setFont("Helvetica-Bold", 26)
        c.drawCentredString(x + box_w / 2, top + box_h - 1.2 * inch, price)
        c.setFont("Helvetica", 11)
        c.drawCentredString(x + box_w / 2, top + box_h - 1.42 * inch,
                            suffix.strip())

        c.setFillColor(body_color)
        c.setFont("Helvetica-Oblique", 9)
        c.drawCentredString(x + box_w / 2, top + box_h - 1.7 * inch, onboard)

        c.setFont("Helvetica", 9.5)
        wrap_text(c, blurb, x + 0.2 * inch, top + box_h - 1.95 * inch,
                  box_w - 0.4 * inch, size=9.5, leading=12.5, color=body_color)

        py = top + box_h - 2.55 * inch
        for perk in perks:
            c.setFillColor(CORAL)
            c.setFont("Helvetica-Bold", 10)
            c.drawString(x + 0.2 * inch, py, "✓")
            c.setFillColor(body_color)
            c.setFont("Helvetica", 9.5)
            c.drawString(x + 0.42 * inch, py, perk)
            py -= 0.24 * inch

    # Add-ons strip
    addon_y = 1.0 * inch
    c.setFillColor(CORAL)
    c.roundRect(MARGIN, addon_y, PAGE_W - 2 * MARGIN, 1.2 * inch, 10,
                stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(MARGIN + 0.3 * inch, addon_y + 0.95 * inch,
                 "BOOST ANY PLAN WITH ADD-ONS")
    c.setFont("Helvetica", 10)
    addons = [
        "Premium Support  $500/mo",
        "Pay-Per-Lead  $75 – $250/lead",
        "Website Dev  $750 – $2,500",
        "AI VA Part-Time  $800/mo",
        "AI VA Full-Time  $1,500/mo",
    ]
    ay = addon_y + 0.7 * inch
    for a in addons:
        c.drawString(MARGIN + 0.3 * inch, ay, "•  " + a)
        ay -= 0.13 * inch

    footer(c, 11)


# ---------- Page 12 — Back Cover ----------
def page_12_back_cover(c):
    fill_bg(c, NAVY)

    # Brand mark
    c.setFillColor(CORAL)
    c.circle(MARGIN + 0.07 * inch, PAGE_H - 0.83 * inch, 0.09 * inch,
             stroke=0, fill=1)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(MARGIN + 0.25 * inch, PAGE_H - 0.9 * inch, "WARM FOLLOW")

    c.setFillColor(CORAL)
    c.setFont("Helvetica-Bold", 10)
    c.drawString(MARGIN, PAGE_H - 2.0 * inch, "READY WHEN YOU ARE")

    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 42)
    c.drawString(MARGIN, PAGE_H - 3.0 * inch, "Ready to transform")
    c.drawString(MARGIN, PAGE_H - 3.6 * inch, "your lead")
    c.setFillColor(CORAL)
    c.drawString(MARGIN, PAGE_H - 4.2 * inch, "follow-up?")

    c.setFillColor(HexColor("#D7DCE6"))
    wrap_text(c,
              "See Warm Follow texting, dialing and booking in real "
              "time against a live test lead. 30 minutes. Your CRM. "
              "No slides.",
              MARGIN, PAGE_H - 4.8 * inch,
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
                 "Mention this booklet for a personalized GHL onboarding.")

    # Three quick reasons
    reasons = ["GHL-native · live in 7 days",
               "AI voice + SMS in one stack",
               "193+ appts booked to date"]
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
    c.setTitle("Warm Follow — Introductory Booklet for Investors & Agents")
    c.setAuthor("Warm Follow")
    c.setSubject("AI follow-up that books real estate appointments while you sleep")
    c.setKeywords(["Warm Follow", "real estate", "investors", "realtors",
                   "AI follow-up", "GoHighLevel", "GHL", "wholesale"])

    pages = [
        page_01_front_cover,
        page_02_welcome,
        page_03_problem,
        page_04_one_agent,
        page_05_live_thread,
        page_06_numbers,
        page_07_for_investors,
        page_08_for_agents,
        page_09_voice_dash,
        page_10_ghl,
        page_11_pricing,
        page_12_back_cover,
    ]
    for fn in pages:
        fn(c)
        c.showPage()
    c.save()
    print(f"Wrote {OUT} ({OUT.stat().st_size / 1024:.1f} KB)")


if __name__ == "__main__":
    build()
