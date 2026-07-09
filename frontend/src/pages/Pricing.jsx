import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import GravityCanvas from '../components/GravityCanvas'
import LogoMark from '../components/LogoMark'

const API = '/v1'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    nameHi: 'निःशुल्क',
    price: '₹0',
    period: '/month',
    tagline: 'Start exploring',
    taglineHi: 'अन्वेषण शुरू करें',
    color: 'var(--text-muted)',
    badge: null,
    badgeHi: null,
    badgeStyle: null,
    highlight: false,
    features: [
      'Kundali chart (basic)',
      'Daily Horoscope',
      'Panchang',
      'Dream Meanings (all symbols)',
      'Biorhythm calculator',
      'Vastu analyzer',
      'Gemstone guide',
    ],
    featuresHi: [
      'कुंडली चार्ट (बेसिक)',
      'दैनिक राशिफल',
      'पंचांग',
      'स्वप्न अर्थ (सभी प्रतीक)',
      'बायोरिदम कैलकुलेटर',
      'वास्तु विश्लेषण',
      'रत्न गाइड',
    ],
    cta: 'Get Started',
    ctaHi: 'शुरू करें',
    ctaLink: '/chart/new',
  },
  {
    id: 'jyotish',
    name: 'Jyotish',
    nameHi: 'ज्योतिष',
    price: '₹299',
    period: '/month',
    tagline: 'Full Vedic toolkit',
    taglineHi: 'पूर्ण वैदिक टूलकिट',
    color: 'var(--gold)',
    badge: 'MOST POPULAR',
    badgeHi: 'सबसे लोकप्रिय',
    badgeStyle: 'gold',
    highlight: true,
    features: [
      'Everything in Free +',
      'Kundli Matching (Ashtakoot)',
      'Sade Sati report',
      'Doshas (Mangal + Kaal Sarp)',
      'Numerology',
      'Lal Kitab',
      'Tarot readings',
      '✦ Palmistry',
    ],
    featuresHi: [
      'निःशुल्क की सभी सुविधाएं +',
      'कुंडली मिलान (अष्टकूट)',
      'साढ़े साती रिपोर्ट',
      'दोष (मंगल + काल सर्प)',
      'अंकशास्त्र',
      'लाल किताब',
      'टैरो रीडिंग',
      '✦ हस्तरेखा',
    ],
    cta: 'Start Jyotish',
    ctaHi: 'ज्योतिष शुरू करें',
    ctaLink: null,
  },
  {
    id: 'guru',
    name: 'Guru',
    nameHi: 'गुरु',
    price: '₹799',
    period: '/month',
    tagline: 'Complete access + all future features',
    taglineHi: 'पूर्ण एक्सेस + सभी भविष्य की सुविधाएं',
    color: 'var(--violet)',
    badge: 'EVERYTHING',
    badgeHi: 'सब कुछ',
    badgeStyle: 'violet',
    highlight: false,
    features: [
      'Everything in Jyotish +',
      'Destiny Chat (personal reading)',
      'Varshphal (Annual Horoscope)',
      'Gochar / Transit report',
      'Muhurat finder',
      'PDF report download',
      '✦ KP System',
      '✦ Nadi Astrology',
      '✦ All future features',
    ],
    featuresHi: [
      'ज्योतिष की सभी सुविधाएं +',
      'भाग्य चैट (व्यक्तिगत रीडिंग)',
      'वर्षफल (वार्षिक राशिफल)',
      'गोचर / ट्रांजिट रिपोर्ट',
      'मुहूर्त फाइंडर',
      'PDF रिपोर्ट डाउनलोड',
      '✦ KP सिस्टम',
      '✦ नाड़ी ज्योतिष',
      '✦ सभी भविष्य की सुविधाएं',
    ],
    cta: 'Start Guru',
    ctaHi: 'गुरु शुरू करें',
    ctaLink: null,
  },
]

