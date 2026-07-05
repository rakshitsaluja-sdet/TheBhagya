import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { computeNumerology } from '../hooks/useApi'

const NUMBER_COLORS = {
  1: '#E8B96A', 2: '#9B8EC4', 3: '#F4A261', 4: '#4CAF50',
  5: '#E07B39', 6: '#64B5F6', 7: '#9C27B0', 8: '#C9933A',
  9: '#E91E63', 11: '#FFD700', 22: '#FF6B35', 33: '#FF1744',
}

function NumberCard({ label, data, systemLabel }) {
  if (!data) return null
  const num = data.number
  const color = NUMBER_COLORS[num] || '#C9933A'
  const isMaster = data.is_master

  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: `1px solid ${isMaster ? 'rgba(255,215,0,0.4)' : 'var(--border)'}`,
      borderRadius: '12px',
      padding: '1.1rem 1.25rem',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {isMaster && (
        <div style={{ position: 'absolute', top: '0.5rem', right: '0.7rem', fontSize: '0.68rem', fontWeight: 700, color: '#FFD700', letterSpacing: '1px' }}>★ MASTER</div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '0.6rem' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '50%',
          background: `radial-gradient(circle, ${color}33, ${color}11)`,
          border: `2px solid ${color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.3rem', fontWeight: 800, color, flexShrink: 0,
          fontFamily: "'Cinzel', serif",
        }}>{num}</div>
        <div>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.72rem', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.15rem' }}>{label}</div>
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
    : compat.life_path_compatibility?.rating === 'Low' ? '#E07B39' : '#C9933A'

  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.2rem 1.4rem' }}>
      <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Life Path 1</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: NUMBER_COLORS[compat.life_path_1] || 'var(--gold)', fontFamily: "'Cinzel', serif" }}>{compat.life_path_1}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: '1.5rem', color: color }}>
          {compat.life_path_compatibility?.rating === 'High' ? '♥' : compat.life_path_compatibility?.rating === 'Low' ? '⚡' : '◈'}
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Life Path 2</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: NUMBER_COLORS[compat.life_path_2] || 'var(--gold)', fontFamily: "'Cinzel', serif" }}>{compat.life_path_2}</div>
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
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    color: 'var(--text-primary)',
    padding: '0.7rem 1rem',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
  }
  const label = { color: 'var(--text-dim)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }
  const sectionHead = { fontFamily: "'Cinzel', serif", fontSize: '0.82rem', color: 'var(--gold)', letterSpacing: '2px', textTransform: 'uppercase', margin: '1.75rem 0 0.9rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border)' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>

        {/* Page header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>∑</div>
          <h1 style={{ fontFamily: "'Cinzel', serif", color: 'var(--gold)', fontSize: '1.6rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
            {isHindi ? 'अंकशास्त्र वाचन' : 'Numerology Reading'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.7, maxWidth: '520px', margin: '0 auto' }}>
            {isHindi
              ? 'पायथागोरियन और कल्डियन दोनों प्रणालियों में आपके सभी प्रमुख अंकों की गणना।'
              : 'All major numbers computed in both Pythagorean and Chaldean traditions. Discover your life path, soul urge, personality and more.'}
          </p>
        </div>

        {/* Form */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '14px', border: '1px solid var(--border)', padding: '1.75rem' }}>
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
                style={{ background: 'none', border: '1px dashed var(--border)', borderRadius: '8px', color: showPartner ? 'var(--gold)' : 'var(--text-dim)', padding: '0.65rem 1rem', cursor: 'pointer', fontSize: '0.85rem', width: '100%' }}
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
            style={{ marginTop: '1.4rem', width: '100%', background: loading ? 'var(--bg-elevated)' : 'linear-gradient(135deg, var(--gold), #B8843A)', color: loading ? 'var(--text-dim)' : '#1A0E00', border: 'none', borderRadius: '10px', padding: '0.9rem', fontSize: '1rem', fontWeight: 700, cursor: loading ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", letterSpacing: '1px' }}
            onClick={compute} disabled={loading}>
            {loading ? (isHindi ? 'गणना हो रही है...' : 'Computing...') : (isHindi ? 'अंक निकालें' : 'Reveal My Numbers')}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div>
            {/* Life Path — hero */}
            <div style={sectionHead}>◈ {isHindi ? 'मुख्य संख्याएं' : 'Core Numbers'}</div>
            <div style={{ background: 'linear-gradient(135deg, rgba(201,147,58,0.12), rgba(201,147,58,0.04))', borderRadius: '16px', border: '1px solid rgba(201,147,58,0.3)', padding: '1.5rem', marginBottom: '1rem', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center', minWidth: '80px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.4rem' }}>Life Path</div>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: NUMBER_COLORS[result.life_path?.number] || 'var(--gold)', fontFamily: "'Cinzel', serif", lineHeight: 1 }}>{result.life_path?.number}</div>
                {result.life_path?.is_master && <div style={{ fontSize: '0.65rem', color: '#FFD700', marginTop: '0.25rem' }}>★ MASTER</div>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--gold-light)', fontWeight: 600, marginBottom: '0.4rem', fontSize: '0.95rem' }}>
                  {result.life_path?.meaning?.split(' — ')[0]}
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.87rem', lineHeight: 1.7, margin: 0 }}>
                  {result.life_path?.meaning?.split(' — ').slice(1).join(' — ')}
                </p>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
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
