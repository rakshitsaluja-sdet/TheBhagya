import { useState } from 'react'
import { Link } from 'react-router-dom'

const GOLD   = '#DFA84F'
const GOLD_L = '#F2CB84'
const VIO    = '#8B6FE8'

// ── Direction data (Vastu Purusha Mandala) ────────────────────────────────────
const DIRECTIONS = {
  N:  { label: 'North',     short: 'N',  deity: 'Kuber',    element: 'Water', planet: 'Mercury',
        color: '#43A047', colors: ['Green', 'Blue', 'Emerald'],
        ideal: ['Living Room', 'Study / Office', 'Cash Locker', 'Open Space'],
        avoid: ['Kitchen', 'Toilet', 'Staircase'],
        meaning: 'Zone of wealth, career, and prosperity. Governed by Kuber, lord of abundance.' },
  NE: { label: 'North-East', short: 'NE', deity: 'Ishanya (Shiva)', element: 'Water + Ether', planet: 'Jupiter',
        color: '#B0BEC5', colors: ['White', 'Light Yellow', 'Cream'],
        ideal: ['Pooja Room', 'Meditation Space', 'Open Space', 'Study'],
        avoid: ['Kitchen', 'Toilet', 'Master Bedroom', 'Storage'],
        meaning: 'The most sacred corner — zone of divine grace, spirituality, and wisdom.' },
  E:  { label: 'East',      short: 'E',  deity: 'Indra',    element: 'Air + Ether', planet: 'Sun',
        color: '#F9A825', colors: ['White', 'Light Orange', 'Pale Yellow'],
        ideal: ['Living Room', 'Main Entrance', 'Bathroom (not toilet)', 'Garden'],
        avoid: ['Bedroom', 'Kitchen', 'Heavy Storage'],
        meaning: 'Zone of sunrise energy, health, and new beginnings. Keep light and open.' },
  SE: { label: 'South-East', short: 'SE', deity: 'Agni',    element: 'Fire', planet: 'Venus',
        color: '#E57C3A', colors: ['Orange', 'Red', 'Pink'],
        ideal: ['Kitchen', 'Fire / Electrical Equipment', 'Generator'],
        avoid: ['Bedroom', 'Pooja Room', 'Main Entrance', 'Toilet'],
        meaning: 'Zone of Agni (fire). Natural home for the kitchen and all heat-related activities.' },
  S:  { label: 'South',     short: 'S',  deity: 'Yama',     element: 'Earth + Fire', planet: 'Mars',
        color: '#E53935', colors: ['Red', 'Pink', 'Coral'],
        ideal: ['Master Bedroom', 'Heavy Storage', 'Stairs'],
        avoid: ['Main Entrance', 'Open Space', 'Pooja Room'],
        meaning: 'Zone of stability, strength, and rest. Heavy structures and the master bedroom belong here.' },
  SW: { label: 'South-West', short: 'SW', deity: 'Nairutya', element: 'Earth', planet: 'Rahu / Saturn',
        color: '#795548', colors: ['Brown', 'Yellow-Brown', 'Earthy Tones'],
        ideal: ['Master Bedroom', 'Heavy Storage', 'Locker Room'],
        avoid: ['Main Entrance', 'Kitchen', 'Pooja Room', 'Open Space'],
        meaning: 'The zone of earth energy — heaviness, stability, and the head of household. Never leave open.' },
  W:  { label: 'West',      short: 'W',  deity: 'Varuna',   element: 'Air + Water', planet: 'Saturn',
        color: '#3949AB', colors: ['Blue', 'Grey', 'White'],
        ideal: ["Children's Bedroom", 'Dining Room', 'Study'],
        avoid: ['Main Entrance', 'Kitchen', 'Pooja Room'],
        meaning: 'Zone of gains and stability. Ideal for children and dining — supports growth and nourishment.' },
  NW: { label: 'North-West', short: 'NW', deity: 'Vayu',    element: 'Air', planet: 'Moon',
        color: '#90CAF9', colors: ['White', 'Light Grey', 'Silver'],
        ideal: ['Guest Room', 'Toilet / Bathroom', 'Garage', 'Store Room'],
        avoid: ['Master Bedroom', 'Pooja Room', 'Cash Locker'],
        meaning: 'Zone of movement and air energy. Guests, helpers, and vehicles belong here.' },
  C:  { label: 'Centre',    short: 'C',  deity: 'Brahma',   element: 'Space (Akasha)', planet: 'All',
        color: GOLD, colors: ['No colour — keep it open'],
        ideal: ['Open Courtyard', 'Light Well', 'Empty Space'],
        avoid: ['Bedroom', 'Kitchen', 'Toilet', 'Heavy Pillars', 'Stairs'],
        meaning: 'Brahmasthana — the sacred centre. Must remain open for energy to circulate freely.' },
}

