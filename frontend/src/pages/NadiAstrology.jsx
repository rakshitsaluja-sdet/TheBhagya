import { useState } from 'react'
import { Link } from 'react-router-dom'
import { computeNadi } from '../hooks/useApi'
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

const DIGNITY_COLOR = {
  exalted:    GOLD,
  own:        VIO,
  debilitated:'#E53935',
  friend:     '#43A047',
  enemy:      '#FF7043',
  neutral:    '#78909C',
}

const AREA_COLOR = {
  Career:        GOLD,
  Relationships: VIO,
  Wealth:        '#43A047',
  Spirituality:  VIO,
  Health:        '#E53935',
  Travel:        '#42A5F5',
  Family:        '#F48FB1',
}

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

function DignityBadge({ dignity }) {
  if (!dignity) return null
  const col = DIGNITY_COLOR[dignity.toLowerCase()] || DIGNITY_COLOR.neutral
  return (
    <span style={{
      fontSize: '0.62rem', fontWeight: 600, color: col,
      background: `${col}18`, border: `1px solid ${col}35`,
      borderRadius: 6, padding: '0.18rem 0.5rem',
      fontFamily: "'JetBrains Mono', monospace", textTransform: 'capitalize',
    }}>{dignity}</span>
  )
}

// ── Result panel ───────────────────────────────────────────────────────────────

