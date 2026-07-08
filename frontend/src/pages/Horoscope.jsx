import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getTodayHoroscopes } from '../hooks/useApi'

// ── Constants ──────────────────────────────────────────────────────────────────

const RASHIS = [
  { en: 'Aries',       hi: 'मेष',      symbol: '♈', lord: 'Mars'    },
  { en: 'Taurus',      hi: 'वृषभ',     symbol: '♉', lord: 'Venus'   },
  { en: 'Gemini',      hi: 'मिथुन',    symbol: '♊', lord: 'Mercury' },
  { en: 'Cancer',      hi: 'कर्क',     symbol: '♋', lord: 'Moon'    },
  { en: 'Leo',         hi: 'सिंह',     symbol: '♌', lord: 'Sun'     },
  { en: 'Virgo',       hi: 'कन्या',    symbol: '♍', lord: 'Mercury' },
  { en: 'Libra',       hi: 'तुला',     symbol: '♎', lord: 'Venus'   },
  { en: 'Scorpio',     hi: 'वृश्चिक',  symbol: '♏', lord: 'Mars'    },
  { en: 'Sagittarius', hi: 'धनु',      symbol: '♐', lord: 'Jupiter' },
  { en: 'Capricorn',   hi: 'मकर',      symbol: '♑', lord: 'Saturn'  },
  { en: 'Aquarius',    hi: 'कुम्भ',    symbol: '♒', lord: 'Saturn'  },
  { en: 'Pisces',      hi: 'मीन',      symbol: '♓', lord: 'Jupiter' },
]

const GOLD = '#DFA84F'
const GOLD_L = '#F2CB84'
const DARK = '#05050f'

// ── Sub-components ─────────────────────────────────────────────────────────────

function StarRow({ label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '2px', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ color: GOLD, fontSize: '1rem', letterSpacing: '2px' }}>
        {'★'.repeat(value)}{'☆'.repeat(5 - value)}
      </span>
    </div>
  )
}

function LuckyPill({ label, value, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', flex: 1 }}>
      <div style={{ fontSize: '0.62rem', color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '2px', textTransform: 'uppercase' }}>{label}</div>
      <div style={{
        background: color ? `${color}22` : 'var(--bg-elevated)',
        border: `1px solid ${color || 'var(--border)'}`,
        borderRadius: 999,
        padding: '0.3rem 0.85rem',
        fontSize: '0.82rem',
        fontWeight: 600,
        color: color || 'var(--text-primary)',
        whiteSpace: 'nowrap',
      }}>{value}</div>
    </div>
  )
}

function ReadingBlock({ title, text }) {
  if (!text) return null
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ fontSize: '0.66rem', color: GOLD, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '0.4rem', fontFamily: "'JetBrains Mono', monospace" }}>{title}</div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.75, margin: 0 }}>{text}</p>
    </div>
  )
}

