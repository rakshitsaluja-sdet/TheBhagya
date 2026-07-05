"""
backend/app/schemas/chart.py

Pydantic request/response schemas for the charts API.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator


# ── Request schemas ───────────────────────────────────────────────────────

class ChartCreateRequest(BaseModel):
    """Body for POST /v1/charts"""
    label:      Optional[str]   = Field(None,  description="Display name, e.g. 'My Chart'")
    dob:        str             = Field(...,   description="Date of birth — YYYY-MM-DD")
    tob:        str             = Field(...,   description="Time of birth (local) — HH:MM")
    timezone:   str             = Field(...,   description="pytz timezone, e.g. 'Asia/Kolkata'")
    lat:        float           = Field(...,   description="Birth latitude (positive = North)")
    lon:        float           = Field(...,   description="Birth longitude (positive = East)")
    place_name: Optional[str]   = Field(None,  description="City / place name for display")
    dasha_levels: int           = Field(2,     description="Dasha depth: 1=MD, 2=MD+AD, 3=MD+AD+PAD")

    @field_validator("dob")
    @classmethod
    def validate_dob(cls, v: str) -> str:
        from datetime import date
        try:
            date.fromisoformat(v)
        except ValueError:
            raise ValueError("dob must be in YYYY-MM-DD format")
        return v

    @field_validator("tob")
    @classmethod
    def validate_tob(cls, v: str) -> str:
        parts = v.split(":")
        if len(parts) < 2:
            raise ValueError("tob must be in HH:MM or HH:MM:SS format")
        return v

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, v: str) -> str:
        import pytz
        if v not in pytz.all_timezones_set:
            raise ValueError(f"Unknown timezone: {v}")
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "label":      "Rakshit Saluja",
                "dob":        "1992-05-20",
                "tob":        "17:13",
                "timezone":   "Asia/Kolkata",
                "lat":        26.4499,
                "lon":        80.3319,
                "place_name": "Kanpur, Uttar Pradesh, India",
                "dasha_levels": 2,
            }
        }
    }


# ── Response schemas ──────────────────────────────────────────────────────

class PlanetData(BaseModel):
    longitude:  float
    sign:       str
    degree:     float
    nakshatra:  str
    nak_lord:   str
    pada:       int
    house:      int
    lk_pucca:   bool
    retrograde: bool


class LagnaData(BaseModel):
    longitude:  float
    sign:       str
    sign_index: int
    degree:     float
    nakshatra:  str
    nak_lord:   str
    pada:       int


class DashaEntry(BaseModel):
    lord:        str
    years:       float
    start:       str
    end:         str
    antardashas: list[Any] = []


class CurrentDasha(BaseModel):
    mahadasha:  Optional[dict] = None
    antardasha: Optional[dict] = None


class LalKitabData(BaseModel):
    pucca_ghar_planets: list[dict]
    rahu_ketu_axis:     str
    foreign_indicator:  bool


class ChartResponse(BaseModel):
    id:            str
    label:         Optional[str]
    place_name:    Optional[str]
    dob:           str
    tob:           str
    timezone:      str
    lat:           float
    lon:           float
    ayanamsa:      float
    lagna:         dict
    planets:       dict[str, Any]
    house_map:     dict[str, list[str]]
    current_dasha: dict
    lal_kitab:     dict
    computed_at:   Optional[str]
    created_at:    str


class ChartSummaryResponse(BaseModel):
    """Lightweight response for list endpoints."""
    id:         str
    label:      Optional[str]
    place_name: Optional[str]
    dob:        str
    tob:        str
    timezone:   str
    created_at: str