const FAQ = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel anytime from your account — no questions asked. You keep access until end of billing period.',
  },
  {
    q: 'What payment methods are accepted?',
    a: "UPI, credit/debit cards, net banking, and wallets via Razorpay — India's most trusted payment gateway.",
  },
  {
    q: 'Is my chart data private?',
    a: 'Yes. Your birth data is stored encrypted and never shared. You can delete your charts anytime.',
  },
  {
    q: "What if I'm not happy?",
    a: "We offer a 7-day refund for first-time Jyotish/Guru subscribers if you're not satisfied.",
  },
]

function getBadgeStyle(badgeStyle) {
  if (badgeStyle === 'violet') {
    return {
      background: 'linear-gradient(135deg, #B09AFF 0%, #8B6FE8 100%)',
      color: '#fff',
      boxShadow: '0 8px 28px rgba(139,111,232,0.28)',
    }
  }
  return {
    background: 'linear-gradient(135deg, #F2CB84 0%, #DFA84F 42%, #A8752B 100%)',
    color: '#1C1205',
    boxShadow: '0 8px 28px rgba(223,168,79,0.28)',
  }
}

function getCardStyle(plan) {
  if (plan.highlight) {
    return {
      background: 'linear-gradient(180deg, rgba(223,168,79,0.08) 0%, var(--bg-card) 100%)',
      border: '1px solid rgba(242,203,132,0.45)',
      boxShadow: '0 0 44px rgba(223,168,79,0.12)',
    }
  }
  if (plan.badgeStyle === 'violet') {
    return {
      background: 'linear-gradient(180deg, rgba(139,111,232,0.08) 0%, var(--bg-card) 100%)',
      border: '1px solid rgba(139,111,232,0.45)',
      boxShadow: '0 0 44px rgba(139,111,232,0.12)',
    }
  }
  return {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    boxShadow: 'none',
  }
}

function getCtaStyle(plan) {
  if (plan.highlight) {
    return {
      background: 'linear-gradient(135deg, #F2CB84 0%, #DFA84F 42%, #A8752B 100%)',
      color: '#1C1205',
      border: 'none',
      boxShadow: '0 8px 28px rgba(223,168,79,0.28)',
    }
  }
  if (plan.badgeStyle === 'violet') {
    return {
      background: 'linear-gradient(135deg, #B09AFF 0%, #8B6FE8 100%)',
      color: '#fff',
      border: 'none',
      boxShadow: '0 8px 28px rgba(139,111,232,0.28)',
    }
  }
  return {
    background: 'transparent',
    color: 'var(--gold)',
    border: '1px solid var(--border-hover)',
    boxShadow: 'none',
  }
}

