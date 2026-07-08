"""
backend/app/core/jyotish/horoscope.py

Daily horoscope engine — transit-based Rashi readings.
Uses live Swiss Ephemeris planet positions to generate
personalised daily guidance for each of the 12 Rashis.

No birth chart needed — just the Rashi (Moon sign / Sun sign).
"""

from __future__ import annotations

import math
from datetime import datetime, date, timezone as tz
from typing import Optional
import swisseph as swe

# ── Constants ─────────────────────────────────────────────────────────────────

RASHIS = [
    {"en": "Aries",       "hi": "मेष",      "symbol": "♈", "lord": "Mars",    "lord_hi": "मंगल",   "element": "Fire",  "quality": "Cardinal"},
    {"en": "Taurus",      "hi": "वृषभ",     "symbol": "♉", "lord": "Venus",   "lord_hi": "शुक्र",   "element": "Earth", "quality": "Fixed"},
    {"en": "Gemini",      "hi": "मिथुन",    "symbol": "♊", "lord": "Mercury", "lord_hi": "बुध",     "element": "Air",   "quality": "Mutable"},
    {"en": "Cancer",      "hi": "कर्क",     "symbol": "♋", "lord": "Moon",    "lord_hi": "चंद्र",  "element": "Water", "quality": "Cardinal"},
    {"en": "Leo",         "hi": "सिंह",     "symbol": "♌", "lord": "Sun",     "lord_hi": "सूर्य",   "element": "Fire",  "quality": "Fixed"},
    {"en": "Virgo",       "hi": "कन्या",    "symbol": "♍", "lord": "Mercury", "lord_hi": "बुध",     "element": "Earth", "quality": "Mutable"},
    {"en": "Libra",       "hi": "तुला",     "symbol": "♎", "lord": "Venus",   "lord_hi": "शुक्र",   "element": "Air",   "quality": "Cardinal"},
    {"en": "Scorpio",     "hi": "वृश्चिक",  "symbol": "♏", "lord": "Mars",    "lord_hi": "मंगल",   "element": "Water", "quality": "Fixed"},
    {"en": "Sagittarius", "hi": "धनु",      "symbol": "♐", "lord": "Jupiter", "lord_hi": "गुरु",   "element": "Fire",  "quality": "Mutable"},
    {"en": "Capricorn",   "hi": "मकर",      "symbol": "♑", "lord": "Saturn",  "lord_hi": "शनि",    "element": "Earth", "quality": "Cardinal"},
    {"en": "Aquarius",    "hi": "कुम्भ",    "symbol": "♒", "lord": "Saturn",  "lord_hi": "शनि",    "element": "Air",   "quality": "Fixed"},
    {"en": "Pisces",      "hi": "मीन",      "symbol": "♓", "lord": "Jupiter", "lord_hi": "गुरु",   "element": "Water", "quality": "Mutable"},
]

PLANET_IDS = {
    "Sun":     swe.SUN,
    "Moon":    swe.MOON,
    "Mercury": swe.MERCURY,
    "Venus":   swe.VENUS,
    "Mars":    swe.MARS,
    "Jupiter": swe.JUPITER,
    "Saturn":  swe.SATURN,
}

PLANET_COLORS = {
    "Sun":     "Orange",
    "Moon":    "White",
    "Mars":    "Red",
    "Mercury": "Green",
    "Jupiter": "Yellow",
    "Venus":   "Pink",
    "Saturn":  "Blue",
}

LUCKY_NUMBERS = {
    "Sun": 1, "Moon": 2, "Mars": 9, "Mercury": 5,
    "Jupiter": 3, "Venus": 6, "Saturn": 8,
}

# Weekday rulers (Monday=0 in Python weekday())
WEEKDAY_RULER = {
    0: "Moon",    # Monday
    1: "Mars",    # Tuesday
    2: "Mercury", # Wednesday
    3: "Jupiter", # Thursday
    4: "Venus",   # Friday
    5: "Saturn",  # Saturday
    6: "Sun",     # Sunday
}

