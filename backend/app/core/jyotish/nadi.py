"""
backend/app/core/jyotish/nadi.py

Nadi Astrology computation engine for BhagyaAI.

Nadi astrology is based on the Nadiamsa system — each rashi (30°) is divided
into 150 parts of 12' (0.2°) each, giving 150 Nadi amsas per sign and
1800 divisions across the whole zodiac.

The Nadi chart reveals soul-level karmas, life patterns, and destined events
through the fine-grained planetary sub-divisional positions.

Public function:
    compute_nadi(dob, tob, tz, lat, lon) -> dict

Returns:
    lagna, planets (9), nadi_yogas, life_themes, nadi_predictions
"""

from __future__ import annotations

import logging
from datetime import date, datetime
from typing import Optional

import pytz
import swisseph as swe

from .dasha import compute_dasha_tree, current_dasha
from .nakshatra import SIGNS, get_nakshatra_info, get_sign_info, house_from_lagna

logger = logging.getLogger(__name__)

# ── Planet IDs (pyswisseph) ───────────────────────────────────────────────
PLANET_IDS: dict[str, int] = {
    "Sun":     swe.SUN,
    "Moon":    swe.MOON,
    "Mars":    swe.MARS,
    "Mercury": swe.MERCURY,
    "Jupiter": swe.JUPITER,
    "Venus":   swe.VENUS,
    "Saturn":  swe.SATURN,
}
RAHU_ID: int = swe.MEAN_NODE   # Rahu = mean north node; Ketu = exactly 180° opposite

# Standard output order for planets in the response
PLANET_ORDER: list[str] = [
    "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"
]

# ── Nadi Amsa constants ───────────────────────────────────────────────────
# Each rashi (30°) holds 150 Nadi amsas; each amsa = 0.2° = 12'
NADI_AMSA_PER_SIGN: int   = 150
NADI_AMSA_SPAN:     float = 30.0 / NADI_AMSA_PER_SIGN  # 0.2°

# Odd sign indices (0-based): Aries=0, Gemini=2, Leo=4, Libra=6, Sagittarius=8, Aquarius=10
# Odd signs count amsa forward (Aries → Taurus → … → Pisces, repeating).
# Even signs count amsa backward (Pisces → Aquarius → … → Aries, repeating).
ODD_SIGN_INDICES: frozenset[int] = frozenset({0, 2, 4, 6, 8, 10})

# ── Dignity tables ────────────────────────────────────────────────────────

# Exaltation sign per planet
EXALTATION: dict[str, str] = {
    "Sun":     "Aries",
    "Moon":    "Taurus",
    "Mars":    "Capricorn",
    "Mercury": "Virgo",
    "Jupiter": "Cancer",
    "Venus":   "Pisces",
    "Saturn":  "Libra",
    "Rahu":    "Gemini",       # Taurus also used; Gemini preferred
    "Ketu":    "Sagittarius",  # Scorpio also used; Sagittarius preferred
}

# Debilitation sign per planet (opposite of exaltation)
DEBILITATION: dict[str, str] = {
    "Sun":     "Libra",
    "Moon":    "Scorpio",
    "Mars":    "Cancer",
    "Mercury": "Pisces",
    "Jupiter": "Capricorn",
    "Venus":   "Virgo",
    "Saturn":  "Aries",
    "Rahu":    "Sagittarius",
    "Ketu":    "Gemini",
}

# Own (swakshetra) signs per planet
OWN_SIGNS: dict[str, list[str]] = {
    "Sun":     ["Leo"],
    "Moon":    ["Cancer"],
    "Mars":    ["Aries", "Scorpio"],
    "Mercury": ["Gemini", "Virgo"],
    "Jupiter": ["Sagittarius", "Pisces"],
    "Venus":   ["Taurus", "Libra"],
    "Saturn":  ["Capricorn", "Aquarius"],
    "Rahu":    [],
    "Ketu":    [],
}

# Sign lords (for planetary friendship resolution)
SIGN_LORDS: dict[str, str] = {
    "Aries":       "Mars",
    "Taurus":      "Venus",
    "Gemini":      "Mercury",
    "Cancer":      "Moon",
    "Leo":         "Sun",
    "Virgo":       "Mercury",
    "Libra":       "Venus",
    "Scorpio":     "Mars",
    "Sagittarius": "Jupiter",
    "Capricorn":   "Saturn",
    "Aquarius":    "Saturn",
    "Pisces":      "Jupiter",
}

# Classical natural friendship table
PLANET_FRIENDS: dict[str, list[str]] = {
    "Sun":     ["Moon", "Mars", "Jupiter"],
    "Moon":    ["Sun", "Mercury"],
    "Mars":    ["Sun", "Moon", "Jupiter"],
    "Mercury": ["Sun", "Venus"],
    "Jupiter": ["Sun", "Moon", "Mars"],
    "Venus":   ["Mercury", "Saturn"],
    "Saturn":  ["Mercury", "Venus"],
    "Rahu":    ["Venus", "Saturn"],
    "Ketu":    ["Mars", "Venus"],
}

PLANET_ENEMIES: dict[str, list[str]] = {
    "Sun":     ["Saturn", "Venus"],
    "Moon":    [],
    "Mars":    ["Mercury"],
    "Mercury": ["Moon"],
    "Jupiter": ["Mercury", "Venus"],
    "Venus":   ["Sun", "Moon"],
    "Saturn":  ["Sun", "Moon", "Mars"],
    "Rahu":    ["Sun", "Moon"],
    "Ketu":    ["Sun", "Moon"],
}

