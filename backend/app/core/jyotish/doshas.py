"""
backend/app/core/jyotish/doshas.py

Dosha computation engine.

Implements:
  1. Mangal Dosha  — Mars in houses 1, 2, 4, 7, 8, 12 from Lagna / Moon / Venus
  2. Kaal Sarp Dosha — all 7 planets hemmed between Rahu and Ketu

Uses Swiss Ephemeris (sidereal, Lahiri ayanamsa) for all positions.
"""

from __future__ import annotations

from datetime import date
from typing import Optional
import pytz
from datetime import datetime
import swisseph as swe

# ── Constants ──────────────────────────────────────────────────────────────────

RASHIS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]

MANGAL_HOUSES = {1, 2, 4, 7, 8, 12}

MANGAL_HOUSE_EFFECTS = {
    1: "Mars in the 1st house (Lagna itself) — strong personal energy but aggression seeps into relationships. Spouse may find you dominant or confrontational. Ego clashes in partnership.",
    2: "Mars in the 2nd house — family tensions and financial disputes. Speech can be sharp or hurtful. Conflicts around shared resources and domestic harmony.",
    4: "Mars in the 4th house — turbulence in home environment. Property-related disputes possible. Mother's health may be a concern. Restlessness and emotional fire at home.",
    7: "Mars in the 7th house — the most classical and potent Mangal Dosha position. Direct conflict energy aimed at the spouse. Delays in marriage are possible. Power struggles in partnership.",
    8: "Mars in the 8th house — a deeply sensitive placement. Impacts longevity of marriage, health of spouse, and hidden financial matters. Transformative but volatile relationships.",
    12: "Mars in the 12th house — conflicts around bed pleasures, foreign connections, and private life. Hidden expenditure through relationships. Isolation or distance in marriage.",
}

# Cancellation rules (Dosha Nivaraka) — widely accepted
# Keyed by condition description
CANCELLATION_CHECKS = [
    {
        "id": "own_sign",
        "label": "Mars in Own Sign",
        "desc": "Mars is in Aries or Scorpio — its own signs. The dosha is significantly reduced as Mars is comfortable and less malefic here.",
    },
    {
        "id": "exaltation",
        "label": "Mars in Exaltation",
        "desc": "Mars is in Capricorn — its sign of exaltation. The dosha is neutralised; Mars here becomes constructive rather than destructive.",
    },
    {
        "id": "jupiter_aspect",
        "label": "Jupiter Aspects Mars",
        "desc": "Jupiter aspects Mars (5th, 7th, or 9th aspect). Jupiter's benefic energy mitigates Mars's destructive potential in relationships.",
    },
    {
        "id": "jupiter_conjunct",
        "label": "Jupiter Conjunct Mars",
        "desc": "Jupiter is in the same sign as Mars. The great benefic cools Mars's fire and reduces the dosha substantially.",
    },
    {
        "id": "partner_dosha",
        "label": "Partner Also Has Mangal Dosha",
        "desc": "When both partners carry Mangal Dosha, the doshas cancel each other in marriage compatibility analysis.",
    },
]

