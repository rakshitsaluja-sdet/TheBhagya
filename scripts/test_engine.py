"""
scripts/test_engine.py

Validation test for BhagyaAI JyotishEngine.
Computes Rakshit Saluja's natal chart and asserts known-correct values.

Run from project root:
    python scripts/test_engine.py

Expected output:
    Lagna  : Libra  15.65°  (Swati pada 3)
    Moon   : Sagittarius 20.25°  (Purva Ashadha pada 3)
    Rahu MD: active  |  Rahu/Rahu AD until ~Sept 2027
    ALL ASSERTIONS PASSED ✓
"""

import sys
import os

# Add project root to path so imports work without installation
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.core.jyotish.engine import JyotishEngine
from backend.app.core.jyotish.dasha import current_dasha
from datetime import date

# ── Known-correct values from previous Swiss Ephemeris session ────────────
EXPECTED = {
    "lagna_sign":       "Libra",
    "lagna_deg_min":    15.0,
    "lagna_deg_max":    16.5,
    "lagna_nakshatra":  "Swati",
    "lagna_pada":       3,

    "moon_sign":        "Sagittarius",
    "moon_deg_min":     19.5,
    "moon_deg_max":     21.0,
    "moon_nakshatra":   "Purva Ashadha",
    "moon_pada":        3,

    "sun_sign":         "Taurus",
    "sun_deg_min":      5.0,
    "sun_deg_max":      7.0,

    "rahu_sign":        "Sagittarius",
    "ketu_sign":        "Gemini",

    "jupiter_house":    11,
    "venus_lk_pucca":  True,
    "mercury_lk_pucca": True,

    "active_md_lord":  "Rahu",
    "active_ad_lord":  "Rahu",
}

PASS = "\033[92m✓\033[0m"
FAIL = "\033[91m✗\033[0m"


def check(label: str, actual, expected, tolerance: float = 0.0) -> bool:
    if tolerance:
        ok = abs(actual - expected) <= tolerance
    elif isinstance(expected, bool):
        ok = actual == expected
    else:
        ok = str(actual) == str(expected)

    status = PASS if ok else FAIL
    print(f"  {status}  {label}")
    if not ok:
        print(f"       Expected: {expected!r}")
        print(f"       Got:      {actual!r}")
    return ok


def check_range(label: str, actual: float, lo: float, hi: float) -> bool:
    ok = lo <= actual <= hi
    status = PASS if ok else FAIL
    print(f"  {status}  {label}  ({actual:.4f}°  expected {lo}–{hi}°)")
    return ok


