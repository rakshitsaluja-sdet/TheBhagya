import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { marked } from 'marked'
import { getBlogPost, getBlogPosts } from '../hooks/useApi'

// ── marked configuration (compatible with marked v4 – v14) ────────────────────
try {
  // v6+ API
  marked.use({ breaks: true, gfm: true })
} catch {
  // v4/v5 fallback
  if (typeof marked.setOptions === 'function') {
    marked.setOptions({ breaks: true, gfm: true })
  }
}

// ── Design tokens ──────────────────────────────────────────────────────────────
const GOLD   = '#DFA84F'
const GOLD_L = '#F2CB84'
const BG_CARD = 'rgba(19,15,36,0.72)'

// ── Category config ────────────────────────────────────────────────────────────
const CAT_COLORS = {
  Saturn:            '#8B6FE8',
  Planets:           '#DFA84F',
  Doshas:            '#E53935',
  Advanced:          '#26C6DA',
  Beginners:         '#43A047',
  'Ancient Systems': '#F9A825',
  Timing:            '#5C6BC0',
}

const CAT_ROUTES = {
  Saturn:            '/sade-sati',
  Planets:           '/chart/new',
  Doshas:            '/doshas',
  Advanced:          '/kp-system',
  Beginners:         '/chart/new',
  'Ancient Systems': '/nadi-astrology',
  Timing:            '/muhurat',
}

const CAT_CTA = {
  Saturn:            'Check your Sade Sati period',
  Planets:           'Cast your Vedic birth chart',
  Doshas:            'Check your Dosha status',
  Advanced:          'Try the KP System analyser',
  Beginners:         'Cast your first Kundali',
  'Ancient Systems': 'Explore Nadi Astrology',
  Timing:            'Find your auspicious Muhurat',
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

function parseMarkdown(text) {
  if (!text) return ''
  try {
    // marked.parse is synchronous in all versions
    return marked.parse ? marked.parse(text) : marked(text)
  } catch {
    return `<p>${text}</p>`
  }
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

function RelatedCard({ post }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      to={`/blog/${post.slug}`}
      style={{ textDecoration: 'none', display: 'block' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        background: BG_CARD,
        border: `1px solid ${hovered ? 'rgba(223,168,79,0.48)' : 'var(--border)'}`,
        borderRadius: 12,
        padding: '1.25rem',
        backdropFilter: 'blur(18px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(18px) saturate(1.4)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'border-color 0.2s ease, transform 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        height: '100%',
        boxSizing: 'border-box',
      }}>
        <CategoryBadge category={post.category} />
        <h4 style={{
          fontFamily: "'Fraunces', serif",
          color: 'var(--text-primary)',
          fontSize: '1rem',
          fontWeight: 600,
          lineHeight: 1.35,
          margin: 0,
        }}>
          {post.title}
        </h4>
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '0.82rem',
          lineHeight: 1.55,
          margin: 0,
          display: '-webkit-box',
          WebkitLineClamp: 2,
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
          paddingTop: '0.6rem',
          borderTop: '1px solid var(--border)',
          marginTop: 'auto',
        }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.68rem',
            color: 'var(--text-dim)',
          }}>
            {post.read_time}
          </span>
          <span style={{ color: GOLD, fontSize: '0.8rem' }}>Read →</span>
        </div>
      </div>
    </Link>
  )
}