export default function Pricing() {
  const { lang } = useLanguage()
  const isHindi = lang === 'hi'
  const [paymentStatus, setPaymentStatus] = useState({})
  const [loading, setLoading] = useState('')
  const [openFaq, setOpenFaq] = useState(null)

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
    return () => { try { document.body.removeChild(script) } catch {} }
  }, [])

  async function handleCheckout(planId) {
    if (planId === 'free') return
    setLoading(planId)
    try {
      const res = await fetch(`${API}/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, user_email: '', user_name: '' }),
      })
      if (!res.ok) {
        const e = await res.json()
        throw new Error(e.detail || 'Order creation failed')
      }
      const order = await res.json()

      const options = {
        key:         order.razorpay_key_id,
        amount:      order.amount,
        currency:    order.currency,
        name:        'Bhagya',
        description: order.description,
        order_id:    order.order_id,
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${API}/payments/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                plan: planId,
              }),
            })
            const result = await verifyRes.json()
            setPaymentStatus(prev => ({ ...prev, [planId]: result.success ? 'success' : 'failed' }))
          } catch {
            setPaymentStatus(prev => ({ ...prev, [planId]: 'failed' }))
          }
        },
        prefill: { name: '', email: '', contact: '' },
        theme: { color: '#DFA84F' },
        modal: { ondismiss: () => setLoading('') },
      }

      if (!window.Razorpay) {
        alert('Razorpay not loaded. Check your internet connection.')
        setLoading('')
        return
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (e) {
      alert(`Payment setup failed: ${e.message}`)
    } finally {
      setLoading('')
    }
  }

  return (
    <div data-theme="dark" style={{ minHeight: '100vh', background: 'radial-gradient(ellipse 65% 45% at 72% -5%, rgba(139,111,232,0.14), transparent 62%), radial-gradient(ellipse 55% 40% at 15% 100%, rgba(223,168,79,0.09), transparent 65%), #07060F', padding: '0', position: 'relative' }}>
      {/* Gravity yantra mesh background */}
      <GravityCanvas density={32} force={5} radius={160} glow={55} />

      {/* Inline nav — mix-blend-mode difference */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.2rem 5vw', mixBlendMode: 'difference', pointerEvents: 'none' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none', pointerEvents: 'auto' }}>
          <LogoMark size={26} />
          <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: '0.82rem', letterSpacing: '6px', color: '#fff' }}>BHAGYA</span>
        </Link>
        <Link to="/" style={{ fontSize: '0.60rem', letterSpacing: '2.5px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.50)', textDecoration: 'none', pointerEvents: 'auto' }}>← Back</Link>
      </nav>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '5rem 1.5rem 3rem', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div className="bh-fade-up" style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontFamily: "'Fraunces', serif", color: 'var(--text-primary)', fontSize: 'clamp(1.9rem, 4vw, 2.8rem)', fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 0.75rem' }}>
            {isHindi ? 'सरल मूल्य निर्धारण' : 'Simple Pricing'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '480px', margin: '0 auto' }}>
            {isHindi
              ? 'जितनी ज़रूरत हो उतना लें। छिपे हुए शुल्क नहीं।'
              : 'Start free. Upgrade when you need more. No hidden charges.'}
          </p>
        </div>

        {/* Plan cards */}
        <div className="pricing-grid bh-fade-up-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          {PLANS.map(plan => {
            const paid = paymentStatus[plan.id] === 'success'
            const features = isHindi ? plan.featuresHi : plan.features
            const cardStyle = getCardStyle(plan)
            const ctaStyle = getCtaStyle(plan)
            const badgeStyleObj = plan.badge ? getBadgeStyle(plan.badgeStyle) : {}

            return (
              <div key={plan.id} style={{
                ...cardStyle,
                backdropFilter: 'blur(18px) saturate(1.4)',
                WebkitBackdropFilter: 'blur(18px) saturate(1.4)',
                borderRadius: '20px',
                padding: '1.75rem',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
              }}>
                {/* Badge — shown for Jyotish (gold) and Guru (violet) */}
                {plan.badge && (
                  <div style={{
                    position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)',
                    ...badgeStyleObj,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.62rem', fontWeight: 600, letterSpacing: '2px',
                    textTransform: 'uppercase', padding: '0.3rem 1rem',
                    borderRadius: '999px', whiteSpace: 'nowrap',
                  }}>
                    {isHindi ? plan.badgeHi : plan.badge}
                  </div>
                )}

                {/* Plan header */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.66rem', color: plan.color, fontWeight: 500, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: '0.4rem', minHeight: '1em' }}>
                    {isHindi ? plan.taglineHi : plan.tagline}
                  </div>
                  <div style={{ fontFamily: "'Fraunces', serif", color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 600, letterSpacing: '-0.02em' }}>
                    {isHindi ? plan.nameHi : plan.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginTop: '0.75rem' }}>
                    <span style={{ fontSize: '2.4rem', fontWeight: 600, color: 'var(--text-primary)', fontFamily: "'Fraunces', serif", letterSpacing: '-0.02em' }}>{plan.price}</span>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>{plan.period}</span>
                  </div>
                </div>

                {/* Feature list */}
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', flex: 1 }}>
                  {features.map((f, i) => {
                    const isComingSoon = f.startsWith('✦')
                    const label = isComingSoon ? f.slice(2) : f
                    return (
                      <li key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', padding: '0.35rem 0', color: isComingSoon ? 'var(--text-dim)' : 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                        <span style={{ color: isComingSoon ? 'var(--violet)' : 'var(--gold)', flexShrink: 0, marginTop: '2px' }}>
                          {isComingSoon ? '✦' : '✓'}
                        </span>
                        {label}
                      </li>
                    )
                  })}
                </ul>

                {/* CTA */}
                {paid ? (
                  <div style={{ background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.3)', borderRadius: '999px', padding: '0.75rem', textAlign: 'center', color: '#4CAF50', fontWeight: 600, fontSize: '0.9rem' }}>
                    ✓ {isHindi ? 'सक्रिय' : 'Active'}
                  </div>
                ) : plan.ctaLink ? (
                  <Link to={plan.ctaLink} style={{
                    display: 'block', textAlign: 'center', textDecoration: 'none',
                    ...ctaStyle,
                    borderRadius: '999px', padding: '0.8rem',
                    fontWeight: 600, fontSize: '0.9rem', fontFamily: "'Inter', sans-serif",
                    transition: 'all 0.18s',
                  }}>
                    {isHindi ? plan.ctaHi : plan.cta}
                  </Link>
                ) : (
                  <button
                    onClick={() => handleCheckout(plan.id)}
                    disabled={loading === plan.id}
                    style={{
                      ...ctaStyle,
                      borderRadius: '999px', padding: '0.8rem',
                      fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
                      fontFamily: "'Inter', sans-serif",
                      transition: 'all 0.18s',
                      opacity: loading === plan.id ? 0.6 : 1,
                      width: '100%',
                    }}>
                    {loading === plan.id ? '...' : (isHindi ? plan.ctaHi : plan.cta)}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Coming soon note */}
        <div className="bh-fade-up-1" style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.80rem', margin: 0 }}>
            Items marked <span style={{ color: 'var(--violet)' }}>✦</span> are coming soon
          </p>
        </div>


        {/* Backend-not-configured notice */}
        <div className="bh-fade-up-2" style={{ background: 'rgba(223,168,79,0.06)', borderRadius: '10px', border: '1px solid rgba(223,168,79,0.15)', padding: '1rem 1.25rem', marginBottom: '2.5rem', fontSize: '0.82rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--gold-light)' }}>⚙ Setup note:</strong> To enable payments, add <code style={{ background: 'rgba(0,0,0,0.2)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>RAZORPAY_KEY_ID</code> and <code style={{ background: 'rgba(0,0,0,0.2)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>RAZORPAY_KEY_SECRET</code> to your <code>.env</code> file. Get them from <a href="https://dashboard.razorpay.com" target="_blank" rel="noreferrer" style={{ color: 'var(--gold)' }}>dashboard.razorpay.com</a>.
        </div>

        {/* FAQ */}
        <div className="bh-fade-up-2" style={{ maxWidth: '640px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Fraunces', serif", color: 'var(--text-primary)', fontWeight: 600, letterSpacing: '-0.02em', textAlign: 'center', fontSize: '1.2rem', marginBottom: '1.25rem' }}>
            {isHindi ? 'अक्सर पूछे जाने वाले प्रश्न' : 'Frequently Asked Questions'}
          </h2>
          {FAQ.map((faq, i) => (
            <div key={i} style={{ border: '1px solid var(--border)', borderRadius: '10px', background: 'var(--bg-card)', backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)', marginBottom: '0.6rem', overflow: 'hidden', cursor: 'pointer' }} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 1.1rem' }}>
                <span style={{ color: openFaq === i ? 'var(--gold-light)' : 'var(--text-muted)', fontWeight: openFaq === i ? 600 : 400, fontSize: '0.88rem' }}>{faq.q}</span>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>{openFaq === i ? '▲' : '▼'}</span>
              </div>
              {openFaq === i && (
                <div style={{ padding: '0 1.1rem 0.9rem', color: 'var(--text-dim)', fontSize: '0.85rem', lineHeight: 1.7 }}>{faq.a}</div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
