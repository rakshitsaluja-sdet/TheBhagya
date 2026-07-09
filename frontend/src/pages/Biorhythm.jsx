import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'

const GOLD   = '#DFA84F'
const GOLD_L = '#F2CB84'
const VIO    = '#8B6FE8'

const PHYS_COLOR = '#E57C3A'  // Mars orange
const EMOT_COLOR = '#90CAF9'  // Venus blue
const INT_COLOR  = '#F9A825'  // Jupiter gold

// ── Styles (same pattern as Varshphal.jsx) ────────────────────────────────────
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function SectionTitle({ children, color }) {
  return (
    <div style={{
      fontFamily: "'JetBrains Mono', monospace", fontSize: '0.64rem',
      color: color || GOLD, letterSpacing: '2.5px', textTransform: 'uppercase',
      marginBottom: '0.85rem',
    }}>{children}</div>
  )
}

/** Compute biorhythm value in [-1, 1] */
function bioValue(elapsedDays, period) {
  return Math.sin((2 * Math.PI * elapsedDays) / period)
}

/** Elapsed whole days from birthDate to targetDate (both yyyy-mm-dd strings) */
function getElapsed(birthDate, targetDate) {
  const MS_PER_DAY = 1000 * 60 * 60 * 24
  const b = new Date(birthDate + 'T00:00:00')
  const t = new Date(targetDate + 'T00:00:00')
  return Math.round((t - b) / MS_PER_DAY)
}

function toDateStr(d) {
  return d.toISOString().slice(0, 10)
}

function getInterpretation(v) {
  if (v > 0.5)  return 'High — peak performance'
  if (v >= 0)   return 'Rising — building up'
  if (v >= -0.5) return 'Declining — winding down'
  return 'Low — rest and recover'
}

// ── PercentBar ────────────────────────────────────────────────────────────────

