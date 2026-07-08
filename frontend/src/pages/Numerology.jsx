import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { computeNumerology } from '../hooks/useApi'

const NUMBER_COLORS = {
  1: '#F2CB84', 2: '#9B8EC4', 3: '#F4A261', 4: '#4CAF50',
  5: '#E07B39', 6: '#64B5F6', 7: '#9C27B0', 8: '#DFA84F',
  9: '#E91E63', 11: '#FFD700', 22: '#FF6B35', 33: '#FF1744',
}

const GOLD_GRADIENT = 'linear-gradient(135deg, #F2CB84 0%, #DFA84F 42%, #A8752B 100%)'

function NumberCard({ label, data, systemLabel }) {
  if (!data) return null
  const num = data.number
  const color = NUMBER_COLORS[num] || '#DFA84F'
  const isMaster = data.is_master

  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: `1px solid ${isMaster ? 'rgba(255,215,0,0.4)' : 'var(--border)'}`,
      borderRadius: 18,
      padding: '1.1rem 1.25rem',
      position: 'relative',
      overflow: 'hidden',
      backdropFilter: 'blur(18px) saturate(1.4)',
      WebkitBackdropFilter: 'blur(18px) saturate(1.4)',
    }}>
      {isMaster && (
        <div style={{ position: 'absolute', top: '0.5rem', right: '0.7rem', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', fontWeight: 700, color: '#FFD700', letterSpacing: '2px' }}>★ MASTER</div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '0.6rem' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '50%',
          background: `radial-gradient(circle, ${color}33, ${color}11)`,
          border: `2px solid ${color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.3rem', fontWeight: 600, color, flexShrink: 0,
          fontFamily: "'Fraunces', serif",
        }}>{num}</div>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-dim)', fontSize: '0.64rem', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '0.15rem' }}>{label}</div>
          {systemLabel && <div style={{ color: 'var(--gold-light)', fontSize: '0.75rem' }}>{systemLabel}</div>}
        </div>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', lineHeight: 1.65, margin: 0 }}>{data.meaning}</p>
    </div>
  )
}

function CompatCard({ compat }) {
  if (!compat) return null
  const color = compat.life_path_compatibility?.rating === 'High' ? '#4CAF50'
    : compat.life_path_compatibility?.rating === 'Low' ? '#E07B39' : '#DFA84F'

  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 18, padding: '1.2rem 1.4rem', backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)' }}>
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.64rem', color: 'var(--text-dim)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Life Path 1</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 600, color: NUMBER_COLORS[compat.life_path_1] || 'var(--gold)', fontFamily: "'Fraunces', serif", letterSpacing: '-0.02em' }}>{compat.life_path_1}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: '1.5rem', color: color }}>
          {compat.life_path_compatibility?.rating === 'High' ? '♥' : compat.life_path_compatibility?.rating === 'Low' ? '⚡' : '◈'}
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.64rem', color: 'var(--text-dim)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Life Path 2</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 600, color: NUMBER_COLORS[compat.life_path_2] || 'var(--gold)', fontFamily: "'Fraunces', serif", letterSpacing: '-0.02em' }}>{compat.life_path_2}</div>
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ fontWeight: 700, color, marginBottom: '0.4rem', fontSize: '0.9rem' }}>
            {compat.life_path_compatibility?.rating} Compatibility
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', lineHeight: 1.6, margin: 0 }}>
            {compat.life_path_compatibility?.description?.split(' — ')[1] || compat.life_path_compatibility?.description}
          </p>
        </div>
      </div>
      {compat.destiny_compatibility && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.8rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          <strong style={{ color: 'var(--gold-light)' }}>Destiny Numbers:</strong> {compat.destiny_1} & {compat.destiny_2} — {compat.destiny_compatibility?.rating} · {compat.destiny_compatibility?.description?.split(' — ')[1]}
        </div>
      )}
    </div>
  )
}

export default function Numerology() {
  const { lang } = useLanguage()
  const isHindi = lang === 'hi'

  const [form, setForm] = useState({ full_name: '', dob: '', partner_name: '', partner_dob: '' })
  const [showPartner, setShowPartner] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function update(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function compute() {
    if (!form.full_name.trim() || !form.dob) { setError('Name and date of birth are required.'); return }
    setLoading(true); setError(''); setResult(null)
    try {
      const body = {
        full_name: form.full_name,
        dob: form.dob,
        ...(showPartner && form.partner_name && form.partner_dob
          ? { partner_name: form.partner_name, partner_dob: form.partner_dob }
          : {}),
      }
      setResult(await computeNumerology(body))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const inp = {
    width: '100%',
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 10,
    color: 'var(--text-primary)',
    padding: '0.8rem 1rem',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
  }
  const label = { fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-dim)', fontSize: '0.7rem', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }
  const sectionHead = { fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', fontWeight: 600, color: 'var(--gold)', letterSpacing: '2.5px', textTransform: 'uppercase', margin: '1.75rem 0 0.9rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border)' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>

        {/* Page header */}
        <div className="bh-fade-up" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--gold)' }}>∑</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.66rem', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.5rem' }}>
            {isHindi ? 'अंकशास्त्र' : 'Numerology'}
          </div>
          <h1 style={{ fontFamily: "'Fraunces', serif", color: 'var(--text-primary)', fontSize: 'clamp(1.9rem, 4vw, 2.8rem)', fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 0.5rem' }}>
            {isHindi ? 'अंकशास्त्र वाचन' : 'Numerology Reading'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.7, maxWidth: '520px', margin: '0 auto' }}>
            {isHindi
              ? 'पायथागोरियन और कल्डियन दोनों प्रणालियों में आपके सभी प्रमुख अंकों की गणना।'
              : 'All major numbers computed in both Pythagorean and Chaldean traditions. Discover your life path, soul urge, personality and more.'}
          </p>
        </div>

        {/* Form */}
        <div className="bh-fade-up-1" style={{ background: 'var(--bg-card)', borderRadius: 18, border: '1px solid var(--border)', padding: '1.75rem', backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={label}>{isHindi ? 'पूरा नाम (जन्म नाम)' : 'Full Birth Name'}</label>
              <input style={inp} value={form.full_name} placeholder={isHindi ? 'जन्म प्रमाण पत्र के अनुसार नाम' : 'As on birth certificate'} onChange={e => update('full_name', e.target.value)} />
            </div>
            <div>
              <label style={label}>{isHindi ? 'जन्म तिथि' : 'Date of Birth'}</label>
              <input style={inp} type="date" value={form.dob} onChange={e => update('dob', e.target.value)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                style={{ background: 'transparent', border: '1px dashed var(--border-hover)', borderRadius: 999, color: showPartner ? 'var(--gold)' : 'var(--text-dim)', padding: '0.65rem 1rem', cursor: 'pointer', fontSize: '0.85rem', width: '100%', transition: 'color 0.18s, border-color 0.18s' }}
                onClick={() => setShowPartner(p => !p)}>
                {showPartner ? '✕ Remove Partner' : '+ Add Partner (Compatibility)'}
              </button>
            </div>
          </div>

          {showPartner && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
              <div>
                <label style={label}>{isHindi ? 'साथी का पूरा नाम' : "Partner's Full Name"}</label>
                <input style={inp} value={form.partner_name} placeholder="Full birth name" onChange={e => update('partner_name', e.target.value)} />
              </div>
              <div>
                <label style={label}>{isHindi ? 'साथी की जन्म तिथि' : "Partner's Date of Birth"}</label>
                <input style={inp} type="date" value={form.partner_dob} onChange={e => update('partner_dob', e.target.value)} />
              </div>
            </div>
          )}

          {error && <p style={{ color: '#E07B39', fontSize: '0.85rem', margin: '1rem 0 0' }}>⚠ {error}</p>}

          <button
            style={{ marginTop: '1.4rem', width: '100%', background: loading ? 'var(--bg-elevated)' : GOLD_GRADIENT, color: loading ? 'var(--text-dim)' : '#1C1205', border: 'none', borderRadius: 999, padding: '0.95rem', fontSize: '1rem', fontWeight: 600, cursor: loading ? 'default' : 'pointer', letterSpacing: '0.5px', boxShadow: loading ? 'none' : '0 8px 28px rgba(223,168,79,0.28)' }}
            onClick={compute} disabled={loading}>
            {loading ? (isHindi ? 'गणना हो रही है...' : 'Computing...') : (isHindi ? 'अंक निकालें' : 'Reveal My Numbers')}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div>
            {/* Life Path — hero */}
            <div style={sectionHead}>◈ {isHindi ? 'मुख्य संख्याएं' : 'Core Numbers'}</div>
            <div style={{ background: 'linear-gradient(135deg, rgba(223,168,79,0.12), rgba(223,168,79,0.04))', borderRadius: 18, border: '1px solid rgba(223,168,79,0.3)', padding: '1.5rem', marginBottom: '1rem', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap', backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)' }}>
              <div style={{ textAlign: 'center', minWidth: '80px' }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.64rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.4rem' }}>Life Path</div>
                <div style={{ fontSize: '3rem', fontWeight: 600, color: NUMBER_COLORS[result.life_path?.number] || 'var(--gold)', fontFamily: "'Fraunces', serif", letterSpacing: '-0.02em', lineHeight: 1 }}>{result.life_path?.number}</div>
                {result.life_path?.is_master && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', color: '#FFD700', letterSpacing: '2px', marginTop: '0.25rem' }}>★ MASTER</div>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--gold-light)', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.95rem' }}>
                  {result.life_path?.meaning?.split(' — ')[0]}
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.87rem', lineHeight: 1.7, margin: 0 }}>
                  {result.life_path?.meaning?.split(' — ').slice(1).join(' — ')}
                </p>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-dim)', fontSize: '0.7rem', marginTop: '0.5rem' }}>
                  Breakdown: Day {result.life_path?.breakdown?.day} + Month {result.life_path?.breakdown?.month} + Year {result.life_path?.breakdown?.year} = {result.life_path?.breakdown?.raw_sum} → {result.life_path?.number}
                </div>
              </div>
            </div>

            {/* Number grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.9rem' }}>
              <NumberCard label="Birthday Number" data={result.birthday} />
              <NumberCard label={`Personal Year ${result.personal_year?.year}`} data={{ number: result.personal_year?.number, meaning: result.personal_year?.meaning, is_master: false }} />
            </div>

            {/* Destiny */}
            <div style={sectionHead}>∑ {isHindi ? 'भाग्यांक' : 'Destiny Number'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
              <NumberCard label="Pythagorean Destiny" data={result.destiny?.pythagorean} systemLabel="Western system" />
              <NumberCard label="Chaldean Destiny" data={result.destiny?.chaldean} systemLabel="Ancient system" />
            </div>

            {/* Soul Urge + Personality */}
            <div style={sectionHead}>♥ {isHindi ? 'आत्मा और व्यक्तित्व' : 'Soul Urge & Personality'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.9rem' }}>
              <NumberCard label="Soul Urge — Pythagorean" data={result.soul_urge?.pythagorean} />
              <NumberCard label="Soul Urge — Chaldean" data={result.soul_urge?.chaldean} />
              <NumberCard label="Personality — Pythagorean" data={result.personality?.pythagorean} />
              <NumberCard label="Personality — Chaldean" data={result.personality?.chaldean} />
            </div>

            {/* Compatibility */}
            {result.compatibility && (
              <>
                <div style={sectionHead}>♥ {isHindi ? 'संगतता' : 'Compatibility'}</div>
                <CompatCard compat={result.compatibility} />
              </>
            )}

            <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.75rem', margin: '2rem 0 0', lineHeight: 1.6 }}>
              {isHindi
                ? 'अंकशास्त्र प्रवृत्तियाँ बताता है, नियति नहीं। इसे एक दर्पण की तरह उपयोग करें।'
                : 'Numerology reveals tendencies, not fate. Use it as a mirror for self-understanding.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
