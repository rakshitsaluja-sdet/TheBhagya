import { useState } from 'react'
import { Link } from 'react-router-dom'
import { findMuhurat } from '../hooks/useApi'
import CitySearch from '../components/CitySearch'

const GOLD   = '#DFA84F'
const GOLD_L = '#F2CB84'
const VIO    = '#8B6FE8'
const GREEN  = '#43A047'
const AMBER  = '#F9A825'

// ── Style helpers ─────────────────────────────────────────────────────────────
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
      marginBottom: '0.85rem',
    }}>{children}</div>
  )
}

// ── Event type config ──────────────────────────────────────────────────────────
const EVENT_TYPES = [
  { key: 'vivah',         icon: '💍', label: 'Vivah',         sub: 'Marriage' },
  { key: 'griha_pravesh', icon: '🏠', label: 'Griha Pravesh', sub: 'Housewarming' },
  { key: 'vehicle',       icon: '🚗', label: 'Vahana Puja',   sub: 'Vehicle' },
  { key: 'business',      icon: '💼', label: 'Vyapar',        sub: 'Business Start' },
  { key: 'travel',        icon: '✈️', label: 'Yatra',         sub: 'Travel' },
  { key: 'bhoomi_pujan',  icon: '🏗️', label: 'Bhoomi Pujan', sub: 'Ground Breaking' },
  { key: 'namakaran',     icon: '👶', label: 'Namakaran',     sub: 'Baby Naming' },
]

// ── Quality badge ──────────────────────────────────────────────────────────────
function QualityBadge({ quality }) {
  const colors = {
    Excellent: { bg: `${GREEN}18`, border: `${GREEN}35`, color: GREEN },
    Good:      { bg: `${AMBER}18`, border: `${AMBER}35`, color: AMBER },
    Fair:      { bg: 'var(--gold-pale)', border: 'var(--border)', color: 'var(--text-muted)' },
  }
  const c = colors[quality] || colors.Fair
  return (
    <span style={{
      fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem',
      fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase',
      padding: '0.22rem 0.65rem', borderRadius: 999,
      background: c.bg, border: `1px solid ${c.border}`, color: c.color,
    }}>{quality}</span>
  )
}

// ── Panchang tag ───────────────────────────────────────────────────────────────
function Tag({ label, value, color }) {
  return (
    <div style={{
      background: `${color || GOLD}0D`, border: `1px solid ${color || GOLD}25`,
      borderRadius: 10, padding: '0.4rem 0.7rem', display: 'inline-flex',
      flexDirection: 'column', gap: 2,
    }}>
      <div style={{ fontSize: '0.55rem', color: color || GOLD, letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>{label}</div>
      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
    </div>
  )
}

// ── Score bar ──────────────────────────────────────────────────────────────────
function ScoreBar({ score }) {
  const color = score >= 80 ? GREEN : score >= 60 ? AMBER : GOLD
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
      <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{
          width: `${score}%`, height: '100%', borderRadius: 999,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          transition: 'width 0.6s cubic-bezier(0.22,1,0.36,1)',
        }} />
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', fontWeight: 700, color, minWidth: 28 }}>{score}</div>
    </div>
  )
}

