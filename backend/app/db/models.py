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
    __tablename__ = "users"
    id            = Column(String(36),  primary_key=True, default=_new_uuid)
    email         = Column(String(200), unique=True, nullable=False, index=True)
    password_hash = Column(String(200), nullable=False)
    plan          = Column(String(20),  default="starter", nullable=False)
    chart_count   = Column(Integer,     default=0, nullable=False)
    is_active     = Column(Boolean,     default=True, nullable=False)
    created_at    = Column(DateTime,    server_default=func.now(), nullable=False)
    def __repr__(self): return f"<User {self.email!r}>"


class BirthChart(Base):
    __tablename__ = "birth_charts"
    id          = Column(String(36),  primary_key=True, default=_new_uuid)
    label       = Column(String(100), nullable=True)
    place_name  = Column(String(200), nullable=True)
    dob         = Column(String(10),  nullable=False)
    tob         = Column(String(8),   nullable=False)
    timezone    = Column(String(50),  nullable=False)
    lat         = Column(Float,       nullable=False)
    lon         = Column(Float,       nullable=False)
    chart_json  = Column(JSON,        nullable=True)
    computed_at = Column(DateTime,    nullable=True)
    created_at  = Column(DateTime,    server_default=func.now(), nullable=False)
    updated_at  = Column(DateTime,    server_default=func.now(), onupdate=func.now())
    def __repr__(self): return f"<BirthChart {self.label!r}>"


class PageView(Base):
    __tablename__ = "page_views"
    id         = Column(String(36),  primary_key=True, default=_new_uuid)
    session_id = Column(String(36),  nullable=False, index=True)
    user_id    = Column(String(36),  nullable=True,  index=True)
    page       = Column(String(200), nullable=True)
    referrer   = Column(String(500), nullable=True)
    created_at = Column(DateTime,    server_default=func.now(), nullable=False, index=True)
    def __repr__(self): return f"<PageView {self.page}>"


class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id           = Column(String(36), primary_key=True, default=_new_uuid)
    chart_id     = Column(String(36), nullable=False)
    session_type = Column(String(20), default="vedic")
    messages     = Column(JSON,       nullable=True)
    tokens_used  = Column(String,     nullable=True)
    created_at   = Column(DateTime,   server_default=func.now(), nullable=False)
    updated_at   = Column(DateTime,   server_default=func.now(), onupdate=func.now())


class EmailOTP(Base):
    __tablename__ = "email_otps"
    id         = Column(String(36),  primary_key=True, default=_new_uuid)
    email      = Column(String(200), nullable=False, index=True)
    otp_code   = Column(String(6),   nullable=False)
    expires_at = Column(DateTime,    nullable=False)
    used       = Column(Boolean,     default=False, nullable=False)
    created_at = Column(DateTime,    server_default=func.now(), nullable=False)
    def __repr__(self): return f"<EmailOTP {self.email!r}>"


class BlogPost(Base):
    __tablename__ = "posts"
    id         = Column(Integer,     primary_key=True, autoincrement=True)
    slug       = Column(String(255), unique=True, nullable=False, index=True)
    title      = Column(Text,        nullable=False)
    category   = Column(String(100), nullable=True)
    excerpt    = Column(Text,        nullable=True)
    content    = Column(Text,        nullable=True)
    tags       = Column(JSON,        nullable=True)
    read_time  = Column(String(50),  nullable=True)
    published  = Column(Boolean,     default=False, nullable=False)
    created_at = Column(DateTime,    server_default=func.now(), nullable=False)
    updated_at = Column(DateTime,    server_default=func.now(), onupdate=func.now())
    def __repr__(self): return f"<BlogPost {self.slug!r}>"
