"""
backend/app/core/jyotish/sade_sati.py

Sade Sati engine.

Sade Sati = Saturn transiting 12th, 1st (Moon sign), and 2nd sign from the
natal Moon sign. Each phase is ~2.5 years; total = 7.5 years.
Cycle repeats every ~30 years (Saturn's sidereal period).

Additionally computes Ardha Sati (Dhaiyya) — Saturn transiting the 4th or 8th
from Moon sign, lasting ~2.5 years each.
"""

from __future__ import annotations

import math
from datetime import datetime, date, timedelta, timezone as tz
from typing import Optional
import swisseph as swe

# ── Rashi constants ────────────────────────────────────────────────────────────

RASHIS = [
    {"en": "Aries",       "hi": "मेष"},
    {"en": "Taurus",      "hi": "वृषभ"},
    {"en": "Gemini",      "hi": "मिथुन"},
    {"en": "Cancer",      "hi": "कर्क"},
    {"en": "Leo",         "hi": "सिंह"},
    {"en": "Virgo",       "hi": "कन्या"},
    {"en": "Libra",       "hi": "तुला"},
    {"en": "Scorpio",     "hi": "वृश्चिक"},
    {"en": "Sagittarius", "hi": "धनु"},
    {"en": "Capricorn",   "hi": "मकर"},
    {"en": "Aquarius",    "hi": "कुम्भ"},
    {"en": "Pisces",      "hi": "मीन"},
]

# Sade Sati phases relative to Moon sign
PHASE_LABELS = {
    -1: "Rising Phase (12th from Moon)",
    0:  "Peak Phase (Moon Sign)",
    1:  "Setting Phase (2nd from Moon)",
}

PHASE_DESCS = {
    -1: (
        "Saturn enters the sign preceding your Moon sign. This is the rising phase of Sade Sati. "
        "A period of subtle pressure — circumstances begin to shift. Old patterns are disrupted, "
        "long-deferred matters surface. Externally quiet but internally significant."
    ),
    0: (
        "Saturn transits directly over your Moon sign — the peak of Sade Sati. Emotional depth, "
        "karmic reckoning, and the dissolution of what no longer serves you. Demanding, but also "
        "deeply transformative. The Saturn energy here is raw; discipline and patience are essential."
    ),
    1: (
        "Saturn moves into the sign following your Moon sign. The setting phase — pressures ease "
        "gradually. Lessons of the previous 5 years begin to integrate. Relief arrives, though slowly. "
        "This is the time to consolidate and rebuild on the foundations Saturn has cleared."
    ),
}

ARDHA_DESCS = {
    4: (
        "Saturn transits your 4th house from Moon (Ardha Sati / Dhaiyya). "
        "Home, property, and domestic peace are challenged. Mother's health may need attention. "
        "Inner restlessness is possible. Duration ~2.5 years."
    ),
    8: (
        "Saturn transits your 8th house from Moon (Ardha Sati / Dhaiyya). "
        "This is the more intense of the two Ardha Sati placements — sudden events, health concerns, "
        "and transformation through crisis. Exercise caution, especially in financial matters. "
        "Duration ~2.5 years."
    ),
}

REMEDIES = [
    "Recite Shani Chalisa or Hanuman Chalisa every Saturday.",
    "Offer sesame oil (til ka tel) and a black cloth at a Shani temple on Saturdays.",
    "Fast on Saturdays and consume salt-free food.",
    "Chant 'Om Sham Shanaishcharaya Namah' 108 times daily.",
    "Donate black sesame seeds, black urad dal, mustard oil, and iron items to the needy.",
    "Wear an iron ring (made from a horseshoe) on the middle finger of the right hand.",
    "Serve the elderly and less privileged — Saturn governs karma and service.",
    "Avoid tamasic habits (excess sleep, alcohol, non-vegetarian food) during Sade Sati.",
    "Wear a Blue Sapphire (Neelam) only after consulting an experienced astrologer — it is potent.",
    "Keep a piece of alum (fitkari) in your wallet or purse.",
]


