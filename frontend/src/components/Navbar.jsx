import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import { useAuth, PLAN_FEATURES } from '../context/AuthContext'
import LogoMark from './LogoMark'

const PLAN_COLORS = {
  starter:  '#ADA28B',
  pro:      '#DFA84F',
  jyotish:  '#8B6FE8',
}

const s = {
  wrap: {
    position: 'sticky', top: 0, zIndex: 100,
    padding: '0.7rem 1.2rem 0',
  },
  nav: {
    maxWidth: 1280,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto',
    alignItems: 'center',
    gap: '1.5rem',
    background: 'var(--nav-bg)',
    border: '1px solid var(--border)',
    borderRadius: 18,
    padding: '0.55rem 1.1rem',
    backdropFilter: 'blur(22px) saturate(1.6)',
    WebkitBackdropFilter: 'blur(22px) saturate(1.6)',
    boxShadow: 'var(--shadow-card)',
    minHeight: 60,
  },
  brand: {
    display: 'flex', alignItems: 'center', gap: '0.65rem',
    textDecoration: 'none',
  },
  brandName: {
    fontFamily: 'var(--font-brand)', fontSize: '1.05rem', fontWeight: 700,
    color: 'var(--gold)', letterSpacing: '4px', lineHeight: 1,
  },
  brandSub: {
    fontFamily: 'var(--font-mono)', fontSize: '0.52rem', fontWeight: 500,
    color: 'var(--text-dim)', letterSpacing: '3px', marginTop: 3, display: 'block',
  },
  center: { display: 'flex', alignItems: 'center', gap: '0.25rem', justifyContent: 'center' },
  right:  { display: 'flex', alignItems: 'center', gap: '0.55rem', justifyContent: 'flex-end' },
  link: {
    fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-muted)',
    textDecoration: 'none', cursor: 'pointer',
    background: 'none', border: 'none', fontFamily: 'inherit',
    padding: '0.5rem 0.85rem', borderRadius: 999,
    transition: 'color 0.2s, background 0.2s',
    whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
  },
  linkActive: { color: 'var(--gold)', background: 'var(--gold-pale)' },
  iconBtn: {
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: '50%',
    width: 36, height: 36,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', fontSize: '0.95rem',
    color: 'var(--gold)',
    transition: 'border-color 0.2s, background 0.2s, transform 0.15s',
    flexShrink: 0,
  },
  langBtn: {
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 999,
    padding: '0 0.75rem',
    height: 36,
    display: 'flex', alignItems: 'center', gap: '0.3rem',
    cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
    color: 'var(--gold)',
    transition: 'border-color 0.2s, background 0.2s',
    flexShrink: 0, letterSpacing: '0.5px',
    fontFamily: 'var(--font-mono)',
  },
  cta: {
    background: 'linear-gradient(135deg, #F2CB84 0%, #DFA84F 42%, #A8752B 100%)',
    color: '#1C1205',
    padding: '0.5rem 1.15rem',
    borderRadius: 999,
    fontWeight: 600,
    fontSize: '0.82rem',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    boxShadow: '0 0 0 1px rgba(242,203,132,0.35) inset, 0 6px 20px rgba(223,168,79,0.25)',
    transition: 'transform 0.18s ease, box-shadow 0.25s ease, filter 0.2s',
  },
  dropdown: {
    position: 'absolute', top: 'calc(100% + 10px)', left: '50%', transform: 'translateX(-50%)',
    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderRadius: 14, minWidth: 230, zIndex: 200,
    boxShadow: 'var(--shadow)',
    overflow: 'hidden', padding: 6,
    animation: 'bh-fade-up 0.22s cubic-bezier(0.22,1,0.36,1) both',
  },
  dropItem: {
    width: '100%', textAlign: 'left', padding: '10px 12px',
    background: 'none', border: 'none', borderRadius: 9,
    cursor: 'pointer', fontSize: '0.86rem', color: 'var(--text-primary)',
    display: 'flex', alignItems: 'center', gap: 10,
    transition: 'background 0.15s', minHeight: 40,
    textDecoration: 'none', fontFamily: 'inherit',
  },
  dropIcon: {
    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
    background: 'var(--gold-pale)', border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.85rem', color: 'var(--gold)',
  },
}

