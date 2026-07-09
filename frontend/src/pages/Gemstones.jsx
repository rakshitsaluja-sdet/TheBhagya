import { useState } from 'react'
import { Link } from 'react-router-dom'

const GOLD   = '#DFA84F'
const GOLD_L = '#F2CB84'

// ── Gemstone data for all 9 Jyotish planets ───────────────────────────────────
const STONES = {
  Sun: {
    planet: 'Sun', hi: 'सूर्य', symbol: '☉',
    primary:    { en: 'Ruby', hi: 'Māṇik (Māṇik)', gem: 'Ruby' },
    substitute: { en: 'Red Garnet / Red Spinel', hi: 'Lāl Gārneṭ' },
    color: '#E53935', bg: 'rgba(229,57,53,0.08)', border: 'rgba(229,57,53,0.28)',
    metal: 'Gold', finger: 'Ring finger, right hand', day: 'Sunday',
    time: 'Sunday morning, within 1 hour of sunrise',
    weight: '3–5 carats minimum (Ruby); 5–8 carats (Garnet)',
    mantra: 'Om Surāya Namaḥ — 108 times',
    benefits: [
      'Leadership, authority, and government favour',
      'Confidence and self-expression',
      'Vitality, immunity, and eye health',
      'Improved father relationship',
    ],
    caution: 'Ruby is intense. If Sun is weak or afflicted in your chart, begin with Red Garnet for 3 months first.',
    quality: 'auspicious',
  },
  Moon: {
    planet: 'Moon', hi: 'चंद्र', symbol: '☽',
    primary:    { en: 'Pearl', hi: 'Motī (Moti)', gem: 'Pearl' },
    substitute: { en: 'Moonstone / White Coral', hi: 'Chandrakānt Maṇi' },
    color: '#B0BEC5', bg: 'rgba(176,190,197,0.08)', border: 'rgba(176,190,197,0.3)',
    metal: 'Silver', finger: 'Little finger, right hand', day: 'Monday',
    time: 'Monday morning, within 1 hour of sunrise',
    weight: '2–5 carats (Pearl); 5–10 carats (Moonstone)',
    mantra: 'Om Chandrāya Namaḥ — 108 times',
    benefits: [
      'Emotional balance and mental peace',
      'Intuition and creative imagination',
      'Mother relationship and nurturing energy',
      'Better sleep and reduced anxiety',
    ],
    caution: 'Use only natural sea pearl, not cultured freshwater pearl. Moonstone is a safe and gentle substitute.',
    quality: 'auspicious',
  },
  Mars: {
    planet: 'Mars', hi: 'मंगल', symbol: '♂',
    primary:    { en: 'Red Coral', hi: 'Mūṅgā (Moonga)', gem: 'Red Coral' },
    substitute: { en: 'Carnelian', hi: 'Lāl Haqīq' },
    color: '#E07B39', bg: 'rgba(224,123,57,0.08)', border: 'rgba(224,123,57,0.28)',
    metal: 'Gold or Copper', finger: 'Ring finger, right hand', day: 'Tuesday',
    time: 'Tuesday morning, within 2 hours of sunrise',
    weight: '6–12 carats (Coral); 8–15 carats (Carnelian)',
    mantra: 'Om Maṅgalāya Namaḥ — 108 times',
    benefits: [
      'Courage, drive, and physical energy',
      'Property, real estate, and land matters',
      'Sibling harmony and team leadership',
      'Faster recovery from surgery and injury',
    ],
    caution: 'Avoid if you have hypertension or chronic anger. Do not combine Red Coral with Emerald (Mercury is enemy of Mars).',
    quality: 'good',
  },
  Mercury: {
    planet: 'Mercury', hi: 'बुध', symbol: '☿',
    primary:    { en: 'Emerald', hi: 'Pannā (Panna)', gem: 'Emerald' },
    substitute: { en: 'Green Tourmaline / Peridot', hi: 'Harā Turmalīn' },
    color: '#43A047', bg: 'rgba(67,160,71,0.08)', border: 'rgba(67,160,71,0.28)',
    metal: 'Gold', finger: 'Little finger, right hand', day: 'Wednesday',
    time: 'Wednesday morning, within 2 hours of sunrise',
    weight: '3–5 carats (Emerald); 5–10 carats (substitute)',
    mantra: 'Om Budhāya Namaḥ — 108 times',
    benefits: [
      'Intelligence, memory, and analytical skill',
      'Communication, writing, and speech',
      'Business acumen and trade success',
      'Skin health and nervous system balance',
    ],
    caution: 'Do not wear Emerald with Red Coral — Mars and Mercury are enemies. Test with Green Tourmaline first.',
    quality: 'auspicious',
  },
  Jupiter: {
    planet: 'Jupiter', hi: 'गुरु', symbol: '♃',
    primary:    { en: 'Yellow Sapphire', hi: 'Pukhrāj (Pukhraj)', gem: 'Yellow Sapphire' },
    substitute: { en: 'Citrine / Yellow Topaz', hi: 'Sunahalā' },
    color: '#F9A825', bg: 'rgba(249,168,37,0.08)', border: 'rgba(249,168,37,0.28)',
    metal: 'Gold', finger: 'Index finger, right hand', day: 'Thursday',
    time: 'Thursday morning, within 2 hours of sunrise',
    weight: '3–5 carats (Sapphire); 5–10 carats (Citrine)',
    mantra: 'Om Gurave Namaḥ — 108 times',
    benefits: [
      'Wisdom, higher learning, and spiritual growth',
      'Marriage, progeny, and family harmony',
      'Wealth, prosperity, and dharmic fortune',
      'Teacher and mentor relationships',
    ],
    caution: 'Yellow Sapphire is considered broadly safe and beneficial. Still verify Jupiter’s placement with a jyotishi.',
    quality: 'auspicious',
  },
  Venus: {
    planet: 'Venus', hi: 'शुक्र', symbol: '♀',
    primary:    { en: 'Diamond', hi: 'Hīrā (Heera)', gem: 'Diamond' },
    substitute: { en: 'White Sapphire / Opal / Zircon', hi: 'Safed Pukhrāj' },
    color: '#90CAF9', bg: 'rgba(144,202,249,0.08)', border: 'rgba(144,202,249,0.28)',
    metal: 'Platinum or Silver', finger: 'Middle finger, right hand', day: 'Friday',
    time: 'Friday morning, within 2 hours of sunrise',
    weight: '0.5–1 carat (Diamond); 3–5 carats (White Sapphire)',
    mantra: 'Om Śukrāya Namaḥ — 108 times',
    benefits: [
      'Love, romance, and marital harmony',
      'Luxury, comfort, and aesthetic beauty',
      'Creative arts, music, and performance',
      'Reproductive health and vitality',
    ],
    caution: 'Diamond amplifies Venus intensely. White Sapphire is equally effective and far more accessible. Avoid if Venus is debilitated.',
    quality: 'auspicious',
  },
  Saturn: {
    planet: 'Saturn', hi: 'शनि', symbol: '♄',
    primary:    { en: 'Blue Sapphire', hi: 'Nīlam (Neelam)', gem: 'Blue Sapphire' },
    substitute: { en: 'Amethyst / Blue Spinel', hi: 'Kaṭelā' },
    color: '#3949AB', bg: 'rgba(57,73,171,0.08)', border: 'rgba(57,73,171,0.28)',
    metal: 'Gold or Silver', finger: 'Middle finger, right hand', day: 'Saturday',
    time: 'Saturday morning, within 2 hours of sunrise',
    weight: '3–5 carats (Blue Sapphire); 5–10 carats (Amethyst)',
    mantra: 'Om Śanaiścarāya Namaḥ — 108 times',
    benefits: [
      'Career stability and professional discipline',
      'Longevity and chronic health support',
      'Justice, karma resolution, and perseverance',
      'Technical and managerial skill',
    ],
    caution: '⚠ Blue Sapphire is the most powerful gemstone in Jyotish. Test Amethyst on the body for 3 days before committing. Consult an astrologer.',
    quality: 'neutral',
  },
  Rahu: {
    planet: 'Rahu', hi: 'राहु', symbol: '☊',
    primary:    { en: 'Hessonite (Gomed)', hi: 'Gomed', gem: 'Hessonite' },
    substitute: { en: 'Zircon / Spessartite Garnet', hi: 'Jirakan' },
    color: '#795548', bg: 'rgba(121,85,72,0.08)', border: 'rgba(121,85,72,0.28)',
    metal: 'Silver or Panchdhatu', finger: 'Middle finger, right hand', day: 'Saturday',
    time: 'Saturday, at sunset (Rahu hour)',
    weight: '6–10 carats (Gomed); 8–15 carats (Zircon)',
    mantra: 'Om Rāhave Namaḥ — 108 times',
    benefits: [
      'Foreign travel, settlement, and connections',
      'Technology, innovation, and unconventional success',
      'Mass influence and politics',
      'Relief during Rahu Mahadasha/Antardasha',
    ],
    caution: 'Gomed is most relevant during Rahu dasha. Verify Rahu’s placement is positive before wearing.',
    quality: 'neutral',
  },
  Ketu: {
    planet: 'Ketu', hi: 'केतु', symbol: '☋',
    primary:    { en: "Cat's Eye (Lehsunia)", hi: 'Lahsuniyā', gem: "Cat's Eye" },
    substitute: { en: 'Tiger Eye', hi: 'Ṭāīgar Āī' },
    color: '#8D6E63', bg: 'rgba(141,110,99,0.08)', border: 'rgba(141,110,99,0.28)',
    metal: 'Silver or Gold', finger: 'Little finger, right hand', day: 'Tuesday',
    time: 'Tuesday morning, within 2 hours of sunrise',
    weight: '3–5 carats',
    mantra: 'Om Ketave Namaḥ — 108 times',
    benefits: [
      'Spiritual insight and intuitive clarity',
      'Liberation from past-life karma',
      'Protection from hidden enemies and psychic attack',
      'Relief during Ketu Mahadasha/Antardasha',
    ],
    caution: "⚠ Cat's Eye acts very rapidly — sometimes within hours. Test Tiger Eye first. Very powerful; consult an astrologer.",
    quality: 'neutral',
  },
}

