import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { createChart } from '../hooks/useApi'
import CitySearch from '../components/CitySearch'

const TIMEZONES = [
  'Asia/Kolkata', 'Asia/Karachi', 'Asia/Dhaka', 'Asia/Kathmandu',
  'America/Toronto', 'America/New_York', 'America/Chicago', 'America/Los_Angeles',
  'Europe/London', 'Europe/Berlin', 'Asia/Dubai', 'Asia/Singapore',
  'Australia/Sydney', 'Pacific/Auckland',
]

const s = {
  wrap: { maxWidth: '620px', margin: '3rem auto', padding: '0 1.5rem' },
  heading: {
    fontFamily: "'Fraunces', serif", fontWeight: 600, letterSpacing: '-0.02em',
    fontSize: 'clamp(1.9rem, 4vw, 2.6rem)', color: 'var(--text-primary)', marginBottom: '0.5rem',
  },
  sub: { color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '0.95rem' },
  card: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: '18px', padding: '2.5rem',
    backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)',
    boxShadow: 'var(--shadow-card)',
  },
  group: { marginBottom: '1.5rem' },
  labelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4rem' },
  label: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: '0.66rem',
    color: 'var(--text-dim)', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 500,
  },
  req:  { fontFamily: "'JetBrains Mono', monospace", fontSize: '0.62rem', letterSpacing: '1px', color: '#E05050' },
  opt:  { fontFamily: "'JetBrains Mono', monospace", fontSize: '0.62rem', letterSpacing: '1px', color: 'var(--text-dim)' },
  input: {
    width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '0.8rem 1rem', color: 'var(--text-primary)',
    fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s',
  },
  inputDisabled: {
    width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: '10px', padding: '0.8rem 1rem', color: 'var(--text-dim)',
    fontSize: '0.9rem', boxSizing: 'border-box', fontStyle: 'italic',
  },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  error: { color: '#E05050', fontSize: '0.85rem', marginTop: '1rem', padding: '0.75rem', background: 'rgba(224,80,80,0.08)', borderRadius: '10px', border: '1px solid rgba(224,80,80,0.2)' },
  btnRow: { display: 'flex', gap: '1rem', marginTop: '2rem' },
  hint: { fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.3rem' },
}

const FOCUS = 'var(--gold)'
const BLUR  = 'var(--border)'
const onFocus = e => e.target.style.borderColor = FOCUS
const onBlur  = e => e.target.style.borderColor = BLUR

