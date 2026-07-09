import { useState } from 'react'
import { Link } from 'react-router-dom'
import { computeKP } from '../hooks/useApi'
import CitySearch from '../components/CitySearch'

const GOLD   = '#DFA84F'
const GOLD_L = '#F2CB84'
const VIO    = '#8B6FE8'

// ── Static maps ────────────────────────────────────────────────────────────────

const PLANET_COLOR = {
  Sun: '#E57C3A', Moon: '#B0BEC5', Mars: '#E53935', Mercury: '#43A047',
  Jupiter: '#F9A825', Venus: '#90CAF9', Saturn: '#3949AB',
  Rahu: '#795548', Ketu: '#8D6E63',
}

const PLANET_SYMBOL = {
  Sun: '&#9737;', Moon: '&#9789;', Mars: '&#9794;', Mercury: '&#9791;',
  Jupiter: '&#9795;', Venus: '&#9792;', Saturn: '&#9796;',
  Rahu: '&#9738;', Ketu: '&#9739;',
}

const PLANET_ORDER = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu']

// ── Styles ─────────────────────────────────────────────────────────────────────

const inp = {
  width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)',
  borderRadius: 10, color: 'var(--text-primary)', padding: '0.8rem 1rem',
  fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
}
const lbl = {
  color: 'var(--text-dim)', fontSize: '0.68rem', fontWeight: 500,
  fontFamily: "'JetBrains Mono', monospace",
  letterSpacing: '2px', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem',
}
const card = {
  background: 'var(--bg-card)', border: '1px solid var(--border)',
  borderRadius: 18, padding: '1.4rem 1.6rem', marginBottom: '1rem',
  backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)',
  boxShadow: 'var(--shadow-card)',
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionTitle({ children, color }) {
  return (
    <div style={{
      fontFamily: "'JetBrains Mono', monospace", fontSize: '0.64rem',
      color: color || GOLD, letterSpacing: '2.5px', textTransform: 'uppercase',
      marginBottom: '0.85rem',
    }}>{children}</div>
  )
}

function InfoChip({ label, value, color, big }) {
  return (
    <div style={{
      background: `${color || GOLD}0D`, border: `1px solid ${color || GOLD}28`,
      borderRadius: 12, padding: '0.65rem 0.9rem',
    }}>
      <div style={{
        fontSize: '0.58rem', color: color || GOLD, letterSpacing: '1.5px',
        textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", marginBottom: '0.2rem',
      }}>{label}</div>
      <div style={{
        fontSize: big ? '1.05rem' : '0.88rem', fontWeight: big ? 700 : 600,
        color: 'var(--text-primary)',
      }}>{value}</div>
    </div>
  )
}

function PlanetChip({ name }) {
  const color = PLANET_COLOR[name] || GOLD
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
      background: `${color}15`, border: `1px solid ${color}30`,
      borderRadius: 999, padding: '0.3rem 0.75rem',
      fontSize: '0.78rem', fontWeight: 600, color,
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      <span dangerouslySetInnerHTML={{ __html: PLANET_SYMBOL[name] || '' }} />
      {name}
    </span>
  )
}

// ── Result panel ───────────────────────────────────────────────────────────────

