import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { marked } from 'marked'
import {
  adminGetAllPosts,
  adminCreatePost,
  adminUpdatePost,
  adminDeletePost,
  adminTogglePublish,
} from '../hooks/useApi'

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = ['Saturn', 'Planets', 'Doshas', 'Advanced', 'Beginners', 'Ancient Systems', 'Timing']

const BLANK_FORM = {
  slug: '', title: '', category: '', excerpt: '', content: '',
  read_time: '', tags: '', published: false,
}

// ── Style tokens ──────────────────────────────────────────────────────────────

const INPUT = {
  background: 'var(--bg-input, rgba(255,255,255,0.05))',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text-primary)',
  padding: '0.65rem 0.9rem',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: "'Inter', sans-serif",
  fontSize: '0.88rem',
  outline: 'none',
  transition: 'border-color 0.2s',
  appearance: 'none',
}

const LABEL = {
  display: 'block',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '0.65rem',
  textTransform: 'uppercase',
  letterSpacing: '2px',
  color: 'var(--text-dim, #6B6480)',
  marginBottom: '0.35rem',
  fontWeight: 500,
}

const FIELD = { marginBottom: '1.15rem' }

// ── Slug helper ───────────────────────────────────────────────────────────────

function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// ── Date formatter ────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminBlog() {
  const navigate = useNavigate()

  const [posts,       setPosts]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [selected,    setSelected]    = useState(null)   // null = new post mode
  const [form,        setForm]        = useState(BLANK_FORM)
  const [previewMode, setPreviewMode] = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState('')
  const [slugTouched, setSlugTouched] = useState(false)  // true once user manually edits slug

  // ── Flash message helper ────────────────────────────────────────────────────

  const flash = useCallback((type, msg) => {
    if (type === 'success') { setSuccess(msg); setError('') }
    else { setError(msg); setSuccess('') }
    setTimeout(() => { setSuccess(''); setError('') }, 3000)
  }, [])

  // ── Load posts ──────────────────────────────────────────────────────────────

  const loadPosts = useCallback(async () => {
    try {
      const data = await adminGetAllPosts()
      setPosts(data)
    } catch (e) {
      const msg = e.message || ''
      if (msg.includes('401') || msg.toLowerCase().includes('expired') || msg.includes('403')) {
        localStorage.removeItem('bhagya_admin_token')
        navigate('/admin')
      } else {
        flash('error', msg || 'Failed to load posts.')
      }
    } finally {
      setLoading(false)
    }
  }, [navigate, flash])

  // ── Auth check + initial load ───────────────────────────────────────────────

  useEffect(() => {
    if (!localStorage.getItem('bhagya_admin_token')) {
      navigate('/admin')
      return
    }
    loadPosts()
  }, [loadPosts, navigate])

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleTitleChange = (val) => {
    setForm(f => ({
      ...f,
      title: val,
      // Auto-derive slug only while creating (not editing) and user hasn't touched slug manually
      ...(!selected && !slugTouched ? { slug: slugify(val) } : {}),
    }))
  }

  const selectPost = (post) => {
    setSelected(post)
    setSlugTouched(true)  // treat existing slug as "touched"
    setPreviewMode(false)
    setError('')
    setSuccess('')
    setForm({
      slug:      post.slug      ?? '',
      title:     post.title     ?? '',
      category:  post.category  ?? '',
      excerpt:   post.excerpt   ?? '',
      content:   post.content   ?? '',
      read_time: post.read_time ?? '',
      tags:      Array.isArray(post.tags) ? post.tags.join(', ') : (post.tags ?? ''),
      published: !!post.published,
    })
  }

  const clearForm = () => {
    setSelected(null)
    setSlugTouched(false)
    setPreviewMode(false)
    setForm(BLANK_FORM)
    setError('')
    setSuccess('')
  }

  const handleSave = async () => {
    if (!form.title.trim()) { flash('error', 'Title is required.'); return }
    if (!form.slug.trim())  { flash('error', 'Slug is required.'); return }

    setSaving(true)
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      }
      let updated
      if (selected) {
        updated = await adminUpdatePost(selected.slug, payload)
        flash('success', 'Post updated successfully.')
      } else {
        updated = await adminCreatePost(payload)
        flash('success', 'Post created successfully.')
        setSlugTouched(true)
      }
      await loadPosts()
      setSelected(updated)
    } catch (e) {
      flash('error', e.message || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selected) return
    if (!window.confirm(`Delete "${selected.title}"? This cannot be undone.`)) return
    try {
      await adminDeletePost(selected.slug)
      flash('success', 'Post deleted.')
      await loadPosts()
      clearForm()
    } catch (e) {
      flash('error', e.message || 'Delete failed.')
    }
  }

  const handleTogglePublish = async () => {
    if (!selected) return
    const newState = !selected.published
    try {
      const updated = await adminTogglePublish(selected.slug, newState)
      flash('success', updated.published ? 'Post is now live.' : 'Post unpublished.')
      await loadPosts()
      setSelected(updated)
      setForm(f => ({ ...f, published: updated.published }))
    } catch (e) {
      flash('error', e.message || 'Toggle failed.')
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-deep, #07060F)',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* ── Top bar ── */}
      <div style={{
        background: '#0E0C1B',
        borderBottom: '1px solid var(--border)',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        flexShrink: 0,
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => navigate('/admin/dashboard')}
            style={{
              background: 'none', border: 'none', color: 'var(--text-muted)',
              cursor: 'pointer', fontSize: '0.8rem',
              display: 'flex', alignItems: 'center', gap: '0.4rem', padding: 0,
            }}
          >
            ← Dashboard
          </button>
          <span style={{ color: 'var(--border)', userSelect: 'none' }}>|</span>
          <span style={{
            fontFamily: "'Fraunces', serif",
            fontSize: '1.05rem',
            color: 'var(--gold, #DFA84F)',
            fontWeight: 600,
            letterSpacing: '-0.01em',
          }}>
            Blog Posts
          </span>
        </div>

        <button
          onClick={clearForm}
          style={{
            background: 'linear-gradient(135deg, #F2CB84 0%, #DFA84F 42%, #A8752B 100%)',
            color: '#1C1205',
            border: 'none',
            borderRadius: '8px',
            padding: '0.42rem 1rem',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '0.8rem',
            letterSpacing: '0.3px',
            boxShadow: '0 4px 16px rgba(223,168,79,0.22)',
            fontFamily: "'Inter', sans-serif",
            whiteSpace: 'nowrap',
          }}
        >
          + New Post
        </button>
      </div>

      {/* ── Body: sidebar + editor ── */}
      <div
        className="admin-blog-body"
        style={{ display: 'flex', flex: 1, overflow: 'hidden' }}
      >

        {/* ── Left: Post list ── */}
        <div
          className="admin-blog-sidebar"
          style={{
            width: '280px',
            minWidth: '280px',
            background: 'rgba(0,0,0,0.25)',
            borderRight: '1px solid var(--border)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {loading && (
            <div style={{ padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
              Loading posts...
            </div>
          )}

          {!loading && posts.length === 0 && (
            <div style={{ padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', lineHeight: 1.6 }}>
              No posts yet.<br />Click "+ New Post" to create one.
            </div>
          )}

          {!loading && posts.map(post => {
            const isActive = selected && (selected.id === post.id || selected.slug === post.slug)
            return (
              <div
                key={post.id ?? post.slug}
                onClick={() => selectPost(post)}
                style={{
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid var(--border)',
                  borderLeft: isActive ? '3px solid var(--gold, #DFA84F)' : '3px solid transparent',
                  background: isActive ? 'rgba(223,168,79,0.07)' : 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.15s, border-left-color 0.15s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(223,168,79,0.05)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                {/* Badge */}
                <div style={{ marginBottom: '0.3rem' }}>
                  {post.published ? (
                    <span style={{
                      background: 'rgba(76,175,80,0.15)',
                      color: '#4CAF50',
                      border: '1px solid rgba(76,175,80,0.3)',
                      borderRadius: 999,
                      padding: '2px 8px',
                      fontSize: '0.6rem',
                      textTransform: 'uppercase',
                      fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: '1px',
                      fontWeight: 600,
                    }}>LIVE</span>
                  ) : (
                    <span style={{
                      background: 'rgba(255,255,255,0.05)',
                      color: 'var(--text-dim, #6B6480)',
                      border: '1px solid var(--border)',
                      borderRadius: 999,
                      padding: '2px 8px',
                      fontSize: '0.6rem',
                      textTransform: 'uppercase',
                      fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: '1px',
                    }}>DRAFT</span>
                  )}
                </div>

                {/* Title */}
                <div style={{
                  fontSize: '0.83rem',
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginBottom: '0.22rem',
                }}>
                  {post.title || '(Untitled)'}
                </div>

                {/* Category + date */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {post.category || '—'}
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.62rem', flexShrink: 0, marginLeft: '0.4rem' }}>
                    {fmtDate(post.created_at)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Right: Editor panel ── */}
        <div
          className="admin-blog-editor"
          style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}
        >
          <div style={{ maxWidth: '820px' }}>

            {/* Heading */}
            <h2 style={{
              fontFamily: "'Fraunces', serif",
              color: 'var(--text-primary)',
              fontWeight: 600,
              fontSize: '1.4rem',
              letterSpacing: '-0.02em',
              margin: '0 0 1.5rem',
            }}>
              {selected ? 'Edit Post' : 'New Post'}
            </h2>

            {/* Flash */}
            {(error || success) && (
              <div style={{
                marginBottom: '1.1rem',
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                fontSize: '0.84rem',
                background: error ? 'rgba(229,62,62,0.12)' : 'rgba(223,168,79,0.1)',
                border: `1px solid ${error ? 'rgba(229,62,62,0.3)' : 'rgba(223,168,79,0.28)'}`,
                color: error ? '#E07575' : 'var(--gold, #DFA84F)',
              }}>
                {error || success}
              </div>
            )}

            {/* ── Title ── */}
            <div style={FIELD}>
              <label style={LABEL}>Title</label>
              <input
                type="text"
                value={form.title}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder="Enter post title..."
                style={{ ...INPUT, fontFamily: "'Fraunces', serif", fontSize: '1rem' }}
                onFocus={e => (e.target.style.borderColor = 'var(--gold, #DFA84F)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            {/* ── Slug ── */}
            <div style={FIELD}>
              <label style={LABEL}>Slug</label>
              <input
                type="text"
                value={form.slug}
                onChange={e => {
                  setSlugTouched(true)
                  setForm(f => ({ ...f, slug: e.target.value }))
                }}
                placeholder="post-url-slug"
                style={{ ...INPUT, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.82rem' }}
                onFocus={e => (e.target.style.borderColor = 'var(--gold, #DFA84F)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
              {form.slug && (
                <div style={{
                  marginTop: '0.35rem',
                  fontSize: '0.7rem',
                  fontFamily: "'JetBrains Mono', monospace",
                  color: 'var(--text-muted)',
                }}>
                  blog/{form.slug}
                </div>
              )}
            </div>

            {/* ── Category ── */}
            <div style={FIELD}>
              <label style={LABEL}>Category</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                style={{ ...INPUT, cursor: 'pointer' }}
                onFocus={e => (e.target.style.borderColor = 'var(--gold, #DFA84F)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              >
                <option value="">Select category</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* ── Excerpt ── */}
            <div style={FIELD}>
              <label style={LABEL}>Excerpt</label>
              <textarea
                rows={3}
                value={form.excerpt}
                onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
                placeholder="Brief summary shown on listing cards..."
                style={{ ...INPUT, resize: 'vertical', lineHeight: 1.6 }}
                onFocus={e => (e.target.style.borderColor = 'var(--gold, #DFA84F)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            {/* ── Read time + Tags ── */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.15rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '0 0 180px', minWidth: '140px' }}>
                <label style={LABEL}>Read Time</label>
                <input
                  type="text"
                  value={form.read_time}
                  onChange={e => setForm(f => ({ ...f, read_time: e.target.value }))}
                  placeholder="7 min read"
                  style={INPUT}
                  onFocus={e => (e.target.style.borderColor = 'var(--gold, #DFA84F)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
              <div style={{ flex: 1, minWidth: '180px' }}>
                <label style={LABEL}>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  placeholder="Saturn, Sade Sati, Remedies"
                  style={INPUT}
                  onFocus={e => (e.target.style.borderColor = 'var(--gold, #DFA84F)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
            </div>

            {/* ── Content ── */}
            <div style={FIELD}>
              {/* Label row with preview toggle */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.5rem',
              }}>
                <label style={{ ...LABEL, marginBottom: 0 }}>Content (Markdown)</label>
                <button
                  onClick={() => setPreviewMode(m => !m)}
                  style={{
                    background: previewMode ? 'rgba(139,111,232,0.15)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${previewMode ? 'rgba(139,111,232,0.45)' : 'var(--border)'}`,
                    color: previewMode ? '#8B6FE8' : 'var(--text-muted)',
                    borderRadius: '999px',
                    padding: '0.28rem 0.85rem',
                    cursor: 'pointer',
                    fontSize: '0.72rem',
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: '1px',
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                >
                  {previewMode ? '✎ Edit' : '◉ Preview'}
                </button>
              </div>

              {previewMode ? (
                <div
                  dangerouslySetInnerHTML={{ __html: marked.parse(form.content || '*Nothing to preview yet.*') }}
                  style={{
                    background: 'var(--bg-input, rgba(255,255,255,0.03))',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '1.25rem 1.4rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    lineHeight: 1.78,
                    minHeight: '320px',
                  }}
                />
              ) : (
                <textarea
                  rows={20}
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Write your post content in Markdown..."
                  style={{
                    ...INPUT,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.82rem',
                    lineHeight: 1.65,
                    resize: 'vertical',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--gold, #DFA84F)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
              )}
            </div>

            {/* ── Published toggle ── */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1.5rem',
            }}>
              <div
                role="switch"
                aria-checked={form.published}
                onClick={() => setForm(f => ({ ...f, published: !f.published }))}
                style={{
                  width: '40px',
                  height: '22px',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  background: form.published ? 'var(--gold, #DFA84F)' : 'rgba(255,255,255,0.1)',
                  border: `1px solid ${form.published ? 'var(--gold, #DFA84F)' : 'var(--border)'}`,
                  position: 'relative',
                  transition: 'background 0.2s, border-color 0.2s',
                  flexShrink: 0,
                  userSelect: 'none',
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: '2px',
                  left: form.published ? '20px' : '2px',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: form.published ? '#1C1205' : 'rgba(255,255,255,0.45)',
                  transition: 'left 0.2s',
                }} />
              </div>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Published{' '}
                <span style={{ color: 'var(--text-dim, #6B6480)' }}>(visible to readers)</span>
              </span>
            </div>

            {/* ── Action buttons ── */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.7rem',
              flexWrap: 'wrap',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border)',
            }}>
              {/* Save */}
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  background: saving
                    ? 'rgba(223,168,79,0.4)'
                    : 'linear-gradient(135deg, #F2CB84 0%, #DFA84F 42%, #A8752B 100%)',
                  color: '#1C1205',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '0.58rem 1.5rem',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  letterSpacing: '0.4px',
                  boxShadow: saving ? 'none' : '0 6px 20px rgba(223,168,79,0.25)',
                  fontFamily: "'Inter', sans-serif",
                  transition: 'opacity 0.2s',
                }}
              >
                {saving ? 'Saving...' : selected ? 'Save Changes' : 'Create Post'}
              </button>

              {/* Cancel */}
              <button
                onClick={clearForm}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  borderRadius: '999px',
                  padding: '0.58rem 1.25rem',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Cancel
              </button>

              {/* Quick publish/unpublish — only for existing posts */}
              {selected && (
                <button
                  onClick={handleTogglePublish}
                  style={{
                    background: selected.published
                      ? 'rgba(229,62,62,0.1)'
                      : 'rgba(76,175,80,0.1)',
                    border: `1px solid ${selected.published
                      ? 'rgba(229,62,62,0.35)'
                      : 'rgba(76,175,80,0.35)'}`,
                    color: selected.published ? '#E07575' : '#4CAF50',
                    borderRadius: '999px',
                    padding: '0.58rem 1.25rem',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontFamily: "'Inter', sans-serif",
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                >
                  {selected.published ? 'Unpublish' : 'Publish Now'}
                </button>
              )}

              {/* Delete — only for existing posts, pushed to right */}
              {selected && (
                <button
                  onClick={handleDelete}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(229,62,62,0.45)',
                    color: '#E07575',
                    borderRadius: '999px',
                    padding: '0.58rem 1.25rem',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontFamily: "'Inter', sans-serif",
                    marginLeft: 'auto',
                  }}
                >
                  Delete Post
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ── Responsive + preview prose styles ── */}
      <style>{`
        @media (max-width: 768px) {
          .admin-blog-body {
            flex-direction: column !important;
            overflow: visible !important;
          }
          .admin-blog-sidebar {
            width: 100% !important;
            min-width: unset !important;
            max-height: 300px !important;
            border-right: none !important;
            border-bottom: 1px solid var(--border) !important;
          }
          .admin-blog-editor {
            padding: 1.25rem !important;
          }
        }

        /* Preview prose styles */
        .admin-blog-editor h1,
        .admin-blog-editor h2,
        .admin-blog-editor h3,
        .admin-blog-editor h4 {
          font-family: 'Fraunces', serif;
          color: var(--text-primary);
          margin: 1.2em 0 0.4em;
        }
        .admin-blog-editor p {
          color: var(--text-muted);
          line-height: 1.78;
          margin: 0.6em 0;
        }
        .admin-blog-editor code {
          background: rgba(255,255,255,0.07);
          padding: 0.12em 0.4em;
          border-radius: 4px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.82em;
          color: var(--gold, #DFA84F);
        }
        .admin-blog-editor pre {
          background: rgba(0,0,0,0.35);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 1rem;
          overflow-x: auto;
        }
        .admin-blog-editor pre code {
          background: none;
          padding: 0;
          color: var(--text-primary);
        }
        .admin-blog-editor blockquote {
          border-left: 3px solid var(--gold, #DFA84F);
          margin: 1em 0;
          padding: 0.5em 1em;
          color: var(--text-muted);
          font-style: italic;
        }
        .admin-blog-editor ul, .admin-blog-editor ol {
          color: var(--text-muted);
          padding-left: 1.5em;
        }
        .admin-blog-editor a {
          color: var(--gold, #DFA84F);
        }
        .admin-blog-editor hr {
          border: none;
          border-top: 1px solid var(--border);
          margin: 1.5em 0;
        }
      `}</style>
    </div>
  )
}