// ── Room types ─────────────────────────────────────────────────────────────────
const ROOMS = [
  'Master Bedroom', "Children's Bedroom", 'Guest Room',
  'Kitchen', 'Living Room', 'Dining Room',
  'Study / Office', 'Pooja Room', 'Meditation Space',
  'Toilet / Bathroom', 'Storage / Store Room', 'Staircase',
  'Garage', 'Open Space / Courtyard', 'Main Entrance',
  '(Empty / Not used)',
]

// ── Vastu score matrix ─────────────────────────────────────────────────────────
// 4 = Excellent, 3 = Good, 2 = Neutral, 1 = Avoid, 0 = Very Bad (Dosha)
const SCORES = {
  'Master Bedroom':        { N:2, NE:1, E:2, SE:1, S:4, SW:4, W:3, NW:2, C:0 },
  "Children's Bedroom":    { N:3, NE:2, E:3, SE:2, S:2, SW:2, W:4, NW:3, C:0 },
  'Guest Room':            { N:3, NE:2, E:2, SE:2, S:2, SW:2, W:3, NW:4, C:0 },
  'Kitchen':               { N:1, NE:0, E:2, SE:4, S:3, SW:1, W:2, NW:2, C:0 },
  'Living Room':           { N:4, NE:3, E:4, SE:2, S:2, SW:2, W:3, NW:2, C:0 },
  'Dining Room':           { N:3, NE:2, E:3, SE:2, S:2, SW:2, W:4, NW:3, C:0 },
  'Study / Office':        { N:4, NE:4, E:4, SE:2, S:2, SW:2, W:3, NW:2, C:0 },
  'Pooja Room':            { N:3, NE:4, E:4, SE:1, S:1, SW:1, W:2, NW:2, C:0 },
  'Meditation Space':      { N:3, NE:4, E:4, SE:2, S:2, SW:2, W:2, NW:2, C:0 },
  'Toilet / Bathroom':     { N:1, NE:0, E:2, SE:2, S:2, SW:2, W:3, NW:4, C:0 },
  'Storage / Store Room':  { N:2, NE:1, E:2, SE:2, S:4, SW:4, W:3, NW:3, C:0 },
  'Staircase':             { N:2, NE:1, E:2, SE:3, S:4, SW:3, W:3, NW:2, C:0 },
  'Garage':                { N:2, NE:1, E:3, SE:2, S:3, SW:2, W:2, NW:4, C:0 },
  'Open Space / Courtyard':{ N:4, NE:4, E:4, SE:2, S:2, SW:1, W:2, NW:2, C:4 },
  'Main Entrance':         { N:4, NE:3, E:4, SE:2, S:1, SW:0, W:2, NW:3, C:0 },
  '(Empty / Not used)':   { N:3, NE:3, E:3, SE:2, S:2, SW:2, W:2, NW:2, C:3 },
}

const SCORE_META = {
  4: { label: 'Excellent', color: '#43A047', bg: 'rgba(67,160,71,0.15)', border: 'rgba(67,160,71,0.5)' },
  3: { label: 'Good',      color: '#8BC34A', bg: 'rgba(139,195,74,0.12)', border: 'rgba(139,195,74,0.4)' },
  2: { label: 'Neutral',   color: GOLD,      bg: 'rgba(223,168,79,0.1)', border: 'rgba(223,168,79,0.35)' },
  1: { label: 'Avoid',     color: '#FF7043', bg: 'rgba(255,112,67,0.12)', border: 'rgba(255,112,67,0.4)' },
  0: { label: 'Dosha ⚠',  color: '#E53935', bg: 'rgba(229,57,53,0.15)', border: 'rgba(229,57,53,0.5)' },
}