// ── Lagna → lord mapping ───────────────────────────────────────────────────────
const LAGNA_LORD = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon',
  Leo: 'Sun', Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Mars',
  Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter',
}

// ── Benefic planets for each lagna (friendly to lagna lord / lords of 5th/9th) ──
const BENEFICS = {
  Aries:       ['Sun', 'Jupiter', 'Moon'],
  Taurus:      ['Saturn', 'Mercury', 'Venus'],
  Gemini:      ['Venus', 'Saturn'],
  Cancer:      ['Mars', 'Jupiter'],
  Leo:         ['Mars', 'Jupiter', 'Sun'],
  Virgo:       ['Venus', 'Mercury'],
  Libra:       ['Saturn', 'Mercury'],
  Scorpio:     ['Jupiter', 'Moon', 'Sun'],
  Sagittarius: ['Mars', 'Sun', 'Jupiter'],
  Capricorn:   ['Venus', 'Mercury', 'Saturn'],
  Aquarius:    ['Venus', 'Mercury', 'Saturn'],
  Pisces:      ['Moon', 'Mars', 'Jupiter'],
}

// ── Planets to AVOID for each lagna ──────────────────────────────────────────
const AVOID = {
  Aries:       ['Mercury', 'Venus'],
  Taurus:      ['Sun', 'Mars'],
  Gemini:      ['Moon', 'Jupiter'],
  Cancer:      ['Mercury', 'Saturn', 'Venus'],
  Leo:         ['Saturn', 'Venus', 'Mercury'],
  Virgo:       ['Moon', 'Jupiter'],
  Libra:       ['Sun', 'Jupiter'],
  Scorpio:     ['Mercury', 'Venus'],
  Sagittarius: ['Mercury', 'Venus'],
  Capricorn:   ['Sun', 'Moon', 'Mars'],
  Aquarius:    ['Sun', 'Moon', 'Mars'],
  Pisces:      ['Mercury', 'Venus', 'Saturn'],
}

