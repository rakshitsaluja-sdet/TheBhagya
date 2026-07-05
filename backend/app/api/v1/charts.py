"""
backend/app/api/v1/charts.py

Charts API endpoints.

POST   /v1/charts                    Create + compute a new birth chart
GET    /v1/charts/{chart_id}         Retrieve full chart data
GET    /v1/charts/{chart_id}/dasha   Retrieve full dasha tree
GET    /v1/charts/{chart_id}/pdf     Download chart as PDF report
GET    /v1/charts                    List all charts (summary)
DELETE /v1/charts/{chart_id}         Delete a chart
"""

from __future__ import annotations

import logging
import os
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.jyotish.engine import JyotishEngine
from backend.app.db.database import get_db
from backend.app.db.models import BirthChart
from backend.app.schemas.chart import (
    ChartCreateRequest,
    ChartResponse,
    ChartSummaryResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/charts", tags=["Charts"])

# Single shared engine instance (thread-safe, stateless after init)
_engine = JyotishEngine(ephe_path=os.getenv("EPHE_PATH", ""))


# ── POST /v1/charts ───────────────────────────────────────────────────────

@router.post(
    "",
    response_model=ChartResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create and compute a new birth chart",
)
async def create_chart(
    body: ChartCreateRequest,
    db:   AsyncSession = Depends(get_db),
) -> ChartResponse:
    """
    Accepts birth details, computes the full sidereal chart using Swiss Ephemeris
    (Lahiri ayanamsa), and persists the result. Returns the complete chart JSON.
    """
    try:
        chart_data = _engine.compute_chart(
            dob=body.dob,
            tob=body.tob,
            timezone=body.timezone,
            lat=body.lat,
            lon=body.lon,
            label=body.label or "",
            place_name=body.place_name or "",
            dasha_levels=body.dasha_levels,
        )
    except Exception as exc:
        logger.exception("Chart computation failed")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Chart computation error: {exc}",
        )

    now = datetime.utcnow().isoformat()
    record = BirthChart(
        label=body.label,
        place_name=body.place_name,
        dob=body.dob,
        tob=body.tob,
        timezone=body.timezone,
        lat=body.lat,
        lon=body.lon,
        chart_json=chart_data,
        computed_at=datetime.utcnow(),
    )
    db.add(record)
    await db.flush()   # populates record.id before commit

    return _to_response(record, chart_data, now)


# ── GET /v1/charts ────────────────────────────────────────────────────────

@router.get(
    "",
    response_model=list[ChartSummaryResponse],
    summary="List all stored charts",
)
async def list_charts(
    db: AsyncSession = Depends(get_db),
) -> list[ChartSummaryResponse]:
    result = await db.execute(
        select(BirthChart).order_by(BirthChart.created_at.desc())
    )
    charts = result.scalars().all()
    return [
        ChartSummaryResponse(
            id=c.id,
            label=c.label,
            place_name=c.place_name,
            dob=c.dob,
            tob=c.tob,
            timezone=c.timezone,
            created_at=str(c.created_at),
        )
        for c in charts
    ]


# ── GET /v1/charts/{chart_id} ─────────────────────────────────────────────

@router.get(
    "/{chart_id}",
    response_model=ChartResponse,
    summary="Get full chart data",
)
async def get_chart(
    chart_id: str,
    db: AsyncSession = Depends(get_db),
) -> ChartResponse:
    record = await _get_or_404(chart_id, db)
    return _to_response(record, record.chart_json, str(record.created_at))


# ── GET /v1/charts/{chart_id}/dasha ──────────────────────────────────────

@router.get(
    "/{chart_id}/dasha",
    summary="Get full Vimshottari dasha tree",
)
async def get_dasha(
    chart_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict:
    record = await _get_or_404(chart_id, db)
    chart = record.chart_json or {}
    return {
        "chart_id":     chart_id,
        "label":        record.label,
        "dob":          record.dob,
        "dasha_tree":   chart.get("dasha_tree", []),
        "current_dasha": chart.get("current_dasha", {}),
    }


# ── GET /v1/charts/{chart_id}/pdf ────────────────────────────────────────

@router.get(
    "/{chart_id}/pdf",
    summary="Download chart as a styled PDF report",
)
async def download_pdf(
    chart_id: str,
    db: AsyncSession = Depends(get_db),
) -> Response:
    record = await _get_or_404(chart_id, db)
    try:
        from backend.app.core.pdf_report import generate_pdf
        pdf_bytes = generate_pdf(record.chart_json, label=record.label or record.place_name)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        logger.exception("PDF generation failed")
        raise HTTPException(status_code=500, detail=f"PDF generation error: {exc}")

    filename = f"TheBhagya_{(record.label or chart_id)[:30].replace(' ', '_')}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ── DELETE /v1/charts/{chart_id} ─────────────────────────────────────────

@router.delete(
    "/{chart_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a chart",
)
async def delete_chart(
    chart_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict:
    record = await _get_or_404(chart_id, db)
    await db.delete(record)
    return {"deleted": chart_id}


# ── Helpers ───────────────────────────────────────────────────────────────

async def _get_or_404(chart_id: str, db: AsyncSession) -> BirthChart:
    result = await db.execute(
        select(BirthChart).where(BirthChart.id == chart_id)
    )
    record = result.scalar_one_or_none()
    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Chart {chart_id!r} not found",
        )
    return record


def _to_response(record: BirthChart, chart: dict, created_at: str) -> ChartResponse:
    return ChartResponse(
        id=record.id,
        label=record.label,
        place_name=record.place_name,
        dob=record.dob,
        tob=record.tob,
        timezone=record.timezone,
        lat=record.lat,
        lon=record.lon,
        ayanamsa=chart.get("ayanamsa", 0.0),
        lagna=chart.get("lagna", {}),
        planets=chart.get("planets", {}),
        house_map=chart.get("house_map", {}),
        current_dasha=chart.get("current_dasha", {}),
        lal_kitab=chart.get("lal_kitab", {}),
        computed_at=str(record.computed_at) if record.computed_at else None,
        created_at=created_at,
    )