# ── Core helper — Saturn sign on a given date ──────────────────────────────────

def _saturn_sign_on_date(target_date: date) -> int:
    """Return Saturn's sidereal sign index (0–11) for a given date at noon UTC."""
    swe.set_sid_mode(swe.SIDM_LAHIRI)
    jd = swe.julday(target_date.year, target_date.month, target_date.day, 12.0)
    result, _ = swe.calc_ut(jd, swe.SATURN, swe.FLG_SIDEREAL)
    lon = result[0] % 360.0
    return int(lon / 30)


def _find_saturn_sign_transitions(
    start_year: int,
    end_year: int,
    step_days: int = 20,
) -> list[tuple[date, int]]:
    """
    Walk from start_year to end_year in steps, recording every change in
    Saturn's sidereal sign. Returns list of (date, new_sign_index) tuples.
    """
    transitions: list[tuple[date, int]] = []
    current = date(start_year, 1, 1)
    end = date(end_year, 12, 31)

    prev_sign = _saturn_sign_on_date(current)
    transitions.append((current, prev_sign))

    current += timedelta(days=step_days)
    while current <= end:
        sign = _saturn_sign_on_date(current)
        if sign != prev_sign:
            # Binary search to find exact crossing date within the step window
            lo = current - timedelta(days=step_days)
            hi = current
            while (hi - lo).days > 1:
                mid = lo + (hi - lo) // 2
                if _saturn_sign_on_date(mid) == prev_sign:
                    lo = mid
                else:
                    hi = mid
            transitions.append((hi, sign))
            prev_sign = sign
        current += timedelta(days=step_days)

    return transitions


# ── Phase computation ──────────────────────────────────────────────────────────

def _phase_for_saturn_sign(saturn_sign: int, moon_sign: int) -> Optional[int]:
    """
    Return phase integer for a given Saturn sign relative to Moon sign:
      -1  = rising (12th from Moon, i.e. one behind)
       0  = peak   (Moon sign itself)
       1  = setting (2nd from Moon, i.e. one ahead)
      None = not Sade Sati
    """
    diff = (saturn_sign - moon_sign) % 12
    if diff == 11:   # 12th from moon sign
        return -1
    elif diff == 0:  # Moon sign
        return 0
    elif diff == 1:  # 2nd from moon sign
        return 1
    return None


def _ardha_house(saturn_sign: int, moon_sign: int) -> Optional[int]:
    """Return 4 or 8 if Saturn is in Ardha Sati (Dhaiyya) position; else None."""
    diff = (saturn_sign - moon_sign) % 12 + 1  # 1-based house
    if diff in (4, 8):
        return diff
    return None


# ── Main public function ───────────────────────────────────────────────────────

