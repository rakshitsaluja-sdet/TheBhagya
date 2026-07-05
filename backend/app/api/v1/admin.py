"""
backend/app/api/v1/admin.py

Super-admin endpoints:
  POST /v1/admin/login    — admin credentials → admin JWT
  GET  /v1/admin/stats    — full dashboard metrics (admin-only)
  POST /v1/admin/track    — record a page view (public, called by frontend)
"""

from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy import func, select, case
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.db.database import get_db
from backend.app.db.models import User, BirthChart, PageView
from backend.app.core.security import SECRET_KEY, ALGORITHM, verify_password, hash_password

from jose import JWTError, jwt

router = APIRouter(prefix="/admin", tags=["Admin"])

# ── Admin credentials (from env) ──────────────────────────────────────────────
ADMIN_EMAIL    = os.getenv("ADMIN_EMAIL",    "admin@thebhagya.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "TheBhagya@Admin2025!")

# Admin tokens last 24 hours
ADMIN_TOKEN_HOURS = 24


# ── Schemas ───────────────────────────────────────────────────────────────────

class AdminLoginRequest(BaseModel):
    email:    str
    password: str

class TrackRequest(BaseModel):
    session_id: str
    user_id:    str | None = None
    page:       str | None = None
    referrer:   str | None = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _create_admin_token() -> str:
    payload = {
        "sub":   "admin",
        "email": ADMIN_EMAIL,
        "role":  "admin",
        "exp":   datetime.now(timezone.utc) + timedelta(hours=ADMIN_TOKEN_HOURS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _verify_admin_token(authorization: str | None = Header(default=None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Admin token required")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Not an admin token")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired admin token")


def _day_start(dt: datetime) -> datetime:
    return dt.replace(hour=0, minute=0, second=0, microsecond=0)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/login")
async def admin_login(req: AdminLoginRequest):
    """Validate admin credentials and return a short-lived admin JWT."""
    if req.email.lower() != ADMIN_EMAIL.lower() or req.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    token = _create_admin_token()
    return {"token": token, "email": ADMIN_EMAIL, "role": "admin"}


@router.post("/track")
async def track_page_view(
    req: TrackRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Public endpoint — called by the frontend on every page load.
    Records anonymous and authenticated page hits.
    """
    pv = PageView(
        session_id = req.session_id,
        user_id    = req.user_id or None,
        page       = (req.page or "")[:200],
        referrer   = (req.referrer or "")[:500] if req.referrer else None,
    )
    db.add(pv)
    await db.commit()
    return {"ok": True}


@router.get("/stats")
async def admin_stats(
    admin: dict = Depends(_verify_admin_token),
    db: AsyncSession  = Depends(get_db),
):
    """Full business-intelligence stats for the admin dashboard."""

    now   = _utcnow()
    today = _day_start(now)
    week  = today - timedelta(days=7)
    month = today - timedelta(days=30)

    # ── USER STATS ────────────────────────────────────────────────────────────
    total_users_q = await db.execute(select(func.count()).select_from(User))
    total_users   = total_users_q.scalar() or 0

    new_today_q = await db.execute(
        select(func.count()).select_from(User).where(User.created_at >= today)
    )
    new_today = new_today_q.scalar() or 0

    new_week_q = await db.execute(
        select(func.count()).select_from(User).where(User.created_at >= week)
    )
    new_week = new_week_q.scalar() or 0

    new_month_q = await db.execute(
        select(func.count()).select_from(User).where(User.created_at >= month)
    )
    new_month = new_month_q.scalar() or 0

    # Plan breakdown
    plans_q = await db.execute(
        select(User.plan, func.count()).group_by(User.plan)
    )
    plan_dist = {row[0]: row[1] for row in plans_q.fetchall()}

    starter_count  = plan_dist.get("starter",  0)
    pro_count      = plan_dist.get("pro",       0)
    jyotish_count  = plan_dist.get("jyotish",   0)

    # ── CHART STATS ───────────────────────────────────────────────────────────
    total_charts_q = await db.execute(select(func.count()).select_from(BirthChart))
    total_charts   = total_charts_q.scalar() or 0

    charts_today_q = await db.execute(
        select(func.count()).select_from(BirthChart).where(BirthChart.created_at >= today)
    )
    charts_today = charts_today_q.scalar() or 0

    charts_week_q = await db.execute(
        select(func.count()).select_from(BirthChart).where(BirthChart.created_at >= week)
    )
    charts_week = charts_week_q.scalar() or 0

    avg_charts = round(total_charts / total_users, 2) if total_users else 0

    # ── TRAFFIC / PAGE VIEW STATS ─────────────────────────────────────────────
    total_views_q = await db.execute(select(func.count()).select_from(PageView))
    total_views   = total_views_q.scalar() or 0

    views_today_q = await db.execute(
        select(func.count()).select_from(PageView).where(PageView.created_at >= today)
    )
    views_today = views_today_q.scalar() or 0

    views_week_q = await db.execute(
        select(func.count()).select_from(PageView).where(PageView.created_at >= week)
    )
    views_week = views_week_q.scalar() or 0

    # Anonymous (no sign-in) hits
    anon_today_q = await db.execute(
        select(func.count()).select_from(PageView).where(
            PageView.created_at >= today, PageView.user_id.is_(None)
        )
    )
    anon_today = anon_today_q.scalar() or 0

    anon_week_q = await db.execute(
        select(func.count()).select_from(PageView).where(
            PageView.created_at >= week, PageView.user_id.is_(None)
        )
    )
    anon_week = anon_week_q.scalar() or 0

    # Unique sessions today (distinct session_ids)
    uniq_sessions_today_q = await db.execute(
        select(func.count(func.distinct(PageView.session_id)))
        .select_from(PageView)
        .where(PageView.created_at >= today)
    )
    unique_sessions_today = uniq_sessions_today_q.scalar() or 0

    # Unique sessions this week
    uniq_sessions_week_q = await db.execute(
        select(func.count(func.distinct(PageView.session_id)))
        .select_from(PageView)
        .where(PageView.created_at >= week)
    )
    unique_sessions_week = uniq_sessions_week_q.scalar() or 0

    # Returning sessions (session_ids with more than 1 page view)
    returning_q = await db.execute(
        select(func.count()).select_from(
            select(PageView.session_id)
            .group_by(PageView.session_id)
            .having(func.count(PageView.id) > 1)
            .subquery()
        )
    )
    returning_sessions = returning_q.scalar() or 0

    # Top pages (last 7 days)
    top_pages_q = await db.execute(
        select(PageView.page, func.count().label("hits"))
        .where(PageView.created_at >= week)
        .group_by(PageView.page)
        .order_by(func.count().desc())
        .limit(10)
    )
    top_pages = [{"page": r[0] or "/", "hits": r[1]} for r in top_pages_q.fetchall()]

    # ── DAILY SIGNUPS (last 14 days) ──────────────────────────────────────────
    signups_14d: list[dict] = []
    for i in range(13, -1, -1):
        day_s = today - timedelta(days=i)
        day_e = day_s + timedelta(days=1)
        cnt_q = await db.execute(
            select(func.count()).select_from(User)
            .where(User.created_at >= day_s, User.created_at < day_e)
        )
        signups_14d.append({
            "date":  day_s.strftime("%b %d"),
            "count": cnt_q.scalar() or 0,
        })

    # ── DAILY TRAFFIC (last 7 days) ───────────────────────────────────────────
    traffic_7d: list[dict] = []
    for i in range(6, -1, -1):
        day_s = today - timedelta(days=i)
        day_e = day_s + timedelta(days=1)
        all_q = await db.execute(
            select(func.count()).select_from(PageView)
            .where(PageView.created_at >= day_s, PageView.created_at < day_e)
        )
        anon_q = await db.execute(
            select(func.count()).select_from(PageView)
            .where(PageView.created_at >= day_s, PageView.created_at < day_e,
                   PageView.user_id.is_(None))
        )
        traffic_7d.append({
            "date":  day_s.strftime("%b %d"),
            "total": all_q.scalar() or 0,
            "anon":  anon_q.scalar() or 0,
        })

    # ── RECENT SIGNUPS ────────────────────────────────────────────────────────
    recent_q = await db.execute(
        select(User.email, User.plan, User.created_at)
        .order_by(User.created_at.desc())
        .limit(10)
    )
    recent_signups = [
        {
            "email":      row[0],
            "plan":       row[1],
            "created_at": row[2].strftime("%Y-%m-%d %H:%M") if row[2] else "",
        }
        for row in recent_q.fetchall()
    ]

    # ── REVENUE ESTIMATE (MRR) ────────────────────────────────────────────────
    mrr = (pro_count * 299) + (jyotish_count * 799)

    # ── ASSEMBLE RESPONSE ─────────────────────────────────────────────────────
    return {
        "generated_at": now.strftime("%Y-%m-%d %H:%M UTC"),

        "users": {
            "total":      total_users,
            "new_today":  new_today,
            "new_week":   new_week,
            "new_month":  new_month,
            "by_plan": {
                "starter":  starter_count,
                "pro":      pro_count,
                "jyotish":  jyotish_count,
            },
            "recent":     recent_signups,
            "signups_14d": signups_14d,
        },

        "charts": {
            "total":       total_charts,
            "today":       charts_today,
            "this_week":   charts_week,
            "avg_per_user": avg_charts,
        },

        "traffic": {
            "total_views":          total_views,
            "views_today":          views_today,
            "views_week":           views_week,
            "anon_today":           anon_today,
            "anon_week":            anon_week,
            "unique_sessions_today": unique_sessions_today,
            "unique_sessions_week":  unique_sessions_week,
            "returning_sessions":   returning_sessions,
            "top_pages":            top_pages,
            "traffic_7d":           traffic_7d,
        },

        "revenue": {
            "mrr_inr":      mrr,
            "pro_subs":     pro_count,
            "jyotish_subs": jyotish_count,
            "paid_total":   pro_count + jyotish_count,
        },
    }