const T = {
  home:      { en: 'Home',          hi: 'होम' },
  charts:    { en: 'My Charts',     hi: 'मेरी कुंडली' },
  chat:      { en: 'Destiny Chat',  hi: 'भाग्य चैट' },
  numeral:   { en: 'Numerology',    hi: 'अंकशास्त्र' },
  horoscope: { en: 'Horoscope',     hi: 'राशिफल' },
  sadeSati:  { en: 'Sade Sati',     hi: 'साढ़े साती' },
  doshas:    { en: 'Doshas',        hi: 'दोष' },
  kundli:    { en: 'Kundli Match',  hi: 'कुंडली मिलान' },
  lalKitab:  { en: 'Lal Kitab',     hi: 'लाल किताब' },
  pricing:   { en: 'Pricing',       hi: 'मूल्य' },
  features:  { en: 'Features',      hi: 'विशेषताएं' },
  tools:     { en: 'Tools',         hi: 'साधन' },
  cta:       { en: 'Free Kundali',  hi: 'मुफ़्त कुंडली' },
  login:     { en: 'Sign In',       hi: 'लॉगिन' },
  logout:    { en: 'Sign Out',      hi: 'लॉगआउट' },
}

const TOOL_LINKS = [
  { icon: '♄', key: 'sadeSati', to: '/sade-sati'       },
  { icon: '♂', key: 'doshas',   to: '/doshas'          },
  { icon: '📕', key: 'lalKitab', to: '/lal-kitab'       },
  { icon: '∑', key: 'numeral',  to: '/numerology'      },
]

