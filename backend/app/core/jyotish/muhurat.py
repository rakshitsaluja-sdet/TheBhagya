"""
backend/app/core/jyotish/muhurat.py

Muhurat Finder — auspicious date/window selection engine.

Extends the Panchang system to score each calendar day for a given
event type based on classical Jyotish rules (nakshatra, tithi, vara,
yoga, paksha) and returns the best windows sorted by score.
"""

from __future__ import annotations

import logging
from datetime import date, timedelta
from typing import Optional

from app.core.jyotish.panchang import compute_panchang

logger = logging.getLogger(__name__)

# ── Event rule definitions ────────────────────────────────────────────────────

EVENT_RULES: dict[str, dict] = {
    "vivah": {
        "label": "Vivah (Marriage)",
        "good_nakshatras": [
            "Rohini", "Mrigashira", "Magha", "Uttara Phalguni", "Hasta", "Swati",
            "Anuradha", "Mula", "Uttara Ashadha", "Uttara Bhadrapada", "Revati",
        ],
        "bad_nakshatras": [
            "Bharani", "Krittika", "Ardra", "Ashlesha", "Jyeshtha",
            "Purva Ashadha", "Purva Bhadrapada", "Shatabhisha",
        ],
        "good_tithis":    [2, 3, 5, 6, 7, 10, 11, 12, 13],
        "bad_tithis":     [4, 8, 9, 14, 30],
        "good_paksha":    ["Shukla"],
        "good_varas":     ["Monday", "Wednesday", "Thursday", "Friday"],
        "bad_varas":      ["Tuesday", "Saturday"],
        "good_yogas":     ["Saubhagya", "Shobhana", "Sukarma", "Dhriti", "Siddhi", "Shubha", "Brahma"],
        "bad_yogas":      ["Vishkambha", "Atiganda", "Shula", "Ganda", "Vyaghata", "Vajra", "Vaidhriti"],
        "avoid_rahu_kaal": True,
    },
    "griha_pravesh": {
        "label": "Griha Pravesh (Housewarming)",
        "good_nakshatras": [
            "Rohini", "Mrigashira", "Punarvasu", "Uttara Phalguni", "Hasta",
            "Chitra", "Anuradha", "Shravana", "Dhanishtha", "Uttara Bhadrapada", "Revati",
        ],
        "bad_nakshatras": [
            "Bharani", "Krittika", "Ardra", "Ashlesha", "Magha", "Jyeshtha",
            "Mula", "Purva Ashadha", "Purva Bhadrapada",
        ],
        "good_tithis":    [2, 3, 5, 6, 7, 10, 11, 12, 13, 15],
        "bad_tithis":     [4, 8, 9, 14, 30],
        "good_paksha":    ["Shukla"],
        "good_varas":     ["Monday", "Wednesday", "Thursday", "Friday"],
        "bad_varas":      ["Tuesday", "Saturday"],
        "good_yogas":     ["Priti", "Ayushman", "Saubhagya", "Sukarma", "Dhriti"],
        "bad_yogas":      ["Vishkambha", "Atiganda", "Shula", "Ganda"],
        "avoid_rahu_kaal": True,
    },
    "vehicle": {
        "label": "Vahana Puja (Vehicle Purchase)",
        "good_nakshatras": [
            "Ashwini", "Rohini", "Mrigashira", "Punarvasu", "Hasta",
            "Chitra", "Swati", "Anuradha", "Shravana", "Revati",
        ],
        "bad_nakshatras": [
            "Bharani", "Krittika", "Ashlesha", "Magha", "Jyeshtha", "Mula",
        ],
        "good_tithis":    [2, 3, 5, 6, 7, 10, 11, 12, 13],
        "bad_tithis":     [4, 8, 9, 14, 30],
        "good_paksha":    ["Shukla"],
        "good_varas":     ["Monday", "Wednesday", "Thursday", "Friday"],
        "bad_varas":      ["Tuesday", "Saturday"],
        "good_yogas":     ["Ayushman", "Saubhagya", "Sukarma", "Dhriti"],
        "bad_yogas":      ["Vishkambha", "Atiganda", "Shula"],
        "avoid_rahu_kaal": True,
    },
    "business": {
        "label": "Vyapar Aarambh (Business Start)",
        "good_nakshatras": [
            "Ashwini", "Rohini", "Mrigashira", "Punarvasu", "Pushya",
            "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Anuradha",
            "Shravana", "Revati",
        ],
        "bad_nakshatras": [
            "Bharani", "Ardra", "Ashlesha", "Magha", "Jyeshtha", "Mula",
        ],
        "good_tithis":    [2, 3, 5, 6, 7, 10, 11, 12, 13],
        "bad_tithis":     [4, 8, 9, 14, 30],
        "good_paksha":    ["Shukla"],
        "good_varas":     ["Wednesday", "Thursday", "Friday"],
        "bad_varas":      ["Saturday"],
        "good_yogas":     ["Priti", "Ayushman", "Sukarma", "Dhriti", "Siddhi"],
        "bad_yogas":      ["Vishkambha", "Atiganda", "Shula", "Ganda"],
        "avoid_rahu_kaal": True,
    },
    "travel": {
        "label": "Yatra (Travel / Journey)",
        "good_nakshatras": [
            "Ashwini", "Mrigashira", "Punarvasu", "Pushya", "Hasta",
            "Swati", "Anuradha", "Shravana", "Revati",
        ],
        "bad_nakshatras": [
            "Bharani", "Krittika", "Ardra", "Ashlesha", "Jyeshtha",
            "Mula", "Purva Ashadha",
        ],
        "good_tithis":    [2, 3, 5, 6, 7, 10, 11, 12, 13],
        "bad_tithis":     [4, 8, 9, 14, 30],
        "good_paksha":    ["Shukla"],
        "good_varas":     ["Monday", "Wednesday", "Thursday", "Friday"],
        "bad_varas":      ["Tuesday", "Saturday"],
        "good_yogas":     ["Priti", "Ayushman", "Saubhagya", "Sukarma"],
        "bad_yogas":      ["Vishkambha", "Shula", "Ganda", "Vyaghata"],
        "avoid_rahu_kaal": True,
    },
    "bhoomi_pujan": {
        "label": "Bhoomi Pujan (Ground Breaking)",
        "good_nakshatras": [
            "Rohini", "Mrigashira", "Punarvasu", "Uttara Phalguni",
            "Chitra", "Anuradha", "Uttara Ashadha", "Shravana",
        ],
        "bad_nakshatras": [
            "Bharani", "Krittika", "Ardra", "Ashlesha", "Magha",
            "Jyeshtha", "Mula", "Purva Ashadha",
        ],
        "good_tithis":    [2, 3, 5, 6, 7, 10, 11, 12, 13],
        "bad_tithis":     [4, 8, 9, 14, 30],
        "good_paksha":    ["Shukla"],
        "good_varas":     ["Wednesday", "Thursday", "Friday"],
        "bad_varas":      ["Tuesday", "Saturday"],
        "good_yogas":     ["Ayushman", "Saubhagya", "Sukarma", "Dhriti"],
        "bad_yogas":      ["Vishkambha", "Atiganda", "Shula", "Ganda"],
        "avoid_rahu_kaal": True,
    },
    "namakaran": {
        "label": "Namakaran (Baby Naming Ceremony)",
        "good_nakshatras": [
            "Ashwini", "Rohini", "Mrigashira", "Punarvasu", "Pushya",
            "Hasta", "Swati", "Anuradha", "Shravana", "Revati",
        ],
        "bad_nakshatras": [
            "Bharani", "Ardra", "Ashlesha", "Jyeshtha", "Mula",
        ],
        "good_tithis":    [2, 3, 5, 6, 7, 10, 11, 12, 13],
        "bad_tithis":     [4, 8, 9, 14, 30],
        "good_paksha":    ["Shukla"],
        "good_varas":     ["Monday", "Wednesday", "Thursday", "Friday"],
        "bad_varas":      ["Tuesday"],
        "good_yogas":     ["Priti", "Ayushman", "Saubhagya", "Sukarma"],
        "bad_yogas":      ["Vishkambha", "Shula", "Ganda"],
        "avoid_rahu_kaal": True,
    },
}

