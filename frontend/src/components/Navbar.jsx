import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import { useAuth, PLAN_FEATURES } from '../context/AuthContext'
import LogoMark from './LogoMark'

const PLAN_COLORS = {
  starter:  '#8B7B5E',
  pro:      '#C9933A',
  jyotish:  '#9B6FD4',
}

const s = {
  nav: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    background: 'var(--nav-bg)',
    alignItems: 'center',
    padding: '1rem 2rem',
    borderBottom: '1px solid rgba(201,147,58,0.15)',
    backdropFilter: 'blur(16px)',
    position: 'sticky', top: 0, zIndex: 100,
    minHeight: '64px',
  },
  leftLinks:  { display: 'flex', alignItems: 'center', gap: '2rem' },
  rightLinks: { display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'flex-end' },
  logo: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '0.4rem', textDecoration: 'none',
  },
  logoMain: {
    fontFamily: "'Cinzel', serif", fontSize: '1.75rem', fontWeight: 700,
    color: '#C9933A', letterSpacing: '5px', lineHeight: 1,
  },
  logoSub: {
    fontFamily: "'Cinzel', serif", fontSize: '0.58rem', fontWeight: 400,
    color: '#5A4520', letterSpacing: '5px',
  },
  link: {
    fontWeight: 500, fontSize: '0.9rem', color: 'var(--text-muted)',
    textDecoration: 'none', transition: 'color 0.2s', cursor: 'pointer',
    background: 'none', border: 'none', fontFamily: 'inherit',
  },
  linkActive: { color: 'var(--gold)' },
  iconBtn: {
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: '50%',
    width: '36px', height: '36px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', fontSize: '1rem',
    color: 'var(--gold)',
    transition: 'border-color 0.2s, background 0.2s',
    flexShrink: 0,
  },
  langBtn: {
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: '20px',
    padding: '0 0.75rem',
    height: '36px',
    display: 'flex', alignItems: 'center', gap: '0.3rem',
    cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700,
    color: 'var(--gold)',
    transition: 'border-color 0.2s, background 0.2s',
    flexShrink: 0, letterSpacing: '0.5px',
  },
  cta: {
    background: 'transparent',
    color: 'var(--gold)',
    padding: '0.38rem 1.1rem',
    borderRadius: '6px',
    border: '1px solid rgba(201,147,58,0.5)',
    fontWeight: 600,
    fontSize: '0.875rem',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    display: 'inline-flex',
    alignItems: 'center',
    transition: 'border-color 0.2s, background 0.2s',
  },
}

const T = {
  home:      { en: 'Home',          hi: 'होम' },
  charts:    { en: 'My Charts',     hi: 'मेरी कुंडली' },
  chat:      { en: 'Destiny Chat',  hi: 'भाग्य चैट' },
  numeral:   { en: 'Numerology',    hi: 'अंकशास्त्र' },
  horoscope: { en: 'Horoscope',     hi: 'राशिफल' },
  sadeSati:  { en: 'Sade Sati',     hi: 'साढ़े साती' },
  pricing:   { en: 'Pricing',       hi: 'मूल्य' },
  features:  { en: 'Features',      hi: 'विशेषताएं' },
  cta:       { en: 'Get Your Reading', hi: 'कुंडली देखें' },
  login:     { en: 'Sign In',       hi: 'लॉगिन' },
  logout:    { en: 'Sign Out',      hi: 'लॉगआउट' },
}

