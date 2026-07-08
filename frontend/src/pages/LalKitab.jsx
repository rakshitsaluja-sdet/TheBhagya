import { useState } from 'react'
import { Link } from 'react-router-dom'
import { computeLalKitab } from '../hooks/useApi'

/* ── City presets ──────────────────────────────────────────────────────── */
const CITIES = [
  { label: 'Select city…',   lat: '',       lon: '',       tz: '' },
  { label: 'Mumbai',         lat: 19.0760,  lon: 72.8777,  tz: 'Asia/Kolkata' },
  { label: 'Delhi',          lat: 28.6139,  lon: 77.2090,  tz: 'Asia/Kolkata' },
  { label: 'Bangalore',      lat: 12.9716,  lon: 77.5946,  tz: 'Asia/Kolkata' },
  { label: 'Chennai',        lat: 13.0827,  lon: 80.2707,  tz: 'Asia/Kolkata' },
  { label: 'Kolkata',        lat: 22.5726,  lon: 88.3639,  tz: 'Asia/Kolkata' },
  { label: 'Hyderabad',      lat: 17.3850,  lon: 78.4867,  tz: 'Asia/Kolkata' },
  { label: 'Ahmedabad',      lat: 23.0225,  lon: 72.5714,  tz: 'Asia/Kolkata' },
  { label: 'Pune',           lat: 18.5204,  lon: 73.8567,  tz: 'Asia/Kolkata' },
  { label: 'Jaipur',         lat: 26.9124,  lon: 75.7873,  tz: 'Asia/Kolkata' },
  { label: 'Kanpur',         lat: 26.4499,  lon: 80.3319,  tz: 'Asia/Kolkata' },
  { label: 'Lucknow',        lat: 26.8467,  lon: 80.9462,  tz: 'Asia/Kolkata' },
  { label: 'Surat',          lat: 21.1702,  lon: 72.8311,  tz: 'Asia/Kolkata' },
  { label: 'Amritsar',       lat: 31.6340,  lon: 74.8723,  tz: 'Asia/Kolkata' },
  { label: 'Kathmandu',      lat: 27.7172,  lon: 85.3240,  tz: 'Asia/Kathmandu' },
  { label: 'Dhaka',          lat: 23.8103,  lon: 90.4125,  tz: 'Asia/Dhaka' },
  { label: 'Colombo',        lat: 6.9271,   lon: 79.8612,  tz: 'Asia/Colombo' },
  { label: 'Dubai',          lat: 25.2048,  lon: 55.2708,  tz: 'Asia/Dubai' },
  { label: 'Singapore',      lat: 1.3521,   lon: 103.8198, tz: 'Asia/Singapore' },
  { label: 'London',         lat: 51.5074,  lon: -0.1278,  tz: 'Europe/London' },
  { label: 'Toronto',        lat: 43.6532,  lon: -79.3832, tz: 'America/Toronto' },
  { label: 'New York',       lat: 40.7128,  lon: -74.0060, tz: 'America/New_York' },
  { label: 'Los Angeles',    lat: 34.0522,  lon: -118.2437,tz: 'America/Los_Angeles' },
  { label: 'Sydney',         lat: -33.8688, lon: 151.2093, tz: 'Australia/Sydney' },
]

/* ── Planet display data ───────────────────────────────────────────────── */
const P_SYMBOL = { Sun:'☉', Moon:'☽', Mercury:'☿', Venus:'♀', Mars:'♂', Jupiter:'♃', Saturn:'♄', Rahu:'☊', Ketu:'☋' }
const P_COLOR  = { Sun:'#f39c12', Moon:'#bdc3c7', Mercury:'#2ecc71', Venus:'#e91e8c', Mars:'#e74c3c', Jupiter:'#f1c40f', Saturn:'#7f8c8d', Rahu:'#8e44ad', Ketu:'#d35400' }

const GOLD_GRADIENT = 'linear-gradient(135deg, #F2CB84 0%, #DFA84F 42%, #A8752B 100%)'