def main():
    print("\n" + "="*60)
    print("  BhagyaAI — JyotishEngine Validation Test")
    print("  Subject: Rakshit Saluja | 20 May 1992 17:13 IST Kanpur")
    print("="*60 + "\n")

    engine = JyotishEngine()
    chart  = engine.compute_chart(
        dob="1992-05-20",
        tob="17:13",
        timezone="Asia/Kolkata",
        lat=26.4499,       # Kanpur latitude
        lon=80.3319,       # Kanpur longitude
        label="Rakshit Saluja",
        place_name="Kanpur, Uttar Pradesh, India",
        dasha_levels=2,
    )

    lagna   = chart["lagna"]
    planets = chart["planets"]
    lk      = chart["lal_kitab"]
    active  = chart["current_dasha"]

    failures: list[str] = []

    # ── Lagna ─────────────────────────────────────────────────────────────
    print("── Lagna (Ascendant) ──────────────────────────────────────")
    print(f"     {lagna['sign']} {lagna['degree']:.2f}°  ({lagna['nakshatra']} pada {lagna['pada']})")

    tests = [
        check("Lagna sign = Libra",          lagna["sign"],      "Libra"),
        check_range("Lagna degree",           lagna["degree"],    EXPECTED["lagna_deg_min"], EXPECTED["lagna_deg_max"]),
        check("Lagna nakshatra = Swati",      lagna["nakshatra"], "Swati"),
        check("Lagna pada = 3",               lagna["pada"],      3),
    ]
    failures += [t for t in tests if not t]

    # ── Moon ──────────────────────────────────────────────────────────────
    print("\n── Moon ────────────────────────────────────────────────────")
    moon = planets["Moon"]
    print(f"     {moon['sign']} {moon['degree']:.2f}°  ({moon['nakshatra']} pada {moon['pada']})  House {moon['house']}")

    tests = [
        check("Moon sign = Sagittarius",            moon["sign"],      "Sagittarius"),
        check_range("Moon degree",                   moon["degree"],    EXPECTED["moon_deg_min"], EXPECTED["moon_deg_max"]),
        check("Moon nakshatra = Purva Ashadha",     moon["nakshatra"], "Purva Ashadha"),
        check("Moon pada = 3",                      moon["pada"],      3),
        check("Moon house = 3",                     moon["house"],     3),
    ]
    failures += [t for t in tests if not t]

    # ── Sun ───────────────────────────────────────────────────────────────
    print("\n── Sun ─────────────────────────────────────────────────────")
    sun = planets["Sun"]
    print(f"     {sun['sign']} {sun['degree']:.2f}°  ({sun['nakshatra']} pada {sun['pada']})  House {sun['house']}")

    tests = [
        check("Sun sign = Taurus",      sun["sign"],    "Taurus"),
        check_range("Sun degree",        sun["degree"],  EXPECTED["sun_deg_min"], EXPECTED["sun_deg_max"]),
        check("Sun house = 8",          sun["house"],   8),
    ]
    failures += [t for t in tests if not t]

    # ── Other planets ─────────────────────────────────────────────────────
    print("\n── Other Planets ───────────────────────────────────────────")
    for name in ["Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Rahu", "Ketu"]:
        p = planets[name]
        pucca = " ★ PUCCA" if p["lk_pucca"] else ""
        print(f"     {name:10s}  {p['sign']:14s}  {p['degree']:.2f}°  House {p['house']}{pucca}")

    tests = [
        check("Rahu sign = Sagittarius",   planets["Rahu"]["sign"],    "Sagittarius"),
        check("Ketu sign = Gemini",        planets["Ketu"]["sign"],    "Gemini"),
        check("Jupiter house = 11",        planets["Jupiter"]["house"], 11),
        check("Venus LK Pucca Ghar",       planets["Venus"]["lk_pucca"], True),
        check("Mercury LK Pucca Ghar",     planets["Mercury"]["lk_pucca"], True),
    ]
    failures += [t for t in tests if not t]

    # ── Dasha ─────────────────────────────────────────────────────────────
    print("\n── Current Dasha ───────────────────────────────────────────")
    md = active.get("mahadasha", {})
    ad = active.get("antardasha", {})
    print(f"     Mahadasha : {md.get('lord','')}  ({md.get('start','')} → {md.get('end','')})")
    print(f"     Antardasha: {ad.get('lord','')}  ({ad.get('start','')} → {ad.get('end','')})")

    tests = [
        check("Active MD = Rahu",   md.get("lord"), "Rahu"),
        check("Active AD = Rahu",   ad.get("lord"), "Rahu"),
    ]
    failures += [t for t in tests if not t]

    # ── Lal Kitab overlay ─────────────────────────────────────────────────
    print("\n── Lal Kitab ───────────────────────────────────────────────")
    print(f"     Rahu-Ketu axis: {lk['rahu_ketu_axis']}")
    print(f"     Foreign indicator: {lk['foreign_indicator']}")
    print(f"     Pucca Ghar planets: {lk['pucca_ghar_planets']}")

    tests = [
        check("Foreign indicator = True", lk["foreign_indicator"], True),
    ]
    failures += [t for t in tests if not t]

    # ── House map ─────────────────────────────────────────────────────────
    print("\n── House Map ───────────────────────────────────────────────")
    for h in range(1, 13):
        occupants = chart["house_map"].get(str(h), [])
        if occupants:
            print(f"     House {h:2d}: {', '.join(occupants)}")

    # ── Summary ───────────────────────────────────────────────────────────
    print("\n" + "="*60)
    total  = sum(1 for _ in range(len(failures) + len([x for x in [] if x])))
    passed = [t for t in [True] if t]  # placeholder count

    if not failures:
        print(f"\n  \033[92m✓ ALL ASSERTIONS PASSED — BhagyaAI engine is correct.\033[0m")
        print(f"  Ayanamsa: {chart['ayanamsa']}° (Lahiri)")
        print(f"  Julian Day: {chart['julian_day_ut']}")
    else:
        print(f"\n  \033[91m✗ {len(failures)} ASSERTION(S) FAILED — review output above.\033[0m")
        sys.exit(1)

    print("="*60 + "\n")


if __name__ == "__main__":
    main()