// ── User avatar dropdown ──────────────────────────────────────────────────────
function UserAvatar({ user, plan, planBadge, planColor, onLogout, lang }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initial = (user?.email || '?')[0].toUpperCase()

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        title={user?.email}
        style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: `linear-gradient(135deg, #C9933A, #8B6020)`,
          border: '2px solid rgba(201,147,58,0.5)',
          color: '#FFF8EC', fontWeight: 700, fontSize: '0.95rem',
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0,
          transition: 'border-color 0.2s, transform 0.15s',
          transform: open ? 'scale(1.05)' : 'scale(1)',
        }}
      >
        {initial}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 10px)', right: 0,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '10px', minWidth: '200px', zIndex: 200,
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #C9933A, #8B6020)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#FFF8EC', fontWeight: 700, fontSize: '1rem',
              }}>{initial}</div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {user?.email?.split('@')[0]}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {user?.email}
                </div>
              </div>
            </div>
            <div style={{ marginTop: '10px' }}>
              <span style={{
                fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.5px',
                padding: '0.2rem 0.6rem', borderRadius: '10px',
                border: `1px solid ${planColor}55`,
                background: `${planColor}20`,
                color: planColor,
              }}>{planBadge}</span>
            </div>
          </div>
          <div style={{ padding: '6px' }}>
            {[
              { icon: '☽', label: lang === 'hi' ? 'मेरी कुंडली' : 'My Charts', href: '/my-charts' },
              { icon: '✦', label: lang === 'hi' ? 'प्लान अपग्रेड' : 'Upgrade Plan', href: '/pricing' },
            ].map(item => (
              <button key={item.href}
                onClick={() => { setOpen(false); navigate(item.href) }}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 12px',
                  background: 'none', border: 'none', borderRadius: '6px',
                  cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-primary)',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  transition: 'background 0.15s', minHeight: '40px',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,147,58,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                {item.icon} {item.label}
              </button>
            ))}
            <div style={{ height: '1px', background: 'var(--border)', margin: '6px 0' }} />
            <button
              onClick={() => { setOpen(false); onLogout() }}
              style={{
                width: '100%', textAlign: 'left', padding: '10px 12px',
                background: 'none', border: 'none', borderRadius: '6px',
                cursor: 'pointer', fontSize: '0.875rem', color: '#C0392B',
                display: 'flex', alignItems: 'center', gap: '8px',
                transition: 'background 0.15s', minHeight: '40px',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(192,57,43,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              ⎋ {lang === 'hi' ? 'लॉगआउट' : 'Sign Out'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Navbar ───────────────────────────────────────────────────────────────
export default function Navbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { theme, toggle: toggleTheme } = useTheme()
  const { lang, toggle: toggleLang, isHindi } = useLanguage()
  const { isLoggedIn, user, plan, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false) }, [pathname])

  // Close on outside click
  const navRef = useRef(null)
  useEffect(() => {
    const handler = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setMobileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isActive = (path) => pathname === path ? { ...s.link, ...s.linkActive } : s.link
  const mobileActiveCls = (path) => `nav-mobile-link${pathname === path ? ' active' : ''}`

  const handleFeatures = (e) => {
    e?.preventDefault()
    setMobileOpen(false)
    if (pathname === '/') {
      document.getElementById('pillars')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/')
      setTimeout(() => document.getElementById('pillars')?.scrollIntoView({ behavior: 'smooth' }), 300)
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  const planColor = PLAN_COLORS[plan] || '#8B7B5E'
  const planBadge = PLAN_FEATURES[plan]?.badge || '✦ FREE'

  return (
    <div ref={navRef}>
      <nav style={s.nav}>
        {/* Left — desktop links */}
        <div className="nav-desktop-links" style={s.leftLinks}>
          <Link to="/"             style={isActive('/')}>{T.home[lang]}</Link>
          <Link to="/my-charts"    style={isActive('/my-charts')}>{T.charts[lang]}</Link>
          <Link to="/horoscope"    style={isActive('/horoscope')}>{T.horoscope[lang]}</Link>
          <Link to="/sade-sati"    style={isActive('/sade-sati')}>{T.sadeSati[lang]}</Link>
          <Link to="/destiny-chat" style={isActive('/destiny-chat')}>{T.chat[lang]}</Link>
          <Link to="/numerology"   style={isActive('/numerology')}>{T.numeral[lang]}</Link>
        </div>

        {/* Mobile hamburger (left side) */}
        <button
          className={`nav-hamburger${mobileOpen ? ' open' : ''}`}
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Menu"
          style={{ justifySelf: 'start' }}
        >
          <span /><span /><span />
        </button>

        {/* Center — Logo */}
        <Link to="/" style={s.logo}>
          <LogoMark size={48} />
          <span style={s.logoMain}>Bhagya</span>
          <span style={s.logoSub}>भाग्य · DESTINY</span>
        </Link>

        {/* Right — desktop actions */}
        <div className="nav-desktop-links" style={s.rightLinks}>
          <button style={s.link} onClick={handleFeatures}>{T.features[lang]}</button>
          <Link to="/pricing" style={isActive('/pricing')}>{T.pricing[lang]}</Link>
          <button style={s.langBtn} onClick={toggleLang}>
            {isHindi ? 'EN' : 'हिं'}
          </button>
          <button style={s.iconBtn} onClick={toggleTheme}>
            {theme === 'dark' ? '☀' : '🌙'}
          </button>
          {isLoggedIn ? (
            <UserAvatar user={user} plan={plan} planBadge={planBadge} planColor={planColor} onLogout={handleLogout} lang={lang} />
          ) : (
            <>
              <Link to="/login" style={isActive('/login')}>{T.login[lang]}</Link>
              <Link to="/chart/new" style={s.cta}>{T.cta[lang]}</Link>
            </>
          )}
        </div>

        {/* Mobile right side — just icon buttons */}
        <div className="nav-hamburger" style={{ justifySelf: 'end', background: 'none', border: 'none', padding: 0, gap: '0.5rem', flexDirection: 'row' }}>
          <button style={{ ...s.iconBtn, width: '32px', height: '32px', fontSize: '0.9rem' }} onClick={toggleTheme}>
            {theme === 'dark' ? '☀' : '🌙'}
          </button>
          {isLoggedIn && (
            <UserAvatar user={user} plan={plan} planBadge={planBadge} planColor={planColor} onLogout={handleLogout} lang={lang} />
          )}
        </div>
      </nav>

      {/* Mobile drawer */}
      <div className={`nav-mobile-drawer${mobileOpen ? ' open' : ''}`}>
        <Link to="/"             className={mobileActiveCls('/')}>🏠 {T.home[lang]}</Link>
        <Link to="/chart/new"    className="nav-mobile-link">🔮 {T.cta[lang]}</Link>
        <Link to="/my-charts"    className={mobileActiveCls('/my-charts')}>☽ {T.charts[lang]}</Link>
        <Link to="/horoscope"    className={mobileActiveCls('/horoscope')}>♈ {T.horoscope[lang]}</Link>
        <Link to="/sade-sati"    className={mobileActiveCls('/sade-sati')}>♄ {T.sadeSati[lang]}</Link>
        <Link to="/destiny-chat" className={mobileActiveCls('/destiny-chat')}>✨ {T.chat[lang]}</Link>
        <Link to="/numerology"   className={mobileActiveCls('/numerology')}>∑ {T.numeral[lang]}</Link>
        <button className="nav-mobile-link" onClick={handleFeatures}>★ {T.features[lang]}</button>
        <Link to="/pricing"      className={mobileActiveCls('/pricing')}>💎 {T.pricing[lang]}</Link>

        <div className="nav-mobile-actions">
          <button style={{ ...s.langBtn, height: '40px' }} onClick={toggleLang}>
            {isHindi ? 'EN' : 'हिं'}
          </button>
          {!isLoggedIn && (
            <Link to="/login" style={{ ...s.cta, flex: 1, justifyContent: 'center', padding: '0.625rem 1rem' }}>
              {T.login[lang]}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
