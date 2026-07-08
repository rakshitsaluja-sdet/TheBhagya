"""
backend/app/api/v1/kundli_matching.py

Kundli Matching (Ashtakoot) API router.

POST /v1/kundli-matching/compute
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.app.core.jyotish.kundli_matching import compute_kundli_match

router = APIRouter(prefix="/kundli-matching", tags=["Kundli Matching"])


class PersonData(BaseModel):
    name: str          = Field(..., example="Priya")
    dob:  str          = Field(..., example="1992-05-20", description="YYYY-MM-DD")
    tob:  str          = Field(..., example="05:13",      description="HH:MM")
    timezone: str      = Field("Asia/Kolkata",            description="IANA timezone")


class MatchRequest(BaseModel):
    person1: PersonData
    person2: PersonData


@router.post("/compute")
async def compute_match(req: MatchRequest):
    """
    Compute 36-Guna Ashtakoot compatibility between two people.
    """
    try:
        result = compute_kundli_match(
            p1_dob=req.person1.dob, p1_tob=req.person1.tob,
            p1_tz=req.person1.timezone, p1_name=req.person1.name,
            p2_dob=req.person2.dob, p2_tob=req.person2.tob,
            p2_tz=req.person2.timezone, p2_name=req.person2.name,
        )
        return result
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
