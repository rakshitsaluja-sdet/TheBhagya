import { useState } from 'react'
import { Link } from 'react-router-dom'
import { computeDoshas } from '../hooks/useApi'
import CitySearch from '../components/CitySearch'

const GOLD   = '#DFA84F'
const GOLD_L = '#F2CB84'

// ── Sub-components ─────────────────────────────────────────────────────────────

function SeverityBadge({ severity }) {
  const map = {
    high:      { color: '#E53935', bg: 'rgba(229,57,53,0.12)',   label: 'High Severity' },
    medium:    { color: '#E07B39', bg: 'rgba(224,123,57,0.12)',  label: 'Medium Severity' },
    low:       { color: GOLD_L,    bg: 'rgba(242,203,132,0.12)', label: 'Low Severity' },
    reduced:   { color: GOLD,      bg: 'rgba(223,168,79,0.12)',  label: 'Reduced (Partial Cancellation)' },
    cancelled: { color: '#43A047', bg: 'rgba(67,160,71,0.12)',   label: 'Cancelled by Cancellations' },
    none:      { color: '#43A047', bg: 'rgba(67,160,71,0.12)',   label: 'Not Present' },
  }
  const cfg = map[severity] || map.none
  return (
    <span style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.5px', color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}44`, borderRadius: 999, padding: '0.2rem 0.7rem' }}>
      {cfg.label}
    </span>
  )
}

