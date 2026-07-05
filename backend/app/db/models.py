"""
backend/app/db/models.py

SQLAlchemy ORM models for BhagyaAI Phase 1.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, JSON, String, Text, Integer
from sqlalchemy.sql import func

from .database import Base


def _new_uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    """
    Registered user with plan subscription.
    Plans: starter (free) | pro | jyotish
    """
    __tablename__ = "users"

    id            = Column(String(36),  primary_key=True, default=_new_uuid)
    email         = Column(String(200), unique=True, nullable=False, index=True)
    password_hash = Column(String(200), nullable=False)
    plan          = Column(String(20),  default="starter", nullable=False)  # starter | pro | jyotish
    chart_count   = Column(Integer,     default=0, nullable=False)          # tracked for starter limit
    is_active     = Column(Boolean,     default=True, nullable=False)
    created_at    = Column(DateTime,    server_default=func.now(), nullable=False)

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r} plan={self.plan}>"


class BirthChart(Base):
    """
    Stores a computed birth chart.
    One user can have multiple charts (self, spouse, child, etc.)
    """
    __tablename__ = "birth_charts"

    id          = Column(String(36), primary_key=True, default=_new_uuid)
    label       = Column(String(100), nullable=True)   # e.g. "My Chart", "Daughter"
    place_name  = Column(String(200), nullable=True)

    # Birth data (inputs)
    dob         = Column(String(10),  nullable=False)  # YYYY-MM-DD
    tob         = Column(String(8),   nullable=False)  # HH:MM or HH:MM:SS
    timezone    = Column(String(50),  nullable=False)
    lat         = Column(Float,       nullable=False)
    lon         = Column(Float,       nullable=False)

    # Computed chart (cached JSON blob)
    chart_json  = Column(JSON,        nullable=True)
    computed_at = Column(DateTime,    nullable=True)

    # Metadata
    created_at  = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at  = Column(DateTime, server_default=func.now(), onupdate=func.now())

    def __repr__(self) -> str:
        return f"<BirthChart id={self.id} label={self.label!r} dob={self.dob}>"


class PageView(Base):
    """
    Tracks every page hit — anonymous (user_id=null) and authenticated.
    Used for the admin analytics dashboard.
    """
    __tablename__ = "page_views"

    id         = Column(String(36),  primary_key=True, default=_new_uuid)
    session_id = Column(String(36),  nullable=False, index=True)  # random UUID per browser tab-session
    user_id    = Column(String(36),  nullable=True,  index=True)  # null = anonymous visitor
    page       = Column(String(200), nullable=True)               # e.g. /chart/new
    referrer   = Column(String(500), nullable=True)
    created_at = Column(DateTime,    server_default=func.now(), nullable=False, index=True)

    def __repr__(self) -> str:
        return f"<PageView session={self.session_id[:8]} user={self.user_id} page={self.page}>"


class ChatSession(Base):
    """
    Stores an AI chat session tied to a birth chart.
    Phase 2 — defined here for schema completeness.
    """
    __tablename__ = "chat_sessions"

    id          = Column(String(36), primary_key=True, default=_new_uuid)
    chart_id    = Column(String(36), nullable=False)  # FK to birth_charts.id
    session_type = Column(String(20), default="vedic")  # vedic | lal_kitab | palmistry
    messages    = Column(JSON,   nullable=True)         # [{role, content}]
    tokens_used = Column(String, nullable=True)
    created_at  = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at  = Column(DateTime, server_default=func.now(), onupdate=func.now())
