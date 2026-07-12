"""
backend/app/api/v1/chat.py

Destiny Chat — AI conversation endpoint with multi-provider support.

POST /v1/chat
    Accepts: chart_id (optional), message, history[]
    Behaviour:
      • If chart_id is provided, loads the chart from DB and injects the
        full Vedic + Lal Kitab context into the system prompt.
      • Calls the configured LLM provider (Anthropic, OpenRouter, or Groq).
      • Returns the assistant reply as plain JSON.

Provider env vars:
    LLM_PROVIDER       — "anthropic" (default/prod) | "openrouter" | "groq"
    ANTHROPIC_API_KEY  — required when LLM_PROVIDER=anthropic
    OPENROUTER_API_KEY — required when LLM_PROVIDER=openrouter
    GROQ_API_KEY       — required when LLM_PROVIDER=groq

Optional:
    CHAT_MODEL         — overrides the default model for the chosen provider
    CHAT_MAX_TOKENS    — default: 1024

Default models per provider:
    anthropic:   claude-haiku-4-5-20251001       (paid, production)
    openrouter:  meta-llama/llama-3.3-70b-instruct:free  (free tier)
    groq:        llama-3.1-8b-instant               (free tier)
"""

from __future__ import annotations

import logging
import os
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.db.database import get_db
from backend.app.db.models import BirthChart

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["Destiny Chat"])

# ── Provider config ────────────────────────────────────────────────────────────

LLM_PROVIDER    = os.getenv("LLM_PROVIDER", "anthropic").lower()
CHAT_MAX_TOKENS = int(os.getenv("CHAT_MAX_TOKENS", "1024"))

_PROVIDER_DEFAULTS = {
    "anthropic":   "claude-haiku-4-5-20251001",
    "openrouter":  "meta-llama/llama-3.3-70b-instruct:free",
    "groq":        "llama-3.1-8b-instant",
}
CHAT_MODEL = os.getenv("CHAT_MODEL", _PROVIDER_DEFAULTS.get(LLM_PROVIDER, ""))

_API_KEYS = {
    "anthropic":  os.getenv("ANTHROPIC_API_KEY", ""),
    "openrouter": os.getenv("OPENROUTER_API_KEY", ""),
    "groq":       os.getenv("GROQ_API_KEY", ""),
}
_URLS = {
    "anthropic":  "https://api.anthropic.com/v1/messages",
    "openrouter": "https://openrouter.ai/api/v1/chat/completions",
    "groq":       "https://api.groq.com/openai/v1/chat/completions",
}


def _get_api_key() -> str:
    return _API_KEYS.get(LLM_PROVIDER, "")


def _build_headers() -> dict:
    key = _get_api_key()
    if LLM_PROVIDER == "anthropic":
        return {
            "x-api-key":         key,
            "anthropic-version": "2023-06-01",
            "content-type":      "application/json",
        }
    return {
        "Authorization": f"Bearer {key}",
        "Content-Type":  "application/json",
    }


def _build_payload(system_prompt: str, messages: list[dict]) -> dict:
    if LLM_PROVIDER == "anthropic":
        return {
            "model":      CHAT_MODEL,
            "max_tokens": CHAT_MAX_TOKENS,
            "system":     system_prompt,
            "messages":   messages,
        }
    # OpenAI-compatible (OpenRouter + Groq)
    return {
        "model":      CHAT_MODEL,
        "max_tokens": CHAT_MAX_TOKENS,
        "messages":   [{"role": "system", "content": system_prompt}] + messages,
    }


def _extract_reply(data: dict) -> str:
    if LLM_PROVIDER == "anthropic":
        return data.get("content", [{}])[0].get("text", "")
    # OpenAI-compatible
    choices = data.get("choices", [])
    if choices:
        return choices[0].get("message", {}).get("content", "")
    return ""


# ── Request / Response schemas ─────────────────────────────────────────────

class ChatMessage(BaseModel):
    role:    str   # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message:  str                         = Field(..., min_length=1, max_length=2000)
    chart_id: Optional[str]               = None
    history:  list[ChatMessage]           = Field(default_factory=list)
    lang:     str                         = "en"   # "en" or "hi"


class ChatResponse(BaseModel):
    reply:      str
    model:      str
    chart_used: bool


# ── System prompt builder ──────────────────────────────────────────────────

