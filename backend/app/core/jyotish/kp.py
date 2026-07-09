"""
backend/app/core/jyotish/kp.py

KP (Krishnamurti Paddhati) computation engine for BhagyaAI.

KP divides each nakshatra (13°20') into 9 sub-portions proportional
to Vimshottari dasha years. The sub-lord sequence within a nakshatra
starts at the nakshatra lord and cycles through the standard dasha order.

Public function:
    compute_kp(dob, tob, tz, lat, lon) -> dict

Returns:
    lagna, planets (9), cusps (12), significators, ruling_planets
"""

from __future__ import annotations

import logging
from datetime import date, datetime

import pytz
import swisseph as swe

logger = logging.getLogger(__name__)

# ── Vimshottari Dasha constants ───────────────────────────────────────────
# Standard sequence and years for sub-lord division
DASHA_SEQUENCE: list[str] = [
    "Ketu", "Venus", "Sun", "Moon", "Mars",
    "Rahu", "Jupiter", "Saturn", "Mercury",
]
DASHA_YEARS: dict[str, int] = {
    "Ketu": 7, "Venus": 20, "Sun": 6, "Moon": 10, "Mars": 7,
    "Rahu": 18, "Jupiter": 16, "Saturn": 19, "Mercury": 17,
}
TOTAL_DASHA_YEARS: int = 120

# ── Nakshatra constants ───────────────────────────────────────────────────
# Each nakshatra spans exactly 13°20' = 360/27 degrees
NAKSHATRA_SPAN: float = 360.0 / 27  # ≈ 13.3333°

# 27 nakshatras with their star lords (dasha lords), in ecliptic order
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

# ── Zodiac signs ──────────────────────────────────────────────────────────
SIGNS: list[str] = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
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
RAHU_ID: int = swe.MEAN_NODE  # Rahu = mean north node; Ketu = exactly opposite

# KP planet output order
KP_PLANET_ORDER: list[str] = [
    "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"
]

