"""
backend/app/core/jyotish/varshphal.py

Varshphal (Annual Horoscope / Solar Return) computation engine.
Uses pyswisseph with sidereal Lahiri ayanamsa.

Core concepts:
  - Solar Return (Varsha Pravesh): exact moment Sun returns to natal sidereal longitude
  - Varsha Lagna: ascendant at solar return moment (at query location)
  - Muntha: progresses 1 sign per year from natal lagna (Moon sign lord method)
  - Varsha Pati (Year Lord): lord of the day at solar return; determined by hora
  - Tri-Pataki Chakra: lords of 1st, 5th, 9th from Varsha Lagna
"""

import swisseph as swe
import pytz
from datetime import datetime, timedelta

# ── Constants ──────────────────────────────────────────────────────────────────

swe.set_ephe_path(None)          # bundled ephemeris
AYANAMSA = swe.SIDM_LAHIRI

SIGNS = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
]

NAKSHATRAS = [
    'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
    'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
    'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
    'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta',
    'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
]

PLANET_IDS = {
    'Sun':     swe.SUN,
    'Moon':    swe.MOON,
    'Mars':    swe.MARS,
    'Mercury': swe.MERCURY,
    'Jupiter': swe.JUPITER,
    'Venus':   swe.VENUS,
    'Saturn':  swe.SATURN,
    'Rahu':    swe.MEAN_NODE,
}

PLANET_SYMBOLS = {
    'Sun': '☉', 'Moon': '☽', 'Mars': '♂', 'Mercury': '☿',
    'Jupiter': '♃', 'Venus': '♀', 'Saturn': '♄', 'Rahu': '☊', 'Ketu': '☋',
}

SIGN_LORDS = {
    'Aries': 'Mars', 'Taurus': 'Venus', 'Gemini': 'Mercury', 'Cancer': 'Moon',
    'Leo': 'Sun', 'Virgo': 'Mercury', 'Libra': 'Venus', 'Scorpio': 'Mars',
    'Sagittarius': 'Jupiter', 'Capricorn': 'Saturn', 'Aquarius': 'Saturn',
    'Pisces': 'Jupiter',
}

# Hora (hour) lord sequence — starting from sunrise on each weekday
# weekday 0=Mon → Sun, Moon, Saturn, Jupiter, Mars, Venus, Mercury (hora lords repeat)
# Day lords: Sun=Sun, Mon=Moon, Tue=Mars, Wed=Mercury, Thu=Jupiter, Fri=Venus, Sat=Saturn
DAY_LORDS = {0: 'Moon', 1: 'Mars', 2: 'Mercury', 3: 'Jupiter',
             4: 'Venus', 5: 'Saturn', 6: 'Sun'}  # Python weekday Mon=0

# Varsha Pati order (from Tajika system) — year lord determined by hora at solar return
HORA_SEQUENCE = ['Sun', 'Venus', 'Mercury', 'Moon', 'Saturn', 'Jupiter', 'Mars']


# ── Helpers ────────────────────────────────────────────────────────────────────

def _to_jd(date_str: str, time_str: str, tz_str: str) -> float:
    """Convert local date/time string to Julian Day (UT)."""
    tz = pytz.timezone(tz_str)
    dt_local = datetime.strptime(f'{date_str} {time_str}', '%Y-%m-%d %H:%M:%S')
    dt_local = tz.localize(dt_local)
    dt_utc = dt_local.astimezone(pytz.utc)
    return swe.julday(dt_utc.year, dt_utc.month, dt_utc.day,
                      dt_utc.hour + dt_utc.minute / 60.0 + dt_utc.second / 3600.0)


def _sidereal_sun(jd: float) -> float:
    """Return sidereal Sun longitude (Lahiri) in degrees [0,360)."""
    swe.set_sid_mode(AYANAMSA, 0, 0)
    flags = swe.FLG_SIDEREAL | swe.FLG_SPEED
    lon = swe.calc_ut(jd, swe.SUN, flags)[0][0]
    return lon % 360.0


def _sidereal_lon(jd: float, planet_id: int) -> float:
    """Return sidereal longitude for any planet."""
    swe.set_sid_mode(AYANAMSA, 0, 0)
    flags = swe.FLG_SIDEREAL | swe.FLG_SPEED
    return swe.calc_ut(jd, planet_id, flags)[0][0] % 360.0


def _sign_of(lon: float) -> str:
    return SIGNS[int(lon / 30) % 12]


def _deg_in_sign(lon: float) -> float:
    return lon % 30.0


def _nakshatra_of(lon: float):
    nak_size = 360.0 / 27
    idx = int(lon / nak_size) % 27
    pada = int((lon % nak_size) / (nak_size / 4)) + 1
    return NAKSHATRAS[idx], pada


def _house_of(planet_lon: float, lagna_lon: float) -> int:
    """Return Bhava (house number 1–12) for a planet given lagna longitude."""
    diff = (planet_lon - lagna_lon) % 360.0
    return int(diff / 30) + 1


