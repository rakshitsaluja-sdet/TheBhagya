"""
backend/app/api/v1/muhurat.py

POST /v1/muhurat/find
"""

from __future__ import annotations

import logging
from datetime import date, timedelta

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator

from backend.app.core.jyotish.muhurat import find_muhurats, EVENT_RULES

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/muhurat", tags=["muhurat"])


class MuhuratRequest(BaseModel):
    event_type:  str   = Field(..., description="vivah | griha_pravesh | vehicle | business | travel | bhoomi_pujan | namakaran")
    start_date:  str   = Field(..., description="YYYY-MM-DD")
    end_date:    str   = Field(..., description="YYYY-MM-DD (max 90 days from start)")
    timezone:    str   = Field(..., description="IANA timezone, e.g. Asia/Kolkata")
    lat:         float = Field(..., ge=-90,  le=90)
    lon:         float = Field(..., ge=-180, le=180)
    max_results: int   = Field(10, ge=1, le=50)

    @field_validator("event_type")
    @classmethod
    def validate_event_type(cls, v: str) -> str:
        if v not in EVENT_RULES:
            raise ValueError(
                f"Invalid event_type '{v}'. Must be one of: {', '.join(EVENT_RULES.keys())}"
            )
        return v

    @field_validator("end_date")
    @classmethod
    def validate_date_range(cls, v: str, info) -> str:
        try:
            start = date.fromisoformat(info.data.get("start_date", ""))
            end   = date.fromisoformat(v)
        except ValueError:
            raise ValueError("start_date and end_date must be valid YYYY-MM-DD strings")
        if end < start:
            raise ValueError("end_date must be on or after start_date")
        if (end - start).days > 90:
            raise ValueError("Date range cannot exceed 90 days")
        return v


@router.post("/find")
async def find_muhurat(req: MuhuratRequest):
    """
    Find auspicious Muhurat windows for a given event type across a date range.

    Scores each day based on Nakshatra, Tithi, Vara, Yoga and Paksha rules
    from classical Jyotish, then returns the best windows sorted by score.
    """
    try:
        results = find_muhurats(
            event_type  = req.event_type,
            start_date  = req.start_date,
            end_date    = req.end_date,
            timezone    = req.timezone,
            lat         = req.lat,
            lon         = req.lon,
            max_results = req.max_results,
        )
        return {
            "success":    True,
            "event_type": req.event_type,
            "label":      EVENT_RULES[req.event_type]["label"],
            "count":      len(results),
            "muhurats":   results,
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.exception("Muhurat compute error: %s", exc)
        return {"success": False, "error": str(exc)}
