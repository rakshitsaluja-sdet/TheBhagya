import { useState } from 'react'
import { Link } from 'react-router-dom'
import { computePanchang } from '../hooks/useApi'

const GOLD   = '#DFA84F'
const GOLD_L = '#F2CB84'

// ── City presets ───────────────────────────────────────────────────────────────
const CITIES = [
  { name: 'Mumbai',      lat: 19.076,  lon: 72.878,  tz: 'Asia/Kolkata' },
  { name: 'Delhi',       lat: 28.614,  lon: 77.209,  tz: 'Asia/Kolkata' },
  { name: 'Bangalore',   lat: 12.972,  lon: 77.595,  tz: 'Asia/Kolkata' },
  { name: 'Chennai',     lat: 13.083,  lon: 80.271,  tz: 'Asia/Kolkata' },
  { name: 'Kolkata',     lat: 22.573,  lon: 88.364,  tz: 'Asia/Kolkata' },
  { name: 'Hyderabad',   lat: 17.385,  lon: 78.487,  tz: 'Asia/Kolkata' },
  { name: 'Pune',        lat: 18.520,  lon: 73.857,  tz: 'Asia/Kolkata' },
  { name: 'Ahmedabad',   lat: 23.023,  lon: 72.571,  tz: 'Asia/Kolkata' },
  { name: 'Jaipur',      lat: 26.912,  lon: 75.787,  tz: 'Asia/Kolkata' },
  { name: 'Lucknow',     lat: 26.847,  lon: 80.946,  tz: 'Asia/Kolkata' },
  { name: 'Kanpur',      lat: 26.450,  lon: 80.332,  tz: 'Asia/Kolkata' },
  { name: 'Chandigarh',  lat: 30.733,  lon: 76.779,  tz: 'Asia/Kolkata' },
  { name: 'Bhopal',      lat: 23.259,  lon: 77.413,  tz: 'Asia/Kolkata' },
  { name: 'Patna',       lat: 25.594,  lon: 85.138,  tz: 'Asia/Kolkata' },
  { name: 'Dubai',       lat: 25.205,  lon: 55.271,  tz: 'Asia/Dubai' },
  { name: 'Singapore',   lat: 1.352,   lon: 103.820, tz: 'Asia/Singapore' },
  { name: 'London',      lat: 51.507,  lon: -0.128,  tz: 'Europe/London' },
  { name: 'New York',    lat: 40.713,  lon: -74.006, tz: 'America/New_York' },
  { name: 'Toronto',     lat: 43.653,  lon: -79.383, tz: 'America/Toronto' },
  { name: 'Sydney',      lat: -33.869, lon: 151.209, tz: 'Australia/Sydney' },
]

// Today's date in YYYY-MM-DD (local)
const todayStr = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const QUALITY_COLOR = {
  auspicious:   '#43A047',
  good:         '#DFA84F',
  neutral:      '#8B6FE8',
  inauspicious: '#E53935',
}