function PercentBar({ label, value, color }) {
  const pct     = Math.round(value * 100)
  const isPos   = pct >= 0
  const barW    = Math.abs(pct)  // 0-100

  return (
    <div style={{ marginBottom: '1.1rem' }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
          <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: '0.84rem',
            color, fontWeight: 700,
          }}>{pct >= 0 ? '+' : ''}{pct}%</span>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>{getInterpretation(value)}</span>
        </div>
      </div>

      {/* Bar track — centred at 50% */}
      <div style={{ position: 'relative', height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
        {/* zero marker */}
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.18)', zIndex: 1 }} />
        {/* fill */}
        <div style={{
          position: 'absolute', top: 0, bottom: 0,
          width: `${barW / 2}%`,
          background: color,
          borderRadius: 999, opacity: 0.88,
          left: isPos ? '50%' : `${50 - barW / 2}%`,
        }} />
      </div>

      {/* Axis labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.22rem' }}>
        {['−100', '0', '+100'].map(t => (
          <span key={t} style={{ fontSize: '0.6rem', color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace" }}>{t}</span>
        ))}
      </div>
    </div>
  )
}

// ── SVG Chart ─────────────────────────────────────────────────────────────────

function BioChart({ birthDate, targetDate }) {
  const W = 740, H = 250
  const PL = 12, PR = 12, PT = 26, PB = 22
  const cW = W - PL - PR
  const cH = H - PT - PB
  const zY = PT + cH / 2

  // 30 data points: offset -15 … +14 relative to targetDate
  const OFFSETS = Array.from({ length: 30 }, (_, i) => i - 15)
  const elapsed = getElapsed(birthDate, targetDate)

  const dayX = (off) => PL + ((off + 15) / 29) * cW
  const valY = (v)   => zY - v * (cH / 2)

  const polyPoints = (period) =>
    OFFSETS.map(d => `${dayX(d)},${valY(bioValue(elapsed + d, period))}`).join(' ')

  const todayX = dayX(0)

  // Label dates every 5 days
  const LABEL_OFFSETS = [-15, -10, -5, 0, 5, 10, 14]
  const fmtDate = (off) => {
    const d = new Date(targetDate + 'T00:00:00')
    d.setDate(d.getDate() + off)
    return `${d.getDate()}/${d.getMonth() + 1}`
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}>
      {/* Grid verticals every 5 days */}
      {[-15, -10, -5, 0, 5, 10, 14].map(d => (
        <line key={d}
          x1={dayX(d)} y1={PT} x2={dayX(d)} y2={PT + cH}
          stroke="rgba(255,255,255,0.06)" strokeWidth={1}
        />
      ))}

      {/* ±50 guides */}
      {[0.5, -0.5].map(v => (
        <line key={v}
          x1={PL} y1={valY(v)} x2={W - PR} y2={valY(v)}
          stroke="rgba(255,255,255,0.05)" strokeWidth={1} strokeDasharray="3 5"
        />
      ))}

      {/* Zero axis */}
      <line x1={PL} y1={zY} x2={W - PR} y2={zY} stroke="rgba(255,255,255,0.20)" strokeWidth={1} />

      {/* Y labels */}
      <text x={PL + 2} y={valY(1) + 9}   fontSize={8} fill="rgba(255,255,255,0.25)" fontFamily="'JetBrains Mono',monospace">+100</text>
      <text x={PL + 2} y={zY - 4}          fontSize={8} fill="rgba(255,255,255,0.25)" fontFamily="'JetBrains Mono',monospace">0</text>
      <text x={PL + 2} y={valY(-1) - 4}  fontSize={8} fill="rgba(255,255,255,0.25)" fontFamily="'JetBrains Mono',monospace">−100</text>

      {/* Sine waves */}
      <polyline points={polyPoints(23)} fill="none" stroke={PHYS_COLOR} strokeWidth={2.2} strokeLinejoin="round" opacity={0.90} />
      <polyline points={polyPoints(28)} fill="none" stroke={EMOT_COLOR} strokeWidth={2.2} strokeLinejoin="round" opacity={0.90} />
      <polyline points={polyPoints(33)} fill="none" stroke={INT_COLOR}  strokeWidth={2.2} strokeLinejoin="round" opacity={0.90} />

      {/* Today dashed line */}
      <line x1={todayX} y1={PT} x2={todayX} y2={PT + cH}
        stroke={GOLD} strokeWidth={1.5} strokeDasharray="5 4" opacity={0.75}
      />
      <text x={todayX + 4} y={PT + 11} fontSize={8.5} fill={GOLD} fontFamily="'JetBrains Mono',monospace">Today</text>

      {/* X-axis date labels */}
      {LABEL_OFFSETS.map(d => (
        <text key={d}
          x={dayX(d)} y={H - 4}
          fontSize={8} fill="rgba(255,255,255,0.28)"
          fontFamily="'JetBrains Mono',monospace" textAnchor="middle"
        >{fmtDate(d)}</text>
      ))}
    </svg>
  )
}

// ── Critical Days table ───────────────────────────────────────────────────────

