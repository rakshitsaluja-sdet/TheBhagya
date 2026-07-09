"""
backend/app/api/v1/panchang.py

Panchang endpoints — no authentication required.

POST /v1/panchang/compute   → Full Panchang for given date + location
GET  /v1/panchang/today     → Today's Panchang (requires lat/lon/tz query params)
"""

from datetime import date as _date
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field, validator

from backend.app.core.jyotish.panchang import compute_panchang

router = APIRouter(prefix="/panchang", tags=["panchang"])


class PanchangRequest(BaseModel):
    date:     str   = Field(..., description="Date YYYY-MM-DD")
    lat:      float = Field(..., description="Latitude (N positive)")
    lon:      float = Field(..., description="Longitude (E positive)")
    timezone: str   = Field("Asia/Kolkata", description="IANA timezone string")
    time:     str   = Field("12:00:00",     description="Time for planetary positions HH:MM or HH:MM:SS")

    @validator("date")
    def validate_date(cls, v):
        try:
            _date.fromisoformat(v)
        except ValueError:
            raise ValueError("date must be YYYY-MM-DD")
        return v


@router.post("/compute")
async def compute(body: PanchangRequest):
    """Compute the Panchang (five limbs + muhurats) for any date and location."""
    try:
        result = compute_panchang(
            date_str=body.date,
            lat=body.lat,
            lon=body.lon,
            timezone_str=body.timezone,
            time_str=body.time,
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Panchang computation error: {str(e)}")


@router.get("/today")
async def today(
    lat:      float = Query(..., description="Latitude"),
    lon:      float = Query(..., description="Longitude"),
    tz:       str   = Query("Asia/Kolkata", description="IANA timezone"),
):
    """Convenience endpoint: today's Panchang for a given location."""
    from datetime import datetime
    import pytz
    try:
        tz_obj    = pytz.timezone(tz)
        today_str = datetime.now(tz_obj).strftime("%Y-%m-%d")
        result    = compute_panchang(
            date_str=today_str,
            lat=lat,
            lon=lon,
            timezone_str=tz,
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Panchang computation error: {str(e)}")
