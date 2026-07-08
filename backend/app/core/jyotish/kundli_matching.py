"""
backend/app/core/jyotish/kundli_matching.py

Ashtakoot (36 Guna) Kundli Matching Engine.

Implements all 8 Kootas:
  1. Varna   (1 pt)  — Social compatibility
  2. Vashya  (2 pts) — Attraction / control
  3. Tara    (3 pts) — Birth-star compatibility
  4. Yoni    (4 pts) — Physical / temperamental harmony
  5. Graha Maitri (5 pts) — Planetary friendship
  6. Gana    (6 pts) — Temperament (Deva / Manav / Rakshasa)
  7. Bhakut  (7 pts) — Moon-sign relationship
  8. Nadi    (8 pts) — Health / progeny (most critical)

Total: 36 Gunas.

Uses Swiss Ephemeris sidereal (Lahiri) for Moon position computation.
"""

from __future__ import annotations

import pytz
from datetime import date, datetime
import swisseph as swe

# ── Nakshatra data ─────────────────────────────────────────────────────────────

NAKSHATRA_NAMES = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni",
    "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha",
    "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha",
    "Shravana", "Dhanishtha", "Shatabhisha", "Purva Bhadra",
    "Uttara Bhadra", "Revati",
]

RASHI_NAMES = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]

# ── 1. VARNA ───────────────────────────────────────────────────────────────────
# 0=Brahmin (highest), 1=Kshatriya, 2=Vaishya, 3=Shudra
# By Moon sign (0=Aries … 11=Pisces)
VARNA = [1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0]
VARNA_NAMES = ["Brahmin", "Kshatriya", "Vaishya", "Shudra"]


def score_varna(boy_sign: int, girl_sign: int) -> dict:
    bv, gv = VARNA[boy_sign], VARNA[girl_sign]
    # Boy's varna must be >= girl's (higher or equal social order)
    score = 1 if bv <= gv else 0   # lower index = higher varna
    return {
        "koot": "Varna", "max": 1, "score": score,
        "boy_varna": VARNA_NAMES[bv], "girl_varna": VARNA_NAMES[gv],
        "description": "Social and spiritual compatibility.",
        "detail": (
            f"Boy is {VARNA_NAMES[bv]}, Girl is {VARNA_NAMES[gv]}. "
            + ("Compatible — boy's social order is equal or higher." if score == 1
               else "Mismatch — boy's social order is lower than girl's.")
        ),
    }


# ── 2. VASHYA ──────────────────────────────────────────────────────────────────
# Signs each sign "controls/attracts" (0-indexed)
VASHYA: dict[int, list[int]] = {
    0:  [4, 7],    # Aries attracts Leo, Scorpio
    1:  [3, 6],    # Taurus attracts Cancer, Libra
    2:  [8, 11],   # Gemini attracts Virgo (8), Pisces (11)? Actually Sagittarius
    3:  [7, 8],    # Cancer attracts Scorpio, Sagittarius -- adjusted
    4:  [6, 7],    # Leo attracts Libra, Scorpio
    5:  [11, 2],   # Virgo attracts Pisces, Gemini
    6:  [9, 8],    # Libra attracts Capricorn, Virgo
    7:  [3, 8],    # Scorpio attracts Cancer, Virgo
    8:  [11, 0],   # Sagittarius attracts Pisces, Aries
    9:  [0, 10],   # Capricorn attracts Aries, Aquarius
    10: [0, 11],   # Aquarius attracts Aries, Pisces
    11: [3, 9],    # Pisces attracts Cancer, Capricorn
}


def score_vashya(boy_sign: int, girl_sign: int) -> dict:
    boy_attracts_girl = girl_sign in VASHYA.get(boy_sign, [])
    girl_attracts_boy = boy_sign  in VASHYA.get(girl_sign, [])

    if boy_attracts_girl and girl_attracts_boy:
        score = 2
        desc = "Mutual attraction and control — strongest Vashya."
    elif boy_attracts_girl:
        score = 1
        desc = "Boy attracts girl — good compatibility."
    elif girl_attracts_boy:
        score = 1
        desc = "Girl attracts boy — fair compatibility."
    else:
        score = 0
        desc = "No vashya relationship — compatibility needs other supports."

    return {
        "koot": "Vashya", "max": 2, "score": score,
        "description": "Mutual attraction and dominance between partners.",
        "detail": desc,
    }


