"""
backend/app/api/v1/auth.py

Authentication endpoints:
  POST /v1/auth/register   — create account
  POST /v1/auth/login      — returns JWT token
  GET  /v1/auth/me         — returns current user from token
  POST /v1/auth/seed       — seeds 3 test users (dev only)
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.db.database import get_db
from backend.app.db.models import User
from backend.app.core.security import (
    hash_password, verify_password,
    create_token, decode_token, PLAN_LIMITS,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email:    str
    password: str
    plan:     str = "starter"   # starter | pro | jyotish

class LoginRequest(BaseModel):
    email:    str
    password: str


# ── Helpers ───────────────────────────────────────────────────────────────────

def _user_response(user: User, token: str) -> dict:
    return {
        "token": token,
        "user": {
            "id":          user.id,
            "email":       user.email,
            "plan":        user.plan,
            "chart_count": user.chart_count,
            "limits":      PLAN_LIMITS.get(user.plan, PLAN_LIMITS["starter"]),
        },
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/register")
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Create a new account. Returns JWT token immediately."""
    # Normalise
    email = req.email.strip().lower()
    plan  = "starter"  # security: always force new accounts to starter plan

    # Check duplicate
    result = await db.execute(select(User).where(User.email == email))
    if result.scalar_one_or_none():
        raise HTTPException(400, "Email already registered. Please login.")

    user = User(email=email, password_hash=hash_password(req.password), plan=plan)
    db.add(user)
    await db.flush()   # get id assigned

    token = create_token(user.id, user.email, user.plan)
    return _user_response(user, token)


@router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Login with email + password. Returns JWT token."""
    email = req.email.strip().lower()

    result = await db.execute(select(User).where(User.email == email))
    user   = result.scalar_one_or_none()

    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password")

    if not user.is_active:
        raise HTTPException(403, "Account is deactivated. Contact support.")

    token = create_token(user.id, user.email, user.plan)
    return _user_response(user, token)


@router.get("/me")
async def me(token: str, db: AsyncSession = Depends(get_db)):
    """Validate token and return current user info. Pass token as ?token=..."""
    try:
        payload = decode_token(token)
    except Exception:
        raise HTTPException(401, "Invalid or expired token. Please login again.")

    result = await db.execute(select(User).where(User.id == payload["sub"]))
    user   = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")

    return {
        "id":          user.id,
        "email":       user.email,
        "plan":        user.plan,
        "chart_count": user.chart_count,
        "limits":      PLAN_LIMITS.get(user.plan, PLAN_LIMITS["starter"]),
    }


@router.post("/seed")
async def seed_test_users(db: AsyncSession = Depends(get_db)):
    """
    Seed 3 test accounts for plan validation testing.
    Safe to call multiple times — skips existing accounts.

    Accounts created:
      free@thebhagya.com     / Test@free1     → Starter (free)
      pro@thebhagya.com      / Test@pro1      → Bhagya Pro
      jyotish@thebhagya.com  / Test@jyotish1  → Bhagya Jyotish
    """
    test_users = [
        {"email": "free@thebhagya.com",    "password": "Test@free1",    "plan": "starter"},
        {"email": "pro@thebhagya.com",     "password": "Test@pro1",     "plan": "pro"},
        {"email": "jyotish@thebhagya.com", "password": "Test@jyotish1", "plan": "jyotish"},
    ]

    created  = []
    existing = []

    for u in test_users:
        result = await db.execute(select(User).where(User.email == u["email"]))
        if result.scalar_one_or_none():
            existing.append(u["email"])
            continue
        user = User(
            email=u["email"],
            password_hash=hash_password(u["password"]),
            plan=u["plan"],
        )
        db.add(user)
        created.append(u["email"])

    await db.flush()

    return {
        "created":  created,
        "existing": existing,
        "accounts": [
            {"email": "free@thebhagya.com",    "password": "Test@free1",    "plan": "Starter (free)"},
            {"email": "pro@thebhagya.com",     "password": "Test@pro1",     "plan": "Bhagya Pro"},
            {"email": "jyotish@thebhagya.com", "password": "Test@jyotish1", "plan": "Bhagya Jyotish"},
        ],
    }
