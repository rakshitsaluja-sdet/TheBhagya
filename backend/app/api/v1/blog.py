"""
backend/app/api/v1/blog.py

Blog CMS endpoints for the Jyotish Journal.

Public:
  GET  /v1/blog/posts             — list published posts (no content field)
  GET  /v1/blog/posts/{slug}      — single published post (with content)

Admin-only (Bearer admin JWT required):
  GET  /v1/blog/posts/all                  — list ALL posts including drafts
  POST /v1/blog/posts                      — create post
  PUT  /v1/blog/posts/{slug}               — full update
  DELETE /v1/blog/posts/{slug}             — delete
  PATCH  /v1/blog/posts/{slug}/publish     — toggle published status
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.security import SECRET_KEY, ALGORITHM
from backend.app.db.database import get_db
from backend.app.db.models import BlogPost

router = APIRouter(prefix="/blog", tags=["Blog"])


# ── Admin auth ────────────────────────────────────────────────────────────────

def _verify_admin_token(authorization: str | None = Header(default=None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Admin token required")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Not an admin token")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired admin token")


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class PostCreate(BaseModel):
    slug:      str
    title:     str
    category:  str | None = None
    excerpt:   str | None = None
    content:   str | None = None
    tags:      list[str] = []
    read_time: str | None = "5 min read"
    published: bool = False


class PostUpdate(PostCreate):
    pass  # same fields as PostCreate


class PostPublishToggle(BaseModel):
    published: bool


# ── Serialisation helpers ─────────────────────────────────────────────────────

def _post_listing(post: BlogPost) -> dict[str, Any]:
    """Listing shape — no content field."""
    return {
        "id":         post.id,
        "slug":       post.slug,
        "title":      post.title,
        "category":   post.category,
        "excerpt":    post.excerpt,
        "tags":       post.tags or [],
        "read_time":  post.read_time,
        "published":  post.published,
        "created_at": post.created_at.isoformat() if post.created_at else None,
    }


def _post_detail(post: BlogPost) -> dict[str, Any]:
    """Detail shape — includes content and updated_at."""
    return {
        "id":         post.id,
        "slug":       post.slug,
        "title":      post.title,
        "category":   post.category,
        "excerpt":    post.excerpt,
        "content":    post.content,
        "tags":       post.tags or [],
        "read_time":  post.read_time,
        "published":  post.published,
        "created_at": post.created_at.isoformat() if post.created_at else None,
        "updated_at": post.updated_at.isoformat() if post.updated_at else None,
    }


# ── Public endpoints ──────────────────────────────────────────────────────────

@router.get("/posts", summary="List published posts")
async def list_published_posts(
    db: AsyncSession = Depends(get_db),
) -> list[dict[str, Any]]:
    """Returns all published posts ordered newest-first, without content body."""
    result = await db.execute(
        select(BlogPost)
        .where(BlogPost.published == True)  # noqa: E712
        .order_by(BlogPost.created_at.desc())
    )
    posts = result.scalars().all()
    return [_post_listing(p) for p in posts]


@router.get("/posts/all", summary="List all posts (admin)")
async def list_all_posts(
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(_verify_admin_token),
) -> list[dict[str, Any]]:
    """Admin only — returns ALL posts regardless of published status."""
    result = await db.execute(
        select(BlogPost).order_by(BlogPost.created_at.desc())
    )
    posts = result.scalars().all()
    return [_post_listing(p) for p in posts]


@router.get("/posts/{slug}", summary="Get single published post")
async def get_post(
    slug: str,
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Returns a single published post with full content. 404 if not found or not published."""
    result = await db.execute(
        select(BlogPost).where(BlogPost.slug == slug)
    )
    post = result.scalar_one_or_none()
    if not post or not post.published:
        raise HTTPException(status_code=404, detail="Post not found")
    return _post_detail(post)


# ── Admin CRUD endpoints ──────────────────────────────────────────────────────

@router.post("/posts", status_code=201, summary="Create post (admin)")
async def create_post(
    body: PostCreate,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(_verify_admin_token),
) -> dict[str, Any]:
    """Admin only — create a new blog post."""
    # Check slug uniqueness
    existing = await db.execute(
        select(BlogPost).where(BlogPost.slug == body.slug)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"Slug '{body.slug}' already exists")

    post = BlogPost(
        slug=body.slug,
        title=body.title,
        category=body.category,
        excerpt=body.excerpt,
        content=body.content,
        tags=body.tags,
        read_time=body.read_time,
        published=body.published,
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return _post_detail(post)


@router.put("/posts/{slug}", summary="Update post (admin)")
async def update_post(
    slug: str,
    body: PostUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(_verify_admin_token),
) -> dict[str, Any]:
    """Admin only — full update of an existing post."""
    result = await db.execute(
        select(BlogPost).where(BlogPost.slug == slug)
    )
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # If slug is being changed, check the new slug is not taken
    if body.slug != slug:
        conflict = await db.execute(
            select(BlogPost).where(BlogPost.slug == body.slug)
        )
        if conflict.scalar_one_or_none():
            raise HTTPException(status_code=409, detail=f"Slug '{body.slug}' already exists")

    post.slug      = body.slug
    post.title     = body.title
    post.category  = body.category
    post.excerpt   = body.excerpt
    post.content   = body.content
    post.tags      = body.tags
    post.read_time = body.read_time
    post.published = body.published

    await db.commit()
    await db.refresh(post)
    return _post_detail(post)


@router.delete("/posts/{slug}", status_code=204, summary="Delete post (admin)")
async def delete_post(
    slug: str,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(_verify_admin_token),
) -> None:
    """Admin only — permanently delete a post."""
    result = await db.execute(
        select(BlogPost).where(BlogPost.slug == slug)
    )
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    await db.delete(post)
    await db.commit()


@router.patch("/posts/{slug}/publish", summary="Toggle published status (admin)")
async def toggle_publish(
    slug: str,
    body: PostPublishToggle,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(_verify_admin_token),
) -> dict[str, Any]:
    """Admin only — set published = true or false."""
    result = await db.execute(
        select(BlogPost).where(BlogPost.slug == slug)
    )
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    post.published = body.published
    await db.commit()
    await db.refresh(post)
    return _post_detail(post)
