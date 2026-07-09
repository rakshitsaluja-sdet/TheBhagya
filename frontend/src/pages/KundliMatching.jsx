import { useState } from 'react'
import { Link } from 'react-router-dom'
import { computeKundliMatch } from '../hooks/useApi'
import CitySearch from '../components/CitySearch'

const KOOT_COLORS = {
  5: '#2ecc71', 4: '#27ae60', 3: '#f39c12',
  2: '#e67e22', 1: '#e74c3c', 0: '#c0392b',
}

const VERDICT_COLORS = {
  red:    '#e74c3c',
  orange: '#e67e22',
  gold:   '#f39c12',
  green:  '#27ae60',
  emerald:'#2ecc71',
}

const GOLD_GRADIENT = 'linear-gradient(135deg, #F2CB84 0%, #DFA84F 42%, #A8752B 100%)'

const s = {
  page: { maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem 4rem' },
  eyebrow: { fontFamily: "'JetBrains Mono', monospace", fontSize: '0.66rem', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.6rem' },
  heading: { fontFamily: "'Fraunces', serif", fontSize: 'clamp(1.9rem, 4vw, 2.8rem)', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '0.3rem' },
  subhead: { fontSize: '0.92rem', color: 'var(--text-muted)', marginBottom: '2.2rem' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' },
  card: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: '1.5rem', backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)' },
  cardTitle: { fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', fontWeight: 600, color: 'var(--gold)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  label: { display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: '0.35rem' },
  input: { width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.9rem', boxSizing: 'border-box', fontFamily: 'inherit' },
  select: { width: '100%', padding: '0.8rem 1rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', fontSize: '0.9rem', boxSizing: 'border-box', fontFamily: 'inherit', cursor: 'pointer' },
  row: { marginBottom: '1rem' },
  btn: { width: '100%', padding: '0.95rem', background: GOLD_GRADIENT, color: '#1C1205', border: 'none', borderRadius: 999, fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.5px', boxShadow: '0 8px 28px rgba(223,168,79,0.28)', transition: 'opacity 0.2s' },
  vsCircle: { display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', color: 'var(--text-muted)', fontFamily: "'Fraunces', serif", fontWeight: 600 },
  err: { background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.35)', borderRadius: 10, padding: '1rem', color: '#e74c3c', fontSize: '0.875rem', marginBottom: '1.5rem' },
}

/* ── Person form ─────────────────────────────────────────────────────────── */
function PersonForm({ label, icon, data, onChange }) {
  const set = (k, v) => onChange({ ...data, [k]: v })

  const handleCity = (_lat, _lon, tz, name) => {
    set('city', name)
    if (tz) set('timezone', tz)
  }

  return (
    <div style={s.card}>
      <div style={s.cardTitle}>
        <span style={{ fontSize: '1.1rem' }}>{icon}</span>
        {label}
      </div>

      <div style={s.row}>
        <label style={s.label}>Name</label>
        <input style={s.input} placeholder="Full name" value={data.name}
          onChange={e => set('name', e.target.value)} />
      </div>

      <div style={s.row}>
        <label style={s.label}>Date of Birth</label>
        <input type="date" style={s.input} value={data.dob}
          onChange={e => set('dob', e.target.value)} />
      </div>

      <div style={s.row}>
        <label style={s.label}>Time of Birth</label>
        <input type="time" style={s.input} value={data.tob}
          onChange={e => set('tob', e.target.value)} />
      </div>

      <div style={s.row}>
        <CitySearch
          onSelect={handleCity}
          label="City (auto-fills timezone)"
          placeholder="Search any city worldwide…"
          labelStyle={s.label}
        />
      </div>

      <div style={s.row}>
        <label style={s.label}>Timezone</label>
        <input style={s.input} placeholder="e.g. Asia/Kolkata" value={data.timezone}
          onChange={e => set('timezone', e.target.value)} />
      </div>
    </div>
  )
}

/* ── Score bar ───────────────────────────────────────────────────────────── */
function ScoreBar({ koot }) {
  const pct   = (koot.score / koot.max) * 100
  const score = Math.floor(koot.score * 2) / 2  // round to 0.5
  const color = KOOT_COLORS[Math.round(pct / 20)] || 'var(--gold)'

  const hasBadge = koot.nadi_dosha || koot.bhakut_dosha || koot.gana_dosha

  return (
    <div style={{ padding: '1rem 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{koot.koot}</span>
          {hasBadge && (
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.62rem', padding: '0.15rem 0.6rem', borderRadius: 999, background: 'rgba(231,76,60,0.15)', color: '#e74c3c', border: '1px solid rgba(231,76,60,0.3)', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' }}>
              DOSHA
            </span>
          )}
        </div>
        <span style={{ fontWeight: 700, fontSize: '0.95rem', color }}>
          {score} / {koot.max}
        </span>
      </div>

      <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', marginBottom: '0.5rem' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.8s ease' }} />
      </div>

      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>{koot.detail}</p>

      {/* Extra nakshatra/lord info */}
      {(koot.boy_yoni || koot.boy_gana || koot.boy_tara || koot.boy_lord) && (
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.4rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          {koot.boy_yoni  && <span>P1: {koot.boy_yoni}  · P2: {koot.girl_yoni}</span>}
          {koot.boy_gana  && <span>P1: {koot.boy_gana}  · P2: {koot.girl_gana}</span>}
          {koot.boy_tara  && <span>P1: {koot.boy_tara}  · P2: {koot.girl_tara}</span>}
          {koot.boy_nadi  && <span>P1: {koot.boy_nadi}  Nadi · P2: {koot.girl_nadi}  Nadi</span>}
          {koot.boy_lord  && <span>P1 lord: {koot.boy_lord} · P2 lord: {koot.girl_lord}</span>}
          {koot.boy_varna && <span>P1: {koot.boy_varna} · P2: {koot.girl_varna}</span>}
        </div>
      )}
    </div>
  )
}

/* ── Result panel ────────────────────────────────────────────────────────── */
function ResultPanel({ result }) {
  const { person1, person2, kootas, total, verdict, doshas } = result
  const vColor = VERDICT_COLORS[verdict.color] || 'var(--gold)'

  return (
    <div>
      {/* ── Names + Moon info ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ ...s.card, textAlign: 'center' }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.1rem', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>{person1.name}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{person1.moon_sign} · {person1.nakshatra}</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem', opacity: 0.6 }}>Moon {person1.moon_lon}°</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}>
          <div style={{ fontSize: '1.6rem', color: 'var(--gold)' }}>♥</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '2px', textTransform: 'uppercase' }}>match</div>
        </div>

        <div style={{ ...s.card, textAlign: 'center' }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.1rem', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>{person2.name}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{person2.moon_sign} · {person2.nakshatra}</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem', opacity: 0.6 }}>Moon {person2.moon_lon}°</div>
        </div>
      </div>

      {/* ── Score gauge ── */}
      <div style={{ ...s.card, textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '3.5rem', fontFamily: "'Fraunces', serif", fontWeight: 600, letterSpacing: '-0.02em', color: vColor, lineHeight: 1 }}>
          {total}<span style={{ fontSize: '1.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>/36</span>
        </div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.1rem', fontWeight: 600, letterSpacing: '-0.02em', color: vColor, margin: '0.5rem 0' }}>
          {verdict.label}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: 520, margin: '0 auto', lineHeight: 1.65 }}>
          {verdict.desc}
        </div>

        {/* Progress arc (simple bar) */}
        <div style={{ margin: '1.2rem auto 0', maxWidth: 400 }}>
          <div style={{ height: 10, background: 'var(--border)', borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${verdict.pct}%`, background: `linear-gradient(90deg, var(--gold), ${vColor})`, borderRadius: 5, transition: 'width 1s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            <span>0</span><span>18 (min)</span><span>24</span><span>28</span><span>36</span>
          </div>
        </div>
      </div>

      {/* ── Doshas ── */}
      {doshas.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '0.7rem' }}>Doshas Found</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
            {doshas.map((d, i) => (
              <div key={i} style={{
                display: 'flex', gap: '0.8rem', alignItems: 'flex-start',
                padding: '0.9rem 1rem',
                background: d.severity === 'critical' ? 'rgba(231,76,60,0.08)' : d.severity === 'high' ? 'rgba(231,76,60,0.05)' : 'rgba(230,126,34,0.06)',
                border: `1px solid ${d.severity === 'critical' ? 'rgba(231,76,60,0.35)' : d.severity === 'high' ? 'rgba(231,76,60,0.25)' : 'rgba(230,126,34,0.25)'}`,
                borderRadius: 10,
              }}>
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>{d.severity === 'critical' ? '⚠' : d.severity === 'high' ? '!' : 'ℹ'}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: d.severity === 'critical' ? '#e74c3c' : d.severity === 'high' ? '#e67e22' : '#f39c12', marginBottom: '0.25rem' }}>{d.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>{d.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 8 Kootas ── */}
      <div style={s.card}>
        <div style={{ ...s.cardTitle, marginBottom: '0.5rem' }}>Ashtakoot Breakdown</div>
        {kootas.map((k, i) => <ScoreBar key={i} koot={k} />)}
      </div>

      {/* ── CTA ── */}
      <div style={{ ...s.card, marginTop: '1.5rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          For a complete picture, view your individual birth charts and Vimshottari Dasha timelines.
        </p>
        <Link to="/chart/new" style={{ display: 'inline-block', padding: '0.7rem 1.8rem', background: 'transparent', border: '1px solid var(--border-hover)', color: 'var(--gold)', borderRadius: 999, textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem', transition: 'background 0.2s, border-color 0.2s' }}>
          Create Full Kundali →
        </Link>
      </div>
    </div>
  )
}

/* ── Main page ───────────────────────────────────────────────────────────── */
const EMPTY = { name: '', dob: '', tob: '12:00', timezone: 'Asia/Kolkata', city: '' }

export default function KundliMatching() {
  const [p1, setP1] = useState({ ...EMPTY })
  const [p2, setP2] = useState({ ...EMPTY })
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)
  const [error,   setError]   = useState(null)

  const valid = p1.name && p1.dob && p1.tob && p1.timezone &&
                p2.name && p2.dob && p2.tob && p2.timezone

  const handleCompute = async () => {
    if (!valid) return
    setLoading(true); setError(null); setResult(null)
    try {
      const data = await computeKundliMatch({
        person1: { name: p1.name, dob: p1.dob, tob: p1.tob, timezone: p1.timezone },
        person2: { name: p2.name, dob: p2.dob, tob: p2.tob, timezone: p2.timezone },
      })
      setResult(data)
      setTimeout(() => document.getElementById('km-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch (e) {
      setError(e.message || 'Computation failed. Please check all fields.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.page}>
      {/* Header */}
      <div className="bh-fade-up" style={{ marginBottom: '2rem' }}>
        <div style={s.eyebrow}>Vedic Compatibility</div>
        <h1 style={s.heading}>Kundli Matching · Ashtakoot</h1>
        <p style={s.subhead}>
          36-Guna compatibility analysis — eight cosmic dimensions compared to reveal the harmony between two charts.
        </p>

        {/* Info box */}
        <div style={{ background: 'rgba(223,168,79,0.06)', border: '1px solid rgba(223,168,79,0.2)', borderRadius: 12, padding: '1.1rem 1.3rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--gold)' }}>How it works:</strong> Ashtakoot matching computes 8 Kootas (Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakut, Nadi) from the Moon's sidereal position in each chart. A score of 18+/36 is the traditional minimum for marriage. Nadi Dosha (same Nadi) is the most critical.
        </div>
      </div>

      {/* Forms */}
      <div className="km-form-grid bh-fade-up-1" style={s.formGrid}>
        <PersonForm label="Person 1" icon="☽" data={p1} onChange={setP1} />
        <PersonForm label="Person 2" icon="☽" data={p2} onChange={setP2} />
      </div>

      {error && <div style={s.err}>{error}</div>}

      <button
        className="bh-fade-up-2"
        style={{ ...s.btn, opacity: (!valid || loading) ? 0.6 : 1 }}
        onClick={handleCompute}
        disabled={!valid || loading}
      >
        {loading ? 'Computing…' : 'Compute Compatibility →'}
      </button>

      {/* Result */}
      {result && (
        <div id="km-result" style={{ marginTop: '2.5rem' }}>
          <ResultPanel result={result} />
        </div>
      )}

      {/* Mobile responsive */}
      <style>{`
        @media (max-width: 680px) {
          .km-form-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