# ── Naisargika Karakas (natural significators) ────────────────────────────
NAISARGIKA_KARAKA: dict[str, str] = {
    "Sun":     "Soul/father/authority",
    "Moon":    "Mind/mother/emotions",
    "Mars":    "Energy/siblings/property",
    "Mercury": "Intelligence/speech/trade",
    "Jupiter": "Wisdom/children/dharma",
    "Venus":   "Relationships/arts/wealth",
    "Saturn":  "Longevity/karma/service",
    "Rahu":    "Desires/foreign/technology",
    "Ketu":    "Spirituality/liberation/past",
}

# ── Classical Nadi interpretation notes per planet ────────────────────────
NADI_PLANET_NOTES: dict[str, str] = {
    "Sun": (
        "Atmakaraka — the soul's central purpose, father, authority, and government. "
        "Its Nadi amsa placement reveals the depth of one's spiritual mission and how "
        "the native expresses leadership across this lifetime."
    ),
    "Moon": (
        "Manokaraka — governs mind, mother, emotions, and public life. "
        "A strong Moon in Nadi amsa indicates emotional intelligence, nurturing gifts, "
        "and a sensitive attunement to collective moods and needs."
    ),
    "Mars": (
        "Energy lord — reveals courage, property matters, and sibling dynamics. "
        "The Nadi amsa of Mars shows how the native channels vital force, resolves "
        "conflicts, and pursues ambitions with precision and drive."
    ),
    "Mercury": (
        "Budhakaraka — intellect, commerce, writing, and communication. "
        "Its Nadi amsa position shapes the quality and style of mental expression, "
        "the facility with language, and the acuity of analytical reasoning."
    ),
    "Jupiter": (
        "Guru — wisdom, children, teaching, and dharmic purpose. "
        "A strong Jupiter in Nadi amsa blesses the native with divine grace, "
        "ethical leadership, and the capacity to guide others toward truth."
    ),
    "Venus": (
        "Shukrakaraka — love, beauty, arts, and material prosperity. "
        "The Nadi amsa of Venus shapes the quality of intimate relationships, "
        "creative expression, and the native's relationship with abundance."
    ),
    "Saturn": (
        "Karmakaraka — discipline, longevity, service, and karmic lessons. "
        "Its Nadi amsa governs the karmic debts carried from prior lifetimes "
        "and the structured path of work, patience, and eventual mastery."
    ),
    "Rahu": (
        "Maya lord — desire, foreign lands, technology, and the unconventional. "
        "Rahu's Nadi amsa reveals the soul's hunger for new experiences this lifetime, "
        "the allure of the unfamiliar, and ambitions that transcend convention."
    ),
    "Ketu": (
        "Moksha karaka — spirituality, liberation, and past-life wisdom. "
        "A strong Ketu in Nadi indicates mastery of inner dimensions, a natural "
        "inclination toward renunciation, and access to deep intuitive knowing."
    ),
}

# ── Dasha thematic descriptions (for prediction generation) ──────────────
DASHA_THEMES: dict[str, dict[str, str]] = {
    "Sun":     {"theme": "leadership and self-assertion",               "tone": "authority and recognition"},
    "Moon":    {"theme": "emotional growth and domestic matters",       "tone": "introspection and care"},
    "Mars":    {"theme": "action, ambition, and property affairs",      "tone": "drive and courage"},
    "Mercury": {"theme": "learning, business, and communication",       "tone": "adaptability and skill"},
    "Jupiter": {"theme": "wisdom, expansion, and divine blessings",     "tone": "grace and growth"},
    "Venus":   {"theme": "relationships, arts, and prosperity",         "tone": "harmony and beauty"},
    "Saturn":  {"theme": "discipline, responsibility, and karmic reckoning", "tone": "patience and perseverance"},
    "Rahu":    {"theme": "ambition, foreign influences, and innovation","tone": "sudden changes and worldly hunger"},
    "Ketu":    {"theme": "spiritual seeking and detachment",            "tone": "inner wisdom and release"},
}


# ══════════════════════════════════════════════════════════════════════════
# Internal helpers
# ══════════════════════════════════════════════════════════════════════════

def _to_julian_day(dob: str, tob: str, timezone_str: str) -> float:
    """Convert local birth date/time to Julian Day (UT)."""
    tz_obj = pytz.timezone(timezone_str)
    parts  = tob.split(":")
    hour   = int(parts[0])
    minute = int(parts[1])
    second = int(parts[2]) if len(parts) > 2 else 0

    d        = date.fromisoformat(dob)
    local_dt = datetime(d.year, d.month, d.day, hour, minute, second)
    local_dt = tz_obj.localize(local_dt)
    utc_dt   = local_dt.astimezone(pytz.utc)

    return swe.julday(
        utc_dt.year, utc_dt.month, utc_dt.day,
        utc_dt.hour + utc_dt.minute / 60.0 + utc_dt.second / 3600.0,
    )


