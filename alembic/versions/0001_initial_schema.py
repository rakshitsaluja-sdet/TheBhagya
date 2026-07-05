"""Initial schema — users, birth_charts, page_views, chat_sessions

Revision ID: 0001
Revises:
Create Date: 2026-07-04
"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── users ─────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id",            sa.String(36),  primary_key=True),
        sa.Column("email",         sa.String(200), nullable=False),
        sa.Column("password_hash", sa.String(200), nullable=False),
        sa.Column("plan",          sa.String(20),  nullable=False, server_default="starter"),
        sa.Column("chart_count",   sa.Integer(),   nullable=False, server_default="0"),
        sa.Column("is_active",     sa.Boolean(),   nullable=False, server_default="true"),
        sa.Column("created_at",    sa.DateTime(),  nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # ── birth_charts ──────────────────────────────────────────────────────
    op.create_table(
        "birth_charts",
        sa.Column("id",          sa.String(36),   primary_key=True),
        sa.Column("label",       sa.String(100),  nullable=True),
        sa.Column("place_name",  sa.String(200),  nullable=True),
        sa.Column("dob",         sa.String(10),   nullable=False),   # YYYY-MM-DD
        sa.Column("tob",         sa.String(8),    nullable=False),   # HH:MM
        sa.Column("timezone",    sa.String(50),   nullable=False),
        sa.Column("lat",         sa.Float(),      nullable=False),
        sa.Column("lon",         sa.Float(),      nullable=False),
        sa.Column("chart_json",  sa.JSON(),       nullable=True),
        sa.Column("computed_at", sa.DateTime(),   nullable=True),
        sa.Column("created_at",  sa.DateTime(),   nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at",  sa.DateTime(),   nullable=False, server_default=sa.func.now()),
    )

    # ── page_views ────────────────────────────────────────────────────────
    op.create_table(
        "page_views",
        sa.Column("id",         sa.String(36),   primary_key=True),
        sa.Column("session_id", sa.String(36),   nullable=False),
        sa.Column("user_id",    sa.String(36),   nullable=True),
        sa.Column("page",       sa.String(200),  nullable=True),
        sa.Column("referrer",   sa.String(500),  nullable=True),
        sa.Column("created_at", sa.DateTime(),   nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_page_views_session_id", "page_views", ["session_id"])
    op.create_index("ix_page_views_user_id",    "page_views", ["user_id"])
    op.create_index("ix_page_views_created_at", "page_views", ["created_at"])

    # ── chat_sessions ─────────────────────────────────────────────────────
    op.create_table(
        "chat_sessions",
        sa.Column("id",           sa.String(36),  primary_key=True),
        sa.Column("chart_id",     sa.String(36),  nullable=False),
        sa.Column("session_type", sa.String(20),  nullable=True, server_default="vedic"),
        sa.Column("messages",     sa.JSON(),      nullable=True),
        sa.Column("tokens_used",  sa.Integer(),   nullable=True),
        sa.Column("created_at",   sa.DateTime(),  nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at",   sa.DateTime(),  nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_chat_sessions_chart_id", "chat_sessions", ["chart_id"])


def downgrade() -> None:
    op.drop_table("chat_sessions")
    op.drop_table("page_views")
    op.drop_table("birth_charts")
    op.drop_table("users")