// ── Remedies for common doshas ─────────────────────────────────────────────────
const REMEDIES = {
  'Kitchen in NE': {
    title: 'Kitchen in North-East (Agni Dosha)',
    problem: 'Fire energy in the sacred NE corner causes conflicts, financial losses, and health issues.',
    remedies: ['Place a Vastu pyramid or copper plate at the kitchen entrance.',
      'Keep a small bowl of salt in the NE corner of the kitchen.',
      'Use yellow and white colours in the kitchen décor.',
      'Light a ghee lamp in the NE of the house daily.',
      'Add a copper Swastika symbol at the NE entrance.'],
  },
  'Toilet in NE': {
    title: 'Toilet in North-East (Severe Dosha)',
    problem: 'The most severe Vastu dosha — blocks divine energy, causes health problems and financial decline.',
    remedies: ['Place a Vastu pyramid inside the toilet at the NE corner.',
      'Keep sea salt in a bowl and change it every month.',
      'Hang a lead (seesa) strip at the entrance of the toilet.',
      'Use a bright white light inside at all times.',
      'Place a crystal ball or Vastu yantra outside the toilet door.'],
  },
  'Main Entrance in SW': {
    title: 'Main Entrance in South-West (Dosha)',
    problem: 'SW entrance invites negative energy, arguments, debts, and instability for residents.',
    remedies: ['Place a Vastu pyramid above the main door on the inside.',
      'Affix a copper strip at the door threshold.',
      'Hang a metallic Ganesha or Om symbol above the door.',
      'Keep the SW door heavier, darker, and less frequently used.',
      'Plant a large tree or create a heavy structure outside to block the SW.'],
  },
  'Pooja Room in SE or SW': {
    title: 'Pooja Room in SE/SW (Agni or Nairutya Dosha)',
    problem: 'Fire or earth energy disrupts divine vibrations; prayers may not yield results.',
    remedies: ['Place the deity idols facing East or North within the pooja room.',
      'Use yellow or white décor to counteract the directional energy.',
      'Light incense and a lamp daily to purify the space.',
      'Add a Vastu yantra or Shree Yantra in the NE of the room.',
      'Sprinkle Ganga jal in the corners on each Purnima.'],
  },
  'Open Centre': {
    title: 'Centre is Blocked or Heavy (Brahmasthana Dosha)',
    problem: 'Blocking the Brahmasthana with walls, pillars, or heavy furniture causes health, wealth and harmony issues.',
    remedies: ['Remove all heavy furniture or walls from the exact centre.',
      'Keep a Tulsi plant or light source at the centre if some object is unavoidable.',
      'Place a Vastu pyramid or crystal cluster at the centre.',
      'Ensure maximum light and ventilation in this area.',
      'Draw a Swastika or Om symbol at the centre using kumkum on each new moon.'],
  },
  'Bedroom in NE': {
    title: 'Bedroom in North-East (Ishanya Dosha)',
    problem: 'NE bedroom causes health problems, disturbed sleep, and a restless mind.',
    remedies: ['Shift sleeping position so the head points South or East.',
      'Place a Vastu sleep pyramid under the mattress.',
      'Avoid mirrors facing the bed; cover them at night.',
      'Use light, cool colours in the room.',
      'Keep the NE corner of the bedroom absolutely clean and clutter-free.'],
  },
}

function getDoshaRemedies(assignments) {
  const matched = []
  Object.entries(assignments).forEach(([dir, room]) => {
    if (!room || room === '(Empty / Not used)') return
    const score = SCORES[room]?.[dir] ?? 2
    if (score === 0) {
      if (room === 'Kitchen' && dir === 'NE') matched.push(REMEDIES['Kitchen in NE'])
      else if ((room === 'Toilet / Bathroom') && dir === 'NE') matched.push(REMEDIES['Toilet in NE'])
      else if (room === 'Main Entrance' && dir === 'SW') matched.push(REMEDIES['Main Entrance in SW'])
      else if (room === 'Pooja Room' && (dir === 'SE' || dir === 'SW')) matched.push(REMEDIES['Pooja Room in SE or SW'])
    }
    if (dir === 'C' && score < 3) matched.push(REMEDIES['Open Centre'])
    if ((room === 'Master Bedroom' || room === "Children's Bedroom") && dir === 'NE')
      matched.push(REMEDIES['Bedroom in NE'])
  })
  // deduplicate
  const seen = new Set()
  return matched.filter(r => { if (seen.has(r.title)) return false; seen.add(r.title); return true })
}