def _jd_to_local_dt(jd: float, tz: pytz.BaseTzInfo) -> dict:
    """Convert JD to local date/time dict."""
    y, m, d, h = swe.revjul(jd)
    hour_int = int(h)
    minute_int = int((h - hour_int) * 60)
    second_int = int(((h - hour_int) * 60 - minute_int) * 60)
    dt_utc = datetime(y, m, d, hour_int, minute_int, second_int, tzinfo=pytz.utc)
    dt_local = dt_utc.astimezone(tz)
    return {
        'date': dt_local.strftime('%d %B %Y'),
        'time': dt_local.strftime('%I:%M:%S %p'),
        'datetime_iso': dt_local.isoformat(),
        'weekday': dt_local.strftime('%A'),
    }


def _compute_ascendant(jd: float, lat: float, lon: float) -> float:
    """Return sidereal ascendant longitude (Lahiri)."""
    swe.set_sid_mode(AYANAMSA, 0, 0)
    ayanamsa = swe.get_ayanamsa_ut(jd)
    houses = swe.houses(jd, lat, lon, b'P')  # Placidus (approximation for Vedic)
    asc_tropical = houses[1][0]  # ASC
    return (asc_tropical - ayanamsa) % 360.0


# ── Solar Return Finder ────────────────────────────────────────────────────────

def _find_solar_return(natal_sun_lon: float, target_year: int) -> float:
    """
    Binary-search for the JD in target_year when sidereal Sun = natal_sun_lon.
    Returns JD (UT) of solar return.
    """
    # Start: Jan 1 of target_year; End: Dec 31
    jd_start = swe.julday(target_year, 1, 1, 0.0)
    jd_end   = swe.julday(target_year, 12, 31, 23.99)

    def sun_diff(jd):
        """Difference (current - natal), adjusted for wrap-around."""
        curr = _sidereal_sun(jd)
        diff = (curr - natal_sun_lon + 180) % 360 - 180
        return diff

    # Binary search (tolerance: 1 second ≈ 1/86400 day)
    tolerance = 1.0 / 86400.0
    for _ in range(60):
        jd_mid = (jd_start + jd_end) / 2.0
        diff_start = sun_diff(jd_start)
        diff_mid   = sun_diff(jd_mid)
        if abs(diff_mid) < tolerance / 3600.0:  # within ~0.0003 arc-sec
            return jd_mid
        if diff_start * diff_mid <= 0:
            jd_end = jd_mid
        else:
            jd_start = jd_mid
        if jd_end - jd_start < tolerance:
            break

    return (jd_start + jd_end) / 2.0


# ── Hora (Varsha Pati) Computation ────────────────────────────────────────────

def _compute_varsha_pati(sr_jd: float, lat: float, lon: float) -> str:
    """
    Determine Varsha Pati (Year Lord) via hora lord at solar return moment.
    Method: find sunrise on solar return day, compute elapsed horas, find lord.
    """
    try:
        # Sunrise on SR day
        jd_noon = float(int(sr_jd)) + 0.5
        rise_result = swe.rise_trans(jd_noon - 0.5, swe.SUN, swe.CALC_RISE,
                                     (lon, lat, 0.0), 1013.25, 15.0)
        sunrise_jd = rise_result[1][0] if rise_result[0] == 0 else jd_noon - 0.25

        # Sunset
        set_result = swe.rise_trans(jd_noon - 0.5, swe.SUN, swe.CALC_SET,
                                    (lon, lat, 0.0), 1013.25, 15.0)
        sunset_jd = set_result[1][0] if set_result[0] == 0 else jd_noon + 0.25

        # Day horas: 12 equal parts from sunrise to sunset
        # Night horas: 12 equal parts from sunset to next sunrise
        y, m, d, h = swe.revjul(sunrise_jd)
        weekday = datetime(y, m, d).weekday()  # Mon=0

        day_lord = DAY_LORDS[weekday]
        day_lord_idx = HORA_SEQUENCE.index(day_lord)

        hora_duration = (sunset_jd - sunrise_jd) / 12.0
        horas_elapsed = int((sr_jd - sunrise_jd) / hora_duration)
        horas_elapsed = max(0, horas_elapsed)

        lord_idx = (day_lord_idx + horas_elapsed) % 7
        return HORA_SEQUENCE[lord_idx]
    except Exception:
        # Fallback: day lord
        y, m, d, _ = swe.revjul(sr_jd)
        weekday = datetime(y, m, d).weekday()
        return DAY_LORDS[weekday]


# ── Muntha ────────────────────────────────────────────────────────────────────

def _compute_muntha(natal_lagna_sign: str, birth_year: int, target_year: int) -> dict:
    """
    Muntha advances 1 sign per year from natal lagna.
    Age = target_year - birth_year (0-indexed, so year 1 = natal lagna).
    """
    natal_idx  = SIGNS.index(natal_lagna_sign)
    age        = target_year - birth_year       # years elapsed since birth
    muntha_idx = (natal_idx + age) % 12
    muntha_sign = SIGNS[muntha_idx]
    return {
        'sign': muntha_sign,
        'lord': SIGN_LORDS[muntha_sign],
        'sign_number': muntha_idx + 1,
    }


