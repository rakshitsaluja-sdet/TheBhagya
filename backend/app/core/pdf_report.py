"""
backend/app/core/pdf_report.py

Bhagya — Brihat Kundali PDF Report Generator (multi-page, 6 sections)

Uses reportlab to produce a styled multi-page PDF from a computed chart dict.
Returns raw bytes ready for a FileResponse or StreamingResponse.

Usage:
    from backend.app.core.pdf_report import generate_pdf
    pdf_bytes = generate_pdf(chart_json, label="Ravi Shankar")
"""

from __future__ import annotations

import io
from datetime import datetime, timezone
from typing import Optional

# ── reportlab imports ─────────────────────────────────────────────────────
try:
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm, mm
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
        HRFlowable, KeepTogether, PageBreak,
    )

    # ── Module-level colour constants (BUG FIX: was only defined inside
    #    generate_pdf, causing _draw_bg to crash at doc.build time) ─────────
    DARK_BG   = colors.HexColor("#07060F")
    GOLD      = colors.HexColor("#DFA84F")
    GOLD_LT   = colors.HexColor("#F2CB84")
    VIOLET    = colors.HexColor("#8B6FE8")
    BODY_TEXT = colors.HexColor("#D4CAB8")
    DIM_TEXT  = colors.HexColor("#8A84A8")
    CARD_A    = colors.HexColor("#0F0C1E")
    CARD_B    = colors.HexColor("#130F24")
    HDR_BG    = colors.HexColor("#1A1630")
    WHITE     = colors.white
    RED_SOFT  = colors.HexColor("#E07B39")

    REPORTLAB_AVAILABLE = True

except ImportError:
    REPORTLAB_AVAILABLE = False
    # Fallback so module-level symbols exist (canvas callbacks are never
    # called when reportlab is absent, so None values are safe)
    A4 = (595.28, 841.89)
    DARK_BG = GOLD = GOLD_LT = VIOLET = BODY_TEXT = DIM_TEXT = None
    CARD_A = CARD_B = HDR_BG = WHITE = RED_SOFT = None


# ── Astro lookup tables ───────────────────────────────────────────────────

SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]

SIGN_LORDS = {
    "Aries": "Mars",    "Taurus": "Venus",   "Gemini": "Mercury",
    "Cancer": "Moon",   "Leo": "Sun",         "Virgo": "Mercury",
    "Libra": "Venus",   "Scorpio": "Mars",    "Sagittarius": "Jupiter",
    "Capricorn": "Saturn", "Aquarius": "Saturn", "Pisces": "Jupiter",
}

GEMSTONES = {
    "Sun":     "Ruby (Manik)",
    "Moon":    "Pearl (Moti)",
    "Mars":    "Red Coral (Moonga)",
    "Mercury": "Emerald (Panna)",
    "Jupiter": "Yellow Sapphire (Pukhraj)",
    "Venus":   "Diamond / White Sapphire (Heera / Safed Pukhraj)",
    "Saturn":  "Blue Sapphire (Neelam) — use with caution",
    "Rahu":    "Hessonite (Gomed)",
    "Ketu":    "Cat's Eye (Lehsunia)",
}

MD_THEMES = {
    "Sun":     "Authority, career visibility, government dealings, father figure and self-confidence.",
    "Moon":    "Emotional health, family, travel, public life and the relationship with the mother.",
    "Mars":    "Energy, land and real estate, siblings, physical vitality and decisive action.",
    "Mercury": "Communication, trade, intellect, writing, younger relationships and sharp thinking.",
    "Jupiter": "Wisdom, wealth, children, higher education, mentors, spiritual growth and prosperity.",
    "Venus":   "Relationships, luxury, creativity, artistic pursuits and material comforts.",
    "Saturn":  "Karma, discipline, hard work, career restructuring and long-term durable results.",
    "Rahu":    "Ambition, unconventional paths, technology, foreign connections and breaking old patterns.",
    "Ketu":    "Spirituality, past karma, inner seeking, sudden changes and detachment from the material.",
}