# ── 3. TARA ────────────────────────────────────────────────────────────────────
# Auspicious taras: count % 9 in {0, 2, 4, 6, 8}; inauspicious: {1, 3, 5, 7}
TARA_NAMES = {
    1: "Janma", 2: "Sampat", 3: "Vipat", 4: "Kshema",
    5: "Pratyak", 6: "Sadhak", 7: "Vadha", 8: "Mitra", 0: "Param Mitra",
}
TARA_AUSPICIOUS = {0, 2, 4, 6, 8}


def _tara_type(from_nak: int, to_nak: int) -> tuple[int, bool]:
    count = (to_nak - from_nak) % 27 + 1
    rem   = count % 9
    return rem, rem in TARA_AUSPICIOUS


def score_tara(boy_nak: int, girl_nak: int) -> dict:
    boy_rem, boy_auspicious = _tara_type(boy_nak, girl_nak)
    girl_rem, girl_auspicious = _tara_type(girl_nak, boy_nak)

    if boy_auspicious and girl_auspicious:
        score = 3
    elif boy_auspicious or girl_auspicious:
        score = 1.5
    else:
        score = 0

    return {
        "koot": "Tara", "max": 3, "score": score,
        "description": "Birth-star compatibility — health and longevity.",
        "boy_tara": TARA_NAMES[boy_rem],
        "girl_tara": TARA_NAMES[girl_rem],
        "detail": (
            f"Boy's Tara: {TARA_NAMES[boy_rem]} ({'auspicious' if boy_auspicious else 'inauspicious'}). "
            f"Girl's Tara: {TARA_NAMES[girl_rem]} ({'auspicious' if girl_auspicious else 'inauspicious'})."
        ),
    }


# ── 4. YONI ────────────────────────────────────────────────────────────────────
YONI_ANIMAL = [
    "Horse",    # 0  Ashwini
    "Elephant", # 1  Bharani
    "Goat",     # 2  Krittika
    "Serpent",  # 3  Rohini
    "Serpent",  # 4  Mrigashira
    "Dog",      # 5  Ardra
    "Cat",      # 6  Punarvasu
    "Goat",     # 7  Pushya
    "Cat",      # 8  Ashlesha
    "Rat",      # 9  Magha
    "Rat",      # 10 Purva Phalguni
    "Cow",      # 11 Uttara Phalguni
    "Buffalo",  # 12 Hasta
    "Tiger",    # 13 Chitra
    "Buffalo",  # 14 Swati
    "Tiger",    # 15 Vishakha
    "Deer",     # 16 Anuradha
    "Deer",     # 17 Jyeshtha
    "Dog",      # 18 Mula
    "Monkey",   # 19 Purva Ashadha
    "Mongoose", # 20 Uttara Ashadha
    "Monkey",   # 21 Shravana
    "Lion",     # 22 Dhanishtha
    "Horse",    # 23 Shatabhisha
    "Lion",     # 24 Purva Bhadra
    "Cow",      # 25 Uttara Bhadra
    "Elephant", # 26 Revati
]

YONI_ENEMIES = {
    frozenset(["Cow",      "Tiger"    ]),
    frozenset(["Elephant", "Lion"     ]),
    frozenset(["Horse",    "Buffalo"  ]),
    frozenset(["Dog",      "Deer"     ]),
    frozenset(["Cat",      "Rat"      ]),
    frozenset(["Serpent",  "Mongoose" ]),
    frozenset(["Monkey",   "Goat"     ]),
}


def score_yoni(boy_nak: int, girl_nak: int) -> dict:
    ba, ga = YONI_ANIMAL[boy_nak], YONI_ANIMAL[girl_nak]
    pair   = frozenset([ba, ga])

    if ba == ga:
        score = 4
        desc  = f"Same animal ({ba}) — best physical and temperamental harmony."
    elif pair in YONI_ENEMIES:
        score = 0
        desc  = f"{ba} and {ga} are enemy yonis — significant incompatibility."
    else:
        score = 2
        desc  = f"{ba} and {ga} — neutral yoni relationship."

    return {
        "koot": "Yoni", "max": 4, "score": score,
        "description": "Physical, instinctual and sexual compatibility.",
        "boy_yoni": ba, "girl_yoni": ga,
        "detail": desc,
    }