// ── Shared style injected once ─────────────────────────────────────────────────
const ARTICLE_STYLES = `
  .md-body h1 {
    font-family: 'Fraunces', serif;
    font-size: 2rem;
    font-weight: 700;
    background: linear-gradient(135deg, #DFA84F, #F2CB84);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0 0 1rem;
    line-height: 1.2;
  }
  .md-body h2 {
    font-family: 'Fraunces', serif;
    font-size: 1.4rem;
    font-weight: 600;
    color: #DFA84F;
    margin: 2rem 0 0.75rem;
    line-height: 1.3;
  }
  .md-body h3 {
    font-family: 'Fraunces', serif;
    font-size: 1.15rem;
    font-weight: 600;
    color: #F2CB84;
    margin: 1.5rem 0 0.5rem;
    line-height: 1.3;
  }
  .md-body h4 {
    font-family: 'Inter', sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 1.25rem 0 0.4rem;
  }
  .md-body p {
    font-family: 'Inter', sans-serif;
    color: var(--text-muted);
    font-size: 1rem;
    line-height: 1.75;
    margin-bottom: 1rem;
  }
  .md-body a {
    color: #DFA84F;
    text-decoration: none;
  }
  .md-body a:hover {
    text-decoration: underline;
  }
  .md-body strong {
    color: var(--text-primary);
    font-weight: 600;
  }
  .md-body em {
    color: var(--text-muted);
    font-style: italic;
  }
  .md-body blockquote {
    border-left: 3px solid #DFA84F;
    padding: 0.25rem 0 0.25rem 1rem;
    margin: 1.5rem 0;
    color: var(--text-dim);
    font-style: italic;
  }
  .md-body blockquote p {
    color: var(--text-dim);
    margin-bottom: 0;
  }
  .md-body code {
    font-family: 'JetBrains Mono', monospace;
    background: rgba(255,255,255,0.05);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.88em;
    color: #F2CB84;
  }
  .md-body pre {
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1rem 1.25rem;
    overflow-x: auto;
    margin: 1.5rem 0;
  }
  .md-body pre code {
    background: none;
    padding: 0;
    font-size: 0.85rem;
    color: #ADA28B;
  }
  .md-body ul, .md-body ol {
    color: var(--text-muted);
    padding-left: 1.5rem;
    margin-bottom: 1rem;
    font-family: 'Inter', sans-serif;
    font-size: 1rem;
    line-height: 1.75;
  }
  .md-body li {
    margin-bottom: 0.35rem;
  }
  .md-body hr {
    border: none;
    border-top: 1px solid var(--border);
    margin: 2.5rem 0;
  }
  .md-body table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.5rem 0;
    font-family: 'Inter', sans-serif;
    font-size: 0.9rem;
  }
  .md-body th {
    color: #DFA84F;
    border-bottom: 1px solid rgba(223,168,79,0.3);
    padding: 0.5rem 0.75rem;
    text-align: left;
    font-weight: 600;
  }
  .md-body td {
    color: var(--text-muted);
    border-bottom: 1px solid var(--border);
    padding: 0.5rem 0.75rem;
  }
  .related-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.25rem;
  }
  @media (max-width: 900px) {
    .related-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 580px) {
    .related-grid { grid-template-columns: 1fr; }
    .post-header { padding-top: 2rem !important; }
  }
`