const RASHIS = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces',
]
const PLANETS = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu']

const QUALITY_COLOR = {
  auspicious: '#43A047', good: '#DFA84F', neutral: '#8B6FE8',
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StoneCard({ stone, role, roleColor }) {
  if (!stone) return null
  return (
    <div style={{
      background: stone.bg, border: `1px solid ${stone.border}`,
      borderRadius: 20, padding: '1.4rem 1.6rem', marginBottom: '1rem',
      backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)',
    }}>
      {/* Role label */}
      <div style={{ fontSize: '0.62rem', color: roleColor || GOLD, letterSpacing: '2.5px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", marginBottom: '0.6rem' }}>
        {role}
      </div>

      {/* Stone name + planet */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: '1.6rem', fontWeight: 600, letterSpacing: '-0.02em', color: stone.color, lineHeight: 1.1 }}>
            {stone.primary.en}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>{stone.primary.hi}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>Substitute: {stone.substitute.en}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '2.4rem', color: stone.color, lineHeight: 1 }}>{stone.symbol}</div>
          <div style={{ fontSize: '0.72rem', color: stone.color, fontWeight: 600, marginTop: '0.15rem' }}>{stone.planet} {stone.hi}</div>
        </div>
      </div>

      {/* Wearing guide */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
        {[
          { label: 'Metal',  val: stone.metal },
          { label: 'Finger', val: stone.finger },
          { label: 'Day',    val: stone.day },
          { label: 'Weight', val: stone.weight },
        ].map(({ label, val }) => (
          <div key={label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.55rem 0.75rem' }}>
            <div style={{ fontSize: '0.58rem', color: 'var(--text-dim)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.2rem' }}>{label}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Mantra */}
      <div style={{ background: `${stone.color}10`, border: `1px solid ${stone.color}30`, borderRadius: 10, padding: '0.6rem 0.85rem', marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.58rem', color: stone.color, letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", marginBottom: '0.2rem' }}>Mantra</div>
        <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{stone.mantra}</div>
      </div>

      {/* Benefits */}
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.58rem', color: GOLD, letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", marginBottom: '0.5rem' }}>Benefits</div>
        <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: 1.85 }}>
          {stone.benefits.map((b, i) => <li key={i}>{b}</li>)}
        </ul>
      </div>

      {/* Caution */}
      <div style={{ background: 'rgba(223,168,79,0.06)', border: '1px solid rgba(223,168,79,0.2)', borderRadius: 10, padding: '0.65rem 0.85rem' }}>
        <div style={{ fontSize: '0.58rem', color: GOLD_L, letterSpacing: '1.5px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", marginBottom: '0.2rem' }}>Note</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>{stone.caution}</div>
      </div>
    </div>
  )
}

function PlanetChip({ planet, label }) {
  const s = STONES[planet]
  if (!s) return null
  return (
    <div style={{
      background: s.bg, border: `1px solid ${s.border}`,
      borderRadius: 12, padding: '0.6rem 0.9rem', display: 'flex', gap: '0.5rem', alignItems: 'center',
    }}>
      <span style={{ color: s.color, fontSize: '1rem' }}>{s.symbol}</span>
      <div>
        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: s.color }}>{s.primary.en}</div>
        <div style={{ fontSize: '0.62rem', color: 'var(--text-dim)' }}>{planet}</div>
      </div>
    </div>
  )
}

function AvoidChip({ planet }) {
  const s = STONES[planet]
  if (!s) return null
  return (
    <div style={{
      background: 'rgba(229,57,53,0.06)', border: '1px solid rgba(229,57,53,0.25)',
      borderRadius: 12, padding: '0.5rem 0.8rem', display: 'flex', gap: '0.4rem', alignItems: 'center',
    }}>
      <span style={{ color: '#E53935', fontSize: '0.9rem' }}>&#9888;</span>
      <div>
        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#ef9a9a' }}>{s.primary.en}</div>
        <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>{planet}</div>
      </div>
    </div>
  )
}

// ── Input styles ───────────────────────────────────────────────────────────────
const inp = {
  width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)',
  borderRadius: 10, color: 'var(--text-primary)', padding: '0.8rem 1rem',
  fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', cursor: 'pointer',
}
const lbl = {
  color: 'var(--text-dim)', fontSize: '0.68rem', fontWeight: 500,
  fontFamily: "'JetBrains Mono', monospace",
  letterSpacing: '2px', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem',
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function Gemstones() {
  const [lagna,  setLagna]  = useState('')
  const [dasha,  setDasha]  = useState('')
  const [result, setResult] = useState(null)

  function compute() {
    if (!lagna) return
    const lagnaLord  = LAGNA_LORD[lagna]
    const primaryStone  = STONES[lagnaLord]
    const dashaStone    = dasha && dasha !== lagnaLord ? STONES[dasha] : null
    const beneficPlanets = (BENEFICS[lagna] || []).filter(p => p !== lagnaLord && p !== dasha)
    const avoidPlanets   = AVOID[lagna] || []

    setResult({ lagna, lagnaLord, primaryStone, dashaStone, beneficPlanets, avoidPlanets })
    setTimeout(() => document.getElementById('gemstone-result')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>

      {/* Header */}
      <div className="bh-fade-up" style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.66rem', color: 'var(--gold)', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Vedic Astrology &middot; Ratna Shastra
        </div>
        <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 'clamp(1.9rem, 4vw, 2.8rem)', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
          Gemstone Recommendation
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.7, maxWidth: '500px', margin: '0 auto' }}>
          Personalised gemstone guidance based on your Lagna (ascendant) and current Mahadasha &mdash; with wearing instructions, mantra, and cautions.
        </p>
      </div>

      {/* Selector */}
      <div className="bh-fade-up-1" style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 18, padding: '1.75rem 2rem', marginBottom: '1.5rem',
        backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)',
        boxShadow: 'var(--shadow-card)',
      }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', color: GOLD, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '1.2rem' }}>
          Your Chart Details
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <label style={lbl}>Lagna (Ascendant) *</label>
            <select value={lagna} onChange={e => { setLagna(e.target.value); setResult(null) }} style={inp}>
              <option value=''>&#8212; Select Lagna sign &#8212;</option>
              {RASHIS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Current Mahadasha Lord</label>
            <select value={dasha} onChange={e => { setDasha(e.target.value); setResult(null) }} style={inp}>
              <option value=''>&#8212; Optional &#8212;</option>
              {PLANETS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {lagna && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '1rem', padding: '0.6rem 0.9rem', background: `${GOLD}0D`, border: `1px solid ${GOLD}22`, borderRadius: 10 }}>
            Lagna Lord: <strong style={{ color: GOLD }}>{LAGNA_LORD[lagna]}</strong>
            &nbsp;&nbsp;&middot;&nbsp;&nbsp;Primary Stone: <strong style={{ color: GOLD }}>{STONES[LAGNA_LORD[lagna]]?.primary.en}</strong>
          </div>
        )}

        <button
          onClick={compute}
          disabled={!lagna}
          style={{
            width: '100%',
            background: lagna ? 'linear-gradient(135deg,#F2CB84 0%,#DFA84F 42%,#A8752B 100%)' : 'rgba(223,168,79,0.3)',
            color: '#1C1205', border: 'none', borderRadius: 999, padding: '0.85rem',
            fontSize: '0.9rem', fontWeight: 600, letterSpacing: '0.02em',
            cursor: lagna ? 'pointer' : 'not-allowed',
            boxShadow: lagna ? '0 8px 28px rgba(223,168,79,0.28)' : 'none',
          }}>
          Get Gemstone Recommendations &#10022;
        </button>
      </div>

      {/* Info box (no result yet) */}
      {!result && (
        <div className="bh-fade-up-2" style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          borderRadius: 18, padding: '1.1rem 1.3rem',
          backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)',
        }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.66rem', color: GOLD, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            About Ratna Shastra
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', lineHeight: 1.75, margin: 0 }}>
            In Jyotish, gemstones (ratnas) act as cosmic receivers that amplify specific planetary energies. The <strong style={{ color: GOLD_L }}>primary gemstone</strong> strengthens your lagna lord &mdash; the planet that rules your life purpose. The <strong style={{ color: GOLD_L }}>dasha gemstone</strong> aligns you with the planet currently governing your life period. Both should be evaluated against your full birth chart before wearing.
          </p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div id="gemstone-result">

          {/* Primary — Lagna lord stone */}
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.64rem', color: GOLD, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            &#10022; Primary Stone &mdash; {result.lagna} Lagna
          </div>
          <StoneCard
            stone={result.primaryStone}
            role={`Primary: Lagna Lord is ${result.lagnaLord}`}
            roleColor={GOLD}
          />

          {/* Dasha stone */}
          {result.dashaStone && (
            <>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.64rem', color: '#8B6FE8', letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '0.75rem', marginTop: '0.5rem' }}>
                &#9790; Dasha Stone &mdash; {dasha} Mahadasha
              </div>
              <StoneCard
                stone={result.dashaStone}
                role={`Supporting: ${dasha} Mahadasha is active`}
                roleColor='#8B6FE8'
              />
            </>
          )}

          {/* Dasha = lagna lord notice */}
          {dasha && dasha === result.lagnaLord && (
            <div style={{ background: 'rgba(67,160,71,0.08)', border: '1px solid rgba(67,160,71,0.3)', borderRadius: 14, padding: '0.9rem 1.1rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.78rem', color: '#43A047' }}>
                &#10003; Your Mahadasha lord ({dasha}) is the same as your Lagna lord &mdash; your primary gemstone doubles as your dasha stone. A single stone is sufficient.
              </div>
            </div>
          )}

          {/* Benefic stones */}
          {result.beneficPlanets.length > 0 && (
            <div style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 18, padding: '1rem 1.2rem', marginBottom: '1rem',
              backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)',
            }}>
              <div style={{ fontSize: '0.62rem', color: GOLD, letterSpacing: '2.5px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", marginBottom: '0.75rem' }}>
                Generally Safe for {result.lagna} Lagna
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                {result.beneficPlanets.map(p => <PlanetChip key={p} planet={p} />)}
              </div>
            </div>
          )}

          {/* Avoid */}
          {result.avoidPlanets.length > 0 && (
            <div style={{
              background: 'rgba(229,57,53,0.04)', border: '1px solid rgba(229,57,53,0.2)',
              borderRadius: 18, padding: '1rem 1.2rem', marginBottom: '1.5rem',
            }}>
              <div style={{ fontSize: '0.62rem', color: '#E53935', letterSpacing: '2.5px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", marginBottom: '0.75rem' }}>
                Generally Avoid for {result.lagna} Lagna
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '0.6rem' }}>
                {result.avoidPlanets.map(p => <AvoidChip key={p} planet={p} />)}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'rgba(239,154,154,0.7)', lineHeight: 1.55 }}>
                These are enemy planets to your lagna lord in classical Jyotish. Wearing their stones may create conflict with the lagna energy unless they rule benefic houses for you specifically.
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div style={{
            background: `${GOLD}08`, border: `1px solid ${GOLD}22`,
            borderRadius: 18, padding: '1.1rem 1.3rem', marginBottom: '1.5rem',
          }}>
            <div style={{ fontSize: '0.62rem', color: GOLD, letterSpacing: '2.5px', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace", marginBottom: '0.4rem' }}>
              Important
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.81rem', lineHeight: 1.7, margin: 0 }}>
              Gemstone recommendations depend on the full birth chart &mdash; house lordships, sign strength, aspects, and current dashas. These are general guidelines based on classical Jyotish principles. Always consult a qualified jyotishi before wearing powerful stones like Blue Sapphire, Cat&rsquo;s Eye, or Diamond. Never self-prescribe during major dasha transitions.
            </p>
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
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.66rem', color: GOLD, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                Know your exact Lagna and Dasha?
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', margin: 0 }}>
                Generate your free Kundali to get precise ascendant, planet positions, and Vimshottari Dasha timeline.
              </p>
            </div>
            <Link to='/chart/new' style={{
              background: 'linear-gradient(135deg,#F2CB84 0%,#DFA84F 42%,#A8752B 100%)',
              color: '#1C1205', fontSize: '0.82rem', fontWeight: 600,
              letterSpacing: '0.02em', padding: '0.65rem 1.5rem', borderRadius: 999,
              boxShadow: '0 8px 28px rgba(223,168,79,0.28)', textDecoration: 'none',
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              Free Kundali &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