def _compute_nadi_amsa(degree_in_sign: float, sign_index: int) -> tuple[int, str]:
    """
    Compute the Nadi amsa number (1–150) and its corresponding amsa sign.

    Formula:
        nadi_amsa = floor(degree_in_sign / 0.2°) + 1   [clipped to 150]

    Amsa sign direction:
        Odd signs  (Aries, Gemini, Leo, Libra, Sagittarius, Aquarius):
            forward  → amsa_sign_idx = (nadi_amsa - 1) % 12
        Even signs (Taurus, Cancer, Virgo, Scorpio, Capricorn, Pisces):
            backward → amsa_sign_idx = (12 - nadi_amsa % 12) % 12

    Args:
        degree_in_sign: Degrees within the sign (0 to <30).
        sign_index:     0-based sign index (0 = Aries … 11 = Pisces).

    Returns:
        (nadi_amsa, amsa_sign_name)
    """
    nadi_amsa = min(int(degree_in_sign / NADI_AMSA_SPAN) + 1, NADI_AMSA_PER_SIGN)

    if sign_index in ODD_SIGN_INDICES:
        # Odd signs: amsas cycle forward Aries → Taurus → … → Pisces
        amsa_sign_idx = (nadi_amsa - 1) % 12
    else:
        # Even signs: amsas cycle backward Pisces → Aquarius → … → Aries
        amsa_sign_idx = (12 - nadi_amsa % 12) % 12

    return nadi_amsa, SIGNS[amsa_sign_idx]


def _get_dignity(planet: str, sign: str) -> str:
    """
    Return the classical dignity of a planet in a given sign.

    Priority: exalted > debilitated > own > friend > enemy > neutral
    Rahu and Ketu have no own signs; resolve only to exalted/debilitated/neutral.
    """
    if sign == EXALTATION.get(planet):
        return "exalted"
    if sign == DEBILITATION.get(planet):
        return "debilitated"
    if sign in OWN_SIGNS.get(planet, []):
        return "own"
    if planet in ("Rahu", "Ketu"):
        return "neutral"

    # Resolve via the sign lord's relationship to the planet
    sign_lord = SIGN_LORDS.get(sign, "")
    if sign_lord in PLANET_FRIENDS.get(planet, []):
        return "friend"
    if sign_lord in PLANET_ENEMIES.get(planet, []):
        return "enemy"
    return "neutral"


def _is_strong_dignity(dignity: str) -> bool:
    """Return True if the dignity is auspicious (exalted, own, or friend)."""
    return dignity in ("exalted", "own", "friend")


def _houses_in_trine(h: int) -> tuple[int, int]:
    """Return the two houses that form a 120° trine to house h (1-based)."""
    h1 = ((h - 1 + 4) % 12) + 1
    h2 = ((h - 1 + 8) % 12) + 1
    return h1, h2


def _is_angular(house: int) -> bool:
    """Return True if the house is a Kendra (angle): 1, 4, 7, or 10."""
    return house in (1, 4, 7, 10)


def _are_same_or_trine(h1: Optional[int], h2: Optional[int]) -> bool:
    """Return True if two house numbers are the same or in trine."""
    if h1 is None or h2 is None:
        return False
    if h1 == h2:
        return True
    t1, t2 = _houses_in_trine(h1)
    return h2 in (t1, t2)


def _are_7th_aspect(h1: Optional[int], h2: Optional[int]) -> bool:
    """Return True if two house numbers are in 7th-house opposition."""
    if h1 is None or h2 is None:
        return False
    return ((h1 - 1 + 6) % 12) + 1 == h2 or ((h2 - 1 + 6) % 12) + 1 == h1


def _are_together(h1: Optional[int], h2: Optional[int]) -> bool:
    """Return True if two planets occupy the same house."""
    return h1 is not None and h1 == h2


# ── Nadi Yoga checkers ────────────────────────────────────────────────────