/* ── Styles ────────────────────────────────────────────────────────────── */
const s = {
  page:     { maxWidth: 1060, margin: '0 auto', padding: '2rem 1.5rem 5rem' },
  eyebrow:  { fontFamily: "'JetBrains Mono', monospace", fontSize: '0.66rem', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.6rem' },
  heading:  { fontFamily: "'Fraunces', serif", fontSize: 'clamp(1.9rem, 4vw, 2.8rem)', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '0.3rem' },
  subhead:  { fontSize: '0.92rem', color: 'var(--text-muted)', marginBottom: '2rem' },
  card:     { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: '1.5rem', backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)' },
  cardTitle:{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', fontWeight: 600, color: 'var(--gold)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '1.2rem' },
  label:    { display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' },
  input:    { width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.9rem', boxSizing: 'border-box', fontFamily: 'inherit' },
  select:   { width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.9rem', boxSizing: 'border-box', fontFamily: 'inherit', cursor: 'pointer' },
  row:      { marginBottom: '1rem' },
  grid2:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  btn:      { width: '100%', padding: '0.95rem', background: GOLD_GRADIENT, color: '#1C1205', border: 'none', borderRadius: 999, fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.5px', boxShadow: '0 8px 28px rgba(223,168,79,0.28)', transition: 'opacity 0.2s', marginTop: '0.5rem' },
  secHead:  { fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', fontWeight: 600, color: 'var(--gold)', letterSpacing: '2.5px', textTransform: 'uppercase', margin: '1.75rem 0 0.8rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border)' },
  err:      { background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.35)', borderRadius: 10, padding: '1rem', color: '#e74c3c', fontSize: '0.875rem', marginBottom: '1.5rem' },
  pill:     (bg, color) => ({ display: 'inline-block', padding: '0.28rem 0.9rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, background: bg, color, border: `1px solid ${color}44`, marginRight: '0.5rem', marginBottom: '0.4rem' }),
}

/* ── North-Indian LK House Map SVG ────────────────────────────────────── */
// 4×4 grid, center 2×2 empty.
// House positions [house_num]: [row, col]
const HOUSE_POS = {
  12:[0,0], 1:[0,1], 2:[0,2], 3:[0,3],
  11:[1,0],                   4:[1,3],
  10:[2,0],                   5:[2,3],
   9:[3,0], 8:[3,1], 7:[3,2], 6:[3,3],
}
const CELL = 82   // px per cell
const SIZE = CELL * 4

function HouseMap({ houseMap, lagna }) {
  const lagnaSign = lagna?.sign || ''

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      width="100%"
      style={{ maxWidth: 340, display: 'block', margin: '0 auto' }}
    >
      {/* Outer border */}
      <rect x={0} y={0} width={SIZE} height={SIZE} fill="none" stroke="rgba(223,168,79,0.35)" strokeWidth={1.5} />

      {/* Cell borders and content */}
      {Object.entries(HOUSE_POS).map(([hNum, [row, col]]) => {
        const h    = parseInt(hNum)
        const x    = col * CELL
        const y    = row * CELL
        const planets = (houseMap?.[h] || [])
        const isLagna  = h === 1

        return (
          <g key={h}>
            <rect
              x={x} y={y} width={CELL} height={CELL}
              fill={isLagna ? 'rgba(223,168,79,0.08)' : 'var(--bg-elevated)'}
              stroke="rgba(223,168,79,0.22)"
              strokeWidth={0.8}
            />
            {/* House number */}
            <text
              x={x + 6} y={y + 14}
              fontSize={9} fill="rgba(223,168,79,0.55)"
              fontFamily="'JetBrains Mono', monospace"
            >{h}</text>

            {/* Lagna marker */}
            {isLagna && (
              <text x={x + CELL - 6} y={y + 14} fontSize={8} fill="rgba(223,168,79,0.7)" textAnchor="end" fontFamily="'JetBrains Mono', monospace">
                {lagnaSign?.slice(0,3)}
              </text>
            )}

            {/* Planets */}
            {planets.map((pname, i) => (
              <text
                key={pname}
                x={x + CELL / 2}
                y={y + 32 + i * 18}
                textAnchor="middle"
                fontSize={13}
                fill={P_COLOR[pname] || '#DFA84F'}
                fontFamily="Arial, sans-serif"
              >
                {P_SYMBOL[pname] || pname.slice(0, 2)}
              </text>
            ))}
          </g>
        )
      })}

      {/* Center diamond lines */}
      <line x1={CELL} y1={CELL} x2={CELL * 3} y2={CELL * 3} stroke="rgba(223,168,79,0.18)" strokeWidth={0.7} />
      <line x1={CELL * 3} y1={CELL} x2={CELL} y2={CELL * 3} stroke="rgba(223,168,79,0.18)" strokeWidth={0.7} />

      {/* Center label */}
      <text x={SIZE / 2} y={SIZE / 2 - 6} textAnchor="middle" fontSize={8} fill="rgba(223,168,79,0.45)" fontFamily="'JetBrains Mono', monospace" letterSpacing="2">
        Lal Kitab
      </text>
      <text x={SIZE / 2} y={SIZE / 2 + 8} textAnchor="middle" fontSize={8} fill="rgba(223,168,79,0.3)" fontFamily="'JetBrains Mono', monospace">
        {lagnaSign}
      </text>
    </svg>
  )
}

/* ── Remedy detail component ───────────────────────────────────────────── */
function RemedyDetail({ r }) {
  const [section, setSection] = useState(null)
  const toggle = (sec) => setSection(s => s === sec ? null : sec)

  const box = (active) => ({
    background: active ? 'rgba(223,168,79,0.06)' : 'transparent',
    border: `1px solid ${active ? 'rgba(223,168,79,0.3)' : 'var(--border)'}`,
    borderRadius: 10, padding: '0.7rem 0.9rem', marginTop: '0.6rem',
  })
  const toggle_style = { cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', fontWeight: 600, color: 'var(--gold-light)' }

  return (
    <div style={{ marginTop: '0.85rem' }}>
      {/* Action */}
      <div style={{ background: 'rgba(223,168,79,0.05)', borderRadius: 10, padding: '0.75rem 0.9rem', marginBottom: '0.5rem', fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>
        <strong style={{ color: 'var(--gold)' }}>Action Remedy: </strong>{r.action}
      </div>

      {/* Mantra */}
      {r.mantra_simple && (
        <div style={box(section === 'mantra')}>
          <div style={toggle_style} onClick={() => toggle('mantra')}>
            <span>Mantra</span>
            <span style={{ fontSize: '0.72rem' }}>{section === 'mantra' ? '▲' : '▼'}</span>
          </div>
          {section === 'mantra' && (
            <div style={{ marginTop: '0.6rem' }}>
              <div style={{ color: 'var(--gold)', fontSize: '1rem', lineHeight: 1.7, marginBottom: '0.2rem' }}>{r.mantra_simple}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontStyle: 'italic', marginBottom: '0.6rem' }}>{r.mantra_simple_roman}</div>
              {r.mantra_beej && r.mantra_beej !== r.mantra_simple && (
                <div style={{ marginBottom: '0.4rem' }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.2rem' }}>Beej Mantra</div>
                  <div style={{ color: 'var(--gold)', fontSize: '0.9rem', lineHeight: 1.65 }}>{r.mantra_beej}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.77rem', fontStyle: 'italic' }}>{r.mantra_beej_roman}</div>
                </div>
              )}
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Meaning:</strong> {r.mantra_meaning}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Count:</strong> {r.mantra_count}
              </div>
            </div>
          )}
        </div>
      )}

      {/* How-to */}
      {r.how_to?.length > 0 && (
        <div style={box(section === 'howto')}>
          <div style={toggle_style} onClick={() => toggle('howto')}>
            <span>Step-by-Step Guide</span>
            <span style={{ fontSize: '0.72rem' }}>{section === 'howto' ? '▲' : '▼'}</span>
          </div>
          {section === 'howto' && (
            <ol style={{ paddingLeft: '1.2rem', margin: '0.6rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.75 }}>
              {r.how_to.map((step, i) => <li key={i} style={{ marginBottom: '0.3rem' }}>{step}</li>)}
            </ol>
          )}
        </div>
      )}

      {/* Rules */}
      {r.rules?.length > 0 && (
        <div style={box(section === 'rules')}>
          <div style={toggle_style} onClick={() => toggle('rules')}>
            <span>Rules</span>
            <span style={{ fontSize: '0.72rem' }}>{section === 'rules' ? '▲' : '▼'}</span>
          </div>
          {section === 'rules' && (
            <ul style={{ paddingLeft: '1.2rem', margin: '0.6rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.75 }}>
              {r.rules.map((rule, i) => <li key={i} style={{ marginBottom: '0.3rem' }}>{rule}</li>)}
            </ul>
          )}
        </div>
      )}

      {/* When to avoid */}
      {r.when_to_avoid?.length > 0 && (
        <div style={box(section === 'avoid')}>
          <div style={toggle_style} onClick={() => toggle('avoid')}>
            <span>When to Avoid</span>
            <span style={{ fontSize: '0.72rem' }}>{section === 'avoid' ? '▲' : '▼'}</span>
          </div>
          {section === 'avoid' && (
            <ul style={{ paddingLeft: '1.2rem', margin: '0.6rem 0 0', fontSize: '0.82rem', color: '#e67e22', lineHeight: 1.75 }}>
              {r.when_to_avoid.map((w, i) => <li key={i} style={{ marginBottom: '0.3rem' }}>{w}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Results panel ─────────────────────────────────────────────────────── */
function ResultPanel({ data }) {
  const [openR, setOpenR] = useState(null)
  const [openP, setOpenP] = useState(null)
  const { lagna, planets, house_map, lal_kitab: lk } = data

  if (!lk) return <div style={s.err}>No Lal Kitab data returned.</div>

  const dot = (color) => ({
    display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
    background: color, marginRight: '0.5rem', flexShrink: 0, marginTop: 5,
  })

  return (
    <div style={{ marginTop: '2.5rem' }}>
      {/* ── House Map + Lagna info ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem', alignItems: 'start' }}>
        <div style={{ ...s.card, textAlign: 'center' }}>
          <div style={{ ...s.cardTitle, marginBottom: '1rem' }}>Lal Kitab House Map</div>
          <HouseMap houseMap={house_map} lagna={lagna} />
          <div style={{ marginTop: '0.8rem', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
            {Object.entries(P_SYMBOL).map(([p, sym]) => (
              <span key={p} style={{ fontSize: '0.68rem', color: P_COLOR[p], display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                {sym} {p}
              </span>
            ))}
          </div>
        </div>

        <div style={s.card}>
          <div style={s.cardTitle}>Chart Summary</div>
          <div style={{ marginBottom: '0.8rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Ascendant (Lagna)</div>
            <div style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)', fontSize: '1.15rem' }}>
              {lagna?.sign} {lagna?.degree?.toFixed(1)}°
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{lagna?.nakshatra} · Pada {lagna?.pada}</div>
          </div>

          <div style={{ marginBottom: '0.8rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Planets by House</div>
            {Object.entries(planets || {}).map(([name, pd]) => (
              <div key={name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.2rem 0', borderBottom: '1px solid var(--border-soft)' }}>
                <span style={{ color: P_COLOR[name] || 'var(--text-primary)' }}>{P_SYMBOL[name]} {name}</span>
                <span style={{ color: 'var(--text-muted)' }}>
                  H{pd.house} · {pd.sign}
                  {pd.retrograde && <span style={{ color: '#e67e22', marginLeft: '0.3rem' }}>℞</span>}
                  {pd.lk_pucca  && <span style={{ color: 'var(--gold)', marginLeft: '0.3rem' }}>★</span>}
                </span>
              </div>
            ))}
          </div>

          {/* Badges */}
          <div style={{ marginTop: '0.8rem', display: 'flex', flexWrap: 'wrap' }}>
            <span style={s.pill(lk.foreign_indicator ? 'rgba(223,168,79,0.12)' : 'var(--bg-elevated)', lk.foreign_indicator ? 'var(--gold)' : 'var(--text-muted)')}>
              {lk.foreign_indicator ? '✈ Foreign Karma: Active' : '✈ Foreign Karma: Mild'}
            </span>
            {lk.pucca_ghar_planets?.map(p => (
              <span key={p.planet} style={s.pill('rgba(223,168,79,0.1)', 'var(--gold)')}>
                ★ {p.planet} Pucca H{p.house}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Karmic Axis ── */}
      <div style={{ ...s.card, marginBottom: '1.2rem' }}>
        <div style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          ☊ {lk.rahu_ketu_axis}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.87rem', lineHeight: 1.7, margin: 0 }}>{lk.axis_reading}</p>
      </div>

      {/* ── Benefits ── */}
      {lk.benefits?.length > 0 && (
        <>
          <div style={s.secHead}>What Works in Your Favour</div>
          {lk.benefits.map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <span style={dot('#2ecc71')} />
              <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>{b}</span>
            </div>
          ))}
        </>
      )}

      {/* ── Challenges ── */}
      {lk.challenges?.length > 0 && (
        <>
          <div style={s.secHead}>Challenges to Be Aware Of</div>
          {lk.challenges.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <span style={dot('#e67e22')} />
              <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>{c}</span>
            </div>
          ))}
        </>
      )}

      {/* ── Personalised Remedies — all planets ── */}
      {lk.remedies?.length > 0 && (
        <>
          <div style={s.secHead}>Personalised Lal Kitab Remedies</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.6 }}>
            Each remedy is specific to your planetary placement. Expand for mantra, step-by-step guide, rules, and when to avoid.
          </p>
          {lk.remedies.map((r, i) => (
            <div key={i} style={{ background: 'var(--bg-card)', borderRadius: 18, padding: '0.9rem 1.1rem', marginBottom: '0.7rem', border: openR === i ? '1px solid rgba(223,168,79,0.35)' : '1px solid var(--border)', cursor: 'pointer', transition: 'border 0.2s, transform 0.2s', backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)' }}
              onClick={() => setOpenR(openR === i ? null : i)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '0.9rem' }}>
                  {P_SYMBOL[r.planet] || '●'} {r.planet} — House {r.house}
                  {r.retrograde && <span style={{ color: '#e67e22', fontSize: '0.75rem', marginLeft: '0.5rem' }}>℞ LK reads H{((r.house - 1 + 6) % 12) + 1}</span>}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{openR === i ? '▲ Close' : '▼ Full Guide'}</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>{r.challenge}</div>
              {openR === i && <RemedyDetail r={r} />}
            </div>
          ))}
        </>
      )}

      {/* ── Full planet-by-planet ── */}
      {lk.planet_readings?.length > 0 && (
        <>
          <div style={s.secHead}>Full Planet-by-Planet Reading</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.6 }}>
            Every planet — benefit, challenge, and complete remedy. Retrograde planets show the LK effective house.
          </p>
          {lk.planet_readings.map((pr, i) => {
            const guide = pr.remedy_guide || {}
            const rd = {
              action: pr.remedy, mantra_beej: guide.mantra_beej || '', mantra_beej_roman: guide.mantra_beej_roman || '',
              mantra_simple: guide.mantra_simple || '', mantra_simple_roman: guide.mantra_simple_roman || '',
              mantra_meaning: guide.mantra_meaning || '', mantra_count: guide.mantra_count || '',
              how_to: guide.how_to || [], rules: guide.rules || [], when_to_avoid: guide.when_to_avoid || [],
            }
            return (
              <div key={pr.planet} style={{ background: 'var(--bg-card)', borderRadius: 18, padding: '0.9rem 1.1rem', marginBottom: '0.5rem', border: openP === i ? '1px solid rgba(223,168,79,0.3)' : '1px solid var(--border)', cursor: 'pointer', transition: 'border 0.2s, transform 0.2s', backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)' }}
                onClick={() => setOpenP(openP === i ? null : i)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '0.88rem' }}>
                    <span style={{ color: P_COLOR[pr.planet] }}>{P_SYMBOL[pr.planet]}</span>
                    {' '}{pr.planet} · H{pr.house}
                    {pr.pucca     && <span style={{ color: 'var(--gold)', fontSize: '0.7rem', marginLeft: '0.4rem' }}>★ Pucca</span>}
                    {pr.retrograde && <span style={{ color: '#e67e22', fontSize: '0.7rem', marginLeft: '0.4rem' }}>℞→H{pr.lk_house}</span>}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{openP === i ? '▲' : '▼'}</span>
                </div>
                {openP === i && (
                  <div style={{ marginTop: '0.7rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#2ecc71', marginRight: '0.5rem', marginTop: 5, flexShrink: 0 }} />
                      <span style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>
                        <strong style={{ color: '#2ecc71' }}>Benefit: </strong>{pr.benefit}
                      </span>
                    </div>
                    <RemedyDetail r={rd} />
                  </div>
                )}
              </div>
            )
          })}
        </>
      )}

      {/* ── CTA ── */}
      <div style={{ ...s.card, marginTop: '2rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Get your full Vedic birth chart with Vimshottari Dasha, Ashtakavarga, nakshatra analysis and Lal Kitab in one place.
        </p>
        <Link to="/chart/new" style={{ display: 'inline-block', padding: '0.7rem 2rem', background: GOLD_GRADIENT, color: '#1C1205', borderRadius: 999, textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem', boxShadow: '0 8px 28px rgba(223,168,79,0.28)' }}>
          Create Full Kundali →
        </Link>
      </div>
    </div>
  )
}

/* ── Main page ─────────────────────────────────────────────────────────── */
const EMPTY = { dob: '', tob: '12:00', lat: '', lon: '', timezone: 'Asia/Kolkata', city: '' }

export default function LalKitab() {
  const [form, setForm]   = useState({ ...EMPTY })
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)
  const [error,   setError]   = useState(null)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleCity = (e) => {
    const city = CITIES.find(c => c.label === e.target.value)
    if (city && city.lat !== '') {
      setForm(f => ({ ...f, city: city.label, lat: city.lat, lon: city.lon, timezone: city.tz }))
    } else {
      set('city', e.target.value)
    }
  }

  const valid = form.dob && form.tob && form.lat !== '' && form.lon !== '' && form.timezone

  const handleCompute = async () => {
    if (!valid) return
    setLoading(true); setError(null); setResult(null)
    try {
      const data = await computeLalKitab({
        dob: form.dob, tob: form.tob,
        lat: parseFloat(form.lat), lon: parseFloat(form.lon),
        timezone: form.timezone,
      })
      setResult(data)
      setTimeout(() => document.getElementById('lk-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch (e) {
      setError(e.message || 'Computation failed. Please check all fields.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      {/* Header */}
      <div className="bh-fade-up">
        <div style={s.eyebrow}>Remedial Astrology</div>
        <h1 style={s.heading}>Lal Kitab Reading</h1>
        <p style={s.subhead}>
          19th-century Urdu wisdom — house-based karma, Pucca Ghar planets, Rahu-Ketu axis, and practical remedies.
        </p>
      </div>

      {/* Info box */}
      <div className="bh-fade-up-1" style={{ background: 'rgba(223,168,79,0.06)', border: '1px solid rgba(223,168,79,0.2)', borderRadius: 12, padding: '1rem 1.3rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '2rem' }}>
        <strong style={{ color: 'var(--gold)' }}>About Lal Kitab: </strong>
        Unlike classical Vedic astrology, Lal Kitab focuses on house position rather than sign. A planet in its
        <strong> Pucca Ghar</strong> (permanent house) delivers its strongest lifetime results. Retrograde planets
        are read from the opposite house. Remedies are practical and low-cost — no expensive pujas required.
      </div>

      {/* Form */}
      <div className="bh-fade-up-2" style={s.card}>
        <div style={s.cardTitle}>Enter Birth Details</div>

        <div className="lk-grid2" style={s.grid2}>
          <div style={s.row}>
            <label style={s.label}>Date of Birth</label>
            <input type="date" style={s.input} value={form.dob} onChange={e => set('dob', e.target.value)} />
          </div>
          <div style={s.row}>
            <label style={s.label}>Time of Birth</label>
            <input type="time" style={s.input} value={form.tob} onChange={e => set('tob', e.target.value)} />
          </div>
        </div>

        <div style={s.row}>
          <label style={s.label}>City (auto-fills coordinates)</label>
          <select style={s.select} value={form.city} onChange={handleCity}>
            {CITIES.map(c => <option key={c.label} value={c.label}>{c.label}</option>)}
          </select>
        </div>

        <div className="lk-grid2" style={s.grid2}>
          <div style={s.row}>
            <label style={s.label}>Latitude</label>
            <input type="number" step="0.0001" style={s.input} placeholder="e.g. 28.6139" value={form.lat} onChange={e => set('lat', e.target.value)} />
          </div>
          <div style={s.row}>
            <label style={s.label}>Longitude</label>
            <input type="number" step="0.0001" style={s.input} placeholder="e.g. 77.2090" value={form.lon} onChange={e => set('lon', e.target.value)} />
          </div>
        </div>

        <div style={s.row}>
          <label style={s.label}>Timezone</label>
          <input style={s.input} placeholder="e.g. Asia/Kolkata" value={form.timezone} onChange={e => set('timezone', e.target.value)} />
        </div>

        {error && <div style={{ ...s.err, marginTop: '0.5rem' }}>{error}</div>}

        <button
          style={{ ...s.btn, opacity: (!valid || loading) ? 0.6 : 1 }}
          onClick={handleCompute}
          disabled={!valid || loading}
        >
          {loading ? 'Computing…' : 'Get Lal Kitab Reading →'}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div id="lk-result">
          <ResultPanel data={result} />
        </div>
      )}

      {/* Mobile grid fix */}
      <style>{`
        @media (max-width: 640px) {
          .lk-grid2 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