function HoroscopeDetail({ data }) {
  const { reading, ratings, mood, lucky_number, lucky_color, lucky_day, transits_snapshot } = data

  const colorMap = {
    Orange: '#E07B39', White: 'rgba(255,255,255,0.8)', Red: '#E53935',
    Green: '#43A047', Yellow: '#FDD835', Pink: '#E91E63', Blue: '#1E88E5',
  }
  const luckyColorHex = colorMap[lucky_color] || GOLD

  return (
    <div>
      {/* Mood + Lucky strip */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <LuckyPill label="Mood"         value={mood}            color={GOLD} />
        <LuckyPill label="Lucky Number" value={`#${lucky_number}`} color={null} />
        <LuckyPill label="Lucky Color"  value={lucky_color}     color={luckyColorHex} />
        <LuckyPill label="Lucky Day"    value={lucky_day}       color={null} />
      </div>

      {/* Star ratings */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: '1rem 1.2rem', marginBottom: '1.5rem', backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)' }}>
        <StarRow label="Love & Relationships" value={ratings.love}   />
        <StarRow label="Career & Work"        value={ratings.career} />
        <StarRow label="Finance & Money"      value={ratings.money}  />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem' }}>
          <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '2px', textTransform: 'uppercase' }}>Overall Day</span>
          <span style={{ color: GOLD_L, fontSize: '1.05rem', letterSpacing: '2px' }}>
            {'★'.repeat(ratings.overall)}{'☆'.repeat(5 - ratings.overall)}
          </span>
        </div>
      </div>

      {/* Reading text */}
      <div style={{ marginBottom: '1.5rem' }}>
        <ReadingBlock title="Today's Insight"   text={reading.opening}  />
        <ReadingBlock title="Career & Work"      text={reading.career}   />
        <ReadingBlock title="Love & Relationships" text={reading.love}   />
        <ReadingBlock title="Finance & Money"    text={reading.money}    />
        <ReadingBlock title="General Guidance"   text={reading.general}  />
        {reading.sade_note && (
          <div style={{ background: 'rgba(223,168,79,0.08)', border: '1px solid rgba(223,168,79,0.3)', borderRadius: 10, padding: '0.85rem 1rem', marginTop: '0.5rem' }}>
            <div style={{ fontSize: '0.66rem', color: GOLD, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '0.35rem', fontFamily: "'JetBrains Mono', monospace" }}>⚠ Saturn Note</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.7, margin: 0 }}>{reading.sade_note}</p>
            <Link to="/sade-sati" style={{ color: GOLD, fontSize: '0.8rem', textDecoration: 'none', display: 'inline-block', marginTop: '0.5rem', fontWeight: 600 }}>Run your Sade Sati report →</Link>
          </div>
        )}
        {reading.retro?.length > 0 && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            {reading.retro.map((r, i) => <div key={i} style={{ marginBottom: '0.2rem' }}>↩ {r}</div>)}
          </div>
        )}
      </div>

      {/* Transit snapshot */}
      {transits_snapshot && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <div style={{ fontSize: '0.62rem', color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.6rem' }}>Today's Planet Positions</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {Object.entries(transits_snapshot).map(([planet, sign]) => (
              <div key={planet} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 999, padding: '0.28rem 0.7rem', fontSize: '0.76rem' }}>
                <span style={{ color: 'var(--text-dim)' }}>{planet}</span>
                <span style={{ color: GOLD, marginLeft: '0.35rem' }}>{sign}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function Horoscope() {
  const [allData, setAllData]       = useState(null)
  const [selected, setSelected]     = useState(null)   // rashi_index
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')

  // Detect today's date for display
  const todayStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  useEffect(() => {
    async function load() {
      try {
        const res = await getTodayHoroscopes()
        setAllData(res.data)     // array of 12
        // Default: pre-select first rashi
        setSelected(0)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const selectedData = allData && selected !== null ? allData[selected] : null

  // ── Styles ─────────────────────────────────────────────────────────────────

  const page = {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '2rem 1.5rem 4rem',
  }

  const headerArea = {
    textAlign: 'center',
    paddingBottom: '2rem',
    borderBottom: '1px solid var(--border)',
    marginBottom: '2.5rem',
  }

  const grid = {
    display: 'grid',
    gridTemplateColumns: '260px 1fr',
    gap: '2rem',
    alignItems: 'start',
  }

  return (
    <div style={page}>
      {/* Header */}
      <div className="bh-fade-up" style={headerArea}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.66rem', color: 'var(--gold)', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
          Today · Rashi Rashifal
        </div>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(1.9rem, 4vw, 2.8rem)', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: '0 0 0.4rem' }}>
          Daily Horoscope
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 0.5rem' }}>
          Transit-based · Swiss Ephemeris · Sidereal Lahiri
        </p>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace" }}>{todayStr}</div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
          <div style={{ fontSize: '1.8rem', marginBottom: '0.75rem', animation: 'spin 2s linear infinite', display: 'inline-block', color: 'var(--gold)' }}>✦</div>
          <div>Computing today's transits…</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(229,57,53,0.1)', border: '1px solid rgba(229,57,53,0.3)', borderRadius: 10, padding: '1rem 1.2rem', color: '#ef9a9a', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {allData && (
        <div className="horoscope-grid bh-fade-up-1" style={grid}>
          {/* Left: sign selector */}
          <div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.8rem' }}>Select Your Rashi</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {RASHIS.map((r, i) => {
                const isActive = selected === i
                const d = allData[i]
                return (
                  <button
                    key={r.en}
                    onClick={() => setSelected(i)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      background: isActive ? `${GOLD}18` : 'transparent',
                      border: `1px solid ${isActive ? GOLD : 'var(--border)'}`,
                      borderRadius: 10,
                      padding: '0.55rem 0.8rem',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{r.symbol}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: isActive ? GOLD : 'var(--text-primary)' }}>{r.en}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{r.hi}</div>
                    </div>
                    {d && (
                      <span style={{ fontSize: '0.72rem', color: GOLD_L, letterSpacing: '1px' }}>
                        {'★'.repeat(d.ratings.overall)}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* CTA */}
            <div style={{ marginTop: '1.5rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 18, padding: '1rem 1.1rem', backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)' }}>
              <div style={{ fontSize: '0.66rem', color: GOLD, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Know your Rashi?</div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: 1.6, margin: '0 0 0.75rem' }}>
                Your Rashi is your Moon sign — not your Sun sign. Get your precise chart to find out.
              </p>
              <Link to="/chart/new" style={{ color: GOLD, fontSize: '0.8rem', textDecoration: 'none', fontWeight: 600 }}>
                Compute free chart →
              </Link>
            </div>
          </div>

          {/* Right: detail */}
          {selectedData && (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: '1.75rem 2rem', backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)', boxShadow: 'var(--shadow-card)' }}>
              {/* Rashi header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: `radial-gradient(circle, ${GOLD}33, ${GOLD}11)`,
                  border: `2px solid ${GOLD}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.9rem', flexShrink: 0,
                }}>
                  {RASHIS[selectedData.rashi_index]?.symbol}
                </div>
                <div>
                  <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: '1.4rem', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: '0 0 0.1rem' }}>{selectedData.rashi}</h2>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>{selectedData.rashi_hi} · Lord: {selectedData.lord}</div>
                </div>
              </div>

              <HoroscopeDetail data={selectedData} />
            </div>
          )}
        </div>
      )}

      {/* Mobile stack CSS */}
      <style>{`
        @media (max-width: 700px) {
          .horoscope-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