# ── Scoring constants ─────────────────────────────────────────────────────────

SCORE_GOOD_NAKSHATRA  = 25
SCORE_BAD_NAKSHATRA   = -40
SCORE_GOOD_TITHI      = 20
SCORE_BAD_TITHI       = -30
SCORE_GOOD_PAKSHA     = 10
SCORE_GOOD_VARA       = 15
SCORE_BAD_VARA        = -20
SCORE_GOOD_YOGA       = 15
SCORE_BAD_YOGA        = -25

MIN_SCORE             = 30   # below this threshold, exclude day from results

# ── Helpers ───────────────────────────────────────────────────────────────────

def _quality_label(score: int) -> str:
    if score >= 80:
        return "Excellent"
    if score >= 60:
        return "Good"
    return "Fair"


def _build_notes(
    nakshatra: str,
    tithi_name: str,
    tithi_num: int,
    paksha: str,
    vara: str,
    yoga: str,
    rules: dict,
) -> list[str]:
    notes: list[str] = []

    # Nakshatra note
    if nakshatra in rules["good_nakshatras"]:
        notes.append(f"{nakshatra} nakshatra is highly auspicious for this occasion")
    elif nakshatra not in rules["bad_nakshatras"]:
        notes.append(f"{nakshatra} nakshatra is acceptable for this occasion")

    # Tithi note
    full_tithi = f"{paksha} {tithi_name}"
    if tithi_num in rules["good_tithis"]:
        notes.append(f"{full_tithi} is an auspicious lunar day")

    # Paksha note
    if paksha in rules["good_paksha"]:
        notes.append(f"Shukla Paksha (waxing moon) — ideal for new beginnings")

    # Vara note
    vara_meanings = {
        "Monday":    "Moon's day — nurturing energy, good for ceremonies",
        "Wednesday": "Mercury's day — good for new beginnings and contracts",
        "Thursday":  "Jupiter's day — most auspicious for all ceremonies",
        "Friday":    "Venus's day — harmony and prosperity",
        "Tuesday":   "Mars's day — fiery energy, avoid for auspicious events",
        "Saturday":  "Saturn's day — delays and obstacles, generally avoided",
        "Sunday":    "Sun's day — leadership and vitality",
    }
    if vara in vara_meanings:
        notes.append(f"{vara} — {vara_meanings[vara]}")

    # Yoga note
    if yoga in rules["good_yogas"]:
        notes.append(f"{yoga} yoga enhances the auspiciousness of this day")

    return notes


