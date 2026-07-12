"""
backend/app/main.py

TheBhagya / BhagyaAI FastAPI application.
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.db.database import init_db, AsyncSessionLocal
from backend.app.db.models import User
from backend.app.core.security import hash_password
from sqlalchemy import select
from backend.app.api.v1.auth            import router as auth_router
from backend.app.api.v1.charts          import router as charts_router
from backend.app.api.v1.chat            import router as chat_router
from backend.app.api.v1.numerology      import router as numerology_router
from backend.app.api.v1.payments        import router as payments_router
from backend.app.api.v1.admin           import router as admin_router
from backend.app.api.v1.horoscope       import router as horoscope_router
from backend.app.api.v1.sade_sati       import router as sade_sati_router
from backend.app.api.v1.doshas          import router as doshas_router
from backend.app.api.v1.kundli_matching import router as kundli_matching_router
from backend.app.api.v1.lal_kitab      import router as lal_kitab_router
from backend.app.api.v1.panchang       import router as panchang_router
from backend.app.api.v1.varshphal      import router as varshphal_router
from backend.app.api.v1.transit        import router as transit_router
from backend.app.api.v1.muhurat       import router as muhurat_router
from backend.app.api.v1.kp            import router as kp_router
from backend.app.api.v1.nadi          import router as nadi_router
from backend.app.api.v1.blog          import router as blog_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger("bhagyaai")

_TEST_USERS = [
    {"email": "free@thebhagya.com",    "password": "Test@free1",    "plan": "free"},
    {"email": "jyotish@thebhagya.com", "password": "Test@jyotish1", "plan": "jyotish"},
    {"email": "guru@thebhagya.com",    "password": "Test@guru1",    "plan": "guru"},
]

async def _seed_test_users() -> None:
    async with AsyncSessionLocal() as db:
        try:
            created = []
            for u in _TEST_USERS:
                result = await db.execute(select(User).where(User.email == u["email"]))
                if result.scalar_one_or_none():
                    continue
                db.add(User(
                    email=u["email"],
                    password_hash=hash_password(u["password"]),
                    plan=u["plan"],
                ))
                created.append(u["email"])
            await db.commit()
            if created:
                logger.info("Seeded test accounts: %s", created)
        except Exception as exc:
            logger.warning("Could not seed test accounts: %s", exc)
            await db.rollback()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("TheBhagya API starting")
    await init_db()
    await _seed_test_users()
    yield
    logger.info("TheBhagya API shutting down.")


app = FastAPI(
    title="TheBhagya API",
    description="Vedic Astrology platform with Swiss Ephemeris precision.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

_default_origins = ",".join([
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8000",
    "https://thebhagya.com",
    "https://www.thebhagya.com",
    "https://the-bhagya.vercel.app",
])

_origins = os.getenv("ALLOWED_ORIGINS", _default_origins).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = os.getenv("API_V1_PREFIX", "/v1")

app.include_router(auth_router,            prefix=API_PREFIX)
app.include_router(charts_router,          prefix=API_PREFIX)
app.include_router(chat_router,            prefix=API_PREFIX)
app.include_router(numerology_router,      prefix=API_PREFIX)
app.include_router(payments_router,        prefix=API_PREFIX)
app.include_router(admin_router,           prefix=API_PREFIX)
app.include_router(horoscope_router,       prefix=API_PREFIX)
app.include_router(sade_sati_router,       prefix=API_PREFIX)
app.include_router(doshas_router,          prefix=API_PREFIX)
app.include_router(kundli_matching_router, prefix=API_PREFIX)
app.include_router(lal_kitab_router,       prefix=API_PREFIX)
app.include_router(panchang_router,        prefix=API_PREFIX)
app.include_router(varshphal_router,       prefix=API_PREFIX)
app.include_router(transit_router,         prefix=API_PREFIX)
app.include_router(muhurat_router,         prefix=API_PREFIX)
app.include_router(kp_router,             prefix=API_PREFIX)
app.include_router(nadi_router,           prefix=API_PREFIX)
app.include_router(blog_router,           prefix=API_PREFIX)


@app.get("/health", tags=["System"])
async def health() -> dict:
    return {"status": "ok", "service": "TheBhagya", "version": "2.0.0"}


@app.get("/", tags=["System"])
async def root() -> dict:
    return {
        "message": "TheBhagya API v2",
        "version": "2.0.0",
        "docs":    "/docs",
        "health":  "/health",
        "endpoints": {
            "charts":          f"{API_PREFIX}/charts",
            "chat":            f"{API_PREFIX}/chat",
            "numerology":      f"{API_PREFIX}/numerology",
            "payments":        f"{API_PREFIX}/payments/plans",
            "horoscope":       f"{API_PREFIX}/horoscope/today",
            "sade_sati":       f"{API_PREFIX}/sade-sati/by-moon-sign",
            "doshas":          f"{API_PREFIX}/doshas/compute",
            "kundli_matching": f"{API_PREFIX}/kundli-matching/compute",
            "lal_kitab":       f"{API_PREFIX}/lal-kitab/compute",
        },
    }
