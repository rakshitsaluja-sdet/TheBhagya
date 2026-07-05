"""
backend/app/core/numerology/engine.py

BhagyaAI — Numerology Engine (Pillar 4)

Supports two systems:
  • Pythagorean  (modern Western, A=1 … I=9, J=1 …)
  • Chaldean     (ancient, A=1, B=2, … — different alphabet map)

Numbers computed:
  ┌──────────────────────────────────────────────────────────────────┐
  │  Life Path    — DOB digits reduced to single digit (or master)  │
  │  Destiny      — Full birth name (Pythagorean/Chaldean)          │
  │  Soul Urge    — Vowels in name                                  │
  │  Personality  — Consonants in name                              │
  │  Birthday     — Day of birth (not reduced)                      │
  │  Personal Year— Birth day + month + current year, reduced       │
  │  Compatibility— Life Path pair score                            │
  └──────────────────────────────────────────────────────────────────┘

Master numbers 11, 22, 33 are preserved and not reduced.

Usage:
    from backend.app.core.numerology.engine import NumerologyEngine
    eng = NumerologyEngine()
    result = eng.compute("Rakshit Saluja", "1992-05-20")
    print(result["life_path"])   # 1
    print(result["destiny"])     # dict with pythagorean + chaldean
"""

from __future__ import annotations

from datetime import date
from typing import Optional


# ── Alphabet maps ─────────────────────────────────────────────────────────────

# Pythagorean: A–Z mapped 1–9 cyclically
_PYTHAGOREAN: dict[str, int] = {}
for _i, _ch in enumerate("ABCDEFGHIJKLMNOPQRSTUVWXYZ", 1):
    _PYTHAGOREAN[_ch] = ((_i - 1) % 9) + 1

# Chaldean: different assignment (doesn't use 9 for any letter)
_CHALDEAN: dict[str, int] = {
    "A": 1, "I": 1, "J": 1, "Q": 1, "Y": 1,
    "B": 2, "K": 2, "R": 2,
    "C": 3, "G": 3, "L": 3, "S": 3,
    "D": 4, "M": 4, "T": 4,
    "E": 5, "H": 5, "N": 5, "X": 5,
    "U": 6, "V": 6, "W": 6,
    "O": 7, "Z": 7,
    "F": 8, "P": 8,
}

_VOWELS = set("AEIOU")

MASTER_NUMBERS = {11, 22, 33}


# ── Core reduction helpers ────────────────────────────────────────────────────

def _reduce(n: int, *, preserve_masters: bool = True) -> int:
    """Reduce n to single digit, keeping 11/22/33 if preserve_masters=True."""
    while n > 9:
        if preserve_masters and n in MASTER_NUMBERS:
            break
        n = sum(int(d) for d in str(n))
    return n


def _name_value(name: str, table: dict[str, int]) -> int:
    """Sum all letter values in name using given table."""
    total = 0
    for ch in name.upper():
        if ch.isalpha():
            total += table.get(ch, 0)
    return total


def _vowel_value(name: str, table: dict[str, int]) -> int:
    total = 0
    for ch in name.upper():
        if ch in _VOWELS:
            total += table.get(ch, 0)
    return total


def _consonant_value(name: str, table: dict[str, int]) -> int:
    total = 0
    for ch in name.upper():
        if ch.isalpha() and ch not in _VOWELS:
            total += table.get(ch, 0)
    return total


# ── Number meanings ───────────────────────────────────────────────────────────

_MEANINGS: dict[int, str] = {
    1:  "The Leader — independence, ambition, originality. Strong will, pioneer energy.",
    2:  "The Diplomat — cooperation, sensitivity, partnership. Emotional depth, peacemaking.",
    3:  "The Communicator — creativity, expression, joy. Artistic, social, optimistic.",
    4:  "The Builder — discipline, hard work, stability. Methodical, trustworthy, grounded.",
    5:  "The Freedom Seeker — change, adventure, versatility. Risk-taker, magnetic, restless.",
    6:  "The Nurturer — responsibility, family, harmony. Caring, protective, service-oriented.",
    7:  "The Seeker — introspection, wisdom, analysis. Spiritual depth, research, solitude.",
    8:  "The Powerhouse — ambition, authority, material success. Business acumen, karma of wealth.",
    9:  "The Humanitarian — compassion, global vision, completion. Selfless, artistic, idealistic.",
    11: "Master 11 — The Intuitive Illuminator. Spiritual insight, inspiration, nervous sensitivity.",
    22: "Master 22 — The Master Builder. Turns grand visions into reality; rare, high-pressure.",
    33: "Master 33 — The Master Teacher. Unconditional love, healing, rare spiritual responsibility.",
}

