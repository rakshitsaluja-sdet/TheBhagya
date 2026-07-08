import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getSadeSatiByMoonSign } from '../hooks/useApi'

// ── Constants ──────────────────────────────────────────────────────────────────

const RASHIS = [
  { en: 'Aries',       hi: 'मेष',      symbol: '♈' },
  { en: 'Taurus',      hi: 'वृषभ',     symbol: '♉' },
  { en: 'Gemini',      hi: 'मिथुन',    symbol: '♊' },
  { en: 'Cancer',      hi: 'कर्क',     symbol: '♋' },
  { en: 'Leo',         hi: 'सिंह',     symbol: '♌' },
  { en: 'Virgo',       hi: 'कन्या',    symbol: '♍' },
  { en: 'Libra',       hi: 'तुला',     symbol: '♎' },
  { en: 'Scorpio',     hi: 'वृश्चिक',  symbol: '♏' },
  { en: 'Sagittarius', hi: 'धनु',      symbol: '♐' },
  { en: 'Capricorn',   hi: 'मकर',      symbol: '♑' },
  { en: 'Aquarius',    hi: 'कुम्भ',    symbol: '♒' },
  { en: 'Pisces',      hi: 'मीन',      symbol: '♓' },
]

const GOLD   = '#C9933A'
const GOLD_L = '#E8B96A'

