"""
backend/app/api/v1/transit.py

POST /v1/transit/compute
"""

from __future__ import annotations

import logging
from datetime import date
from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.core.jyotish.transit import compute_transits

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/transit", tags=["transit"])


class TransitRequest(BaseModel):
    # Birth details
    birth_date: str = Field(..., description="YYYY-MM-DD")
    birth_time: str = Field(..., description="HH:MM or HH:MM:SS local time")
    birth_tz:   str = Field(..., description="IANA timezone, e.g. Asia/Kolkata")
    birth_lat:  float = Field(..., ge=-90, le=90)
    birth_lon:  float = Field(..., ge=-180, le=180)

    # Transit query (defaults to today, noon, same tz as birth)
    query_date: Optional[str] = Field(None, description="YYYY-MM-DD; defaults to today")
    query_time: str            = Field("12:00", description="HH:MM local time for transit snapshot")
    query_tz:   Optional[str]  = Field(None, description="IANA timezone; defaults to birth_tz")


@router.post("/compute")
async def compute_transit_report(req: TransitRequest):
    try:
        query_tz = req.query_tz or req.birth_tz
        result = compute_transits(
            birth_date  = req.birth_date,
            birth_time  = req.birth_time,
            birth_tz    = req.birth_tz,
            birth_lat   = req.birth_lat,
            birth_lon   = req.birth_lon,
            query_date  = req.query_date,
            query_time  = req.query_time,
            query_tz    = query_tz,
        )
        return {"success": True, "data": result}
    except Exception as exc:
        logger.exception("Transit compute error: %s", exc)
        return {"success": False, "error": str(exc)}
