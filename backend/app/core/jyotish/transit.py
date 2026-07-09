"""
backend/app/core/jyotish/transit.py

Gochar (Transit) engine for BhagyaAI.

Computes current planetary positions vs natal chart:
  - Transit sign / degree / nakshatra / house from natal Lagna
  - Retrograde status
  - Vedic aspects to natal planets (with house-based aspect rules)
  - Degree-based conjunction detection (orb ≤ 6°)
  - Transit house interpretations for all 9 grahas × 12 houses
  - Special transit flags: Jupiter / Saturn / Rahu-Ketu sign periods
  - Sade Sati status from transit Saturn vs natal Moon
"""

from __future__ import annotations

import logging
from datetime import date, datetime
from typing import Optional

import pytz
import swisseph as swe

from .nakshatra import SIGNS, get_nakshatra_info, get_sign_info, house_from_lagna
from .engine import PLANET_IDS, RAHU_ID

logger = logging.getLogger(__name__)

# ── Sign lords ─────────────────────────────────────────────────────────────────
SIGN_LORDS: dict[str, str] = {
    "Aries": "Mars",   "Taurus": "Venus",  "Gemini": "Mercury",
    "Cancer": "Moon",  "Leo": "Sun",        "Virgo": "Mercury",
    "Libra": "Venus",  "Scorpio": "Mars",  "Sagittarius": "Jupiter",
    "Capricorn": "Saturn", "Aquarius": "Saturn", "Pisces": "Jupiter",
}

# ── Vedic aspect offsets (planet → list of house-offset values) ─────────────
# Offset n means the planet aspects the house (its_house + n) mod 12
# 7th aspect (offset 6) = all planets
# Mars extra: 4th (3), 8th (7)
# Jupiter extra: 5th (4), 9th (8)
# Saturn extra: 3rd (2), 10th (9)
# Rahu/Ketu follow Jupiter pattern
VEDIC_ASPECT_OFFSETS: dict[str, list[int]] = {
    "Sun":     [6],
    "Moon":    [6],
    "Mercury": [6],
    "Venus":   [6],
    "Mars":    [3, 6, 7],
    "Jupiter": [4, 6, 8],
    "Saturn":  [2, 6, 9],
    "Rahu":    [4, 6, 8],
    "Ketu":    [4, 6, 8],
}

