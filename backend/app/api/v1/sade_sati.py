"""
backend/app/api/v1/sade_sati.py

Sade Sati endpoints — no authentication required.

POST /v1/sade-sati/by-moon-sign   → quick lookup: provide moon sign name/index
POST /v1/sade-sati/compute        → full birth-data computation: DOB/TOB/lat/lon
"""

from __future__ import annotations

from datetime import date
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, validator
from typing import Optional

from backend.app.core.jyotish.sade_sati import compute_sade_sati, RASHIS
from backend.app.core.jyotish.engine import JyotishEngine

router = APIRouter(prefix="/sade-sati", tags=["sade-sati"])

# Sign lookup
_SIGN_LOOKUP: dict[str, int] = {r["en"].lower(): i for i, r in enumerate(RASHIS)}
_SIGN_LOOKUP.update({r["hi"]: i for i, r in enumerate(RASHIS)})
_SIGN_LOOKUP.update({str(i): i for i in range(12)})


# ── Request models ─────────────────────────────────────────────────────────────

class MoonSignRequest(BaseModel):
    moon_sign: str = Field(..., description="Moon sign: English (aries…pisces), Hindi, or 0-11 index")


class BirthDataRequest(BaseModel):
    dob:      str   = Field(..., description="Date of birth YYYY-MM-DD")
    tob:      str   = Field(..., description="Time of birth HH:MM or HH:MM:SS")
    lat:      float = Field(..., description="Latitude (decimal degrees)")
    lon:      float = Field(..., description="Longitude (decimal degrees)")
    timezone: str   = Field(..., description="Timezone string e.g. 'Asia/Kolkata'")

    @validator("dob")
    def validate_dob(cls, v):
        try:
            date.fromisoformat(v)
        except ValueError:
            raise ValueError("dob must be YYYY-MM-DD")
        return v


# ── Helpers ────────────────────────────────────────────────────────────────────

def _resolve_sign(raw: str) -> int:
    key = raw.strip().lower()
    idx = _SIGN_LOOKUP.get(key)
    if idx is None:
        raise HTTPException(
            status_code=422,
            detail=f"Unknown moon sign '{raw}'. Use English (aries…pisces), Hindi, or 0-11 index.",
        )
    return idx


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/by-moon-sign")
async def sade_sati_by_moon_sign(body: MoonSignRequest):
    """
    Compute Sade Sati report given a known Moon sign.
    Fastest path — no birth chart computation needed.
    """
    idx = _resolve_sign(body.moon_sign)
    try:
        result = compute_sade_sati(idx)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Computation error: {str(e)}")


@router.post("/compute")
async def sade_sati_compute(body: BirthDataRequest):
    """
    Compute Sade Sati report from full birth data.
    Derives Moon sign via Swiss Ephemeris, then returns full report.
    """
    try:
        engine = JyotishEngine(
            dob=body.dob,
            tob=body.tob,
            lat=body.lat,
            lon=body.lon,
            timezone=body.timezone,
        )
        planets = engine._compute_planets()
        moon_lon = planets["Moon"]["longitude"]
        moon_sign_idx = int(moon_lon / 30) % 12
        result = compute_sade_sati(moon_sign_idx)
        result["birth_moon_longitude"] = round(moon_lon, 4)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Computation error: {str(e)}")


@router.get("/signs")
async def list_rashis():
    """Return all 12 Rashis with index, English and Hindi names."""
    return {
        "success": True,
        "data": [{"index": i, **r} for i, r in enumerate(RASHIS)],
    }
