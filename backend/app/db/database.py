"""
backend/app/db/database.py

SQLAlchemy async database setup.
- Default: SQLite (zero setup, works out of the box locally)
- Production: PostgreSQL (set DATABASE_URL in .env)
"""

from __future__ import annotations

import os
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

# ── Database URL ──────────────────────────────────────────────────────────
# Defaults to SQLite so developers can run immediately without Docker
_DEFAULT_DB = "sqlite+aiosqlite:///./data/bhagyaai.db"
DATABASE_URL: str = os.getenv("DATABASE_URL", _DEFAULT_DB)

# Ensure data/ directory exists for SQLite (use absolute path — avoids CWD bug)
if DATABASE_URL.startswith("sqlite"):
    Path(__file__).resolve().parent.parent.parent.parent.parent.joinpath("data").mkdir(exist_ok=True)

# ── Engine ────────────────────────────────────────────────────────────────
# connect_args only needed for SQLite (check_same_thread=False for async)
_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_async_engine(
    DATABASE_URL,
    echo=os.getenv("APP_ENV", "development") == "development",  # log SQL in dev
    connect_args=_connect_args,
)

# ── Session factory ───────────────────────────────────────────────────────
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

# ── Base class for ORM models ─────────────────────────────────────────────
class Base(DeclarativeBase):
    pass


# ── Dependency for FastAPI routes ─────────────────────────────────────────
async def get_db() -> AsyncSession:
    """FastAPI dependency — yields an async DB session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


# ── DB init helper ────────────────────────────────────────────────────────
async def init_db() -> None:
    """Create all tables (called at app startup)."""
    # Import models here to ensure they are registered with Base
    from backend.app.db import models  # noqa: F401
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