# Kaal Sarp types — by Rahu's house from Lagna (1-based)
KAAL_SARP_TYPES = {
    1:  {"name": "Anant",      "serpent": "Anant",       "domain": "Self, personality, beginnings", "effect": "Challenges around self-identity, health, and social recognition. Success comes after overcoming self-created obstacles."},
    2:  {"name": "Kulik",      "serpent": "Kulik",       "domain": "Wealth, family, speech",        "effect": "Financial fluctuations and family tensions. Accumulated wealth may be difficult to hold. Harsh speech can damage relationships."},
    3:  {"name": "Vasuki",     "serpent": "Vasuki",      "domain": "Siblings, courage, travel",     "effect": "Strained relations with siblings. Short journeys bring challenges. Courage is tested repeatedly before victory."},
    4:  {"name": "Shankhpal",  "serpent": "Shankhpal",   "domain": "Home, mother, property",        "effect": "Domestic turbulence and property disputes. Mother's health may be a concern. Emotional security is hard-won but achievable."},
    5:  {"name": "Padma",      "serpent": "Padma",       "domain": "Children, intellect, creativity","effect": "Delays or challenges around children. Creative expression is blocked before finding its channel. Past-life karma around progeny."},
    6:  {"name": "Mahapadma",  "serpent": "Mahapadma",   "domain": "Enemies, debts, service",       "effect": "Hidden enemies and recurring debts. Health issues may surface. However, this placement often gives the drive to overcome adversity powerfully."},
    7:  {"name": "Takshak",    "serpent": "Takshak",     "domain": "Marriage, partnerships",        "effect": "Turbulent relationships and delayed or troubled marriage. Business partnerships may collapse. Karmic lessons around trust and commitment."},
    8:  {"name": "Karkotak",   "serpent": "Karkotak",    "domain": "Longevity, inheritance, occult","effect": "Sudden transformations, financial losses through inheritance or insurance. Interest in occult sciences. Health of self and spouse needs attention."},
    9:  {"name": "Shankhnaad", "serpent": "Shankhnaad",  "domain": "Fortune, father, dharma",       "effect": "Father-related challenges and dharmic confusion. Spiritual path is the remedy. Fortune improves significantly after the age of 36."},
    10: {"name": "Ghatak",     "serpent": "Patak",       "domain": "Career, status, authority",     "effect": "Career obstacles and difficulties with authority figures. Status is achieved late but becomes rock-solid. Government-related challenges are common."},
    11: {"name": "Vishadhar",  "serpent": "Vishadhar",   "domain": "Gains, friends, ambitions",     "effect": "Friends may betray. Elder siblings bring complications. Ambitious goals face systematic obstacles before realisation."},
    12: {"name": "Sheshnag",   "serpent": "Sheshnag",    "domain": "Spirituality, losses, liberation","effect": "Losses in foreign lands or through isolation. Deep spiritual inclinations. This is the most spiritually potent Kaal Sarp type — liberation is the ultimate gift."},
}

PLANET_IDS = {
    "Sun": swe.SUN, "Moon": swe.MOON, "Mercury": swe.MERCURY,
    "Venus": swe.VENUS, "Mars": swe.MARS, "Jupiter": swe.JUPITER,
    "Saturn": swe.SATURN,
}

KAAL_SARP_REMEDIES = [
    "Perform Kaal Sarp Dosh Puja at Trimbakeshwar (Nashik) or Ujjain Mahakaleshwar — the most potent remedy.",
    "Recite Mahamrityunjaya Mantra 108 times daily, especially on Mondays.",
    "Offer milk, water, and Bilva leaves to a Shiva lingam every Monday.",
    "Donate food and clothes to the poor on Naag Panchami.",
    "Worship Nag Devata (serpent deity) — offer milk at a Nag temple.",
    "Keep a silver Nag-Nagin (serpent pair) idol in your puja room.",
    "Perform Sarpa Sukta recitation from the Atharva Veda.",
    "Wear a Gomed (Hessonite Garnet) for Rahu after consulting an astrologer.",
    "Chant 'Om Namah Shivaya' 108 times daily.",
    "Avoid harming snakes — Kaal Sarp is associated with past-life harm to serpents.",
]

MANGAL_REMEDIES = [
    "Recite Mangal Stotra or Mangalashtak every Tuesday.",
    "Fast on Tuesdays and consume satvik (pure vegetarian) food.",
    "Donate red items — red lentils (masoor dal), red cloth, copper — on Tuesdays.",
    "Wear a Red Coral (Moonga) in gold or copper on the ring finger of the right hand after consulting an astrologer.",
    "Worship Lord Hanuman — recite Hanuman Chalisa daily.",
    "Perform Mangal Shanti puja before marriage.",
    "If possible, marry a person who also has Mangal Dosha — the doshas cancel each other.",
    "Chant 'Om Kram Kreem Kraum Sah Bhaumaya Namah' 108 times on Tuesdays.",
    "Avoid getting married on a Tuesday.",
    "Plant red flowers (roses, hibiscus) and donate them to temples on Tuesdays.",
]