function ResultPanel({ data }) {
  const { lagna, planets, nadi_yogas, life_themes, nadi_predictions } = data
  const [accordionOpen, setAccordionOpen] = useState(false)

  return (
    <div>

      {/* 1 — Lagna Banner */}
      <div style={{
        ...card,
        background: 'linear-gradient(135deg, rgba(223,168,79,0.09), rgba(139,111,232,0.05))',
        border: `1px solid ${GOLD}32`,
      }}>
        <SectionTitle>&#9788; Nadi Lagna &mdash; Ascendant at Birth</SectionTitle>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
          <InfoChip label="Sign"      value={lagna.sign}                            color={GOLD} big />
          <InfoChip label="Degree"    value={`${lagna.degree.toFixed(2)}°`}   color={GOLD} />
          <InfoChip label="Nakshatra" value={lagna.nakshatra}                       color={VIO} />
          <InfoChip label="Pada"      value={lagna.pada}                            color={VIO} />
        </div>
        <div style={{
          fontSize: '0.77rem', color: 'var(--text-dim)',
          fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1px',
        }}>
          Nadi reading begins from this Lagna &mdash; all planetary karaka interpretations are relative to this ascendant.
        </div>
      </div>

      {/* 2 — Nadi Yogas */}
      <div style={card}>
        <SectionTitle color={VIO}>&#9670; Nadi Yogas &mdash; Classical Planet Combinations</SectionTitle>

        {(nadi_yogas || []).length === 0 ? (
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '1rem 1.2rem',
            fontSize: '0.82rem', color: 'var(--text-dim)', lineHeight: 1.6,
          }}>
            No classical Nadi Yogas detected in this chart. Planetary positions do not form any of the recognised Nadi yoga combinations at this precision level.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(nadi_yogas || []).map((yoga, i) => {
              const isStrong = (yoga.strength || '').toLowerCase() === 'strong'
              const yogaColor = isStrong ? GOLD : VIO
              return (
                <div key={i} style={{
                  background: `${yogaColor}08`, border: `1px solid ${yogaColor}28`,
                  borderRadius: 14, padding: '1rem 1.2rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{
                      fontFamily: "'Fraunces', serif", fontSize: '1.05rem',
                      fontWeight: 700, color: yogaColor,
                    }}>{yoga.name}</div>
                    <span style={{
                      fontSize: '0.6rem', fontWeight: 700, color: yogaColor,
                      background: `${yogaColor}20`, border: `1px solid ${yogaColor}45`,
                      borderRadius: 999, padding: '0.2rem 0.65rem',
                      fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase',
                      letterSpacing: '1.5px',
                    }}>{yoga.strength || 'moderate'}</span>
                  </div>
                  <p style={{
                    fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.7,
                    margin: '0 0 0.75rem',
                  }}>{yoga.description}</p>
                  {(yoga.planets || []).length > 0 && (
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {yoga.planets.map(p => <PlanetChip key={p} name={p} />)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 3 — Life Themes Grid */}
      {(life_themes || []).length > 0 && (
        <div style={card}>
          <SectionTitle>&#9670; Life Themes &mdash; Nadi Portrait</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
            {(life_themes || []).map((theme, i) => {
              const areaCol = AREA_COLOR[theme.area] || GOLD
              return (
                <div key={i} style={{
                  background: `${areaCol}07`, border: `1px solid ${areaCol}22`,
                  borderRadius: 14, padding: '1rem 1.1rem',
                  display: 'flex', flexDirection: 'column', gap: '0.4rem',
                }}>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: '0.58rem',
                    color: areaCol, letterSpacing: '2px', textTransform: 'uppercase',
                    fontWeight: 500,
                  }}>{theme.area}</div>
                  <div style={{
                    fontFamily: "'Fraunces', serif", fontSize: '1rem',
                    fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3,
                  }}>{theme.theme}</div>
                  {theme.detail && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>
                      {theme.detail}
                    </div>
                  )}
                  {(theme.planets || []).length > 0 && (
                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                      {theme.planets.map(p => {
                        const col = PLANET_COLOR[p] || GOLD
                        return (
                          <span key={p} style={{
                            fontSize: '0.68rem', fontWeight: 600, color: col,
                            background: `${col}12`, border: `1px solid ${col}28`,
                            borderRadius: 999, padding: '0.18rem 0.55rem',
                            fontFamily: "'JetBrains Mono', monospace",
                          }}>{p}</span>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 4 — Nadi Predictions Timeline */}
      {(nadi_predictions || []).length > 0 && (
        <div style={card}>
          <SectionTitle color={GOLD_L}>&#9670; Nadi Predictions &mdash; Timeline</SectionTitle>
          <div style={{ position: 'relative', paddingLeft: '1.75rem' }}>
            {/* Vertical gold line */}
            <div style={{
              position: 'absolute', left: '0.45rem', top: 0, bottom: 0,
              width: 2, background: `linear-gradient(to bottom, ${GOLD}90, ${GOLD}10)`,
              borderRadius: 2,
            }} />
            {(nadi_predictions || []).map((pred, i) => (
              <div key={i} style={{
                position: 'relative', marginBottom: '1rem',
              }}>
                {/* Timeline dot */}
                <div style={{
                  position: 'absolute', left: '-1.38rem', top: '0.85rem',
                  width: 10, height: 10, borderRadius: '50%',
                  background: GOLD, border: `2px solid var(--bg-card)`,
                  boxShadow: `0 0 8px ${GOLD}60`,
                }} />
                <div style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '0.9rem 1.1rem',
                }}>
                  <div style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: '0.62rem',
                    color: GOLD, letterSpacing: '1.5px', textTransform: 'uppercase',
                    marginBottom: '0.4rem',
                  }}>{pred.period}</div>
                  <p style={{
                    fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.7,
                    margin: '0 0 0.6rem',
                  }}>{pred.prediction}</p>
                  {(pred.planets || []).length > 0 && (
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {pred.planets.map(p => <PlanetChip key={p} name={p} />)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5 — Planetary Nadi Analysis Table */}
      <div style={card}>
        <SectionTitle>&#9670; Planetary Nadi Analysis &mdash; All 9 Grahas</SectionTitle>

        {/* Header row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '110px 100px 130px 72px 90px 44px 100px 1fr',
          gap: '0.4rem',
          padding: '0 0.5rem 0.5rem',
          borderBottom: '1px solid var(--border)',
          marginBottom: '0.4rem',
        }}>
          {['Planet', 'Sign/°', 'Nakshatra', 'Amsa', 'Amsa Sign', 'H', 'Dignity', 'Karaka'].map(h => (
            <div key={h} style={{
              fontSize: '0.56rem', color: 'var(--text-dim)',
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1.5px', textTransform: 'uppercase',
            }}>{h}</div>
          ))}
        </div>

        {PLANET_ORDER.map(pname => {
          const p = (planets || []).find(x => x.planet === pname)
          if (!p) return null
          const col = PLANET_COLOR[p.planet] || GOLD
          return (
            <div key={p.planet} style={{
              display: 'grid',
              gridTemplateColumns: '110px 100px 130px 72px 90px 44px 100px 1fr',
              gap: '0.4rem', alignItems: 'center',
              padding: '0.55rem 0.5rem', borderRadius: 10,
              background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border)',
              marginBottom: '0.3rem',
            }}>
              {/* Planet */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ color: col, fontSize: '0.95rem' }} dangerouslySetInnerHTML={{ __html: PLANET_SYMBOL[p.planet] || '' }} />
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: col }}>{p.planet}</span>
              </div>
              {/* Sign + Degree */}
              <div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{p.sign}</div>
                <div style={{ fontSize: '0.62rem', color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace" }}>{p.degree != null ? p.degree.toFixed(2) : '—'}&deg;</div>
              </div>
              {/* Nakshatra + Pada */}
              <div>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{p.nakshatra}</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>Pada {p.pada}</div>
              </div>
              {/* Nadi Amsa */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: '0.82rem',
                  fontWeight: 700, color: GOLD_L,
                }}>{p.nadi_amsa != null ? p.nadi_amsa : '—'}</div>
                <div style={{ fontSize: '0.52rem', color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace" }}>&divide;150</div>
              </div>
              {/* Amsa Sign */}
              <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{p.nadi_amsa_sign || '—'}</div>
              {/* House */}
              <div style={{
                textAlign: 'center', fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.72rem', fontWeight: 700, color: GOLD,
                background: `${GOLD}12`, border: `1px solid ${GOLD}22`,
                borderRadius: 7, padding: '0.2rem 0.3rem',
              }}>{p.house}</div>
              {/* Dignity */}
              <div><DignityBadge dignity={p.dignity} /></div>
              {/* Karaka */}
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', lineHeight: 1.45 }}>{p.karaka || '—'}</div>
            </div>
          )
        })}

        {(planets || []).length > 0 && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
            Nadi Amsa = the 1/150th sub-division of a sign (each amsa = 12&prime; of arc). The Amsa Sign shows which sign the planet falls in at that ultra-fine resolution.
          </div>
        )}
      </div>

      {/* 6 — About Nadi Astrology Accordion */}
      <div style={{ ...card, padding: '1rem 1.3rem' }}>
        <button
          onClick={() => setAccordionOpen(o => !o)}
          style={{
            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: 0,
          }}
        >
          <SectionTitle>About Nadi Astrology</SectionTitle>
          <span style={{
            fontSize: '0.75rem', color: GOLD, fontFamily: "'JetBrains Mono', monospace",
            transition: 'transform 0.2s', display: 'inline-block',
            transform: accordionOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}>&#9650;</span>
        </button>
        {accordionOpen && (
          <div style={{ marginTop: '0.6rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', lineHeight: 1.8, margin: '0 0 0.75rem' }}>
              The <strong style={{ color: GOLD_L }}>Nadi Amsa</strong> is 12 minutes of arc &mdash; the 1/150th division of a zodiac sign (30&deg;). This ultra-fine grid is the foundation of Nadi Jyotish, a corpus of ancient South Indian predictive texts attributed to sages such as Bhrigu, Agastya, and Vashishta.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', lineHeight: 1.8, margin: '0 0 0.75rem' }}>
              Classical Nadi texts &mdash; <strong style={{ color: GOLD_L }}>Bhrigu Nadi</strong>, <strong style={{ color: GOLD_L }}>Chandra Kala Nadi</strong>, <strong style={{ color: GOLD_L }}>Sapta Rishi Nadi</strong> &mdash; read destiny by examining which amsa each planet occupies and the combinations formed between them. A <strong style={{ color: GOLD_L }}>Nadi Yoga</strong> arises when specific planets share an amsa-level relationship, revealing concentrated karmic themes.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', lineHeight: 1.8, margin: 0 }}>
              Each planet is also read as a <strong style={{ color: GOLD_L }}>karaka</strong> (significator): the Sun signifies soul and authority, the Moon signifies mind and mother, Mars signifies energy and property, and so on. The Nadi system synthesises dignity, amsa position, karaka role, and yoga combinations into a holistic life portrait &mdash; making it one of the most precise and ancient predictive systems in Jyotish.
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
            View your full natal chart
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', margin: 0 }}>
            Your natal Kundali provides the precise planetary longitudes that Nadi analysis depends on &mdash; dashas, ashtakavarga, and yogas complete the classical portrait.
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

export default function NadiAstrology() {
  const [dob,     setDob]     = useState('')
  const [tob,     setTob]     = useState('12:00')
  const [lat,     setLat]     = useState('')
  const [lon,     setLon]     = useState('')
  const [tz,      setTz]      = useState('Asia/Kolkata')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [result,  setResult]  = useState(null)

  function pickCity(lt, ln, timezone) {
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
      const res = await computeNadi(payload)
      setResult(res.data)
      setTimeout(() => document.getElementById('nadi-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch (e) {
      setError(e.message || 'Computation failed. Please check your inputs.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>

      {/* Header */}
      <div className="bh-fade-up" style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: '0.66rem',
          color: GOLD, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '0.5rem',
        }}>
          Ancient Nadi Texts &middot; Guru Tier
        </div>
        <h1 style={{
          fontFamily: "'Fraunces', serif", fontSize: 'clamp(1.9rem, 4vw, 2.8rem)',
          fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: '0 0 0.5rem',
        }}>
          Nadi Astrology
        </h1>
        <p style={{
          color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.7,
          maxWidth: '560px', margin: '0 auto',
        }}>
          Nadi is an ancient South Indian system that reads fate from the precise Nadi amsa &mdash; the 1/150th division of a sign (12&prime;). The planetary karakas, dignity, and Nadi yogas paint a classical life portrait drawn from the Bhrigu and Chandra Kala Nadi texts.
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
            transition: 'opacity 0.2s',
          }}
        >
          {loading ? 'Reading the Nadi…' : 'Compute Nadi Chart ✶'}
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ ...card, textAlign: 'center', padding: '2rem' }}>
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem',
            color: GOLD, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.5rem',
          }}>Consulting the ancient texts…</div>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>
            Computing Nadi amsas, karaka roles, yoga combinations&hellip;
          </div>
        </div>
      )}

      {/* Info box — shown only when no result */}
      {!result && !loading && (
        <div className="bh-fade-up-2" style={{ ...card, padding: '1rem 1.3rem' }}>
          <SectionTitle>About Nadi Astrology</SectionTitle>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', lineHeight: 1.8, margin: '0 0 0.7rem' }}>
            <strong style={{ color: GOLD_L }}>Nadi Jyotish</strong> is among the oldest branches of Indian astrology, preserved in palm-leaf manuscripts by South Indian sage-astrologers. The word &ldquo;Nadi&rdquo; means &ldquo;channel&rdquo; &mdash; referring to the ultra-fine channels of karmic energy carried by each planet&rsquo;s precise position in the chart.
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', lineHeight: 1.8, margin: 0 }}>
            The system divides each 30&deg; sign into <strong style={{ color: GOLD_L }}>150 Nadi amsas of 12&prime; each</strong>. A planet&rsquo;s karaka role (Soul, Mind, Courage, Communication, Wisdom, Desire, Discipline) combined with its amsa position and dignity reveals extraordinarily specific life themes. <strong style={{ color: GOLD_L }}>Guru-tier feature</strong> &mdash; requires a precise birth time for accurate amsa placement.
          </p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div id="nadi-result">
          <ResultPanel data={result} />
        </div>
      )}

    </div>
  )
}