// ── Grid layout (3×3 compass) ─────────────────────────────────────────────────
const GRID_ORDER = [
  ['NW', 'N', 'NE'],
  ['W',  'C',  'E'],
  ['SW', 'S', 'SE'],
]

// ── Shared styles ──────────────────────────────────────────────────────────────
const card = {
  background: 'var(--bg-card)', border: '1px solid var(--border)',
  borderRadius: 18, padding: '1.4rem 1.6rem', marginBottom: '1rem',
  backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)',
  boxShadow: 'var(--shadow-card)',
}
const lbl = {
  color: 'var(--text-dim)', fontSize: '0.68rem', fontWeight: 500,
  fontFamily: "'JetBrains Mono', monospace",
  letterSpacing: '2px', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem',
}

function SectionTitle({ children, color }) {
  return (
    <div style={{
      fontFamily: "'JetBrains Mono',monospace", fontSize: '0.64rem',
      color: color || GOLD, letterSpacing: '2.5px', textTransform: 'uppercase',
      marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.6rem',
    }}>
      <span style={{ flex: 1, height: 1, background: `linear-gradient(90deg,${color || GOLD}55,transparent)` }} />
      {children}
      <span style={{ flex: 1, height: 1, background: `linear-gradient(270deg,${color || GOLD}55,transparent)` }} />
    </div>
  )
}