# ── Helpers ────────────────────────────────────────────────────────────────────

def _to_julian_day(dob: str, tob: str, timezone_str: str) -> float:
    """Convert birth date/time/tz to Julian Day (UTC)."""
    tz_obj = pytz.timezone(timezone_str)
    parts = tob.split(":")
    hour   = int(parts[0])
    minute = int(parts[1])
    second = int(parts[2]) if len(parts) > 2 else 0
    d = date.fromisoformat(dob)
    local_dt = datetime(d.year, d.month, d.day, hour, minute, second)
    local_dt = tz_obj.localize(local_dt)
    utc_dt   = local_dt.astimezone(pytz.utc)
    return swe.julday(utc_dt.year, utc_dt.month, utc_dt.day,
                      utc_dt.hour + utc_dt.minute / 60.0 + utc_dt.second / 3600.0)


def _compute_positions(jd: float, lat: float, lon: float) -> dict:
    """
    Compute sidereal (Lahiri) positions for all planets + Rahu/Ketu + Ascendant.
    Returns dict: name → {sign_index, longitude, degree_in_sign}
    """
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    swe.set_topo(lon, lat, 0)

    positions = {}
    for name, pid in PLANET_IDS.items():
        result, _ = swe.calc_ut(jd, pid, swe.FLG_SIDEREAL)
        lon_val = result[0] % 360.0
        positions[name] = {
            "longitude":      round(lon_val, 4),
            "sign_index":     int(lon_val / 30),
            "degree_in_sign": round(lon_val % 30, 4),
            "sign":           RASHIS[int(lon_val / 30)],
        }

    # Rahu (mean node)
    r_result, _ = swe.calc_ut(jd, swe.MEAN_NODE, swe.FLG_SIDEREAL)
    rahu_lon = r_result[0] % 360.0
    ketu_lon  = (rahu_lon + 180.0) % 360.0
    positions["Rahu"] = {"longitude": round(rahu_lon, 4), "sign_index": int(rahu_lon / 30), "sign": RASHIS[int(rahu_lon / 30)], "degree_in_sign": round(rahu_lon % 30, 4)}
    positions["Ketu"] = {"longitude": round(ketu_lon, 4), "sign_index": int(ketu_lon / 30), "sign": RASHIS[int(ketu_lon / 30)], "degree_in_sign": round(ketu_lon % 30, 4)}

    # Ascendant (Lagna)
    cusps, ascmc = swe.houses_ex(jd, lat, lon, b'P', swe.FLG_SIDEREAL)
    asc_lon = ascmc[0] % 360.0
    # Subtract ayanamsa manually since houses_ex with FLG_SIDEREAL handles it
    positions["Ascendant"] = {
        "longitude":      round(asc_lon, 4),
        "sign_index":     int(asc_lon / 30),
        "degree_in_sign": round(asc_lon % 30, 4),
        "sign":           RASHIS[int(asc_lon / 30)],
    }

    return positions


def _house_from(planet_sign: int, ref_sign: int) -> int:
    """1-based house of planet relative to reference sign."""
    return ((planet_sign - ref_sign) % 12) + 1


# ── Mangal Dosha ───────────────────────────────────────────────────────────────

