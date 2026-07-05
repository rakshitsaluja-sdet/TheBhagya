import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authSeed, authLogin, authRegister } from '../hooks/useApi'

const TEST_ACCOUNTS = [
  { email: 'free@thebhagya.com',    password: 'Test@free1',    plan: 'Starter (Free)',  color: '#8B7B5E' },
  { email: 'pro@thebhagya.com',     password: 'Test@pro1',     plan: 'Bhagya Pro',      color: '#C9933A' },
  { email: 'jyotish@thebhagya.com', password: 'Test@jyotish1', plan: 'Bhagya Jyotish', color: '#9B6FD4' },
]

// Simple eye / eye-off SVG icons
const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)
const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

export default function Login() {
  const { login }  = useAuth()
  const navigate   = useNavigate()
  const location   = useLocation()
  const from       = location.state?.from || '/'

  const [tab,       setTab]       = useState('login')   // 'login' | 'register'
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [showPwd,   setShowPwd]   = useState(false)
  const [plan,      setPlan]      = useState('starter')
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [seeded,    setSeeded]    = useState(false)
  const [seeding,   setSeeding]   = useState(false)

  const s = {
    page: {
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', background: 'var(--bg-deep)',
    },
    card: {
      background: 'var(--bg-card)', border: '1px solid rgba(201,147,58,0.2)',
      borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '420px',
      boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
    },
    logo: { textAlign: 'center', marginBottom: '1.75rem' },
    logoText: { fontFamily: "'Cinzel', serif", fontSize: '1.6rem', color: '#C9933A', letterSpacing: '4px' },
    logoSub:  { fontSize: '0.7rem', color: '#5A4520', letterSpacing: '4px', display: 'block', marginTop: '0.2rem' },
    tabs: { display: 'flex', gap: '0', marginBottom: '1.75rem', borderBottom: '1px solid var(--border)' },
    tab: (active) => ({
      flex: 1, padding: '0.65rem', border: 'none', background: 'none', cursor: 'pointer',
      fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: active ? 600 : 400,
      color: active ? '#C9933A' : 'var(--text-muted)',
      borderBottom: active ? '2px solid #C9933A' : '2px solid transparent',
      marginBottom: '-1px', transition: 'all 0.2s',
    }),
    label: { display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)',
              letterSpacing: '0.5px', marginBottom: '0.4rem' },
    input: {
      width: '100%', padding: '0.7rem 0.9rem', border: '1px solid var(--border)',
      borderRadius: '8px', background: 'var(--input-bg, rgba(255,255,255,0.04))',
      color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.9rem',
      outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
    },
    // Password input leaves room for the eye icon
    pwdInput: {
      width: '100%', padding: '0.7rem 2.8rem 0.7rem 0.9rem', border: '1px solid var(--border)',
      borderRadius: '8px', background: 'var(--input-bg, rgba(255,255,255,0.04))',
      color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.9rem',
      outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
    },
    pwdWrapper: { position: 'relative' },
    eyeBtn: {
      position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
      background: 'none', border: 'none', cursor: 'pointer', padding: '0',
      color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
      transition: 'color 0.2s',
    },
    select: {
      width: '100%', padding: '0.7rem 0.9rem', border: '1px solid var(--border)',
      borderRadius: '8px', background: 'var(--bg-card)', color: 'var(--text-primary)',
      fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
    },
    btn: {
      width: '100%', padding: '0.8rem', border: 'none', borderRadius: '8px', cursor: 'pointer',
      background: 'linear-gradient(135deg, #C9933A 0%, #8B6020 100%)',
      color: '#FFF8EC', fontFamily: 'inherit', fontSize: '0.95rem', fontWeight: 600,
      marginTop: '1.25rem', transition: 'opacity 0.2s',
    },
    error: { background: 'rgba(200,50,50,0.1)', border: '1px solid rgba(200,50,50,0.3)',
              borderRadius: '8px', padding: '0.65rem 0.9rem', color: '#E07B39',
              fontSize: '0.84rem', marginBottom: '1rem' },
    field: { marginBottom: '1rem' },
    testSection: { marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' },
    testTitle: { fontSize: '0.73rem', fontWeight: 700, letterSpacing: '1.5px', color: 'var(--text-dim)',
                  textTransform: 'uppercase', marginBottom: '0.75rem', textAlign: 'center' },
    testCard: (color) => ({
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0.6rem 0.85rem', borderRadius: '8px', marginBottom: '0.5rem', cursor: 'pointer',
      border: `1px solid ${color}33`, background: `${color}08`, transition: 'background 0.15s',
    }),
    testEmail: { fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' },
    testPlan:  (color) => ({ fontSize: '0.72rem', fontWeight: 700, color, letterSpacing: '0.5px' }),
    seedBtn: {
      width: '100%', padding: '0.55rem', border: '1px solid var(--border)', borderRadius: '8px',
      background: 'none', color: 'var(--text-muted)', fontFamily: 'inherit', fontSize: '0.8rem',
      cursor: 'pointer', marginTop: '0.75rem', transition: 'all 0.2s',
    },
  }

  const seedUsers = async (silent = false) => {
    if (seeded || seeding) return true
    setSeeding(true)
    try {
      await authSeed()
      setSeeded(true)
      setError('')
      return true
    } catch (err) {
      if (!silent) setError('Could not reach the backend. Make sure it is running (start.ps1).')
      return false
    } finally {
      setSeeding(false)
    }
  }

  const fillTestAccount = async (acc) => {
    await seedUsers(true)
    setEmail(acc.email)
    setPassword(acc.password)
    setShowPwd(false)
    setTab('login')
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setLoading(true); setError('')

    try {
      const data = tab === 'login'
        ? await authLogin(email, password)
        : await authRegister(email, password, plan)

      login(data.token, data.user)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Could not reach backend. Is the server running?')
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* Logo */}
        <div style={s.logo}>
          <div style={s.logoText}>TheBhagya</div>
          <span style={s.logoSub}>भाग्य · DESTINY</span>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          <button style={s.tab(tab === 'login')}    onClick={() => { setTab('login');    setError('') }}>Sign In</button>
          <button style={s.tab(tab === 'register')} onClick={() => { setTab('register'); setError('') }}>Create Account</button>
        </div>

        {/* Error */}
        {error && <div style={s.error}>{error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input style={s.input} type="email" placeholder="you@example.com"
              value={email} onChange={e => setEmail(e.target.value)} autoFocus />
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
              />
              <button
                type="button"
                style={s.eyeBtn}
                onClick={() => setShowPwd(v => !v)}
                title={showPwd ? 'Hide password' : 'Show password'}
              >
                {showPwd ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {tab === 'register' && (
            <div style={s.field}>
              <label style={s.label}>Plan</label>
              <select style={s.select} value={plan} onChange={e => setPlan(e.target.value)}>
                <option value="starter">Starter — Free (3 charts, Vedic + Lal Kitab)</option>
                <option value="pro">Bhagya Pro — ₹299/mo (Unlimited + Chat + PDF)</option>
                <option value="jyotish">Bhagya Jyotish — ₹799/mo (Everything)</option>
              </select>
            </div>
          )}

          <button style={{ ...s.btn, opacity: loading ? 0.6 : 1 }} disabled={loading}>
            {loading ? 'Please wait…' : tab === 'login' ? 'Sign In →' : 'Create Account →'}
          </button>
        </form>

        {/* Test accounts section */}
        <div style={s.testSection}>
          <div style={s.testTitle}>🔬 Test Accounts — click to fill</div>

          {seeded ? (
            <div style={{ fontSize:'0.75rem', color:'#5A8A5E', textAlign:'center', marginBottom:'0.5rem' }}>
              ✓ Test accounts ready — click any card to auto-fill
            </div>
          ) : (
            <div style={{ fontSize:'0.75rem', color:'var(--text-dim)', textAlign:'center', marginBottom:'0.5rem' }}>
              Click any card below — accounts are seeded automatically
            </div>
          )}

          {TEST_ACCOUNTS.map(acc => (
            <div key={acc.email} style={s.testCard(acc.color)}
              onClick={() => fillTestAccount(acc)}>
              <div>
                <div style={s.testEmail}>{acc.email}</div>
                <div style={{ fontSize:'0.73rem', color:'var(--text-dim)', fontFamily:'monospace', marginTop:'2px' }}>
                  {acc.password}
                </div>
              </div>
              <span style={s.testPlan(acc.color)}>{acc.plan}</span>
            </div>
          ))}

          {/* Manual seed button still available as fallback */}
          {!seeded && (
            <button style={{ ...s.seedBtn, opacity: seeding ? 0.5 : 1 }} onClick={() => seedUsers(false)} disabled={seeding}>
              {seeding ? '⟳ Seeding…' : '⚙ Manually seed test accounts'}
            </button>
          )}
        </div>

        <div style={{ textAlign:'center', marginTop:'1.25rem' }}>
          <Link to="/" style={{ fontSize:'0.8rem', color:'var(--text-dim)', textDecoration:'none' }}>
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