function RemedyList({ remedies, title }) {
  const [open, setOpen] = useState(false)
  if (!remedies?.length) return null
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 18, padding: '0.9rem 1.1rem', marginTop: '1rem', backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)' }}>
      <button onClick={() => setOpen(o => !o)} style={{ background: 'none', border: 'none', color: GOLD, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', letterSpacing: '2.5px', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', width: '100%', padding: 0 }}>
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
      <div style={{ background: present && severity !== 'cancelled' ? 'rgba(229,57,53,0.08)' : 'rgba(67,160,71,0.08)', border: `1px solid ${statusColor}33`, borderRadius: 18, padding: '1.1rem 1.3rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start', backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)' }}>
        <div style={{ fontSize: '1.5rem', color: statusColor, lineHeight: 1, flexShrink: 0 }}>{statusIcon}</div>
        <div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.05rem', letterSpacing: '-0.02em', color: statusColor, fontWeight: 600, marginBottom: '0.3rem' }}>
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
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 18, padding: '0.9rem 1.1rem', marginBottom: '1rem', backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)' }}>
        <div style={{ fontSize: '0.64rem', color: GOLD, letterSpacing: '2.5px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", marginBottom: '0.75rem' }}>Position Analysis</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
          {[
            { label: 'From Lagna', data: from_lagna },
            { label: 'From Moon',  data: from_moon  },
            { label: 'From Venus', data: from_venus  },
          ].map(({ label, data: d }) => (
            <div key={label} style={{ background: d.has_dosha ? 'rgba(229,57,53,0.06)' : 'var(--bg-card)', border: `1px solid ${d.has_dosha ? 'rgba(229,57,53,0.3)' : 'var(--border)'}`, borderRadius: 10, padding: '0.7rem 0.8rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.3rem' }}>{label}</div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.3rem', letterSpacing: '-0.02em', color: d.has_dosha ? '#E53935' : '#43A047', fontWeight: 600 }}>H{d.house}</div>
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
        <div style={{ background: 'rgba(67,160,71,0.06)', border: '1px solid rgba(67,160,71,0.3)', borderRadius: 18, padding: '0.9rem 1.1rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.64rem', color: '#43A047', letterSpacing: '2.5px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", marginBottom: '0.6rem' }}>Cancellations Found</div>
          {cancellations.map((c, i) => (
            <div key={i} style={{ marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#43A047', marginBottom: '0.15rem' }}>✓ {c.label}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>{c.desc}</div>
            </div>
          ))}
        </div>
      )}

      {/* Partner note */}
      {present && (
        <div style={{ background: 'rgba(223,168,79,0.06)', border: '1px solid rgba(223,168,79,0.25)', borderRadius: 18, padding: '0.9rem 1.1rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.64rem', color: GOLD, letterSpacing: '2.5px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", marginBottom: '0.4rem' }}>Marriage Matching Note</div>
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
      <div style={{ background: present ? 'rgba(224,123,57,0.08)' : 'rgba(67,160,71,0.08)', border: `1px solid ${statusColor}33`, borderRadius: 18, padding: '1.1rem 1.3rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start', backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)' }}>
        <div style={{ fontSize: '1.5rem', color: statusColor, lineHeight: 1, flexShrink: 0 }}>{statusIcon}</div>
        <div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.05rem', letterSpacing: '-0.02em', color: statusColor, fontWeight: 600, marginBottom: '0.3rem' }}>{status_label}</div>
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
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 18, padding: '0.9rem 1.1rem', marginBottom: '1rem', backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)' }}>
          <div style={{ fontSize: '0.64rem', color: GOLD, letterSpacing: '2.5px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", marginBottom: '0.5rem' }}>Type: {type.name} Kaal Sarp</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>Serpent: {type.serpent} · Domain: {type.domain}</div>
        </div>
      )}

      {/* Planet positions */}
      <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 18, padding: '0.9rem 1.1rem', marginBottom: '1rem', backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)' }}>
        <div style={{ fontSize: '0.64rem', color: GOLD, letterSpacing: '2.5px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", marginBottom: '0.75rem' }}>Rahu-Ketu Axis Analysis</div>
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
            <span key={p} style={{ fontSize: '0.75rem', background: present ? 'rgba(224,123,57,0.15)' : 'rgba(67,160,71,0.15)', border: `1px solid ${present ? 'rgba(224,123,57,0.4)' : 'rgba(67,160,71,0.4)'}`, borderRadius: 999, padding: '0.2rem 0.6rem', color: present ? '#E07B39' : '#43A047' }}>{p}</span>
          ))}
        </div>
        {planets_outside?.length > 0 && (
          <>
            <div style={{ marginBottom: '0.3rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>Outside axis ({planets_outside.length}/7):</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {planets_outside.map(p => (
                <span key={p} style={{ fontSize: '0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 999, padding: '0.2rem 0.6rem', color: 'var(--text-muted)' }}>{p}</span>
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
  width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)',
  borderRadius: 10, color: 'var(--text-primary)', padding: '0.8rem 1rem',
  fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
}
const lbl = {
  color: 'var(--text-dim)', fontSize: '0.68rem', fontWeight: 500,
  fontFamily: "'JetBrains Mono', monospace",
  letterSpacing: '2px', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem',
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

  function applyCity(lat, lon, tz, name) {
    setForm(f => ({ ...f, city: name, lat, lon, timezone: tz }))
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
      <div className="bh-fade-up" style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.66rem', color: 'var(--gold)', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Vedic Astrology · Dosha Analysis
        </div>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(1.9rem, 4vw, 2.8rem)', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
          Dosha Calculator
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.7, maxWidth: '480px', margin: '0 auto' }}>
          Check for Mangal Dosha (Mars placement) and Kaal Sarp Dosha (Rahu-Ketu axis) — computed with Swiss Ephemeris precision.
        </p>
      </div>

      {/* Tab selector (always visible) */}
      <div className="bh-fade-up-1" style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 999, padding: '0.3rem', marginBottom: '1.75rem', backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)' }}>
        {TAB_CONFIG.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, background: tab === t.id ? `${GOLD}22` : 'transparent',
            border: `1px solid ${tab === t.id ? GOLD : 'transparent'}`,
            borderRadius: 999, padding: '0.6rem', cursor: 'pointer',
            fontSize: '0.82rem', color: tab === t.id ? GOLD : 'var(--text-muted)',
            fontWeight: tab === t.id ? 600 : 400, transition: 'all 0.15s',
          }}>
            {t.icon} {t.label}
            <div style={{ fontSize: '0.66rem', color: 'var(--text-dim)', fontFamily: 'inherit', marginTop: '0.15rem' }}>{t.hi}</div>
          </button>
        ))}
      </div>

      {/* Birth form */}
      {step === 'form' && (
        <div className="bh-fade-up-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: '1.75rem 2rem', marginBottom: '1.5rem', backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: GOLD, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '1.2rem' }}>
            Enter Birth Details
          </div>

          {/* City search */}
          <div style={{ marginBottom: '1rem' }}>
            <CitySearch
              onSelect={applyCity}
              label="City (auto-fills location &amp; timezone)"
              placeholder="Search any city worldwide…"
              labelStyle={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '0.35rem' }}
            />
          </div>

          {/* DOB + TOB */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={lbl}>Date of Birth *</label>
              <input type='date' value={form.dob} onChange={e => upd('dob', e.target.value)} style={inp} />
            </div>
            <div>
              <label style={lbl}>Time of Birth * <span style={{ color: 'var(--text-dim)', fontSize: '0.62rem' }}>(24-hr, critical for Lagna)</span></label>
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
            <div style={{ background: 'rgba(229,57,53,0.1)', border: '1px solid rgba(229,57,53,0.3)', borderRadius: 10, padding: '0.75rem 1rem', color: '#ef9a9a', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</div>
          )}

          <button onClick={compute} disabled={loading} style={{
            width: '100%', background: loading ? 'rgba(223,168,79,0.4)' : 'linear-gradient(135deg,#F2CB84 0%,#DFA84F 42%,#A8752B 100%)',
            color: '#1C1205', border: 'none', borderRadius: 999, padding: '0.85rem',
            fontSize: '0.9rem', fontWeight: 600,
            letterSpacing: '0.02em', cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 8px 28px rgba(223,168,79,0.28)',
          }}>
            {loading ? 'Computing…' : 'Compute Doshas →'}
          </button>
        </div>
      )}

      {/* Results */}
      {step === 'result' && result && (
        <div className="bh-fade-up-2">
          <button onClick={() => { setStep('form'); setResult(null) }} style={{ background: 'transparent', border: '1px solid var(--border-hover)', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.9rem', borderRadius: 999 }}>
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
            <div style={{ fontSize: '0.62rem', color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.6rem' }}>Birth Planet Positions (Sidereal · Lahiri)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {result.positions && Object.entries(result.positions).map(([planet, pos]) => (
                <div key={planet} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 999, padding: '0.25rem 0.65rem', fontSize: '0.74rem' }}>
                  <span style={{ color: 'var(--text-dim)' }}>{planet}</span>
                  <span style={{ color: GOLD, marginLeft: '0.3rem' }}>{pos.sign} {pos.degree.toFixed(1)}°</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div style={{ marginTop: '1.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 18, padding: '1.2rem 1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)' }}>
            <div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.66rem', color: GOLD, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Want a complete chart?</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', margin: 0 }}>
                Get your full Kundali — Vimshottari Dasha, all yogas, Lal Kitab remedies, and AI interpretation.
              </p>
            </div>
            <Link to='/chart/new' style={{ background: 'linear-gradient(135deg,#F2CB84 0%,#DFA84F 42%,#A8752B 100%)', color: '#1C1205', fontSize: '0.82rem', fontWeight: 600, letterSpacing: '0.02em', padding: '0.65rem 1.5rem', borderRadius: 999, boxShadow: '0 8px 28px rgba(223,168,79,0.28)', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
              Free Chart →
            </Link>
          </div>
        </div>
      )}

      {/* Info box (form step only) */}
      {step === 'form' && (
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 18, padding: '1.1rem 1.3rem', backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.66rem', color: GOLD, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
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
