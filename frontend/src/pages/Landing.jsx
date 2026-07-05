import { Link, useNavigate } from 'react-router-dom'

const pillars = [
  { icon: '☽', title: 'Vedic Astrology', desc: 'Swiss Ephemeris precision. Natal chart, Vimshottari dasha, transits — computed to the second.',           to: '/chart/new',    live: true },
  { icon: '◈', title: 'Lal Kitab',       desc: 'Ancient remedies from the 1941 corpus. House map, Pucca Ghar planets, personalised remedy plan.',           to: '/chart/new',    live: true },
  { icon: '∑', title: 'Numerology',      desc: 'Pythagorean & Chaldean. Life Path, Destiny, Soul Urge, Personal Year, and partner compatibility.',           to: '/numerology',   live: true },
  { icon: '◎', title: 'Destiny Chat',    desc: 'Ask anything about your chart. Claude AI answers from your specific placements. Deep, personal answers.',    to: '/destiny-chat', live: true },
  { icon: '✋', title: 'Palmistry',       desc: 'Upload a palm photo. Life line, fate line and mounts read by AI. Integrated with your Vedic chart.',         to: '/palmistry',    live: false },
]

const steps = [
  { n: '01', label: 'Enter birth details', sub: 'Name, date, time, place' },
  { n: '02', label: 'Chart is computed', sub: 'Instant — Swiss Ephemeris precision' },
  { n: '03', label: 'Read your destiny', sub: 'Vedic + Lal Kitab + Numerology in one page' },
  { n: '04', label: 'Ask & explore', sub: 'Deep answers about your chart, anytime' },
]

