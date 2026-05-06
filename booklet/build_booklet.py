"""
Generate a 12-page PDF booklet:
"The Owner's Guide to AI: Buy Back Time, Convert More Customers, Reduce Burnout"
by Justin Rayside, Peaking Momentum.
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

OUTPUT = "/home/user/claudemomo/booklet/AI_Owners_Guide_Peaking_Momentum.pdf"

# Brand palette
NAVY = HexColor("#0E1A2B")
DEEP = HexColor("#152238")
INK = HexColor("#1B1B1B")
SLATE = HexColor("#3A4A5E")
MUTED = HexColor("#5C6B7A")
LINE = HexColor("#D7DCE2")
CREAM = HexColor("#F6F2EA")
ACCENT = HexColor("#E0822A")  # momentum orange
ACCENT_DK = HexColor("#B5631A")
GOLD = HexColor("#C9A24A")

PAGE_W, PAGE_H = letter

# ---- Drawing helpers --------------------------------------------------------

def page_border(c):
    c.setStrokeColor(LINE)
    c.setLineWidth(0.6)
    c.rect(0.55 * inch, 0.55 * inch,
           PAGE_W - 1.10 * inch, PAGE_H - 1.10 * inch, stroke=1, fill=0)


def header_band(c, eyebrow, title):
    """Top header used on interior pages."""
    c.setFillColor(NAVY)
    c.rect(0, PAGE_H - 1.1 * inch, PAGE_W, 1.1 * inch, stroke=0, fill=1)

    c.setFillColor(ACCENT)
    c.rect(0, PAGE_H - 1.16 * inch, PAGE_W, 0.06 * inch, stroke=0, fill=1)

    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(0.75 * inch, PAGE_H - 0.45 * inch, eyebrow.upper())

    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 22)
    c.drawString(0.75 * inch, PAGE_H - 0.85 * inch, title)


def footer(c, page_num, total=12):
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 8.5)
    c.drawString(0.75 * inch, 0.45 * inch, "PEAKING MOMENTUM  ·  THE OWNER'S GUIDE TO AI")
    c.drawRightString(PAGE_W - 0.75 * inch, 0.45 * inch, f"{page_num} / {total}")
    c.setStrokeColor(LINE)
    c.setLineWidth(0.4)
    c.line(0.75 * inch, 0.62 * inch, PAGE_W - 0.75 * inch, 0.62 * inch)


def wrapped_text(c, text, x, y, max_width, font="Helvetica", size=11,
                 leading=15, color=INK):
    """Simple word-wrapped paragraph. Returns the y position after drawing."""
    c.setFillColor(color)
    c.setFont(font, size)
    words = text.split()
    line = ""
    for w in words:
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


def section_title(c, x, y, text, color=NAVY, size=15):
    c.setFillColor(color)
    c.setFont("Helvetica-Bold", size)
    c.drawString(x, y, text)
    c.setStrokeColor(ACCENT)
    c.setLineWidth(2)
    c.line(x, y - 5, x + 0.6 * inch, y - 5)


def bullet(c, x, y, label, body, max_width, label_color=NAVY):
    c.setFillColor(ACCENT)
    c.circle(x + 4, y + 4, 3, stroke=0, fill=1)
    c.setFillColor(label_color)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(x + 14, y, label)
    label_w = c.stringWidth(label + "  ", "Helvetica-Bold", 11)
    return wrapped_text(c, body, x + 14 + label_w, y, max_width - 14 - label_w,
                        size=11, leading=15, color=SLATE)


def pull_quote(c, x, y, w, quote, attrib):
    c.setFillColor(CREAM)
    c.roundRect(x, y - 1.05 * inch, w, 1.05 * inch, 8, stroke=0, fill=1)
    c.setFillColor(ACCENT)
    c.rect(x, y - 1.05 * inch, 4, 1.05 * inch, stroke=0, fill=1)
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Oblique", 12)
    wrapped_text(c, f"“{quote}”", x + 16, y - 18, w - 28,
                 font="Helvetica-Oblique", size=12, leading=16, color=NAVY)
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(x + 16, y - 1.05 * inch + 14, attrib.upper())


# ---- Pages ------------------------------------------------------------------

def front_cover(c):
    # Full-bleed background
    c.setFillColor(NAVY)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)

    # Mountain / peak silhouettes (abstract)
    c.setFillColor(DEEP)
    p = c.beginPath()
    p.moveTo(0, 3.4 * inch)
    p.lineTo(2.4 * inch, 5.6 * inch)
    p.lineTo(4.0 * inch, 4.2 * inch)
    p.lineTo(5.8 * inch, 6.4 * inch)
    p.lineTo(8.5 * inch, 4.0 * inch)
    p.lineTo(PAGE_W, 5.0 * inch)
    p.lineTo(PAGE_W, 0)
    p.lineTo(0, 0)
    p.close()
    c.drawPath(p, stroke=0, fill=1)

    c.setFillColor(HexColor("#1E2C44"))
    p = c.beginPath()
    p.moveTo(0, 2.2 * inch)
    p.lineTo(3.0 * inch, 4.0 * inch)
    p.lineTo(5.2 * inch, 2.8 * inch)
    p.lineTo(7.4 * inch, 4.4 * inch)
    p.lineTo(PAGE_W, 3.0 * inch)
    p.lineTo(PAGE_W, 0)
    p.lineTo(0, 0)
    p.close()
    c.drawPath(p, stroke=0, fill=1)

    # Accent peak
    c.setFillColor(ACCENT)
    p = c.beginPath()
    p.moveTo(4.4 * inch, 2.6 * inch)
    p.lineTo(5.4 * inch, 4.5 * inch)
    p.lineTo(6.4 * inch, 2.6 * inch)
    p.close()
    c.drawPath(p, stroke=0, fill=1)

    # Inner border
    c.setStrokeColor(GOLD)
    c.setLineWidth(0.8)
    c.rect(0.55 * inch, 0.55 * inch, PAGE_W - 1.1 * inch, PAGE_H - 1.1 * inch,
           stroke=1, fill=0)

    # Eyebrow
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 1.5 * inch,
                        "A PEAKING MOMENTUM FIELD GUIDE  ·  2026")

    # Title
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 38)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 2.6 * inch, "The Owner's")
    c.drawCentredString(PAGE_W / 2, PAGE_H - 3.2 * inch, "Guide to AI")

    # Divider
    c.setStrokeColor(ACCENT)
    c.setLineWidth(2.5)
    c.line(PAGE_W / 2 - 0.6 * inch, PAGE_H - 3.55 * inch,
           PAGE_W / 2 + 0.6 * inch, PAGE_H - 3.55 * inch)

    # Subtitle
    c.setFillColor(HexColor("#E8ECF2"))
    c.setFont("Helvetica-Oblique", 15)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 3.95 * inch,
                        "How forward-thinking owners are using AI to")
    c.drawCentredString(PAGE_W / 2, PAGE_H - 4.20 * inch,
                        "buy back time, convert more customers,")
    c.drawCentredString(PAGE_W / 2, PAGE_H - 4.45 * inch,
                        "and reduce burnout.")

    # Bottom block — author
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 13)
    c.drawCentredString(PAGE_W / 2, 1.6 * inch, "JUSTIN RAYSIDE")
    c.setFillColor(GOLD)
    c.setFont("Helvetica", 10)
    c.drawCentredString(PAGE_W / 2, 1.35 * inch,
                        "FOUNDER  ·  PEAKING MOMENTUM")

    c.showPage()


def page_2_intro(c):
    page_border(c)
    header_band(c, "Introduction", "If you're the bottleneck, read this first.")
    y = PAGE_H - 1.7 * inch
    x = 0.85 * inch
    w = PAGE_W - 1.7 * inch

    y = wrapped_text(c,
        "You started the business to gain freedom — more time, more income, "
        "more control. Somewhere along the way, the business started running you.",
        x, y, w, size=12, leading=17)
    y -= 8
    y = wrapped_text(c,
        "Leads slip through the cracks. Quotes go out late. Onboarding is held "
        "together with sticky notes and a single overworked admin. You're the "
        "best closer, the best operator, and the only person who knows how "
        "everything actually works. So you can never step away.",
        x, y, w, size=12, leading=17, color=SLATE)
    y -= 14

    section_title(c, x, y, "What this booklet will give you")
    y -= 26
    y = bullet(c, x, y,
               "Clarity:",
               "where AI actually moves the needle in sales, marketing, and operations — "
               "and where it's just hype.",
               w)
    y -= 8
    y = bullet(c, x, y,
               "A framework:",
               "the three outcomes every owner should be optimising for, and "
               "the systems that produce them.",
               w)
    y -= 8
    y = bullet(c, x, y,
               "A path forward:",
               "how Peaking Momentum builds custom AI systems around your "
               "business — not the other way around.",
               w)
    y -= 24

    pull_quote(c, x, y, w,
               "Most owners don't have a marketing problem or a sales problem. "
               "They have a bottleneck problem. AI is the leverage that finally "
               "fixes it.",
               "Justin Rayside, Founder — Peaking Momentum")

    footer(c, 2)
    c.showPage()


def page_3_why_now(c):
    page_border(c)
    header_band(c, "Chapter 1", "Why now is different.")
    y = PAGE_H - 1.75 * inch
    x = 0.85 * inch
    w = PAGE_W - 1.7 * inch

    y = wrapped_text(c,
        "Every business owner has heard the AI pitch. What's changed in the "
        "last 18 months isn't the marketing — it's the math.",
        x, y, w, size=12, leading=17)
    y -= 8
    y = wrapped_text(c,
        "AI agents can now read your inbox, write to your CRM, qualify a lead "
        "on a call, draft a proposal, and update a job in your ops system — "
        "without a human stitching it together. The cost has collapsed. The "
        "reliability is finally high enough to trust with revenue.",
        x, y, w, size=12, leading=17, color=SLATE)
    y -= 18

    section_title(c, x, y, "Three forces converging")
    y -= 28

    items = [
        ("Capability",
         "Modern models reason, follow instructions, and use tools. They don't "
         "just chat — they take action across the systems you already own."),
        ("Cost",
         "Tasks that cost a virtual assistant $15 now run for cents. The unit "
         "economics of customer follow-up have permanently changed."),
        ("Connectivity",
         "APIs and protocols like MCP let one AI system safely touch your CRM, "
         "calendar, accounting, and phone — the same way a great employee would."),
    ]
    for label, body in items:
        y = bullet(c, x, y, label + ":", body, w)
        y -= 10

    y -= 8
    pull_quote(c, x, y, w,
               "The owners who win the next decade aren't the ones who use AI "
               "the most. They're the ones who wire it into the right place in "
               "their business.",
               "From the field — Peaking Momentum client engagements")

    footer(c, 3)
    c.showPage()


def page_4_sales(c):
    page_border(c)
    header_band(c, "Chapter 2  ·  Sales", "Stop losing deals to slow follow-up.")
    y = PAGE_H - 1.75 * inch
    x = 0.85 * inch
    w = PAGE_W - 1.7 * inch

    y = wrapped_text(c,
        "Speed-to-lead is the single most predictive metric in small-business "
        "sales. Respond in five minutes and you're 9x more likely to convert. "
        "Most owners take hours — or the lead never gets called at all.",
        x, y, w, size=12, leading=17)
    y -= 14

    section_title(c, x, y, "Where AI earns its keep in sales")
    y -= 28

    items = [
        ("Instant lead response.",
         "An AI voice or SMS agent calls every new lead within 60 seconds, "
         "qualifies them, and books the appointment straight onto your calendar."),
        ("Follow-up that actually happens.",
         "AI works the long tail — the leads that went cold, the no-shows, "
         "the quotes you sent two weeks ago — at a cadence no human will sustain."),
        ("Pipeline hygiene.",
         "Notes get written, deals get moved, next steps get logged — automatically, "
         "after every call. Your CRM finally tells the truth."),
        ("Proposal & quote drafting.",
         "AI assembles tailored quotes from your pricing rules in minutes, "
         "not hours, freeing the closer to actually close."),
    ]
    for label, body in items:
        y = bullet(c, x, y, label, body, w)
        y -= 10

    y -= 4
    pull_quote(c, x, y, w,
               "We rebuilt one client's intake so AI handled the first 90 "
               "seconds of every lead. Booked appointments went up 38% in six "
               "weeks — same ad spend, same team.",
               "Peaking Momentum case pattern")

    footer(c, 4)
    c.showPage()


def page_5_marketing(c):
    page_border(c)
    header_band(c, "Chapter 3  ·  Marketing", "Show up consistently — without burning out.")
    y = PAGE_H - 1.75 * inch
    x = 0.85 * inch
    w = PAGE_W - 1.7 * inch

    y = wrapped_text(c,
        "Most owners know what their marketing should look like. The problem "
        "isn't strategy — it's consistency. AI fixes consistency.",
        x, y, w, size=12, leading=17)
    y -= 8
    y = wrapped_text(c,
        "Used well, AI doesn't replace your voice. It amplifies it. It turns "
        "one good idea into a week of content, one happy customer into three "
        "case studies, one webinar into a month of social posts.",
        x, y, w, size=12, leading=17, color=SLATE)
    y -= 16

    section_title(c, x, y, "Highest-leverage marketing plays")
    y -= 28

    items = [
        ("Content engine.",
         "Record once. AI turns it into blogs, social posts, email newsletters, "
         "and short-form video scripts — in your tone of voice."),
        ("Hyper-personalised email.",
         "Segment by behaviour and write copy that actually speaks to where "
         "the customer is in their journey, at scale."),
        ("Review & reputation loop.",
         "AI requests reviews at the perfect moment, drafts responses, and "
         "flags problems before they hit Google."),
        ("Ad creative testing.",
         "Generate and rotate dozens of ad variants weekly. Let the data, "
         "not your gut, decide what runs."),
    ]
    for label, body in items:
        y = bullet(c, x, y, label, body, w)
        y -= 10

    y -= 4
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(x, y, "Watch out for:")
    y -= 16
    y = wrapped_text(c,
        "Generic AI content with no point of view will hurt your brand faster "
        "than no content at all. The system has to be trained on your voice, "
        "your offers, your customers — that's where custom wins over off-the-shelf.",
        x, y, w, size=11, leading=15, color=SLATE)

    footer(c, 5)
    c.showPage()


def page_6_operations(c):
    page_border(c)
    header_band(c, "Chapter 4  ·  Operations", "The quiet revolution in the back office.")
    y = PAGE_H - 1.75 * inch
    x = 0.85 * inch
    w = PAGE_W - 1.7 * inch

    y = wrapped_text(c,
        "Operations is where AI quietly delivers the biggest ROI — and where "
        "most owners haven't even started looking. Every email re-typed into "
        "a system, every status update chased on Slack, every report copy-pasted "
        "into a spreadsheet is leverage waiting to be claimed.",
        x, y, w, size=12, leading=17)
    y -= 16

    section_title(c, x, y, "Where ops automation pays back fastest")
    y -= 28

    items = [
        ("Inbox triage.",
         "AI reads, categorises, drafts replies, and escalates only what "
         "actually needs you. A two-hour morning becomes 20 minutes."),
        ("Job & project updates.",
         "Customers get proactive, accurate status updates without your team "
         "writing a single message."),
        ("Reporting & dashboards.",
         "AI pulls numbers from every system you own and writes the weekly "
         "owner's report in plain English."),
        ("Onboarding & SOPs.",
         "New hires get an AI coach that knows your process. Training time "
         "shrinks. Quality goes up."),
        ("Finance & admin.",
         "Invoice matching, expense coding, AR follow-up, supplier reconciliations — "
         "all the work nobody wants to do."),
    ]
    for label, body in items:
        y = bullet(c, x, y, label, body, w)
        y -= 8

    footer(c, 6)
    c.showPage()


def page_7_three_outcomes(c):
    page_border(c)
    header_band(c, "Chapter 5", "The only three outcomes that matter.")
    y = PAGE_H - 1.75 * inch
    x = 0.85 * inch
    w = PAGE_W - 1.7 * inch

    y = wrapped_text(c,
        "Every system Peaking Momentum builds is measured against the same "
        "three outcomes. If a project doesn't move at least one, we don't "
        "build it.",
        x, y, w, size=12, leading=17)
    y -= 18

    # Three boxes
    box_w = (w - 2 * 12) / 3
    box_h = 2.6 * inch
    box_y = y - box_h

    titles = [
        ("Buy Back Time",
         "Hours per week clawed back from inboxes, follow-ups, reporting, and "
         "admin — given back to growth, family, or rest."),
        ("Convert More",
         "Higher show-rates, faster quotes, better follow-up, and a pipeline "
         "that no longer leaks. Same leads, more revenue."),
        ("Reduce Burnout",
         "The mental load drops. The owner stops being the bottleneck. "
         "Quality goes up because nobody is running on empty."),
    ]

    for i, (title, body) in enumerate(titles):
        bx = x + i * (box_w + 12)
        c.setFillColor(NAVY)
        c.roundRect(bx, box_y, box_w, box_h, 10, stroke=0, fill=1)
        c.setFillColor(ACCENT)
        c.rect(bx, box_y + box_h - 0.2 * inch, box_w, 0.2 * inch, stroke=0, fill=1)

        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 14)
        c.drawString(bx + 14, box_y + box_h - 0.7 * inch, title)
        wrapped_text(c, body, bx + 14, box_y + box_h - 1.05 * inch,
                     box_w - 28, size=10.5, leading=14.5, color=HexColor("#D7DCE2"))

    y = box_y - 24
    section_title(c, x, y, "The order matters")
    y -= 26
    y = wrapped_text(c,
        "Most owners chase “convert more” first because it shows up on "
        "the bank statement. We start with “buy back time.” The reason is "
        "simple: an exhausted owner can't execute on a better pipeline. Free "
        "the calendar first, then the conversion gains compound — and burnout "
        "stops eating them.",
        x, y, w, size=11.5, leading=16, color=SLATE)

    footer(c, 7)
    c.showPage()


def page_8_pm_approach(c):
    page_border(c)
    header_band(c, "Chapter 6", "How Peaking Momentum builds.")
    y = PAGE_H - 1.75 * inch
    x = 0.85 * inch
    w = PAGE_W - 1.7 * inch

    y = wrapped_text(c,
        "There's no shortage of AI tools. There's a serious shortage of AI "
        "systems that fit the way your business actually runs. Peaking "
        "Momentum doesn't sell software — we engineer custom systems around "
        "your bottleneck.",
        x, y, w, size=12, leading=17)
    y -= 16

    section_title(c, x, y, "The four-step engagement")
    y -= 28

    items = [
        ("01  ·  Diagnose.",
         "We map your business end-to-end — where leads enter, where time "
         "leaks, where the owner is the single point of failure."),
        ("02  ·  Design.",
         "We pick the one or two interventions with the highest ROI and "
         "design the AI system around your existing tools, not on top of them."),
        ("03  ·  Build.",
         "Our team builds, integrates, and tests against real workflows — "
         "CRM, phone, email, calendar, accounting, whatever you already use."),
        ("04  ·  Iterate.",
         "We monitor, refine, and expand. Most clients move from one "
         "automated workflow to a connected operating system within 6–9 months."),
    ]
    for label, body in items:
        y = bullet(c, x, y, label, body, w, label_color=NAVY)
        y -= 10

    y -= 4
    pull_quote(c, x, y, w,
               "Off-the-shelf software bends your business to the tool. "
               "Custom systems bend the tool to your business. That's the "
               "whole game.",
               "Justin Rayside")

    footer(c, 8)
    c.showPage()


def page_9_about_justin(c):
    page_border(c)
    header_band(c, "About the Author", "Justin Rayside")
    x = 0.85 * inch
    w = PAGE_W - 1.7 * inch
    y = PAGE_H - 1.75 * inch

    # Profile mark
    badge_x = x
    badge_y = y - 1.4 * inch
    c.setFillColor(NAVY)
    c.circle(badge_x + 0.7 * inch, badge_y + 0.7 * inch, 0.7 * inch,
             stroke=0, fill=1)
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 26)
    c.drawCentredString(badge_x + 0.7 * inch, badge_y + 0.55 * inch, "JR")

    # Right column text
    tx = badge_x + 1.7 * inch
    tw = w - 1.7 * inch
    ty = y
    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(tx, ty, "Justin Rayside")
    ty -= 22
    c.setFillColor(ACCENT_DK)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(tx, ty, "FOUNDER  ·  PEAKING MOMENTUM")
    ty -= 22

    ty = wrapped_text(c,
        "Justin Rayside founded Peaking Momentum to do one thing: give business "
        "owners back the leverage they thought they'd have when they started.",
        tx, ty, tw, size=11.5, leading=16, color=SLATE)
    ty -= 6
    ty = wrapped_text(c,
        "After years of watching capable operators grind through 70-hour weeks "
        "while their teams waited on them, he built a firm that engineers AI "
        "systems specifically for owner-led businesses — not enterprises with "
        "internal dev teams, and not solopreneurs piecing together no-code apps.",
        tx, ty, tw, size=11.5, leading=16, color=SLATE)

    # Lower section: what we do — start below whichever column ends lower
    y = min(badge_y, ty) - 0.4 * inch
    section_title(c, x, y, "What Peaking Momentum does")
    y -= 26
    y = bullet(c, x, y, "Custom AI systems",
               "designed around your bottleneck, not a vendor's roadmap.", w)
    y -= 8
    y = bullet(c, x, y, "Workflow automation",
               "across sales, marketing, operations, and back-office finance.", w)
    y -= 8
    y = bullet(c, x, y, "Owner-first delivery",
               "with measurable outcomes: hours saved, conversion lifted, "
               "burnout reduced.", w)
    y -= 8
    y = bullet(c, x, y, "Long-term partnership",
               "we build, run, and improve the system — you focus on the business.", w)

    footer(c, 9)
    c.showPage()


def page_10_case_patterns(c):
    page_border(c)
    header_band(c, "Chapter 7", "What it looks like in the wild.")
    y = PAGE_H - 1.75 * inch
    x = 0.85 * inch
    w = PAGE_W - 1.7 * inch

    y = wrapped_text(c,
        "Three patterns we see again and again across owner-led businesses. "
        "Names changed, numbers directional.",
        x, y, w, size=11.5, leading=16, color=SLATE)
    y -= 18

    cases = [
        ("Trades & home services",
         "Problem:  Leads going to voicemail after hours, no follow-up on quotes.",
         "Build:  AI receptionist + automated quote-chase workflow.",
         "Result:  +28% booked jobs, owner off the phone evenings and weekends."),
        ("Professional services",
         "Problem:  Senior staff buried in admin, capacity capped at the owner.",
         "Build:  AI inbox triage + drafted responses + CRM sync after every call.",
         "Result:  ~12 hours/week reclaimed across the leadership team."),
        ("E-commerce & DTC",
         "Problem:  Customer support overwhelming a small team during launches.",
         "Build:  AI tier-1 support + return automation + reorder nudges.",
         "Result:  68% of tickets resolved without a human; CSAT held steady."),
    ]
    for title, p, b, r in cases:
        c.setFillColor(NAVY)
        c.setFont("Helvetica-Bold", 12.5)
        c.drawString(x, y, title)
        c.setStrokeColor(ACCENT)
        c.setLineWidth(2)
        c.line(x, y - 4, x + 0.55 * inch, y - 4)
        y -= 22
        for line, color, bold in [(p, INK, False), (b, INK, False), (r, ACCENT_DK, True)]:
            font = "Helvetica-Bold" if bold else "Helvetica"
            y = wrapped_text(c, line, x + 0.05 * inch, y, w - 0.05 * inch,
                             font=font, size=10.5, leading=14.5, color=color)
            y -= 2
        y -= 12

    footer(c, 10)
    c.showPage()


def page_11_getting_started(c):
    page_border(c)
    header_band(c, "Chapter 8", "Where to start this week.")
    y = PAGE_H - 1.75 * inch
    x = 0.85 * inch
    w = PAGE_W - 1.7 * inch

    y = wrapped_text(c,
        "You don't need an AI strategy. You need one bottleneck removed. "
        "Start there.",
        x, y, w, size=12, leading=17)
    y -= 16

    section_title(c, x, y, "A 30-minute exercise")
    y -= 26
    y = bullet(c, x, y, "1.  List your last five frustrations.",
               "Anything that made you sigh, stay late, or apologise to a "
               "customer this month.", w)
    y -= 8
    y = bullet(c, x, y, "2.  Mark the repeating ones.",
               "Patterns are the targets. One-off problems aren't worth automating.", w)
    y -= 8
    y = bullet(c, x, y, "3.  Pick the one that costs the most hours.",
               "Not the most painful — the most time-expensive. That's where "
               "AI has its highest leverage.", w)
    y -= 8
    y = bullet(c, x, y, "4.  Map the inputs and outputs.",
               "Where does the work come from? Where does it go? What systems "
               "are involved? That's the blueprint.", w)
    y -= 16

    section_title(c, x, y, "Then talk to someone who builds this for a living")
    y -= 26
    y = wrapped_text(c,
        "If you'd like a second pair of eyes, Peaking Momentum offers a "
        "no-obligation diagnostic call. Bring your bottleneck. We'll tell you "
        "honestly whether AI is the right tool — and if it isn't, what is.",
        x, y, w, size=11.5, leading=16, color=SLATE)
    y -= 18

    pull_quote(c, x, y, w,
               "The best time to build the system was three years ago. "
               "The second-best time is before your competitor does.",
               "Justin Rayside")

    footer(c, 11)
    c.showPage()


def back_cover(c):
    # Background
    c.setFillColor(NAVY)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)

    # Top accent bar
    c.setFillColor(ACCENT)
    c.rect(0, PAGE_H - 0.18 * inch, PAGE_W, 0.18 * inch, stroke=0, fill=1)

    # Mountain motif at top
    c.setFillColor(DEEP)
    p = c.beginPath()
    p.moveTo(0, PAGE_H - 0.18 * inch)
    p.lineTo(0, PAGE_H - 1.6 * inch)
    p.lineTo(2.5 * inch, PAGE_H - 0.7 * inch)
    p.lineTo(4.5 * inch, PAGE_H - 1.4 * inch)
    p.lineTo(6.5 * inch, PAGE_H - 0.8 * inch)
    p.lineTo(PAGE_W, PAGE_H - 1.5 * inch)
    p.lineTo(PAGE_W, PAGE_H - 0.18 * inch)
    p.close()
    c.drawPath(p, stroke=0, fill=1)

    # Inner border
    c.setStrokeColor(GOLD)
    c.setLineWidth(0.8)
    c.rect(0.55 * inch, 0.55 * inch, PAGE_W - 1.1 * inch, PAGE_H - 1.1 * inch,
           stroke=1, fill=0)

    # Big closing line
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 26)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 3.0 * inch, "You didn't start your business")
    c.drawCentredString(PAGE_W / 2, PAGE_H - 3.45 * inch, "to be the bottleneck.")

    c.setStrokeColor(ACCENT)
    c.setLineWidth(2)
    c.line(PAGE_W / 2 - 0.6 * inch, PAGE_H - 3.7 * inch,
           PAGE_W / 2 + 0.6 * inch, PAGE_H - 3.7 * inch)

    c.setFillColor(HexColor("#D7DCE2"))
    c.setFont("Helvetica-Oblique", 13)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 4.05 * inch,
                        "We build the systems that put you back in front of the business —")
    c.drawCentredString(PAGE_W / 2, PAGE_H - 4.30 * inch,
                        "not buried inside it.")

    # CTA card
    card_w = 5.5 * inch
    card_h = 2.0 * inch
    card_x = (PAGE_W - card_w) / 2
    card_y = 2.0 * inch
    c.setFillColor(CREAM)
    c.roundRect(card_x, card_y, card_w, card_h, 12, stroke=0, fill=1)
    c.setFillColor(ACCENT)
    c.rect(card_x, card_y + card_h - 0.18 * inch, card_w, 0.18 * inch,
           stroke=0, fill=1)

    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(PAGE_W / 2, card_y + card_h - 0.55 * inch,
                        "Book your diagnostic call")
    c.setFillColor(SLATE)
    c.setFont("Helvetica", 11)
    c.drawCentredString(PAGE_W / 2, card_y + card_h - 0.85 * inch,
                        "30 minutes. No pitch. Just a clear answer on")
    c.drawCentredString(PAGE_W / 2, card_y + card_h - 1.05 * inch,
                        "where AI fits in your business — and where it doesn't.")

    c.setFillColor(NAVY)
    c.setFont("Helvetica-Bold", 12)
    c.drawCentredString(PAGE_W / 2, card_y + 0.55 * inch, "PEAKING MOMENTUM")
    c.setFillColor(ACCENT_DK)
    c.setFont("Helvetica", 10)
    c.drawCentredString(PAGE_W / 2, card_y + 0.30 * inch,
                        "Custom AI systems for owner-led businesses.")

    # Footer
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(PAGE_W / 2, 1.2 * inch,
                        "JUSTIN RAYSIDE  ·  FOUNDER")
    c.setFillColor(HexColor("#9AA6B5"))
    c.setFont("Helvetica", 8.5)
    c.drawCentredString(PAGE_W / 2, 0.95 * inch,
                        "© 2026 Peaking Momentum. All rights reserved.")
    c.drawCentredString(PAGE_W / 2, 0.78 * inch,
                        "This guide is for informational purposes only.")

    c.showPage()


# ---- Main -------------------------------------------------------------------

def build():
    c = canvas.Canvas(OUTPUT, pagesize=letter)
    c.setTitle("The Owner's Guide to AI")
    c.setAuthor("Justin Rayside")
    c.setSubject("How AI helps business owners buy back time, convert more "
                 "customers, and reduce burnout.")
    c.setCreator("Peaking Momentum")

    front_cover(c)         # 1
    page_2_intro(c)        # 2
    page_3_why_now(c)      # 3
    page_4_sales(c)        # 4
    page_5_marketing(c)    # 5
    page_6_operations(c)   # 6
    page_7_three_outcomes(c)  # 7
    page_8_pm_approach(c)  # 8
    page_9_about_justin(c) # 9
    page_10_case_patterns(c)  # 10
    page_11_getting_started(c)  # 11
    back_cover(c)          # 12

    c.save()
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    build()