def _check_nadi_yogas(planet_data: dict) -> list[dict]:
    """
    Check for classical Nadi Yogas present in the chart.

    Only yogas that are actually formed are returned. Each yoga specifies
    the triggering planets, a description, and a strength assessment.

    Args:
        planet_data: Dict of planet_name → {house, sign, dignity, …},
                     plus "_lagna_sign_idx" (int) for the 7th-lord computation.

    Returns:
        List of yoga dicts: {name, planets, description, strength}
    """
    yogas: list[dict] = []

    def house_of(p: str) -> Optional[int]:
        d = planet_data.get(p)
        if isinstance(d, dict):
            return d.get("house")
        return None

    def dignity_of(p: str) -> str:
        d = planet_data.get(p)
        if isinstance(d, dict):
            return d.get("dignity", "neutral")
        return "neutral"

    # 1. Nadi Yoga of Wealth — Venus + Jupiter in same or trine houses
    v_h = house_of("Venus")
    j_h = house_of("Jupiter")
    if _are_same_or_trine(v_h, j_h):
        v_strong = _is_strong_dignity(dignity_of("Venus"))
        j_strong = _is_strong_dignity(dignity_of("Jupiter"))
        strength = "strong" if (v_strong or j_strong) else "moderate"
        yogas.append({
            "name": "Nadi Yoga of Wealth",
            "planets": ["Venus", "Jupiter"],
            "description": (
                "Lakshmi Yoga in Nadi reading — Venus and Jupiter in the same or trine "
                "houses bestow material abundance, generosity, and sustained prosperity."
            ),
            "strength": strength,
        })

    # 2. Nadi Yoga of Career — Sun + Saturn in conjunction or 7th-house opposition
    s_h  = house_of("Sun")
    sa_h = house_of("Saturn")
    if _are_together(s_h, sa_h) or _are_7th_aspect(s_h, sa_h):
        strength = "strong" if dignity_of("Sun") in ("exalted", "own") else "moderate"
        yogas.append({
            "name": "Nadi Yoga of Career",
            "planets": ["Sun", "Saturn"],
            "description": (
                "Authority through discipline — Sun and Saturn in conjunction or opposition "
                "forge a powerful career through sustained effort and structured authority."
            ),
            "strength": strength,
        })

    # 3. Nadi Yoga of Foreign Settlement — Rahu in 9th or 12th + Jupiter present
    r_h = house_of("Rahu")
    if r_h in (9, 12) and j_h is not None:
        strength = "strong" if _is_strong_dignity(dignity_of("Jupiter")) else "moderate"
        yogas.append({
            "name": "Nadi Yoga of Foreign Settlement",
            "planets": ["Rahu", "Jupiter"],
            "description": (
                "Strong indicator of foreign connections — Rahu in the 9th or 12th house "
                "with a well-placed Jupiter draws the native to distant lands for spiritual "
                "or material growth."
            ),
            "strength": strength,
        })

    # 4. Nadi Yoga of Spirituality — Ketu + Jupiter or Moon (together or 7th aspect)
    k_h    = house_of("Ketu")
    moon_h = house_of("Moon")
    ketu_jupiter = _are_together(k_h, j_h)  or _are_7th_aspect(k_h, j_h)
    ketu_moon    = _are_together(k_h, moon_h) or _are_7th_aspect(k_h, moon_h)
    if ketu_jupiter or ketu_moon:
        involved = ["Ketu"]
        if ketu_jupiter:
            involved.append("Jupiter")
        if ketu_moon:
            involved.append("Moon")
        strength = "strong" if dignity_of("Ketu") in ("exalted",) else "moderate"
        yogas.append({
            "name": "Nadi Yoga of Spirituality",
            "planets": involved,
            "description": (
                "Deep spiritual inclination — Ketu aligned with Jupiter or Moon grants "
                "inner wisdom, renunciation tendencies, and access to higher consciousness."
            ),
            "strength": strength,
        })

    # 5. Nadi Yoga of Communication — Mercury + Moon both in angular houses (Kendra)
    m_h = house_of("Mercury")
    if m_h is not None and moon_h is not None and _is_angular(m_h) and _is_angular(moon_h):
        strength = "strong" if _is_strong_dignity(dignity_of("Mercury")) else "moderate"
        yogas.append({
            "name": "Nadi Yoga of Communication",
            "planets": ["Mercury", "Moon"],
            "description": (
                "Gift of expression and intuition — Mercury and Moon both in angular houses "
                "create a rare blend of rational intellect and empathic understanding, "
                "producing natural orators, writers, and counselors."
            ),
            "strength": strength,
        })

    # 6. Karma Yoga — Saturn + Rahu (together or 7th aspect)
    if _are_together(sa_h, r_h) or _are_7th_aspect(sa_h, r_h):
        strength = "strong" if _is_strong_dignity(dignity_of("Saturn")) else "moderate"
        yogas.append({
            "name": "Karma Yoga",
            "planets": ["Saturn", "Rahu"],
            "description": (
                "Past-life karmic debts — Saturn and Rahu together or in opposition "
                "indicate a disciplined path of service and karmic reckoning carried "
                "from prior lifetimes. Honesty and sustained effort are essential."
            ),
            "strength": strength,
        })

    # 7. Nadi Yoga of Marriage — Venus strong AND 7th lord in a favorable dignity
    lagna_sign_idx = planet_data.get("_lagna_sign_idx", 0)
    seventh_sign_idx = (lagna_sign_idx + 6) % 12
    seventh_lord = SIGN_LORDS[SIGNS[seventh_sign_idx]]
    v_dig  = dignity_of("Venus")
    sl_dig = dignity_of(seventh_lord)
    if _is_strong_dignity(v_dig) and _is_strong_dignity(sl_dig) and seventh_lord in planet_data:
        strength = "strong" if v_dig == "exalted" or sl_dig == "exalted" else "moderate"
        # Avoid duplicate planets in list
        yoga_planets = list(dict.fromkeys(["Venus", seventh_lord]))
        yogas.append({
            "name": "Nadi Yoga of Marriage",
            "planets": yoga_planets,
            "description": (
                "Harmonious marital life — Venus and the 7th house lord both in favorable "
                "dignity promise a loving, stable, and growth-oriented partnership."
            ),
            "strength": strength,
        })

    return yogas


# ── Life Theme generator ──────────────────────────────────────────────────