# ── Transit house interpretations ─────────────────────────────────────────────
TRANSIT_INTERP: dict[str, dict[int, dict[str, str]]] = {
    "Sun": {
        1:  {"theme": "Identity & Vitality",    "detail": "Vitality and confidence peak. An excellent window to launch projects, assert yourself, and improve health routines."},
        2:  {"theme": "Wealth & Family",         "detail": "Earnings and family matters gain focus. Guard finances and choose words carefully in family discussions."},
        3:  {"theme": "Courage & Siblings",      "detail": "Initiative and boldness are heightened. Short trips and interactions with siblings are productive and energising."},
        4:  {"theme": "Home & Mother",           "detail": "Domestic focus intensifies. Home improvements are well-starred; pay attention to your mother's health and wellbeing."},
        5:  {"theme": "Intellect & Creativity",  "detail": "Creative and intellectual energy surges. Excellent for education, children's matters, and short-term speculation."},
        6:  {"theme": "Health & Enemies",        "detail": "Immunity strengthens and victory over rivals is likely. Service-oriented work brings satisfaction and recognition."},
        7:  {"theme": "Relationships",           "detail": "Partnerships take centre stage. Mind ego friction with spouse or business partners — diplomacy is key."},
        8:  {"theme": "Transformation",          "detail": "Deep introspective energy; sudden changes are possible. Inheritance, insurance, or hidden matters may arise."},
        9:  {"theme": "Fortune & Dharma",        "detail": "Optimism and higher learning flourish. Travel, spirituality, and interactions with mentors are highly favourable."},
        10: {"theme": "Career & Authority",      "detail": "Professional recognition and advancement are on offer. Superiors are supportive; government connections are useful."},
        11: {"theme": "Gains & Networks",        "detail": "Income from multiple sources; social circle expands. Ambitions and long-held wishes are likely to materialise."},
        12: {"theme": "Retreat & Expenditure",   "detail": "Expenses may rise; rest and introspection are recommended. Spiritual practices or overseas work bring inner peace."},
    },
    "Moon": {
        1:  {"theme": "Emotional Sensitivity",   "detail": "Emotional sensitivity is high; public appeal increases. Mood fluctuations are possible — stay grounded and hydrated."},
        2:  {"theme": "Wealth & Sweet Speech",   "detail": "Financial flows improve; family gatherings are pleasant. Thoughtful and sweet speech builds lasting goodwill."},
        3:  {"theme": "Communication & Travel",  "detail": "Curiosity is heightened; short journeys are enjoyable. Sibling interactions are lively and emotionally fulfilling."},
        4:  {"theme": "Home & Inner Peace",      "detail": "Domestic life is nurtured; a strong emotional bond with mother. Inner peace is readily accessible during this transit."},
        5:  {"theme": "Creativity & Children",   "detail": "Intuitive and creative highs. Children bring joy; romantic feelings are present and expressed easily."},
        6:  {"theme": "Health & Service",        "detail": "Digestion and mental stress require attention. Service work is fulfilling; small health improvements are possible."},
        7:  {"theme": "Partnership Warmth",      "detail": "Emotional warmth in relationships; social charm is at a peak. Beneficial for marriage harmony and joint ventures."},
        8:  {"theme": "Hidden Depths",           "detail": "Interest in the occult or healing arts. Emotional undercurrents require awareness and honest self-reflection."},
        9:  {"theme": "Fortune & Wisdom",        "detail": "Spiritual inclinations and good fortune. Travel and interactions with wise elders or teachers are enriching."},
        10: {"theme": "Career Visibility",       "detail": "Public visibility increases; career progress is steady. Emotional investment in professional goals pays dividends."},
        11: {"theme": "Gains & Friends",         "detail": "Social life buzzes; financial gains flow easily. Old friendships are renewed and new connections are formed."},
        12: {"theme": "Dreams & Solitude",       "detail": "Dreams are vivid; a need for solitude and rest. Spiritual practice or meditation yields profound insight."},
    },
    "Mars": {
        1:  {"theme": "Drive & Assertion",       "detail": "Energy and ambition surge — excellent for physical activity and fresh starts. Guard against impulsiveness and accidents."},
        2:  {"theme": "Financial Push",          "detail": "Efforts to increase income intensify. Avoid hasty financial decisions; sharp speech can damage family harmony."},
        3:  {"theme": "Courage & Initiative",    "detail": "Initiative and courage peak. Siblings or teammates may stir things up; short trips are energising and productive."},
        4:  {"theme": "Domestic Tension",        "detail": "Domestic friction is possible; vehicle and property caution is advised. Channel energy into home improvements."},
        5:  {"theme": "Passion & Speculation",   "detail": "Romantic intensity rises; creative energy is high. Avoid impulsive speculative decisions — research before acting."},
        6:  {"theme": "Victory & Vitality",      "detail": "Victory over opponents; immunity improves markedly. Competitive situations are navigated with confidence and ease."},
        7:  {"theme": "Relationship Friction",   "detail": "Conflict in partnerships is possible. Avoid dominance in marriage; channel the energy into shared physical activities."},
        8:  {"theme": "Hidden Obstacles",        "detail": "Hidden obstacles or power struggles may surface. Avoid unnecessary surgeries if possible; occult interest rises."},
        9:  {"theme": "Zealous Action",          "detail": "Zeal for dharma and adventurous travel. Religious or legal disputes may arise — keep faith and stay measured."},
        10: {"theme": "Career Ambition",         "detail": "Ambition reaches a peak; career advancements and leadership roles are highlighted. Results come with bold action."},
        11: {"theme": "Competitive Gains",       "detail": "Monetary gains through effort; network goals are realised through competition. Hard-won success is on the horizon."},
        12: {"theme": "Expenditure & Enemies",   "detail": "Energy expenditure is high; guard against hidden adversaries. Overseas work or spiritual retreat is possible."},
    },
    "Mercury": {
        1:  {"theme": "Sharp Intellect",         "detail": "Mental agility is at its best. Excellent for learning, communication, writing, and business planning of all kinds."},
        2:  {"theme": "Financial Acumen",        "detail": "Financial intelligence improves; good for investments and negotiations. Speech is witty, persuasive, and charming."},
        3:  {"theme": "Writing & Travel",        "detail": "Writing, media, and short journeys are well-starred. Sibling relationships are intellectually stimulating and lively."},
        4:  {"theme": "Home Analysis",           "detail": "Analytical focus on domestic matters; good for real estate research, home planning, and online learning at home."},
        5:  {"theme": "Learning & Children",     "detail": "Sharp intellect aids studies and creative expression. Children's education is highlighted; creative writing flows easily."},
        6:  {"theme": "Detail & Analysis",       "detail": "Detail-oriented work yields excellent results. Debts or health issues benefit greatly from a methodical approach."},
        7:  {"theme": "Partnership Talks",       "detail": "Business partnerships and contracts proceed smoothly. Communication with the spouse or business partner improves."},
        8:  {"theme": "Research & Investigation","detail": "Excellent for research, analysis, and uncovering hidden information. Tax planning, insurance, and investigation."},
        9:  {"theme": "Higher Learning",         "detail": "Philosophy, law, and higher education attract. Long-distance communication and publishing projects are highlighted."},
        10: {"theme": "Career Communication",    "detail": "Professional presentations and negotiations succeed. Writing, technology, and analytical skills advance your career."},
        11: {"theme": "Intellectual Gains",      "detail": "Income from intellectual work or technology. Network connections open doors; clever ideas translate into earnings."},
        12: {"theme": "Private Research",        "detail": "Introspection and private research are favoured. Guard against scattered thinking or communication misunderstandings."},
    },
    "Jupiter": {
        1:  {"theme": "Expansion & Blessings",   "detail": "A highly auspicious transit — optimism, growth, and blessings across all life areas. Health and wisdom improve."},
        2:  {"theme": "Wealth & Family Harmony", "detail": "Financial growth and family harmony are highlighted. Wise financial decisions made now bring lasting prosperity."},
        3:  {"theme": "Knowledge & Siblings",    "detail": "Intellectual expansion; siblings and colleagues benefit. Excellent for writing, teaching, and short travels."},
        4:  {"theme": "Domestic Happiness",      "detail": "Home life flourishes; property gains are possible. Mother's wellbeing is supported; inner peace is accessible."},
        5:  {"theme": "Children & Wisdom",       "detail": "A blessed period for children, creative projects, and higher studies. Speculative gains are possible with prudence."},
        6:  {"theme": "Health & Legal Victory",  "detail": "Immunity and vitality improve; legal disputes are resolved in your favour. Service work brings recognition."},
        7:  {"theme": "Partnership Blessings",   "detail": "Relationships flourish; marriage and business alliances are well-starred. Mutual growth and shared wisdom are the themes."},
        8:  {"theme": "Hidden Gains",            "detail": "Inheritance or windfall gains are possible. Spiritual transformation and longevity are supported by Jupiter's grace."},
        9:  {"theme": "Grace & Fortune",         "detail": "One of Jupiter's finest transits — divine grace, travel, higher studies, and teacher's blessings are all highlighted."},
        10: {"theme": "Career Peak",             "detail": "Professional advancement, recognition, and authority are on offer. A career milestone period is clearly at hand."},
        11: {"theme": "Maximum Gains",           "detail": "Income surges and long-cherished wishes materialise. Elder siblings, mentors, and senior colleagues are supportive."},
        12: {"theme": "Spiritual Liberation",    "detail": "Spiritual gains, charitable work, and retreat. Foreign travel or study abroad is possible; meditation deepens."},
    },
    "Venus": {
        1:  {"theme": "Charm & Magnetism",       "detail": "Personal magnetism peaks; relationships and creative projects flourish. Artistic expression and beauty are rewarded."},
        2:  {"theme": "Luxury & Prosperity",     "detail": "Financial gains and material pleasures. Family life is harmonious; persuasive and sweet speech is highly influential."},
        3:  {"theme": "Creative Expression",     "detail": "Artistic expression through writing, music, and media. Short travel for pleasure is enjoyable and relaxing."},
        4:  {"theme": "Domestic Beauty",         "detail": "Home beautification and domestic harmony. An excellent time to purchase comfort items and decorate the home."},
        5:  {"theme": "Romance & Art",           "detail": "Romantic feelings are strong; creative output is high. Children's events and cultural performances bring happiness."},
        6:  {"theme": "Practical Harmony",       "detail": "Love of service and health-oriented pleasures. Guard against over-indulgence; moderation yields the best results."},
        7:  {"theme": "Partnership Bliss",       "detail": "Marriage and partnerships are highly favoured. Social events and collaborations are aesthetically and emotionally rewarding."},
        8:  {"theme": "Deep Bonds & Intimacy",   "detail": "Intimacy deepens; gains through a partner's resources are possible. Interest in art therapy or spiritual practices."},
        9:  {"theme": "Beauty & Philosophy",     "detail": "Travel to beautiful places; spiritual and artistic pursuits combine harmoniously. Good fortune in foreign settings."},
        10: {"theme": "Professional Elegance",   "detail": "Career in arts, beauty, fashion, or public relations shines. Recognition and professional elegance attract new doors."},
        11: {"theme": "Social & Artistic Gains", "detail": "Gains from social connections and artistic work. Female friendships and creative networks are especially supportive."},
        12: {"theme": "Private Pleasures",       "detail": "Enjoyment of private pleasures and spiritual devotion. Expenses on luxury or retreats are possible and indulgent."},
    },
    "Saturn": {
        1:  {"theme": "Discipline & Endurance",  "detail": "A demanding transit requiring patience and persistence. Results are slow but solid; health and vitality need care."},
        2:  {"theme": "Financial Discipline",    "detail": "Earnings require sustained effort; family responsibilities feel heavier. Strict budgeting and discipline are essential."},
        3:  {"theme": "Steady Effort",           "detail": "Hard work through consistent communication and short journeys. Siblings may need support; perseverance is rewarded."},
        4:  {"theme": "Domestic Responsibility", "detail": "Domestic duties increase; property matters require patience and caution. Mother's health and home stability deserve attention."},
        5:  {"theme": "Serious Studies",         "detail": "Studies and intellectual work demand rigour and focus. Children may face challenges that require parental patience."},
        6:  {"theme": "Disciplined Victory",     "detail": "Disciplined and methodical effort overcomes obstacles and rivals. Excellent for structured health regimes and work routines."},
        7:  {"theme": "Relationship Tests",      "detail": "Relationships undergo tests of commitment; patience and responsibility are needed. Delays in marriage if you are single."},
        8:  {"theme": "Karmic Depth",            "detail": "Deep karmic work; delays and hidden obstacles are present. Excellent for spiritual practice, austerity, and inner work."},
        9:  {"theme": "Dharmic Tests",           "detail": "Faith and philosophical beliefs are tested. Travel may be delayed; hard work on dharmic or legal matters pays off eventually."},
        10: {"theme": "Career Responsibility",   "detail": "Career advances through sustained effort and responsibility. Supervisory roles bring accountability — avoid shortcuts."},
        11: {"theme": "Slow but Real Gains",     "detail": "Income grows gradually through consistent effort. Networking with disciplined, senior individuals pays off over time."},
        12: {"theme": "Release & Retreat",       "detail": "Karma is being processed; expenses rise. Spiritual practice, hospital visits, or foreign residence are highlighted."},
    },
    "Rahu": {
        1:  {"theme": "Intense Ambition",        "detail": "Intense ambition and unconventional self-expression. Guard against ego inflation or confusion about your true identity."},
        2:  {"theme": "Material Desire",         "detail": "Strong desire for wealth and social status. Watch for dishonesty in financial dealings; integrity protects gains."},
        3:  {"theme": "Bold Media & Tech",       "detail": "Unconventional communication style; technology and media pursuits are strongly highlighted and well-rewarded."},
        4:  {"theme": "Home Disruption",         "detail": "Unusual changes at home; foreign or unconventional influence in domestic life. Ancestral property matters surface."},
        5:  {"theme": "Speculative Drive",       "detail": "Strong drive for speculation and creativity — guard against compulsive gambling or risky decisions. Genius is possible."},
        6:  {"theme": "Strategic Victory",       "detail": "Gains over enemies through strategic cunning. Hidden health issues require careful and proactive monitoring."},
        7:  {"theme": "Unusual Partnerships",    "detail": "Relationships with foreign, unconventional, or unexpected partners. Intense but possibly unstable alliances are likely."},
        8:  {"theme": "Occult & Sudden Change",  "detail": "Deep interest in the occult, hidden knowledge, and sudden transformations. Research and investigative work succeeds."},
        9:  {"theme": "Unconventional Beliefs",  "detail": "Challenge to traditional faith; foreign travel, unorthodox gurus, and non-mainstream spiritual paths are highlighted."},
        10: {"theme": "Rapid Career Rise",       "detail": "Rapid but sometimes unconventional career rise. Foreign companies, technology sectors, and startups are highlighted."},
        11: {"theme": "Ambitious Gains",         "detail": "Large gains are possible; ambitious networking opens doors. Guard against greed and unrealistic expectations."},
        12: {"theme": "Foreign & Spiritual",     "detail": "Foreign travel, hidden spiritual work, and liberation from entrenched past patterns. Retreats abroad are beneficial."},
    },
    "Ketu": {
        1:  {"theme": "Spiritual Detachment",    "detail": "Spiritual detachment from ego and material identity. Health fluctuations are possible; past-life patterns surface for release."},
        2:  {"theme": "Financial Detachment",    "detail": "Disinterest in material accumulation; possible losses of savings. Spiritual speech and honest communication are valued."},
        3:  {"theme": "Introspective Mind",      "detail": "Introversion in communication. Spiritual writing, silence, or creative solitude brings deep and unexpected insights."},
        4:  {"theme": "Home Detachment",         "detail": "Feeling disconnected from home or roots. Interest in meditation, inner peace, and seeking spiritual retreats grows."},
        5:  {"theme": "Intuitive Creativity",    "detail": "Spiritual creativity and past-life knowledge surface naturally. Children may carry deep karmic significance."},
        6:  {"theme": "Karmic Healing",          "detail": "Chronic or mysterious health issues need attention. Spiritual healing, energy work, and alternative medicine are effective."},
        7:  {"theme": "Karmic Relationships",    "detail": "Distance or detachment in partnerships; deep karmic relationship patterns and past-life bonds with partners surface."},
        8:  {"theme": "Deep Mysticism",          "detail": "Mystical experiences, near-death awareness, and profound spiritual transformation are on offer. Surrender is the path."},
        9:  {"theme": "Philosophical Search",    "detail": "Disillusionment with established religion; intense and personal spiritual inquiry leads to authentic inner wisdom."},
        10: {"theme": "Career Uncertainty",      "detail": "Career detachment or a sudden shift is possible. Success comes through research-based, spiritual, or healing work."},
        11: {"theme": "Detached Gains",          "detail": "Unexpected gains arrive without attachment or effort. Social detachment; the focus turns naturally to inner growth."},
        12: {"theme": "Liberation & Moksha",     "detail": "A moksha-oriented period; meditation, retreat, and the gentle dissolution of old karma. Dreams are vivid and instructive."},
    },
}