# ── Day lords ─────────────────────────────────────────────────────────────
# Python datetime.weekday(): 0=Monday … 6=Sunday
DAY_LORDS: dict[int, str] = {
    0: "Moon",     # Monday
    1: "Mars",     # Tuesday
    2: "Mercury",  # Wednesday
    3: "Jupiter",  # Thursday
    4: "Venus",    # Friday
    5: "Saturn",   # Saturday
    6: "Sun",      # Sunday
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


def _get_sign_and_degree(lon: float) -> tuple[str, float]:
    """Return (sign_name, degree_within_sign) for a sidereal longitude."""
    lon     = lon % 360.0
    idx     = min(int(lon / 30.0), 11)
    sign    = SIGNS[idx]
    degree  = round(lon - idx * 30.0, 4)
    return sign, degree


def _get_kp_info(longitude: float) -> dict:
    """
    Compute nakshatra, star lord (nakshatra lord), and KP sub lord
    for a given sidereal longitude.

    Sub-lord algorithm:
        1. Find which nakshatra the longitude falls in.
        2. Identify the nakshatra lord (star lord).
        3. Within the nakshatra (13°20'), divide proportionally by
           Vimshottari dasha years starting at the nakshatra lord.
        4. Walk through sub-periods until the accumulated arc covers
           the position within the nakshatra.

    Returns dict with sign, degree, nakshatra, star_lord, sub_lord.
    """
    lon     = longitude % 360.0
    nak_idx = min(int(lon / NAKSHATRA_SPAN), 26)

    # Degrees into this nakshatra (0 … 13.333)
    pos_in_nak: float = lon - (nak_idx * NAKSHATRA_SPAN)

    nak_name, nak_lord = NAKSHATRAS[nak_idx]

    # Sub-lord: sequence starts at the nakshatra lord
    start_idx = DASHA_SEQUENCE.index(nak_lord)
    sub_lord  = DASHA_SEQUENCE[start_idx]  # fallback = first sub
    accumulated = 0.0

    for i in range(9):
        planet    = DASHA_SEQUENCE[(start_idx + i) % 9]
        sub_span  = (DASHA_YEARS[planet] / TOTAL_DASHA_YEARS) * NAKSHATRA_SPAN
        accumulated += sub_span
        if accumulated > pos_in_nak:
            sub_lord = planet
            break

    sign, degree = _get_sign_and_degree(lon)
    return {
        "sign":      sign,
        "degree":    degree,
        "nakshatra": nak_name,
        "star_lord": nak_lord,
        "sub_lord":  sub_lord,
    }


def _get_house_from_cusps(planet_lon: float, cusp_lons: list[float]) -> int:
    """
    Determine the Placidus house number (1–12) for a sidereal longitude.

    cusp_lons: 12-element list where index 0 = cusp 1 (ASC), index 11 = cusp 12.
    Handles wrap-around at 0°/360°.
    """
    lon = planet_lon % 360.0
    for h in range(12):
        start = cusp_lons[h] % 360.0
        end   = cusp_lons[(h + 1) % 12] % 360.0
        if start <= end:
            if start <= lon < end:
                return h + 1
        else:
            # Cusp range crosses 0° (e.g. 350° → 15°)
            if lon >= start or lon < end:
                return h + 1
    return 1  # floating-point safety fallback


def _trine_houses(h: int) -> tuple[int, int]:
    """Return the two houses that form trine (120°) aspects to house h (1-based)."""
    h1 = ((h - 1 + 4) % 12) + 1   # 4 houses forward
    h2 = ((h - 1 + 8) % 12) + 1   # 8 houses forward (= 4 houses backward)
    return h1, h2


# ══════════════════════════════════════════════════════════════════════════
# Public API
# ══════════════════════════════════════════════════════════════════════════

def compute_kp(dob: str, tob: str, tz: str, lat: float, lon: float) -> dict:
    """
    Compute a full KP (Krishnamurti Paddhati) chart.

    Args:
        dob:  Date of birth, "YYYY-MM-DD"
        tob:  Time of birth (local), "HH:MM" or "HH:MM:SS"
        tz:   IANA timezone string, e.g. "Asia/Kolkata"
        lat:  Birth latitude  (positive = North)
        lon:  Birth longitude (positive = East)

    Returns:
        {
            "lagna":         { sign, degree, nakshatra, star_lord, sub_lord },
            "planets":       [ { planet, sign, degree, nakshatra, star_lord, sub_lord, house }, ... ],
            "cusps":         [ { house, sign, degree, nakshatra, star_lord, sub_lord,
                                 cusp_lord, significators }, ... ],
            "significators": { "1": [...], "2": [...], ... "12": [...] },
            "ruling_planets": [ ... ]   # strong planets at query time
        }
    """
    # Ensure Lahiri ayanamsa (standard for KP)
    swe.set_sid_mode(swe.SIDM_LAHIRI)

    jd_ut = _to_julian_day(dob, tob, tz)

    # ── 1. House cusps via Placidus, sidereal ────────────────────────────
    # houses_ex returns (cusps_tuple[12], ascmc_tuple)
    # cusps_tuple[0] = cusp 1 (ASC) … cusps_tuple[11] = cusp 12
    houses_raw, ascmc = swe.houses_ex(jd_ut, lat, lon, b"P", swe.FLG_SIDEREAL)
    cusp_lons: list[float] = [c % 360.0 for c in houses_raw]   # 12 values

    # ── 2. Lagna (Ascendant) ─────────────────────────────────────────────
    asc_lon    = ascmc[0] % 360.0
    lagna_info = _get_kp_info(asc_lon)
    lagna_result = {
        "sign":      lagna_info["sign"],
        "degree":    lagna_info["degree"],
        "nakshatra": lagna_info["nakshatra"],
        "star_lord": lagna_info["star_lord"],
        "sub_lord":  lagna_info["sub_lord"],
    }

    # ── 3. Planet positions (sidereal, Placidus house) ───────────────────
    planet_data: dict[str, dict] = {}

    # 7 classical planets
    for name, pid in PLANET_IDS.items():
        pos, _ = swe.calc_ut(jd_ut, pid, swe.FLG_SIDEREAL | swe.FLG_SPEED)
        p_lon  = pos[0] % 360.0
        kp     = _get_kp_info(p_lon)
        house  = _get_house_from_cusps(p_lon, cusp_lons)
        planet_data[name] = {
            "planet":    name,
            "sign":      kp["sign"],
            "degree":    kp["degree"],
            "nakshatra": kp["nakshatra"],
            "star_lord": kp["star_lord"],
            "sub_lord":  kp["sub_lord"],
            "house":     house,
            "longitude": round(p_lon, 4),
        }

    # Rahu (mean north node) and Ketu (exactly 180° opposite)
    rahu_pos, _ = swe.calc_ut(jd_ut, RAHU_ID, swe.FLG_SIDEREAL | swe.FLG_SPEED)
    rahu_lon = rahu_pos[0] % 360.0
    ketu_lon = (rahu_lon + 180.0) % 360.0

    for name, p_lon in [("Rahu", rahu_lon), ("Ketu", ketu_lon)]:
        kp    = _get_kp_info(p_lon)
        house = _get_house_from_cusps(p_lon, cusp_lons)
        planet_data[name] = {
            "planet":    name,
            "sign":      kp["sign"],
            "degree":    kp["degree"],
            "nakshatra": kp["nakshatra"],
            "star_lord": kp["star_lord"],
            "sub_lord":  kp["sub_lord"],
            "house":     house,
            "longitude": round(p_lon, 4),
        }

    planets_list = [planet_data[p] for p in KP_PLANET_ORDER]

    # ── 4. House occupants map (planet → house) ───────────────────────────
    house_occupants: dict[int, list[str]] = {h: [] for h in range(1, 13)}
    for name, data in planet_data.items():
        house_occupants[data["house"]].append(name)

    # ── 5. Cusp data with KP sub-lord ────────────────────────────────────
    cusps_list: list[dict] = []
    for i, cusp_lon in enumerate(cusp_lons):
        house_num  = i + 1
        kp         = _get_kp_info(cusp_lon)
        cusp_lord  = SIGN_LORDS[kp["sign"]]   # sign lord of the cusp sign
        cusps_list.append({
            "house":       house_num,
            "sign":        kp["sign"],
            "degree":      kp["degree"],
            "nakshatra":   kp["nakshatra"],
            "star_lord":   kp["star_lord"],
            "sub_lord":    kp["sub_lord"],
            "cusp_lord":   cusp_lord,
            "significators": [],   # filled in step 6
        })

    # ── 6. Significators for each house ──────────────────────────────────
    #
    # A planet signifies house H if ANY of these hold:
    #   (a) It occupies house H                    [occupation]
    #   (b) It is in a trine house to H (4th/8th   [KP trine aspect]
    #       house forward), i.e. houses ±4 from H
    #   (c) Its star lord (nakshatra lord) is a    [star-lord link]
    #       planet that occupies house H
    #   (d) It is the house lord (sign lord of     [house lordship]
    #       the cusp sign of H)
    #
    significators: dict[str, list[str]] = {}

    for h in range(1, 13):
        sigs: set[str] = set()

        # (a) Planets occupying house h
        for p in house_occupants[h]:
            sigs.add(p)

        # (b) Planets in trine houses to h
        t1, t2 = _trine_houses(h)
        for p in house_occupants[t1]:
            sigs.add(p)
        for p in house_occupants[t2]:
            sigs.add(p)

        # (c) Planets whose star lord occupies house h
        occupants_h = set(house_occupants[h])
        for name, data in planet_data.items():
            if data["star_lord"] in occupants_h:
                sigs.add(name)

        # (d) House lord (sign lord of cusp h)
        house_lord = cusps_list[h - 1]["cusp_lord"]
        sigs.add(house_lord)

        sig_list = sorted(sigs)
        significators[str(h)] = sig_list
        cusps_list[h - 1]["significators"] = sig_list

    # ── 7. Ruling Planets at query time ──────────────────────────────────
    #
    # The ruling planets are those that are "strong" at the moment of the
    # query (current UTC time), not the birth time:
    #   • Day lord         — planet ruling the current weekday
    #   • Lagna star lord  — nakshatra lord of the current ascendant
    #   • Lagna sub lord   — KP sub lord of the current ascendant
    #   • Moon star lord   — nakshatra lord of Moon's current position
    #   • Moon sub lord    — KP sub lord of Moon's current position
    #
    # Birth lat/lon are reused for the current-time ascendant calculation.
    #
    now_utc = datetime.now(pytz.utc)
    jd_now  = swe.julday(
        now_utc.year, now_utc.month, now_utc.day,
        now_utc.hour + now_utc.minute / 60.0 + now_utc.second / 3600.0,
    )

    # Current Moon
    moon_now_pos, _ = swe.calc_ut(jd_now, swe.MOON, swe.FLG_SIDEREAL | swe.FLG_SPEED)
    moon_now_lon    = moon_now_pos[0] % 360.0
    moon_now_kp     = _get_kp_info(moon_now_lon)

    # Current Ascendant (using birth location as proxy)
    _, ascmc_now  = swe.houses_ex(jd_now, lat, lon, b"P", swe.FLG_SIDEREAL)
    asc_now_lon   = ascmc_now[0] % 360.0
    asc_now_kp    = _get_kp_info(asc_now_lon)

    # Day lord
    day_lord = DAY_LORDS[now_utc.weekday()]

    # Deduplicated ruling planets (order: day → lagna star → lagna sub → moon star → moon sub)
    ruling_planets = list(dict.fromkeys([
        day_lord,
        asc_now_kp["star_lord"],   # Lagna star lord at query time
        asc_now_kp["sub_lord"],    # Lagna sub lord at query time
        moon_now_kp["star_lord"],  # Moon's star lord at query time
        moon_now_kp["sub_lord"],   # Moon's sub lord at query time
    ]))

    return {
        "lagna":          lagna_result,
        "planets":        planets_list,
        "cusps":          cusps_list,
        "significators":  significators,
        "ruling_planets": ruling_planets,
    }