// ── Tools dropdown ────────────────────────────────────────────────────────────
function ToolsMenu({ lang, pathname }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => { setOpen(false) }, [pathname])

  const isToolActive = TOOL_LINKS.some(t => t.to === pathname)

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        style={{ ...s.link, ...(isToolActive || open ? s.linkActive : {}) }}
        onClick={() => setOpen(o => !o)}
      >
        {T.tools[lang]}
        <span style={{
          fontSize: '0.55rem', transition: 'transform 0.2s',
          transform: open ? 'rotate(180deg)' : 'none', display: 'inline-block',
        }}>▼</span>
      </button>
      {open && (
        <div style={s.dropdown}>
          {TOOL_LINKS.map(t => (
            <Link key={t.to} to={t.to} style={{
              ...s.dropItem,
              ...(pathname === t.to ? { background: 'var(--gold-pale)' } : {}),
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--gold-pale)'}
              onMouseLeave={e => e.currentTarget.style.background = pathname === t.to ? 'var(--gold-pale)' : 'none'}
            >
              <span style={s.dropIcon}>{t.icon}</span>
              {T[t.key][lang]}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
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
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg, #F2CB84, #A8752B)',
          border: '2px solid rgba(242,203,132,0.5)',
          color: '#1C1205', fontWeight: 700, fontSize: '0.92rem',
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0,
          transition: 'border-color 0.2s, transform 0.15s',
          transform: open ? 'scale(1.06)' : 'scale(1)',
          boxShadow: '0 4px 16px rgba(223,168,79,0.25)',
        }}
      >
        {initial}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 12px)', right: 0,
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: 14, minWidth: 220, zIndex: 200,
          boxShadow: 'var(--shadow)',
          overflow: 'hidden',
          animation: 'bh-fade-up 0.22s cubic-bezier(0.22,1,0.36,1) both',
        }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #F2CB84, #A8752B)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#1C1205', fontWeight: 700, fontSize: '1rem',
              }}>{initial}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.email?.split('@')[0]}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.email}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.62rem', fontWeight: 600, letterSpacing: '1px',
                padding: '0.22rem 0.65rem', borderRadius: 999,
                border: `1px solid ${planColor}55`,
                background: `${planColor}18`,
                color: planColor,
              }}>{planBadge}</span>
            </div>
          </div>
          <div style={{ padding: 6 }}>
            {[
              { icon: '☽', label: lang === 'hi' ? 'मेरी कुंडली' : 'My Charts', href: '/my-charts' },
              { icon: '✦', label: lang === 'hi' ? 'प्लान अपग्रेड' : 'Upgrade Plan', href: '/pricing' },
            ].map(item => (
              <button key={item.href}
                onClick={() => { setOpen(false); navigate(item.href) }}
                style={{ ...s.dropItem, width: '100%' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--gold-pale)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <span style={s.dropIcon}>{item.icon}</span> {item.label}
              </button>
            ))}
            <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
            <button
              onClick={() => { setOpen(false); onLogout() }}
              style={{ ...s.dropItem, color: '#E86F6F' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(232,111,111,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <span style={{ ...s.dropIcon, color: '#E86F6F', background: 'rgba(232,111,111,0.08)', border: '1px solid rgba(232,111,111,0.25)' }}>⎋</span>
              {lang === 'hi' ? 'लॉगआउट' : 'Sign Out'}
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

  useEffect(() => { setMobileOpen(false) }, [pathname])

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

  const handleLogout = () => { logout(); navigate('/') }

  const planColor = PLAN_COLORS[plan] || '#ADA28B'
  const planBadge = PLAN_FEATURES[plan]?.badge || '✦ FREE'

  return (
    <div ref={navRef} style={s.wrap}>
      <nav style={s.nav}>
        {/* Left — brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
          <button
            className={`nav-hamburger${mobileOpen ? ' open' : ''}`}
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Menu"
          >
            <span /><span /><span />
          </button>
          <Link to="/" style={s.brand}>
            <LogoMark size={34} />
            <span>
              <span style={s.brandName}>BHAGYA</span>
              <span style={s.brandSub}>भाग्य · DESTINY</span>
            </span>
          </Link>
        </div>

        {/* Center — desktop links */}
        <div className="nav-desktop-links" style={s.center}>
          <Link to="/my-charts"       style={isActive('/my-charts')}>{T.charts[lang]}</Link>
          <Link to="/horoscope"       style={isActive('/horoscope')}>{T.horoscope[lang]}</Link>
          <Link to="/kundli-matching" style={isActive('/kundli-matching')}>{T.kundli[lang]}</Link>
          <Link to="/destiny-chat"    style={isActive('/destiny-chat')}>{T.chat[lang]}</Link>
          <ToolsMenu lang={lang} pathname={pathname} />
          <Link to="/pricing"         style={isActive('/pricing')}>{T.pricing[lang]}</Link>
        </div>

        {/* Right — actions */}
        <div style={s.right}>
          <div className="nav-desktop-links" style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <button style={s.langBtn} onClick={toggleLang}>
              {isHindi ? 'EN' : 'हिं'}
            </button>
            <button style={s.iconBtn} onClick={toggleTheme}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--gold-pale)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {theme === 'dark' ? '☀' : '🌙'}
            </button>
            {isLoggedIn ? (
              <UserAvatar user={user} plan={plan} planBadge={planBadge} planColor={planColor} onLogout={handleLogout} lang={lang} />
            ) : (
              <>
                <Link to="/login" style={isActive('/login')}>{T.login[lang]}</Link>
                <Link to="/chart/new" style={s.cta}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.filter = 'brightness(1.07)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.filter = 'none' }}
                >✦ {T.cta[lang]}</Link>
              </>
            )}
          </div>

          {/* Mobile right side */}
          <div className="nav-hamburger" style={{ background: 'none', border: 'none', padding: 0, gap: '0.5rem', flexDirection: 'row' }}>
            <button style={{ ...s.iconBtn, width: 32, height: 32, fontSize: '0.85rem' }} onClick={toggleTheme}>
              {theme === 'dark' ? '☀' : '🌙'}
            </button>
            {isLoggedIn && (
              <UserAvatar user={user} plan={plan} planBadge={planBadge} planColor={planColor} onLogout={handleLogout} lang={lang} />
            )}
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div className={`nav-mobile-drawer${mobileOpen ? ' open' : ''}`}>
        <Link to="/"                className={mobileActiveCls('/')}>🏠 {T.home[lang]}</Link>
        <Link to="/chart/new"       className="nav-mobile-link">🔮 {T.cta[lang]}</Link>
        <Link to="/my-charts"       className={mobileActiveCls('/my-charts')}>☽ {T.charts[lang]}</Link>
        <Link to="/horoscope"       className={mobileActiveCls('/horoscope')}>♈ {T.horoscope[lang]}</Link>
        <Link to="/sade-sati"       className={mobileActiveCls('/sade-sati')}>♄ {T.sadeSati[lang]}</Link>
        <Link to="/doshas"          className={mobileActiveCls('/doshas')}>♂ {T.doshas[lang]}</Link>
        <Link to="/kundli-matching" className={mobileActiveCls('/kundli-matching')}>♥ {T.kundli[lang]}</Link>
        <Link to="/lal-kitab"       className={mobileActiveCls('/lal-kitab')}>📕 {T.lalKitab[lang]}</Link>
        <Link to="/destiny-chat"    className={mobileActiveCls('/destiny-chat')}>✨ {T.chat[lang]}</Link>
        <Link to="/numerology"      className={mobileActiveCls('/numerology')}>∑ {T.numeral[lang]}</Link>
        <Link to="/pricing"         className={mobileActiveCls('/pricing')}>💎 {T.pricing[lang]}</Link>

        <div className="nav-mobile-actions">
          <button style={{ ...s.langBtn, height: 40 }} onClick={toggleLang}>
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