def compute_mangal_dosha(positions: dict) -> dict:
    mars_sign  = positions["Mars"]["sign_index"]
    lagna_sign = positions["Ascendant"]["sign_index"]
    moon_sign  = positions["Moon"]["sign_index"]
    venus_sign = positions["Venus"]["sign_index"]
    jup_sign   = positions["Jupiter"]["sign_index"]

    from_lagna = _house_from(mars_sign, lagna_sign)
    from_moon  = _house_from(mars_sign, moon_sign)
    from_venus = _house_from(mars_sign, venus_sign)

    dosha_from_lagna = from_lagna in MANGAL_HOUSES
    dosha_from_moon  = from_moon  in MANGAL_HOUSES
    dosha_from_venus = from_venus in MANGAL_HOUSES

    present_count = sum([dosha_from_lagna, dosha_from_moon, dosha_from_venus])
    is_present = present_count > 0

    # Severity
    if not is_present:
        severity = "none"
    elif from_lagna in {7, 8} or from_moon in {7, 8} or from_venus in {7, 8}:
        severity = "high"
    elif present_count >= 2:
        severity = "medium"
    else:
        severity = "low"

    # Cancellations
    mars_own     = mars_sign in {0, 7}           # Aries, Scorpio
    mars_exalted = mars_sign == 9                 # Capricorn
    jup_conjunct = jup_sign == mars_sign
    # Jupiter aspects Mars via 5th, 7th, 9th (diff in sign index 0-based)
    jup_mars_diff = (mars_sign - jup_sign) % 12
    jup_aspects   = jup_mars_diff in {4, 6, 8}   # 5th=4, 7th=6, 9th=8 (0-indexed)

    cancellations = []
    if mars_own:
        c = next(x for x in CANCELLATION_CHECKS if x["id"] == "own_sign")
        cancellations.append(c)
    if mars_exalted:
        c = next(x for x in CANCELLATION_CHECKS if x["id"] == "exaltation")
        cancellations.append(c)
    if jup_conjunct:
        c = next(x for x in CANCELLATION_CHECKS if x["id"] == "jupiter_conjunct")
        cancellations.append(c)
    elif jup_aspects:
        c = next(x for x in CANCELLATION_CHECKS if x["id"] == "jupiter_aspect")
        cancellations.append(c)

    # Effective severity after cancellations
    effective_severity = severity
    if severity in {"low", "medium"} and len(cancellations) >= 1:
        effective_severity = "cancelled"
    elif severity == "high" and len(cancellations) >= 2:
        effective_severity = "reduced"
    elif severity == "high" and len(cancellations) == 1:
        effective_severity = "medium"

    # House position from Lagna (primary reference)
    primary_house = from_lagna if dosha_from_lagna else (from_moon if dosha_from_moon else from_venus)
    house_effect  = MANGAL_HOUSE_EFFECTS.get(primary_house, "")

    return {
        "present":            is_present,
        "severity":           effective_severity,
        "raw_severity":       severity,
        "cancellations":      cancellations,
        "dosha_count":        present_count,
        "from_lagna":         {"house": from_lagna, "has_dosha": dosha_from_lagna},
        "from_moon":          {"house": from_moon,  "has_dosha": dosha_from_moon},
        "from_venus":         {"house": from_venus, "has_dosha": dosha_from_venus},
        "mars_position":      {"sign": positions["Mars"]["sign"], "degree": positions["Mars"]["degree_in_sign"]},
        "lagna_position":     {"sign": positions["Ascendant"]["sign"], "degree": positions["Ascendant"]["degree_in_sign"]},
        "house_effect":       house_effect,
        "partner_note":       CANCELLATION_CHECKS[-1],   # partner dosha cancellation info
        "remedies":           MANGAL_REMEDIES,
    }


# ── Kaal Sarp Dosha ────────────────────────────────────────────────────────────