def compute_sade_sati(moon_sign_index: int) -> dict:
    """
    Compute full Sade Sati report for a given Moon sign (0=Aries … 11=Pisces).

    Returns:
        {
          moon_sign: str,
          moon_sign_hi: str,
          moon_sign_index: int,
          current_status: "sade_sati" | "ardha_sati" | "clear",
          current_phase: int | None,        # -1, 0, 1 for SS; 4 or 8 for Ardha
          current_phase_label: str,
          current_phase_desc: str,
          current_period: {start, end, saturn_sign},  # None if not active
          past_cycles: [...],
          upcoming_cycles: [...],
          remedies: [...],
        }
    """
    today = date.today()
    moon_rashi = RASHIS[moon_sign_index]

    # Scan ±60 years for Saturn sign transitions
    scan_start = today.year - 60
    scan_end   = today.year + 35
    transitions = _find_saturn_sign_transitions(scan_start, scan_end, step_days=20)

    # Build list of periods: (start_date, end_date, saturn_sign_idx)
    periods: list[dict] = []
    for i, (start_d, sign_idx) in enumerate(transitions):
        end_d = transitions[i + 1][0] - timedelta(days=1) if i + 1 < len(transitions) else date(scan_end, 12, 31)
        periods.append({
            "start":        start_d.isoformat(),
            "end":          end_d.isoformat(),
            "saturn_sign":  sign_idx,
            "saturn_rashi": RASHIS[sign_idx]["en"],
        })

    # Tag each period with SS phase or Ardha status
    def enrich(p: dict) -> dict:
        ss = _phase_for_saturn_sign(p["saturn_sign"], moon_sign_index)
        ardha = _ardha_house(p["saturn_sign"], moon_sign_index)
        out = dict(p)
        if ss is not None:
            out["type"]        = "sade_sati"
            out["phase"]       = ss
            out["phase_label"] = PHASE_LABELS[ss]
        elif ardha is not None:
            out["type"]        = "ardha_sati"
            out["phase"]       = ardha
            out["phase_label"] = f"Ardha Sati — Saturn in {ardha}th from Moon"
        else:
            out["type"]  = "clear"
            out["phase"] = None
        return out

    tagged = [enrich(p) for p in periods]

    # Current status
    current_period = None
    current_status = "clear"
    current_phase  = None
    current_phase_label = "Not in Sade Sati or Ardha Sati"
    current_phase_desc  = (
        "Saturn is currently not transiting the 12th, 1st, or 2nd sign from your Moon. "
        "You are in a relatively lighter Saturn period. Use this time to build the discipline "
        "and karmic merit that will carry you through the next cycle."
    )

    for p in tagged:
        if p["start"] <= today.isoformat() <= p["end"]:
            current_period = p
            current_status = p["type"]
            current_phase  = p.get("phase")
            if p["type"] == "sade_sati" and current_phase in PHASE_DESCS:
                current_phase_label = PHASE_LABELS[current_phase]
                current_phase_desc  = PHASE_DESCS[current_phase]
            elif p["type"] == "ardha_sati" and current_phase in ARDHA_DESCS:
                current_phase_label = p["phase_label"]
                current_phase_desc  = ARDHA_DESCS[current_phase]
            break

    # Merge consecutive Sade Sati periods into full cycles
    def build_cycles(periods_list: list[dict], type_filter: str) -> list[dict]:
        """Group adjacent SS phases into full 7.5-year cycles."""
        cycles = []
        i = 0
        while i < len(periods_list):
            if periods_list[i]["type"] == type_filter:
                cycle_start = periods_list[i]["start"]
                phases = [periods_list[i]]
                j = i + 1
                while j < len(periods_list) and periods_list[j]["type"] == type_filter:
                    phases.append(periods_list[j])
                    j += 1
                cycle_end = periods_list[j - 1]["end"]
                cycles.append({
                    "start":  cycle_start,
                    "end":    cycle_end,
                    "phases": phases,
                })
                i = j
            else:
                i += 1
        return cycles

    all_ss_cycles = build_cycles(tagged, "sade_sati")

    past_cycles     = [c for c in all_ss_cycles if c["end"] < today.isoformat()]
    upcoming_cycles = [c for c in all_ss_cycles if c["start"] > today.isoformat()]

    # Next incoming Sade Sati (if not currently in one)
    next_ss = None
    if upcoming_cycles:
        nxt = upcoming_cycles[0]
        next_ss = {
            "start":     nxt["start"],
            "end":       nxt["end"],
            "years_away": round((date.fromisoformat(nxt["start"]) - today).days / 365.25, 1),
        }

    return {
        "moon_sign":       moon_rashi["en"],
        "moon_sign_hi":    moon_rashi["hi"],
        "moon_sign_index": moon_sign_index,
        "current_status":  current_status,
        "current_phase":   current_phase,
        "current_phase_label": current_phase_label,
        "current_phase_desc":  current_phase_desc,
        "current_period":  current_period,
        "past_cycles":     past_cycles[-3:],       # last 3 cycles
        "upcoming_cycles": upcoming_cycles[:2],     # next 2 cycles
        "next_ss":         next_ss,
        "remedies":        REMEDIES,
        "saturn_today":    RASHIS[_saturn_sign_on_date(today)]["en"],
    }