# Jupiter transit quality from rashi: houses that are favorable, neutral, unfavorable
JUPITER_GOOD_HOUSES  = {2, 5, 7, 9, 11}
JUPITER_BAD_HOUSES   = {3, 6, 8, 12}
# Saturn: 3, 6, 11 good for Saturn; 1, 2, 12 = Sade Sati; 4 = Ardha Sati
SATURN_GOOD_HOUSES   = {3, 6, 11}
SATURN_SADE_HOUSES   = {1, 2, 12}
SATURN_ARDHA_HOUSE   = {4}

# Mood descriptors indexed by quality score
MOOD_MAP = ["Contemplative", "Steady", "Optimistic", "Energetic", "Inspired"]

# Reading templates — keyed by overall quality tier (0–4)
_CAREER_TEMPLATES = [
    "Professional matters require patience today. Avoid major commitments and focus on clearing pending work instead.",
    "A steady day at work. Your methodical approach earns quiet appreciation from those above you.",
    "Good energy for professional matters. A conversation you initiate today can open a door that has been closed.",
    "Your clarity of thought gives you an edge today. Decision-makers are receptive — present your ideas with confidence.",
    "An outstanding day for career matters. Your efforts are visible to the right people. A significant opportunity could crystallise.",
]
_LOVE_TEMPLATES = [
    "Relationships need careful handling today. Avoid assumptions — ask rather than presume what the other person needs.",
    "A quiet, companionable day with your partner. Small acts of consideration mean more than grand gestures right now.",
    "Warmth flows in your close relationships today. A heartfelt conversation brings you closer to someone important.",
    "Romantic energy is strong. Express what you feel — your honesty will be received with open arms today.",
    "Deeply favourable day for love and connection. If single, a meaningful encounter is possible. If partnered, this is a day to cherish.",
]
_MONEY_TEMPLATES = [
    "Be conservative with expenditure today. A hasty financial decision could prove costly. Wait before acting.",
    "Finances are stable. Nothing dramatic, but your careful management is building a solid foundation.",
    "A moderately good day for money matters. A pending payment may arrive or an expense resolve favourably.",
    "Financial energy is positive. A smart move made today — investment, negotiation, or a cost-saving decision — will compound well.",
    "Excellent day for financial matters. An unexpected gain is possible. Confirm pending deals and review your portfolio.",
]
_GENERAL_TEMPLATES = [
    "The cosmic weather calls for inner work today. Meditate, reflect, and trust that stillness leads to clarity.",
    "Routine and discipline serve you well. Stay grounded and let the day unfold without forcing outcomes.",
    "A balanced, productive day. Keep your intentions clear and your actions measured — results will follow.",
    "The planets align in your favour. Channel this energy into your most important goals. Momentum is yours to use.",
    "A luminous day — the stars offer their full support. Begin something new, make the call you have been postponing, or seize the opportunity in front of you.",
]

_OPENING_BY_MOON_HOUSE = {
    1: "The Moon in your own sign sharpens your emotional intelligence today — you read the room with unusual accuracy.",
    2: "The Moon activates your second house of wealth and family. Home matters and money conversations deserve your attention.",
    3: "A restless lunar energy fills your third house. Your communication is sharp, your courage is high — use it.",
    4: "The Moon illuminates your fourth house today. Home, mother, and inner peace are the themes asking for your presence.",
    5: "Creative fire burns in your fifth house under today's Moon. Your instincts around children, romance, and artistry are spot on.",
    6: "The Moon moves through your sixth house. Your body is asking for rest and good nutrition — honour that signal.",
    7: "Your seventh house of partnerships is lit by the Moon today. A one-on-one conversation holds the day's most important moment.",
    8: "The Moon in your eighth house brings depth to the surface. Unexpected information or a hidden matter comes to light.",
    9: "A spiritually charged day — the Moon in your ninth house opens your mind to higher wisdom and long-horizon thinking.",
    10: "The Moon in your tenth house puts you in the spotlight professionally. Your reputation and public presence matter today.",
    11: "Your eleventh house of gains receives the Moon today. Social connections deliver something of real value.",
    12: "The Moon moves through your twelfth house of solitude. Step back from the crowd and let quiet recharge you.",
}


def _get_julian_day_today() -> float:
    """Julian Day for today at noon UTC."""
    now = datetime.now(tz.utc)
    jd = swe.julday(now.year, now.month, now.day, 12.0)
    return jd


