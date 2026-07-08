"""
backend/app/api/v1/lal_kitab.py

Standalone Lal Kitab endpoint — no chart save, no auth required.

POST /v1/lal-kitab/compute
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.app.core.jyotish.engine import JyotishEngine

router = APIRouter(prefix="/lal-kitab", tags=["Lal Kitab"])

_engine = JyotishEngine()


class LKRequest(BaseModel):
    dob:      str   # YYYY-MM-DD
    tob:      str   # HH:MM
    lat:      float
    lon:      float
    timezone: str = "Asia/Kolkata"


@router.post("/compute")
async def compute_lal_kitab(req: LKRequest):
    """
    Compute Lal Kitab overlay from birth data without saving a chart.
    Returns lagna, house_map, planets (with lk_pucca flags), and full lal_kitab object.
    """
    try:
        result = _engine.compute_chart(
            dob=req.dob,
            tob=req.tob,
            timezone=req.timezone,
            lat=req.lat,
            lon=req.lon,
        )
        return {
            "lagna":     result["lagna"],
            "planets":   result["planets"],
            "house_map": result["house_map"],
            "lal_kitab": result["lal_kitab"],
        }
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