def _generate_life_themes(planet_data: dict) -> list[dict]:
    """
    Generate 4–6 life themes based on planetary dignities, house placements,
    and natural karaka roles.

    Areas covered: Career, Relationships, Wealth, Spirituality, Health, Travel, Family.

    Args:
        planet_data: Planet dict (same as passed to yoga checker).

    Returns:
        List of 4–6 theme dicts: {area, theme, planets, detail}
    """
    themes: list[dict] = []

    def house_of(p: str) -> Optional[int]:
        d = planet_data.get(p)
        if isinstance(d, dict):
            return d.get("house")
        return None

    def dignity_of(p: str) -> str:
        d = planet_data.get(p)
        if isinstance(d, dict):
            return d.get("dignity", "neutral")
        return "neutral"

    # ── Career (Sun, Saturn, Mars) ────────────────────────────────────────
    career_planets: list[str] = []
    career_notes:   list[str] = []
    for p in ["Sun", "Saturn", "Mars"]:
        if _is_strong_dignity(dignity_of(p)):
            career_planets.append(p)
            career_notes.append(f"{p} ({dignity_of(p)}) supports professional authority")
    if house_of("Sun") == 10 and "Sun" not in career_planets:
        career_planets.append("Sun")
        career_notes.append("Sun in 10th — inherent authority and public recognition")
    if house_of("Saturn") == 10 and "Saturn" not in career_planets:
        career_planets.append("Saturn")
        career_notes.append("Saturn in 10th — disciplined professional rise through perseverance")
    if career_planets:
        lead = career_planets[0]
        theme_text = (
            "Authoritative leadership and recognition" if lead == "Sun" else
            "Disciplined service and structured career growth" if lead == "Saturn" else
            "Initiative, enterprise, and competitive advantage"
        )
        themes.append({
            "area": "Career",
            "theme": theme_text,
            "planets": career_planets,
            "detail": "; ".join(career_notes) or
                      "Planetary dignities and house placements support professional advancement.",
        })

    # ── Relationships (Venus, Moon) ───────────────────────────────────────
    rel_planets: list[str] = []
    rel_notes:   list[str] = []
    v_dig    = dignity_of("Venus")
    moon_dig = dignity_of("Moon")
    if _is_strong_dignity(v_dig):
        rel_planets.append("Venus")
        rel_notes.append(f"Venus in {v_dig} dignity — deep capacity for love and artistic expression")
    if moon_dig in ("exalted", "own"):
        rel_planets.append("Moon")
        rel_notes.append("Strong Moon brings emotional depth and nurturing bonds")
    if rel_planets:
        themes.append({
            "area": "Relationships",
            "theme": "Harmonious and growth-oriented partnerships",
            "planets": rel_planets,
            "detail": "; ".join(rel_notes),
        })

    # ── Wealth (Jupiter, Venus, 2nd/11th house) ───────────────────────────
    wealth_planets: list[str] = []
    wealth_notes:   list[str] = []
    for p in ["Jupiter", "Venus"]:
        if _is_strong_dignity(dignity_of(p)) and p not in wealth_planets:
            wealth_planets.append(p)
    if house_of("Jupiter") in (2, 11) and "Jupiter" not in wealth_planets:
        wealth_planets.append("Jupiter")
        wealth_notes.append("Jupiter in 2nd or 11th — natural wealth accumulation and financial wisdom")
    if wealth_planets:
        themes.append({
            "area": "Wealth",
            "theme": "Sustained material prosperity and generosity",
            "planets": wealth_planets,
            "detail": "; ".join(wealth_notes) or
                      "Strong Jupiter or Venus in natal chart supports financial well-being.",
        })

    # ── Spirituality (Ketu, Jupiter, 12th/8th houses) ────────────────────
    spirit_planets: list[str] = []
    spirit_notes:   list[str] = []
    k_dig = dignity_of("Ketu")
    if k_dig == "exalted" or house_of("Ketu") in (12, 8):
        spirit_planets.append("Ketu")
        spirit_notes.append("Ketu in spiritual houses draws the native toward self-realization")
    if dignity_of("Jupiter") in ("exalted", "own") and "Jupiter" not in spirit_planets:
        spirit_planets.append("Jupiter")
        spirit_notes.append("Strong Jupiter enhances dharmic wisdom and spiritual teaching")
    if spirit_planets:
        themes.append({
            "area": "Spirituality",
            "theme": "Inner search, meditation, and moksha orientation",
            "planets": spirit_planets,
            "detail": "; ".join(spirit_notes),
        })

    # ── Health (Mars, Saturn, 6th house) ─────────────────────────────────
    health_planets: list[str] = []
    health_notes:   list[str] = []
    if dignity_of("Mars") == "exalted":
        health_planets.append("Mars")
        health_notes.append("Exalted Mars in Capricorn — exceptional physical vitality and stamina")
    if dignity_of("Saturn") in ("exalted", "own"):
        health_planets.append("Saturn")
        health_notes.append("Strong Saturn supports longevity and disciplined wellness routines")
    if house_of("Mars") == 6 and "Mars" not in health_planets:
        health_planets.append("Mars")
        health_notes.append("Mars in 6th — overcomes illness through persistent effort")
    if health_planets:
        themes.append({
            "area": "Health",
            "theme": "Physical resilience and disciplined wellness",
            "planets": health_planets,
            "detail": "; ".join(health_notes),
        })

    # ── Travel / Foreign (Rahu in 9th or 12th) ───────────────────────────
    rahu_h   = house_of("Rahu")
    rahu_dig = dignity_of("Rahu")
    if rahu_h in (9, 12) or rahu_dig == "exalted":
        detail = (
            f"Rahu in {rahu_h}th house activates foreign connections, "
            "distant travel, and cross-cultural experiences."
            if rahu_h else
            "Exalted Rahu signals powerful desire for new territories and foreign contacts."
        )
        themes.append({
            "area": "Travel",
            "theme": "Significant journeys — foreign lands, pilgrimage, and migration",
            "planets": ["Rahu"],
            "detail": detail,
        })

    # ── Pad to minimum 4 themes ───────────────────────────────────────────
    themes = themes[:6]  # cap at 6
    areas_present = {t["area"] for t in themes}

    if len(themes) < 4 and "Family" not in areas_present:
        m_h = house_of("Moon")
        themes.append({
            "area": "Family",
            "theme": "Family bonds and domestic harmony",
            "planets": ["Moon"],
            "detail": (
                f"Moon in house {m_h} shapes the native's relationship with home, "
                "mother, and emotional security."
                if m_h else
                "Moon's position is central to family dynamics and nurturing bonds."
            ),
        })
        areas_present.add("Family")

    if len(themes) < 4 and "Communication" not in areas_present:
        themes.append({
            "area": "Communication",
            "theme": "Intellectual expression and analytical gifts",
            "planets": ["Mercury"],
            "detail": (
                "Mercury's Nadi amsa placement shapes the quality of speech, "
                "writing, and business acumen across the native's life."
            ),
        })

    return themes


