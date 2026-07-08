"""
backend/app/api/v1/horoscope.py

Daily Horoscope endpoints — no authentication required.

GET /v1/horoscope/today            → all 12 rashis
GET /v1/horoscope/today/{sign}     → single rashi by name or index
"""

from fastapi import APIRouter, HTTPException, Query
from backend.app.core.jyotish.horoscope import (
    get_all_horoscopes,
    get_daily_horoscope,
    get_current_transits,
    RASHIS,
)

router = APIRouter(prefix="/horoscope", tags=["horoscope"])

# Build lookup: "aries" → 0, "taurus" → 1, etc.
_SIGN_LOOKUP: dict[str, int] = {r["en"].lower(): i for i, r in enumerate(RASHIS)}
# Also accept Hindi names
_SIGN_LOOKUP.update({r["hi"]: i for i, r in enumerate(RASHIS)})
# And numeric strings
_SIGN_LOOKUP.update({str(i): i for i in range(12)})


@router.get("/today")
async def get_today_all():
    """
    Return today's horoscope for all 12 Rashis.
    Transit computation happens once for all 12 signs.
    """
    try:
        horoscopes = get_all_horoscopes()
        return {
            "success": True,
            "count":   len(horoscopes),
            "data":    horoscopes,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ephemeris error: {str(e)}")


@router.get("/today/{sign}")
async def get_today_sign(sign: str):
    """
    Return today's horoscope for a single Rashi.
    `sign` can be English name (aries, taurus…), Hindi name, or 0-based index (0–11).
    """
    key = sign.strip().lower()
    idx = _SIGN_LOOKUP.get(key)
    if idx is None:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown sign '{sign}'. Use English name (aries…pisces), Hindi name, or index 0–11.",
        )
    try:
        transits = get_current_transits()
        result = get_daily_horoscope(idx, transits)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ephemeris error: {str(e)}")


@router.get("/transits")
async def get_transits():
    """
    Return today's raw planetary transit positions (sidereal, Lahiri).
    Useful for debugging or displaying a planet-positions widget.
    """
    try:
        transits = get_current_transits()
        return {"success": True, "data": transits}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ephemeris error: {str(e)}")