# ── 5. GRAHA MAITRI ────────────────────────────────────────────────────────────
# Moon sign lord for each sign (0=Sun, 1=Moon, 2=Mars, 3=Mercury, 4=Jupiter, 5=Venus, 6=Saturn)
SIGN_LORD = [2, 5, 3, 1, 0, 3, 5, 2, 4, 6, 6, 4]
LORD_NAMES = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]

# Friendship table: FRIENDSHIP[a][b] = "friend"/"neutral"/"enemy"
FRIENDSHIP: dict[int, dict[int, str]] = {
    0: {0:"friend", 1:"friend", 2:"friend", 3:"neutral", 4:"friend", 5:"enemy",  6:"enemy" },  # Sun
    1: {0:"friend", 1:"friend", 2:"neutral",3:"friend",  4:"neutral",5:"neutral",6:"neutral"},  # Moon
    2: {0:"friend", 1:"friend", 2:"friend", 3:"enemy",   4:"friend", 5:"neutral",6:"neutral"},  # Mars
    3: {0:"friend", 1:"enemy",  2:"neutral",3:"friend",  4:"neutral",5:"friend", 6:"neutral"},  # Mercury
    4: {0:"friend", 1:"friend", 2:"friend", 3:"enemy",   4:"friend", 5:"enemy",  6:"neutral"},  # Jupiter
    5: {0:"enemy",  1:"enemy",  2:"neutral",3:"friend",  4:"neutral",5:"friend", 6:"friend" },  # Venus
    6: {0:"enemy",  1:"enemy",  2:"enemy",  3:"neutral", 4:"neutral",5:"friend", 6:"friend" },  # Saturn
}

_SCORE_MAP = {
    ("friend",  "friend"):  5,
    ("friend",  "neutral"): 4,
    ("neutral", "friend"):  4,
    ("neutral", "neutral"): 3,
    ("friend",  "enemy"):   2,
    ("enemy",   "friend"):  2,
    ("neutral", "enemy"):   1,
    ("enemy",   "neutral"): 1,
    ("enemy",   "enemy"):   0,
}


def score_graha_maitri(boy_sign: int, girl_sign: int) -> dict:
    bl = SIGN_LORD[boy_sign]
    gl = SIGN_LORD[girl_sign]

    if bl == gl:
        score = 5
        desc  = f"Same lord ({LORD_NAMES[bl]}) — perfect mental compatibility."
    else:
        b_views_g = FRIENDSHIP[bl][gl]
        g_views_b = FRIENDSHIP[gl][bl]
        score = _SCORE_MAP.get((b_views_g, g_views_b), 3)
        desc  = (
            f"{LORD_NAMES[bl]} (boy's lord) views {LORD_NAMES[gl]} as {b_views_g}; "
            f"{LORD_NAMES[gl]} (girl's lord) views {LORD_NAMES[bl]} as {g_views_b}."
        )

    return {
        "koot": "Graha Maitri", "max": 5, "score": score,
        "description": "Mental compatibility and mutual respect between lords.",
        "boy_lord": LORD_NAMES[bl], "girl_lord": LORD_NAMES[gl],
        "detail": desc,
    }


# ── 6. GANA ────────────────────────────────────────────────────────────────────
# 0=Deva, 1=Manav, 2=Rakshasa
GANA = [
    0, 1, 2, 1, 0, 0, 0, 0, 2, 2,  # 0-9  Ashwini-Magha
    1, 1, 0, 2, 0, 2, 0, 2, 0, 1,  # 10-19 P.Phalguni-P.Ashadha
    1, 0, 2, 2, 1, 1, 0,            # 20-26 U.Ashadha-Revati
]
GANA_NAMES = ["Deva", "Manav", "Rakshasa"]

# Score table: GANA_SCORE[boy_gana][girl_gana]
GANA_SCORE = [
    [6, 5, 1],  # Boy=Deva:     Deva=6, Manav=5, Rakshasa=1
    [5, 6, 0],  # Boy=Manav:    Deva=5, Manav=6, Rakshasa=0
    [0, 0, 6],  # Boy=Rakshasa: Deva=0, Manav=0, Rakshasa=6
]

