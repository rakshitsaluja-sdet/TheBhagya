"""
backend/app/core/security.py

JWT token creation/verification + bcrypt password hashing.
"""

from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone

import bcrypt as _bcrypt
from jose import JWTError, jwt

# ── Config ────────────────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("SECRET_KEY", "bhagya-dev-secret-do-not-use-in-prod-xyz987")
ALGORITHM  = "HS256"
TOKEN_EXPIRE_DAYS = 7

# Plan hierarchy for access checks
PLAN_ORDER = {"starter": 0, "pro": 1, "jyotish": 2}

# Plan feature limits
PLAN_LIMITS = {
    "starter": {"max_charts": 3,   "pdf": False, "chat": False, "numerology": False},
    "pro":     {"max_charts": 999, "pdf": True,  "chat": True,  "numerology": True},
    "jyotish": {"max_charts": 999, "pdf": True,  "chat": True,  "numerology": True},
}

# ── Password hashing ─────────────────────────────────────────────────────────
# Using bcrypt directly — passlib has a version conflict with bcrypt 4.x on Python 3.12

def hash_password(plain: str) -> str:
    return _bcrypt.hashpw(plain.encode("utf-8"), _bcrypt.gensalt(12)).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return _bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

# ── JWT ───────────────────────────────────────────────────────────────────────
def create_token(user_id: str, email: str, plan: str) -> str:
    payload = {
        "sub":   user_id,
        "email": email,
        "plan":  plan,
        "exp":   datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRE_DAYS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    """Raises JWTError if invalid/expired."""
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

def plan_allows(user_plan: str, feature: str) -> bool:
    """Check if a plan has access to a feature (pdf | chat | numerology)."""
    limits = PLAN_LIMITS.get(user_plan, PLAN_LIMITS["starter"])
    return limits.get(feature, False)

def plan_at_least(user_plan: str, required_plan: str) -> bool:
    return PLAN_ORDER.get(user_plan, 0) >= PLAN_ORDER.get(required_plan, 0)
