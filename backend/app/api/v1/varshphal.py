"""
backend/app/api/v1/varshphal.py

Varshphal (Annual Horoscope) endpoints — no authentication required.

POST /v1/varshphal/compute   → Full Varshphal for a given birth + target year
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, validator

from backend.app.core.jyotish.varshphal import compute_varshphal

router = APIRouter(prefix="/varshphal", tags=["varshphal"])


class VarshphalRequest(BaseModel):
    # Birth details
    birth_date:      str   = Field(..., description="Birth date YYYY-MM-DD")
    birth_time:      str   = Field("12:00:00", description="Birth time HH:MM:SS")
    birth_tz:        str   = Field("Asia/Kolkata", description="Birth timezone (IANA)")
    birth_lat:       float = Field(..., description="Birth latitude")
    birth_lon:       float = Field(..., description="Birth longitude")
    birth_lagna_lon: float = Field(..., description="Natal sidereal ascendant longitude")

    # Target year for annual horoscope
    target_year:     int   = Field(..., description="Year for which to compute Varshphal")

    # Query location (where the person is now — defaults to birth location)
    query_lat:       float | None = Field(None, description="Current latitude (defaults to birth_lat)")
    query_lon:       float | None = Field(None, description="Current longitude (defaults to birth_lon)")
    query_tz:        str   = Field("Asia/Kolkata", description="Current timezone (IANA)")

    @validator("birth_date")
    def validate_date(cls, v):
        from datetime import date as _date
        try:
            _date.fromisoformat(v)
        except ValueError:
            raise ValueError("birth_date must be YYYY-MM-DD")
        return v

    @validator("target_year")
    def validate_year(cls, v):
        if v < 1900 or v > 2100:
            raise ValueError("target_year must be between 1900 and 2100")
        return v


@router.post("/compute")
async def compute(body: VarshphalRequest):
    """Compute Varshphal (Annual Horoscope) for a given birth + target year."""
    try:
        result = compute_varshphal(
            birth_date=body.birth_date,
            birth_time=body.birth_time,
            birth_tz=body.birth_tz,
            birth_lat=body.birth_lat,
            birth_lon=body.birth_lon,
            birth_lagna_lon=body.birth_lagna_lon,
            target_year=body.target_year,
            query_lat=body.query_lat if body.query_lat is not None else body.birth_lat,
            query_lon=body.query_lon if body.query_lon is not None else body.birth_lon,
            query_tz=body.query_tz,
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Varshphal computation error: {str(e)}")