# ── Nadi Prediction generator ─────────────────────────────────────────────

def _generate_nadi_predictions(
    planet_data: dict,
    dob: str,
    moon_longitude: float,
) -> list[dict]:
    """
    Generate 3–4 classical Nadi-style predictions based on Vimshottari dasha.

    Args:
        planet_data:    Planet positions with dignity information.
        dob:            Date of birth "YYYY-MM-DD".
        moon_longitude: Moon's sidereal longitude (for dasha calculation).

    Returns:
        List of prediction dicts: {period, prediction, planets}
    """
    birth_date = date.fromisoformat(dob)
    today      = date.today()

    # ── Compute active dasha ──────────────────────────────────────────────
    try:
        dasha_tree = compute_dasha_tree(moon_longitude, birth_date, levels=2)
        active     = current_dasha(dasha_tree, as_of=today)
        md         = active.get("mahadasha") or {}
        ad         = active.get("antardasha") or {}
        md_lord    = md.get("lord", "Sun")
        ad_lord    = ad.get("lord", "Moon")
        ad_end_str = ad.get("end", "")
    except Exception as exc:
        logger.warning("Dasha computation failed in Nadi predictions: %s", exc)
        dasha_tree = []
        md_lord    = "Sun"
        ad_lord    = "Moon"
        ad_end_str = ""

    def dignity_of(p: str) -> str:
        d = planet_data.get(p)
        if isinstance(d, dict):
            return d.get("dignity", "neutral")
        return "neutral"

    md_theme = DASHA_THEMES.get(md_lord, {"theme": "karmic unfolding", "tone": "transformation"})
    ad_theme = DASHA_THEMES.get(ad_lord, {"theme": "inner reflection", "tone": "adjustment"})

    md_dignity   = dignity_of(md_lord)
    md_qualifier = (
        "exceptionally favored"  if md_dignity == "exalted" else
        "well-supported"         if md_dignity in ("own", "friend") else
        "karmically tested"      if md_dignity == "debilitated" else
        "requiring patient effort" if md_dignity == "enemy" else
        "steadily unfolding"
    )
    md_outcome = (
        "transformative and high-achievement results"
        if md_dignity in ("exalted", "own") else
        "gradual but lasting progress through effort"
    )

    predictions: list[dict] = []

    # ── Current period ────────────────────────────────────────────────────
    end_note = f" (sub-period active until {ad_end_str})" if ad_end_str else ""
    predictions.append({
        "period": f"Current period — {md_lord} Mahadasha / {ad_lord} Antardasha{end_note}",
        "prediction": (
            f"The {md_lord}–{ad_lord} period activates the themes of {md_theme['theme']}, "
            f"coloured by {ad_theme['tone']}. "
            f"The Mahadasha lord {md_lord} is {md_qualifier} in the natal chart, "
            f"indicating that efforts related to {md_theme['theme']} will yield {md_outcome}. "
            f"Classical Nadi texts advise focusing on "
            f"{NAISARGIKA_KARAKA.get(md_lord, '').split('/')[0].lower()} matters "
            f"during this period for maximum karmic return."
        ),
        "planets": [md_lord, ad_lord],
    })

    # ── Near future (1–3 years): next Antardasha ─────────────────────────
    next_ad_lord: Optional[str] = None
    try:
        for md_entry in dasha_tree:
            if md_entry.get("lord") == md_lord:
                ads = md_entry.get("antardashas", [])
                found = False
                for ad_entry in ads:
                    if found:
                        next_ad_lord = ad_entry.get("lord")
                        break
                    if ad_entry.get("lord") == ad_lord:
                        found = True
                break
    except Exception:
        pass

    if next_ad_lord:
        nxt_theme = DASHA_THEMES.get(next_ad_lord, {"theme": "new beginnings", "tone": "fresh energy"})
        action_type = (
            "bold decisive action"  if next_ad_lord in ("Mars", "Sun", "Rahu") else
            "reflection and course-correction"
        )
        predictions.append({
            "period": "Near future (1–3 years) — upcoming Antardasha transition",
            "prediction": (
                f"As the {ad_lord} Antardasha concludes, the {next_ad_lord} sub-period "
                f"introduces themes of {nxt_theme['theme']}. "
                "This transition is a pivotal moment to consolidate gains and realign with "
                f"{NAISARGIKA_KARAKA.get(next_ad_lord, '').split('/')[0].lower()} significations. "
                f"The Nadi chart recommends {action_type} at this juncture."
            ),
            "planets": [next_ad_lord],
        })
    else:
        predictions.append({
            "period": "Near future (1–3 years)",
            "prediction": (
                f"The continuing {md_lord} Mahadasha deepens its themes of {md_theme['theme']}. "
                "Nadi tradition holds that this is a period of karmic ripening — seeds planted "
                "earlier now begin to bear fruit. Consistent spiritual practice and professional "
                "focus will yield the most enduring results."
            ),
            "planets": [md_lord],
        })

    # ── Medium-term (3–7 years): next Mahadasha ──────────────────────────
    next_md_lord: Optional[str] = None
    try:
        found_current_md = False
        for md_entry in dasha_tree:
            if found_current_md:
                next_md_lord = md_entry.get("lord")
                break
            if md_entry.get("lord") == md_lord:
                found_current_md = True
    except Exception:
        pass

    if next_md_lord:
        nxt_md_theme = DASHA_THEMES.get(next_md_lord, {"theme": "new cycle", "tone": "fresh beginnings"})
        nxt_dig  = dignity_of(next_md_lord)
        nxt_qual = (
            "powerfully positioned"  if nxt_dig == "exalted" else
            "favorably placed"       if nxt_dig in ("own", "friend") else
            "in a testing placement" if nxt_dig in ("enemy", "debilitated") else
            "neutrally placed"
        )
        promise = (
            "This promises to be a high-achievement period."
            if nxt_dig in ("exalted", "own") else
            "Karmic lessons will be pronounced; humility and dedicated service are the keys."
        )
        predictions.append({
            "period": f"Medium-term (3–7 years) — {next_md_lord} Mahadasha approaching",
            "prediction": (
                f"The approaching {next_md_lord} Mahadasha, with {next_md_lord} {nxt_qual} "
                f"in the Nadi chart, will shift focus toward {nxt_md_theme['theme']}. "
                f"Preparation during the current {md_lord} period — especially in "
                f"{NAISARGIKA_KARAKA.get(next_md_lord, '').split('/')[0].lower()} areas — "
                f"determines the quality of this future cycle. {promise}"
            ),
            "planets": [next_md_lord],
        })
    else:
        predictions.append({
            "period": "Medium-term (3–7 years)",
            "prediction": (
                "The Nadi chart indicates a period of consolidation and inner transformation. "
                "Planetary cycles suggest that sustained effort in the current direction will "
                "bring cumulative rewards. Attention to dharmic conduct and health maintenance "
                "will support the native through this phase."
            ),
            "planets": [md_lord],
        })

    # ── Long-term (7+ years): life trajectory ────────────────────────────
    exalted_planets = [
        p for p in PLANET_ORDER
        if planet_data.get(p, {}).get("dignity") == "exalted"
    ]
    if exalted_planets:
        karaka_summary = ", ".join(
            NAISARGIKA_KARAKA.get(p, "").split("/")[0]
            for p in exalted_planets[:3]
            if NAISARGIKA_KARAKA.get(p)
        )
        long_detail = (
            f"The natal chart holds strong promise through exalted "
            f"{', '.join(exalted_planets)} — supporting long-arc achievements "
            f"in the domains of {karaka_summary}."
        )
    else:
        long_detail = (
            "Consistent dharmic living, devotion, and service to elders and the "
            "divine will progressively unlock the chart's accumulated potential."
        )

    high_planets = ["Jupiter", "Venus", "Sun"]
    is_auspicious = any(
        planet_data.get(p, {}).get("dignity") in ("exalted", "own")
        for p in high_planets
    )
    long_arc = (
        "spiritual evolution and material accomplishment"
        if is_auspicious else
        "karmic refinement, inner development, and selfless service"
    )

    predictions.append({
        "period": "Long-term (7+ years) — life trajectory",
        "prediction": (
            f"In the long arc of destiny revealed by the Nadi chart, the native is on a "
            f"path of {long_arc}. {long_detail} "
            "The Nadi tradition teaches that the soul's journey unfolds precisely according "
            "to accumulated karma — conscious participation in that unfolding is the "
            "highest wisdom available to any being."
        ),
        "planets": exalted_planets[:3] if exalted_planets else [md_lord],
    })

    return predictions