function CriticalDays({ birthDate, targetDate }) {
  const elapsed = getElapsed(birthDate, targetDate)
  const THRESHOLD = 0.1

  const rows = []
  for (let d = -14; d <= 14; d++) {
    const e = elapsed + d
    const cycles = []
    if (Math.abs(bioValue(e, 23)) < THRESHOLD) cycles.push({ name: 'Physical',     color: PHYS_COLOR })
    if (Math.abs(bioValue(e, 28)) < THRESHOLD) cycles.push({ name: 'Emotional',    color: EMOT_COLOR })
    if (Math.abs(bioValue(e, 33)) < THRESHOLD) cycles.push({ name: 'Intellectual', color: INT_COLOR  })
    if (cycles.length) {
      const dt = new Date(targetDate + 'T00:00:00')
      dt.setDate(dt.getDate() + d)
      rows.push({
        offset: d,
        date:   dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        cycles,
      })
    }
  }

  if (!rows.length) {
    return (
      <div style={{ color: 'var(--text-dim)', fontSize: '0.84rem', textAlign: 'center', padding: '0.75rem 0' }}>
        No critical zero-crossings in the ±14 day window.
      </div>
    )
  }

  const thStyle = {
    textAlign: 'left', padding: '0.5rem 0.75rem',
    fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem',
    letterSpacing: '1.5px', textTransform: 'uppercase',
    color: 'var(--text-dim)', borderBottom: '1px solid var(--border)',
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
        <thead>
          <tr>
            <th style={thStyle}>Date</th>
            <th style={thStyle}>Offset</th>
            <th style={thStyle}>Cycles at Zero</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-primary)', fontWeight: 500 }}>{row.date}</td>
              <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem' }}>
                {row.offset === 0 ? 'Today' : row.offset > 0 ? `+${row.offset}d` : `${row.offset}d`}
              </td>
              <td style={{ padding: '0.5rem 0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {row.cycles.map(c => (
                    <span key={c.name} style={{
                      background: `${c.color}18`, border: `1px solid ${c.color}45`,
                      color: c.color, borderRadius: 999, padding: '0.15rem 0.55rem',
                      fontSize: '0.72rem', fontWeight: 500,
                    }}>{c.name}</span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Legend helper ─────────────────────────────────────────────────────────────

function LegendLine({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
      <div style={{ width: 28, height: 3, background: color, borderRadius: 2, flexShrink: 0 }} />
      <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{label}</span>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Biorhythm() {
  const today = toDateStr(new Date())

  const [birthDate,  setBirthDate]  = useState('')
  const [targetDate, setTargetDate] = useState(today)
  const [result,     setResult]     = useState(null)
  const [error,      setError]      = useState('')

  function compute() {
    if (!birthDate) {
      setError('Please enter your date of birth.')
      return
    }
    if (new Date(birthDate + 'T00:00:00') >= new Date(targetDate + 'T00:00:00')) {
      setError('Birth date must be before the target date.')
      return
    }
    setError('')
    setResult({ birthDate, targetDate })
    setTimeout(() => document.getElementById('bio-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  const cycles = useMemo(() => {
    if (!result) return null
    const e = getElapsed(result.birthDate, result.targetDate)
    return {
      physical:     bioValue(e, 23),
      emotional:    bioValue(e, 28),
      intellectual: bioValue(e, 33),
    }
  }, [result])

  const aboutText = (
    <>
      Biorhythm theory proposes that three sinusoidal cycles begin at birth and govern human
      performance. The <strong style={{ color: PHYS_COLOR }}>Physical cycle (23 days)</strong> influences
      strength, coordination and stamina. The <strong style={{ color: EMOT_COLOR }}>Emotional cycle (28 days)</strong> governs
      mood, creativity and emotional sensitivity. The <strong style={{ color: INT_COLOR }}>Intellectual cycle (33 days)</strong> affects
      analytical thinking, memory and decision-making. Each cycle alternates between positive and negative
      phases; <em>critical days</em> occur at zero-crossings when performance can be unpredictable.
    </>
  )

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>

      {/* Breadcrumb */}
      <div className="bh-fade-up" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <Link to="/" style={{ color: 'var(--text-dim)', fontSize: '0.78rem', textDecoration: 'none', fontFamily: "'JetBrains Mono', monospace" }}>Home</Link>
        <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>/</span>
        <span style={{ color: GOLD, fontSize: '0.78rem', fontFamily: "'JetBrains Mono', monospace" }}>Biorhythm Calculator</span>
      </div>

      {/* Header */}
      <div className="bh-fade-up" style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: '0.66rem',
          color: GOLD, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '0.5rem',
        }}>
          Rhythms of Life &middot; Biocycles
        </div>
        <h1 style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 'clamp(1.9rem, 4vw, 2.8rem)', fontWeight: 600, letterSpacing: '-0.02em',
          margin: '0 0 0.5rem',
          background: `linear-gradient(120deg, ${GOLD_L} 0%, ${GOLD} 45%, ${VIO} 115%)`,
          WebkitBackgroundClip: 'text', backgroundClip: 'text',
          WebkitTextFillColor: 'transparent', color: 'transparent',
        }}>
          Biorhythm Calculator
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.7, maxWidth: '520px', margin: '0 auto' }}>
          Track your Physical, Emotional &amp; Intellectual cycles &mdash; three sine waves that govern
          your natural rhythms from the moment of birth.
        </p>
      </div>

      {/* Form */}
      <div className="bh-fade-up-1" style={card}>
        <SectionTitle>Your Details</SectionTitle>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <label style={lbl}>Date of Birth *</label>
            <input
              type="date"
              value={birthDate}
              onChange={e => setBirthDate(e.target.value)}
              max={today}
              style={inp}
            />
          </div>
          <div>
            <label style={lbl}>Target Date <span style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--text-dim)' }}>(default: today)</span></label>
            <input
              type="date"
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
              style={inp}
            />
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(229,57,53,0.08)', border: '1px solid rgba(229,57,53,0.3)',
            borderRadius: 10, padding: '0.7rem 0.9rem', marginBottom: '1rem',
            fontSize: '0.82rem', color: '#EF9A9A',
          }}>
            {error}
          </div>
        )}

        <button
          onClick={compute}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg,#F2CB84 0%,#DFA84F 42%,#A8752B 100%)',
            color: '#1C1205', border: 'none', borderRadius: 999, padding: '0.9rem',
            fontSize: '0.92rem', fontWeight: 600, letterSpacing: '0.02em',
            cursor: 'pointer', boxShadow: '0 8px 28px rgba(223,168,79,0.28)',
          }}
        >
          Calculate Biorhythm 〜
        </button>
      </div>

      {/* Info box (pre-result) */}
      {!result && (
        <div className="bh-fade-up-2" style={{ ...card, padding: '1rem 1.3rem' }}>
          <SectionTitle>About Biorhythm Theory</SectionTitle>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', lineHeight: 1.8, margin: 0 }}>
            {aboutText}
          </p>
        </div>
      )}

      {/* ── Results ── */}
      {result && cycles && (
        <div id="bio-result">

          {/* Current cycle values */}
          <div className="bh-fade-up" style={card}>
            <SectionTitle>Current Cycle Values</SectionTitle>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginTop: '-0.35rem', marginBottom: '1.2rem' }}>
              {new Date(result.targetDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              &nbsp;&middot;&nbsp;
              Day {getElapsed(result.birthDate, result.targetDate).toLocaleString('en-IN')} of life
            </p>
            <PercentBar label="Physical"     value={cycles.physical}     color={PHYS_COLOR} />
            <PercentBar label="Emotional"    value={cycles.emotional}    color={EMOT_COLOR} />
            <PercentBar label="Intellectual" value={cycles.intellectual} color={INT_COLOR}  />
          </div>

          {/* Interpretation chips */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(215px, 1fr))', gap: '0.7rem', marginBottom: '1rem' }}>
            {[
              { label: 'Physical',     value: cycles.physical,     color: PHYS_COLOR, period: '23-day cycle' },
              { label: 'Emotional',    value: cycles.emotional,    color: EMOT_COLOR, period: '28-day cycle' },
              { label: 'Intellectual', value: cycles.intellectual, color: INT_COLOR,  period: '33-day cycle' },
            ].map(c => (
              <div key={c.label} style={{
                background: `${c.color}0D`, border: `1px solid ${c.color}28`,
                borderRadius: 14, padding: '0.85rem 1rem',
              }}>
                <div style={{
                  fontSize: '0.58rem', color: c.color, letterSpacing: '1.5px',
                  textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace",
                  marginBottom: '0.25rem',
                }}>{c.label}</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.15rem' }}>
                  {getInterpretation(c.value)}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{c.period}</div>
              </div>
            ))}
          </div>

          {/* SVG wave chart */}
          <div style={card}>
            <SectionTitle>30-Day Wave Chart</SectionTitle>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <LegendLine color={PHYS_COLOR} label="Physical (23d)" />
              <LegendLine color={EMOT_COLOR} label="Emotional (28d)" />
              <LegendLine color={INT_COLOR}  label="Intellectual (33d)" />
            </div>
            <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 12, padding: '0.6rem 0.4rem', overflow: 'hidden' }}>
              <BioChart birthDate={result.birthDate} targetDate={result.targetDate} />
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.65rem', textAlign: 'center' }}>
              15 days before &rarr; 14 days after target date &nbsp;&middot;&nbsp; Dashed line marks target date
            </div>
          </div>

          {/* Critical days */}
          <div style={card}>
            <SectionTitle color={VIO}>Critical Days (±14 days)</SectionTitle>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginTop: '-0.35rem', marginBottom: '0.9rem', lineHeight: 1.65 }}>
              A critical day occurs when a cycle crosses zero — transitioning between positive and negative phases.
              These days carry heightened unpredictability; avoid major decisions if possible.
            </p>
            <CriticalDays birthDate={result.birthDate} targetDate={result.targetDate} />
          </div>

          {/* About (post-result) */}
          <div style={{ ...card, padding: '1rem 1.3rem' }}>
            <SectionTitle>About Biorhythm Theory</SectionTitle>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', lineHeight: 1.8, margin: 0 }}>
              {aboutText}
            </p>
          </div>

        </div>
      )}

    </div>
  )
}