MD_REMEDIES = {
    "Sun":     "Surya Namaskar daily at sunrise. Donate wheat on Sundays. Respect authority figures.",
    "Moon":    "Offer water to Shiva Lingam on Mondays. Wear Pearl (Moti). Keep a silver glass of water beside the bed.",
    "Mars":    "Recite Hanuman Chalisa on Tuesdays. Donate red lentils (masoor dal). Avoid anger and conflict.",
    "Mercury": "Recite Vishnu Sahasranama on Wednesdays. Donate green vegetables. Feed cows.",
    "Jupiter": "Worship Brihaspati on Thursdays. Donate yellow items and turmeric. Wear Yellow Sapphire (Pukhraj).",
    "Venus":   "Offer white flowers to Devi Lakshmi on Fridays. Donate white clothes and sweets.",
    "Saturn":  "Light sesame oil lamp on Saturdays. Chant Shani mantra 108 times. Donate black sesame and mustard oil.",
    "Rahu":    "Durga puja on Saturdays. Donate black sesame and coconut. Avoid non-vegetarian on Saturdays.",
    "Ketu":    "Ganesha worship daily. Donate sesame seeds and blankets. Feed dogs and serve the elderly.",
}

HOUSE_SIGNIFICATIONS = {
    1:  "Self, body, personality, health and overall vitality.",
    2:  "Wealth, speech, family, food and accumulated resources.",
    3:  "Courage, siblings, short travel, communication and enterprise.",
    4:  "Home, mother, happiness, property and emotional security.",
    5:  "Intelligence, children, creativity, past-life merit and speculation.",
    6:  "Enemies, debts, disease, service, litigation and competition.",
    7:  "Marriage, partnerships, business dealings and foreign connections.",
    8:  "Longevity, transformation, inheritance, occult and hidden matters.",
    9:  "Dharma, father, higher learning, fortune, pilgrimage and grace.",
    10: "Career, status, reputation, authority and public standing.",
    11: "Gains, income, elder siblings, social networks and fulfilment of desires.",
    12: "Expenditure, moksha, foreign settlement, isolation and spiritual liberation.",
}


# ── Helper functions ──────────────────────────────────────────────────────

def _house_sign(lagna_sign: str, house_num: int) -> str:
    """Return the zodiac sign for the given house (Whole Sign system)."""
    if lagna_sign not in SIGNS:
        return "—"
    idx = (SIGNS.index(lagna_sign) + house_num - 1) % 12
    return SIGNS[idx]


def _build_house_map(planets: dict) -> dict:
    """Build {1: [planet_names], ...} from planets dict."""
    hmap: dict[int, list[str]] = {i: [] for i in range(1, 13)}
    for pname, pdata in planets.items():
        h = pdata.get("house")
        if isinstance(h, int) and 1 <= h <= 12:
            hmap[h].append(pname)
    return hmap


# ── Canvas callbacks (must reference module-level constants) ──────────────

def _draw_cover(canvas, doc):
    """Cover page: solid dark background, no header strip."""
    canvas.saveState()
    canvas.setFillColor(DARK_BG)
    canvas.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
    canvas.restoreState()


def _draw_bg(canvas, doc):
    """All pages after cover: dark background + gold header strip + footer."""
    canvas.saveState()

    # Full-page background
    canvas.setFillColor(DARK_BG)
    canvas.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)

    # Header bar
    bar_h = 22
    canvas.setFillColor(HDR_BG)
    canvas.rect(0, A4[1] - bar_h, A4[0], bar_h, fill=1, stroke=0)

    # Gold accent line below header bar
    canvas.setStrokeColor(GOLD)
    canvas.setLineWidth(0.6)
    canvas.line(0, A4[1] - bar_h, A4[0], A4[1] - bar_h)

    # Header: left label
    canvas.setFillColor(GOLD)
    canvas.setFont("Helvetica-Bold", 7)
    canvas.drawString(1.5 * cm, A4[1] - bar_h + 7,
                      "BHAGYA  ·  BRIHAT KUNDALI")

    # Header: right page number
    canvas.setFillColor(DIM_TEXT)
    canvas.setFont("Helvetica", 7)
    canvas.drawRightString(A4[0] - 1.5 * cm, A4[1] - bar_h + 7,
                           f"Page {doc.page}")

    # Footer separator line
    canvas.setStrokeColor(HDR_BG)
    canvas.setLineWidth(0.4)
    canvas.line(1.5 * cm, 1.1 * cm, A4[0] - 1.5 * cm, 1.1 * cm)

    # Footer text
    canvas.setFillColor(DIM_TEXT)
    canvas.setFont("Helvetica", 6.5)
    canvas.drawCentredString(
        A4[0] / 2, 0.65 * cm,
        "Bhagya  ·  bhagya.app  ·  "
        "For spiritual guidance only. Not a substitute for professional advice.",
    )

    canvas.restoreState()


