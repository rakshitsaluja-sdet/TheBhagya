"""
backend/app/core/jyotish/dasha.py

Vimshottari Dasha calculator.
- Computes Mahadasha, Antardasha, and Pratyantardasha trees.
- Uses Moon's nakshatra at birth to determine starting dasha and balance.
- Total Vimshottari cycle = 120 years.
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import Optional

from .nakshatra import NAKSHATRA_SPAN, get_nakshatra_info

# ── Vimshottari constants ─────────────────────────────────────────────────

# Standard sequence (9 planets, cycling)
DASHA_SEQUENCE: list[str] = [
    "Ketu", "Venus", "Sun", "Moon", "Mars",
    "Rahu", "Jupiter", "Saturn", "Mercury",
]

# Each planet's Mahadasha duration in years
DASHA_YEARS: dict[str, int] = {
    "Ketu":    7,
    "Venus":   20,
    "Sun":     6,
    "Moon":    10,
    "Mars":    7,
    "Rahu":    18,
    "Jupiter": 16,
    "Saturn":  19,
    "Mercury": 17,
}

TOTAL_YEARS: int = 120  # sum of all dasha years

# Days in a Vimshottari year (360-day sidereal year used in classical texts)
# Most software uses 365.25 days — we use 365.25 for accuracy with Gregorian calendar
DAYS_PER_YEAR: float = 365.25


def _years_to_days(years: float) -> float:
    return years * DAYS_PER_YEAR


def _start_planet_and_balance(moon_longitude: float) -> tuple[str, float]:
    """
    Given Moon's sidereal longitude, return:
      (starting_dasha_lord, remaining_years_of_that_dasha_at_birth)

    The nakshatra lord's dasha is active at birth.
    Balance = (fraction of nakshatra remaining) × full dasha period.
    """
    nak_info = get_nakshatra_info(moon_longitude)
    lord = nak_info["lord"]
    fraction_elapsed = nak_info["fraction_elapsed"]
    fraction_remaining = 1.0 - fraction_elapsed
    balance_years = fraction_remaining * DASHA_YEARS[lord]
    return lord, balance_years


def _sequence_from(lord: str) -> list[str]:
    """Return the full 9-planet dasha sequence starting from the given lord."""
    idx = DASHA_SEQUENCE.index(lord)
    return DASHA_SEQUENCE[idx:] + DASHA_SEQUENCE[:idx]


def compute_dasha_tree(
    moon_longitude: float,
    birth_date: date,
    levels: int = 2,
) -> list[dict]:
    """
    Compute the Vimshottari dasha tree from birth.

    Args:
        moon_longitude: Moon's sidereal longitude (degrees).
        birth_date:     Native's date of birth.
        levels:         Depth — 1 = Mahadasha only, 2 = + Antardasha,
                        3 = + Pratyantardasha (slow, use sparingly).

    Returns:
        List of Mahadasha dicts, each with nested antardashas if levels >= 2.
    """
    start_lord, balance_years = _start_planet_and_balance(moon_longitude)
    md_sequence = _sequence_from(start_lord)

    dashas: list[dict] = []
    cursor: date = birth_date

    for i, md_lord in enumerate(md_sequence):
        # First MD uses the remaining balance; subsequent MDs use full period
        md_years = balance_years if i == 0 else float(DASHA_YEARS[md_lord])
        md_days  = _years_to_days(md_years)
        md_end   = cursor + timedelta(days=md_days)

        md_entry: dict = {
            "lord":       md_lord,
            "years":      round(md_years, 4),
            "start":      cursor.isoformat(),
            "end":        md_end.isoformat(),
            "antardashas": [],
        }

        if levels >= 2:
            md_entry["antardashas"] = _compute_antardashas(
                md_lord, md_years, cursor, levels
            )

        dashas.append(md_entry)
        cursor = md_end

    return dashas


def _compute_antardashas(
    md_lord: str,
    md_years: float,
    md_start: date,
    levels: int,
) -> list[dict]:
    """Compute Antardasha (sub-period) entries within a given Mahadasha."""
    ad_sequence = _sequence_from(md_lord)  # AD starts with MD lord
    antardashas: list[dict] = []
    cursor = md_start

    for ad_lord in ad_sequence:
        # AD duration = (MD years × AD planet years) / 120
        ad_years = (md_years * DASHA_YEARS[ad_lord]) / TOTAL_YEARS
        ad_days  = _years_to_days(ad_years)
        ad_end   = cursor + timedelta(days=ad_days)

        ad_entry: dict = {
            "lord":              ad_lord,
            "years":             round(ad_years, 4),
            "start":             cursor.isoformat(),
            "end":               ad_end.isoformat(),
            "pratyantardashas":  [],
        }

        if levels >= 3:
            ad_entry["pratyantardashas"] = _compute_pratyantardashas(
                md_lord, ad_lord, ad_years, cursor
            )

        antardashas.append(ad_entry)
        cursor = ad_end

    return antardashas


def _compute_pratyantardashas(
    md_lord: str,
    ad_lord: str,
    ad_years: float,
    ad_start: date,
) -> list[dict]:
    """Compute Pratyantardasha (sub-sub-period) entries within an Antardasha."""
    pad_sequence = _sequence_from(ad_lord)
    pratyantardashas: list[dict] = []
    cursor = ad_start

    for pad_lord in pad_sequence:
        # PAD duration = (AD years × PAD planet years) / 120
        pad_years = (ad_years * DASHA_YEARS[pad_lord]) / TOTAL_YEARS
        pad_days  = _years_to_days(pad_years)
        pad_end   = cursor + timedelta(days=pad_days)

        pratyantardashas.append({
            "lord":  pad_lord,
            "years": round(pad_years, 4),
            "start": cursor.isoformat(),
            "end":   pad_end.isoformat(),
        })
        cursor = pad_end

    return pratyantardashas


def current_dasha(dasha_tree: list[dict], as_of: Optional[date] = None) -> dict:
    """
    Find the currently active Mahadasha and Antardasha from a computed tree.

    Args:
        dasha_tree: Output from compute_dasha_tree(levels=2).
        as_of:      Reference date (defaults to today).

    Returns:
        {
            "mahadasha":   {...},   # active MD entry
            "antardasha":  {...},   # active AD entry (or None)
        }
    """
    today = as_of or date.today()

    if not dasha_tree:
        return {"mahadasha": None, "antardasha": None}

    for md in dasha_tree:
        md_start = date.fromisoformat(md["start"])
        md_end   = date.fromisoformat(md["end"])
        if md_start <= today < md_end:
            active_ad = None
            for ad in md.get("antardashas", []):
                ad_start = date.fromisoformat(ad["start"])
                ad_end   = date.fromisoformat(ad["end"])
                if ad_start <= today < ad_end:
                    active_ad = ad
                    break
            return {"mahadasha": md, "antardasha": active_ad}

    # Edge case: today is beyond the full 120-year tree
    return {"mahadasha": dasha_tree[-1], "antardasha": None}
