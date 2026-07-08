"""
backend/app/api/v1/auth.py

Authentication endpoints:
  POST /v1/auth/register     — create account
  POST /v1/auth/login        — returns JWT token
  GET  /v1/auth/me           — returns current user from token
  POST /v1/auth/google       — Google OAuth login
  POST /v1/auth/otp/send     — send 6-digit OTP to email
  POST /v1/auth/otp/verify   — verify OTP, return JWT (auto-creates account)
  POST /v1/auth/seed         — seeds 3 test users (dev only)
"""

from __future__ import annotations

import os
import logging
import random
import string
import smtplib
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.db.database import get_db
from backend.app.db.models import User, EmailOTP
from backend.app.core.security import (
    hash_password, verify_password,
    create_token, decode_token, PLAN_LIMITS,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Auth"])


# ── Schemas ───────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email:    str
    password: str
    plan:     str = "starter"

class LoginRequest(BaseModel):
    email:    str
    password: str

class GoogleLoginRequest(BaseModel):
    credential: str  # Google ID token (JWT)

class OTPRequest(BaseModel):
    email: str

class OTPVerifyRequest(BaseModel):
    email: str
    otp:   str


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


@router.post("/google")
async def google_login(req: GoogleLoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Verify a Google ID token and return a TheBhagya JWT.
    Creates the user account automatically if first login.
    Requires GOOGLE_CLIENT_ID env var to be set.
    """
    client_id = os.getenv("GOOGLE_CLIENT_ID", "")
    if not client_id:
        raise HTTPException(501, "Google login is not configured on this server.")

    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests
        idinfo = id_token.verify_oauth2_token(
            req.credential,
            google_requests.Request(),
            client_id,
        )
    except Exception as exc:
        logger.warning("Google token verification failed: %s", exc)
        raise HTTPException(401, "Invalid Google credential. Please try again.")

    email = idinfo.get("email", "").strip().lower()
    if not email:
        raise HTTPException(400, "No email in Google token.")

    # Find or create user
    result = await db.execute(select(User).where(User.email == email))
    user   = result.scalar_one_or_none()

    if not user:
        user = User(
            email=email,
            password_hash=hash_password(os.urandom(32).hex()),  # random unusable password
            plan="starter",
        )
        db.add(user)
        await db.flush()
        logger.info("New user via Google OAuth: %s", email)

    if not user.is_active:
        raise HTTPException(403, "Account is deactivated. Contact support.")

    token = create_token(user.id, user.email, user.plan)
    return _user_response(user, token)


# ── OTP helpers ───────────────────────────────────────────────────────────────

def _gen_otp() -> str:
    return ''.join(random.choices(string.digits, k=6))


async def _send_otp_email(to_email: str, otp: str) -> None:
    """Send OTP via SMTP. Falls back to console log if SMTP not configured."""
    smtp_host = os.getenv("SMTP_HOST", "")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASSWORD", "")
    smtp_from = os.getenv("SMTP_FROM", smtp_user)

    if not smtp_host or not smtp_user:
        # Dev fallback — log so you can test without real SMTP
        logger.info("OTP for %s  →  %s  (SMTP not configured)", to_email, otp)
        return

    body = (
        f"Your Bhagya one-time login code is:\n\n"
        f"    {otp}\n\n"
        f"This code expires in 10 minutes. Do not share it with anyone.\n\n"
        f"— Bhagya Team"
    )
    msg = MIMEMultipart()
    msg["From"]    = smtp_from
    msg["To"]      = to_email
    msg["Subject"] = f"{otp} — Your Bhagya login code"
    msg.attach(MIMEText(body, "plain"))

    with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as srv:
        srv.ehlo()
        srv.starttls()
        srv.login(smtp_user, smtp_pass)
        srv.send_message(msg)


# ── OTP routes ────────────────────────────────────────────────────────────────

@router.post("/otp/send")
async def send_otp(req: OTPRequest, db: AsyncSession = Depends(get_db)):
    """
    Generate a 6-digit OTP, store it (10-min expiry), and email it.
    Invalidates any previous unused OTPs for the same email.
    """
    email = req.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(400, "Please enter a valid email address.")

    otp        = _gen_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    # Invalidate stale OTPs for this email
    await db.execute(
        update(EmailOTP)
        .where(EmailOTP.email == email, EmailOTP.used == False)
        .values(used=True)
    )

    db.add(EmailOTP(email=email, otp_code=otp, expires_at=expires_at))
    await db.flush()

    try:
        await _send_otp_email(email, otp)
    except Exception as exc:
        logger.error("SMTP error sending OTP to %s: %s", email, exc)
        raise HTTPException(500, "Failed to send OTP email. Please try again or use email/password login.")

    return {"message": "A 6-digit code has been sent to your email."}


@router.post("/otp/verify")
async def verify_otp(req: OTPVerifyRequest, db: AsyncSession = Depends(get_db)):
    """
    Validate OTP → auto-create user if new → return JWT.
    Works as both registration and login with no password.
    """
    email = req.email.strip().lower()
    code  = req.otp.strip()
    now   = datetime.utcnow()

    result = await db.execute(
        select(EmailOTP)
        .where(
            EmailOTP.email      == email,
            EmailOTP.otp_code   == code,
            EmailOTP.used       == False,
            EmailOTP.expires_at >  now,
        )
        .order_by(EmailOTP.created_at.desc())
        .limit(1)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(401, "Invalid or expired code. Please request a new one.")

    record.used = True
    await db.flush()

    # Find or create user
    result = await db.execute(select(User).where(User.email == email))
    user   = result.scalar_one_or_none()
    if not user:
        user = User(
            email=email,
            password_hash=hash_password(os.urandom(32).hex()),  # random unusable password
            plan="starter",
        )
        db.add(user)
        await db.flush()
        logger.info("New user via OTP: %s", email)

    if not user.is_active:
        raise HTTPException(403, "Account is deactivated. Contact support.")

    token = create_token(user.id, user.email, user.plan)
    return _user_response(user, token)


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
