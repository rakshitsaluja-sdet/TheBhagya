import { useState } from 'react'
import { Link } from 'react-router-dom'
import { computeDoshas } from '../hooks/useApi'

const GOLD   = '#C9933A'
const GOLD_L = '#E8B96A'

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

// ── Sub-components ─────────────────────────────────────────────────────────────

function SeverityBadge({ severity }) {
  const map = {
    high:      { color: '#E53935', bg: 'rgba(229,57,53,0.12)',   label: 'High Severity' },
    medium:    { color: '#E07B39', bg: 'rgba(224,123,57,0.12)',  label: 'Medium Severity' },
    low:       { color: GOLD_L,    bg: 'rgba(232,185,106,0.12)', label: 'Low Severity' },
    reduced:   { color: GOLD,      bg: 'rgba(201,147,58,0.12)',  label: 'Reduced (Partial Cancellation)' },
    cancelled: { color: '#43A047', bg: 'rgba(67,160,71,0.12)',   label: 'Cancelled by Cancellations' },
    none:      { color: '#43A047', bg: 'rgba(67,160,71,0.12)',   label: 'Not Present' },
  }
  const cfg = map[severity] || map.none
  return (
    <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.5px', color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}44`, borderRadius: '12px', padding: '0.2rem 0.6rem' }}>
      {cfg.label}
    </span>
  )
}

function RemedyList({ remedies, title }) {
  const [open, setOpen] = useState(false)
  if (!remedies?.length) return null
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.9rem 1.1rem', marginTop: '1rem' }}>
      <button onClick={() => setOpen(o => !o)} style={{ background: 'none', border: 'none', color: GOLD, fontFamily: "'Cinzel', serif", fontSize: '0.78rem', letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', width: '100%', padding: 0 }}>
        <span>{title}</span><span>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <ul style={{ margin: '0.75rem 0 0', paddingLeft: '1.2rem', color: 'var(--text-muted)', fontSize: '0.84rem', lineHeight: 1.9 }}>
          {remedies.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
      )}
    </div>
  )
}

