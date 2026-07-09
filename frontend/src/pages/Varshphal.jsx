import { useState } from 'react'
import { Link } from 'react-router-dom'
import { computeVarshphal } from '../hooks/useApi'

const GOLD   = '#DFA84F'
const GOLD_L = '#F2CB84'
const VIO    = '#8B6FE8'

// ── Static data ────────────────────────────────────────────────────────────────

const CITIES = [
  { name: 'New Delhi',   lat: 28.6139, lon: 77.2090, tz: 'Asia/Kolkata' },
  { name: 'Mumbai',      lat: 19.0760, lon: 72.8777, tz: 'Asia/Kolkata' },
  { name: 'Bengaluru',   lat: 12.9716, lon: 77.5946, tz: 'Asia/Kolkata' },
  { name: 'Kolkata',     lat: 22.5726, lon: 88.3639, tz: 'Asia/Kolkata' },
  { name: 'Chennai',     lat: 13.0827, lon: 80.2707, tz: 'Asia/Kolkata' },
  { name: 'Hyderabad',   lat: 17.3850, lon: 78.4867, tz: 'Asia/Kolkata' },
  { name: 'Pune',        lat: 18.5204, lon: 73.8567, tz: 'Asia/Kolkata' },
  { name: 'Ahmedabad',   lat: 23.0225, lon: 72.5714, tz: 'Asia/Kolkata' },
  { name: 'Jaipur',      lat: 26.9124, lon: 75.7873, tz: 'Asia/Kolkata' },
  { name: 'Kanpur',      lat: 26.4499, lon: 80.3319, tz: 'Asia/Kolkata' },
  { name: 'Lucknow',     lat: 26.8467, lon: 80.9462, tz: 'Asia/Kolkata' },
  { name: 'Chandigarh',  lat: 30.7333, lon: 76.7794, tz: 'Asia/Kolkata' },
  { name: 'Dubai',       lat: 25.2048, lon: 55.2708, tz: 'Asia/Dubai' },
  { name: 'Singapore',   lat: 1.3521,  lon: 103.8198, tz: 'Asia/Singapore' },
  { name: 'London',      lat: 51.5074, lon: -0.1278,  tz: 'Europe/London' },
  { name: 'Toronto',     lat: 43.6532, lon: -79.3832, tz: 'America/Toronto' },
  { name: 'New York',    lat: 40.7128, lon: -74.0060, tz: 'America/New_York' },
  { name: 'Sydney',      lat: -33.8688, lon: 151.2093, tz: 'Australia/Sydney' },
]

const SIGN_LORDS = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon',
  Leo: 'Sun', Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Mars',
  Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter',
}

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

const VARSHA_PATI_MEANING = {
  Sun:     'Authority, government matters, and health dominate the year. Father relationships prominent.',
  Moon:    'Emotions, home, and mother figure strongly. Inner life and creativity heightened.',
  Mars:    'Action, property, and ambition drive the year. Energy high; manage aggression.',
  Mercury: 'Communication, travel, business, and education are focal themes.',
  Jupiter: 'Expansion, wisdom, and blessings characterise the year. Favourable for most endeavours.',
  Venus:   'Love, beauty, comfort, and creative pursuits colour the year positively.',
  Saturn:  'Discipline, delays, and karma-clearing mark the year. Hard work yields slow but solid results.',
}