# ── Special transit reference (approx years in sign) ──────────────────────────
TRANSIT_DURATION: dict[str, str] = {
    "Sun":     "~1 month per sign",
    "Moon":    "~2.5 days per sign",
    "Mercury": "~3–4 weeks per sign",
    "Venus":   "~4 weeks per sign",
    "Mars":    "~45 days per sign",
    "Jupiter": "~12–13 months per sign",
    "Saturn":  "~2.5 years per sign",
    "Rahu":    "~18 months per sign (retrograde)",
    "Ketu":    "~18 months per sign (retrograde)",
}


# ── Julian Day helper ─────────────────────────────────────────────────────────

def _to_julian_day(date_str: str, time_str: str, tz_str: str) -> float:
    tz_obj   = pytz.timezone(tz_str)
    parts    = time_str.split(":")
    hour     = int(parts[0])
    minute   = int(parts[1])
    second   = int(parts[2]) if len(parts) > 2 else 0
    d        = date.fromisoformat(date_str)
    local_dt = datetime(d.year, d.month, d.day, hour, minute, second)
    local_dt = tz_obj.localize(local_dt)
    utc_dt   = local_dt.astimezone(pytz.utc)
    return swe.julday(
        utc_dt.year, utc_dt.month, utc_dt.day,
        utc_dt.hour + utc_dt.minute / 60.0 + utc_dt.second / 3600.0,
    )