// ── Main page ──────────────────────────────────────────────────────────────────
export default function BlogPost() {
  const { slug } = useParams()
  const [post, setPost]       = useState(null)
  const [htmlContent, setHtmlContent] = useState('')
  const [allPosts, setAllPosts] = useState([])
  const [loading, setLoading]  = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        // 1. Fetch post (content + metadata) and all posts (for related section) in parallel
        const [data, all] = await Promise.all([
          getBlogPost(slug),
          getBlogPosts(),
        ])

        if (!cancelled) {
          setPost(data)
          setAllPosts(all)
          setHtmlContent(parseMarkdown(data.content || ''))

          // SEO
          document.title = `${data.title} · Bhagya`
          const metaDesc = document.querySelector('meta[name="description"]')
          if (metaDesc) metaDesc.setAttribute('content', data.excerpt)
        }
      } catch (err) {
        console.error('BlogPost load error:', err)
        if (!cancelled) setNotFound(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
      document.title = 'Bhagya'
    }
  }, [slug])

  // ── Related posts ────────────────────────────────────────────────────────────
  const sameCat = post
    ? allPosts.filter(p => p.slug !== slug && p.category === post.category)
    : []
  const others = post
    ? allPosts.filter(p => p.slug !== slug && p.category !== post.category)
    : []
  const related = [...sameCat, ...others].slice(0, 3)

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <p style={{
          color: 'var(--text-dim)',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.82rem',
          letterSpacing: '1px',
        }}>
          Loading...
        </p>
      </div>
    )
  }

  // ── 404 state ────────────────────────────────────────────────────────────────
  if (notFound || !post) {
    return (
      <div style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        padding: '2rem',
        textAlign: 'center',
      }}>
        <h2 style={{
          fontFamily: "'Fraunces', serif",
          color: 'var(--text-primary)',
          fontSize: '2rem',
          fontWeight: 600,
          margin: 0,
        }}>
          Article not found
        </h2>
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '0.95rem',
          fontFamily: "'Inter', sans-serif",
          margin: 0,
        }}>
          This article may have been moved or removed.
        </p>
        <Link to="/blog" style={{
          color: GOLD,
          textDecoration: 'none',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '0.82rem',
          letterSpacing: '0.5px',
          marginTop: '0.5rem',
        }}>
          ← Back to Jyotish Journal
        </Link>
      </div>
    )
  }

  const ctaRoute = CAT_ROUTES[post.category] || '/chart/new'
  const ctaLabel = CAT_CTA[post.category]    || 'Explore your chart'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingBottom: '6rem' }}>
      <style>{ARTICLE_STYLES}</style>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 1.5rem' }}>

        {/* ── Article header ── */}
        <div className="post-header" style={{ paddingTop: '3.5rem', paddingBottom: '2rem' }}>

          {/* Breadcrumb */}
          <div style={{ marginBottom: '1.75rem' }}>
            <Link to="/blog" style={{
              color: GOLD,
              textDecoration: 'none',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.78rem',
              letterSpacing: '0.5px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              opacity: 0.85,
            }}>
              ← Blog
            </Link>
          </div>

          {/* Category badge */}
          <div style={{ marginBottom: '1rem' }}>
            <CategoryBadge category={post.category} />
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 'clamp(1.7rem, 4.5vw, 2.2rem)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.22,
            margin: '0 0 1.1rem',
            letterSpacing: '-0.3px',
          }}>
            {post.title}
          </h1>

          {/* Meta row */}
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
            flexWrap: 'wrap',
            marginBottom: '1.25rem',
          }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.72rem',
              color: 'var(--text-dim)',
            }}>
              {formatDate(post.created_at)}
            </span>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem', lineHeight: 1 }}>·</span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.72rem',
              color: 'var(--text-dim)',
            }}>
              {post.read_time}
            </span>
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
              {post.tags.map(tag => (
                <span key={tag} style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.62rem',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  color: 'var(--text-dim)',
                  border: `1px solid ${GOLD}44`,
                  borderRadius: 999,
                  padding: '0.18rem 0.6rem',
                }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 0 2.5rem' }} />

        {/* ── Markdown body ── */}
        <div
          className="md-body"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />

        {/* ── CTA section ── */}
        <div style={{
          margin: '3.5rem 0',
          background: 'linear-gradient(135deg, rgba(223,168,79,0.07) 0%, rgba(139,111,232,0.05) 100%)',
          border: `1px solid ${GOLD}40`,
          borderRadius: 16,
          padding: '2.25rem 2rem',
          textAlign: 'center',
        }}>
          <p style={{
            fontFamily: "'Fraunces', serif",
            fontSize: '1.25rem',
            color: 'var(--text-primary)',
            fontWeight: 600,
            margin: '0 0 0.5rem',
            lineHeight: 1.3,
          }}>
            Ready to explore your own chart?
          </p>
          <p style={{
            color: 'var(--text-muted)',
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.92rem',
            margin: '0 0 1.75rem',
            lineHeight: 1.6,
          }}>
            {ctaLabel}
          </p>
          <Link to={ctaRoute} style={{
            display: 'inline-block',
            background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_L} 100%)`,
            color: '#07060F',
            textDecoration: 'none',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            padding: '0.8rem 2.25rem',
            borderRadius: 999,
          }}>
            {ctaLabel} →
          </Link>
        </div>

        {/* ── Related posts ── */}
        {related.length > 0 && (
          <div style={{ marginTop: '3rem' }}>
            <h3 style={{
              fontFamily: "'Fraunces', serif",
              fontSize: '1.35rem',
              color: 'var(--text-primary)',
              fontWeight: 600,
              margin: '0 0 0.3rem',
            }}>
              More from Bhagya Journal
            </h3>
            <p style={{
              color: 'var(--text-dim)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '0.7rem',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              margin: '0 0 1.5rem',
            }}>
              Continue reading
            </p>
            <div className="related-grid">
              {related.map(p => (
                <RelatedCard key={p.slug} post={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