const s = {
  hero: {
    textAlign: 'center', padding: '6rem 2rem 4rem',
    maxWidth: '780px', margin: '0 auto',
  },
  badge: {
    display: 'inline-block', border: '1px solid rgba(201,147,58,0.35)',
    borderRadius: '20px', padding: '0.3rem 1rem', fontSize: '0.8rem',
    color: '#C9933A', marginBottom: '1.5rem', letterSpacing: '1px',
  },
  h1: { fontFamily: "'Cinzel', serif", fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: '#C9933A', marginBottom: '1rem' },
  sub: { fontSize: '1.1rem', color: '#8B7B5E', maxWidth: '540px', margin: '0 auto 2.5rem', lineHeight: 1.7 },
  ctaRow: { display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' },
  section: { padding: '5rem 2rem', maxWidth: '1100px', margin: '0 auto' },
  sectionTitle: { fontFamily: "'Cinzel', serif", fontSize: '1.6rem', color: '#C9933A', textAlign: 'center', marginBottom: '0.5rem' },
  sectionSub: { textAlign: 'center', color: '#7A5E28', marginBottom: '3rem', fontSize: '0.95rem' },
  pillarsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1.25rem',
  },
  pillarCard: {
    background: '#13101E', border: '1px solid rgba(201,147,58,0.15)',
    borderRadius: '12px', padding: '1.75rem 1.5rem',
    transition: 'border-color 0.2s, transform 0.2s',
    position: 'relative', overflow: 'hidden',
    textDecoration: 'none', display: 'block',
  },
  pillarCardLive: { cursor: 'pointer' },
  pillarCardSoon: { cursor: 'default', opacity: 0.75 },
  pillarIcon:  { fontSize: '2rem', marginBottom: '1rem', color: '#C9933A' },
  pillarTitle: { fontFamily: "'Cinzel', serif", fontSize: '1rem', color: '#C9933A', marginBottom: '0.5rem' },
  pillarDesc:  { fontSize: '0.875rem', color: '#7A5E28', lineHeight: 1.65 },
  pillarBadge: {
    position: 'absolute', top: '0.9rem', right: '0.9rem',
    fontSize: '0.65rem', fontWeight: 700, letterSpacing: '1px',
    padding: '0.2rem 0.6rem', borderRadius: '10px',
    background: 'rgba(201,147,58,0.12)', color: '#C9933A',
    border: '1px solid rgba(201,147,58,0.25)',
  },
  pillarArrow: {
    position: 'absolute', bottom: '1rem', right: '1rem',
    color: 'rgba(201,147,58,0.5)', fontSize: '1rem',
  },
  stepsRow: { display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' },
  stepCard: {
    background: '#13101E', border: '1px solid rgba(201,147,58,0.15)',
    borderRadius: '12px', padding: '2rem 1.5rem', flex: '1 1 200px', maxWidth: '240px',
    textAlign: 'center',
  },
  stepNum: { fontFamily: "'Cinzel', serif", fontSize: '2.5rem', color: 'rgba(201,147,58,0.25)', marginBottom: '0.75rem' },
  stepLabel: { fontWeight: 600, color: '#E8B86D', marginBottom: '0.4rem' },
  stepSub: { fontSize: '0.82rem', color: '#5A4E38' },
  cta2: {
    textAlign: 'center', padding: '5rem 2rem',
    borderTop: '1px solid rgba(201,147,58,0.1)',
  },
}

export default function Landing() {
  const navigate = useNavigate()
  return (
    <>
      {/* Hero */}
      <div style={s.hero}>
        <span style={s.badge}>✦ ANCIENT WISDOM · MODERN PRECISION ✦</span>
        <h1 style={s.h1}>Know Your Destiny<br />Before It Finds You</h1>
        <p style={s.sub}>
          Vedic astrology, Lal Kitab, Palmistry & Numerology —
          all five wisdom systems, woven into one deeply personal reading.
          Instant. Private. Accurate.
        </p>
        <div style={s.ctaRow}>
          <Link to="/chart/new" className="btn-primary">Get Your Free Reading</Link>
          <Link to="/my-charts" className="btn-outline">View Saved Charts</Link>
        </div>
      </div>

      {/* Five Pillars */}
      <section id="pillars" style={s.section}>
        <h2 style={s.sectionTitle}>Everything the Universe Has to Say About You</h2>
        <p style={s.sectionSub}>Your reading weaves together five ancient wisdom traditions — the most complete picture of your life, written in the stars, your hand, and your name.</p>
        <div style={s.pillarsGrid}>
          {pillars.map(p => (
            <div key={p.title}
              style={{ ...s.pillarCard, ...(p.live ? s.pillarCardLive : s.pillarCardSoon) }}
              onClick={() => p.live && p.to && navigate(p.to)}
              onMouseEnter={e => {
                if (!p.live) return
                e.currentTarget.style.borderColor = 'rgba(201,147,58,0.5)'
                e.currentTarget.style.transform = 'translateY(-3px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(201,147,58,0.15)'
                e.currentTarget.style.transform = 'none'
              }}>
              {!p.live && <span style={s.pillarBadge}>COMING SOON</span>}
              <div style={s.pillarIcon}>{p.icon}</div>
              <div style={s.pillarTitle}>{p.title}</div>
              <p style={s.pillarDesc}>{p.desc}</p>
              {p.live && <span style={s.pillarArrow}>→</span>}
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ ...s.section, borderTop: '1px solid rgba(201,147,58,0.08)' }}>
        <h2 style={s.sectionTitle}>How It Works</h2>
        <p style={s.sectionSub}>From birth details to full cosmic reading in under 3 seconds.</p>
        <div style={s.stepsRow}>
          {steps.map(st => (
            <div key={st.n} style={s.stepCard}>
              <div style={s.stepNum}>{st.n}</div>
              <div style={s.stepLabel}>{st.label}</div>
              <div style={s.stepSub}>{st.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Bottom */}
      <div style={s.cta2}>
        <h2 style={{ ...s.sectionTitle, marginBottom: '1rem' }}>Ready to Read Your Stars?</h2>
        <p style={{ color: '#7A5E28', marginBottom: '2rem' }}>Free natal chart. No signup required.</p>
        <Link to="/chart/new" className="btn-primary" style={{ fontSize: '1rem', padding: '0.875rem 2.5rem' }}>
          Start Your Reading →
        </Link>
      </div>
    </>
  )
}