_COMPATIBILITY: dict[frozenset, str] = {
    frozenset({1, 1}): "High — two leaders; needs mutual respect to avoid clashes.",
    frozenset({1, 2}): "High — leader + diplomat; complementary balance.",
    frozenset({1, 3}): "High — energy + creativity; dynamic and fun.",
    frozenset({1, 4}): "Medium — drive meets discipline; productive but friction possible.",
    frozenset({1, 5}): "High — both love independence; exciting but commitment may waver.",
    frozenset({1, 6}): "Medium — ambition vs nurture; works if priorities align.",
    frozenset({1, 7}): "Medium — leader + thinker; respect each other's space.",
    frozenset({1, 8}): "High — two powerhouses; great for business, competitive personally.",
    frozenset({1, 9}): "Medium — ambition vs humanitarianism; inspiring if values align.",
    frozenset({2, 2}): "High — deeply empathetic pair; may lack assertiveness.",
    frozenset({2, 3}): "High — warmth + creativity; emotionally rich.",
    frozenset({2, 4}): "High — sensitivity + stability; nurturing foundation.",
    frozenset({2, 5}): "Low — emotional needs vs freedom; challenging.",
    frozenset({2, 6}): "High — both nurturing; natural family-oriented bond.",
    frozenset({2, 7}): "Medium — emotion vs logic; deep but requires patience.",
    frozenset({2, 8}): "Medium — support vs ambition; works if 8 stays present.",
    frozenset({2, 9}): "High — compassion shared; emotionally fulfilling.",
    frozenset({3, 3}): "High — joyful, creative, social; may lack seriousness.",
    frozenset({3, 4}): "Medium — fun vs structure; friction but growth.",
    frozenset({3, 5}): "High — both love life; exciting, adventurous.",
    frozenset({3, 6}): "High — creativity + nurture; warm and expressive.",
    frozenset({3, 7}): "Medium — social vs solitary; interesting dynamic.",
    frozenset({3, 8}): "Medium — creative vs material; respect needed.",
    frozenset({3, 9}): "High — artistic + humanitarian; inspired connection.",
    frozenset({4, 4}): "High — solid, reliable, stable; can be rigid.",
    frozenset({4, 5}): "Low — structure vs freedom; needs compromise.",
    frozenset({4, 6}): "High — responsibility + care; excellent family number.",
    frozenset({4, 7}): "High — builder + thinker; intellectual and grounded.",
    frozenset({4, 8}): "High — both ambitious; strong power couple.",
    frozenset({4, 9}): "Medium — practical vs idealistic; works with patience.",
    frozenset({5, 5}): "High — twin free spirits; exciting but unstable long-term.",
    frozenset({5, 6}): "Low — freedom vs responsibility; major values clash.",
    frozenset({5, 7}): "High — both independent; mutual respect, deep bond.",
    frozenset({5, 8}): "High — adventure + ambition; dynamic.",
    frozenset({5, 9}): "High — freedom + vision; expansive connection.",
    frozenset({6, 6}): "High — deeply nurturing; risk of co-dependency.",
    frozenset({6, 7}): "Medium — heart vs mind; learning relationship.",
    frozenset({6, 8}): "High — care + ambition; provider dynamic works well.",
    frozenset({6, 9}): "High — love + compassion; humanitarian bond.",
    frozenset({7, 7}): "High — two seekers; profound intellectual depth.",
    frozenset({7, 8}): "Medium — wisdom vs power; mutual learning.",
    frozenset({7, 9}): "High — spiritual depth shared; philosophical kinship.",
    frozenset({8, 8}): "High — powerhouse pair; may compete, but unstoppable together.",
    frozenset({8, 9}): "Medium — material vs humanitarian; works if grounded.",
    frozenset({9, 9}): "High — visionaries; deeply compassionate but can neglect practicality.",
}


def _compat_score(a: int, b: int) -> dict:
    # Normalise masters for compatibility lookup
    a2 = a if a <= 9 else (a % 9 or 9)
    b2 = b if b <= 9 else (b % 9 or 9)
    key = frozenset({a2, b2})
    verdict = _COMPATIBILITY.get(key, "Compatibility data not available.")
    rating = verdict.split(" — ")[0]   # "High" / "Medium" / "Low"
    return {"rating": rating, "description": verdict}


# ── Main engine ───────────────────────────────────────────────────────────────