# ── Tri-Pataki Chakra ─────────────────────────────────────────────────────────

def _tri_pataki(varsha_lagna_sign: str) -> dict:
    lagna_idx = SIGNS.index(varsha_lagna_sign)
    s1 = SIGNS[lagna_idx]
    s5 = SIGNS[(lagna_idx + 4) % 12]
    s9 = SIGNS[(lagna_idx + 8) % 12]
    return {
        'lord_1': SIGN_LORDS[s1],
        'lord_5': SIGN_LORDS[s5],
        'lord_9': SIGN_LORDS[s9],
        'sign_1': s1,
        'sign_5': s5,
        'sign_9': s9,
    }


# ── Planet Detail Builder ──────────────────────────────────────────────────────

def _planet_detail(lon: float, lagna_lon: float) -> dict:
    sign = _sign_of(lon)
    nak, pada = _nakshatra_of(lon)
    return {
        'longitude':   round(lon, 4),
        'sign':        sign,
        'sign_lord':   SIGN_LORDS[sign],
        'degree':      round(_deg_in_sign(lon), 2),
        'nakshatra':   nak,
        'pada':        pada,
        'house':       _house_of(lon, lagna_lon),
    }


# ── Main Entry Point ──────────────────────────────────────────────────────────

def compute_varshphal(
    birth_date:  str,        # YYYY-MM-DD
    birth_time:  str,        # HH:MM:SS
    birth_tz:    str,        # IANA e.g. 'Asia/Kolkata'
    birth_lat:   float,
    birth_lon:   float,
    birth_lagna_lon: float,  # natal sidereal ascendant longitude (pre-computed)
    target_year: int,        # Gregorian year for solar return
    query_lat:   float,      # location for solar return chart (can = birth_lat)
    query_lon:   float,
    query_tz:    str,
) -> dict:
    """
    Compute full Varshphal (Annual Horoscope) for target_year.

    Returns a dict with:
      - solar_return_datetime
      - varsha_lagna (sign, degree, lord)
      - muntha
      - varsha_pati
      - tri_pataki
      - planets (9 grahas with sign, nakshatra, house, etc.)
    """
    # 1. Natal Sun longitude
    birth_jd     = _to_jd(birth_date, birth_time, birth_tz)
    natal_sun_lon = _sidereal_lon(birth_jd, swe.SUN)

    # 2. Solar return JD
    sr_jd = _find_solar_return(natal_sun_lon, target_year)

    # 3. Solar return datetime in query timezone
    tz_obj   = pytz.timezone(query_tz)
    sr_dt    = _jd_to_local_dt(sr_jd, tz_obj)

    # 4. Varsha Lagna (ascendant at solar return, query location)
    varsha_lagna_lon  = _compute_ascendant(sr_jd, query_lat, query_lon)
    varsha_lagna_sign = _sign_of(varsha_lagna_lon)
    varsha_lagna_deg  = round(_deg_in_sign(varsha_lagna_lon), 2)

    # 5. All planet positions at solar return
    planets = {}
    for name, pid in PLANET_IDS.items():
        lon = _sidereal_lon(sr_jd, pid)
        planets[name] = _planet_detail(lon, varsha_lagna_lon)
        planets[name]['symbol'] = PLANET_SYMBOLS.get(name, '')

    # Ketu = opposite Rahu
    rahu_lon = planets['Rahu']['longitude']
    ketu_lon = (rahu_lon + 180.0) % 360.0
    planets['Ketu'] = _planet_detail(ketu_lon, varsha_lagna_lon)
    planets['Ketu']['symbol'] = PLANET_SYMBOLS['Ketu']

    # 6. Muntha
    birth_year = int(birth_date[:4])
    natal_lagna_sign = _sign_of(birth_lagna_lon)
    muntha = _compute_muntha(natal_lagna_sign, birth_year, target_year)

    # Muntha house from Varsha Lagna
    muntha_lon = (SIGNS.index(muntha['sign']) * 30 + 15)  # midpoint of muntha sign
    muntha['house'] = _house_of(muntha_lon, varsha_lagna_lon)

    # 7. Varsha Pati
    varsha_pati = _compute_varsha_pati(sr_jd, query_lat, query_lon)

    # 8. Tri-Pataki
    tri_pataki = _tri_pataki(varsha_lagna_sign)

    # 9. Age
    age = target_year - birth_year

    return {
        'target_year':    target_year,
        'age':            age,
        'solar_return':   sr_dt,
        'natal_sun_lon':  round(natal_sun_lon, 4),
        'natal_sun_sign': _sign_of(natal_sun_lon),
        'varsha_lagna': {
            'longitude':  round(varsha_lagna_lon, 4),
            'sign':       varsha_lagna_sign,
            'degree':     varsha_lagna_deg,
            'lord':       SIGN_LORDS[varsha_lagna_sign],
            'symbol':     '',
        },
        'muntha':       muntha,
        'varsha_pati':  varsha_pati,
        'tri_pataki':   tri_pataki,
        'planets':      planets,
    }