def _compute_planet_positions(jd_ut: float, lagna_sign_idx: int) -> dict:
    """Compute sidereal positions for all 9 grahas at a given Julian Day."""
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    result: dict = {}

    for name, pid in PLANET_IDS.items():
        pos, _ = swe.calc_ut(jd_ut, pid, swe.FLG_SIDEREAL | swe.FLG_SPEED)
        lon     = pos[0] % 360.0
        si      = get_sign_info(lon)
        ni      = get_nakshatra_info(lon)
        result[name] = {
            "longitude":  round(lon, 4),
            "sign":       si["sign"],
            "sign_index": si["sign_index"],
            "degree":     round(si["degree"], 2),
            "nakshatra":  ni["nakshatra"],
            "nak_lord":   ni["lord"],
            "pada":       ni["pada"],
            "house":      house_from_lagna(si["sign_index"], lagna_sign_idx) if lagna_sign_idx is not None else None,
            "retrograde": bool(pos[3] < 0),
            "speed":      round(pos[3], 4),
        }

    # Rahu / Ketu
    pos, _   = swe.calc_ut(jd_ut, RAHU_ID, swe.FLG_SIDEREAL | swe.FLG_SPEED)
    rahu_lon = pos[0] % 360.0
    ketu_lon = (rahu_lon + 180.0) % 360.0
    for name, lon in [("Rahu", rahu_lon), ("Ketu", ketu_lon)]:
        si = get_sign_info(lon)
        ni = get_nakshatra_info(lon)
        result[name] = {
            "longitude":  round(lon, 4),
            "sign":       si["sign"],
            "sign_index": si["sign_index"],
            "degree":     round(si["degree"], 2),
            "nakshatra":  ni["nakshatra"],
            "nak_lord":   ni["lord"],
            "pada":       ni["pada"],
            "house":      house_from_lagna(si["sign_index"], lagna_sign_idx) if lagna_sign_idx is not None else None,
            "retrograde": True,
            "speed":      round(pos[3], 4),
        }

    return result