class NumerologyEngine:
    """
    Computes all major numerology numbers for a given name + DOB.

    Both Pythagorean and Chaldean values are returned for name-derived
    numbers so the user can see both traditions.
    """

    # ── Life Path ──────────────────────────────────────────────────────────

    def life_path(self, dob: str) -> dict:
        """
        DOB format: YYYY-MM-DD
        Method: reduce each component (day, month, year) individually, then sum + reduce.
        This is the standard method that correctly preserves master numbers.
        """
        d = date.fromisoformat(dob)
        day   = _reduce(d.day,   preserve_masters=True)
        month = _reduce(d.month, preserve_masters=True)
        year  = _reduce(sum(int(x) for x in str(d.year)), preserve_masters=True)
        total = _reduce(day + month + year, preserve_masters=True)
        return {
            "number":   total,
            "meaning":  _MEANINGS.get(total, ""),
            "is_master": total in MASTER_NUMBERS,
            "breakdown": {
                "day":   day,
                "month": month,
                "year":  year,
                "raw_sum": day + month + year,
            },
        }

    # ── Destiny ────────────────────────────────────────────────────────────

    def destiny(self, full_name: str) -> dict:
        """Full name (as given at birth) reduced to single digit / master."""
        pyth_raw  = _name_value(full_name, _PYTHAGOREAN)
        chald_raw = _name_value(full_name, _CHALDEAN)
        pyth  = _reduce(pyth_raw)
        chald = _reduce(chald_raw)
        return {
            "pythagorean": {
                "number":   pyth,
                "raw":      pyth_raw,
                "meaning":  _MEANINGS.get(pyth, ""),
                "is_master": pyth in MASTER_NUMBERS,
            },
            "chaldean": {
                "number":   chald,
                "raw":      chald_raw,
                "meaning":  _MEANINGS.get(chald, ""),
                "is_master": chald in MASTER_NUMBERS,
            },
        }

    # ── Soul Urge (Heart's Desire) ─────────────────────────────────────────

    def soul_urge(self, full_name: str) -> dict:
        """Vowels only — inner motivation."""
        pyth_raw  = _vowel_value(full_name, _PYTHAGOREAN)
        chald_raw = _vowel_value(full_name, _CHALDEAN)
        pyth  = _reduce(pyth_raw)
        chald = _reduce(chald_raw)
        return {
            "pythagorean": {"number": pyth, "raw": pyth_raw, "meaning": _MEANINGS.get(pyth, "")},
            "chaldean":    {"number": chald, "raw": chald_raw, "meaning": _MEANINGS.get(chald, "")},
        }

    # ── Personality ────────────────────────────────────────────────────────

    def personality(self, full_name: str) -> dict:
        """Consonants only — outer expression / first impression."""
        pyth_raw  = _consonant_value(full_name, _PYTHAGOREAN)
        chald_raw = _consonant_value(full_name, _CHALDEAN)
        pyth  = _reduce(pyth_raw)
        chald = _reduce(chald_raw)
        return {
            "pythagorean": {"number": pyth, "raw": pyth_raw, "meaning": _MEANINGS.get(pyth, "")},
            "chaldean":    {"number": chald, "raw": chald_raw, "meaning": _MEANINGS.get(chald, "")},
        }

    # ── Birthday Number ────────────────────────────────────────────────────

    def birthday_number(self, dob: str) -> dict:
        """Day of birth — not reduced beyond two digits."""
        d = date.fromisoformat(dob)
        day = d.day
        reduced = _reduce(day)
        return {
            "day":     day,
            "number":  reduced,
            "meaning": _MEANINGS.get(reduced, ""),
        }

    # ── Personal Year ──────────────────────────────────────────────────────

    def personal_year(self, dob: str, year: Optional[int] = None) -> dict:
        """
        Personal Year = Birth Day (reduced) + Birth Month + Current Year (reduced).
        Standard formula — each component reduced individually, then summed and reduced.
        Indicates the theme of the current 12-month cycle (birthday to birthday).
        """
        from datetime import date as dt
        current_year = year or dt.today().year
        d = date.fromisoformat(dob)
        day_reduced   = _reduce(d.day,   preserve_masters=False)
        month_reduced = _reduce(d.month, preserve_masters=False)
        year_reduced  = _reduce(sum(int(x) for x in str(current_year)), preserve_masters=False)
        py_num = _reduce(day_reduced + month_reduced + year_reduced, preserve_masters=True)
        return {
            "year":    current_year,
            "number":  py_num,
            "meaning": _MEANINGS.get(py_num, ""),
        }

    # ── Compatibility ──────────────────────────────────────────────────────

    def compatibility(self, dob1: str, dob2: str,
                      name1: Optional[str] = None,
                      name2: Optional[str] = None) -> dict:
        """
        Life Path compatibility between two people.
        Optionally includes Destiny number cross-check.
        """
        lp1 = self.life_path(dob1)["number"]
        lp2 = self.life_path(dob2)["number"]
        result = {
            "life_path_1": lp1,
            "life_path_2": lp2,
            "life_path_compatibility": _compat_score(lp1, lp2),
        }
        if name1 and name2:
            d1 = self.destiny(name1)["pythagorean"]["number"]
            d2 = self.destiny(name2)["pythagorean"]["number"]
            result["destiny_1"] = d1
            result["destiny_2"] = d2
            result["destiny_compatibility"] = _compat_score(d1, d2)
        return result

    # ── Full compute ───────────────────────────────────────────────────────

    def compute(self, full_name: str, dob: str,
                partner_name: Optional[str] = None,
                partner_dob: Optional[str] = None) -> dict:
        """
        Master method — returns all numbers for one person,
        plus optional compatibility with a partner.
        """
        result = {
            "name":          full_name,
            "dob":           dob,
            "life_path":     self.life_path(dob),
            "destiny":       self.destiny(full_name),
            "soul_urge":     self.soul_urge(full_name),
            "personality":   self.personality(full_name),
            "birthday":      self.birthday_number(dob),
            "personal_year": self.personal_year(dob),
        }
        if partner_name and partner_dob:
            result["compatibility"] = self.compatibility(
                dob, partner_dob, full_name, partner_name
            )
        return result