function ResultPanel({ data }) {
  const { lagna, planets, cusps, significators, ruling_planets } = data
  const [accordionOpen, setAccordionOpen] = useState(false)

  const lagnaSubLordColor = PLANET_COLOR[lagna.sub_lord] || GOLD

  return (
    <div>

      {/* 1 — Lagna KP Banner */}
      <div style={{
        ...card,
        background: `linear-gradient(135deg, rgba(223,168,79,0.09), rgba(139,111,232,0.05))`,
        border: `1px solid ${GOLD}32`,
      }}>
        <SectionTitle>&#9733; KP Lagna &mdash; Ascendant at Birth</SectionTitle>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <InfoChip label="Sign" value={lagna.sign} color={GOLD} />
          <InfoChip label="Degree" value={`${lagna.degree.toFixed(2)}°`} color={GOLD} />
          <InfoChip label="Nakshatra" value={lagna.nakshatra} color={VIO} />
          <InfoChip label="Star Lord" value={lagna.star_lord} color={PLANET_COLOR[lagna.star_lord] || GOLD} />
        </div>

        {/* Sub-lord callout */}
        <div style={{
          background: `${lagnaSubLordColor}12`, border: `1px solid ${lagnaSubLordColor}35`,
          borderRadius: 14, padding: '0.9rem 1.1rem',
          display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
        }}>
          <div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem',
              color: lagnaSubLordColor, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.25rem',
            }}>
              Sub-Lord of Lagna &mdash; The Key Planet
            </div>
            <div style={{
              fontFamily: "'Fraunces', serif", fontSize: 'clamp(1.4rem, 3vw, 1.8rem)',
              fontWeight: 700, color: lagnaSubLordColor, lineHeight: 1.1,
            }}>
              {lagna.sub_lord}
            </div>
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.65, maxWidth: '380px' }}>
            In KP astrology, the <strong style={{ color: lagnaSubLordColor }}>sub-lord of the Lagna cusp</strong> is the single most decisive planet for physical constitution, personality expression, and the overall direction of the chart.
          </div>
        </div>
      </div>

      {/* 2 — Ruling Planets strip */}
      {ruling_planets && ruling_planets.length > 0 && (
        <div style={{ ...card, padding: '1.1rem 1.4rem' }}>
          <SectionTitle>KP Ruling Planets &mdash; Query Time</SectionTitle>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {ruling_planets.map(p => <PlanetChip key={p} name={p} />)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.65rem', lineHeight: 1.6 }}>
            The planets that rule the ascendant, moon sign, star of moon, and current hora at query time. KP practitioners use these as a timing filter for event prediction.
          </div>
        </div>
      )}

      {/* 3 — Planet Table */}
      <div style={card}>
        <SectionTitle>Graha Positions &mdash; KP Sub-Lords</SectionTitle>

        {/* Header row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '130px 90px 60px 110px 90px 90px 42px',
          gap: '0.4rem',
          padding: '0 0.6rem 0.5rem',
          borderBottom: '1px solid var(--border)',
          marginBottom: '0.4rem',
        }}>
          {['Planet', 'Sign', '°', 'Nakshatra', 'Star Lord', 'Sub Lord', 'H'].map(h => (
            <div key={h} style={{
              fontSize: '0.58rem', color: 'var(--text-dim)',
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1.5px', textTransform: 'uppercase',
            }}>{h}</div>
          ))}
        </div>

        {PLANET_ORDER.map(pname => {
          const p = planets.find(x => x.planet === pname)
          if (!p) return null
          const col = PLANET_COLOR[p.planet] || GOLD
          const subCol = PLANET_COLOR[p.sub_lord] || GOLD
          return (
            <div key={p.planet} style={{
              display: 'grid',
              gridTemplateColumns: '130px 90px 60px 110px 90px 90px 42px',
              gap: '0.4rem', alignItems: 'center',
              padding: '0.55rem 0.6rem', borderRadius: 10,
              background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border)',
              marginBottom: '0.3rem',
            }}>
              {/* Planet */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ color: col, fontSize: '1rem' }} dangerouslySetInnerHTML={{ __html: PLANET_SYMBOL[p.planet] || '' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: col }}>{p.planet}</span>
              </div>
              {/* Sign */}
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.sign}</div>
              {/* Degree */}
              <div style={{
                fontSize: '0.68rem', color: 'var(--text-dim)',
                fontFamily: "'JetBrains Mono', monospace",
              }}>{p.degree.toFixed(2)}&deg;</div>
              {/* Nakshatra */}
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{p.nakshatra}</div>
              {/* Star Lord */}
              <div style={{ fontSize: '0.75rem', color: PLANET_COLOR[p.star_lord] || 'var(--text-muted)' }}>{p.star_lord}</div>
              {/* Sub Lord — highlighted */}
              <div style={{
                fontSize: '0.75rem', fontWeight: 600, color: subCol,
                background: `${subCol}12`, border: `1px solid ${subCol}28`,
                borderRadius: 7, padding: '0.2rem 0.5rem', textAlign: 'center',
              }}>{p.sub_lord}</div>
              {/* House */}
              <div style={{
                textAlign: 'center', fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.72rem', fontWeight: 700, color: GOLD,
                background: `${GOLD}12`, border: `1px solid ${GOLD}22`,
                borderRadius: 7, padding: '0.2rem 0.35rem',
              }}>{p.house}</div>
            </div>
          )
        })}
      </div>

      {/* 4 — Cuspal Sub-Lords Table */}
      <div style={card}>
        <SectionTitle>Cuspal Sub-Lords &mdash; The Heart of KP</SectionTitle>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.9rem', lineHeight: 1.6 }}>
          The sub-lord of each cusp is the final arbiter of events related to that house. If the sub-lord is the significator of a positive house, the house promise is fulfilled.
        </div>

        {/* Header row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '48px 80px 110px 90px 100px 1fr',
          gap: '0.5rem',
          padding: '0 0.6rem 0.5rem',
          borderBottom: '1px solid var(--border)',
          marginBottom: '0.4rem',
        }}>
          {['H', 'Sign', 'Nakshatra', 'Star Lord', 'Sub Lord', 'Significators'].map(h => (
            <div key={h} style={{
              fontSize: '0.58rem', color: 'var(--text-dim)',
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1.5px', textTransform: 'uppercase',
            }}>{h}</div>
          ))}
        </div>

        {(cusps || []).map(cusp => {
          const subCol = PLANET_COLOR[cusp.sub_lord] || GOLD
          const sigs = cusp.significators || []
          return (
            <div key={cusp.house} style={{
              display: 'grid',
              gridTemplateColumns: '48px 80px 110px 90px 100px 1fr',
              gap: '0.5rem', alignItems: 'center',
              padding: '0.52rem 0.6rem', borderRadius: 10,
              background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border)',
              marginBottom: '0.3rem',
            }}>
              {/* House */}
              <div style={{
                textAlign: 'center', fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.78rem', fontWeight: 700, color: GOLD,
                background: `${GOLD}12`, border: `1px solid ${GOLD}22`,
                borderRadius: 7, padding: '0.2rem 0.3rem',
              }}>{cusp.house}</div>
              {/* Sign */}
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{cusp.sign}</div>
              {/* Nakshatra */}
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{cusp.nakshatra}</div>
              {/* Star Lord */}
              <div style={{ fontSize: '0.74rem', color: PLANET_COLOR[cusp.star_lord] || 'var(--text-muted)' }}>{cusp.star_lord}</div>
              {/* Sub Lord — gold highlight */}
              <div style={{
                fontSize: '0.76rem', fontWeight: 700, color: subCol,
                background: `${subCol}15`, border: `1px solid ${subCol}35`,
                borderRadius: 8, padding: '0.22rem 0.55rem', textAlign: 'center',
              }}>{cusp.sub_lord}</div>
              {/* Significators */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                {sigs.map(s => (
                  <span key={s} style={{
                    fontSize: '0.68rem', fontWeight: 600,
                    color: PLANET_COLOR[s] || 'var(--text-muted)',
                    background: `${PLANET_COLOR[s] || GOLD}12`,
                    border: `1px solid ${PLANET_COLOR[s] || GOLD}22`,
                    borderRadius: 5, padding: '0.12rem 0.4rem',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>{s}</span>
                ))}
                {sigs.length === 0 && <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>—</span>}
              </div>
            </div>
          )
        })}
      </div>

      {/* 5 — Significators Panel */}
      {significators && (
        <div style={card}>
          <SectionTitle>Significators Panel &mdash; All 12 Houses</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '0.7rem' }}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(h => {
              const sigs = significators[String(h)] || []
              return (
                <div key={h} style={{
                  background: 'rgba(255,255,255,0.028)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '0.75rem 0.9rem',
                }}>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem',
                    color: GOLD, letterSpacing: '2px', textTransform: 'uppercase',
                    marginBottom: '0.5rem',
                  }}>House {h}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {sigs.length === 0 && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>None</span>
                    )}
                    {sigs.map(s => {
                      const col = PLANET_COLOR[s] || GOLD
                      return (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <span style={{
                            width: 7, height: 7, borderRadius: '50%',
                            background: col, display: 'inline-block', flexShrink: 0,
                          }} />
                          <span style={{ fontSize: '0.76rem', color: col, fontWeight: 600 }}>{s}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 6 — About KP accordion */}
      <div style={{ ...card, padding: '1rem 1.3rem' }}>
        <button
          onClick={() => setAccordionOpen(o => !o)}
          style={{
            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: 0,
          }}
        >
          <SectionTitle>About the KP System</SectionTitle>
          <span style={{
            fontSize: '0.75rem', color: GOLD, fontFamily: "'JetBrains Mono', monospace",
            transition: 'transform 0.2s', display: 'inline-block',
            transform: accordionOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}>&#9650;</span>
        </button>
        {accordionOpen && (
          <div style={{ marginTop: '0.6rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', lineHeight: 1.8, margin: '0 0 0.8rem' }}>
              The <strong style={{ color: GOLD_L }}>Krishnamurti Paddhati (KP)</strong> system, developed by K.S. Krishnamurti, refines classical Jyotish by subdividing each nakshatra into sub-sections proportional to the Vimshottari dasha periods. Each zodiac sign (30°) contains 2–3 nakshatras; each nakshatra (13°20') is divided into 9 sub-lords whose arc-lengths mirror the dasha sequence starting from the nakshatra lord. This creates a finer grid of <strong style={{ color: GOLD_L }}>2193 sub-divisions</strong> within the zodiac, enabling precise event-timing analysis.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', lineHeight: 1.8, margin: 0 }}>
              The <strong style={{ color: GOLD_L }}>sub-lord of a house cusp</strong> is the final authority on whether that house's promise is activated. If the sub-lord is a significator of a favourable house, the event materialises; if it owns or occupies an adverse house, the promise is blocked or delayed. The <strong style={{ color: GOLD_L }}>Ruling Planets</strong> — derived from the ascendant lord, moon sign lord, moon's star lord, and the hora lord at query time — serve as a real-time timing filter, confirming which dashas and transits are most operative at any given moment.
            </p>
          </div>
        )}
      </div>

      {/* CTA */}
      <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: '0.66rem',
            color: GOLD, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '0.2rem',
          }}>
            Explore your natal chart too
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', margin: 0 }}>
            Your natal Kundali provides the base positions that KP analysis depends on &mdash; dashas, ashtakavarga, and yogas complete the picture.
          </p>
        </div>
        <Link to='/chart/new' style={{
          background: 'linear-gradient(135deg,#F2CB84 0%,#DFA84F 42%,#A8752B 100%)',
          color: '#1C1205', fontSize: '0.82rem', fontWeight: 600,
          padding: '0.65rem 1.5rem', borderRadius: 999,
          boxShadow: '0 8px 28px rgba(223,168,79,0.28)', textDecoration: 'none',
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>Free Kundali &rarr;</Link>
      </div>

    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function KPSystem() {
  const [dob,     setDob]     = useState('')
  const [tob,     setTob]     = useState('12:00')
  const [city,    setCity]    = useState('')
  const [lat,     setLat]     = useState('')
  const [lon,     setLon]     = useState('')
  const [tz,      setTz]      = useState('Asia/Kolkata')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [result,  setResult]  = useState(null)

  function pickCity(lt, ln, timezone, name) {
    setCity(name)
    setLat(String(lt))
    setLon(String(ln))
    setTz(timezone)
  }

  async function compute() {
    if (!dob || !lat || !lon) {
      setError('Please fill date of birth and select a birth location.')
      return
    }
    setError('')
    setLoading(true)
    setResult(null)
    try {
      const payload = {
        dob,
        tob,
        timezone: tz,
        lat: parseFloat(lat),
        lon: parseFloat(lon),
      }
      const res = await computeKP(payload)
      setResult(res.data)
      setTimeout(() => document.getElementById('kp-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch (e) {
      setError(e.message || 'Computation failed. Please check your inputs.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>

      {/* Header */}
      <div className="bh-fade-up" style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: '0.66rem',
          color: GOLD, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '0.5rem',
        }}>
          Vedic Astrology &middot; Guru Tier &middot; Krishnamurti Paddhati
        </div>
        <h1 style={{
          fontFamily: "'Fraunces', serif", fontSize: 'clamp(1.9rem, 4vw, 2.8rem)',
          fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: '0 0 0.5rem',
        }}>
          KP System
        </h1>
        <p style={{
          color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.7,
          maxWidth: '530px', margin: '0 auto',
        }}>
          Krishnamurti Paddhati &mdash; the most precise branch of Jyotish. Sub-lord analysis of every cusp and planet reveals exact event timing, surpassing traditional sign-based methods.
        </p>
      </div>

      {/* Form */}
      <div className="bh-fade-up-1" style={card}>
        <SectionTitle>Birth Details</SectionTitle>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={lbl}>Date of Birth *</label>
            <input type="date" value={dob} onChange={e => setDob(e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>Time of Birth *</label>
            <input type="time" value={tob} onChange={e => setTob(e.target.value)} style={inp} />
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <CitySearch
            onSelect={pickCity}
            label="Birth City (auto-fills lat / lon / timezone)"
            placeholder="Search any city worldwide…"
            labelStyle={{
              display: 'block', fontSize: '0.75rem', fontWeight: 600,
              color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '0.35rem',
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div>
            <label style={lbl}>Latitude *</label>
            <input
              type="number" step="0.0001" value={lat}
              onChange={e => setLat(e.target.value)}
              placeholder="e.g. 26.4499"
              style={inp}
            />
          </div>
          <div>
            <label style={lbl}>Longitude *</label>
            <input
              type="number" step="0.0001" value={lon}
              onChange={e => setLon(e.target.value)}
              placeholder="e.g. 80.3319"
              style={inp}
            />
          </div>
          <div>
            <label style={lbl}>Timezone</label>
            <input
              type="text" value={tz}
              onChange={e => setTz(e.target.value)}
              placeholder="Asia/Kolkata"
              style={inp}
            />
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(229,57,53,0.08)', border: '1px solid rgba(229,57,53,0.3)',
            borderRadius: 10, padding: '0.7rem 0.9rem',
            marginBottom: '1rem', fontSize: '0.82rem', color: '#EF9A9A',
          }}>
            {error}
          </div>
        )}

        <button
          onClick={compute}
          disabled={loading}
          style={{
            width: '100%',
            background: loading
              ? 'rgba(223,168,79,0.3)'
              : 'linear-gradient(135deg,#F2CB84 0%,#DFA84F 42%,#A8752B 100%)',
            color: '#1C1205', border: 'none', borderRadius: 999, padding: '0.9rem',
            fontSize: '0.92rem', fontWeight: 600, letterSpacing: '0.02em',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 8px 28px rgba(223,168,79,0.28)',
            opacity: loading ? 0.7 : 1,
            transition: 'opacity 0.6s ease-in-out',
          }}
        >
          {loading ? 'Computing KP Chart…' : 'Compute KP Chart ✶'}
        </button>
      </div>

      {/* Info box — shown only when no result */}
      {!result && !loading && (
        <div className="bh-fade-up-2" style={{ ...card, padding: '1rem 1.3rem' }}>
          <SectionTitle>About the KP System</SectionTitle>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', lineHeight: 1.8, margin: 0 }}>
            The <strong style={{ color: GOLD_L }}>Krishnamurti Paddhati</strong> is more precise than traditional Jyotish because it analyses the <strong style={{ color: GOLD_L }}>sub-lord</strong> of each house cusp and planet, not just the sign or nakshatra lord. Developed by K.S. Krishnamurti in the mid-20th century, KP subdivides each nakshatra into nine sub-sections proportional to the Vimshottari dasha sequence. The sub-lord of a cusp determines whether that house&rsquo;s events materialise. <strong style={{ color: GOLD_L }}>Ruling planets</strong> captured at the exact moment of query act as a real-time timing filter, helping pinpoint when events in a particular house will unfold.
          </p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div id="kp-result">
          <ResultPanel data={result} />
        </div>
      )}

    </div>
  )
}