def _angular_diff(lon1: float, lon2: float) -> float:
    """Smallest absolute angle between two longitudes."""
    diff = abs(lon1 - lon2) % 360.0
    return diff if diff <= 180.0 else 360.0 - diff


def _detect_conjunction(tr_lon: float, nat_lon: float, orb: float = 6.0) -> float | None:
    """Return orb if within conjunction threshold, else None."""
    diff = _angular_diff(tr_lon, nat_lon)
    return round(diff, 2) if diff <= orb else None


def _get_vedic_aspects(transit_planet: str, transit_house: int, natal_planets: dict) -> list[dict]:
    """
    Return list of Vedic aspect hits from the transit planet to natal planets.
    """
    offsets  = VEDIC_ASPECT_OFFSETS.get(transit_planet, [6])
    aspected_houses = [((transit_house - 1 + off) % 12) + 1 for off in offsets]
    hits: list[dict] = []
    aspect_name_map = {6: "7th (opposition)", 3: "4th", 7: "8th", 4: "5th", 8: "9th", 2: "3rd", 9: "10th"}

    for off, asp_house in zip(offsets, aspected_houses):
        for planet_name, pdata in natal_planets.items():
            if pdata.get("house") == asp_house:
                hits.append({
                    "natal_planet":  planet_name,
                    "natal_house":   asp_house,
                    "aspect_type":   aspect_name_map.get(off, f"{off+1}th"),
                })

    return hits