def _build_system_prompt(chart: dict | None, lang: str) -> str:
    """
    Build a rich Vedic astrology system prompt.
    If chart data is available, inject the person's specific placements.
    """
    base = (
        "You are Bhagya, an expert Vedic astrology guide within the TheBhagya platform. "
        "You interpret birth charts using the classical Parashari (BPHS) system, "
        "Vimshottari Dasha, and Lal Kitab traditions. "
        "You are warm, grounded, and specific — never generic. "
        "You give practical, actionable insights alongside deeper symbolic meanings. "
        "You never claim to predict exact events — you describe cosmic tendencies and karmic directions. "
        "You are comfortable with both English and Hindi questions. "
        "Avoid lengthy preambles. Get to the insight quickly. "
        "Always ground answers in the specific chart placements provided."
    )

    if not chart:
        return base + (
            "\n\nNo birth chart has been loaded for this session. "
            "Offer to interpret if the user provides their birth details, "
            "or answer general astrology questions thoughtfully."
        )

    lagna   = chart.get("lagna", {})
    planets = chart.get("planets", {})
    dasha   = chart.get("current_dasha", {})
    lk      = chart.get("lal_kitab", {})

    lagna_sign = lagna.get("sign", "Unknown")
    lagna_nak  = lagna.get("nakshatra", "")
    moon_data  = planets.get("Moon", {})
    sun_data   = planets.get("Sun", {})
    md_lord    = dasha.get("mahadasha", {}).get("lord", "")
    ad_lord    = dasha.get("antardasha", {}).get("lord", "")
    md_end     = dasha.get("mahadasha", {}).get("end_date", "")
    ad_end     = dasha.get("antardasha", {}).get("end_date", "")

    planet_lines = []
    for name, p in planets.items():
        sign    = p.get("sign", "?")
        house   = p.get("house", "?")
        nak     = p.get("nakshatra", "")
        retro   = " ℞" if p.get("retrograde") else ""
        planet_lines.append(f"  {name}: {sign} H{house} ({nak}){retro}")

    lk_axis    = lk.get("rahu_ketu_axis", "")
    lk_pucca   = ", ".join(p["planet"] for p in lk.get("pucca_ghar_planets", []))
    lk_foreign = lk.get("foreign_indicator", False)

    chart_block = f"""
--- BIRTH CHART LOADED ---
Ascendant (Lagna): {lagna_sign} ({lagna_nak})
Moon: {moon_data.get('sign','?')} H{moon_data.get('house','?')} ({moon_data.get('nakshatra','')})
Sun: {sun_data.get('sign','?')} H{sun_data.get('house','?')}
Current Dasha: {md_lord} Mahadasha / {ad_lord} Antardasha (ends {ad_end}; MD ends {md_end})

Planetary Positions:
{chr(10).join(planet_lines)}

Lal Kitab Overlay:
  Rahu-Ketu Axis: {lk_axis}
  Pucca Ghar Planets: {lk_pucca or 'None'}
  Foreign Settlement Indicator: {'Yes' if lk_foreign else 'No'}
---

Use the above chart data as the primary reference for all answers.
"""
    return base + chart_block


# ── POST /v1/chat ──────────────────────────────────────────────────────────

@router.post(
    "",
    response_model=ChatResponse,
    summary="Send a message to the Destiny Chat AI",
)
async def chat(
    body: ChatRequest,
    db:   AsyncSession = Depends(get_db),
) -> ChatResponse:
    if not _get_api_key():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"API key for provider '{LLM_PROVIDER}' is not configured.",
        )

    # Load chart if provided
    chart_data = None
    if body.chart_id:
        result = await db.execute(
            select(BirthChart).where(BirthChart.id == body.chart_id)
        )
        record = result.scalar_one_or_none()
        if record:
            chart_data = record.chart_json

    system_prompt = _build_system_prompt(chart_data, body.lang)

    messages = [
        {"role": m.role, "content": m.content}
        for m in body.history
        if m.role in ("user", "assistant")
    ]
    messages.append({"role": "user", "content": body.message})

    url     = _URLS[LLM_PROVIDER]
    payload = _build_payload(system_prompt, messages)

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, headers=_build_headers(), json=payload)
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPStatusError as exc:
        logger.error("%s API error: %s — %s", LLM_PROVIDER, exc.response.status_code, exc.response.text)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"{LLM_PROVIDER} returned {exc.response.status_code}.",
        )
    except Exception as exc:
        logger.exception("Chat request failed")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Chat service error: {exc}",
        )

    return ChatResponse(
        reply=_extract_reply(data),
        model=data.get("model", CHAT_MODEL),
        chart_used=chart_data is not None,
    )