GANA_DETAIL = {
    (0, 0): "Both Deva — sattvic, harmonious temperament. Ideal.",
    (1, 1): "Both Manav — practical, balanced natures. Very compatible.",
    (2, 2): "Both Rakshasa — intense, passionate natures. Compatible but volatile.",
    (0, 1): "Deva boy, Manav girl — good match with minor adjustments.",
    (1, 0): "Manav boy, Deva girl — good match with minor adjustments.",
    (0, 2): "Deva boy, Rakshasa girl — significant temperament differences.",
    (2, 0): "Rakshasa boy, Deva girl — Gana Dosha — not recommended without remedies.",
    (1, 2): "Manav boy, Rakshasa girl — Gana Dosha — significant issues.",
    (2, 1): "Rakshasa boy, Manav girl — Gana Dosha — significant issues.",
}


def score_gana(boy_nak: int, girl_nak: int) -> dict:
    bg = GANA[boy_nak]
    gg = GANA[girl_nak]
    score = GANA_SCORE[bg][gg]
    has_dosha = score == 0

    return {
        "koot": "Gana", "max": 6, "score": score,
        "description": "Temperament and character compatibility.",
        "boy_gana": GANA_NAMES[bg], "girl_gana": GANA_NAMES[gg],
        "gana_dosha": has_dosha,
        "detail": GANA_DETAIL.get((bg, gg), ""),
    }


# ── 7. BHAKUT ──────────────────────────────────────────────────────────────────
# Bad pairs: 2/12, 6/8 (Bhakut Dosha)
BHAKUT_GOOD_DETAIL = "Auspicious Bhakut — favourable relationship between Moon signs."
BHAKUT_BAD_DETAIL = {
    "2/12": "Bhakut Dosha (2/12) — financial hardships and emotional distance. Remedies required.",
    "6/8":  "Bhakut Dosha (6/8) — the most inauspicious Bhakut — health, longevity, and prosperity affected. Strong remedies required.",
}


def score_bhakut(boy_sign: int, girl_sign: int) -> dict:
    pos_g_from_b = (girl_sign - boy_sign) % 12 + 1
    pos_b_from_g = (boy_sign - girl_sign) % 12 + 1

    pair = frozenset([pos_g_from_b, pos_b_from_g])
    if pair == frozenset([2, 12]):
        score = 0; dosha = "2/12"; detail = BHAKUT_BAD_DETAIL["2/12"]
    elif pair == frozenset([6, 8]):
        score = 0; dosha = "6/8";  detail = BHAKUT_BAD_DETAIL["6/8"]
    else:
        score = 7; dosha = None;   detail = BHAKUT_GOOD_DETAIL

    return {
        "koot": "Bhakut", "max": 7, "score": score,
        "description": "Moon-sign relationship — love, prosperity, progeny.",
        "pos_girl_from_boy": pos_g_from_b,
        "pos_boy_from_girl": pos_b_from_g,
        "bhakut_dosha": dosha,
        "detail": detail,
    }


# ── 8. NADI ────────────────────────────────────────────────────────────────────
# 0=Adi, 1=Madhya, 2=Antya
NADI = [
    0, 1, 2, 2, 1, 0, 0, 1, 2, 2,  # 0-9
    1, 0, 1, 2, 0, 1, 2, 2, 0, 1,  # 10-19
    2, 0, 1, 0, 0, 1, 2,            # 20-26
]
NADI_NAMES = ["Adi", "Madhya", "Antya"]


def score_nadi(boy_nak: int, girl_nak: int) -> dict:
    bn = NADI[boy_nak]
    gn = NADI[girl_nak]
    has_dosha = bn == gn
    score = 0 if has_dosha else 8

    return {
        "koot": "Nadi", "max": 8, "score": score,
        "description": "Health, progeny and genetic compatibility — the most critical koot.",
        "boy_nadi": NADI_NAMES[bn], "girl_nadi": NADI_NAMES[gn],
        "nadi_dosha": has_dosha,
        "detail": (
            f"Both have {NADI_NAMES[bn]} Nadi — Nadi Dosha present. "
            "This is the most critical dosha in Kundli matching. Remedies are strongly recommended."
            if has_dosha else
            f"Boy: {NADI_NAMES[bn]} Nadi, Girl: {NADI_NAMES[gn]} Nadi — compatible. Full 8 points."
        ),
    }


# ── Ephemeris helper ───────────────────────────────────────────────────────────

