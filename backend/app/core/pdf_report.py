"""
backend/app/core/pdf_report.py

TheBhagya — PDF Birth Chart Report Generator

Uses reportlab to produce a single-page styled PDF from a computed chart dict.
Returns raw bytes ready for a FileResponse or StreamingResponse.

Install:
    pip install reportlab --break-system-packages

Usage:
    from backend.app.core.pdf_report import generate_pdf
    pdf_bytes = generate_pdf(chart_json, label="Rakshit Saluja")
"""

from __future__ import annotations

import io
from datetime import datetime, timezone
from typing import Optional

# reportlab imports — installed separately (not in requirements by default)
try:
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm, mm
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
        HRFlowable, KeepTogether,
    )
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False



# ── PDF generation ─────────────────────────────────────────────────────────

def generate_pdf(chart: dict, label: Optional[str] = None) -> bytes:
    """
    Generate a styled TheBhagya birth chart PDF report.

    Args:
        chart:  The full chart_json dict from the database.
        label:  Optional person name/label for the cover.

    Returns:
        Raw PDF bytes.
    """
    if not REPORTLAB_AVAILABLE:
        raise RuntimeError(
            "reportlab is not installed. Run: pip install reportlab --break-system-packages"
        )

    # ── Colour palette (defined here so colors.* is only used when reportlab is available)
    GOLD     = colors.HexColor("#C9933A")
    GOLD_LT  = colors.HexColor("#E8B96A")
    DARK_BG  = colors.HexColor("#0D0A18")
    DARK_MID = colors.HexColor("#1A1530")
    DARK_EL  = colors.HexColor("#231E3D")
    WHITE    = colors.white
    DIM      = colors.HexColor("#8A84A8")
    GREEN    = colors.HexColor("#4CAF50")
    ORANGE   = colors.HexColor("#E07B39")

    buf = io.BytesIO()

    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title=f"TheBhagya — Birth Chart Report — {label or 'Birth Chart'}",
        author="TheBhagya AI Astrology Platform",
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "TBTitle",
        parent=styles["Title"],
        fontSize=22,
        textColor=GOLD,
        spaceAfter=4,
        fontName="Helvetica-Bold",
        alignment=TA_CENTER,
    )
    sub_style = ParagraphStyle(
        "TBSub",
        parent=styles["Normal"],
        fontSize=10,
        textColor=DIM,
        spaceAfter=2,
        alignment=TA_CENTER,
    )
    section_style = ParagraphStyle(
        "TBSection",
        parent=styles["Normal"],
        fontSize=11,
        textColor=GOLD,
        spaceBefore=14,
        spaceAfter=4,
        fontName="Helvetica-Bold",
    )
    body_style = ParagraphStyle(
        "TBBody",
        parent=styles["Normal"],
        fontSize=9,
        textColor=colors.HexColor("#CCCCCC"),
        leading=14,
        spaceAfter=4,
    )
    small_style = ParagraphStyle(
        "TBSmall",
        parent=styles["Normal"],
        fontSize=8,
        textColor=DIM,
        leading=12,
    )

    # ── Helper ─────────────────────────────────────────────────────────────
    def hr():
        return HRFlowable(width="100%", thickness=0.5, color=GOLD, spaceAfter=6, spaceBefore=6)

    def section(text):
        return Paragraph(f"◈ {text.upper()}", section_style)

    def body(text):
        return Paragraph(text, body_style)

    def small(text):
        return Paragraph(text, small_style)

    # ── Data extraction ────────────────────────────────────────────────────
    lagna   = chart.get("lagna", {})
    planets = chart.get("planets", {})
    dasha   = chart.get("current_dasha", {})
    lk      = chart.get("lal_kitab", {})
    dob     = chart.get("dob", "")
    place   = chart.get("place_name", "")

    lagna_sign = lagna.get("sign", "—")
    lagna_nak  = lagna.get("nakshatra", "")
    lagna_deg  = lagna.get("degree", 0.0)

    md_lord    = dasha.get("mahadasha", {}).get("lord", "—")
    md_end     = dasha.get("mahadasha", {}).get("end", "")
    ad_lord    = dasha.get("antardasha", {}).get("lord", "—")
    ad_end     = dasha.get("antardasha", {}).get("end", "")

    # ── Build document ─────────────────────────────────────────────────────
    story = []

    # Header
    story.append(Paragraph("🔮 TheBhagya", title_style))
    story.append(Paragraph("Vedic Birth Chart Report", sub_style))
    story.append(Paragraph("thebhagya.com  ·  AI-Powered Jyotish", small_style))
    story.append(Spacer(1, 0.3 * cm))
    story.append(hr())

    # Identity block
    story.append(section("Birth Details"))
    id_data = [
        ["Name / Label", label or "—"],
        ["Date of Birth", dob or "—"],
        ["Place of Birth", place or "—"],
        ["Ascendant (Lagna)", f"{lagna_sign}  {lagna_deg:.2f}°  ·  {lagna_nak}"],
        ["Report Generated", datetime.now(timezone.utc).strftime("%d %B %Y, %H:%M UTC")],
    ]
    id_table = Table(id_data, colWidths=[5 * cm, 12 * cm])
    id_table.setStyle(TableStyle([
        ("FONTNAME",    (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE",    (0, 0), (-1, -1), 9),
        ("TEXTCOLOR",   (0, 0), (0, -1), colors.HexColor("#E8B96A")),
        ("TEXTCOLOR",   (1, 0), (1, -1), colors.HexColor("#CCCCCC")),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.HexColor("#1A1530"), colors.HexColor("#231E3D")]),
        ("TOPPADDING",  (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(id_table)
    story.append(Spacer(1, 0.2 * cm))

    # Dasha
    story.append(section("Current Vimshottari Dasha"))
    story.append(body(
        f"<b>Mahadasha:</b> {md_lord}  (ends {md_end})   |   "
        f"<b>Antardasha:</b> {ad_lord}  (ends {ad_end})"
    ))
    story.append(Spacer(1, 0.1 * cm))

    # Planetary positions table
    story.append(section("Planetary Positions"))
    headers = [["Planet", "Sign", "House", "Nakshatra", "Degree", "Retrograde"]]
    rows = []
    planet_order = ["Sun", "Moon", "Mercury", "Venus", "Mars",
                    "Jupiter", "Saturn", "Rahu", "Ketu"]
    for pname in planet_order:
        p = planets.get(pname, {})
        rows.append([
            pname,
            p.get("sign", "—"),
            str(p.get("house", "—")),
            p.get("nakshatra", "—"),
            f"{p.get('degree', 0.0):.2f}°",
            "Yes ℞" if p.get("retrograde") else "—",
        ])

    planet_table = Table(
        headers + rows,
        colWidths=[2.2 * cm, 3 * cm, 1.5 * cm, 3.5 * cm, 2 * cm, 2.5 * cm],
    )
    planet_table.setStyle(TableStyle([
        ("FONTNAME",    (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",    (0, 0), (-1, -1), 8.5),
        ("TEXTCOLOR",   (0, 0), (-1, 0), GOLD),
        ("TEXTCOLOR",   (0, 1), (-1, -1), colors.HexColor("#CCCCCC")),
        ("BACKGROUND",  (0, 0), (-1, 0), colors.HexColor("#231E3D")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#1A1530"), colors.HexColor("#14112A")]),
        ("TOPPADDING",  (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("GRID",        (0, 0), (-1, -1), 0.3, colors.HexColor("#2E2A4A")),
    ]))
    story.append(planet_table)

    # Lal Kitab
    story.append(section("Lal Kitab Overlay"))
    story.append(body(f"<b>Rahu-Ketu Axis:</b> {lk.get('rahu_ketu_axis', '—')}"))
    axis_text = lk.get("axis_reading", "")
    if axis_text:
        story.append(small(axis_text))
    story.append(Spacer(1, 0.15 * cm))

    pucca = lk.get("pucca_ghar_planets", [])
    if pucca:
        pucca_str = "  |  ".join(f"{p['planet']} in H{p['house']}" for p in pucca)
        story.append(body(f"<b>★ Pucca Ghar (Permanent House) Planets:</b>  {pucca_str}"))

    story.append(body(
        f"<b>Foreign Settlement Indicator:</b>  {'Active ✈' if lk.get('foreign_indicator') else 'Mild'}"
    ))
    story.append(Spacer(1, 0.15 * cm))

    # Benefits
    benefits = lk.get("benefits", [])
    if benefits:
        story.append(body("<b>Top Benefits from Your Chart:</b>"))
        for b in benefits[:4]:
            story.append(small(f"  ✦  {b}"))

    story.append(Spacer(1, 0.15 * cm))

    # Challenges + remedies
    remedies = lk.get("remedies", [])
    if remedies:
        story.append(body("<b>Personalised Lal Kitab Remedies:</b>"))
        for r in remedies[:5]:
            action = r.get("action") or r.get("remedy", "")
            planet = r.get("planet", "")
            house  = r.get("house", "")
            mantra = r.get("mantra_simple_roman", "")
            story.append(small(
                f"  ◈  <b>{planet} (H{house}):</b>  {action}"
                + (f"  —  Mantra: {mantra}" if mantra else "")
            ))

    # Footer
    story.append(Spacer(1, 0.4 * cm))
    story.append(hr())
    story.append(Paragraph(
        "Generated by TheBhagya AI · thebhagya.com · "
        "For guidance only. Vedic astrology describes tendencies, not certainties.",
        ParagraphStyle("footer", parent=styles["Normal"], fontSize=7,
                       textColor=DIM, alignment=TA_CENTER),
    ))

    doc.build(story, onFirstPage=_draw_bg, onLaterPages=_draw_bg)
    return buf.getvalue()


def _draw_bg(canvas, doc):
    """Dark background on every page."""
    canvas.saveState()
    canvas.setFillColor(DARK_BG)
    canvas.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
    canvas.restoreState()