def compute_transits(
    birth_date:  str,
    birth_time:  str,
    birth_tz:    str,
    birth_lat:   float,
    birth_lon:   float,
    query_date:  Optional[str] = None,
    query_time:  str = "12:00",
    query_tz:    str = "Asia/Kolkata",
) -> dict:
    """
    Compute full Gochar (transit) report.

    Args:
        birth_date:  "YYYY-MM-DD"
        birth_time:  "HH:MM" or "HH:MM:SS" (local)
        birth_tz:    IANA timezone string
        birth_lat/lon: Birth coordinates
        query_date:  Date to compute transits for (default = today)
        query_time:  Time for transit query (default noon)
        query_tz:    Timezone for query date

    Returns:
        Full transit report dict.
    """
    swe.set_sid_mode(swe.SIDM_LAHIRI)

    if not query_date:
        query_date = date.today().isoformat()

    # ── Natal chart ──────────────────────────────────────────────────────────
    natal_jd  = _to_julian_day(birth_date, birth_time, birth_tz)
    ayanamsa  = swe.get_ayanamsa(natal_jd)

    # Natal lagna
    from .engine import JyotishEngine
    _eng = JyotishEngine()
    natal_lagna = _eng._compute_lagna(natal_jd, birth_lat, birth_lon, ayanamsa)
    natal_lagna_sign_idx = natal_lagna["sign_index"]

    # Natal planets (with house from lagna)
    natal_planets = _compute_planet_positions(natal_jd, natal_lagna_sign_idx)

    # ── Transit positions ────────────────────────────────────────────────────
    transit_jd      = _to_julian_day(query_date, query_time, query_tz)
    transit_planets = _compute_planet_positions(transit_jd, natal_lagna_sign_idx)
    transit_ayanamsa = swe.get_ayanamsa(transit_jd)

    # ── Build transit report entries ─────────────────────────────────────────
    transits: dict[str, dict] = {}
    tight_conjunctions: list[dict] = []

    for planet in ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Rahu", "Ketu"]:
        tr   = transit_planets[planet]
        nat  = natal_planets[planet]
        house= tr["house"]  # house from natal Lagna

        # Vedic house-based aspects to natal planets
        aspects = _get_vedic_aspects(planet, house, natal_planets)

        # Degree-based conjunctions with natal planets (orb ≤ 6°)
        conj_hits: list[dict] = []
        for nat_name, nat_data in natal_planets.items():
            orb = _detect_conjunction(tr["longitude"], nat_data["longitude"], orb=6.0)
            if orb is not None:
                conj_entry = {
                    "natal_planet": nat_name,
                    "orb": orb,
                    "aspect_type": "conjunction",
                }
                conj_hits.append(conj_entry)
                if orb <= 3.0:
                    tight_conjunctions.append({
                        "transit_planet": planet,
                        "natal_planet":   nat_name,
                        "orb":            orb,
                        "sign":           tr["sign"],
                        "house":          house,
                    })

        # Interpretation
        interp = TRANSIT_INTERP.get(planet, {}).get(house, {
            "theme": "Transit Active",
            "detail": f"{planet} is transiting the {house}th house from your natal Lagna."
        })

        transits[planet] = {
            # Transit position
            "longitude":   tr["longitude"],
            "sign":        tr["sign"],
            "sign_index":  tr["sign_index"],
            "degree":      tr["degree"],
            "nakshatra":   tr["nakshatra"],
            "nak_lord":    tr["nak_lord"],
            "pada":        tr["pada"],
            "house":       house,
            "retrograde":  tr["retrograde"],
            "speed":       tr["speed"],
            # Natal reference
            "natal_longitude": nat["longitude"],
            "natal_sign":      nat["sign"],
            "natal_degree":    nat["degree"],
            "natal_nakshatra": nat["nakshatra"],
            "natal_house":     nat["house"],
            # Aspects
            "vedic_aspects":   aspects,
            "conjunctions":    conj_hits,
            # Interpretation
            "theme":  interp["theme"],
            "detail": interp["detail"],
            # Duration hint
            "duration_in_sign": TRANSIT_DURATION.get(planet, ""),
        }

    # ── Special transits ─────────────────────────────────────────────────────
    natal_moon_sign_idx = natal_planets["Moon"]["sign_index"]
    saturn_sign_idx     = transit_planets["Saturn"]["sign_index"]

    # Sade Sati: Saturn in Moon sign ±1
    sade_sati_signs = [(natal_moon_sign_idx - 1) % 12, natal_moon_sign_idx, (natal_moon_sign_idx + 1) % 12]
    sade_sati_active = saturn_sign_idx in sade_sati_signs
    sade_sati_phase  = None
    if sade_sati_active:
        if saturn_sign_idx == (natal_moon_sign_idx - 1) % 12:
            sade_sati_phase = "Rising (12th from Moon)"
        elif saturn_sign_idx == natal_moon_sign_idx:
            sade_sati_phase = "Peak (on Moon sign)"
        else:
            sade_sati_phase = "Setting (2nd from Moon)"

    # Jupiter transit from natal Moon
    jup_sign_idx   = transit_planets["Jupiter"]["sign_index"]
    jup_from_moon  = house_from_lagna(jup_sign_idx, natal_moon_sign_idx)

    special_transits = {
        "jupiter": {
            "sign":           transit_planets["Jupiter"]["sign"],
            "house_from_lagna": transit_planets["Jupiter"]["house"],
            "house_from_moon":  jup_from_moon,
            "retrograde":     transit_planets["Jupiter"]["retrograde"],
            "duration":       TRANSIT_DURATION["Jupiter"],
            "note": "Guru Peyarchi — Jupiter in 1st/5th/9th from Moon is highly auspicious." if jup_from_moon in [1, 5, 9] else
                    "Jupiter in 4th/7th/10th from Moon brings mixed results." if jup_from_moon in [4, 7, 10] else
                    "Jupiter in 2nd/6th/8th/11th/12th brings average results."
        },
        "saturn": {
            "sign":           transit_planets["Saturn"]["sign"],
            "house_from_lagna": transit_planets["Saturn"]["house"],
            "retrograde":     transit_planets["Saturn"]["retrograde"],
            "duration":       TRANSIT_DURATION["Saturn"],
            "sade_sati_active": sade_sati_active,
            "sade_sati_phase":  sade_sati_phase,
        },
        "rahu_ketu": {
            "rahu_sign":      transit_planets["Rahu"]["sign"],
            "ketu_sign":      transit_planets["Ketu"]["sign"],
            "rahu_house":     transit_planets["Rahu"]["house"],
            "ketu_house":     transit_planets["Ketu"]["house"],
            "duration":       TRANSIT_DURATION["Rahu"],
            "note": f"Rahu transiting {transit_planets['Rahu']['sign']} activates 12th/8th/6th house themes for those signs."
        },
    }

    return {
        "birth_date":     birth_date,
        "query_date":     query_date,
        "ayanamsa":       round(transit_ayanamsa, 4),
        "natal_lagna":    natal_lagna,
        "natal_moon_sign": natal_planets["Moon"]["sign"],
        "transits":        transits,
        "special_transits": special_transits,
        "tight_conjunctions": tight_conjunctions,  # orb ≤ 3° — most urgent
    }
