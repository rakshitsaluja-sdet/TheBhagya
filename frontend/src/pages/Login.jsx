import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authLogin, authRegister, authGoogleLogin, authOtpSend, authOtpVerify } from '../hooks/useApi'
import GravityCanvas from '../components/GravityCanvas'
import LogoMark from '../components/LogoMark'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
const OTP_RESEND_SECS  = 60

/* ── Icons ──────────────────────────────────────────────────────────────── */
const EyeIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)
const EyeOffIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)
const GoogleIcon = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

/* ── Styles (all hardcoded dark — no CSS vars) ──────────────────────────── */
const GOLD = '#C9933A'
const BG   = '#05050f'
const FG   = '#F5F0E8'
const MUT  = 'rgba(245,240,232,0.50)'
const DIM  = 'rgba(245,240,232,0.26)'
const LINE = 'rgba(201,147,58,0.20)'

const s = {
  root: {
    background: BG, minHeight: '100vh',
    position: 'relative', overflow: 'hidden',
  },
  nav: {
    position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 200,
    padding: '1.4rem 5vw', display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', mixBlendMode: 'difference', pointerEvents: 'none',
  },
  navBrand: {
    fontFamily: "'Cinzel', serif", fontWeight: 700,
    fontSize: '0.82rem', letterSpacing: '6px',
    color: '#fff', textDecoration: 'none', pointerEvents: 'auto',
  },
  navBack: {
    fontSize: '0.60rem', letterSpacing: '2.5px', textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.50)', textDecoration: 'none', pointerEvents: 'auto',
  },
  center: {
    position: 'relative', zIndex: 10,
    minHeight: '100vh',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '6rem 1.5rem 2rem',
    pointerEvents: 'none',
  },
  card: {
    background: 'rgba(5,5,20,0.72)',
    backdropFilter: 'blur(28px) saturate(1.5)',
    WebkitBackdropFilter: 'blur(28px) saturate(1.5)',
    border: `1px solid ${LINE}`,
    padding: '2.6rem 2.2rem 2.2rem',
    width: '100%', maxWidth: '400px',
    pointerEvents: 'auto',
    boxShadow: `0 0 80px rgba(201,147,58,0.06), 0 24px 64px rgba(0,0,0,0.5)`,
  },
  logo: { textAlign: 'center', marginBottom: '2rem' },
  logoText: {
    fontFamily: "'Cinzel', serif", fontSize: '1.6rem',
    color: GOLD, letterSpacing: '5px', display: 'block',
    textShadow: `0 0 40px rgba(201,147,58,0.30)`,
  },
  logoSub: {
    fontSize: '0.60rem', color: 'rgba(201,147,58,0.45)',
    letterSpacing: '4px', display: 'block', marginTop: '0.3rem',
  },
  tabs: { display: 'flex', marginBottom: '1.8rem', borderBottom: `1px solid ${LINE}` },
  tab: (active) => ({
    flex: 1, padding: '0.65rem 0.3rem', border: 'none', background: 'none',
    cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem',
    fontWeight: active ? 600 : 400,
    color: active ? GOLD : MUT,
    borderBottom: active ? `2px solid ${GOLD}` : '2px solid transparent',
    marginBottom: '-1px', transition: 'all 0.2s', letterSpacing: '0.5px',
  }),
  label: {
    display: 'block', fontSize: '0.72rem', fontWeight: 600,
    color: MUT, letterSpacing: '1px', marginBottom: '0.4rem',
    textTransform: 'uppercase',
  },
  input: {
    width: '100%', padding: '0.75rem 1rem',
    border: `1px solid ${LINE}`,
    background: 'rgba(255,255,255,0.04)',
    color: FG, fontFamily: 'inherit', fontSize: '0.92rem',
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
    borderRadius: 0,
  },
  otpInput: {
    width: '100%', padding: '1rem', textAlign: 'center',
    border: `1px solid ${LINE}`,
    background: 'rgba(255,255,255,0.04)',
    color: FG, fontFamily: "'Cinzel', serif", fontSize: '1.8rem',
    letterSpacing: '0.6em',
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
    borderRadius: 0,
  },
  pwdWrapper: { position: 'relative' },
  pwdInput: {
    width: '100%', padding: '0.75rem 3rem 0.75rem 1rem',
    border: `1px solid ${LINE}`,
    background: 'rgba(255,255,255,0.04)',
    color: FG, fontFamily: 'inherit', fontSize: '0.92rem',
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
    borderRadius: 0,
  },
  eyeBtn: {
    position: 'absolute', right: '0.875rem', top: '50%',
    transform: 'translateY(-50%)', background: 'none', border: 'none',
    cursor: 'pointer', padding: 0, color: MUT,
    display: 'flex', alignItems: 'center',
  },
  field: { marginBottom: '1.1rem' },
  btn: {
    width: '100%', padding: '0.9rem', border: 'none', cursor: 'pointer',
    background: `linear-gradient(135deg, ${GOLD}, #8B6020)`,
    color: '#FFF8EC', fontFamily: 'inherit', fontSize: '0.88rem', fontWeight: 600,
    marginTop: '0.25rem', transition: 'opacity 0.2s',
    letterSpacing: '2px', textTransform: 'uppercase',
    boxShadow: `0 0 28px rgba(201,147,58,0.20)`,
    borderRadius: 0,
  },
  googleBtn: {
    width: '100%', padding: '0.8rem',
    border: `1px solid ${LINE}`,
    background: 'rgba(255,255,255,0.04)',
    color: FG, fontFamily: 'inherit', fontSize: '0.88rem', fontWeight: 500,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
    transition: 'border-color 0.2s, background 0.2s', cursor: 'pointer',
    borderRadius: 0,
  },
  outlineBtn: {
    width: '100%', padding: '0.8rem', cursor: 'pointer',
    border: `1px solid ${LINE}`,
    background: 'rgba(255,255,255,0.03)',
    color: MUT, fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 500,
    transition: 'border-color 0.2s, color 0.2s',
    borderRadius: 0,
  },
  orDivider: {
    display: 'flex', alignItems: 'center', gap: '1rem',
    margin: '1.2rem 0', color: DIM, fontSize: '0.72rem',
  },
  orLine: { flex: 1, height: 1, background: LINE },
  error: {
    background: 'rgba(200,50,50,0.12)', border: '1px solid rgba(200,50,50,0.30)',
    padding: '0.65rem 0.9rem', color: '#E07B39',
    fontSize: '0.82rem', marginBottom: '1rem',
  },
  success: {
    background: 'rgba(50,180,80,0.10)', border: '1px solid rgba(50,180,80,0.30)',
    padding: '0.65rem 0.9rem', color: '#4CAF50',
    fontSize: '0.82rem', marginBottom: '1rem',
  },
  info: {
    background: 'rgba(201,147,58,0.07)', border: `1px solid ${LINE}`,
    padding: '0.65rem 0.9rem', color: 'rgba(201,147,58,0.85)',
    fontSize: '0.82rem', marginBottom: '1rem', lineHeight: 1.5,
  },
  hint: { fontSize: '0.70rem', color: DIM, marginTop: '0.4rem' },
  footerLinks: {
    textAlign: 'center', marginTop: '1.6rem',
    display: 'flex', flexDirection: 'column', gap: '0.6rem',
  },
  footerText: { fontSize: '0.78rem', color: DIM },
  footerBtn: {
    background: 'none', border: 'none', color: GOLD,
    cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'inherit', padding: 0,
  },
  backLink: { fontSize: '0.72rem', color: DIM, textDecoration: 'none' },
  timerText: {
    textAlign: 'center', fontSize: '0.75rem', color: DIM, marginTop: '0.75rem',
  },
  resendBtn: {
    background: 'none', border: 'none', color: GOLD,
    cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.75rem', padding: 0,
  },
}

