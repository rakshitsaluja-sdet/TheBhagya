"""
alembic/env.py — Async Alembic environment for TheBhagya.

Reads DATABASE_URL from .env automatically.
Supports both SQLite (local dev) and PostgreSQL (production).
"""

from __future__ import annotations

import asyncio
import os
import sys
from logging.config import fileConfig
from pathlib import Path

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# ── Make sure backend package is importable ───────────────────────────────
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

# ── Load .env ────────────────────────────────────────────────────────────
from dotenv import load_dotenv
load_dotenv(ROOT / ".env")

# ── Import models so Alembic sees them ───────────────────────────────────
from backend.app.db.database import Base  # noqa: F401
import backend.app.db.models  # noqa: F401 — registers all ORM tables with Base

# ── Alembic config object ─────────────────────────────────────────────────
config = context.config

# ── Logging ───────────────────────────────────────────────────────────────
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ── Target metadata (all our ORM models) ─────────────────────────────────
target_metadata = Base.metadata

# ── Database URL from env (overrides alembic.ini sqlalchemy.url) ─────────
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./data/bhagyaai.db")

# Alembic needs a sync driver for some operations — swap async driver names
_SYNC_URL = (
    DATABASE_URL
    .replace("postgresql+asyncpg://", "postgresql+psycopg2://")
    .replace("sqlite+aiosqlite://",   "sqlite:///")
)


# ── Offline migrations (generate SQL without connecting) ─────────────────
def run_migrations_offline() -> None:
    context.configure(
        url=_SYNC_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


# ── Online migrations (async — actually runs against DB) ─────────────────
def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations using the async engine from DATABASE_URL."""
    connectable = async_engine_from_config(
        {"sqlalchemy.url": DATABASE_URL},
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


# ── Entry point ───────────────────────────────────────────────────────────
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
