"""
backend/app/api/v1/payments.py

Razorpay billing integration for TheBhagya.

Endpoints:
  POST /v1/payments/create-order   — Create a Razorpay order
  POST /v1/payments/verify         — Verify payment signature after checkout

Required env vars:
    RAZORPAY_KEY_ID      — from Razorpay dashboard
    RAZORPAY_KEY_SECRET  — from Razorpay dashboard

Plans:
    starter   ₹0       — 3 charts/month, Vedic + Lal Kitab
    pro       ₹299/mo  — Unlimited charts + PDF + Destiny Chat
    jyotish   ₹799/mo  — Everything + Palmistry (when live) + priority
"""

from __future__ import annotations

import hashlib
import hmac
import logging
import os
from typing import Literal

import httpx
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/payments", tags=["Billing"])

RAZORPAY_KEY_ID     = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")
RAZORPAY_BASE       = "https://api.razorpay.com/v1"

# Plan catalogue (amounts in paise = ₹ × 100)
PLANS: dict[str, dict] = {
    "starter": {
        "name":        "Bhagya Starter",
        "amount":      0,
        "currency":    "INR",
        "description": "3 charts/month — Vedic + Lal Kitab readings",
        "features": [
            "3 birth charts per month",
            "Full Vedic + Lal Kitab reading",
            "Hindi + English toggle",
            "Dasha timeline",
        ],
    },
    "pro": {
        "name":        "Bhagya Pro",
        "amount":      29900,     # ₹299 in paise
        "currency":    "INR",
        "description": "Unlimited charts + PDF reports + Destiny Chat AI",
        "features": [
            "Unlimited birth charts",
            "PDF report download",
            "Destiny Chat — AI astrology conversation",
            "Numerology readings",
            "Everything in Starter",
        ],
    },
    "jyotish": {
        "name":        "Bhagya Jyotish",
        "amount":      79900,     # ₹799 in paise
        "currency":    "INR",
        "description": "Everything Pro + Palmistry (coming soon) + priority support",
        "features": [
            "Everything in Pro",
            "Palmistry reading (when live)",
            "Priority chart queue",
            "Compatibility + synastry analysis",
            "WhatsApp support",
        ],
    },
}


# ── Request / Response schemas ─────────────────────────────────────────────

class CreateOrderRequest(BaseModel):
    plan: Literal["pro", "jyotish"]
    user_email: str = ""
    user_name:  str = ""


class CreateOrderResponse(BaseModel):
    order_id:         str
    amount:           int
    currency:         str
    razorpay_key_id:  str
    plan_name:        str
    description:      str


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id:   str
    razorpay_payment_id: str
    razorpay_signature:  str
    plan:                str


class VerifyPaymentResponse(BaseModel):
    success: bool
    plan:    str
    message: str


# ── GET /v1/payments/plans ─────────────────────────────────────────────────

@router.get("/plans", summary="Get all available plans")
async def get_plans() -> dict:
    return {"plans": PLANS}


# ── POST /v1/payments/create-order ────────────────────────────────────────

@router.post(
    "/create-order",
    response_model=CreateOrderResponse,
    summary="Create a Razorpay payment order",
)
async def create_order(body: CreateOrderRequest) -> CreateOrderResponse:
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.",
        )

    plan = PLANS.get(body.plan)
    if not plan:
        raise HTTPException(status_code=400, detail=f"Unknown plan: {body.plan!r}")

    payload = {
        "amount":   plan["amount"],
        "currency": plan["currency"],
        "receipt":  f"tbhagya_{body.plan}_{body.user_email[:20]}",
        "notes": {
            "plan":       body.plan,
            "user_email": body.user_email,
            "user_name":  body.user_name,
            "platform":   "TheBhagya",
        },
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{RAZORPAY_BASE}/orders",
                json=payload,
                auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET),
            )
            resp.raise_for_status()
            order = resp.json()
    except httpx.HTTPStatusError as exc:
        logger.error("Razorpay error: %s", exc.response.text)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Razorpay API error: {exc.response.status_code}",
        )
    except Exception as exc:
        logger.exception("Create order failed")
        raise HTTPException(status_code=502, detail=str(exc))

    return CreateOrderResponse(
        order_id=order["id"],
        amount=order["amount"],
        currency=order["currency"],
        razorpay_key_id=RAZORPAY_KEY_ID,
        plan_name=plan["name"],
        description=plan["description"],
    )


# ── POST /v1/payments/verify ──────────────────────────────────────────────

@router.post(
    "/verify",
    response_model=VerifyPaymentResponse,
    summary="Verify Razorpay payment signature",
)
async def verify_payment(body: VerifyPaymentRequest) -> VerifyPaymentResponse:
    """
    Razorpay signature verification.
    Signature = HMAC-SHA256(order_id + "|" + payment_id, key_secret)
    """
    if not RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=503, detail="Razorpay not configured.")

    expected = hmac.new(
        RAZORPAY_KEY_SECRET.encode(),
        f"{body.razorpay_order_id}|{body.razorpay_payment_id}".encode(),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected, body.razorpay_signature):
        logger.warning("Payment signature mismatch for order %s", body.razorpay_order_id)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment signature verification failed.",
        )

    logger.info(
        "Payment verified — plan=%s order=%s payment=%s",
        body.plan, body.razorpay_order_id, body.razorpay_payment_id,
    )

    # TODO: Persist subscription record in DB, activate plan for user

    return VerifyPaymentResponse(
        success=True,
        plan=body.plan,
        message=f"Payment successful! Your {PLANS.get(body.plan, {}).get('name', body.plan)} plan is now active.",
    )
