import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'

const LINES = [
  { name: 'Life Line', hindi: 'जीवन रेखा', icon: '❤', desc: 'Vitality, energy, major life changes. Contrary to popular belief, length does not predict lifespan.' },
  { name: 'Head Line', hindi: 'मस्तिष्क रेखा', icon: '🧠', desc: 'Intellect, reasoning style, and decision-making approach. Curved = creative; straight = analytical.' },
  { name: 'Heart Line', hindi: 'हृदय रेखा', icon: '♡', desc: 'Emotional intelligence, relationships, and how you give and receive love.' },
  { name: 'Fate Line', hindi: 'भाग्य रेखा', icon: '☽', desc: 'Career path, destiny and the hand of fate in your life journey. Not everyone has a strong fate line.' },
  { name: 'Sun Line', hindi: 'सूर्य रेखा', icon: '☉', desc: 'Success, fame and creative fulfilment. A strong Sun line indicates recognition and achievement.' },
  { name: 'Mercury Line', hindi: 'बुध रेखा', icon: '☿', desc: 'Communication, business acumen and health. Also called the Health Line.' },
]

const MOUNTS = [
  { name: 'Mount of Jupiter', hindi: 'गुरु पर्वत', planet: 'Jupiter', trait: 'Leadership, ambition, confidence' },
  { name: 'Mount of Saturn', hindi: 'शनि पर्वत', planet: 'Saturn', trait: 'Discipline, wisdom, depth' },
  { name: 'Mount of Sun', hindi: 'सूर्य पर्वत', planet: 'Sun', trait: 'Creativity, fame, warmth' },
  { name: 'Mount of Mercury', hindi: 'बुध पर्वत', planet: 'Mercury', trait: 'Communication, commerce, wit' },
  { name: 'Mount of Moon', hindi: 'चंद्र पर्वत', planet: 'Moon', trait: 'Intuition, imagination, sensitivity' },
  { name: 'Mount of Venus', hindi: 'शुक्र पर्वत', planet: 'Venus', trait: 'Love, beauty, sensuality, family' },
  { name: 'Mount of Mars', hindi: 'मंगल पर्वत', planet: 'Mars', trait: 'Courage, energy, aggression' },
]

const GOLD_GRADIENT = 'linear-gradient(135deg, #F2CB84 0%, #DFA84F 42%, #A8752B 100%)'

