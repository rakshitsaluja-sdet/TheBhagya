import { useState } from 'react'
import { Link } from 'react-router-dom'
import { computeTransit } from '../hooks/useApi'
import CitySearch from '../components/CitySearch'

const GOLD   = '#DFA84F'
const GOLD_L = '#F2CB84'
const VIO    = '#8B6FE8'

const PLANET_COLOR = {
  Sun: '#E57C3A', Moon: '#B0BEC5', Mars: '#E53935', Mercury: '#43A047',
  Jupiter: '#F9A825', Venus: '#90CAF9', Saturn: '#3949AB',
  Rahu: '#795548', Ketu: '#8D6E63',
}

const PLANET_GLYPH = {
  Sun: '☉', Moon: '☽', Mars: '♂', Mercury: '☿',
  Jupiter: '♃', Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋',
}

const ORDINAL = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th']

// ── Shared styles ──────────────────────────────────────────────────────────────
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

function SectionTitle({ children, color }) {
  return (
    <div style={{
      fontFamily: "'JetBrains Mono', monospace", fontSize: '0.64rem',
      color: color || GOLD, letterSpacing: '2.5px', textTransform: 'uppercase',
      marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.6rem',
    }}>
      <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg,${color || GOLD}55,transparent)` }} />
      {children}
      <span style={{ flex: 1, height: 1, background: `linear-gradient(270deg,${color || GOLD}55,transparent)` }} />
    </div>
  )
}

// ── Transit position row ───────────────────────────────────────────────────────
function TransitRow({ name, data }) {
  const col  = PLANET_COLOR[name] || GOLD
  const glyph = PLANET_GLYPH[name] || name[0]
  return (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <td style={{ padding: '0.7rem 0.5rem', whiteSpace: 'nowrap' }}>
        <span style={{ color: col, fontSize: '1.05rem', marginRight: 6 }}>{glyph}</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.88rem' }}>{name}</span>
        {data.retrograde && (
          <span style={{ color: '#E57373', fontSize: '0.62rem', fontFamily: "'JetBrains Mono',monospace",
            marginLeft: 5, verticalAlign: 'middle' }}>℞</span>
        )}
      </td>
      <td style={{ padding: '0.7rem 0.5rem', color: GOLD_L, fontSize: '0.85rem' }}>{data.sign}</td>
      <td style={{ padding: '0.7rem 0.5rem', color: 'var(--text-dim)', fontSize: '0.82rem',
        fontFamily: "'JetBrains Mono',monospace" }}>{data.degree}°</td>
      <td style={{ padding: '0.7rem 0.5rem', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
        {data.nakshatra} <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>P{data.pada}</span>
      </td>
      <td style={{ padding: '0.7rem 0.5rem' }}>
        <span style={{ background: `${col}22`, border: `1px solid ${col}55`,
          borderRadius: 6, padding: '0.2rem 0.6rem', color: col,
          fontSize: '0.75rem', fontFamily: "'JetBrains Mono',monospace" }}>
          {ORDINAL[data.house] || `${data.house}th`}
        </span>
      </td>
    </tr>
  )
}

// ── Planet interpretation card ─────────────────────────────────────────────────
function TransitCard({ name, data }) {
  const [open, setOpen] = useState(false)
  const col   = PLANET_COLOR[name] || GOLD
  const glyph = PLANET_GLYPH[name] || name[0]
  const hasAspects    = data.vedic_aspects && data.vedic_aspects.length > 0
  const hasConjunction = data.conjunctions && data.conjunctions.length > 0

  return (
    <div style={{ ...card, marginBottom: '0.75rem', border: `1px solid ${col}33`,
      boxShadow: `0 0 16px ${col}18` }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem',
        cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setOpen(o => !o)}>
        <div style={{ width: 36, height: 36, borderRadius: '50%',
          background: `${col}22`, border: `1px solid ${col}66`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem', color: col, flexShrink: 0 }}>
          {glyph}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.95rem' }}>{name}</span>
            {data.retrograde && <span style={{ color: '#E57373', fontSize: '0.7rem', fontFamily: "'JetBrains Mono',monospace" }}>℞ Retrograde</span>}
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>in {data.sign} ({ORDINAL[data.house]} house)</span>
          </div>
          <div style={{ color: col, fontSize: '0.78rem', fontWeight: 600, marginTop: 2 }}>{data.theme}</div>
        </div>
        <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', transform: open ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.2s' }}>▼</div>
      </div>

      {open && (
        <div style={{ marginTop: '0.9rem', paddingTop: '0.9rem',
          borderTop: `1px solid ${col}22` }}>
          {/* Detail */}
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.87rem', lineHeight: 1.7,
            margin: '0 0 0.9rem' }}>{data.detail}</p>

          {/* Natal reference */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8,
              padding: '0.5rem 0.8rem', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-dim)' }}>Natal: </span>
              <span style={{ color: 'var(--text-secondary)' }}>
                {data.natal_sign} {data.natal_degree}° ({ORDINAL[data.natal_house]} house)
              </span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8,
              padding: '0.5rem 0.8rem', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-dim)' }}>Duration: </span>
              <span style={{ color: 'var(--text-secondary)' }}>{data.duration_in_sign}</span>
            </div>
          </div>

          {/* Aspects */}
          {hasAspects && (
            <div style={{ marginBottom: '0.6rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)',
                fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase',
                letterSpacing: '1.5px', marginBottom: '0.4rem' }}>Vedic Aspects</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {data.vedic_aspects.map((a, i) => (
                  <span key={i} style={{
                    background: `${PLANET_COLOR[a.natal_planet] || GOLD}22`,
                    border: `1px solid ${PLANET_COLOR[a.natal_planet] || GOLD}55`,
                    borderRadius: 6, padding: '0.2rem 0.6rem',
                    color: PLANET_COLOR[a.natal_planet] || GOLD_L,
                    fontSize: '0.74rem', fontFamily: "'JetBrains Mono',monospace",
                  }}>
                    {PLANET_GLYPH[a.natal_planet]} {a.natal_planet} ({a.aspect_type})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Conjunctions */}
          {hasConjunction && (
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)',
                fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase',
                letterSpacing: '1.5px', marginBottom: '0.4rem' }}>Degree Conjunctions</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {data.conjunctions.map((c, i) => (
                  <span key={i} style={{
                    background: c.orb <= 2 ? 'rgba(229,121,58,0.15)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${c.orb <= 2 ? '#E5793A' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 6, padding: '0.2rem 0.6rem',
                    color: c.orb <= 2 ? '#E5793A' : 'var(--text-secondary)',
                    fontSize: '0.74rem', fontFamily: "'JetBrains Mono',monospace",
                  }}>
                    ≈ {c.natal_planet} ({c.orb}° orb)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Special transit banner ────────────────────────────────────────────────────
function SpecialBanner({ special }) {
  const { jupiter, saturn, rahu_ketu } = special
  const items = []

  // Sade Sati
  if (saturn.sade_sati_active) {
    items.push({
      icon: '♄', color: '#3949AB',
      label: 'Sade Sati Active',
      value: saturn.sade_sati_phase,
    })
  }

  // Jupiter from Moon
  const jupFromMoon = jupiter.house_from_moon
  const jupGood = [1, 5, 9].includes(jupFromMoon)
  items.push({
    icon: '♃', color: jupGood ? '#F9A825' : '#888',
    label: `Jupiter ${ORDINAL[jupFromMoon]} from Moon`,
    value: jupGood ? 'Auspicious — Guru Peyarchi' : 'Average results',
  })

  // Rahu/Ketu
  items.push({
    icon: '☊', color: '#795548',
    label: `Rahu in ${rahu_ketu.rahu_sign}`,
    value: `${ORDINAL[rahu_ketu.rahu_house]} house · Ketu in ${rahu_ketu.ketu_sign} (${ORDINAL[rahu_ketu.ketu_house]})`,
  })

  if (!items.length) return null
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))',
      gap: '0.75rem', marginBottom: '1.25rem' }}>
      {items.map((it, i) => (
        <div key={i} style={{ background: `${it.color}18`,
          border: `1px solid ${it.color}44`, borderRadius: 12,
          padding: '0.85rem 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ color: it.color, fontSize: '1rem' }}>{it.icon}</span>
            <span style={{ color: it.color, fontSize: '0.7rem',
              fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase',
              letterSpacing: '1.5px' }}>{it.label}</span>
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{it.value}</div>
        </div>
      ))}
    </div>
  )
}

// ── Tight conjunctions alert ──────────────────────────────────────────────────
function TightAlert({ items }) {
  if (!items || !items.length) return null
  return (
    <div style={{ background: 'rgba(229,121,58,0.08)', border: '1px solid rgba(229,121,58,0.35)',
      borderRadius: 12, padding: '0.9rem 1.1rem', marginBottom: '1.25rem' }}>
      <div style={{ color: '#E5793A', fontSize: '0.7rem', fontFamily: "'JetBrains Mono',monospace",
        textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '0.5rem' }}>
        ⚡ Tight Conjunctions (≤ 3° orb) — High Activation
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {items.map((it, i) => (
          <span key={i} style={{ background: 'rgba(229,121,58,0.12)',
            border: '1px solid rgba(229,121,58,0.4)', borderRadius: 6,
            padding: '0.25rem 0.7rem', color: '#F2CB84', fontSize: '0.8rem',
            fontFamily: "'JetBrains Mono',monospace" }}>
            {PLANET_GLYPH[it.transit_planet]} {it.transit_planet} ≈ {PLANET_GLYPH[it.natal_planet]} {it.natal_planet} ({it.orb}°) in {it.sign}
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Transit() {
  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    birth_date: '', birth_time: '', birth_tz: 'Asia/Kolkata',
    birth_lat: '', birth_lon: '', birth_city: '',
    query_date: today, query_time: '12:00',
    same_location: true,
    query_lat: '', query_lon: '', query_tz: 'Asia/Kolkata', query_city: '',
  })
  const [loading, setLoading]   = useState(false)
  const [result,  setResult]    = useState(null)
  const [error,   setError]     = useState(null)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function applyBirthCity(lat, lon, tz, name) {
    setForm(f => ({
      ...f,
      birth_lat: lat, birth_lon: lon, birth_tz: tz, birth_city: name,
      ...(f.same_location
        ? { query_lat: lat, query_lon: lon, query_tz: tz, query_city: name }
        : {}),
    }))
  }

  function applyQueryCity(lat, lon, tz, name) {
    setForm(f => ({ ...f, query_lat: lat, query_lon: lon, query_tz: tz, query_city: name }))
  }

  function toggleSameLocation() {
    setForm(f => ({
      ...f,
      same_location: !f.same_location,
      ...(f.same_location
        ? {}
        : { query_lat: f.birth_lat, query_lon: f.birth_lon, query_tz: f.birth_tz, query_city: f.birth_city }),
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setResult(null)
    if (!form.birth_lat || !form.birth_lon) {
      setError('Please select a birth city from the dropdown.'); return
    }
    setLoading(true)
    try {
      const payload = {
        birth_date: form.birth_date,
        birth_time: form.birth_time,
        birth_tz:   form.birth_tz,
        birth_lat:  parseFloat(form.birth_lat),
        birth_lon:  parseFloat(form.birth_lon),
        query_date: form.query_date || today,
        query_time: form.query_time,
        query_tz:   form.same_location ? form.birth_tz : form.query_tz,
      }
      const data = await computeTransit(payload)
      if (!data.success) throw new Error(data.error || 'Computation failed')
      setResult(data.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Rahu', 'Ketu']

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', color: 'var(--text-primary)',
      padding: '5.5rem 5vw 4rem', maxWidth: 900, margin: '0 auto' }}>

      {/* Breadcrumb */}
      <div style={{ fontSize: '0.75rem', marginBottom: '1.8rem', color: 'var(--text-dim)',
        fontFamily: "'JetBrains Mono',monospace" }}>
        <Link to="/" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>Home</Link>
        {' / '}
        <span style={{ color: GOLD }}>Gochar — Transit Report</span>
      </div>

      {/* Page title */}
      <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 'clamp(1.8rem,5vw,2.8rem)',
        fontWeight: 700, background: `linear-gradient(135deg,${GOLD_L},${VIO})`,
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        marginBottom: '0.4rem' }}>
        Gochar · Transit Report
      </h1>
      <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '2.2rem' }}>
        Current planetary positions mapped against your natal chart — house analysis, aspects &amp; interpretations.
      </p>

      {/* ── Form ── */}
      <div style={card}>
        <SectionTitle>Birth Details</SectionTitle>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))',
            gap: '0.9rem', marginBottom: '1.2rem' }}>

            <div>
              <label style={lbl}>Date of Birth</label>
              <input type="date" style={inp} value={form.birth_date}
                onChange={e => set('birth_date', e.target.value)} required />
            </div>
            <div>
              <label style={lbl}>Time of Birth</label>
              <input type="time" style={inp} value={form.birth_time}
                onChange={e => set('birth_time', e.target.value)} required />
            </div>
          </div>

          <div style={{ marginBottom: '1.2rem' }}>
            <CitySearch
              label="Birth City (auto-fills timezone)"
              placeholder="Type birth city…"
              onSelect={applyBirthCity}
            />
            {form.birth_city && (
              <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--text-dim)',
                fontFamily: "'JetBrains Mono',monospace" }}>
                ✓ {form.birth_city} · {form.birth_tz}
              </div>
            )}
          </div>

          <SectionTitle>Transit Date</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))',
            gap: '0.9rem', marginBottom: '1rem' }}>
            <div>
              <label style={lbl}>Query Date</label>
              <input type="date" style={inp} value={form.query_date}
                onChange={e => set('query_date', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Query Time (local)</label>
              <input type="time" style={inp} value={form.query_time}
                onChange={e => set('query_time', e.target.value)} />
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
            marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={form.same_location} onChange={toggleSameLocation}
              style={{ accentColor: GOLD, width: 15, height: 15 }} />
            Use birth location for transit query
          </label>

          {!form.same_location && (
            <div style={{ marginBottom: '1.2rem' }}>
              <CitySearch
                label="Current Location (auto-fills timezone)"
                placeholder="Type current city…"
                onSelect={applyQueryCity}
              />
              {form.query_city && (
                <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--text-dim)',
                  fontFamily: "'JetBrains Mono',monospace" }}>
                  ✓ {form.query_city} · {form.query_tz}
                </div>
              )}
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(229,57,53,0.1)', border: '1px solid rgba(229,57,53,0.4)',
              borderRadius: 10, padding: '0.7rem 1rem', color: '#EF5350',
              fontSize: '0.85rem', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            background: loading ? 'var(--bg-elevated)' : `linear-gradient(135deg,${GOLD},${VIO})`,
            border: 'none', borderRadius: 12, padding: '0.9rem 2rem',
            color: loading ? 'var(--text-dim)' : '#07060F', fontWeight: 700,
            fontSize: '0.9rem', cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'opacity 0.2s', width: '100%',
          }}>
            {loading ? 'Computing Transits…' : 'Generate Gochar Report'}
          </button>
        </form>
      </div>

      {/* ── Results ── */}
      {result && (
        <div>
          {/* Header summary */}
          <div style={{ ...card, borderColor: `${GOLD}44`, marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
              <div>
                <div style={{ ...lbl }}>Natal Lagna</div>
                <div style={{ color: GOLD_L, fontSize: '1.05rem', fontWeight: 700 }}>
                  {result.natal_lagna.sign} {result.natal_lagna.degree}°
                </div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>{result.natal_lagna.nakshatra} P{result.natal_lagna.pada}</div>
              </div>
              <div>
                <div style={{ ...lbl }}>Natal Moon Sign</div>
                <div style={{ color: '#B0BEC5', fontSize: '1.05rem', fontWeight: 700 }}>{result.natal_moon_sign}</div>
              </div>
              <div>
                <div style={{ ...lbl }}>Transit Date</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 600 }}>{result.query_date}</div>
              </div>
              <div>
                <div style={{ ...lbl }}>Ayanamsa (Lahiri)</div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem', fontFamily: "'JetBrains Mono',monospace" }}>
                  {result.ayanamsa}°
                </div>
              </div>
            </div>
          </div>

          {/* Special transits */}
          <div style={card}>
            <SectionTitle>Special Transits</SectionTitle>
            <SpecialBanner special={result.special_transits} />
          </div>

          {/* Tight conjunctions alert */}
          {result.tight_conjunctions && result.tight_conjunctions.length > 0 && (
            <TightAlert items={result.tight_conjunctions} />
          )}

          {/* Transit positions table */}
          <div style={card}>
            <SectionTitle>Current Planetary Positions</SectionTitle>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${GOLD}44` }}>
                    {['Planet', 'Sign', 'Degree', 'Nakshatra', 'House (Natal Lagna)'].map(h => (
                      <th key={h} style={{ padding: '0.5rem', textAlign: 'left',
                        color: 'var(--text-dim)', fontSize: '0.68rem',
                        fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase',
                        letterSpacing: '1.5px', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PLANETS.map(p => result.transits[p] && (
                    <TransitRow key={p} name={p} data={result.transits[p]} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Per-planet interpretation cards */}
          <div style={{ marginTop: '0.5rem' }}>
            <SectionTitle>Transit Interpretations</SectionTitle>
            {PLANETS.map(p => result.transits[p] && (
              <TransitCard key={p} name={p} data={result.transits[p]} />
            ))}
          </div>

          {/* Saturn special section */}
          {result.special_transits.saturn.sade_sati_active && (
            <div style={{ ...card, borderColor: '#3949AB55', boxShadow: '0 0 20px #3949AB22' }}>
              <SectionTitle color="#3949AB">Sade Sati Guidance</SectionTitle>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.87rem', lineHeight: 1.75 }}>
                Saturn is currently in its <strong style={{ color: '#90CAF9' }}>
                {result.special_transits.saturn.sade_sati_phase}</strong> phase of Sade Sati.
                This 7.5-year transit of Saturn over the Moon sign (±1 sign) is a period of
                karmic reckoning, discipline, and structured growth. While it brings challenges,
                it rewards sincerity, hard work, and ethical conduct. Remedies: Saturdays fast,
                Saturn mantra (<em>Om Sham Shanaischaraya Namah</em>), dark blue or black attire,
                oil lamp offering on Saturdays, service to the elderly.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