const SIGN_MEANING = {
  Aries: 'Initiative, courage, and new beginnings.',
  Taurus: 'Stability, material comfort, and patience.',
  Gemini: 'Communication, duality, and adaptability.',
  Cancer: 'Emotions, home, and nurturing instincts.',
  Leo: 'Creativity, leadership, and self-expression.',
  Virgo: 'Service, analysis, and attention to detail.',
  Libra: 'Balance, partnerships, and harmony.',
  Scorpio: 'Transformation, depth, and regeneration.',
  Sagittarius: 'Expansion, philosophy, and higher wisdom.',
  Capricorn: 'Ambition, structure, and long-term goals.',
  Aquarius: 'Innovation, community, and independence.',
  Pisces: 'Intuition, spirituality, and dissolution of ego.',
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

function PlanetRow({ name, data }) {
  const color = PLANET_COLOR[name] || GOLD
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '120px 1fr 1fr 1fr 60px',
      gap: '0.5rem', alignItems: 'center',
      padding: '0.6rem 0.75rem', borderRadius: 10,
      background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
      marginBottom: '0.35rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ color, fontSize: '1.1rem' }} dangerouslySetInnerHTML={{ __html: PLANET_SYMBOL[name] || '' }} />
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color }}>{name}</span>
      </div>
      <div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{data.sign}</div>
        <div style={{ fontSize: '0.62rem', color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace" }}>{data.degree.toFixed(2)}&deg;</div>
      </div>
      <div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{data.nakshatra}</div>
        <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>Pada {data.pada}</div>
      </div>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{data.sign_lord}</div>
      <div style={{
        textAlign: 'center', fontFamily: "'JetBrains Mono', monospace",
        fontSize: '0.75rem', fontWeight: 700, color: GOLD,
        background: `${GOLD}12`, border: `1px solid ${GOLD}25`,
        borderRadius: 8, padding: '0.25rem 0.4rem',
      }}>{data.house}</div>
    </div>
  )
}