export default function Palmistry() {
  const { lang } = useLanguage()
  const isHindi = lang === 'hi'
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [activeSection, setActiveSection] = useState('lines')

  function joinWaitlist() {
    if (!email.trim()) return
    setSubmitted(true)
    // TODO: POST to backend waitlist endpoint
  }

  const sectionBtn = (id, label) => ({
    background: activeSection === id ? GOLD_GRADIENT : 'transparent',
    color: activeSection === id ? '#1C1205' : 'var(--text-muted)',
    border: activeSection === id ? '1px solid transparent' : '1px solid var(--border-hover)',
    borderRadius: 999,
    padding: '0.5rem 1.1rem',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: activeSection === id ? 600 : 400,
    boxShadow: activeSection === id ? '0 8px 28px rgba(223,168,79,0.28)' : 'none',
    transition: 'all 0.18s',
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>

        {/* Hero */}
        <div className="bh-fade-up" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          {/* SVG hand illustration */}
          <svg viewBox="0 0 120 160" style={{ width: '100px', height: '133px', marginBottom: '1rem' }} fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Palm */}
            <ellipse cx="60" cy="110" rx="38" ry="42" fill="rgba(223,168,79,0.08)" stroke="rgba(223,168,79,0.4)" strokeWidth="1.5"/>
            {/* Fingers */}
            {[25,40,55,70,85].map((x, i) => (
              <rect key={i} x={x - 7} y={i === 4 ? 72 : 35 - (i === 0 ? 10 : i === 4 ? 12 : 0)} width="14" height={i === 4 ? 40 : 50 - Math.abs(2 - i) * 6} rx="7" fill="rgba(223,168,79,0.08)" stroke="rgba(223,168,79,0.35)" strokeWidth="1.2"/>
            ))}
            {/* Lines */}
            <path d="M 32 90 Q 55 75 80 88" stroke="#DFA84F" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
            <path d="M 25 105 Q 55 98 88 108" stroke="#F2CB84" strokeWidth="1.0" strokeLinecap="round" opacity="0.6"/>
            <path d="M 28 120 Q 55 115 85 122" stroke="#DFA84F" strokeWidth="0.9" strokeLinecap="round" opacity="0.5"/>
            <path d="M 55 80 L 58 148" stroke="var(--violet)" strokeWidth="1.0" strokeLinecap="round" opacity="0.5" strokeDasharray="3 2"/>
          </svg>

          <div style={{ display: 'inline-block', background: 'rgba(223,168,79,0.12)', border: '1px solid rgba(223,168,79,0.3)', borderRadius: 999, padding: '0.35rem 1rem', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.66rem', color: 'var(--gold)', fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '1rem' }}>
            COMING SOON
          </div>

          <h1 style={{ fontFamily: "'Fraunces', serif", color: 'var(--text-primary)', fontSize: 'clamp(1.9rem, 4vw, 2.8rem)', fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 0.75rem' }}>
            {isHindi ? 'हस्तरेखा शास्त्र' : 'Palmistry'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.75, maxWidth: '540px', margin: '0 auto 1.5rem' }}>
            {isHindi
              ? 'आपकी हथेली की रेखाएं और पर्वत आपके जीवन की अद्वितीय कहानी बताते हैं। जल्द ही Bhagya पर AI-आधारित हस्तरेखा पठन उपलब्ध होगा।'
              : 'Your palm lines and mounts tell a unique story that complements your Vedic birth chart. AI-powered palmistry reading coming to Bhagya soon — powered by computer vision and classical Hasta Samudrika Shastra.'}
          </p>

          {/* Waitlist */}
          {!submitted ? (
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={isHindi ? 'अपना ईमेल दर्ज करें' : 'Enter your email for early access'}
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text-primary)', padding: '0.8rem 1rem', fontSize: '0.9rem', outline: 'none', width: '280px' }}
                onKeyDown={e => e.key === 'Enter' && joinWaitlist()}
              />
              <button
                onClick={joinWaitlist}
                style={{ background: GOLD_GRADIENT, color: '#1C1205', border: 'none', borderRadius: 999, padding: '0.7rem 1.6rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 8px 28px rgba(223,168,79,0.28)' }}>
                {isHindi ? 'प्रतीक्षा सूची में जुड़ें' : 'Join Waitlist'}
              </button>
            </div>
          ) : (
            <div style={{ background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.3)', borderRadius: 999, padding: '0.75rem 1.5rem', display: 'inline-block', color: '#4CAF50', fontSize: '0.9rem', marginBottom: '2rem' }}>
              ✓ {isHindi ? 'आप प्रतीक्षा सूची में जुड़ गए हैं।' : "You're on the list! We'll email you when Palmistry goes live."}
            </div>
          )}
        </div>

        {/* What it will cover */}
        <div className="bh-fade-up-1" style={{ background: 'var(--bg-card)', borderRadius: 18, border: '1px solid var(--border)', padding: '1.75rem', marginBottom: '1.5rem', backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)' }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", color: 'var(--text-primary)', fontSize: '1.15rem', fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 1.25rem', textAlign: 'center' }}>
            {isHindi ? 'यह फीचर क्या करेगा?' : 'What This Feature Will Cover'}
          </h2>

          <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.25rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button style={sectionBtn('lines', '✋ Palm Lines')} onClick={() => setActiveSection('lines')}>✋ Palm Lines</button>
            <button style={sectionBtn('mounts', '⛰ Mounts')} onClick={() => setActiveSection('mounts')}>⛰ Mounts</button>
            <button style={sectionBtn('how', '📱 How It Works')} onClick={() => setActiveSection('how')}>📱 How It Works</button>
          </div>

          {activeSection === 'lines' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.85rem' }}>
              {LINES.map(line => (
                <div key={line.name} style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '1rem', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>{line.icon}</span>
                    <div>
                      <div style={{ color: 'var(--gold-light)', fontWeight: 600, fontSize: '0.87rem' }}>{line.name}</div>
                      {isHindi && <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>{line.hindi}</div>}
                    </div>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.81rem', lineHeight: 1.6, margin: 0 }}>{line.desc}</p>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'mounts' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.85rem' }}>
              {MOUNTS.map(m => (
                <div key={m.name} style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '0.9rem 1rem', border: '1px solid var(--border)' }}>
                  <div style={{ color: 'var(--gold-light)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.2rem' }}>{m.planet}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-dim)', fontSize: '0.68rem', letterSpacing: '1px', marginBottom: '0.4rem' }}>{isHindi ? m.hindi : m.name}</div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.55, margin: 0 }}>{m.trait}</p>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'how' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {[
                { step: '1', title: 'Photo Upload', desc: 'Take a clear photo of your dominant hand palm-facing up in natural light.' },
                { step: '2', title: 'AI Line Detection', desc: 'Computer vision model (MediaPipe + custom CNN) identifies and maps all major lines and mounts.' },
                { step: '3', title: 'Hasta Samudrika Analysis', desc: 'Classical Indian palmistry rules from Hasta Samudrika Shastra applied to each detected feature.' },
                { step: '4', title: 'Vedic Integration', desc: 'Palmistry reading cross-referenced with your Vedic birth chart for a unified life narrative.' },
              ].map(item => (
                <div key={item.step} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', background: 'var(--bg-elevated)', borderRadius: 10, padding: '0.9rem 1.1rem', border: '1px solid var(--border)' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(223,168,79,0.15)', border: '1px solid rgba(223,168,79,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', fontWeight: 600, fontSize: '0.85rem', fontFamily: "'JetBrains Mono', monospace", flexShrink: 0 }}>{item.step}</div>
                  <div>
                    <div style={{ color: 'var(--gold-light)', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.25rem' }}>{item.title}</div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vedic connection footnote */}
        <div className="bh-fade-up-2" style={{ background: 'rgba(223,168,79,0.05)', borderRadius: 12, border: '1px solid rgba(223,168,79,0.2)', padding: '1.25rem 1.4rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.75, margin: 0 }}>
            {isHindi
              ? 'हस्तरेखा शास्त्र (हस्त सामुद्रिक शास्त्र) और जन्म कुंडली दोनों एक ही आत्मा की कहानी के दो दर्पण हैं। जल्द ही Bhagya इन्हें एक साथ पढ़ेगा।'
              : 'In classical Indian tradition, palmistry (Hasta Samudrika Shastra) and birth chart astrology are two mirrors of the same soul. When both agree, the reading becomes extraordinarily precise.'}
          </p>
        </div>

      </div>
    </div>
  )
}
