import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminLogin } from '../hooks/useApi'
import { useTheme } from '../context/ThemeContext'

export default function AdminLogin() {
  const navigate  = useNavigate()
  const { theme, toggle: toggleTheme } = useTheme()
  const [email,   setEmail]   = useState('')
  const [pwd,     setPwd]     = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !pwd) { setError('Both fields are required.'); return }
    setLoading(true); setError('')
    try {
      const data = await adminLogin(email, pwd)
      localStorage.setItem('bhagya_admin_token', data.token)
      navigate('/admin/dashboard')
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const s = {
    page: {
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-deep)', padding: '2rem',
    },
    card: {
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)',
      borderRadius: '20px', padding: '2.5rem', width: '100%', maxWidth: '400px',
      boxShadow: 'var(--shadow-card), var(--shadow-glow)',
    },
    badge: {
      display: 'inline-block', background: 'var(--gold-pale)',
      border: '1px solid var(--border-hover)', borderRadius: '999px',
      padding: '0.3rem 0.95rem', fontSize: '0.64rem', color: 'var(--gold)',
      fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase',
      letterSpacing: '2.5px', fontWeight: 500, marginBottom: '1.25rem',
    },
    heading: {
      fontFamily: "'Fraunces', serif", fontSize: '1.6rem', color: 'var(--text-primary)',
      fontWeight: 600, letterSpacing: '-0.02em',
      marginBottom: '0.3rem',
    },
    sub: { color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '2rem' },
    label: { display: 'block', fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 500,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.4rem' },
    input: {
      width: '100%', padding: '0.8rem 1rem', border: '1px solid var(--border)',
      borderRadius: '10px', background: 'var(--bg-input)', color: 'var(--text-primary)',
      fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
      transition: 'border-color 0.2s',
    },
    pwdWrap: { position: 'relative' },
    pwdInput: {
      width: '100%', padding: '0.8rem 2.8rem 0.8rem 1rem', border: '1px solid var(--border)',
      borderRadius: '10px', background: 'var(--bg-input)', color: 'var(--text-primary)',
      fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
      transition: 'border-color 0.2s',
    },
    eyeBtn: {
      position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0,
    },
    field: { marginBottom: '1.25rem' },
    btn: {
      width: '100%', padding: '0.85rem', border: 'none', borderRadius: '999px',
      background: 'linear-gradient(135deg, #F2CB84 0%, #DFA84F 42%, #A8752B 100%)',
      color: '#1C1205', fontFamily: 'inherit', fontSize: '0.92rem', fontWeight: 600,
      boxShadow: '0 8px 28px rgba(223,168,79,0.28)',
      cursor: 'pointer', marginTop: '0.5rem', letterSpacing: '0.5px', transition: 'opacity 0.2s',
    },
    error: {
      background: 'rgba(200,50,50,0.1)', border: '1px solid rgba(200,50,50,0.3)',
      borderRadius: '10px', padding: '0.65rem 0.9rem', color: '#E07B39',
      fontSize: '0.83rem', marginBottom: '1rem',
    },
    hint: {
      marginTop: '1.5rem', padding: '0.75rem 1rem',
      background: 'var(--gold-pale)', borderRadius: '10px', border: '1px solid var(--border)',
      fontSize: '0.77rem', color: 'var(--text-muted)', lineHeight: 1.6,
    },
  }

  return (
    <div style={s.page}>
      {/* Theme toggle — top right corner */}
      <button onClick={toggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        style={{
          position: 'fixed', top: '1rem', right: '1rem',
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '50%', width: '36px', height: '36px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', fontSize: '1rem', color: 'var(--gold)',
          boxShadow: 'var(--shadow-card)', zIndex: 10,
        }}>
        {theme === 'dark' ? '☀' : '🌙'}
      </button>

      <div className="bh-fade-up" style={s.card}>
        <div style={s.badge}>⚙ SUPER ADMIN</div>
        <div style={s.heading}>Bhagya Admin</div>
        <p style={s.sub}>Restricted access — authorised personnel only</p>

        {error && <div style={s.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={s.field}>
            <label style={s.label}>Admin Email</label>
            <input style={s.input} type="email" value={email} autoFocus
              placeholder="admin@thebhagya.com"
              onChange={e => setEmail(e.target.value)}
              onFocus={e => e.target.style.borderColor='rgba(223,168,79,0.6)'}
              onBlur={e  => e.target.style.borderColor='rgba(223,168,79,0.22)'}
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Password</label>
            <div style={s.pwdWrap}>
              <input style={s.pwdInput} type={showPwd ? 'text' : 'password'}
                value={pwd} placeholder="••••••••••••"
                onChange={e => setPwd(e.target.value)}
                onFocus={e => e.target.style.borderColor='rgba(223,168,79,0.6)'}
                onBlur={e  => e.target.style.borderColor='rgba(223,168,79,0.22)'}
              />
              <button type="button" style={s.eyeBtn} onClick={() => setShowPwd(v => !v)}>
                {showPwd
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          <button style={{ ...s.btn, opacity: loading ? 0.6 : 1 }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Enter Admin Panel →'}
          </button>
        </form>

        {import.meta.env.DEV && (
          <div style={s.hint}>
            <strong style={{ color: 'var(--text-muted)' }}>Default credentials</strong><br />
            Email: <code style={{ color: 'var(--gold)' }}>admin@thebhagya.com</code><br />
            Password set in <code style={{ color: 'var(--gold)' }}>.env → ADMIN_PASSWORD</code>
          </div>
        )}
      </div>
    </div>
  )
}
