import { Link } from 'react-router-dom'
import LogoMark from './LogoMark'

const COLS = [
  {
    title: 'Readings',
    links: [
      { label: 'Free Kundali',   to: '/chart/new' },
      { label: 'Daily Horoscope', to: '/horoscope' },
      { label: 'Kundli Matching', to: '/kundli-matching' },
      { label: 'Destiny Chat',    to: '/destiny-chat' },
    ],
  },
  {
    title: 'Tools',
    links: [
      { label: 'Sade Sati',  to: '/sade-sati' },
      { label: 'Doshas',     to: '/doshas' },
      { label: 'Lal Kitab',  to: '/lal-kitab' },
      { label: 'Numerology', to: '/numerology' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'My Charts', to: '/my-charts' },
      { label: 'Pricing',   to: '/pricing' },
      { label: 'Sign In',   to: '/login' },
    ],
  },
]

const s = {
  footer: {
    position: 'relative',
    borderTop: '1px solid var(--border)',
    background: 'linear-gradient(180deg, transparent, var(--gold-pale))',
    padding: '3.5rem 2rem 2rem',
    marginTop: '4rem',
  },
  inner: {
    maxWidth: 1200, margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1.6fr repeat(3, 1fr)',
    gap: '2.5rem',
  },
  brand: { display: 'flex', alignItems: 'center', gap: '0.7rem', textDecoration: 'none', marginBottom: '1rem' },
  brandName: {
    fontFamily: 'var(--font-brand)', fontSize: '1.15rem', fontWeight: 700,
    color: 'var(--gold)', letterSpacing: '4px',
  },
  tagline: { color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.7, maxWidth: 300, margin: 0 },
  badges: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1.2rem' },
  badge: {
    fontFamily: 'var(--font-mono)', fontSize: '0.6rem', letterSpacing: '1.5px',
    textTransform: 'uppercase', color: 'var(--text-dim)',
    border: '1px solid var(--border)', borderRadius: 999, padding: '0.3rem 0.75rem',
  },
  colTitle: {
    fontFamily: 'var(--font-mono)', fontSize: '0.64rem', fontWeight: 600,
    letterSpacing: '2.5px', textTransform: 'uppercase',
    color: 'var(--gold)', marginBottom: '1rem',
  },
  colLink: {
    display: 'block', color: 'var(--text-muted)', textDecoration: 'none',
    fontSize: '0.86rem', padding: '0.3rem 0', transition: 'color 0.2s',
  },
  bottom: {
    maxWidth: 1200, margin: '2.5rem auto 0',
    borderTop: '1px solid var(--border-soft)', paddingTop: '1.4rem',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    flexWrap: 'wrap', gap: '0.8rem',
  },
  copy: { color: 'var(--text-dim)', fontSize: '0.78rem', margin: 0 },
  disc: { color: 'var(--text-dim)', fontSize: '0.72rem', margin: 0, opacity: 0.8 },
}

export default function Footer() {
  return (
    <footer style={s.footer}>
      <div style={s.inner} className="bh-footer-grid">
        <div>
          <Link to="/" style={s.brand}>
            <LogoMark size={34} />
            <span style={s.brandName}>BHAGYA</span>
          </Link>
          <p style={s.tagline}>
            Five thousand years of Jyotisha, computed to the arc-second.
            Swiss Ephemeris precision — no human astrologers, pure math + AI.
          </p>
          <div style={s.badges}>
            {['Swiss Ephemeris', 'Lahiri Ayanamsa', 'AI-Native'].map(b => (
              <span key={b} style={s.badge}>{b}</span>
            ))}
          </div>
        </div>

        {COLS.map(col => (
          <div key={col.title}>
            <div style={s.colTitle}>{col.title}</div>
            {col.links.map(l => (
              <Link key={l.label} to={l.to} style={s.colLink}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--gold)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >{l.label}</Link>
            ))}
          </div>
        ))}
      </div>

      <div style={s.bottom}>
        <p style={s.copy}>© {new Date().getFullYear()} Bhagya · Ancient wisdom, modern precision</p>
        <p style={s.disc}>For spiritual guidance purposes only. Not a substitute for professional advice.</p>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .bh-footer-grid { grid-template-columns: 1fr 1fr !important; }
          .bh-footer-grid > div:first-child { grid-column: 1 / -1; }
        }
      `}</style>
    </footer>
  )
}
