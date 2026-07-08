"""
backend/app/api/v1/doshas.py

Dosha endpoints — no authentication required.

POST /v1/doshas/compute   → Mangal Dosha + Kaal Sarp from full birth data
"""

from datetime import date
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, validator

from backend.app.core.jyotish.doshas import compute_doshas

router = APIRouter(prefix="/doshas", tags=["doshas"])


class BirthDataRequest(BaseModel):
    dob:      str   = Field(..., description="Date of birth YYYY-MM-DD")
    tob:      str   = Field(..., description="Time of birth HH:MM or HH:MM:SS")
    lat:      float = Field(..., description="Latitude decimal (N positive)")
    lon:      float = Field(..., description="Longitude decimal (E positive)")
    timezone: str   = Field("Asia/Kolkata", description="Timezone string e.g. 'Asia/Kolkata'")

    @validator("dob")
    def validate_dob(cls, v):
        try:
            date.fromisoformat(v)
        except ValueError:
            raise ValueError("dob must be YYYY-MM-DD")
        return v


@router.post("/compute")
async def compute_all_doshas(body: BirthDataRequest):
    """
    Compute Mangal Dosha and Kaal Sarp Dosha from birth data.
    Returns both results plus a planet position snapshot.
    """
    try:
        result = compute_doshas(
            dob=body.dob,
            tob=body.tob,
            lat=body.lat,
            lon=body.lon,
            timezone_str=body.timezone,
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Computation error: {str(e)}")