function InfoChip({ label, value, color }) {
  return (
    <div style={{
      background: `${color || GOLD}0D`, border: `1px solid ${color || GOLD}28`,
      borderRadius: 12, padding: '0.65rem 0.9rem',
    }}>
      <div style={{ fontSize: '0.58rem', color: color || GOLD, letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", marginBottom: '0.2rem' }}>{label}</div>
      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</div>
    </div>
  )
}

// ── Result panel ───────────────────────────────────────────────────────────────

function ResultPanel({ data }) {
  const { target_year, age, solar_return, varsha_lagna, muntha, varsha_pati, tri_pataki, planets } = data

  const planetOrder = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu']

  return (
    <div>
      {/* Solar Return Banner */}
      <div style={{
        ...card,
        background: `linear-gradient(135deg, rgba(223,168,79,0.08), rgba(139,111,232,0.06))`,
        border: `1px solid ${GOLD}30`,
      }}>
        <SectionTitle>&#9733; Varsha Pravesh &mdash; Solar Return {target_year}</SectionTitle>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'baseline', marginBottom: '0.75rem' }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 600, color: GOLD_L, lineHeight: 1.1 }}>
            {solar_return.date}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            {solar_return.time} &nbsp;&middot;&nbsp; {solar_return.weekday}
          </div>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          Age {age} &nbsp;&middot;&nbsp; Sun returns to natal longitude at this exact moment, beginning the annual cycle
        </div>
      </div>

      {/* Varsha Lagna + Muntha + Varsha Pati */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '0.7rem', marginBottom: '1rem' }}>
        <InfoChip label="Varsha Lagna" value={`${varsha_lagna.sign} ${varsha_lagna.degree}&deg;`} color={GOLD} />
        <InfoChip label="Lagna Lord" value={varsha_lagna.lord} color={PLANET_COLOR[varsha_lagna.lord]} />
        <InfoChip label="Muntha" value={`${muntha.sign} (H${muntha.house})`} color={VIO} />
        <InfoChip label="Muntha Lord" value={muntha.lord} color={PLANET_COLOR[muntha.lord]} />
        <InfoChip label="Varsha Pati" value={varsha_pati} color={PLANET_COLOR[varsha_pati]} />
        <InfoChip label="Year Lord Sign" value={planets[varsha_pati]?.sign || '—'} color={PLANET_COLOR[varsha_pati]} />
      </div>

      {/* Varsha Lagna meaning */}
      <div style={{ ...card, padding: '1rem 1.2rem', marginBottom: '1rem' }}>
        <SectionTitle>Varsha Lagna &mdash; {varsha_lagna.sign}</SectionTitle>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.75, margin: '0 0 0.6rem' }}>
          {SIGN_MEANING[varsha_lagna.sign]}
          {' '}The annual ascendant sets the tone for the year &mdash; its lord, <strong style={{ color: PLANET_COLOR[varsha_lagna.lord] }}>{varsha_lagna.lord}</strong>, placed in {planets[varsha_lagna.lord]?.sign} (House {planets[varsha_lagna.lord]?.house}), is the key planet to watch.
        </p>
      </div>

      {/* Varsha Pati interpretation */}
      <div style={{ ...card, padding: '1rem 1.2rem', marginBottom: '1rem', borderColor: `${PLANET_COLOR[varsha_pati]}30` }}>
        <SectionTitle color={PLANET_COLOR[varsha_pati]}>Varsha Pati &mdash; {varsha_pati} (Year Lord)</SectionTitle>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.75, margin: 0 }}>
          {VARSHA_PATI_MEANING[varsha_pati]}
          {' '}{varsha_pati} is positioned in <strong style={{ color: PLANET_COLOR[varsha_pati] }}>{planets[varsha_pati]?.sign}</strong> in House {planets[varsha_pati]?.house} of the Varsha chart.
        </p>
      </div>

      {/* Tri-Pataki Chakra */}
      <div style={{ ...card, padding: '1rem 1.2rem', marginBottom: '1rem' }}>
        <SectionTitle color={VIO}>Tri-Pataki Chakra &mdash; Kendra Trines</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
          {[
            { pos: '1st (Lagna)', sign: tri_pataki.sign_1, lord: tri_pataki.lord_1 },
            { pos: '5th (Putra)', sign: tri_pataki.sign_5, lord: tri_pataki.lord_5 },
            { pos: '9th (Dharma)', sign: tri_pataki.sign_9, lord: tri_pataki.lord_9 },
          ].map(t => (
            <div key={t.pos} style={{ background: `${VIO}0A`, border: `1px solid ${VIO}20`, borderRadius: 10, padding: '0.6rem 0.8rem' }}>
              <div style={{ fontSize: '0.6rem', color: VIO, letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", marginBottom: '0.2rem' }}>{t.pos}</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>{t.sign}</div>
              <div style={{ fontSize: '0.72rem', color: PLANET_COLOR[t.lord] }}>{t.lord}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Planet positions */}
      <div style={card}>
        <SectionTitle>Graha Positions in Varsha Chart</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 1fr 60px', gap: '0.5rem', padding: '0 0.75rem 0.5rem', marginBottom: '0.25rem' }}>
          {['Planet', 'Sign', 'Nakshatra', 'Lord', 'H'].map(h => (
            <div key={h} style={{ fontSize: '0.6rem', color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1.5px', textTransform: 'uppercase' }}>{h}</div>
          ))}
        </div>
        {planetOrder.map(p => planets[p] ? <PlanetRow key={p} name={p} data={planets[p]} /> : null)}
      </div>

      {/* Muntha detail */}
      <div style={{ ...card, padding: '1rem 1.2rem', marginBottom: '1rem', borderColor: `${VIO}30` }}>
        <SectionTitle color={VIO}>Muntha &mdash; Annual Progression Point</SectionTitle>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', lineHeight: 1.7, margin: 0 }}>
          The Muntha advances one sign per year from the natal Lagna.
          This year it falls in <strong style={{ color: VIO }}>{muntha.sign}</strong> (House {muntha.house} of the Varsha chart), lorded by <strong style={{ color: PLANET_COLOR[muntha.lord] }}>{muntha.lord}</strong>.
          Muntha&rsquo;s house placement reveals which life area receives special focus and activation during the year.
        </p>
      </div>

      {/* CTA */}
      <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.66rem', color: GOLD, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
            Get the full natal chart too
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', margin: 0 }}>
            Your natal Kundali gives the base chart that Varshphal overlays &mdash; dashas, ashtakavarga, and yogas complete the picture.
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

export default function Varshphal() {
  const currentYear = new Date().getFullYear()

  const [birthDate,  setBirthDate]  = useState('')
  const [birthTime,  setBirthTime]  = useState('12:00')
  const [birthCity,  setBirthCity]  = useState('')
  const [birthLat,   setBirthLat]   = useState('')
  const [birthLon,   setBirthLon]   = useState('')
  const [birthTz,    setBirthTz]    = useState('Asia/Kolkata')
  const [lagnaLon,   setLagnaLon]   = useState('')
  const [targetYear, setTargetYear] = useState(String(currentYear))
  const [queryCity,  setQueryCity]  = useState('')
  const [queryLat,   setQueryLat]   = useState('')
  const [queryLon,   setQueryLon]   = useState('')
  const [queryTz,    setQueryTz]    = useState('Asia/Kolkata')
  const [sameAsBirth,setSameAsBirth]= useState(true)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [result,     setResult]     = useState(null)

  function pickBirthCity(name) {
    const c = CITIES.find(x => x.name === name)
    if (!c) return
    setBirthCity(name)
    setBirthLat(String(c.lat))
    setBirthLon(String(c.lon))
    setBirthTz(c.tz)
    if (sameAsBirth) { setQueryLat(String(c.lat)); setQueryLon(String(c.lon)); setQueryTz(c.tz) }
  }

  function pickQueryCity(name) {
    const c = CITIES.find(x => x.name === name)
    if (!c) return
    setQueryCity(name)
    setQueryLat(String(c.lat))
    setQueryLon(String(c.lon))
    setQueryTz(c.tz)
  }

  async function compute() {
    if (!birthDate || !birthLat || !birthLon || !lagnaLon) {
      setError('Please fill birth date, birth location, and natal lagna longitude.')
      return
    }
    setError('')
    setLoading(true)
    setResult(null)
    try {
      const payload = {
        birth_date:      birthDate,
        birth_time:      birthTime + ':00',
        birth_tz:        birthTz,
        birth_lat:       parseFloat(birthLat),
        birth_lon:       parseFloat(birthLon),
        birth_lagna_lon: parseFloat(lagnaLon),
        target_year:     parseInt(targetYear),
        query_lat:       sameAsBirth ? parseFloat(birthLat) : (queryLat ? parseFloat(queryLat) : null),
        query_lon:       sameAsBirth ? parseFloat(birthLon) : (queryLon ? parseFloat(queryLon) : null),
        query_tz:        sameAsBirth ? birthTz : queryTz,
      }
      const res = await computeVarshphal(payload)
      setResult(res.data)
      setTimeout(() => document.getElementById('varshphal-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
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
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.66rem', color: GOLD, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Vedic Astrology &middot; Tajika System
        </div>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(1.9rem, 4vw, 2.8rem)', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
          Varshphal
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.7, maxWidth: '520px', margin: '0 auto' }}>
          Annual Horoscope &mdash; computed from the exact moment the Sun returns to its natal sidereal longitude (Varsha Pravesh), giving you Varsha Lagna, Muntha, Varsha Pati, and full planetary positions for the year.
        </p>
      </div>

      {/* Form */}
      <div className="bh-fade-up-1" style={card}>
        <SectionTitle>Birth Details</SectionTitle>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={lbl}>Date of Birth *</label>
            <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} style={inp} />
          </div>
          <div>
            <label style={lbl}>Time of Birth *</label>
            <input type="time" value={birthTime} onChange={e => setBirthTime(e.target.value)} style={inp} />
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={lbl}>Birth City</label>
          <select value={birthCity} onChange={e => pickBirthCity(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
            <option value=''>&#8212; Select city or enter manually &#8212;</option>
            {CITIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <label style={lbl}>Latitude *</label>
            <input type="number" step="0.0001" value={birthLat} onChange={e => setBirthLat(e.target.value)} placeholder="e.g. 26.4499" style={inp} />
          </div>
          <div>
            <label style={lbl}>Longitude *</label>
            <input type="number" step="0.0001" value={birthLon} onChange={e => setBirthLon(e.target.value)} placeholder="e.g. 80.3319" style={inp} />
          </div>
          <div>
            <label style={lbl}>Timezone</label>
            <input type="text" value={birthTz} onChange={e => setBirthTz(e.target.value)} placeholder="Asia/Kolkata" style={inp} />
          </div>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={lbl}>Natal Lagna Longitude * &nbsp;<span style={{ color: 'var(--text-dim)', textTransform: 'none', letterSpacing: 0 }}>(sidereal, from your Kundali)</span></label>
          <input type="number" step="0.01" min="0" max="360" value={lagnaLon}
            onChange={e => setLagnaLon(e.target.value)}
            placeholder="e.g. 195.65  (Libra 15.65&deg;)"
            style={inp} />
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>
            Find this in your <Link to='/chart/new' style={{ color: GOLD }}>Free Kundali</Link> chart result &rarr; Lagna section. Example: Libra 15.65&deg; = 180 + 15.65 = 195.65
          </div>
        </div>

        {/* Target year */}
        <div style={{ height: 1, background: 'var(--border)', margin: '0.5rem 0 1.25rem' }} />
        <SectionTitle>Annual Period</SectionTitle>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <label style={lbl}>Target Year *</label>
            <input type="number" min="1950" max="2075" value={targetYear} onChange={e => setTargetYear(e.target.value)} style={inp} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.1rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
              Year runs from your solar return date until the next year&apos;s solar return.
            </div>
          </div>
        </div>

        {/* Current location */}
        <div style={{ height: 1, background: 'var(--border)', margin: '0.5rem 0 1.25rem' }} />
        <SectionTitle>Current Location (for Varsha Lagna)</SectionTitle>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={sameAsBirth} onChange={e => setSameAsBirth(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: GOLD }} />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Same as birth location</span>
        </label>

        {!sameAsBirth && (
          <div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={lbl}>Current City</label>
              <select value={queryCity} onChange={e => pickQueryCity(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                <option value=''>&#8212; Select city or enter manually &#8212;</option>
                {CITIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={lbl}>Latitude</label>
                <input type="number" step="0.0001" value={queryLat} onChange={e => setQueryLat(e.target.value)} placeholder="Latitude" style={inp} />
              </div>
              <div>
                <label style={lbl}>Longitude</label>
                <input type="number" step="0.0001" value={queryLon} onChange={e => setQueryLon(e.target.value)} placeholder="Longitude" style={inp} />
              </div>
              <div>
                <label style={lbl}>Timezone</label>
                <input type="text" value={queryTz} onChange={e => setQueryTz(e.target.value)} placeholder="Asia/Kolkata" style={inp} />
              </div>
            </div>
          </div>
        )}

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
          {loading ? 'Computing Solar Return…' : 'Compute Varshphal ✶'}
        </button>
      </div>

      {/* Info box */}
      {!result && !loading && (
        <div className="bh-fade-up-2" style={{ ...card, padding: '1rem 1.3rem' }}>
          <SectionTitle>About Varshphal</SectionTitle>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', lineHeight: 1.8, margin: 0 }}>
            Varshphal (&ldquo;annual fruit&rdquo;) is a branch of Jyotish, derived from the Tajika system, that analyses each year of life through the <strong style={{ color: GOLD_L }}>solar return chart</strong> &mdash; cast for the exact moment the Sun returns to its natal sidereal longitude. The <strong style={{ color: GOLD_L }}>Varsha Lagna</strong> (annual ascendant) sets the year&apos;s framework. The <strong style={{ color: GOLD_L }}>Muntha</strong> (lunar year progressor) shows which house is activated. The <strong style={{ color: GOLD_L }}>Varsha Pati</strong> (year lord, determined by hora at solar return) is the planet that governs the entire year&apos;s quality.
          </p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div id="varshphal-result">
          <ResultPanel data={result} />
        </div>
      )}
    </div>
  )
}
