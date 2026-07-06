import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authLogin, authRegister, authGoogleLogin } from '../hooks/useApi'

// Google client ID from env — if not set, Google button is hidden
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

// Eye icons
const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)
const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

// Google G icon
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const s = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '1.5rem', background: 'var(--bg-deep)',
  },
  card: {
    background: 'var(--bg-card)', border: '1px solid rgba(201,147,58,0.2)',
    borderRadius: '20px', padding: '2.5rem 2rem', width: '100%', maxWidth: '420px',
    boxShadow: '0 12px 48px rgba(0,0,0,0.3)',
  },
  logo: { textAlign: 'center', marginBottom: '2rem' },
  logoText: { fontFamily: "'Cinzel', serif", fontSize: '1.8rem', color: '#C9933A', letterSpacing: '4px', display: 'block' },
  logoSub: { fontSize: '0.68rem', color: '#5A4520', letterSpacing: '4px', display: 'block', marginTop: '0.25rem' },
  tabs: { display: 'flex', marginBottom: '1.75rem', borderBottom: '1px solid var(--border)' },
  tab: (active) => ({
    flex: 1, padding: '0.7rem 0.5rem', border: 'none', background: 'none', cursor: 'pointer',
    fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: active ? 600 : 400,
    color: active ? '#C9933A' : 'var(--text-muted)',
    borderBottom: active ? '2px solid #C9933A' : '2px solid transparent',
    marginBottom: '-1px', transition: 'all 0.2s',
  }),
  label: {
    display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)',
    letterSpacing: '0.5px', marginBottom: '0.4rem',
  },
  input: {
    width: '100%', padding: '0.75rem 1rem', border: '1px solid var(--border)',
    borderRadius: '10px', background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
    color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.95rem',
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
  },
  pwdWrapper: { position: 'relative' },
  pwdInput: {
    width: '100%', padding: '0.75rem 3rem 0.75rem 1rem', border: '1px solid var(--border)',
    borderRadius: '10px', background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
    color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.95rem',
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
  },
  eyeBtn: {
    position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
    color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
  },
  field: { marginBottom: '1.1rem' },
  btn: {
    width: '100%', padding: '0.875rem', border: 'none', borderRadius: '10px', cursor: 'pointer',
    background: 'linear-gradient(135deg, #C9933A 0%, #8B6020 100%)',
    color: '#FFF8EC', fontFamily: 'inherit', fontSize: '0.95rem', fontWeight: 600,
    marginTop: '0.25rem', transition: 'opacity 0.2s, transform 0.1s',
    letterSpacing: '0.3px',
  },
  googleBtn: {
    width: '100%', padding: '0.8rem', border: '1px solid var(--border)', borderRadius: '10px',
    cursor: 'pointer', background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
    color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 500,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
    transition: 'border-color 0.2s, background 0.2s',
    letterSpacing: '0.2px',
  },
  orDivider: {
    display: 'flex', alignItems: 'center', gap: '1rem',
    margin: '1.25rem 0', color: 'var(--text-dim)', fontSize: '0.82rem',
  },
  orLine: { flex: 1, height: '1px', background: 'var(--border)' },
  error: {
    background: 'rgba(200,50,50,0.1)', border: '1px solid rgba(200,50,50,0.3)',
    borderRadius: '8px', padding: '0.65rem 0.9rem', color: '#E07B39',
    fontSize: '0.84rem', marginBottom: '1rem',
  },
  success: {
    background: 'rgba(50,180,80,0.1)', border: '1px solid rgba(50,180,80,0.3)',
    borderRadius: '8px', padding: '0.65rem 0.9rem', color: '#4CAF50',
    fontSize: '0.84rem', marginBottom: '1rem',
  },
}

export default function Login() {
  const { login }   = useAuth()
  const navigate    = useNavigate()
  const location    = useLocation()
  const from        = location.state?.from || '/'

  const [tab,       setTab]       = useState('login')
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [showPwd,   setShowPwd]   = useState(false)
  const [error,     setError]     = useState('')
  const [msg,       setMsg]       = useState('')
  const [loading,   setLoading]   = useState(false)
  const [gLoading,  setGLoading]  = useState(false)

  // Load Google Identity Services script
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    if (window.google) return
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    document.head.appendChild(script)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setLoading(true); setError(''); setMsg('')
    try {
      const data = tab === 'login'
        ? await authLogin(email, password)
        : await authRegister(email, password)
      login(data.token, data.user)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const handleGoogle = () => {
    if (!GOOGLE_CLIENT_ID || !window.google) return
    setGLoading(true); setError('')
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        try {
          const data = await authGoogleLogin(response.credential)
          login(data.token, data.user)
          navigate(from, { replace: true })
        } catch (err) {
          setError(err.message || 'Google sign-in failed. Please try email.')
          setGLoading(false)
        }
      },
    })
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        setGLoading(false)
      }
    })
  }

  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* Logo */}
        <div style={s.logo}>
          <span style={s.logoText}>TheBhagya</span>
          <span style={s.logoSub}>भाग्य · DESTINY</span>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          <button style={s.tab(tab === 'login')}    onClick={() => { setTab('login');    setError(''); setMsg('') }}>Sign In</button>
          <button style={s.tab(tab === 'register')} onClick={() => { setTab('register'); setError(''); setMsg('') }}>Create Account</button>
        </div>

        {/* Alerts */}
        {error && <div style={s.error}>{error}</div>}
        {msg   && <div style={s.success}>{msg}</div>}

        {/* Google button — only if GOOGLE_CLIENT_ID is configured */}
        {GOOGLE_CLIENT_ID && (
          <>
            <button
              style={{ ...s.googleBtn, opacity: gLoading ? 0.7 : 1 }}
              onClick={handleGoogle}
              disabled={gLoading}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,147,58,0.5)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-elevated, rgba(255,255,255,0.04))' }}
            >
              <GoogleIcon />
              {gLoading ? 'Connecting…' : `Continue with Google`}
            </button>

            <div style={s.orDivider}>
              <div style={s.orLine} />
              <span>or</span>
              <div style={s.orLine} />
            </div>
          </>
        )}

        {/* Email / Password form */}
        <form onSubmit={handleSubmit}>
          <div style={s.field}>
            <label style={s.label}>Email address</label>
            <input
              style={s.input} type="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)}
              autoFocus autoComplete="email"
              onFocus={e => e.target.style.borderColor = '#C9933A'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Password</label>
            <div style={s.pwdWrapper}>
              <input
                style={s.pwdInput}
                type={showPwd ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                onFocus={e => e.target.style.borderColor = '#C9933A'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
              <button type="button" style={s.eyeBtn} onClick={() => setShowPwd(v => !v)}>
                {showPwd ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {tab === 'register' && (
              <div style={{ fontSize: '0.73rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
                Minimum 8 characters
              </div>
            )}
          </div>

          <button
            type="submit"
            style={{ ...s.btn, opacity: loading ? 0.6 : 1 }}
            disabled={loading}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.88' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = loading ? '0.6' : '1' }}
          >
            {loading
              ? 'Please wait…'
              : tab === 'login' ? 'Sign In →' : 'Create Free Account →'}
          </button>
        </form>

        {/* Footer links */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            {tab === 'login'
              ? <>Don't have an account?{' '}
                  <button onClick={() => setTab('register')} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit', padding: 0 }}>
                    Create one free →
                  </button>
                </>
              : <>Already have an account?{' '}
                  <button onClick={() => setTab('login')} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'inherit', padding: 0 }}>
                    Sign in →
                  </button>
                </>
            }
          </span>
          <Link to="/" style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textDecoration: 'none' }}>
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