def _score_day(panchang: dict, rules: dict) -> tuple[int, bool]:
    """
    Score a panchang dict against event rules.
    Returns (score, disqualified).
    If disqualified, the day should be excluded regardless of score.
    """
    score = 0
    disqualified = False

    nakshatra_name = panchang["nakshatra"]["name"]
    tithi_num      = panchang["tithi"]["num"]
    paksha         = panchang["tithi"]["paksha"]
    vara_en        = panchang["vara"]["en"]
    yoga_name      = panchang["yoga"]["name"]

    # ── Nakshatra ──
    if nakshatra_name in rules["good_nakshatras"]:
        score += SCORE_GOOD_NAKSHATRA
    elif nakshatra_name in rules["bad_nakshatras"]:
        score += SCORE_BAD_NAKSHATRA
        if score < 0:
            disqualified = True
            return score, disqualified

    # ── Tithi ──
    if tithi_num in rules["bad_tithis"]:
        score += SCORE_BAD_TITHI
        disqualified = True
        return score, disqualified
    elif tithi_num in rules["good_tithis"]:
        score += SCORE_GOOD_TITHI

    # ── Paksha ──
    if paksha in rules["good_paksha"]:
        score += SCORE_GOOD_PAKSHA

    # ── Vara ──
    if vara_en in rules["good_varas"]:
        score += SCORE_GOOD_VARA
    elif vara_en in rules["bad_varas"]:
        score += SCORE_BAD_VARA

    # ── Yoga ──
    if yoga_name in rules["good_yogas"]:
        score += SCORE_GOOD_YOGA
    elif yoga_name in rules["bad_yogas"]:
        score += SCORE_BAD_YOGA

    return score, disqualified


