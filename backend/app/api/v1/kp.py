"""
backend/app/api/v1/kp.py

KP System (Krishnamurti Paddhati) API endpoint.

POST /v1/kp/compute
    → Full KP chart: lagna, 9 planets, 12 house cusps,
      house significators, and current ruling planets.
"""

from datetime import date

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, validator

from backend.app.core.jyotish.kp import compute_kp

router = APIRouter(prefix="/kp", tags=["KP System"])


class KPRequest(BaseModel):
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
async def kp_compute(req: KPRequest):
    """
    Compute a full KP (Krishnamurti Paddhati) chart.

    Returns:
    - **lagna**: Ascendant with sign, nakshatra, star lord, sub lord
    - **planets**: 9 planets (Sun → Ketu) with house, nakshatra, star lord, sub lord
    - **cusps**: 12 Placidus house cusps with KP sub lord and significators
    - **significators**: Per-house list of planets that signify each house
    - **ruling_planets**: Planets strong at query time (day lord, lagna/moon lords)
    """
    try:
        result = compute_kp(
            dob=req.dob,
            tob=req.tob,
            tz=req.timezone,
            lat=req.lat,
            lon=req.lon,
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