# ══════════════════════════════════════════════════════════════════════════
# Public API
# ══════════════════════════════════════════════════════════════════════════

def compute_nadi(dob: str, tob: str, tz: str, lat: float, lon: float) -> dict:
    """
    Compute a full Nadi Astrology reading.

    Args:
        dob:  Date of birth, "YYYY-MM-DD"
        tob:  Time of birth (local), "HH:MM" or "HH:MM:SS"
        tz:   IANA timezone string, e.g. "Asia/Kolkata"
        lat:  Birth latitude  (positive = North)
        lon:  Birth longitude (positive = East)

    Returns:
        {
            "lagna": {
                sign, degree, nakshatra, pada, nadi_amsa, nadi_amsa_sign
            },
            "planets": [
                {
                    planet, sign, degree, nakshatra, pada,
                    nadi_amsa, nadi_amsa_sign, house, dignity,
                    karaka, nadi_notes
                }, ...   # 9 planets in PLANET_ORDER
            ],
            "nadi_yogas":       [ {name, planets, description, strength}, ... ],
            "life_themes":      [ {area, theme, planets, detail}, ... ],
            "nadi_predictions": [ {period, prediction, planets}, ... ]
        }
    """
    # Set Lahiri ayanamsa (standard for Vedic/Nadi astrology)
    swe.set_sid_mode(swe.SIDM_LAHIRI)

    jd_ut = _to_julian_day(dob, tob, tz)

    # ── 1. Lagna (Ascendant) ─────────────────────────────────────────────
    # We use Placidus houses only to derive the ascendant longitude;
    # Nadi uses whole-sign houses counted from the lagna sign.
    _, ascmc = swe.houses_ex(jd_ut, lat, lon, b"P", swe.FLG_SIDEREAL)
    asc_lon = ascmc[0] % 360.0

    asc_sign_idx    = min(int(asc_lon / 30.0), 11)
    asc_deg_in_sign = asc_lon - asc_sign_idx * 30.0
    asc_sign        = SIGNS[asc_sign_idx]
    asc_nak         = get_nakshatra_info(asc_lon)
    asc_nadi_amsa, asc_amsa_sign = _compute_nadi_amsa(asc_deg_in_sign, asc_sign_idx)

    lagna_result = {
        "sign":           asc_sign,
        "degree":         round(asc_deg_in_sign, 4),
        "nakshatra":      asc_nak["nakshatra"],
        "pada":           asc_nak["pada"],
        "nadi_amsa":      asc_nadi_amsa,
        "nadi_amsa_sign": asc_amsa_sign,
    }

    # ── 2. Planet positions ───────────────────────────────────────────────
    planet_data: dict = {}

    # Seven classical grahas
    for name, pid in PLANET_IDS.items():
        pos, _ = swe.calc_ut(jd_ut, pid, swe.FLG_SIDEREAL | swe.FLG_SPEED)
        p_lon  = pos[0] % 360.0

        sign_info = get_sign_info(p_lon)
        nak_info  = get_nakshatra_info(p_lon)
        house_num = house_from_lagna(sign_info["sign_index"], asc_sign_idx)
        nadi_amsa, amsa_sign = _compute_nadi_amsa(sign_info["degree"], sign_info["sign_index"])
        dignity = _get_dignity(name, sign_info["sign"])

        planet_data[name] = {
            "planet":         name,
            "sign":           sign_info["sign"],
            "degree":         sign_info["degree"],
            "nakshatra":      nak_info["nakshatra"],
            "pada":           nak_info["pada"],
            "nadi_amsa":      nadi_amsa,
            "nadi_amsa_sign": amsa_sign,
            "house":          house_num,
            "dignity":        dignity,
            "karaka":         NAISARGIKA_KARAKA[name],
            "nadi_notes":     NADI_PLANET_NOTES[name],
            "_longitude":     round(p_lon, 4),  # internal; stripped from output
        }

    # Rahu (mean north node) and Ketu (exactly 180° opposite)
    rahu_pos, _ = swe.calc_ut(jd_ut, RAHU_ID, swe.FLG_SIDEREAL | swe.FLG_SPEED)
    rahu_lon    = rahu_pos[0] % 360.0
    ketu_lon    = (rahu_lon + 180.0) % 360.0

    for name, p_lon in [("Rahu", rahu_lon), ("Ketu", ketu_lon)]:
        sign_info = get_sign_info(p_lon)
        nak_info  = get_nakshatra_info(p_lon)
        house_num = house_from_lagna(sign_info["sign_index"], asc_sign_idx)
        nadi_amsa, amsa_sign = _compute_nadi_amsa(sign_info["degree"], sign_info["sign_index"])
        dignity = _get_dignity(name, sign_info["sign"])

        planet_data[name] = {
            "planet":         name,
            "sign":           sign_info["sign"],
            "degree":         sign_info["degree"],
            "nakshatra":      nak_info["nakshatra"],
            "pada":           nak_info["pada"],
            "nadi_amsa":      nadi_amsa,
            "nadi_amsa_sign": amsa_sign,
            "house":          house_num,
            "dignity":        dignity,
            "karaka":         NAISARGIKA_KARAKA[name],
            "nadi_notes":     NADI_PLANET_NOTES[name],
            "_longitude":     round(p_lon, 4),
        }

    # Store lagna sign index as a side-channel for yoga/7th-lord computation
    planet_data["_lagna_sign_idx"] = asc_sign_idx

    # ── 3. Nadi Yogas ────────────────────────────────────────────────────
    nadi_yogas = _check_nadi_yogas(planet_data)

    # ── 4. Life Themes ───────────────────────────────────────────────────
    life_themes = _generate_life_themes(planet_data)

    # ── 5. Nadi Predictions (Vimshottari dasha-based) ────────────────────
    moon_longitude    = planet_data["Moon"]["_longitude"]
    nadi_predictions  = _generate_nadi_predictions(planet_data, dob, moon_longitude)

    # ── 6. Build clean output (strip internal fields) ────────────────────
    output_planets: list[dict] = []
    for p_name in PLANET_ORDER:
        p = {k: v for k, v in planet_data[p_name].items() if not k.startswith("_")}
        output_planets.append(p)

    return {
        "lagna":            lagna_result,
        "planets":          output_planets,
        "nadi_yogas":       nadi_yogas,
        "life_themes":      life_themes,
        "nadi_predictions": nadi_predictions,
    }