export default function ChartForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const focus = searchParams.get('focus') || 'vedic'
  const [form, setForm] = useState({
    label: '', dob: '', tob: '', timezone: 'Asia/Kolkata',
    lat: '', lon: '', place_name: '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleCitySelect = (lat, lon, tz, name) => {
    setForm(f => ({
      ...f,
      lat: lat.toFixed(4),
      lon: lon.toFixed(4),
      timezone: tz,
      place_name: name,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.lat || !form.lon) { setError('Please select a place of birth from the suggestions.'); return }
    setError(''); setLoading(true)
    try {
      const chart = await createChart({ ...form, lat: parseFloat(form.lat), lon: parseFloat(form.lon), dasha_levels: 2 })
      navigate(`/chart/${chart.id}?focus=${focus}`)
    } catch (err) {
      setError(err.message || 'Something went wrong. Is the backend running?')
    } finally { setLoading(false) }
  }

  const coordsLocked = !!(form.lat && form.lon)

  return (
    <div style={s.wrap}>
      <div className="bh-fade-up">
        {focus === 'lalkitab' && (
          <div style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', background:'rgba(223,168,79,0.1)', border:'1px solid rgba(223,168,79,0.25)', borderRadius:'999px', padding:'0.3rem 1rem', marginBottom:'1rem', fontFamily:"'JetBrains Mono', monospace", fontSize:'0.68rem', letterSpacing:'2px', textTransform:'uppercase', color:'var(--gold)' }}>
            ◈ Lal Kitab Reading
          </div>
        )}
        <h1 style={s.heading}>{focus === 'lalkitab' ? 'Lal Kitab Chart' : 'Your Birth Chart'}</h1>
        <p style={s.sub}>{focus === 'lalkitab' ? 'Enter your birth details — we\'ll compute your house map, Pucca Ghar planets and personalised remedies.' : 'Enter your birth details for the most accurate reading.'}</p>
      </div>

      <form onSubmit={handleSubmit} className="bh-fade-up-1" style={s.card}>

        {/* NAME — optional, used for numerology */}
        <div style={s.group}>
          <div style={s.labelRow}>
            <span style={s.label}>YOUR NAME</span>
            <span style={s.opt}>optional · used for numerology</span>
          </div>
          <input style={s.input} placeholder="e.g. Arjun Sharma"
            value={form.label} onChange={e => set('label', e.target.value)}
            onFocus={onFocus} onBlur={onBlur}/>
        </div>

        {/* DOB + TOB */}
        <div className="chart-form-grid" style={{ ...s.group, ...s.row }}>
          <div>
            <div style={s.labelRow}>
              <span style={s.label}>DATE OF BIRTH</span>
              <span style={s.req}>* required</span>
            </div>
            <input style={s.input} type="date" required
              min="1900-01-01" max={new Date().toISOString().split('T')[0]}
              value={form.dob}
              onChange={e => {
                const val = e.target.value
                // Guard: reject if year portion is clearly wrong (>4 digits)
                if (val) {
                  const year = parseInt(val.split('-')[0], 10)
                  if (year > new Date().getFullYear() || year < 1900) return
                }
                set('dob', val)
              }}
              onFocus={onFocus} onBlur={onBlur}/>
          </div>
          <div>
            <div style={s.labelRow}>
              <span style={s.label}>TIME OF BIRTH</span>
              <span style={s.req}>* required</span>
            </div>
            <input style={s.input} type="time" required
              value={form.tob} onChange={e => set('tob', e.target.value)}
              onFocus={onFocus} onBlur={onBlur}/>
            <p style={s.hint}>24-hour format · critical for lagna accuracy</p>
          </div>
        </div>

        {/* PLACE — CitySearch autofill */}
        <div style={s.group}>
          <div style={s.labelRow}>
            <span style={s.label}>PLACE OF BIRTH</span>
            <span style={s.req}>* required</span>
          </div>
          <CitySearch
            onSelect={handleCitySelect}
            placeholder="e.g. New Delhi, India"
            inputStyle={{ fontSize: '0.95rem' }}
          />
        </div>

        {/* LAT / LON */}
        <div className="chart-form-grid" style={{ ...s.group, ...s.row }}>
          <div>
            <div style={s.labelRow}>
              <span style={s.label}>LATITUDE</span>
              <span style={s.opt}>{coordsLocked ? 'auto-filled' : 'or enter manually'}</span>
            </div>
            <input style={coordsLocked ? s.inputDisabled : s.input}
              type="number" step="0.0001" placeholder="auto from place name"
              value={form.lat} readOnly={coordsLocked}
              onChange={e => { if (!coordsLocked) set('lat', e.target.value) }}
              onFocus={coordsLocked ? undefined : onFocus}
              onBlur={coordsLocked ? undefined : onBlur}/>
          </div>
          <div>
            <div style={s.labelRow}>
              <span style={s.label}>LONGITUDE</span>
              <span style={s.opt}>{coordsLocked ? 'auto-filled' : 'or enter manually'}</span>
            </div>
            <input style={coordsLocked ? s.inputDisabled : s.input}
              type="number" step="0.0001" placeholder="auto from place name"
              value={form.lon} readOnly={coordsLocked}
              onChange={e => { if (!coordsLocked) set('lon', e.target.value) }}
              onFocus={coordsLocked ? undefined : onFocus}
              onBlur={coordsLocked ? undefined : onBlur}/>
          </div>
        </div>
        {coordsLocked && (
          <p style={{ ...s.hint, marginTop: '-0.75rem', marginBottom: '1rem' }}>
            Coordinates set automatically.{' '}
            <span style={{ color: 'var(--gold)', cursor: 'pointer' }}
              onClick={() => setForm(f => ({ ...f, lat: '', lon: '', place_name: '' }))}>
              Edit manually
            </span>
          </p>
        )}

        {/* TIMEZONE */}
        <div style={s.group}>
          <div style={s.labelRow}>
            <span style={s.label}>TIMEZONE</span>
            <span style={s.req}>* required</span>
          </div>
          <select style={{ ...s.input, appearance: 'none' }} required
            value={form.timezone} onChange={e => set('timezone', e.target.value)}>
            {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
          </select>
        </div>

        {error && <div style={s.error}>⚠ {error}</div>}

        <div style={s.btnRow}>
          <button type="submit" className="btn-primary" disabled={loading}
            style={{
              flex: 1, opacity: loading ? 0.7 : 1,
              background: 'linear-gradient(135deg,#F2CB84 0%,#DFA84F 42%,#A8752B 100%)',
              color: '#1C1205', fontWeight: 600, border: 'none', borderRadius: '999px',
              boxShadow: '0 8px 28px rgba(223,168,79,0.28)',
            }}>
            {loading ? '✦ Computing your stars...' : '✦ Reveal My Destiny'}
          </button>
        </div>

      </form>
    </div>
  )
}