# ── Public entry point ────────────────────────────────────────────────────────

def find_muhurats(
    event_type:  str,
    start_date:  str,
    end_date:    str,
    timezone:    str,
    lat:         float,
    lon:         float,
    max_results: int = 10,
) -> list[dict]:
    """
    Find the best auspicious Muhurat windows for a given event type
    across a date range.

    Args:
        event_type:  One of the keys in EVENT_RULES.
        start_date:  YYYY-MM-DD (inclusive).
        end_date:    YYYY-MM-DD (inclusive, max 90 days from start).
        timezone:    IANA timezone string, e.g. 'Asia/Kolkata'.
        lat:         Latitude (decimal degrees).
        lon:         Longitude (decimal degrees).
        max_results: Maximum number of results to return (default 10).

    Returns:
        List of auspicious date dicts, sorted descending by score.
    """
    if event_type not in EVENT_RULES:
        raise ValueError(
            f"Unknown event_type '{event_type}'. "
            f"Valid options: {', '.join(EVENT_RULES.keys())}"
        )

    rules     = EVENT_RULES[event_type]
    start     = date.fromisoformat(start_date)
    end       = date.fromisoformat(end_date)
    results   = []
    current   = start

    while current <= end:
        date_str = current.isoformat()
        try:
            panchang = compute_panchang(
                date_str     = date_str,
                lat          = lat,
                lon          = lon,
                timezone_str = timezone,
                time_str     = "12:00:00",
            )
        except Exception as exc:
            logger.warning("Panchang computation failed for %s: %s", date_str, exc)
            current += timedelta(days=1)
            continue

        score, disqualified = _score_day(panchang, rules)

        if not disqualified and score >= MIN_SCORE:
            nakshatra_name = panchang["nakshatra"]["name"]
            tithi          = panchang["tithi"]
            vara_en        = panchang["vara"]["en"]
            yoga_name      = panchang["yoga"]["name"]
            tithi_full     = f"{tithi['paksha']} {tithi['name']}"

            notes = _build_notes(
                nakshatra  = nakshatra_name,
                tithi_name = tithi["name"],
                tithi_num  = tithi["num"],
                paksha     = tithi["paksha"],
                vara       = vara_en,
                yoga       = yoga_name,
                rules      = rules,
            )

            results.append({
                "date":       date_str,
                "day":        vara_en,
                "score":      max(0, min(100, score)),
                "quality":    _quality_label(score),
                "tithi":      tithi_full,
                "nakshatra":  nakshatra_name,
                "yoga":       yoga_name,
                "vara":       vara_en,
                "rahu_kaal":  {
                    "start": panchang["rahu_kaal"]["start"],
                    "end":   panchang["rahu_kaal"]["end"],
                },
                "abhijit":    {
                    "start": panchang["abhijit"]["start"],
                    "end":   panchang["abhijit"]["end"],
                },
                "notes":      notes,
            })

        current += timedelta(days=1)

    # Sort by score descending and cap at max_results
    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:max_results]