function MangalPanel({ data }) {
  if (!data) return null
  const { present, severity, cancellations, from_lagna, from_moon, from_venus, mars_position, lagna_position, house_effect, partner_note, remedies } = data

  const statusColor = present ? (severity === 'high' ? '#E53935' : severity === 'cancelled' ? '#43A047' : '#E07B39') : '#43A047'
  const statusIcon  = present ? (severity === 'cancelled' ? '✓' : '⚠') : '✓'

  return (
    <div>
      {/* Status banner */}
      <div style={{ background: present && severity !== 'cancelled' ? 'rgba(229,57,53,0.08)' : 'rgba(67,160,71,0.08)', border: `1px solid ${statusColor}33`, borderRadius: '12px', padding: '1.1rem 1.3rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <div style={{ fontSize: '1.5rem', color: statusColor, lineHeight: 1, flexShrink: 0 }}>{statusIcon}</div>
        <div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: '1rem', color: statusColor, fontWeight: 700, marginBottom: '0.3rem' }}>
            {present ? 'Mangal Dosha Present' : 'No Mangal Dosha'}
          </div>
          <SeverityBadge severity={severity} />
          {present && house_effect && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.75, margin: '0.6rem 0 0' }}>{house_effect}</p>
          )}
          {!present && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.75, margin: '0.5rem 0 0' }}>
              Mars does not occupy any of the sensitive houses (1, 2, 4, 7, 8, 12) from your Lagna, Moon, or Venus. No Mangal Dosha is indicated.
            </p>
          )}
        </div>
      </div>

      {/* Position table */}
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.9rem 1.1rem', marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.68rem', color: GOLD, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'Cinzel', serif", marginBottom: '0.75rem' }}>Position Analysis</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
          {[
            { label: 'From Lagna', data: from_lagna },
            { label: 'From Moon',  data: from_moon  },
            { label: 'From Venus', data: from_venus  },
          ].map(({ label, data: d }) => (
            <div key={label} style={{ background: d.has_dosha ? 'rgba(229,57,53,0.06)' : 'var(--bg-card)', border: `1px solid ${d.has_dosha ? 'rgba(229,57,53,0.3)' : 'var(--border)'}`, borderRadius: '8px', padding: '0.7rem 0.8rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.3rem' }}>{label}</div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: '1.3rem', color: d.has_dosha ? '#E53935' : '#43A047', fontWeight: 700 }}>H{d.house}</div>
              <div style={{ fontSize: '0.7rem', color: d.has_dosha ? '#E07B39' : '#43A047', marginTop: '0.15rem' }}>{d.has_dosha ? 'Dosha' : 'Clear'}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-dim)', borderTop: '1px solid var(--border)', paddingTop: '0.6rem' }}>
          <span>Mars in </span><strong style={{ color: GOLD }}>{mars_position.sign} {mars_position.degree.toFixed(1)}°</strong>
          <span style={{ marginLeft: '1rem' }}>Lagna: </span><strong style={{ color: GOLD }}>{lagna_position.sign} {lagna_position.degree.toFixed(1)}°</strong>
        </div>
      </div>

      {/* Cancellations */}
      {cancellations?.length > 0 && (
        <div style={{ background: 'rgba(67,160,71,0.06)', border: '1px solid rgba(67,160,71,0.3)', borderRadius: '10px', padding: '0.9rem 1.1rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.68rem', color: '#43A047', letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'Cinzel', serif", marginBottom: '0.6rem' }}>Cancellations Found</div>
          {cancellations.map((c, i) => (
            <div key={i} style={{ marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#43A047', marginBottom: '0.15rem' }}>✓ {c.label}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>{c.desc}</div>
            </div>
          ))}
        </div>
      )}

      {/* Partner note */}
      {present && (
        <div style={{ background: 'rgba(201,147,58,0.06)', border: '1px solid rgba(201,147,58,0.25)', borderRadius: '10px', padding: '0.9rem 1.1rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.68rem', color: GOLD, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'Cinzel', serif", marginBottom: '0.4rem' }}>Marriage Matching Note</div>
          <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.7, margin: 0 }}>{partner_note.desc}</p>
        </div>
      )}

      <RemedyList remedies={present ? remedies : []} title="Mangal Dosha Remedies" />
    </div>
  )
}

function KaalSarpPanel({ data }) {
  if (!data) return null
  const { present, status, direction, status_label, planets_hemmed, planets_outside, type, kaal_amrit_desc, rahu_position, ketu_position, remedies } = data

  const isAmrit = direction === 'kaal_amrit'
  const statusColor = present ? '#E07B39' : isAmrit ? '#43A047' : '#43A047'
  const statusIcon  = present ? '⚠' : isAmrit ? '✦' : '✓'

  return (
    <div>
      {/* Status banner */}
      <div style={{ background: present ? 'rgba(224,123,57,0.08)' : 'rgba(67,160,71,0.08)', border: `1px solid ${statusColor}33`, borderRadius: '12px', padding: '1.1rem 1.3rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <div style={{ fontSize: '1.5rem', color: statusColor, lineHeight: 1, flexShrink: 0 }}>{statusIcon}</div>
        <div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: '1rem', color: statusColor, fontWeight: 700, marginBottom: '0.3rem' }}>{status_label}</div>
          {type && (
            <div style={{ fontSize: '0.78rem', color: GOLD_L, marginBottom: '0.4rem' }}>
              {type.name} Kaal Sarp · Rahu in {rahu_position.sign} (House {data.rahu_house})
            </div>
          )}
          {present && type && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.75, margin: '0.4rem 0 0' }}>{type.effect}</p>
          )}
          {isAmrit && kaal_amrit_desc && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.75, margin: '0.4rem 0 0' }}>{kaal_amrit_desc}</p>
          )}
          {!present && !isAmrit && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.75, margin: '0.4rem 0 0' }}>
              Your planets are distributed on both sides of the Rahu-Ketu axis. No Kaal Sarp Dosha is present.
            </p>
          )}
        </div>
      </div>

      {/* Type info */}
      {present && type && (
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.9rem 1.1rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.68rem', color: GOLD, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'Cinzel', serif", marginBottom: '0.5rem' }}>Type: {type.name} Kaal Sarp</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>Serpent: {type.serpent} · Domain: {type.domain}</div>
        </div>
      )}

      {/* Planet positions */}
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.9rem 1.1rem', marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.68rem', color: GOLD, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'Cinzel', serif", marginBottom: '0.75rem' }}>Rahu-Ketu Axis Analysis</div>
        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.7rem', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            <span style={{ color: GOLD }}>Rahu:</span> {rahu_position.sign} {rahu_position.degree.toFixed(1)}°
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginLeft: '1rem' }}>
            <span style={{ color: GOLD }}>Ketu:</span> {ketu_position.sign} {ketu_position.degree.toFixed(1)}°
          </div>
        </div>
        <div style={{ marginBottom: '0.3rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          Hemmed between Rahu and Ketu ({planets_hemmed?.length || 0}/7):
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.5rem' }}>
          {(planets_hemmed || []).map(p => (
            <span key={p} style={{ fontSize: '0.75rem', background: present ? 'rgba(224,123,57,0.15)' : 'rgba(67,160,71,0.15)', border: `1px solid ${present ? 'rgba(224,123,57,0.4)' : 'rgba(67,160,71,0.4)'}`, borderRadius: '6px', padding: '0.2rem 0.5rem', color: present ? '#E07B39' : '#43A047' }}>{p}</span>
          ))}
        </div>
        {planets_outside?.length > 0 && (
          <>
            <div style={{ marginBottom: '0.3rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>Outside axis ({planets_outside.length}/7):</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {planets_outside.map(p => (
                <span key={p} style={{ fontSize: '0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.2rem 0.5rem', color: 'var(--text-muted)' }}>{p}</span>
              ))}
            </div>
          </>
        )}
      </div>

      <RemedyList remedies={present ? remedies : []} title="Kaal Sarp Remedies" />
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

const inp = {
  width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)',
  borderRadius: '8px', color: 'var(--text-primary)', padding: '0.7rem 1rem',
  fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
}
const lbl = {
  color: 'var(--text-dim)', fontSize: '0.75rem', fontWeight: 600,
  letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem',
}