const STATUS_CONFIG = {
  sade_sati:  { color: '#E07B39', bg: 'rgba(224,123,57,0.1)', label: 'In Sade Sati',  icon: '⚠' },
  ardha_sati: { color: '#E8B96A', bg: 'rgba(232,185,106,0.1)', label: 'Ardha Sati',   icon: '◐' },
  clear:      { color: '#43A047', bg: 'rgba(67,160,71,0.1)',   label: 'Clear Period',  icon: '✓' },
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function PhaseTag({ phase }) {
  if (phase?.type === 'sade_sati') {
    const labels = { '-1': 'Rising', '0': 'Peak', '1': 'Setting' }
    const label = labels[String(phase.phase)] || '—'
    return <span style={{ fontSize: '0.72rem', background: 'rgba(224,123,57,0.2)', color: '#E07B39', border: '1px solid rgba(224,123,57,0.4)', borderRadius: '12px', padding: '0.15rem 0.5rem', marginLeft: '0.5rem' }}>{label}</span>
  }
  if (phase?.type === 'ardha_sati') {
    return <span style={{ fontSize: '0.72rem', background: 'rgba(232,185,106,0.2)', color: GOLD_L, border: '1px solid rgba(232,185,106,0.4)', borderRadius: '12px', padding: '0.15rem 0.5rem', marginLeft: '0.5rem' }}>Ardha Sati</span>
  }
  return null
}

function CycleCard({ cycle, isCurrent }) {
  if (!cycle) return null
  const start = new Date(cycle.start).getFullYear()
  const end   = new Date(cycle.end).getFullYear()

  return (
    <div style={{
      background: isCurrent ? 'rgba(201,147,58,0.07)' : 'var(--bg-elevated)',
      border: `1px solid ${isCurrent ? GOLD : 'var(--border)'}`,
      borderRadius: '10px',
      padding: '0.9rem 1.1rem',
      marginBottom: '0.6rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: '0.85rem', color: isCurrent ? GOLD : 'var(--text-primary)', fontWeight: 700 }}>
          {start} – {end}
        </span>
        {isCurrent && <span style={{ fontSize: '0.68rem', color: GOLD, letterSpacing: '1.5px', textTransform: 'uppercase', border: `1px solid ${GOLD}`, borderRadius: '10px', padding: '0.15rem 0.5rem' }}>Current</span>}
      </div>
      {cycle.phases?.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          <span style={{ color: 'var(--text-dim)', width: '7ch', flexShrink: 0 }}>
            {new Date(p.start).getFullYear()}–{new Date(p.end).getFullYear()}
          </span>
          <PhaseTag phase={p} />
          <span style={{ color: 'var(--text-muted)' }}>Saturn in {p.saturn_rashi}</span>
        </div>
      ))}
    </div>
  )
}

function RemedyList({ remedies }) {
  const [open, setOpen] = useState(false)
  if (!remedies?.length) return null
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.1rem 1.25rem', marginTop: '1.5rem' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ background: 'none', border: 'none', color: GOLD, fontFamily: "'Cinzel', serif", fontSize: '0.82rem', letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: 0, width: '100%', justifyContent: 'space-between' }}
      >
        <span>Saturn Remedies</span>
        <span style={{ fontSize: '0.9rem' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <ul style={{ margin: '0.8rem 0 0', paddingLeft: '1.2rem', color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.8 }}>
          {remedies.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function SadeSati() {
  const [selected, setSelected] = useState(null)   // rashi index
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [step, setStep]         = useState('pick')  // 'pick' | 'result'

  async function compute(idx) {
    setSelected(idx)
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await getSadeSatiByMoonSign(RASHIS[idx].en.toLowerCase())
      setResult(res.data)
      setStep('result')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setStep('pick')
    setResult(null)
    setSelected(null)
    setError('')
  }

  const status = result ? STATUS_CONFIG[result.current_status] : null

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: '0.7rem', color: GOLD, letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
          Saturn Transit Report
        </div>
        <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: 'clamp(1.6rem, 4vw, 2.5rem)', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
          Sade Sati Calculator
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.7, maxWidth: '500px', margin: '0 auto' }}>
          Sade Sati is Saturn's 7.5-year transit through the 12th, 1st, and 2nd sign from your Moon sign (Rashi).
          Find out if you are currently in Sade Sati and when your next cycle begins.
        </p>
      </div>

      {/* Step 1: Sign picker */}
      {step === 'pick' && (
        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1rem', textAlign: 'center' }}>
            Select Your Moon Sign (Rashi)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.65rem' }}>
            {RASHIS.map((r, i) => (
              <button
                key={r.en}
                onClick={() => compute(i)}
                disabled={loading}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '1rem 0.75rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  textAlign: 'center',
                  transition: 'border-color 0.15s, background 0.15s',
                  opacity: loading ? 0.6 : 1,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.background = `${GOLD}12` }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-card)' }}
              >
                <div style={{ fontSize: '1.6rem', marginBottom: '0.3rem' }}>{r.symbol}</div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.15rem' }}>{r.en}</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>{r.hi}</div>
              </button>
            ))}
          </div>

          {loading && (
            <div style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-dim)' }}>
              <div style={{ fontSize: '1.5rem', animation: 'spin 2s linear infinite', display: 'inline-block' }}>♄</div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.88rem' }}>Computing Saturn transits…</div>
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
          )}
          {error && (
            <div style={{ marginTop: '1rem', background: 'rgba(229,57,53,0.1)', border: '1px solid rgba(229,57,53,0.3)', borderRadius: '8px', padding: '0.85rem 1rem', color: '#ef9a9a', fontSize: '0.88rem' }}>{error}</div>
          )}

          {/* Info box */}
          <div style={{ marginTop: '2rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem 1.4rem' }}>
            <div style={{ fontSize: '0.72rem', color: GOLD, fontFamily: "'Cinzel', serif", letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.6rem' }}>Don't know your Moon sign?</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.7, margin: '0 0 0.75rem' }}>
              Your Moon sign (Rashi) is the zodiac sign the Moon occupied at your birth — it differs from your Sun sign.
              Bhagya can compute it precisely using Swiss Ephemeris.
            </p>
            <Link to="/chart/new" style={{ color: GOLD, fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}>
              Compute my birth chart for free →
            </Link>
          </div>
        </div>
      )}

      {/* Step 2: Results */}
      {step === 'result' && result && (
        <div>
          {/* Back */}
          <button onClick={reset} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '0.82rem', cursor: 'pointer', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: 0 }}>
            ← Check another Rashi
          </button>

          {/* Rashi header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '1.5rem' }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%',
              background: `radial-gradient(circle, ${GOLD}33, ${GOLD}11)`,
              border: `2px solid ${GOLD}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.7rem', flexShrink: 0,
            }}>
              {RASHIS[selected]?.symbol}
            </div>
            <div>
              <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: '1.3rem', color: 'var(--text-primary)', margin: '0 0 0.15rem' }}>
                {result.moon_sign} · {result.moon_sign_hi}
              </h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Moon Sign · Saturn currently in {result.saturn_today}</div>
            </div>
          </div>

          {/* Current status banner */}
          <div style={{
            background: status.bg,
            border: `1px solid ${status.color}44`,
            borderRadius: '12px',
            padding: '1.2rem 1.4rem',
            marginBottom: '1.75rem',
            display: 'flex',
            gap: '1rem',
            alignItems: 'flex-start',
          }}>
            <div style={{ fontSize: '1.6rem', color: status.color, flexShrink: 0, lineHeight: 1 }}>{status.icon}</div>
            <div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: '1rem', color: status.color, fontWeight: 700, marginBottom: '0.35rem' }}>{status.label}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>{result.current_phase_label}</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.75, margin: 0 }}>{result.current_phase_desc}</p>
              {result.current_period && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  Period: {result.current_period.start} → {result.current_period.end}
                </div>
              )}
            </div>
          </div>

          {/* Next Sade Sati */}
          {result.next_ss && result.current_status !== 'sade_sati' && (
            <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem 1.2rem', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: GOLD, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'Cinzel', serif", marginBottom: '0.2rem' }}>Next Sade Sati</div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{result.next_ss.start.slice(0, 4)} – {result.next_ss.end.slice(0, 4)}</div>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                ~{result.next_ss.years_away} years away
              </div>
            </div>
          )}

          {/* Cycle timeline */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: '0.78rem', color: GOLD, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
              Saturn Transit Timeline
            </div>

            {result.past_cycles?.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Past Cycles</div>
                {result.past_cycles.map((c, i) => <CycleCard key={i} cycle={c} isCurrent={false} />)}
              </div>
            )}

            {result.current_status === 'sade_sati' && result.current_period && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.7rem', color: '#E07B39', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Current Cycle</div>
                {/* Find current cycle from upcoming if not listed */}
                <CycleCard cycle={result.current_period ? { start: result.current_period.start, end: result.current_period.end, phases: [result.current_period] } : null} isCurrent={true} />
              </div>
            )}

            {result.upcoming_cycles?.length > 0 && (
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Upcoming Cycles</div>
                {result.upcoming_cycles.map((c, i) => <CycleCard key={i} cycle={c} isCurrent={result.current_status === 'sade_sati' && i === 0 && !result.past_cycles?.length} />)}
              </div>
            )}
          </div>

          {/* Remedies */}
          <RemedyList remedies={result.remedies} />

          {/* CTA to full chart */}
          <div style={{ marginTop: '1.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.2rem 1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: '0.8rem', color: GOLD, letterSpacing: '1px', marginBottom: '0.25rem' }}>Go deeper</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: 0 }}>Get your full birth chart with Vimshottari Dasha timeline and AI-powered interpretation.</p>
            </div>
            <Link
              to="/chart/new"
              style={{ background: GOLD, color: '#000', fontFamily: "'Cinzel', serif", fontSize: '0.78rem', fontWeight: 700, letterSpacing: '1.5px', padding: '0.65rem 1.5rem', borderRadius: '6px', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              Free Chart →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