def compute_kaal_sarp(positions: dict) -> dict:
    rahu_lon  = positions["Rahu"]["longitude"]
    lagna_sign = positions["Ascendant"]["sign_index"]
    rahu_sign  = positions["Rahu"]["sign_index"]

    main_planets = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"]

    # Check which arc each planet falls in relative to Rahu
    rahu_side = []   # between Rahu and Ketu (Kaal Sarp side)
    ketu_side = []   # between Ketu and Rahu (Kaal Amrit side)

    for p in main_planets:
        p_lon = positions[p]["longitude"]
        diff  = (p_lon - rahu_lon) % 360.0
        if diff < 180.0:
            rahu_side.append(p)
        else:
            ketu_side.append(p)

    # Determine status
    if len(rahu_side) == 7:
        status = "full"
        direction = "kaal_sarp"
        status_label = "Full Kaal Sarp Dosha"
    elif len(ketu_side) == 7:
        status = "full"
        direction = "kaal_amrit"
        status_label = "Kaal Amrit Yoga (Auspicious)"
    elif len(rahu_side) >= 5:
        status = "partial"
        direction = "kaal_sarp"
        status_label = f"Partial Kaal Sarp ({len(rahu_side)}/7 planets hemmed)"
    elif len(ketu_side) >= 5:
        status = "partial"
        direction = "kaal_amrit"
        status_label = f"Partial Kaal Amrit ({len(ketu_side)}/7 planets)"
    else:
        status = "none"
        direction = "none"
        status_label = "No Kaal Sarp Dosha"

    # Determine type by Rahu's house from Lagna
    rahu_house = _house_from(rahu_sign, lagna_sign)
    ks_type    = KAAL_SARP_TYPES.get(rahu_house, KAAL_SARP_TYPES[1])

    # Kaal Amrit description
    kaal_amrit_desc = (
        "Kaal Amrit Yoga is formed when all planets are between Ketu and Rahu — the reverse of Kaal Sarp. "
        "This is generally considered auspicious rather than malefic. It may bring unusual spiritual gifts, "
        "intuitive abilities, and the capacity to turn adversity into strength."
    )

    is_present = status != "none" and direction == "kaal_sarp"

    return {
        "present":           is_present,
        "status":            status,
        "direction":         direction,
        "status_label":      status_label,
        "planets_hemmed":    rahu_side if direction == "kaal_sarp" else ketu_side,
        "planets_outside":   ketu_side if direction == "kaal_sarp" else rahu_side,
        "rahu_house":        rahu_house,
        "type":              ks_type if is_present or (status == "full" and direction == "kaal_amrit") else None,
        "kaal_amrit_desc":   kaal_amrit_desc if direction == "kaal_amrit" else None,
        "rahu_position":     {"sign": positions["Rahu"]["sign"], "degree": positions["Rahu"]["degree_in_sign"]},
        "ketu_position":     {"sign": positions["Ketu"]["sign"], "degree": positions["Ketu"]["degree_in_sign"]},
        "remedies":          KAAL_SARP_REMEDIES if is_present else [],
    }


# ── Public entry point ─────────────────────────────────────────────────────────

def compute_doshas(dob: str, tob: str, lat: float, lon: float, timezone_str: str) -> dict:
    """
    Compute both Mangal Dosha and Kaal Sarp Dosha from birth data.

    Args:
        dob:          Date of birth YYYY-MM-DD
        tob:          Time of birth HH:MM or HH:MM:SS
        lat:          Latitude (decimal degrees, N positive)
        lon:          Longitude (decimal degrees, E positive)
        timezone_str: Timezone string e.g. 'Asia/Kolkata'

    Returns:
        {mangal, kaal_sarp, planet_positions}
    """
    jd        = _to_julian_day(dob, tob, timezone_str)
    positions = _compute_positions(jd, lat, lon)

    mangal    = compute_mangal_dosha(positions)
    kaal_sarp = compute_kaal_sarp(positions)

    # Summary snapshot for the frontend
    snapshot = {p: {"sign": positions[p]["sign"], "degree": round(positions[p]["degree_in_sign"], 2)}
                for p in ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Rahu", "Ketu", "Ascendant"]}

    return {
        "mangal":    mangal,
        "kaal_sarp": kaal_sarp,
        "positions": snapshot,
        "lagna":     positions["Ascendant"]["sign"],
    }