export default function Doshas() {
  const [tab, setTab]         = useState('mangal')   // 'mangal' | 'kaalsarp'
  const [step, setStep]       = useState('form')     // 'form' | 'result'
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const [form, setForm] = useState({
    dob: '', tob: '', lat: '', lon: '', timezone: 'Asia/Kolkata', city: '',
  })

  function upd(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function applyCity(e) {
    const city = CITIES.find(c => c.name === e.target.value)
    if (city) {
      setForm(f => ({ ...f, city: city.name, lat: city.lat, lon: city.lon, timezone: city.tz }))
    }
  }

  async function compute() {
    if (!form.dob || !form.tob || !form.lat || !form.lon) {
      setError('Date of birth, time of birth, and location are required.'); return
    }
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await computeDoshas({
        dob: form.dob, tob: form.tob,
        lat: parseFloat(form.lat), lon: parseFloat(form.lon),
        timezone: form.timezone,
      })
      setResult(res.data)
      setStep('result')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const TAB_CONFIG = [
    { id: 'mangal',   label: 'Mangal Dosha',   icon: '♂', hi: 'मांगलिक दोष' },
    { id: 'kaalsarp', label: 'Kaal Sarp Dosha', icon: '🐍', hi: 'काल सर्प दोष' },
  ]

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: '0.7rem', color: GOLD, letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Vedic Astrology · Dosha Analysis
        </div>
        <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(1.5rem, 4vw, 2.4rem)', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
          Dosha Calculator
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.7, maxWidth: '480px', margin: '0 auto' }}>
          Check for Mangal Dosha (Mars placement) and Kaal Sarp Dosha (Rahu-Ketu axis) — computed with Swiss Ephemeris precision.
        </p>
      </div>

      {/* Tab selector (always visible) */}
      <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.3rem', marginBottom: '1.75rem' }}>
        {TAB_CONFIG.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, background: tab === t.id ? `${GOLD}22` : 'transparent',
            border: `1px solid ${tab === t.id ? GOLD : 'transparent'}`,
            borderRadius: '8px', padding: '0.6rem', cursor: 'pointer',
            fontFamily: "'Cinzel', serif", fontSize: '0.78rem', color: tab === t.id ? GOLD : 'var(--text-muted)',
            fontWeight: tab === t.id ? 700 : 400, transition: 'all 0.15s',
          }}>
            {t.icon} {t.label}
            <div style={{ fontSize: '0.66rem', color: 'var(--text-dim)', fontFamily: 'inherit', marginTop: '0.15rem' }}>{t.hi}</div>
          </button>
        ))}
      </div>

      {/* Birth form */}
      {step === 'form' && (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '1.75rem 2rem', marginBottom: '1.5rem' }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: '0.75rem', color: GOLD, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1.2rem' }}>
            Enter Birth Details
          </div>

          {/* City preset */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={lbl}>City (auto-fill location)</label>
            <select value={form.city} onChange={applyCity} style={{ ...inp, cursor: 'pointer' }}>
              <option value=''>— Select a city or enter lat/lon manually —</option>
              {CITIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          {/* DOB + TOB */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={lbl}>Date of Birth *</label>
              <input type='date' value={form.dob} onChange={e => upd('dob', e.target.value)} style={inp} />
            </div>
            <div>
              <label style={lbl}>Time of Birth * <span style={{ color: 'var(--text-dim)', fontSize: '0.68rem' }}>(24-hr, critical for Lagna)</span></label>
              <input type='time' value={form.tob} onChange={e => upd('tob', e.target.value)} style={inp} />
            </div>
          </div>

          {/* Lat/Lon */}
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

          {/* Timezone */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={lbl}>Timezone</label>
            <input value={form.timezone} onChange={e => upd('timezone', e.target.value)} placeholder='Asia/Kolkata' style={inp} />
          </div>

          {error && (
            <div style={{ background: 'rgba(229,57,53,0.1)', border: '1px solid rgba(229,57,53,0.3)', borderRadius: '8px', padding: '0.75rem 1rem', color: '#ef9a9a', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</div>
          )}

          <button onClick={compute} disabled={loading} style={{
            width: '100%', background: loading ? 'rgba(201,147,58,0.4)' : `linear-gradient(135deg, ${GOLD}, #8B6020)`,
            color: '#FFF8EC', border: 'none', borderRadius: '8px', padding: '0.85rem',
            fontFamily: "'Cinzel', serif", fontSize: '0.82rem', fontWeight: 700,
            letterSpacing: '2px', cursor: loading ? 'not-allowed' : 'pointer',
          }}>
            {loading ? 'Computing…' : 'Compute Doshas →'}
          </button>
        </div>
      )}

      {/* Results */}
      {step === 'result' && result && (
        <div>
          <button onClick={() => { setStep('form'); setResult(null) }} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '0.82rem', cursor: 'pointer', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: 0 }}>
            ← Compute for different details
          </button>

          {/* Lagna label */}
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '1.25rem' }}>
            Lagna (Ascendant): <strong style={{ color: GOLD }}>{result.lagna}</strong>
          </div>

          {/* Active tab content */}
          {tab === 'mangal'   && <MangalPanel   data={result.mangal}    />}
          {tab === 'kaalsarp' && <KaalSarpPanel data={result.kaal_sarp} />}

          {/* Planet snapshot */}
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.6rem' }}>Birth Planet Positions (Sidereal · Lahiri)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {result.positions && Object.entries(result.positions).map(([planet, pos]) => (
                <div key={planet} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.25rem 0.55rem', fontSize: '0.74rem' }}>
                  <span style={{ color: 'var(--text-dim)' }}>{planet}</span>
                  <span style={{ color: GOLD, marginLeft: '0.3rem' }}>{pos.sign} {pos.degree.toFixed(1)}°</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{ marginTop: '1.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.2rem 1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: '0.8rem', color: GOLD, letterSpacing: '1px', marginBottom: '0.2rem' }}>Want a complete chart?</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', margin: 0 }}>
                Get your full Kundali — Vimshottari Dasha, all yogas, Lal Kitab remedies, and AI interpretation.
              </p>
            </div>
            <Link to='/chart/new' style={{ background: GOLD, color: '#000', fontFamily: "'Cinzel', serif", fontSize: '0.78rem', fontWeight: 700, letterSpacing: '1.5px', padding: '0.65rem 1.5rem', borderRadius: '6px', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
              Free Chart →
            </Link>
          </div>
        </div>
      )}

      {/* Info box (form step only) */}
      {step === 'form' && (
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.1rem 1.3rem' }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: '0.72rem', color: GOLD, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            {tab === 'mangal' ? 'About Mangal Dosha' : 'About Kaal Sarp Dosha'}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', lineHeight: 1.75, margin: 0 }}>
            {tab === 'mangal'
              ? "Mangal Dosha (Manglik Dosha) occurs when Mars occupies the 1st, 2nd, 4th, 7th, 8th, or 12th house from the Ascendant, Moon, or Venus in the birth chart. It affects marriage compatibility and partnership dynamics. Cancellations exist — not all Mangal Doshas require remedies."
              : "Kaal Sarp Dosha forms when all seven classical planets (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn) are hemmed between Rahu and Ketu. All 12 types are named after serpents and affect different life domains. An accurate birth time is essential for reliable computation."}
          </p>
        </div>
      )}
    </div>
  )
}