// ── Single result card ─────────────────────────────────────────────────────────
function MuhuratCard({ item, index }) {
  const dateObj   = new Date(item.date + 'T12:00:00')
  const formatted = dateObj.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div style={{
      ...card,
      border: item.quality === 'Excellent' ? `1px solid ${GREEN}30` : item.quality === 'Good' ? `1px solid ${AMBER}30` : '1px solid var(--border)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Rank badge */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        fontFamily: "'JetBrains Mono', monospace", fontSize: '0.55rem',
        color: 'var(--text-dim)', background: 'var(--border)', borderRadius: '0 18px 0 10px',
        padding: '0.25rem 0.65rem', letterSpacing: '1.5px',
      }}>#{index + 1}</div>

      {/* Date + quality */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(1rem, 2.5vw, 1.3rem)', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
            {formatted}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            {item.date}
          </div>
        </div>
        <QualityBadge quality={item.quality} />
      </div>

      {/* Score bar */}
      <div style={{ marginBottom: '0.85rem' }}>
        <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Auspiciousness Score</div>
        <ScoreBar score={item.score} />
      </div>

      {/* Panchang tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.85rem' }}>
        <Tag label="Tithi"     value={item.tithi}     color={GOLD} />
        <Tag label="Nakshatra" value={item.nakshatra}  color={VIO} />
        <Tag label="Yoga"      value={item.yoga}       color={GREEN} />
        <Tag label="Vara"      value={item.vara}       color={AMBER} />
      </div>

      {/* Timing windows */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.85rem' }}>
        <div style={{ background: 'rgba(229,57,53,0.06)', border: '1px solid rgba(229,57,53,0.2)', borderRadius: 10, padding: '0.6rem 0.75rem' }}>
          <div style={{ fontSize: '0.55rem', color: '#EF9A9A', letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", marginBottom: '0.25rem' }}>Rahu Kaal — Avoid</div>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.rahu_kaal.start} – {item.rahu_kaal.end}</div>
        </div>
        <div style={{ background: `${GREEN}08`, border: `1px solid ${GREEN}25`, borderRadius: 10, padding: '0.6rem 0.75rem' }}>
          <div style={{ fontSize: '0.55rem', color: GREEN, letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", marginBottom: '0.25rem' }}>Abhijit Muhurat</div>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.abhijit.start} – {item.abhijit.end}</div>
        </div>
      </div>

      {/* Notes */}
      {item.notes && item.notes.length > 0 && (
        <div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Jyotish Notes</div>
          <ul style={{ margin: 0, padding: '0 0 0 1rem', listStyle: 'disc' }}>
            {item.notes.map((note, i) => (
              <li key={i} style={{ color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: 1.6, marginBottom: '0.15rem' }}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function Muhurat() {
  const today    = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const plus30   = new Date(today); plus30.setDate(today.getDate() + 30)
  const plus30Str = plus30.toISOString().slice(0, 10)

  const [eventType,  setEventType]  = useState('vivah')
  const [cityName,   setCityName]   = useState('')
  const [lat,        setLat]        = useState('')
  const [lon,        setLon]        = useState('')
  const [tz,         setTz]         = useState('Asia/Kolkata')
  const [startDate,  setStartDate]  = useState(todayStr)
  const [endDate,    setEndDate]    = useState(plus30Str)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [result,     setResult]     = useState(null)

  function pickCity(clat, clon, ctz, name) {
    setLat(String(clat))
    setLon(String(clon))
    setTz(ctz)
    setCityName(name)
  }

  function handleStartChange(val) {
    setStartDate(val)
    // Auto-advance end date if it's before start or > 90 days
    const s = new Date(val)
    const e = new Date(endDate)
    if (e < s) {
      const newEnd = new Date(s); newEnd.setDate(s.getDate() + 30)
      setEndDate(newEnd.toISOString().slice(0, 10))
    } else {
      const diff = (e - s) / 86400000
      if (diff > 90) {
        const newEnd = new Date(s); newEnd.setDate(s.getDate() + 90)
        setEndDate(newEnd.toISOString().slice(0, 10))
      }
    }
  }

  async function compute() {
    if (!lat || !lon) {
      setError('Please select a city to set the location.')
      return
    }
    if (!startDate || !endDate) {
      setError('Please select a date range.')
      return
    }
    const start = new Date(startDate)
    const end   = new Date(endDate)
    if (end < start) {
      setError('End date must be on or after start date.')
      return
    }
    if ((end - start) / 86400000 > 90) {
      setError('Date range cannot exceed 90 days.')
      return
    }
    setError('')
    setLoading(true)
    setResult(null)
    try {
      const data = await findMuhurat({
        event_type:  eventType,
        start_date:  startDate,
        end_date:    endDate,
        timezone:    tz,
        lat:         parseFloat(lat),
        lon:         parseFloat(lon),
        max_results: 10,
      })
      setResult(data)
      setTimeout(() => document.getElementById('muhurat-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch (e) {
      setError(e.message || 'Computation failed. Please check your inputs.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>

      {/* Breadcrumb */}
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: 'var(--text-dim)', letterSpacing: '1.5px', marginBottom: '1.5rem' }}>
        <Link to="/" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>Home</Link>
        <span style={{ margin: '0 0.5rem' }}>/</span>
        <span style={{ color: GOLD }}>Muhurat Finder</span>
      </div>

      {/* Header */}
      <div className="bh-fade-up" style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.66rem', color: GOLD, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Vedic Astrology &middot; Panchang &amp; Nakshatra Rules
        </div>
        <h1 style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 'clamp(1.9rem, 4vw, 2.8rem)', fontWeight: 600,
          letterSpacing: '-0.02em', margin: '0 0 0.5rem',
          background: `linear-gradient(135deg, ${GOLD_L} 0%, ${GOLD} 50%, ${VIO} 100%)`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Muhurat Finder
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.7, maxWidth: '540px', margin: '0 auto' }}>
          Find auspicious dates for your most important life events &mdash; powered by Panchang &amp; Nakshatra rules
        </p>
      </div>

      {/* Form card */}
      <div className="bh-fade-up-1" style={card}>

        {/* Event type selector */}
        <SectionTitle>Select Event Type</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {EVENT_TYPES.map(ev => (
            <button
              key={ev.key}
              onClick={() => setEventType(ev.key)}
              style={{
                background: eventType === ev.key
                  ? `linear-gradient(135deg, ${GOLD}22, ${VIO}18)`
                  : 'var(--bg-input)',
                border: eventType === ev.key ? `1px solid ${GOLD}60` : '1px solid var(--border)',
                borderRadius: 12, padding: '0.65rem 0.5rem',
                cursor: 'pointer', textAlign: 'center',
                transition: 'border-color 0.2s, background 0.2s',
                outline: 'none',
              }}
            >
              <div style={{ fontSize: '1.4rem', marginBottom: '0.25rem' }}>{ev.icon}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: eventType === ev.key ? GOLD : 'var(--text-muted)' }}>{ev.label}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.5px', marginTop: '0.15rem' }}>{ev.sub}</div>
            </button>
          ))}
        </div>

        {/* City search */}
        <div style={{ marginBottom: '1rem' }}>
          <CitySearch
            onSelect={pickCity}
            label="City / Location (auto-fills lat, lon, timezone)"
            placeholder="Search any city worldwide…"
            labelStyle={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '0.35rem' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div>
            <label style={lbl}>Latitude</label>
            <input type="number" step="0.0001" value={lat} onChange={e => setLat(e.target.value)} placeholder="e.g. 28.6139" style={inp} />
          </div>
          <div>
            <label style={lbl}>Longitude</label>
            <input type="number" step="0.0001" value={lon} onChange={e => setLon(e.target.value)} placeholder="e.g. 77.2090" style={inp} />
          </div>
          <div>
            <label style={lbl}>Timezone</label>
            <input type="text" value={tz} onChange={e => setTz(e.target.value)} placeholder="Asia/Kolkata" style={inp} />
          </div>
        </div>

        {/* Date range */}
        <div style={{ height: 1, background: 'var(--border)', margin: '0.25rem 0 1.25rem' }} />
        <SectionTitle>Date Range</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.5rem' }}>
          <div>
            <label style={lbl}>Start Date</label>
            <input type="date" value={startDate} onChange={e => handleStartChange(e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>End Date &nbsp;<span style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--text-dim)' }}>(max 90 days)</span></label>
            <input
              type="date" value={endDate}
              min={startDate}
              max={(() => { const s = new Date(startDate); s.setDate(s.getDate() + 90); return s.toISOString().slice(0,10) })()}
              onChange={e => setEndDate(e.target.value)}
              style={inp}
            />
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(229,57,53,0.08)', border: '1px solid rgba(229,57,53,0.3)', borderRadius: 10, padding: '0.7rem 0.9rem', marginTop: '1rem', fontSize: '0.82rem', color: '#EF9A9A' }}>
            {error}
          </div>
        )}

        <button
          onClick={compute}
          disabled={loading}
          style={{
            width: '100%', marginTop: '1.25rem',
            background: loading ? 'rgba(223,168,79,0.3)' : 'linear-gradient(135deg,#F2CB84 0%,#DFA84F 42%,#A8752B 100%)',
            color: '#1C1205', border: 'none', borderRadius: 999, padding: '0.9rem',
            fontSize: '0.92rem', fontWeight: 600, letterSpacing: '0.02em',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 8px 28px rgba(223,168,79,0.28)',
          }}>
          {loading ? 'Computing Muhurats…' : 'Find Auspicious Muhurats 🕰️'}
        </button>
      </div>

      {/* About box (shown before results) */}
      {!result && !loading && (
        <div className="bh-fade-up-2" style={{ ...card, padding: '1rem 1.3rem' }}>
          <SectionTitle>About Muhurat</SectionTitle>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', lineHeight: 1.8, margin: 0 }}>
            A <strong style={{ color: GOLD_L }}>Muhurat</strong> is a classically auspicious time window selected by examining the five limbs of the Panchang &mdash; <strong style={{ color: GOLD_L }}>Tithi</strong> (lunar day), <strong style={{ color: GOLD_L }}>Nakshatra</strong> (Moon&rsquo;s asterism), <strong style={{ color: GOLD_L }}>Vara</strong> (weekday), <strong style={{ color: GOLD_L }}>Yoga</strong> (Sun-Moon combination), and <strong style={{ color: GOLD_L }}>Karana</strong> (half-tithi). Each event type &mdash; marriage, housewarming, travel, business &mdash; has a unique set of favourable and unfavourable combinations. Scores are computed from first principles using Swiss Ephemeris positions, ensuring arc-second accuracy.
          </p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div id="muhurat-results">
          {/* Summary badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {result.label}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                {startDate} &ndash; {endDate}
              </div>
            </div>
            <div style={{
              background: `${GOLD}12`, border: `1px solid ${GOLD}30`,
              borderRadius: 12, padding: '0.5rem 1rem',
              fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', color: GOLD,
              fontWeight: 600, letterSpacing: '0.5px',
            }}>
              {result.count} auspicious date{result.count !== 1 ? 's' : ''} found
            </div>
          </div>

          {result.count === 0 ? (
            <div style={{ ...card, textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🕰️</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No auspicious dates found</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: 0 }}>
                Try extending the date range, or check back during Shukla Paksha (waxing moon fortnight).
              </p>
            </div>
          ) : (
            result.muhurats.map((item, i) => (
              <MuhuratCard key={item.date} item={item} index={i} />
            ))
          )}

          {/* CTA */}
          <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem' }}>
            <div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.66rem', color: GOLD, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                Get the full daily Panchang
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', margin: 0 }}>
                Check all five limbs in detail for any day with the Panchang tool.
              </p>
            </div>
            <Link to="/panchang" style={{
              background: 'linear-gradient(135deg,#F2CB84 0%,#DFA84F 42%,#A8752B 100%)',
              color: '#1C1205', fontSize: '0.82rem', fontWeight: 600,
              padding: '0.65rem 1.5rem', borderRadius: 999,
              boxShadow: '0 8px 28px rgba(223,168,79,0.28)', textDecoration: 'none',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>Daily Panchang &rarr;</Link>
          </div>
        </div>
      )}
    </div>
  )
}
