"""
backend/app/core/jyotish/panchang.py

Panchang (Hindu almanac) computation engine.

Computes the five limbs of the Panchang for any given date and location:
  1. Tithi       — Lunar day (1-30), Shukla/Krishna paksha
  2. Nakshatra   — Moon's asterism (1-27)
  3. Vara        — Weekday (solar day)
  4. Yoga        — Sun + Moon longitude combination (1-27)
  5. Karana      — Half-tithi (1-60)

Also computes:
  - Sunrise, Sunset (via Swiss Ephemeris rise_trans)
  - Rahu Kaal (inauspicious window, weekday-dependent)
  - Abhijit Muhurat (auspicious noon window)
  - Brahma Muhurta (auspicious pre-dawn window)

Uses Swiss Ephemeris (pyswisseph), sidereal/Lahiri ayanamsa throughout.
Tithi and Karana depend only on the Sun-Moon arc — ayanamsa cancels out.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Optional

import pytz
import swisseph as swe

logger = logging.getLogger(__name__)

# ── Lookup tables ──────────────────────────────────────────────────────────────

RASHIS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]

# 30 tithis — indices 0-29 (0 = Shukla Pratipada, 14 = Purnima, 15 = Krishna Pratipada, 29 = Amavasya)
TITHIS = [
    # Shukla Paksha (waxing)
    {"num": 1,  "name": "Pratipada",   "paksha": "Shukla",  "lord": "Agni",    "quality": "neutral"},
    {"num": 2,  "name": "Dwitiya",     "paksha": "Shukla",  "lord": "Brahma",  "quality": "good"},
    {"num": 3,  "name": "Tritiya",     "paksha": "Shukla",  "lord": "Gauri",   "quality": "good"},
    {"num": 4,  "name": "Chaturthi",   "paksha": "Shukla",  "lord": "Ganesha", "quality": "neutral"},
    {"num": 5,  "name": "Panchami",    "paksha": "Shukla",  "lord": "Naga",    "quality": "good"},
    {"num": 6,  "name": "Shashthi",    "paksha": "Shukla",  "lord": "Kartikeya","quality": "good"},
    {"num": 7,  "name": "Saptami",     "paksha": "Shukla",  "lord": "Surya",   "quality": "good"},
    {"num": 8,  "name": "Ashtami",     "paksha": "Shukla",  "lord": "Rudra",   "quality": "neutral"},
    {"num": 9,  "name": "Navami",      "paksha": "Shukla",  "lord": "Durga",   "quality": "neutral"},
    {"num": 10, "name": "Dashami",     "paksha": "Shukla",  "lord": "Yama",    "quality": "good"},
    {"num": 11, "name": "Ekadashi",    "paksha": "Shukla",  "lord": "Vishnu",  "quality": "auspicious"},
    {"num": 12, "name": "Dwadashi",    "paksha": "Shukla",  "lord": "Hari",    "quality": "auspicious"},
    {"num": 13, "name": "Trayodashi",  "paksha": "Shukla",  "lord": "Kamadeva","quality": "good"},
    {"num": 14, "name": "Chaturdashi", "paksha": "Shukla",  "lord": "Shiva",   "quality": "neutral"},
    {"num": 15, "name": "Purnima",     "paksha": "Shukla",  "lord": "Moon",    "quality": "auspicious"},
    # Krishna Paksha (waning)
    {"num": 1,  "name": "Pratipada",   "paksha": "Krishna", "lord": "Agni",    "quality": "neutral"},
    {"num": 2,  "name": "Dwitiya",     "paksha": "Krishna", "lord": "Brahma",  "quality": "good"},
    {"num": 3,  "name": "Tritiya",     "paksha": "Krishna", "lord": "Gauri",   "quality": "good"},
    {"num": 4,  "name": "Chaturthi",   "paksha": "Krishna", "lord": "Ganesha", "quality": "neutral"},
    {"num": 5,  "name": "Panchami",    "paksha": "Krishna", "lord": "Naga",    "quality": "good"},
    {"num": 6,  "name": "Shashthi",    "paksha": "Krishna", "lord": "Kartikeya","quality": "good"},
    {"num": 7,  "name": "Saptami",     "paksha": "Krishna", "lord": "Surya",   "quality": "good"},
    {"num": 8,  "name": "Ashtami",     "paksha": "Krishna", "lord": "Rudra",   "quality": "neutral"},
    {"num": 9,  "name": "Navami",      "paksha": "Krishna", "lord": "Durga",   "quality": "neutral"},
    {"num": 10, "name": "Dashami",     "paksha": "Krishna", "lord": "Yama",    "quality": "good"},
    {"num": 11, "name": "Ekadashi",    "paksha": "Krishna", "lord": "Vishnu",  "quality": "auspicious"},
    {"num": 12, "name": "Dwadashi",    "paksha": "Krishna", "lord": "Hari",    "quality": "auspicious"},
    {"num": 13, "name": "Trayodashi",  "paksha": "Krishna", "lord": "Kamadeva","quality": "good"},
    {"num": 14, "name": "Chaturdashi", "paksha": "Krishna", "lord": "Shiva",   "quality": "neutral"},
    {"num": 30, "name": "Amavasya",    "paksha": "Krishna", "lord": "Pitru",   "quality": "inauspicious"},
]

# 27 nakshatras — index 0-26
NAKSHATRAS = [
    {"name": "Ashwini",      "lord": "Ketu",    "deity": "Ashwins",     "symbol": "Horse Head"},
    {"name": "Bharani",      "lord": "Venus",   "deity": "Yama",        "symbol": "Yoni"},
    {"name": "Krittika",     "lord": "Sun",     "deity": "Agni",        "symbol": "Blade"},
    {"name": "Rohini",       "lord": "Moon",    "deity": "Brahma",      "symbol": "Chariot"},
    {"name": "Mrigashira",   "lord": "Mars",    "deity": "Soma",        "symbol": "Deer Head"},
    {"name": "Ardra",        "lord": "Rahu",    "deity": "Rudra",       "symbol": "Teardrop"},
    {"name": "Punarvasu",    "lord": "Jupiter", "deity": "Aditi",       "symbol": "Bow"},
    {"name": "Pushya",       "lord": "Saturn",  "deity": "Brihaspati",  "symbol": "Flower"},
    {"name": "Ashlesha",     "lord": "Mercury", "deity": "Nagas",       "symbol": "Serpent"},
    {"name": "Magha",        "lord": "Ketu",    "deity": "Pitru",       "symbol": "Throne"},
    {"name": "Purva Phalguni","lord": "Venus",   "deity": "Bhaga",       "symbol": "Hammock"},
    {"name": "Uttara Phalguni","lord": "Sun",    "deity": "Aryaman",     "symbol": "Bed"},
    {"name": "Hasta",        "lord": "Moon",    "deity": "Savitar",     "symbol": "Hand"},
    {"name": "Chitra",       "lord": "Mars",    "deity": "Vishwakarma", "symbol": "Pearl"},
    {"name": "Swati",        "lord": "Rahu",    "deity": "Vayu",        "symbol": "Coral"},
    {"name": "Vishakha",     "lord": "Jupiter", "deity": "Indragni",    "symbol": "Triumphal Arch"},
    {"name": "Anuradha",     "lord": "Saturn",  "deity": "Mitra",       "symbol": "Lotus"},
    {"name": "Jyeshtha",     "lord": "Mercury", "deity": "Indra",       "symbol": "Earring"},
    {"name": "Mula",         "lord": "Ketu",    "deity": "Nirriti",     "symbol": "Root"},
    {"name": "Purva Ashadha","lord": "Venus",   "deity": "Apas",        "symbol": "Fan"},
    {"name": "Uttara Ashadha","lord": "Sun",    "deity": "Vishvadevas", "symbol": "Elephant Tusk"},
    {"name": "Shravana",     "lord": "Moon",    "deity": "Vishnu",      "symbol": "Ear"},
    {"name": "Dhanishtha",   "lord": "Mars",    "deity": "Ashta Vasus", "symbol": "Drum"},
    {"name": "Shatabhisha",  "lord": "Rahu",    "deity": "Varuna",      "symbol": "Empty Circle"},
    {"name": "Purva Bhadrapada","lord": "Jupiter","deity": "Ajaikapad", "symbol": "Sword"},
    {"name": "Uttara Bhadrapada","lord": "Saturn","deity": "Ahirbudhnya","symbol": "Twins"},
    {"name": "Revati",       "lord": "Mercury", "deity": "Pushan",      "symbol": "Fish"},
]

# 7 weekdays — Python weekday (Mon=0) + Sun=6
VARAS = [
    {"name": "Somavar",       "en": "Monday",    "lord": "Moon",    "hi": "सोमवार"},
    {"name": "Mangalavar",    "en": "Tuesday",   "lord": "Mars",    "hi": "मंगलवार"},
    {"name": "Budhavar",      "en": "Wednesday", "lord": "Mercury", "hi": "बुधवार"},
    {"name": "Guruvar",       "en": "Thursday",  "lord": "Jupiter", "hi": "गुरुवार"},
    {"name": "Shukravar",     "en": "Friday",    "lord": "Venus",   "hi": "शुक्रवार"},
    {"name": "Shanivar",      "en": "Saturday",  "lord": "Saturn",  "hi": "शनिवार"},
    {"name": "Ravivar",       "en": "Sunday",    "lord": "Sun",     "hi": "रविवार"},
]

# 27 yogas — index 0-26
YOGAS = [
    {"name": "Vishkambha",  "quality": "inauspicious", "lord": "Saturn"},
    {"name": "Priti",       "quality": "auspicious",   "lord": "Mercury"},
    {"name": "Ayushman",    "quality": "auspicious",   "lord": "Venus"},
    {"name": "Saubhagya",   "quality": "auspicious",   "lord": "Sun"},
    {"name": "Shobhana",    "quality": "auspicious",   "lord": "Moon"},
    {"name": "Atiganda",    "quality": "inauspicious", "lord": "Mars"},
    {"name": "Sukarma",     "quality": "auspicious",   "lord": "Jupiter"},
    {"name": "Dhriti",      "quality": "auspicious",   "lord": "Saturn"},
    {"name": "Shula",       "quality": "inauspicious", "lord": "Mercury"},
    {"name": "Ganda",       "quality": "inauspicious", "lord": "Venus"},
    {"name": "Vriddhi",     "quality": "auspicious",   "lord": "Sun"},
    {"name": "Dhruva",      "quality": "auspicious",   "lord": "Moon"},
    {"name": "Vyaghata",    "quality": "inauspicious", "lord": "Mars"},
    {"name": "Harshana",    "quality": "auspicious",   "lord": "Jupiter"},
    {"name": "Vajra",       "quality": "inauspicious", "lord": "Saturn"},
    {"name": "Siddhi",      "quality": "auspicious",   "lord": "Mercury"},
    {"name": "Vyatipata",   "quality": "inauspicious", "lord": "Venus"},
    {"name": "Variyan",     "quality": "neutral",      "lord": "Sun"},
    {"name": "Parigha",     "quality": "inauspicious", "lord": "Moon"},
    {"name": "Shiva",       "quality": "auspicious",   "lord": "Mars"},
    {"name": "Siddha",      "quality": "auspicious",   "lord": "Jupiter"},
    {"name": "Sadhya",      "quality": "auspicious",   "lord": "Saturn"},
    {"name": "Shubha",      "quality": "auspicious",   "lord": "Mercury"},
    {"name": "Shukla",      "quality": "auspicious",   "lord": "Venus"},
    {"name": "Brahma",      "quality": "auspicious",   "lord": "Sun"},
    {"name": "Indra",       "quality": "auspicious",   "lord": "Moon"},
    {"name": "Vaidhriti",   "quality": "inauspicious", "lord": "Mars"},
]

# Karanas — 7 repeating + 4 fixed
REPEATING_KARANAS = [
    {"name": "Bava",     "type": "movable", "lord": "Sun"},
    {"name": "Balava",   "type": "movable", "lord": "Moon"},
    {"name": "Kaulava",  "type": "movable", "lord": "Mars"},
    {"name": "Taitila",  "type": "movable", "lord": "Mercury"},
    {"name": "Garaja",   "type": "movable", "lord": "Jupiter"},
    {"name": "Vanija",   "type": "movable", "lord": "Venus"},
    {"name": "Vishti",   "type": "movable", "lord": "Saturn", "note": "Bhadra — inauspicious"},
]

FIXED_KARANAS = [
    {"name": "Shakuni",     "type": "fixed", "lord": "Saturn"},
    {"name": "Chatushpada", "type": "fixed", "lord": "Jupiter"},
    {"name": "Naga",        "type": "fixed", "lord": "Mercury"},
    {"name": "Kimstughna",  "type": "fixed", "lord": "Venus"},
]

# Rahu Kaal: 1-indexed part of the day from sunrise (day divided into 8 equal parts)
# Python weekday (Mon=0..Sun=6)
RAHU_KAAL_PART = {0: 2, 1: 7, 2: 5, 3: 6, 4: 4, 5: 3, 6: 8}  # 1-indexed

QUALITY_LABELS = {
    "auspicious":   "Auspicious",
    "good":         "Good",
    "neutral":      "Neutral",
    "inauspicious": "Inauspicious",
}

QUALITY_COLORS = {
    "auspicious":   "#43A047",
    "good":         "#DFA84F",
    "neutral":      "#8B6FE8",
    "inauspicious": "#E53935",
}


# ── Helpers ────────────────────────────────────────────────────────────────────

def _to_julian_day(date_str: str, time_str: str, timezone_str: str) -> float:
    """Convert date + time + timezone to Julian Day (UTC)."""
    tz_obj = pytz.timezone(timezone_str)
    parts  = time_str.split(":")
    hour   = int(parts[0])
    minute = int(parts[1])
    second = int(parts[2]) if len(parts) > 2 else 0
    from datetime import date
    d = date.fromisoformat(date_str)
    local_dt = datetime(d.year, d.month, d.day, hour, minute, second)
    local_dt = tz_obj.localize(local_dt)
    utc_dt   = local_dt.astimezone(pytz.utc)
    return swe.julday(utc_dt.year, utc_dt.month, utc_dt.day,
                      utc_dt.hour + utc_dt.minute / 60.0 + utc_dt.second / 3600.0)


def _date_to_jd_noon(date_str: str, timezone_str: str) -> float:
    """Julian Day for local noon on a given date (good start point for rise_trans)."""
    return _to_julian_day(date_str, "12:00:00", timezone_str)


def _jd_to_local_str(jd: float, tz_obj) -> str:
    """Convert Julian Day (UT) to local time string 'HH:MM AM/PM'."""
    try:
        y, m, d, h = swe.revjul(jd)
        hour   = int(h)
        minute = int((h - hour) * 60)
        second = int(((h - hour) * 60 - minute) * 60)
        utc_dt = datetime(y, m, d, hour, minute, second, tzinfo=pytz.utc)
        local  = utc_dt.astimezone(tz_obj)
        return local.strftime("%I:%M %p")
    except Exception:
        return "—"


def _get_sunrise_sunset(jd_noon: float, lat: float, lon: float) -> tuple[float, float]:
    """
    Return (sunrise_jd, sunset_jd) for the day containing jd_noon.
    Falls back to ±6 hours from noon if rise_trans fails.
    """
    jd_start = jd_noon - 0.5   # search from ~midnight
    try:
        _, r = swe.rise_trans(jd_start, swe.SUN, swe.CALC_RISE, (lon, lat, 0.0), 1013.25, 15.0)
        _, s = swe.rise_trans(jd_start, swe.SUN, swe.CALC_SET,  (lon, lat, 0.0), 1013.25, 15.0)
        sunrise_jd = r[0]
        sunset_jd  = s[0]
        # Sanity check — should be within 24 hours of each other
        if 0 < (sunset_jd - sunrise_jd) < 1:
            return sunrise_jd, sunset_jd
    except Exception as exc:
        logger.debug("rise_trans failed (%s), using fallback", exc)
    # Fallback: approximate 6 AM / 6 PM
    return jd_noon - 0.25, jd_noon + 0.25


def _compute_sun_moon(jd: float) -> tuple[float, float]:
    """Return (sun_longitude, moon_longitude) sidereal degrees [0-360)."""
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    sun_res,  _ = swe.calc_ut(jd, swe.SUN,  swe.FLG_SIDEREAL)
    moon_res, _ = swe.calc_ut(jd, swe.MOON, swe.FLG_SIDEREAL)
    return sun_res[0] % 360.0, moon_res[0] % 360.0


# ── Five Limb Computations ─────────────────────────────────────────────────────

def _compute_tithi(sun_lon: float, moon_lon: float) -> dict:
    """Compute tithi from Sun-Moon arc."""
    arc        = (moon_lon - sun_lon) % 360.0
    idx        = int(arc / 12)          # 0-29
    completion = round(((arc % 12) / 12) * 100, 1)
    t          = TITHIS[idx]
    return {
        "index":      idx + 1,
        "name":       t["name"],
        "paksha":     t["paksha"],
        "lord":       t["lord"],
        "quality":    t["quality"],
        "completion": completion,
        "arc":        round(arc, 2),
    }


def _compute_nakshatra(moon_lon: float) -> dict:
    """Compute nakshatra and pada from Moon longitude."""
    NAK_SIZE  = 360.0 / 27
    PADA_SIZE = NAK_SIZE / 4
    idx       = int(moon_lon / NAK_SIZE)           # 0-26
    pada      = int((moon_lon % NAK_SIZE) / PADA_SIZE) + 1   # 1-4
    completion = round(((moon_lon % NAK_SIZE) / NAK_SIZE) * 100, 1)
    n          = NAKSHATRAS[idx]
    return {
        "index":      idx + 1,
        "name":       n["name"],
        "lord":       n["lord"],
        "deity":      n["deity"],
        "symbol":     n["symbol"],
        "pada":       pada,
        "completion": completion,
        "moon_lon":   round(moon_lon, 2),
    }


def _compute_vara(date_str: str, timezone_str: str) -> dict:
    """Compute weekday (vara) from local date."""
    from datetime import date
    tz_obj   = pytz.timezone(timezone_str)
    d        = date.fromisoformat(date_str)
    local_dt = datetime(d.year, d.month, d.day, 12, 0, 0)
    local_dt = tz_obj.localize(local_dt)
    weekday  = local_dt.weekday()   # Mon=0, Sun=6
    v        = VARAS[weekday]
    return {
        "index":   weekday,
        "name":    v["name"],
        "en":      v["en"],
        "hi":      v["hi"],
        "lord":    v["lord"],
    }


def _compute_yoga(sun_lon: float, moon_lon: float) -> dict:
    """Compute yoga from sum of Sun + Moon longitudes."""
    YOGA_SIZE  = 360.0 / 27
    yoga_lon   = (sun_lon + moon_lon) % 360.0
    idx        = int(yoga_lon / YOGA_SIZE)   # 0-26
    completion = round(((yoga_lon % YOGA_SIZE) / YOGA_SIZE) * 100, 1)
    y          = YOGAS[idx]
    return {
        "index":      idx + 1,
        "name":       y["name"],
        "lord":       y["lord"],
        "quality":    y["quality"],
        "completion": completion,
    }


def _compute_karana(sun_lon: float, moon_lon: float) -> dict:
    """Compute karana (half-tithi)."""
    arc        = (moon_lon - sun_lon) % 360.0
    k_idx      = int(arc / 6)          # 0-59 (60 karanas per month)

    if k_idx == 0:
        k = FIXED_KARANAS[3]   # Kimstughna — first karana of Shukla Pratipada
    elif 1 <= k_idx <= 56:
        k = REPEATING_KARANAS[(k_idx - 1) % 7]
    elif k_idx == 57:
        k = FIXED_KARANAS[0]   # Shakuni
    elif k_idx == 58:
        k = FIXED_KARANAS[1]   # Chatushpada
    else:
        k = FIXED_KARANAS[2]   # Naga

    completion = round(((arc % 6) / 6) * 100, 1)
    return {
        "index":      k_idx + 1,
        "name":       k["name"],
        "type":       k["type"],
        "lord":       k["lord"],
        "note":       k.get("note", ""),
        "completion": completion,
    }


# ── Muhurat / Timing ───────────────────────────────────────────────────────────

def _compute_rahu_kaal(sunrise_jd: float, sunset_jd: float, weekday: int, tz_obj) -> dict:
    """Compute Rahu Kaal window for the day."""
    part_idx   = RAHU_KAAL_PART[weekday]   # 1-indexed part
    day_dur    = sunset_jd - sunrise_jd
    part_dur   = day_dur / 8.0
    start_jd   = sunrise_jd + (part_idx - 1) * part_dur
    end_jd     = start_jd + part_dur
    return {
        "start": _jd_to_local_str(start_jd, tz_obj),
        "end":   _jd_to_local_str(end_jd,   tz_obj),
        "part":  part_idx,
        "note":  "Inauspicious window — avoid starting new ventures",
    }


def _compute_abhijit(sunrise_jd: float, sunset_jd: float, tz_obj) -> dict:
    """Compute Abhijit Muhurat — the most auspicious window (~48 min centered on solar noon)."""
    noon_jd    = (sunrise_jd + sunset_jd) / 2.0
    HALF       = 24.0 / (24.0 * 60.0)   # 24 minutes in JD fraction
    start_jd   = noon_jd - HALF
    end_jd     = noon_jd + HALF
    return {
        "start": _jd_to_local_str(start_jd, tz_obj),
        "end":   _jd_to_local_str(end_jd,   tz_obj),
        "note":  "Highly auspicious — governed by the Sun at its zenith",
    }


def _compute_brahma_muhurta(sunrise_jd: float, tz_obj) -> dict:
    """Brahma Muhurta — 96 minutes before sunrise, lasts 48 minutes."""
    MIN = 1.0 / (24.0 * 60.0)   # 1 minute in JD fraction
    start_jd = sunrise_jd - 96 * MIN
    end_jd   = sunrise_jd - 48 * MIN
    return {
        "start": _jd_to_local_str(start_jd, tz_obj),
        "end":   _jd_to_local_str(end_jd,   tz_obj),
        "note":  "Ideal for meditation, study, and spiritual practice",
    }


# ── Public entry point ─────────────────────────────────────────────────────────

def compute_panchang(
    date_str:     str,
    lat:          float,
    lon:          float,
    timezone_str: str,
    time_str:     str = "12:00:00",
) -> dict:
    """
    Compute the full Panchang for a given date and location.

    Args:
        date_str:     Date YYYY-MM-DD
        lat:          Latitude (decimal degrees, N positive)
        lon:          Longitude (decimal degrees, E positive)
        timezone_str: IANA timezone string e.g. 'Asia/Kolkata'
        time_str:     Time HH:MM or HH:MM:SS for planetary positions (defaults to noon)

    Returns:
        Full Panchang dict including tithi, nakshatra, vara, yoga, karana,
        sunrise, sunset, rahu_kaal, abhijit, brahma_muhurta.
    """
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    swe.set_topo(lon, lat, 0)

    # Julian Days
    jd_noon = _date_to_jd_noon(date_str, timezone_str)
    jd_calc = _to_julian_day(date_str, time_str, timezone_str)

    # Sun and Moon positions at calc time
    sun_lon, moon_lon = _compute_sun_moon(jd_calc)

    # Five limbs
    tithi    = _compute_tithi(sun_lon, moon_lon)
    nakshatra = _compute_nakshatra(moon_lon)
    vara     = _compute_vara(date_str, timezone_str)
    yoga     = _compute_yoga(sun_lon, moon_lon)
    karana   = _compute_karana(sun_lon, moon_lon)

    # Rise/Set
    sunrise_jd, sunset_jd = _get_sunrise_sunset(jd_noon, lat, lon)
    tz_obj = pytz.timezone(timezone_str)

    # Muhurats
    rahu_kaal      = _compute_rahu_kaal(sunrise_jd, sunset_jd, vara["index"], tz_obj)
    abhijit        = _compute_abhijit(sunrise_jd, sunset_jd, tz_obj)
    brahma_muhurta = _compute_brahma_muhurta(sunrise_jd, tz_obj)

    # Moon sign & rashi for display
    moon_sign_idx = int(moon_lon / 30)
    sun_sign_idx  = int(sun_lon / 30)

    return {
        "date":     date_str,
        "location": {"lat": round(lat, 4), "lon": round(lon, 4), "tz": timezone_str},

        # Five limbs
        "tithi":     tithi,
        "nakshatra": nakshatra,
        "vara":      vara,
        "yoga":      yoga,
        "karana":    karana,

        # Planetary snapshot for context
        "sun":       {"sign": RASHIS[sun_sign_idx],  "lon": round(sun_lon, 2)},
        "moon":      {"sign": RASHIS[moon_sign_idx], "lon": round(moon_lon, 2)},

        # Timing
        "sunrise":        _jd_to_local_str(sunrise_jd, tz_obj),
        "sunset":         _jd_to_local_str(sunset_jd,  tz_obj),
        "rahu_kaal":      rahu_kaal,
        "abhijit":        abhijit,
        "brahma_muhurta": brahma_muhurta,

        # Helpers for quality_colors on the frontend
        "quality_colors": QUALITY_COLORS,
    }