/* ══════════════════════════════════════════════════════════════════════════
   Login page — standalone dark (no app Navbar/Footer)
══════════════════════════════════════════════════════════════════════════ */
export default function Login() {
  const { login }  = useAuth()
  const navigate   = useNavigate()
  const location   = useLocation()
  const from       = location.state?.from || '/'

  // tab: 'login' | 'register' | 'otp'
  const [tab,      setTab]      = useState('login')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [error,    setError]    = useState('')
  const [msg,      setMsg]      = useState('')
  const [loading,  setLoading]  = useState(false)
  const [gLoading, setGLoading] = useState(false)

  // OTP state
  const [otpEmail,   setOtpEmail]   = useState('')
  const [otpCode,    setOtpCode]    = useState('')
  const [otpSent,    setOtpSent]    = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [timer,      setTimer]      = useState(0)
  const timerRef = useRef(null)

  // Load Google Identity Services
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || window.google) return
    const el = document.createElement('script')
    el.src = 'https://accounts.google.com/gsi/client'
    el.async = el.defer = true
    document.head.appendChild(el)
  }, [])

  // OTP countdown timer
  useEffect(() => {
    if (timer <= 0) { clearInterval(timerRef.current); return }
    timerRef.current = setInterval(() => setTimer(t => t - 1), 1000)
    return () => clearInterval(timerRef.current)
  }, [timer])

  // Reset OTP state when switching away
  const switchTab = (t) => {
    setTab(t); setError(''); setMsg('')
    if (t !== 'otp') { setOtpSent(false); setOtpCode(''); setTimer(0) }
  }

  /* ── Email / password submit ─────────────────────────────────────────── */
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

  /* ── Google sign-in ──────────────────────────────────────────────────── */
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
          const msg = err.message || ''
          // 501 = GOOGLE_CLIENT_ID not set on backend
          if (msg.includes('not configured') || msg.includes('501')) {
            setError('Google login is not available right now. Please use OTP Login instead.')
          } else {
            setError(msg || 'Google sign-in failed. Please try another method.')
          }
          setGLoading(false)
        }
      },
    })
    window.google.accounts.id.prompt((n) => {
      if (n.isNotDisplayed() || n.isSkippedMoment()) setGLoading(false)
    })
  }

  /* ── OTP: send code ──────────────────────────────────────────────────── */
  const handleSendOtp = async (e) => {
    e.preventDefault()
    if (!otpEmail || !otpEmail.includes('@')) { setError('Please enter a valid email address.'); return }
    setOtpLoading(true); setError(''); setMsg('')
    try {
      await authOtpSend(otpEmail)
      setOtpSent(true)
      setOtpCode('')
      setTimer(OTP_RESEND_SECS)
      setMsg(`Code sent to ${otpEmail}. Check your inbox.`)
    } catch (err) {
      setError(err.message || 'Could not send OTP. Please try again.')
    } finally {
      setOtpLoading(false)
    }
  }

  /* ── OTP: verify code ────────────────────────────────────────────────── */
  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (otpCode.length < 6) { setError('Please enter the 6-digit code.'); return }
    setOtpLoading(true); setError(''); setMsg('')
    try {
      const data = await authOtpVerify(otpEmail, otpCode)
      login(data.token, data.user)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Invalid code. Please try again.')
      setOtpLoading(false)
    }
  }

  /* ── OTP: resend ─────────────────────────────────────────────────────── */
  const handleResend = async () => {
    setOtpLoading(true); setError(''); setMsg('')
    try {
      await authOtpSend(otpEmail)
      setOtpCode('')
      setTimer(OTP_RESEND_SECS)
      setMsg('New code sent! Check your inbox.')
    } catch (err) {
      setError(err.message || 'Could not resend OTP.')
    } finally {
      setOtpLoading(false)
    }
  }

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <div style={s.root}>
      <GravityCanvas density={30} force={5} radius={170} glow={58} />

      {/* Top nav */}
      <nav style={s.nav}>
        <Link to="/" style={{ ...s.navBrand, display:'flex', alignItems:'center', gap:'0.6rem' }}>
          <LogoMark size={24} />
          BHAGYA
        </Link>
        <Link to="/" style={s.navBack}>← Back</Link>
      </nav>

      {/* Glass card */}
      <div style={s.center}>
        <div style={s.card}>

          {/* Logo */}
          <div style={s.logo}>
            <span style={s.logoText}>Bhagya</span>
            <span style={s.logoSub}>भाग्य · DESTINY</span>
          </div>

          {/* Tabs */}
          <div style={s.tabs}>
            <button style={s.tab(tab === 'login')}
              onClick={() => switchTab('login')}>Sign In</button>
            <button style={s.tab(tab === 'register')}
              onClick={() => switchTab('register')}>Register</button>
            <button style={s.tab(tab === 'otp')}
              onClick={() => switchTab('otp')}>OTP Login</button>
          </div>

          {/* Alerts */}
          {error && <div style={s.error}>{error}</div>}
          {msg   && <div style={s.success}>{msg}</div>}

          {/* ── OTP tab ─────────────────────────────────────────── */}
          {tab === 'otp' && (
            <>
              {!otpSent ? (
                /* Step 1: Enter email */
                <form onSubmit={handleSendOtp}>
                  <div style={s.info}>
                    Enter your email and we'll send a 6-digit code — no password needed.
                    Works for both new and existing accounts.
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Email</label>
                    <input
                      style={s.input} type="email" placeholder="you@example.com"
                      value={otpEmail} onChange={e => setOtpEmail(e.target.value)}
                      autoFocus autoComplete="email"
                      onFocus={e => e.target.style.borderColor = GOLD}
                      onBlur={e  => e.target.style.borderColor = LINE}
                    />
                  </div>
                  <button
                    type="submit"
                    style={{ ...s.btn, opacity: otpLoading ? 0.6 : 1 }}
                    disabled={otpLoading}
                  >
                    {otpLoading ? 'Sending…' : 'Send Code →'}
                  </button>
                </form>
              ) : (
                /* Step 2: Enter OTP */
                <form onSubmit={handleVerifyOtp}>
                  <div style={s.field}>
                    <label style={s.label}>6-digit code</label>
                    <input
                      style={s.otpInput}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="000000"
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      autoFocus
                      onFocus={e => e.target.style.borderColor = GOLD}
                      onBlur={e  => e.target.style.borderColor = LINE}
                    />
                    <div style={s.hint}>Sent to {otpEmail}</div>
                  </div>
                  <button
                    type="submit"
                    style={{ ...s.btn, opacity: otpLoading ? 0.6 : 1 }}
                    disabled={otpLoading}
                  >
                    {otpLoading ? 'Verifying…' : 'Verify & Sign In →'}
                  </button>
                  <div style={s.timerText}>
                    {timer > 0
                      ? `Resend code in ${timer}s`
                      : <><button type="button" style={s.resendBtn} onClick={handleResend} disabled={otpLoading}>Resend code</button></>
                    }
                  </div>
                  <div style={{ marginTop: '0.75rem' }}>
                    <button
                      type="button"
                      style={s.outlineBtn}
                      onClick={() => { setOtpSent(false); setOtpCode(''); setError(''); setMsg('') }}
                    >
                      ← Change email
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* ── Sign In / Register tabs ────────────────────────── */}
          {tab !== 'otp' && (
            <>
              {/* Google button */}
              {GOOGLE_CLIENT_ID && (
                <>
                  <button
                    style={{ ...s.googleBtn, opacity: gLoading ? 0.6 : 1 }}
                    onClick={handleGoogle}
                    disabled={gLoading}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,147,58,0.45)'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = LINE; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                  >
                    <GoogleIcon />
                    {gLoading ? 'Connecting…' : 'Continue with Google'}
                  </button>
                  <div style={s.orDivider}>
                    <div style={s.orLine}/><span>or</span><div style={s.orLine}/>
                  </div>
                </>
              )}

              {/* Email / password form */}
              <form onSubmit={handleSubmit}>
                <div style={s.field}>
                  <label style={s.label}>Email</label>
                  <input
                    style={s.input} type="email" placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    autoFocus autoComplete="email"
                    onFocus={e => e.target.style.borderColor = GOLD}
                    onBlur={e  => e.target.style.borderColor = LINE}
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
                      onFocus={e => e.target.style.borderColor = GOLD}
                      onBlur={e  => e.target.style.borderColor = LINE}
                    />
                    <button type="button" style={s.eyeBtn} onClick={() => setShowPwd(v => !v)}>
                      {showPwd ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {tab === 'register' && <div style={s.hint}>Minimum 8 characters</div>}
                </div>

                <button
                  type="submit"
                  style={{ ...s.btn, opacity: loading ? 0.6 : 1 }}
                  disabled={loading}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.85' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = loading ? '0.6' : '1' }}
                >
                  {loading ? 'Please wait…' : tab === 'login' ? 'Sign In →' : 'Create Free Account →'}
                </button>
              </form>

              {/* Footer */}
              <div style={s.footerLinks}>
                <span style={s.footerText}>
                  {tab === 'login'
                    ? <>Don't have an account?{' '}
                        <button onClick={() => switchTab('register')} style={s.footerBtn}>Create one free →</button>
                      </>
                    : <>Already have an account?{' '}
                        <button onClick={() => switchTab('login')} style={s.footerBtn}>Sign in →</button>
                      </>
                  }
                </span>
                <span style={s.footerText}>
                  No password?{' '}
                  <button onClick={() => switchTab('otp')} style={s.footerBtn}>Login with OTP →</button>
                </span>
                <Link to="/" style={s.backLink}>← Back to home</Link>
              </div>
            </>
          )}

          {/* OTP footer */}
          {tab === 'otp' && (
            <div style={{ ...s.footerLinks, marginTop: '1.2rem' }}>
              <span style={s.footerText}>
                Prefer a password?{' '}
                <button onClick={() => switchTab('login')} style={s.footerBtn}>Sign in →</button>
              </span>
              <Link to="/" style={s.backLink}>← Back to home</Link>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
