"""
setup_postgres.py — One-time Supabase PostgreSQL setup for TheBhagya.

Run this ONCE from the BhagyaAI folder:
    python setup_postgres.py

What it does:
  1. Connects to your Supabase PostgreSQL database
  2. Creates all 4 tables: users, birth_charts, page_views, chat_sessions
  3. Seeds the 3 test accounts (free / pro / jyotish)
  4. Verifies everything worked

Requirements: pip install asyncpg sqlalchemy[asyncio] python-dotenv passlib[bcrypt]
"""

import asyncio
import os
import sys
from pathlib import Path

# ── Load .env ────────────────────────────────────────────────────────────
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

DATABASE_URL = os.getenv("DATABASE_URL", "")
if not DATABASE_URL or DATABASE_URL.startswith("sqlite"):
    print("ERROR: DATABASE_URL in .env is still pointing to SQLite.")
    print("       Make sure it starts with postgresql+asyncpg://")
    sys.exit(1)

print(f"Connecting to: {DATABASE_URL[:50]}...")

# ── SQLAlchemy setup ─────────────────────────────────────────────────────
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text

# Import Base + models so they register with metadata
sys.path.insert(0, str(Path(__file__).parent))
from backend.app.db.database import Base
import backend.app.db.models as _models  # noqa — registers all tables

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def create_tables() -> None:
    print("\n[1/3] Creating tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("      ✓ users, birth_charts, page_views, chat_sessions — created (or already exist)")


async def seed_test_users() -> None:
    print("\n[2/3] Seeding test accounts...")
    import bcrypt as _bcrypt
    from backend.app.db.models import User
    from sqlalchemy import select
    import uuid

    def _hash(password: str) -> str:
        # Use bcrypt directly — avoids passlib/bcrypt 4.x version conflict
        return _bcrypt.hashpw(password.encode("utf-8"), _bcrypt.gensalt(12)).decode("utf-8")

    TEST_USERS = [
        {"email": "free@thebhagya.com",     "password": "Test@free1",     "plan": "starter"},
        {"email": "pro@thebhagya.com",       "password": "Test@pro1",       "plan": "pro"},
        {"email": "jyotish@thebhagya.com",   "password": "Test@jyotish1",   "plan": "jyotish"},
    ]

    async with AsyncSessionLocal() as db:
        for u in TEST_USERS:
            result = await db.execute(select(User).where(User.email == u["email"]))
            existing = result.scalar_one_or_none()
            if existing:
                print(f"      · {u['email']} — already exists, skipping")
            else:
                db.add(User(
                    id=str(uuid.uuid4()),
                    email=u["email"],
                    password_hash=_hash(u["password"]),
                    plan=u["plan"],
                ))
                print(f"      + {u['email']} ({u['plan']}) — created")
        await db.commit()


async def verify() -> None:
    print("\n[3/3] Verifying...")
    async with engine.connect() as conn:
        for table in ["users", "birth_charts", "page_views", "chat_sessions"]:
            result = await conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
            count = result.scalar()
            print(f"      ✓ {table}: {count} rows")


async def main() -> None:
    try:
        await create_tables()
        await seed_test_users()
        await verify()
        print("\n✅  Supabase setup complete! You can now start the app with .\\start.ps1")
    except Exception as e:
        print(f"\n❌  Error: {e}")
        print("\nCommon fixes:")
        print("  • Check DATABASE_URL in .env matches your Supabase connection string")
        print("  • Make sure your Supabase project is not paused")
        print("  • Check if your IP is allowed in Supabase → Settings → Database → Connection")
        raise
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