def get_current_transits() -> dict:
    """
    Compute all planet positions for today (noon UTC, sidereal Lahiri).
    Returns dict: planet_name → {sign_index, sign, longitude, retrograde}
    """
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    jd = _get_julian_day_today()
    ayanamsa = swe.get_ayanamsa(jd)

    transits = {}
    for planet, pid in PLANET_IDS.items():
        flags = swe.FLG_SIDEREAL | swe.FLG_SPEED
        result, _ = swe.calc_ut(jd, pid, flags)
        lon = result[0] % 360.0
        speed = result[3]
        sign_idx = int(lon / 30)
        deg_in_sign = lon - sign_idx * 30

        transits[planet] = {
            "sign_index": sign_idx,
            "sign":       RASHIS[sign_idx]["en"],
            "longitude":  round(lon, 4),
            "degree":     round(deg_in_sign, 4),
            "retrograde": speed < 0,
        }

    # Rahu (mean node) — sidereal
    rahu_result, _ = swe.calc_ut(jd, swe.MEAN_NODE, swe.FLG_SIDEREAL | swe.FLG_SPEED)
    rahu_lon = rahu_result[0] % 360.0
    rahu_sign = int(rahu_lon / 30)
    ketu_lon = (rahu_lon + 180) % 360
    ketu_sign = int(ketu_lon / 30)
    transits["Rahu"] = {"sign_index": rahu_sign, "sign": RASHIS[rahu_sign]["en"], "longitude": round(rahu_lon, 4)}
    transits["Ketu"] = {"sign_index": ketu_sign, "sign": RASHIS[ketu_sign]["en"], "longitude": round(ketu_lon, 4)}

    return transits


def _house_from(planet_sign_idx: int, rashi_idx: int) -> int:
    """House number (1–12) that a planet falls in relative to a given Rashi."""
    return ((planet_sign_idx - rashi_idx) % 12) + 1


def _score_transits(rashi_idx: int, transits: dict) -> dict:
    """Score each domain (career, love, money, overall) 0–4 for a given Rashi."""
    jup_house  = _house_from(transits["Jupiter"]["sign_index"], rashi_idx)
    sat_house  = _house_from(transits["Saturn"]["sign_index"],  rashi_idx)
    ven_house  = _house_from(transits["Venus"]["sign_index"],   rashi_idx)
    mar_house  = _house_from(transits["Mars"]["sign_index"],    rashi_idx)
    mer_house  = _house_from(transits["Mercury"]["sign_index"], rashi_idx)
    sun_house  = _house_from(transits["Sun"]["sign_index"],     rashi_idx)
    moon_house = _house_from(transits["Moon"]["sign_index"],    rashi_idx)

    # Jupiter base score
    jup_score = 2 if jup_house in JUPITER_GOOD_HOUSES else (-1 if jup_house in JUPITER_BAD_HOUSES else 1)

    # Saturn modifier
    sat_score = 1 if sat_house in SATURN_GOOD_HOUSES else (-2 if sat_house in SATURN_SADE_HOUSES else (-1 if sat_house in SATURN_ARDHA_HOUSE else 0))

    # Venus for love
    ven_love = 1 if ven_house in {2, 4, 5, 7, 9, 11} else (-1 if ven_house in {6, 8, 12} else 0)

    # Mars energy for career
    mar_career = 1 if mar_house in {3, 6, 11} else (-1 if mar_house in {1, 8, 12} else 0)

    # Mercury for money/intellect
    mer_money = 1 if mer_house in {2, 5, 9, 11} else (-1 if mer_house in {6, 8, 12} else 0)

    # Moon for mood/overall
    moon_mood = 1 if moon_house in {1, 4, 5, 7, 9, 11} else (-1 if moon_house in {6, 8, 12} else 0)

    # Composite scores → normalised to 0–4
    def clamp(v): return max(0, min(4, v))

    career_raw = 2 + jup_score + sat_score + mar_career + (1 if sun_house in {1, 10, 11} else 0)
    love_raw   = 2 + ven_love + moon_mood + (1 if jup_house in {5, 7, 11} else 0)
    money_raw  = 2 + jup_score + mer_money + sat_score + (1 if ven_house in {2, 11} else 0)
    overall    = 2 + jup_score + sat_score + moon_mood

    return {
        "career":     clamp(career_raw),
        "love":       clamp(love_raw),
        "money":      clamp(money_raw),
        "overall":    clamp(overall),
        "moon_house": moon_house,
        "jup_house":  jup_house,
        "sat_house":  sat_house,
    }


