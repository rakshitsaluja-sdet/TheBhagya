"""
backend/app/api/v1/numerology.py

Numerology API — Pillar 4 of TheBhagya.

POST /v1/numerology         Compute all numbers for one person (+ optional partner)
GET  /v1/numerology/meaning Get the meaning of any number 1–33
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.app.core.numerology.engine import NumerologyEngine, _MEANINGS

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/numerology", tags=["Numerology"])

_engine = NumerologyEngine()


# ── Request / Response ─────────────────────────────────────────────────────

class NumerologyRequest(BaseModel):
    full_name:    str = Field(..., min_length=1, max_length=120)
    dob:          str = Field(..., description="YYYY-MM-DD")
    partner_name: Optional[str] = None
    partner_dob:  Optional[str] = None


# ── POST /v1/numerology ────────────────────────────────────────────────────

@router.post("", summary="Compute full numerology reading")
async def compute_numerology(body: NumerologyRequest) -> dict:
    try:
        result = _engine.compute(
            full_name=body.full_name,
            dob=body.dob,
            partner_name=body.partner_name,
            partner_dob=body.partner_dob,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    return result


# ── GET /v1/numerology/meaning/{number} ───────────────────────────────────

@router.get("/meaning/{number}", summary="Get meaning of a numerology number")
async def get_meaning(number: int) -> dict:
    meaning = _MEANINGS.get(number, "")
    if not meaning:
        raise HTTPException(status_code=404, detail="Number out of range. Valid: 1–9, 11, 22, 33.")
    return {"number": number, "meaning": meaning, "is_master": number in {11, 22, 33}}