# ── Main generator ────────────────────────────────────────────────────────

def generate_pdf(chart: dict, label: Optional[str] = None) -> bytes:
    """
    Generate a 6-page Brihat Kundali PDF report.

    Args:
        chart:  Full chart_json dict from the database.
        label:  Person name/label for the cover page.

    Returns:
        Raw PDF bytes.
    """
    if not REPORTLAB_AVAILABLE:
        raise RuntimeError(
            "reportlab is not installed. "
            "Run: pip install reportlab --break-system-packages"
        )

    # ── Data extraction ────────────────────────────────────────────────────
    lagna   = chart.get("lagna", {})
    planets = chart.get("planets", {})
    dasha   = chart.get("current_dasha", {})
    lk      = chart.get("lal_kitab", {})
    dob     = chart.get("dob", "")
    tob     = chart.get("tob", "")
    place   = chart.get("place_name", "")
    name    = label or chart.get("name", "")

    lagna_sign = lagna.get("sign", "—")
    lagna_nak  = lagna.get("nakshatra", "")
    lagna_deg  = lagna.get("degree", 0.0)
    lagna_pada = lagna.get("pada", "")

    md_lord  = dasha.get("mahadasha", {}).get("lord", "—")
    md_start = dasha.get("mahadasha", {}).get("start", "")
    md_end   = dasha.get("mahadasha", {}).get("end", "")
    ad_lord  = dasha.get("antardasha", {}).get("lord", "—")
    ad_start = dasha.get("antardasha", {}).get("start", "")
    ad_end   = dasha.get("antardasha", {}).get("end", "")

    moon_sign_raw = planets.get("Moon", {}).get("sign", "—")
    moon_nak      = planets.get("Moon", {}).get("nakshatra", "—")

    house_map  = _build_house_map(planets)
    lagna_lord = SIGN_LORDS.get(lagna_sign, "—")

    # ── Document setup ────────────────────────────────────────────────────
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        rightMargin=1.8 * cm,
        leftMargin=1.8 * cm,
        topMargin=2.4 * cm,     # clears the 22pt header bar on later pages
        bottomMargin=1.8 * cm,
        title=f"Bhagya Brihat Kundali — {name or 'Birth Chart'}",
        author="Bhagya · bhagya.app",
    )

    # ── Style helpers ──────────────────────────────────────────────────────
    base_styles = getSampleStyleSheet()

    def _ps(sname, **kw):
        """Create a ParagraphStyle without registering in the global stylesheet."""
        return ParagraphStyle(sname, parent=base_styles["Normal"], **kw)

    cover_title = _ps("CoverTitle",
        fontSize=52, textColor=GOLD, alignment=TA_CENTER,
        fontName="Helvetica-Bold", spaceAfter=2, leading=56)
    cover_sub = _ps("CoverSub",
        fontSize=13, textColor=GOLD_LT, alignment=TA_CENTER,
        fontName="Helvetica", spaceAfter=4)
    cover_name = _ps("CoverName",
        fontSize=26, textColor=WHITE, alignment=TA_CENTER,
        fontName="Helvetica-BoldOblique", spaceAfter=6, leading=32)
    cover_lbl = _ps("CoverLbl",
        fontSize=8.5, textColor=DIM_TEXT, alignment=TA_CENTER,
        fontName="Helvetica", spaceAfter=1)
    cover_val = _ps("CoverVal",
        fontSize=10, textColor=BODY_TEXT, alignment=TA_CENTER,
        fontName="Helvetica-Bold", spaceAfter=5)
    cover_foot = _ps("CoverFoot",
        fontSize=8, textColor=DIM_TEXT, alignment=TA_CENTER, spaceAfter=3)

    sec_style = _ps("SecHead",
        fontSize=11, textColor=GOLD, fontName="Helvetica-Bold",
        spaceBefore=10, spaceAfter=4)
    body_style = _ps("Body",
        fontSize=9, textColor=BODY_TEXT, leading=14, spaceAfter=4)
    small_style = _ps("Small",
        fontSize=8, textColor=DIM_TEXT, leading=12, spaceAfter=2)
    label_style = _ps("Label",
        fontSize=8.5, textColor=GOLD_LT, fontName="Helvetica-Bold",
        leading=12, spaceAfter=3)
    note_style = _ps("Note",
        fontSize=7.5, textColor=DIM_TEXT, leading=11,
        fontName="Helvetica-Oblique", spaceAfter=4)

    # ── Flow helpers ───────────────────────────────────────────────────────

    def hr(color=GOLD, thickness=0.5):
        return HRFlowable(width="100%", thickness=thickness, color=color,
                          spaceAfter=5, spaceBefore=3)

    def section(text):
        return Paragraph(f"◈ {text.upper()}", sec_style)

    def body(text):
        return Paragraph(text, body_style)

    def small(text):
        return Paragraph(text, small_style)

    def lbl(text):
        return Paragraph(text, label_style)

    def note(text):
        return Paragraph(text, note_style)

    # Shared table style fragments
    _BASE_TS = [
        ("FONTNAME",      (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE",      (0, 0), (-1, -1), 8.5),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 7),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 7),
        ("ROWBACKGROUNDS",(0, 0), (-1, -1), [CARD_A, CARD_B]),
        ("TEXTCOLOR",     (0, 0), (-1, -1), BODY_TEXT),
        ("GRID",          (0, 0), (-1, -1), 0.3, HDR_BG),
    ]
    _HDR_TS = [
        ("FONTNAME",   (0, 0), (-1, 0), "Helvetica-Bold"),
        ("TEXTCOLOR",  (0, 0), (-1, 0), GOLD),
        ("BACKGROUND", (0, 0), (-1, 0), HDR_BG),
    ]

    story = []

    # ══════════════════════════════════════════════════════════════════════
    # PAGE 1 — COVER
    # ══════════════════════════════════════════════════════════════════════

    story.append(Spacer(1, 3.5 * cm))
    story.append(Paragraph("BHAGYA", cover_title))
    story.append(Spacer(1, 0.3 * cm))
    story.append(Paragraph("Brihat Kundali Report", cover_sub))
    story.append(Spacer(1, 0.5 * cm))
    story.append(hr())
    story.append(Spacer(1, 0.6 * cm))

    if name:
        story.append(Paragraph(name, cover_name))
        story.append(Spacer(1, 0.8 * cm))

    # Birth details — centered label/value pairs
    detail_rows: list[tuple[str, str]] = []
    if dob:
        detail_rows.append(("Date of Birth", dob))
    if tob:
        detail_rows.append(("Time of Birth", tob))
    if place:
        detail_rows.append(("Place of Birth", place))

    lagna_str = lagna_sign
    if lagna_deg:
        lagna_str += f"  {lagna_deg:.2f}°"
    if lagna_nak:
        lagna_str += f"  ·  {lagna_nak}"
    if lagna_pada:
        lagna_str += f"  Pada {lagna_pada}"
    detail_rows.append(("Ascendant (Lagna)", lagna_str))

    for dlbl, dval in detail_rows:
        story.append(Paragraph(dlbl, cover_lbl))
        story.append(Paragraph(dval, cover_val))

    story.append(Spacer(1, 0.8 * cm))
    story.append(hr())
    story.append(Spacer(1, 0.5 * cm))

    today_str = datetime.now(timezone.utc).strftime("%d %B %Y")
    story.append(Paragraph(
        f"Generated on {today_str}  ·  Computed with Vedic precision",
        cover_foot,
    ))
    story.append(Spacer(1, 0.25 * cm))
    story.append(Paragraph(
        "bhagya.app  ·  Ancient wisdom, modern precision",
        cover_foot,
    ))

    story.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════
    # PAGE 2 — PLANETARY SUMMARY (EXECUTIVE OVERVIEW)
    # ══════════════════════════════════════════════════════════════════════

    story.append(section("Graha Sthiti — Planetary Positions"))
    story.append(hr())

    planet_order = ["Sun", "Moon", "Mercury", "Venus", "Mars",
                    "Jupiter", "Saturn", "Rahu", "Ketu"]

    p_hdrs = [["Planet", "Sign", "House", "Nakshatra", "Degree", "Status"]]
    p_rows = []
    retro_rows: list[int] = []  # 1-indexed including header

    for i, pname in enumerate(planet_order):
        p = planets.get(pname, {})
        is_retro = p.get("retrograde", False)
        status = "℞ Retrograde" if is_retro else "Direct"
        p_rows.append([
            pname,
            p.get("sign", "—"),
            str(p.get("house", "—")),
            p.get("nakshatra", "—"),
            f"{p.get('degree', 0.0):.2f}°",
            status,
        ])
        if is_retro:
            retro_rows.append(i + 1)  # offset by header row

    pt_style = list(_BASE_TS) + list(_HDR_TS)
    for ri in retro_rows:
        pt_style.append(("TEXTCOLOR", (5, ri), (5, ri), GOLD))
        pt_style.append(("FONTNAME",  (5, ri), (5, ri), "Helvetica-Bold"))

    planet_table = Table(
        p_hdrs + p_rows,
        colWidths=[2.5 * cm, 3.1 * cm, 1.5 * cm, 3.8 * cm, 2.0 * cm, 2.9 * cm],
    )
    planet_table.setStyle(TableStyle(pt_style))
    story.append(KeepTogether([planet_table]))

    story.append(Spacer(1, 0.55 * cm))

    # Moon sign + Janma Nakshatra highlighted box
    moon_box = Table(
        [["Moon Sign (Rashi)", moon_sign_raw, "Janma Nakshatra", moon_nak]],
        colWidths=[3.8 * cm, 4.0 * cm, 3.8 * cm, 4.2 * cm],
    )
    moon_box.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), HDR_BG),
        ("TEXTCOLOR",     (0, 0), (0, 0),   GOLD_LT),
        ("TEXTCOLOR",     (2, 0), (2, 0),   GOLD_LT),
        ("TEXTCOLOR",     (1, 0), (1, 0),   WHITE),
        ("TEXTCOLOR",     (3, 0), (3, 0),   WHITE),
        ("FONTNAME",      (0, 0), (0, 0),   "Helvetica-Bold"),
        ("FONTNAME",      (2, 0), (2, 0),   "Helvetica-Bold"),
        ("FONTNAME",      (1, 0), (1, 0),   "Helvetica-Bold"),
        ("FONTNAME",      (3, 0), (3, 0),   "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, -1), 9),
        ("TOPPADDING",    (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
        ("LEFTPADDING",   (0, 0), (-1, -1), 10),
        ("BOX",           (0, 0), (-1, -1), 0.6, GOLD),
        ("LINEAFTER",     (0, 0), (2, 0),   0.3, HDR_BG),
    ]))
    story.append(moon_box)
    story.append(Spacer(1, 0.55 * cm))

    # Vimshottari Dasha block
    story.append(section("Current Vimshottari Dasha"))
    story.append(hr())

    dasha_data = [
        ["Mahadasha",  md_lord, f"{md_start}  →  {md_end}"],
        ["Antardasha", ad_lord, f"{ad_start}  →  {ad_end}"],
    ]
    dasha_table = Table(dasha_data, colWidths=[3 * cm, 3.2 * cm, 9.6 * cm])
    dasha_table.setStyle(TableStyle([
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [CARD_A, CARD_B]),
        ("TEXTCOLOR",     (0, 0), (0, -1),  GOLD_LT),
        ("TEXTCOLOR",     (1, 0), (1, -1),  WHITE),
        ("TEXTCOLOR",     (2, 0), (2, -1),  DIM_TEXT),
        ("FONTNAME",      (0, 0), (0, -1),  "Helvetica-Bold"),
        ("FONTNAME",      (1, 0), (1, -1),  "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, -1), 9),
        ("TOPPADDING",    (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING",   (0, 0), (-1, -1), 8),
        ("GRID",          (0, 0), (-1, -1), 0.3, HDR_BG),
    ]))
    story.append(dasha_table)
    story.append(Spacer(1, 0.3 * cm))

    md_theme = MD_THEMES.get(md_lord, "")
    if md_theme:
        story.append(body(
            f"<b>{md_lord} Mahadasha Significations:</b>  {md_theme}"
        ))

    story.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════
    # PAGE 3 — HOUSE ANALYSIS H1–H6
    # ══════════════════════════════════════════════════════════════════════

    story.append(section("Bhava Phalam — House Analysis (Houses 1–6)"))
    story.append(hr())

    def house_block(h_num: int):
        h_sign = _house_sign(lagna_sign, h_num)
        h_lord = SIGN_LORDS.get(h_sign, "—")
        occupants = house_map.get(h_num, [])
        occ_str = ", ".join(occupants) if occupants else "Unoccupied"
        sig = HOUSE_SIGNIFICATIONS.get(h_num, "")

        if occupants:
            interp = (
                f"{', '.join(occupants)} in House {h_num} activates the themes of "
                f"{sig.rstrip('.')}. "
                f"The influence of {h_lord}, lord of {h_sign}, shapes how this energy expresses."
            )
        else:
            interp = (
                f"Unoccupied — matters of this house proceed without direct planetary "
                f"influence. Look to {h_lord}, lord of {h_sign}, for outcomes related to "
                f"{sig.rstrip('.')}."
            )

        # Use a Paragraph so text wraps properly
        num_para = Paragraph(
            f"<b>H{h_num}</b>",
            _ps(f"HN{h_num}", fontSize=10, textColor=DARK_BG,
                fontName="Helvetica-Bold", alignment=TA_CENTER),
        )
        detail_para = Paragraph(
            f"<b>{h_sign}</b>  |  Lord: {h_lord}  |  Planets: {occ_str}<br/>"
            f"<font color='#8A84A8' size='8'>{interp}</font>",
            _ps(f"HD{h_num}", fontSize=9, textColor=BODY_TEXT, leading=14),
        )

        t = Table(
            [[num_para, detail_para]],
            colWidths=[1.4 * cm, 14.4 * cm],
        )
        t.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (0, 0), GOLD),
            ("BACKGROUND",    (1, 0), (1, 0), CARD_A),
            ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING",    (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING",   (0, 0), (-1, -1), 6),
            ("RIGHTPADDING",  (1, 0), (1, -1), 10),
        ]))
        return KeepTogether([t, Spacer(1, 0.28 * cm)])

    for h in range(1, 7):
        story.append(house_block(h))

    story.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════
    # PAGE 4 — HOUSE ANALYSIS H7–H12
    # ══════════════════════════════════════════════════════════════════════

    story.append(section("Bhava Phalam — House Analysis (Houses 7–12)"))
    story.append(hr())

    for h in range(7, 13):
        story.append(house_block(h))

    story.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════
    # PAGE 5 — LAL KITAB & YOGAS
    # ══════════════════════════════════════════════════════════════════════

    story.append(section("Lal Kitab Overlay"))
    story.append(hr())

    rk_axis      = lk.get("rahu_ketu_axis", "—")
    axis_reading = lk.get("axis_reading", "")
    story.append(body(f"<b>☉ Rahu-Ketu Karmic Axis:</b>  {rk_axis}"))
    if axis_reading:
        story.append(small(axis_reading))
    story.append(Spacer(1, 0.15 * cm))

    pucca = lk.get("pucca_ghar_planets", [])
    if pucca:
        pucca_str = "  |  ".join(
            f"{p['planet']} in H{p['house']}" for p in pucca
        )
        story.append(body(
            f"<b>★ Pucca Ghar (Permanent House) Planets:</b>  {pucca_str}"
        ))

    fi = lk.get("foreign_indicator", False)
    story.append(body(
        f"<b>Foreign Settlement Indicator:</b>  "
        f"{'Active — strong foreign karma supported by chart' if fi else 'Mild'}"
    ))

    benefits = lk.get("benefits", [])
    if benefits:
        story.append(Spacer(1, 0.2 * cm))
        story.append(lbl("❖ Top Benefits from Your Chart:"))
        for b in benefits[:4]:
            story.append(small(f"  ❖  {b}"))

    story.append(Spacer(1, 0.4 * cm))
    story.append(section("Graha Yoga — Planetary Combinations"))
    story.append(hr())

    # ── Yoga detection ────────────────────────────────────────────────────
    def _planet(name):
        return planets.get(name, {})

    sun_h    = _planet("Sun").get("house")
    moon_h   = _planet("Moon").get("house")
    merc_h   = _planet("Mercury").get("house")
    jup_h    = _planet("Jupiter").get("house")
    jup_sgn  = _planet("Jupiter").get("sign", "")
    ven_sgn  = _planet("Venus").get("sign", "")
    mars_sgn = _planet("Mars").get("sign", "")
    sat_sgn  = _planet("Saturn").get("sign", "")

    yogas: list[str] = []

    # Gaja Kesari: Jupiter in kendra from Moon
    if moon_h and jup_h:
        diff = (jup_h - moon_h) % 12
        if diff in {0, 3, 6, 9}:
            yogas.append(
                f"Gaja Kesari Yoga: Moon in {moon_sign_raw}, Jupiter in {jup_sgn} — "
                "Wisdom, social respect and recognition. Generous and influential nature."
            )

    # Budha Aditya: Sun and Mercury in same house
    if sun_h and merc_h and sun_h == merc_h:
        yogas.append(
            "Budha Aditya Yoga: Sun-Mercury conjunction — Sharp intellect, communication "
            "skills and professional success. Ideas expressed with clarity and authority."
        )

    # Malavya (Venus in own sign or exaltation)
    if ven_sgn in ("Taurus", "Libra", "Pisces"):
        yogas.append(
            f"Malavya Yoga: Venus in {ven_sgn} — "
            "Luxury, beauty, romantic blessings and refined artistic sensibility."
        )

    # Ruchaka (Mars)
    if mars_sgn in ("Aries", "Scorpio", "Capricorn"):
        yogas.append(
            f"Ruchaka Yoga: Mars in {mars_sgn} — "
            "Physical strength, leadership, courage and determination to overcome obstacles."
        )

    # Hamsa (Jupiter)
    if jup_sgn in ("Sagittarius", "Pisces", "Cancer"):
        yogas.append(
            f"Hamsa Yoga: Jupiter in {jup_sgn} — "
            "Wisdom, dharmic nature, auspicious life path and spiritual authority."
        )

    # Shasha (Saturn)
    if sat_sgn in ("Capricorn", "Aquarius", "Libra"):
        yogas.append(
            f"Shasha Yoga: Saturn in {sat_sgn} — "
            "Discipline, authority, perseverance and long-term durable success."
        )

    # Moon in Cancer (own sign)
    if moon_sign_raw == "Cancer":
        yogas.append(
            "Moon in Cancer (own sign) — Exalted emotional strength, heightened intuition "
            "and a nurturing, empathetic nature."
        )

    if yogas:
        for yoga_text in yogas:
            yoga_row = Table(
                [["✶", yoga_text]],
                colWidths=[0.7 * cm, 15.1 * cm],
            )
            yoga_row.setStyle(TableStyle([
                ("BACKGROUND",    (0, 0), (-1, -1), CARD_A),
                ("TEXTCOLOR",     (0, 0), (0, 0),   GOLD),
                ("TEXTCOLOR",     (1, 0), (1, 0),   BODY_TEXT),
                ("FONTSIZE",      (0, 0), (-1, -1), 8.5),
                ("TOPPADDING",    (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ("LEFTPADDING",   (0, 0), (-1, -1), 8),
                ("RIGHTPADDING",  (1, 0), (1, 0),   10),
                ("VALIGN",        (0, 0), (0, -1),  "TOP"),
            ]))
            story.append(yoga_row)
            story.append(Spacer(1, 0.2 * cm))
    else:
        story.append(body(
            "No classical Pancha Mahapurusha Yoga detected in this chart. "
            "Strengths are distributed across multiple house lords and nakshatra positions — "
            "examine the Lagna lord, Atmakaraka and Dasha lord for nuanced insight."
        ))

    story.append(PageBreak())

    # ══════════════════════════════════════════════════════════════════════
    # PAGE 6 — REMEDIES & GEMSTONES
    # ══════════════════════════════════════════════════════════════════════

    story.append(section("Upaya — Vedic Remedies"))
    story.append(hr())

    # Lal Kitab personalised remedies
    lk_remedies = lk.get("remedies", [])
    if lk_remedies:
        story.append(lbl("Lal Kitab Personalised Remedies:"))
        for r in lk_remedies[:6]:
            action = r.get("action") or r.get("remedy", "")
            planet = r.get("planet", "")
            house  = r.get("house", "")
            mantra = r.get("mantra_simple_roman", "")
            line = f"<b>{planet} (H{house}):</b>  {action}"
            if mantra:
                line += f"  —  <i>{mantra}</i>"
            story.append(small(f"  ◈  {line}"))
        story.append(Spacer(1, 0.35 * cm))

    # Mahadasha-based general remedies
    md_remedy = MD_REMEDIES.get(md_lord, "")
    if md_remedy:
        story.append(lbl(f"Current Mahadasha Remedies — {md_lord}:"))
        story.append(body(md_remedy))
        story.append(Spacer(1, 0.4 * cm))

    story.append(section("Ratna — Gemstone Guidance"))
    story.append(hr())

    lagna_gem = GEMSTONES.get(lagna_lord, "—")
    md_gem    = GEMSTONES.get(md_lord, "—")

    # Primary recommendation table
    gem_primary = [
        ["Gemstone", "Planet / Role", "Purpose"],
        [
            lagna_gem,
            f"{lagna_lord}  (Lagna Lord)",
            f"Strengthens personality, health and overall vitality of the {lagna_sign} ascendant.",
        ],
        [
            md_gem,
            f"{md_lord}  (Mahadasha Lord)",
            f"Supports the current {md_lord} Mahadasha energy and enhances opportunities in this period.",
        ],
    ]
    gem_table = Table(
        gem_primary,
        colWidths=[4.5 * cm, 3.5 * cm, 7.8 * cm],
    )
    gem_table.setStyle(TableStyle(list(_BASE_TS) + list(_HDR_TS)))
    story.append(KeepTogether([gem_table]))
    story.append(Spacer(1, 0.45 * cm))

    # Full gemstone reference
    story.append(lbl("Complete Gemstone Reference:"))
    story.append(Spacer(1, 0.15 * cm))
    gem_ref_data = [["Planet", "Gemstone"]] + list(GEMSTONES.items())
    gem_ref_table = Table(
        gem_ref_data,
        colWidths=[3.2 * cm, 12.6 * cm],
    )
    gem_ref_table.setStyle(TableStyle(list(_BASE_TS) + list(_HDR_TS)))
    story.append(KeepTogether([gem_ref_table]))

    story.append(Spacer(1, 0.45 * cm))
    story.append(note(
        "→ Consult a qualified Jyotishi before wearing any gemstone. Effects vary "
        "significantly by individual chart, active planetary periods and constitution. "
        "This report describes classical Jyotisha recommendations only."
    ))

    # ── Build document ─────────────────────────────────────────────────────
    doc.build(story, onFirstPage=_draw_cover, onLaterPages=_draw_bg)
    return buf.getvalue()