// ── Zone cell ──────────────────────────────────────────────────────────────────
function ZoneCell({ dirKey, room, onChange, compact }) {
  const dir   = DIRECTIONS[dirKey]
  const score = room ? (SCORES[room]?.[dirKey] ?? 2) : null
  const meta  = score !== null ? SCORE_META[score] : null

  return (
    <div style={{
      background: meta ? meta.bg : 'rgba(255,255,255,0.03)',
      border: `1.5px solid ${meta ? meta.border : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 14, padding: compact ? '0.6rem' : '0.85rem',
      display: 'flex', flexDirection: 'column', gap: '0.4rem',
      minWidth: 0, minHeight: compact ? 90 : 110,
      position: 'relative', transition: 'all 0.2s',
    }}>
      {/* Direction label */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.62rem',
          color: dir.color, fontWeight: 700, letterSpacing: '1px' }}>{dir.label}</span>
        {meta && (
          <span style={{ fontSize: '0.55rem', color: meta.color,
            fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase',
            letterSpacing: '0.5px' }}>{meta.label}</span>
        )}
      </div>

      {/* Planet/deity hint */}
      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
        {dir.planet} · {dir.element}
      </div>

      {/* Room selector */}
      <select
        value={room || ''}
        onChange={e => onChange(dirKey, e.target.value || null)}
        style={{ background: 'var(--bg-deep)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8, color: room ? 'var(--text-primary)' : 'var(--text-muted)',
          fontSize: '0.72rem', padding: '0.3rem 0.4rem', outline: 'none',
          width: '100%', cursor: 'pointer' }}
      >
        <option value="">— Assign room —</option>
        {ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
    </div>
  )
}

// ── Direction info panel ───────────────────────────────────────────────────────
function DirectionCard({ dirKey, room }) {
  const dir   = DIRECTIONS[dirKey]
  const score = room ? (SCORES[room]?.[dirKey] ?? 2) : null
  const meta  = score !== null ? SCORE_META[score] : null

  return (
    <div style={{ ...card, border: `1px solid ${dir.color}44`,
      boxShadow: `0 0 14px ${dir.color}18`, marginBottom: '0.65rem' }}>
      <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%',
          background: `${dir.color}22`, border: `1.5px solid ${dir.color}66`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '0.85rem', color: dir.color, flexShrink: 0 }}>
          {dir.short}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem',
            flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontFamily: "'Fraunces',serif", fontSize: '1rem',
              fontWeight: 700, color: 'var(--text-primary)' }}>{dir.label}</span>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
              {dir.deity} · {dir.planet}
            </span>
            {meta && (
              <span style={{ background: meta.bg, border: `1px solid ${meta.border}`,
                borderRadius: 6, padding: '0.15rem 0.55rem', color: meta.color,
                fontSize: '0.68rem', fontFamily: "'JetBrains Mono',monospace" }}>
                {room} — {meta.label}
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', margin: '0 0 0.6rem',
            lineHeight: 1.6 }}>{dir.meaning}</p>
          <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.62rem', color: '#43A047',
                fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase',
                letterSpacing: '1px', marginBottom: 3 }}>Ideal for</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {dir.ideal.join(', ')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.62rem', color: '#E53935',
                fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase',
                letterSpacing: '1px', marginBottom: 3 }}>Avoid</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {dir.avoid.join(', ')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.62rem', color: GOLD,
                fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase',
                letterSpacing: '1px', marginBottom: 3 }}>Colours</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {dir.colors.join(', ')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Remedy card ────────────────────────────────────────────────────────────────
function RemedyCard({ remedy }) {
  return (
    <div style={{ ...card, border: '1px solid rgba(229,57,53,0.35)',
      boxShadow: '0 0 16px rgba(229,57,53,0.1)' }}>
      <div style={{ color: '#EF5350', fontWeight: 700, fontSize: '0.95rem',
        marginBottom: '0.4rem' }}>{remedy.title}</div>
      <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem',
        lineHeight: 1.6, margin: '0 0 0.75rem' }}>{remedy.problem}</p>
      <div style={{ fontSize: '0.65rem', color: GOLD,
        fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase',
        letterSpacing: '1.5px', marginBottom: '0.5rem' }}>Remedies</div>
      <ul style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex',
        flexDirection: 'column', gap: '0.35rem' }}>
        {remedy.remedies.map((r, i) => (
          <li key={i} style={{ color: 'var(--text-secondary)', fontSize: '0.83rem',
            lineHeight: 1.6 }}>{r}</li>
        ))}
      </ul>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Vastu() {
  // dirKey → room name
  const [assignments, setAssignments] = useState({})
  const [activeDir,   setActiveDir]   = useState(null)
  const [tab,         setTab]         = useState('grid') // 'grid' | 'guide' | 'remedies'

  function assign(dirKey, room) {
    setAssignments(a => ({ ...a, [dirKey]: room }))
  }

  // Overall score
  const scored = Object.entries(assignments)
    .filter(([, r]) => r && r !== '(Empty / Not used)')
  const totalScore = scored.length
    ? Math.round(scored.reduce((sum, [d, r]) => sum + (SCORES[r]?.[d] ?? 2), 0) / scored.length * 25)
    : null

  const doshas = getDoshaRemedies(assignments)

  const scoreColor = totalScore === null ? 'var(--text-dim)'
    : totalScore >= 80 ? '#43A047'
    : totalScore >= 60 ? GOLD
    : totalScore >= 40 ? '#FF7043'
    : '#E53935'

  const dirs = Object.keys(DIRECTIONS)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', color: 'var(--text-primary)',
      padding: '5.5rem 5vw 4rem', maxWidth: 900, margin: '0 auto' }}>

      {/* Breadcrumb */}
      <div style={{ fontSize: '0.75rem', marginBottom: '1.8rem', color: 'var(--text-dim)',
        fontFamily: "'JetBrains Mono',monospace" }}>
        <Link to="/" style={{ color: 'var(--text-dim)', textDecoration: 'none' }}>Home</Link>
        {' / '}
        <span style={{ color: GOLD }}>Vastu Shastra</span>
      </div>

      {/* Page title */}
      <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 'clamp(1.8rem,5vw,2.8rem)',
        fontWeight: 700, background: `linear-gradient(135deg,${GOLD_L},${VIO})`,
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        marginBottom: '0.4rem' }}>
        Vastu Shastra Analyzer
      </h1>
      <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '2rem' }}>
        Map your rooms to the 8 directions + centre. Get Vastu scores, dosha warnings, colours &amp; remedies.
      </p>

      {/* Score strip */}
      {totalScore !== null && (
        <div style={{ ...card, borderColor: `${scoreColor}55`, display: 'flex',
          alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: '2.8rem',
              fontWeight: 700, color: scoreColor, lineHeight: 1 }}>{totalScore}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)',
              fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase',
              letterSpacing: '1.5px' }}>Vastu Score</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.07)',
              borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ height: '100%', width: `${totalScore}%`,
                background: `linear-gradient(90deg,${scoreColor},${scoreColor}99)`,
                borderRadius: 4, transition: 'width 0.5s' }} />
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              {totalScore >= 80 ? '✦ Excellent Vastu — your space is highly energetically aligned.'
               : totalScore >= 60 ? '✓ Good Vastu — minor adjustments will optimise the energy flow.'
               : totalScore >= 40 ? '⚠ Average Vastu — several corrections are recommended.'
               : '✗ Significant Vastu doshas detected — remedies are strongly advised.'}
            </div>
            {doshas.length > 0 && (
              <div style={{ marginTop: 6, fontSize: '0.78rem', color: '#EF5350' }}>
                {doshas.length} dosha{doshas.length > 1 ? 's' : ''} detected — see Remedies tab.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.4rem', flexWrap: 'wrap' }}>
        {[
          { id: 'grid',    label: 'Vastu Grid' },
          { id: 'guide',   label: 'Direction Guide' },
          { id: 'remedies', label: `Remedies${doshas.length ? ` (${doshas.length})` : ''}` },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: tab === t.id ? `linear-gradient(135deg,${GOLD},${VIO})` : 'transparent',
            border: tab === t.id ? 'none' : `1px solid rgba(255,255,255,0.12)`,
            borderRadius: 10, padding: '0.55rem 1.2rem',
            color: tab === t.id ? '#07060F' : 'var(--text-secondary)',
            fontSize: '0.83rem', fontWeight: tab === t.id ? 700 : 400, cursor: 'pointer',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── Tab: Grid ── */}
      {tab === 'grid' && (
        <div style={card}>
          <SectionTitle>Vastu Purusha Mandala</SectionTitle>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginBottom: '1.2rem', lineHeight: 1.6 }}>
            Assign rooms to each zone. The grid is oriented as a compass — North at top, South at bottom.
          </p>

          {/* 3×3 grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem',
            marginBottom: '1.2rem' }}>
            {GRID_ORDER.map((row, ri) =>
              row.map(dirKey => (
                <ZoneCell key={dirKey} dirKey={dirKey}
                  room={assignments[dirKey] || null}
                  onChange={assign}
                  compact={false} />
              ))
            )}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {Object.entries(SCORE_META).reverse().map(([score, meta]) => (
              <span key={score} style={{ background: meta.bg, border: `1px solid ${meta.border}`,
                borderRadius: 6, padding: '0.2rem 0.65rem',
                color: meta.color, fontSize: '0.7rem',
                fontFamily: "'JetBrains Mono',monospace" }}>{meta.label}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab: Direction Guide ── */}
      {tab === 'guide' && (
        <div>
          <SectionTitle>Direction-by-Direction Guide</SectionTitle>
          {dirs.map(d => (
            <DirectionCard key={d} dirKey={d} room={assignments[d] || null} />
          ))}
        </div>
      )}

      {/* ── Tab: Remedies ── */}
      {tab === 'remedies' && (
        <div>
          <SectionTitle color="#EF5350">Vastu Dosha Remedies</SectionTitle>
          {doshas.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', color: '#43A047',
              fontSize: '0.9rem', padding: '2rem' }}>
              {scored.length === 0
                ? 'Assign rooms in the Vastu Grid to detect doshas.'
                : '✦ No major doshas detected in your layout. Excellent!'}
            </div>
          ) : (
            doshas.map((r, i) => <RemedyCard key={i} remedy={r} />)
          )}

          {/* General tips */}
          <div style={{ ...card, borderColor: `${GOLD}33`, marginTop: '0.5rem' }}>
            <SectionTitle>Universal Vastu Tips</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))',
              gap: '0.75rem' }}>
              {[
                { icon: '🌿', tip: 'Place a Tulsi plant in the North or North-East for positive energy.' },
                { icon: '💧', tip: 'Keep water features (aquarium, fountain) in the North or North-East.' },
                { icon: '🪞', tip: 'Never place mirrors facing the bed — cover them at night.' },
                { icon: '🧹', tip: 'Clutter blocks energy. Declutter every zone regularly.' },
                { icon: '💡', tip: 'Ensure the South-West corner is always heavy, dark, and well-lit.' },
                { icon: '🌅', tip: 'Let morning sunlight enter from the East — keep East windows clear.' },
                { icon: '🔺', tip: 'Place a Vastu pyramid or Sri Yantra at the centre of the home.' },
                { icon: '🎨', tip: 'Use colours that match each direction\'s element for harmony.' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
                  background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '0.65rem 0.8rem' }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem',
                    lineHeight: 1.6 }}>{item.tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
