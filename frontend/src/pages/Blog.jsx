import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getBlogPosts } from '../hooks/useApi'

// ── Design tokens ──────────────────────────────────────────────────────────────
const GOLD   = '#DFA84F'
const GOLD_L = '#F2CB84'
const BG_CARD = 'rgba(19,15,36,0.72)'

// ── Category config ────────────────────────────────────────────────────────────
const CATEGORIES = ['All', 'Saturn', 'Planets', 'Doshas', 'Advanced', 'Beginners', 'Ancient Systems', 'Timing']

const CAT_COLORS = {
  Saturn:            '#8B6FE8',
  Planets:           '#DFA84F',
  Doshas:            '#E53935',
  Advanced:          '#26C6DA',
  Beginners:         '#43A047',
  'Ancient Systems': '#F9A825',
  Timing:            '#5C6BC0',
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function CategoryBadge({ category }) {
  const color = CAT_COLORS[category] || GOLD
  return (
    <span style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '0.65rem',
      textTransform: 'uppercase',
      letterSpacing: '2px',
      color,
      background: `${color}18`,
      border: `1px solid ${color}55`,
      borderRadius: 999,
      padding: '0.2rem 0.6rem',
      display: 'inline-block',
      whiteSpace: 'nowrap',
    }}>
      {category}
    </span>
  )
}

function PostCard({ post }) {
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      to={`/blog/${post.slug}`}
      style={{ textDecoration: 'none', display: 'block', height: '100%' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        background: BG_CARD,
        border: `1px solid ${hovered ? 'rgba(223,168,79,0.48)' : 'var(--border)'}`,
        borderRadius: 12,
        padding: '1.5rem',
        backdropFilter: 'blur(18px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(18px) saturate(1.4)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'border-color 0.2s ease, transform 0.2s ease',
        height: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}>
        <CategoryBadge category={post.category} />

        <h3 style={{
          fontFamily: "'Fraunces', serif",
          color: 'var(--text-primary)',
          fontSize: '1.1rem',
          fontWeight: 600,
          lineHeight: 1.35,
          margin: 0,
        }}>
          {post.title}
        </h3>

        <p style={{
          color: 'var(--text-muted)',
          fontSize: '0.87rem',
          lineHeight: 1.6,
          margin: 0,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          flexGrow: 1,
        }}>
          {post.excerpt}
        </p>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border)',
          marginTop: 'auto',
        }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.7rem',
              color: 'var(--text-dim)',
            }}>
              {formatDate(post.created_at)}
            </span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.7rem',
              color: 'var(--text-dim)',
            }}>
              {post.read_time}
            </span>
          </div>
          <span style={{
            color: GOLD,
            fontSize: '0.85rem',
            fontWeight: 500,
            flexShrink: 0,
          }}>
            Read →
          </span>
        </div>
      </div>
    </Link>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function Blog() {
  const [posts, setPosts]                 = useState([])
  const [loading, setLoading]             = useState(true)
  const [selectedCategory, setCategory]  = useState('All')
  const [search, setSearch]               = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  useEffect(() => {
    async function fetchPosts() {
      try {
        const data = await getBlogPosts()
        setPosts(data)
      } catch (err) {
        console.error('Failed to load posts:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPosts()
  }, [])

  const filtered = posts.filter(p => {
    const catMatch  = selectedCategory === 'All' || p.category === selectedCategory
    const q         = search.trim().toLowerCase()
    const textMatch = !q || p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q)
    return catMatch && textMatch
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingBottom: '5rem' }}>
      <style>{`
        .blog-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }
        @media (max-width: 960px) {
          .blog-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 580px) {
          .blog-grid { grid-template-columns: 1fr; }
          .blog-header { padding: 3rem 1.25rem 2.5rem !important; }
          .blog-controls { padding: 1.5rem 1.25rem 0 !important; }
        }
        .cat-pill {
          cursor: pointer;
          border-radius: 999px;
          padding: 0.45rem 1.1rem;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.7rem;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          white-space: nowrap;
          transition: border-color 0.15s, color 0.15s, background 0.15s;
        }
        .cat-pill:hover {
          border-color: #F2CB84 !important;
          color: #F2CB84 !important;
        }
        .blog-search::placeholder {
          color: var(--text-dim);
        }
        .blog-search:focus {
          outline: none;
        }
      `}</style>

      {/* ── Header ── */}
      <div
        className="blog-header"
        style={{
          background: 'linear-gradient(180deg, rgba(19,15,36,0.92) 0%, transparent 100%)',
          borderBottom: '1px solid var(--border)',
          padding: '5rem 2rem 3.5rem',
          textAlign: 'center',
        }}
      >
        <h1 style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 'clamp(2.4rem, 5.5vw, 3.8rem)',
          fontWeight: 700,
          background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_L} 60%, ${GOLD} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: '0 0 0.85rem',
          lineHeight: 1.1,
          letterSpacing: '-0.5px',
        }}>
          Jyotish Journal
        </h1>
        <p style={{
          color: 'var(--text-muted)',
          fontFamily: "'Inter', sans-serif",
          fontSize: '1.05rem',
          margin: 0,
          letterSpacing: '0.1px',
        }}>
          Ancient wisdom, clearly explained
        </p>
      </div>

      {/* ── Controls ── */}
      <div
        className="blog-controls"
        style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 2rem 0' }}
      >
        {/* Category pills — horizontal scroll */}
        <div style={{
          display: 'flex',
          gap: '0.6rem',
          overflowX: 'auto',
          paddingBottom: '0.75rem',
          marginBottom: '1.5rem',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}>
          {CATEGORIES.map(cat => {
            const active = selectedCategory === cat
            return (
              <button
                key={cat}
                className="cat-pill"
                onClick={() => setCategory(cat)}
                style={{
                  background: active ? GOLD : 'transparent',
                  border:     `1px solid ${active ? GOLD : 'rgba(223,168,79,0.32)'}`,
                  color:      active ? '#07060F' : 'var(--text-muted)',
                  fontWeight: active ? 700 : 400,
                }}
              >
                {cat}
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div style={{ marginBottom: '2.5rem', maxWidth: 480 }}>
          <input
            type="text"
            placeholder="Search articles..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="blog-search"
            style={{
              width: '100%',
              background: 'var(--bg-input)',
              border: `1px solid ${searchFocused ? GOLD : 'var(--border)'}`,
              borderRadius: 10,
              padding: '0.75rem 1.1rem',
              color: 'var(--text-primary)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.85rem',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
            }}
          />
        </div>

        {/* ── Content states ── */}
        {loading ? (
          <p style={{
            color: 'var(--text-dim)',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.82rem',
            letterSpacing: '1px',
          }}>
            Loading...
          </p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: '0 0 0.4rem' }}>
              No articles found.
            </p>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.87rem', margin: '0 0 1.25rem' }}>
              Try a different category or search term.
            </p>
            <button
              onClick={() => { setCategory('All'); setSearch('') }}
              style={{
                background: 'transparent',
                border: `1px solid ${GOLD}`,
                color: GOLD,
                borderRadius: 999,
                padding: '0.5rem 1.4rem',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.72rem',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <p style={{
              color: 'var(--text-dim)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.72rem',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: '1.5rem',
            }}>
              {filtered.length} {filtered.length === 1 ? 'article' : 'articles'}
              {selectedCategory !== 'All' ? ` · ${selectedCategory}` : ''}
            </p>
            <div className="blog-grid">
              {filtered.map(post => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