def _moon_position(dob: str, tob: str, timezone_str: str) -> tuple[float, int, int]:
    """Return (moon_longitude, sign_index, nak_index) sidereal Lahiri."""
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    tz_obj = pytz.timezone(timezone_str)
    parts  = tob.split(":")
    hour   = int(parts[0]); minute = int(parts[1])
    second = int(parts[2]) if len(parts) > 2 else 0
    d      = date.fromisoformat(dob)
    local  = tz_obj.localize(datetime(d.year, d.month, d.day, hour, minute, second))
    utc    = local.astimezone(pytz.utc)
    jd     = swe.julday(utc.year, utc.month, utc.day,
                        utc.hour + utc.minute / 60.0 + utc.second / 3600.0)
    result, _ = swe.calc_ut(jd, swe.MOON, swe.FLG_SIDEREAL)
    lon    = result[0] % 360.0
    sign   = int(lon / 30)
    nak    = int(lon / (360 / 27))
    return round(lon, 4), sign, nak


# ── Verdict ────────────────────────────────────────────────────────────────────

def _verdict(total: float) -> dict:
    pct = round(total / 36 * 100, 1)
    if total < 18:
        return {"label": "Not Recommended",          "color": "red",    "pct": pct,
                "desc": "The match falls below the minimum threshold of 18 Gunas. Marriage is strongly discouraged without significant astrological remedies."}
    elif total < 24:
        return {"label": "Average — Effort Required", "color": "orange", "pct": pct,
                "desc": "An acceptable match, but differences in temperament and energy will need conscious effort. Professional astrological guidance is advised."}
    elif total < 28:
        return {"label": "Good Match",                "color": "gold",   "pct": pct,
                "desc": "A good compatibility score. The couple will share understanding and growth. Minor differences can be worked through with communication."}
    elif total < 32:
        return {"label": "Very Good Match",           "color": "green",  "pct": pct,
                "desc": "A very compatible match. Strong alignment across most life areas. The relationship will generally be harmonious and mutually supportive."}
    else:
        return {"label": "Excellent Match",           "color": "emerald","pct": pct,
                "desc": "An exceptional compatibility score. Rare and auspicious — the couple is highly compatible across all dimensions of life."}


# ── Public entry point ─────────────────────────────────────────────────────────

def compute_kundli_match(
    p1_dob: str, p1_tob: str, p1_tz: str, p1_name: str,
    p2_dob: str, p2_tob: str, p2_tz: str, p2_name: str,
) -> dict:
    """
    Compute Ashtakoot compatibility between two people.

    Args:
        p1/p2: dob (YYYY-MM-DD), tob (HH:MM), timezone, name

    Returns full 36-Guna report.
    """
    lon1, sign1, nak1 = _moon_position(p1_dob, p1_tob, p1_tz)
    lon2, sign2, nak2 = _moon_position(p2_dob, p2_tob, p2_tz)

    # Run all 8 kootas (boy = person 1, girl = person 2 by convention)
    kootas = [
        score_varna(sign1, sign2),
        score_vashya(sign1, sign2),
        score_tara(nak1, nak2),
        score_yoni(nak1, nak2),
        score_graha_maitri(sign1, sign2),
        score_gana(nak1, nak2),
        score_bhakut(sign1, sign2),
        score_nadi(nak1, nak2),
    ]

    total    = sum(k["score"] for k in kootas)
    verdict  = _verdict(total)

    # Identify doshas
    doshas = []
    for k in kootas:
        if k.get("nadi_dosha"):
            doshas.append({"name": "Nadi Dosha", "severity": "critical",
                           "desc": "Same Nadi — health and progeny affected. Most serious dosha in matching."})
        if k.get("bhakut_dosha"):
            doshas.append({"name": f"Bhakut Dosha ({k['bhakut_dosha']})", "severity": "high",
                           "desc": k["detail"]})
        if k.get("gana_dosha"):
            doshas.append({"name": "Gana Dosha", "severity": "medium",
                           "desc": "Temperament mismatch — Rakshasa and Deva/Manav combination."})

    return {
        "person1": {
            "name":      p1_name,
            "moon_sign": RASHI_NAMES[sign1],
            "nakshatra": NAKSHATRA_NAMES[nak1],
            "moon_lon":  lon1,
        },
        "person2": {
            "name":      p2_name,
            "moon_sign": RASHI_NAMES[sign2],
            "nakshatra": NAKSHATRA_NAMES[nak2],
            "moon_lon":  lon2,
        },
        "kootas":  kootas,
        "total":   total,
        "max":     36,
        "verdict": verdict,
        "doshas":  doshas,
    }
