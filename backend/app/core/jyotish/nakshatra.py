"""
backend/app/core/jyotish/nakshatra.py

27 Nakshatras — lookup by sidereal longitude.
Returns nakshatra name, lord, pada, and position metadata.
"""

from __future__ import annotations

# ── 27 Nakshatras in order ────────────────────────────────────────────────
# Each entry: (name, dasha_lord)
# The 9 dasha lords cycle 3 times: Ketu Venus Sun Moon Mars Rahu Jupiter Saturn Mercury
NAKSHATRAS: list[tuple[str, str]] = [
    ("Ashwini",           "Ketu"),
    ("Bharani",           "Venus"),
    ("Krittika",          "Sun"),
    ("Rohini",            "Moon"),
    ("Mrigashira",        "Mars"),
    ("Ardra",             "Rahu"),
    ("Punarvasu",         "Jupiter"),
    ("Pushya",            "Saturn"),
    ("Ashlesha",          "Mercury"),
    ("Magha",             "Ketu"),
    ("Purva Phalguni",    "Venus"),
    ("Uttara Phalguni",   "Sun"),
    ("Hasta",             "Moon"),
    ("Chitra",            "Mars"),
    ("Swati",             "Rahu"),
    ("Vishakha",          "Jupiter"),
    ("Anuradha",          "Saturn"),
    ("Jyeshtha",          "Mercury"),
    ("Mula",              "Ketu"),
    ("Purva Ashadha",     "Venus"),
    ("Uttara Ashadha",    "Sun"),
    ("Shravana",          "Moon"),
    ("Dhanishta",         "Mars"),
    ("Shatabhisha",       "Rahu"),
    ("Purva Bhadrapada",  "Jupiter"),
    ("Uttara Bhadrapada", "Saturn"),
    ("Revati",            "Mercury"),
]

# Each nakshatra spans exactly 13°20' = 13.3333...°
NAKSHATRA_SPAN: float = 360.0 / 27        # 13.33333...°
PADA_SPAN:      float = NAKSHATRA_SPAN / 4  # 3.33333...°  (4 padas per nakshatra)

# ── Rasi (sign) names ─────────────────────────────────────────────────────
SIGNS: list[str] = [
    "Aries", "Taurus", "Gemini", "Cancer",
    "Leo", "Virgo", "Libra", "Scorpio",
    "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]

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


def get_nakshatra_info(longitude: float) -> dict:
    """
    Given a sidereal longitude (0–360°), return full nakshatra metadata.

    Args:
        longitude: Planet's sidereal longitude in degrees (0–360).

    Returns:
        {
            "nakshatra": str,        # e.g. "Purva Ashadha"
            "lord":      str,        # e.g. "Venus"
            "pada":      int,        # 1–4
            "index":     int,        # 0–26 nakshatra index
            "position_in_nak_deg": float,   # degrees into the nakshatra
            "fraction_elapsed":    float,   # 0.0–1.0 how far through nakshatra
        }
    """
    lon = longitude % 360.0
    nak_idx = int(lon / NAKSHATRA_SPAN)
    nak_idx = min(nak_idx, 26)  # guard against floating-point edge case at 360°

    position_in_nak = lon - (nak_idx * NAKSHATRA_SPAN)
    pada = min(4, int(position_in_nak / PADA_SPAN) + 1)

    name, lord = NAKSHATRAS[nak_idx]
    fraction_elapsed = position_in_nak / NAKSHATRA_SPAN

    return {
        "nakshatra":           name,
        "lord":                lord,
        "pada":                pada,
        "index":               nak_idx,
        "position_in_nak_deg": round(position_in_nak, 4),
        "fraction_elapsed":    round(fraction_elapsed, 6),
    }


def get_sign_info(longitude: float) -> dict:
    """
    Given a sidereal longitude, return rasi (sign) name, lord, and degree within sign.

    Args:
        longitude: Sidereal longitude in degrees (0–360).

    Returns:
        {
            "sign":       str,   # e.g. "Sagittarius"
            "lord":       str,   # e.g. "Jupiter"
            "degree":     float, # degrees within sign (0–30)
            "sign_index": int,   # 0 = Aries … 11 = Pisces
        }
    """
    lon = longitude % 360.0
    sign_idx = int(lon / 30.0)
    sign_idx = min(sign_idx, 11)
    degree_in_sign = lon - sign_idx * 30.0
    sign = SIGNS[sign_idx]

    return {
        "sign":       sign,
        "lord":       SIGN_LORDS[sign],
        "degree":     round(degree_in_sign, 4),
        "sign_index": sign_idx,
    }


def house_from_lagna(planet_sign_idx: int, lagna_sign_idx: int) -> int:
    """Return Bhava (house number, 1–12) of a planet relative to Lagna sign."""
    return ((planet_sign_idx - lagna_sign_idx) % 12) + 1
