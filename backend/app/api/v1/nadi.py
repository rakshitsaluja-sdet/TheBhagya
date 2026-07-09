"""
backend/app/api/v1/nadi.py

Nadi Astrology API endpoint.

POST /v1/nadi/compute
    → Full Nadi chart: lagna, 9 planets with Nadi amsa details,
      classical Nadi yogas, life themes, and Vimshottari dasha-based
      Nadi-style predictions.
"""

from datetime import date

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, validator

from backend.app.core.jyotish.nadi import compute_nadi

router = APIRouter(prefix="/nadi", tags=["Nadi Astrology"])


class NadiRequest(BaseModel):
    dob:      str   = Field(..., description="Date of birth YYYY-MM-DD")
    tob:      str   = Field(..., description="Time of birth HH:MM or HH:MM:SS")
    timezone: str   = Field("Asia/Kolkata", description="IANA timezone, e.g. 'Asia/Kolkata'")
    lat:      float = Field(..., description="Birth latitude (N positive)")
    lon:      float = Field(..., description="Birth longitude (E positive)")

    @validator("dob")
    def validate_dob(cls, v: str) -> str:
        try:
            date.fromisoformat(v)
        except ValueError:
            raise ValueError("dob must be YYYY-MM-DD")
        return v

    @validator("tob")
    def validate_tob(cls, v: str) -> str:
        parts = v.split(":")
        if len(parts) < 2:
            raise ValueError("tob must be HH:MM or HH:MM:SS")
        return v


@router.post("/compute")
async def nadi_compute(req: NadiRequest):
    """
    Compute a full Nadi Astrology reading.

    Returns:
    - **lagna**: Ascendant with sign, nakshatra, pada, Nadi amsa number and amsa sign
    - **planets**: 9 planets — each with sign, degree, nakshatra, pada, Nadi amsa,
      amsa sign, house (whole-sign from lagna), classical dignity, natural karaka,
      and a classical Nadi interpretation note
    - **nadi_yogas**: Present Nadi yogas (wealth, career, marriage, spirituality, etc.)
    - **life_themes**: 4–6 thematic areas derived from planet dignities and positions
    - **nadi_predictions**: 3–4 Vimshottari dasha-based classical Nadi-style predictions
    """
    try:
        result = compute_nadi(
            dob=req.dob,
            tob=req.tob,
            tz=req.timezone,
            lat=req.lat,
            lon=req.lon,
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