const QUALITY_LABEL = {
  auspicious:   'Auspicious',
  good:         'Good',
  neutral:      'Neutral',
  inauspicious: 'Inauspicious',
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function QualityBadge({ quality }) {
  const color = QUALITY_COLOR[quality] || GOLD
  const label = QUALITY_LABEL[quality] || quality
  return (
    <span style={{
      fontSize: '0.66rem', fontWeight: 600, letterSpacing: '0.5px',
      color, background: `${color}18`,
      border: `1px solid ${color}44`, borderRadius: 999, padding: '0.18rem 0.6rem',
    }}>
      {label}
    </span>
  )
}

function CompletionBar({ pct }) {
  return (
    <div style={{ marginTop: '0.5rem', background: 'rgba(255,255,255,0.06)', borderRadius: 999, height: 4, overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${GOLD_L}, ${GOLD})`, borderRadius: 999, transition: 'width 0.4s ease' }} />
    </div>
  )
}

function LimbCard({ icon, label, hi, children }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 18, padding: '1.1rem 1.3rem',
      backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)',
      boxShadow: 'var(--shadow-card)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.7rem' }}>
        <div>
          <div style={{ fontSize: '0.64rem', color: GOLD, letterSpacing: '2.5px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>
            {icon} {label}
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)', marginTop: '0.1rem' }}>{hi}</div>
        </div>
      </div>
      {children}
    </div>
  )
}

function TimingCard({ icon, label, start, end, note }) {
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: 18, padding: '1rem 1.2rem',
      backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)',
      flex: '1 1 200px',
    }}>
      <div style={{ fontSize: '0.64rem', color: GOLD, letterSpacing: '2.5px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", marginBottom: '0.5rem' }}>
        {icon} {label}
      </div>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.1rem', letterSpacing: '-0.01em', color: 'var(--text-primary)', fontWeight: 600 }}>
        {start} &ndash; {end}
      </div>
      {note && <p style={{ fontSize: '0.76rem', color: 'var(--text-dim)', margin: '0.35rem 0 0', lineHeight: 1.55 }}>{note}</p>}
    </div>
  )
}

function RahuKaalCard({ data }) {
  return (
    <div style={{
      background: 'rgba(229,57,53,0.06)', border: '1px solid rgba(229,57,53,0.25)',
      borderRadius: 18, padding: '1rem 1.2rem',
      backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)',
      flex: '1 1 200px',
    }}>
      <div style={{ fontSize: '0.64rem', color: '#E53935', letterSpacing: '2.5px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", marginBottom: '0.5rem' }}>
        Rahu Kaal
      </div>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.1rem', letterSpacing: '-0.01em', color: '#ef9a9a', fontWeight: 600 }}>
        {data.start} &ndash; {data.end}
      </div>
      <p style={{ fontSize: '0.76rem', color: 'rgba(239,154,154,0.7)', margin: '0.35rem 0 0', lineHeight: 1.55 }}>{data.note}</p>
    </div>
  )
}

// ── Result Panel ───────────────────────────────────────────────────────────────

function ResultPanel({ result, onReset }) {
  const { tithi, nakshatra, vara, yoga, karana, sunrise, sunset, rahu_kaal, abhijit, brahma_muhurta, sun, moon, date } = result

  const displayDate = new Date(date + 'T12:00:00').toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="bh-fade-up-2">
      <button onClick={onReset} style={{
        background: 'transparent', border: '1px solid var(--border-hover)',
        color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer',
        marginBottom: '1.5rem', display: 'flex', alignItems: 'center',
        gap: '0.4rem', padding: '0.35rem 0.9rem', borderRadius: 999,
      }}>
        &larr; Choose different date / location
      </button>

      {/* Date header */}
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.64rem', color: GOLD, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
          Panchang for
        </div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.3rem', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          {displayDate}
        </div>
        <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
          Sunrise {sunrise} &middot; Sunset {sunset} &middot; Sidereal / Lahiri
        </div>
      </div>

      {/* Vara banner */}
      <div style={{
        background: `${GOLD}11`, border: `1px solid ${GOLD}33`,
        borderRadius: 18, padding: '0.85rem 1.2rem', marginBottom: '1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem',
        backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)',
      }}>
        <div>
          <div style={{ fontSize: '0.62rem', color: GOLD, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>Vara (Weekday)</div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.1rem', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text-primary)', marginTop: '0.15rem' }}>
            {vara.name} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>({vara.en})</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.1rem' }}>{vara.hi} &middot; Lord: {vara.lord}</div>
        </div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: '2rem', color: GOLD }}>&#9790;</div>
      </div>

      {/* Five Limbs Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>

        {/* Tithi */}
        <LimbCard icon="&#9790;" label="Tithi" hi="&#2340;&#2367;&#2925;&#2367;">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem' }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.15rem', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
              {tithi.paksha} {tithi.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: GOLD }}>#{tithi.index}</div>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
            <QualityBadge quality={tithi.quality} />
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Lord: {tithi.lord}</div>
          <CompletionBar pct={tithi.completion} />
          <div style={{ fontSize: '0.66rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>{tithi.completion}% elapsed</div>
        </LimbCard>

        {/* Nakshatra */}
        <LimbCard icon="&#9733;" label="Nakshatra" hi="&#2344;&#2325;&#2381;&#2359;&#2340;&#2381;&#2352;">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem' }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.15rem', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
              {nakshatra.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: GOLD }}>Pada {nakshatra.pada}</div>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.2rem' }}>Lord: {nakshatra.lord} &middot; Deity: {nakshatra.deity}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Symbol: {nakshatra.symbol}</div>
          <CompletionBar pct={nakshatra.completion} />
          <div style={{ fontSize: '0.66rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>{nakshatra.completion}% elapsed</div>
        </LimbCard>

        {/* Yoga */}
        <LimbCard icon="&#10022;" label="Yoga" hi="&#2351;&#2379;&#2327;">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem' }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.15rem', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
              {yoga.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: GOLD }}>#{yoga.index}</div>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
            <QualityBadge quality={yoga.quality} />
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Lord: {yoga.lord}</div>
          <CompletionBar pct={yoga.completion} />
          <div style={{ fontSize: '0.66rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>{yoga.completion}% elapsed</div>
        </LimbCard>

        {/* Karana */}
        <LimbCard icon="&#9680;" label="Karana" hi="&#2325;&#2352;&#2339;">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.25rem' }}>
            <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.15rem', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
              {karana.name}
            </div>
            <div style={{ fontSize: '0.75rem', color: GOLD }}>#{karana.index}</div>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.2rem' }}>
            Type: {karana.type.charAt(0).toUpperCase() + karana.type.slice(1)} &middot; Lord: {karana.lord}
          </div>
          {karana.note && (
            <div style={{ fontSize: '0.72rem', color: '#E53935', marginBottom: '0.15rem' }}>{karana.note}</div>
          )}
          <CompletionBar pct={karana.completion} />
          <div style={{ fontSize: '0.66rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>{karana.completion}% elapsed</div>
        </LimbCard>

      </div>

      {/* Timing Section */}
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.64rem', color: GOLD, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '0.85rem' }}>
        Auspicious Timing
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <TimingCard
          icon="&#9728;"
          label="Brahma Muhurta"
          start={brahma_muhurta.start}
          end={brahma_muhurta.end}
          note={brahma_muhurta.note}
        />
        <TimingCard
          icon="&#10022;"
          label="Abhijit Muhurat"
          start={abhijit.start}
          end={abhijit.end}
          note={abhijit.note}
        />
        <RahuKaalCard data={rahu_kaal} />
      </div>

      {/* Planetary context */}
      <div style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: 18, padding: '0.9rem 1.1rem', marginBottom: '1.5rem',
        backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)',
      }}>
        <div style={{ fontSize: '0.62rem', color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Planetary Context (Sidereal &middot; Lahiri)
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-dim)' }}>&#9728; Sun: </span>
            <span style={{ color: GOLD }}>{sun.sign} {sun.lon.toFixed(1)}&deg;</span>
          </div>
          <div style={{ fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-dim)' }}>&#9790; Moon: </span>
            <span style={{ color: GOLD }}>{moon.sign} {moon.lon.toFixed(1)}&deg;</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: 18, padding: '1.2rem 1.4rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '0.75rem',
        backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)',
      }}>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.66rem', color: GOLD, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Want your full birth chart?</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', margin: 0 }}>
            Get personalised Vimshottari Dasha, Lal Kitab remedies, and AI interpretation.
          </p>
        </div>
        <Link to='/chart/new' style={{
          background: 'linear-gradient(135deg,#F2CB84 0%,#DFA84F 42%,#A8752B 100%)',
          color: '#1C1205', fontSize: '0.82rem', fontWeight: 600,
          letterSpacing: '0.02em', padding: '0.65rem 1.5rem', borderRadius: 999,
          boxShadow: '0 8px 28px rgba(223,168,79,0.28)', textDecoration: 'none',
          whiteSpace: 'nowrap', flexShrink: 0,
        }}>
          Free Chart &rarr;
        </Link>
      </div>
    </div>
  )
}

// ── Input styles ───────────────────────────────────────────────────────────────
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

// ── Main page ──────────────────────────────────────────────────────────────────

export default function Panchang() {
  const [step, setStep]       = useState('form')
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const [form, setForm] = useState({
    date: todayStr(), lat: '', lon: '', timezone: 'Asia/Kolkata', city: '',
  })

  function upd(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function applyCity(e) {
    const city = CITIES.find(c => c.name === e.target.value)
    if (city) {
      setForm(f => ({ ...f, city: city.name, lat: city.lat, lon: city.lon, timezone: city.tz }))
    }
  }

  async function compute() {
    if (!form.lat || !form.lon) { setError('Please select a city or enter latitude/longitude.'); return }
    if (!form.date)             { setError('Please select a date.'); return }
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await computePanchang({
        date: form.date, lat: parseFloat(form.lat),
        lon: parseFloat(form.lon), timezone: form.timezone,
      })
      setResult(res.data)
      setStep('result')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>

      {/* Header */}
      <div className="bh-fade-up" style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.66rem', color: 'var(--gold)', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Vedic Astrology &middot; Hindu Almanac
        </div>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(1.9rem, 4vw, 2.8rem)', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
          Panchang
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.7, maxWidth: '520px', margin: '0 auto' }}>
          The five limbs of the Vedic almanac &mdash; Tithi, Nakshatra, Vara, Yoga &amp; Karana &mdash; plus auspicious timings, computed with Swiss Ephemeris precision.
        </p>
      </div>

      {step === 'form' && (
        <>
          <div className="bh-fade-up-1" style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 18, padding: '1.75rem 2rem', marginBottom: '1.5rem',
            backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)',
            boxShadow: 'var(--shadow-card)',
          }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: GOLD, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '1.2rem' }}>
              Select Date &amp; Location
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={lbl}>City (auto-fill location)</label>
              <select value={form.city} onChange={applyCity} style={{ ...inp, cursor: 'pointer' }}>
                <option value=''>&#8212; Select a city or enter lat/lon manually &#8212;</option>
                {CITIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={lbl}>Date *</label>
              <input type='date' value={form.date} onChange={e => upd('date', e.target.value)} style={inp} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={lbl}>Latitude (N positive)</label>
                <input type='number' step='0.001' value={form.lat} onChange={e => upd('lat', e.target.value)} placeholder='e.g. 28.614' style={inp} />
              </div>
              <div>
                <label style={lbl}>Longitude (E positive)</label>
                <input type='number' step='0.001' value={form.lon} onChange={e => upd('lon', e.target.value)} placeholder='e.g. 77.209' style={inp} />
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={lbl}>Timezone</label>
              <input value={form.timezone} onChange={e => upd('timezone', e.target.value)} placeholder='Asia/Kolkata' style={inp} />
            </div>

            {error && (
              <div style={{ background: 'rgba(229,57,53,0.1)', border: '1px solid rgba(229,57,53,0.3)', borderRadius: 10, padding: '0.75rem 1rem', color: '#ef9a9a', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <button onClick={compute} disabled={loading} style={{
              width: '100%',
              background: loading ? 'rgba(223,168,79,0.4)' : 'linear-gradient(135deg,#F2CB84 0%,#DFA84F 42%,#A8752B 100%)',
              color: '#1C1205', border: 'none', borderRadius: 999, padding: '0.85rem',
              fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.02em',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 8px 28px rgba(223,168,79,0.28)',
            }}>
              {loading ? 'Computing Panchang…' : 'View Panchang →'}
            </button>
          </div>

          <div className="bh-fade-up-2" style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            borderRadius: 18, padding: '1.1rem 1.3rem',
            backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)',
          }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.66rem', color: GOLD, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              About Panchang
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', lineHeight: 1.75, margin: 0 }}>
              Panchang (&#2346;&#2327;&#2381;&#2330;&#2366;&#2327;) means &ldquo;five limbs&rdquo;. <strong style={{ color: GOLD_L }}>Tithi</strong> (lunar day) governs the spiritual quality of the day. <strong style={{ color: GOLD_L }}>Nakshatra</strong> (Moon&rsquo;s asterism) shapes its energy. <strong style={{ color: GOLD_L }}>Vara</strong> (weekday) sets the planetary lord. <strong style={{ color: GOLD_L }}>Yoga</strong> (Sun+Moon combination) indicates overall auspiciousness. <strong style={{ color: GOLD_L }}>Karana</strong> (half-tithi) guides action timing. All five together define the Muhurat &mdash; the quality of any given moment.
            </p>
          </div>
        </>
      )}

      {step === 'result' && result && (
        <ResultPanel result={result} onReset={() => { setStep('form'); setResult(null) }} />
      )}
    </div>
  )
}