def get_daily_horoscope(rashi_index: int, transits: Optional[dict] = None) -> dict:
    """
    Generate today's horoscope for a given Rashi (0=Aries … 11=Pisces).

    Args:
        rashi_index: 0-based index of the Rashi
        transits:    Pre-computed transits dict (if None, will be computed)

    Returns:
        Full horoscope dict for this Rashi.
    """
    if transits is None:
        transits = get_current_transits()

    rashi = RASHIS[rashi_index]
    scores = _score_transits(rashi_index, transits)

    today = date.today()
    weekday_ruler = WEEKDAY_RULER[today.weekday()]
    rashi_lord = rashi["lord"]

    # Lucky elements
    lucky_number = ((LUCKY_NUMBERS.get(weekday_ruler, 1) + LUCKY_NUMBERS.get(rashi_lord, 1) + rashi_index + 1) % 9) or 9
    lucky_color = PLANET_COLORS.get(weekday_ruler, "Gold")
    lucky_day = today.strftime("%A")

    # Reading text
    opening = _OPENING_BY_MOON_HOUSE.get(scores["moon_house"], "The Moon casts a reflective light on your day — tune in to your instincts.")
    career_text  = _CAREER_TEMPLATES[scores["career"]]
    love_text    = _LOVE_TEMPLATES[scores["love"]]
    money_text   = _MONEY_TEMPLATES[scores["money"]]
    general_text = _GENERAL_TEMPLATES[scores["overall"]]

    # Retrograde note
    retro_notes = []
    for p in ["Mercury", "Venus", "Mars", "Jupiter", "Saturn"]:
        if transits.get(p, {}).get("retrograde"):
            retro_notes.append(f"{p} is retrograde — double-check decisions in its domain.")

    # Sade Sati alert in reading
    sade_alert = ""
    if scores["sat_house"] in SATURN_SADE_HOUSES:
        sade_alert = "Saturn currently transits a sensitive zone relative to your Rashi. Patience, discipline, and karmic awareness are your best tools through this period. Consider running your Sade Sati report."
    elif scores["sat_house"] in SATURN_ARDHA_HOUSE:
        sade_alert = "Saturn sits in the fourth from your Rashi — domestic matters and inner peace may need your attention."

    # Star rating (1–5 from score 0–4)
    def to_stars(s): return min(5, max(1, s + 1))

    return {
        "date":          today.isoformat(),
        "rashi_index":   rashi_index,
        "rashi":         rashi["en"],
        "rashi_hi":      rashi["hi"],
        "symbol":        rashi["symbol"],
        "lord":          rashi_lord,
        "element":       rashi["element"],
        "reading": {
            "opening":   opening,
            "career":    career_text,
            "love":      love_text,
            "money":     money_text,
            "general":   general_text,
            "sade_note": sade_alert,
            "retro":     retro_notes,
        },
        "ratings": {
            "love":   to_stars(scores["love"]),
            "career": to_stars(scores["career"]),
            "money":  to_stars(scores["money"]),
            "overall": to_stars(scores["overall"]),
        },
        "mood":          MOOD_MAP[scores["overall"]],
        "lucky_number":  lucky_number,
        "lucky_color":   lucky_color,
        "lucky_day":     lucky_day,
        "transits_snapshot": {
            "Jupiter": transits["Jupiter"]["sign"],
            "Saturn":  transits["Saturn"]["sign"],
            "Moon":    transits["Moon"]["sign"],
            "Venus":   transits["Venus"]["sign"],
            "Mars":    transits["Mars"]["sign"],
        },
    }


def get_all_horoscopes() -> list[dict]:
    """Return today's horoscope for all 12 Rashis (one transit computation)."""
    transits = get_current_transits()
    return [get_daily_horoscope(i, transits) for i in range(12)]
