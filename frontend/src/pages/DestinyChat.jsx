import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import { listCharts, getChart } from '../hooks/useApi'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://thebhagya-backend-production.up.railway.app').replace(/\/$/, '')
const API = `${BASE_URL}/v1`

const SUGGESTIONS = [
  "What does my current Rahu Mahadasha mean for my career?",
  "Is 2026 a good year for me to move abroad?",
  "What should I know about my Moon placement?",
  "How does my Lal Kitab chart relate to wealth?",
  "What remedies suit my chart the most?",
  "Tell me about my Dasha lord's influence on relationships.",
]

const SUGGESTIONS_HI = [
  "मेरे राहु महादशा का करियर पर क्या प्रभाव है?",
  "क्या 2026 विदेश जाने का सही समय है?",
  "मेरी चंद्र स्थिति के बारे में बताइए।",
  "लाल किताब के अनुसार मेरे धन योग क्या हैं?",
  "मेरे चार्ट के अनुसार कौन से उपाय सबसे उपयुक्त हैं?",
]

export default function DestinyChat() {
  const { theme } = useTheme()
  const { lang } = useLanguage()
  const navigate = useNavigate()
  const isHindi = lang === 'hi'

  const [savedCharts, setSavedCharts] = useState([])
  const [selectedChartId, setSelectedChartId] = useState('')
  const [selectedChart, setSelectedChart] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)

  // Load saved charts
  useEffect(() => {
    listCharts()
      .then(data => setSavedCharts(Array.isArray(data) ? data : []))
      .catch(() => setSavedCharts([]))
  }, [])

  // Load selected chart detail
  useEffect(() => {
    if (!selectedChartId) { setSelectedChart(null); return }
    getChart(selectedChartId)
      .then(data => setSelectedChart(data))
      .catch(() => setSelectedChart(null))
  }, [selectedChartId])

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(text) {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    setError('')

    const userMsg = { role: 'user', content: msg }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const token = localStorage.getItem('bhagya_token')
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message:  msg,
          chart_id: selectedChartId || null,
          history:  messages.slice(-10),
          lang,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Chat failed')
      }
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (e) {
      setError(e.message || 'Could not reach Destiny Chat. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  const s = {
    page: {
      height: 'calc(100vh - 64px)', /* subtract navbar height */
      background: 'var(--bg-deep)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    },
    header: {
      background: 'var(--bg-elevated)',
      backdropFilter: 'blur(18px) saturate(1.4)',
      WebkitBackdropFilter: 'blur(18px) saturate(1.4)',
      borderBottom: '1px solid var(--border)',
      padding: '1rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      flexWrap: 'wrap',
    },
    title: {
      fontFamily: "'Fraunces', serif",
      color: 'var(--text-primary)',
      fontSize: '1.1rem',
      fontWeight: 600,
      letterSpacing: '-0.02em',
      flex: 1,
    },
    chartSelect: {
      background: 'var(--bg-input)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      color: 'var(--text-muted)',
      padding: '0.45rem 0.8rem',
      fontSize: '0.84rem',
      cursor: 'pointer',
      minWidth: '200px',
    },
    chatArea: {
      flex: 1,
      overflowY: 'auto',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      maxWidth: '800px',
      margin: '0 auto',
      width: '100%',
    },
    bubble: (role) => ({
      maxWidth: '80%',
      alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
      background: role === 'user'
        ? 'linear-gradient(135deg, #F2CB84 0%, #DFA84F 42%, #A8752B 100%)'
        : 'var(--bg-elevated)',
      color: role === 'user' ? '#1C1205' : 'var(--text-muted)',
      padding: '0.85rem 1.1rem',
      borderRadius: role === 'user' ? '18px 18px 6px 18px' : '18px',
      border: role === 'user' ? 'none' : '1px solid var(--border)',
      boxShadow: role === 'user' ? '0 8px 28px rgba(223,168,79,0.18)' : 'none',
      fontSize: '0.9rem',
      lineHeight: 1.7,
      whiteSpace: 'pre-wrap',
      fontWeight: role === 'user' ? 600 : 400,
    }),
    assistantLabel: {
      fontSize: '0.66rem',
      color: 'var(--gold)',
      marginBottom: '0.3rem',
      fontFamily: "'JetBrains Mono', monospace",
      letterSpacing: '2px',
      textTransform: 'uppercase',
    },
    inputRow: {
      background: 'var(--bg-elevated)',
      borderTop: '1px solid var(--border)',
      padding: '1rem 1.5rem',
      display: 'flex',
      gap: '0.75rem',
      alignItems: 'flex-end',
      maxWidth: '800px',
      margin: '0 auto',
      width: '100%',
    },
    textarea: {
      flex: 1,
      background: 'var(--bg-input)',
      border: '1px solid var(--border)',
      borderRadius: '999px',
      color: 'var(--text-primary)',
      padding: '0.8rem 1.25rem',
      fontSize: '0.9rem',
      resize: 'none',
      outline: 'none',
      lineHeight: 1.5,
      minHeight: '44px',
      maxHeight: '140px',
    },
    sendBtn: {
      background: loading
        ? 'var(--bg-card)'
        : 'linear-gradient(135deg, #F2CB84 0%, #DFA84F 42%, #A8752B 100%)',
      color: loading ? 'var(--text-dim)' : '#1C1205',
      border: 'none',
      borderRadius: '999px',
      padding: '0.8rem 1.3rem',
      cursor: loading ? 'default' : 'pointer',
      fontWeight: 600,
      fontSize: '0.9rem',
      boxShadow: loading ? 'none' : '0 8px 28px rgba(223,168,79,0.28)',
      transition: 'all 0.18s',
      flexShrink: 0,
    },
  }

  const suggestions = isHindi ? SUGGESTIONS_HI : SUGGESTIONS

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.title}>
          ◎ {isHindi ? 'भाग्य चैट — आपका AI ज्योतिष गाइड' : 'Destiny Chat — Your AI Astrology Guide'}
        </div>

        {/* Chart selector */}
        <select
          style={s.chartSelect}
          value={selectedChartId}
          onChange={e => setSelectedChartId(e.target.value)}
        >
          <option value="">{isHindi ? '— चार्ट चुनें (वैकल्पिक) —' : '— Select a chart (optional) —'}</option>
          {savedCharts.map(c => (
            <option key={c.id} value={c.id}>
              {c.label || c.place_name || c.dob} · {c.dob}
            </option>
          ))}
        </select>

        {savedCharts.length === 0 && (
          <button
            style={{ background: 'transparent', border: '1px solid var(--border-hover)', borderRadius: '999px', color: 'var(--gold)', padding: '0.4rem 1rem', cursor: 'pointer', fontSize: '0.82rem' }}
            onClick={() => navigate('/chart/new')}
          >
            + {isHindi ? 'चार्ट बनाएं' : 'Create a chart first'}
          </button>
        )}
      </div>

      {/* Chart context pill */}
      {selectedChart && (
        <div style={{ background: 'rgba(223,168,79,0.08)', borderBottom: '1px solid rgba(223,168,79,0.2)', padding: '0.6rem 1.5rem', fontSize: '0.8rem', color: 'var(--gold-light)', fontFamily: "'JetBrains Mono', monospace", display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <span>☽ {selectedChart.lagna?.sign} Lagna</span>
          <span>◉ Moon: {selectedChart.planets?.Moon?.sign} H{selectedChart.planets?.Moon?.house}</span>
          <span>⟳ {selectedChart.current_dasha?.mahadasha?.lord} MD / {selectedChart.current_dasha?.antardasha?.lord} AD</span>
          <span style={{ color: 'var(--text-dim)' }}>{isHindi ? 'चार्ट संदर्भ सक्रिय' : 'Chart context active'}</span>
        </div>
      )}

      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ flex: 1, maxWidth: '800px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: messages.length === 0 ? 'center' : 'flex-end', gap: '1rem', padding: '1rem 1.5rem' }}>

          {/* Welcome / suggestions */}
          {messages.length === 0 && (
            <div className="bh-fade-up" style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', color: 'var(--gold)' }}>◎</div>
              <div style={{ fontFamily: "'Fraunces', serif", color: 'var(--text-primary)', fontSize: '1.35rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
                {isHindi ? 'भाग्य चैट में स्वागत है' : 'Welcome to Destiny Chat'}
              </div>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.88rem', maxWidth: '500px', margin: '0 auto 1.5rem', lineHeight: 1.7 }}>
                {isHindi
                  ? 'अपने जन्म चार्ट के बारे में कुछ भी पूछें — करियर, रिश्ते, विदेश यात्रा, दशा काल, उपाय।'
                  : 'Ask anything about your birth chart — career, relationships, foreign travel, dasha periods, remedies. Select a chart above for personalised answers.'}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', justifyContent: 'center' }}>
                {suggestions.map((s, i) => (
                  <button key={i}
                    style={{ background: 'var(--bg-elevated)', backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)', border: '1px solid var(--border)', borderRadius: '999px', color: 'var(--text-muted)', padding: '0.5rem 1.1rem', cursor: 'pointer', fontSize: '0.82rem', transition: 'all 0.18s', textAlign: 'left' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold-light)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
                    onClick={() => send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat bubbles */}
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {m.role === 'assistant' && <div style={s.assistantLabel}>◈ BHAGYA</div>}
              <div style={s.bubble(m.role)}>{m.content}</div>
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div style={{ alignSelf: 'flex-start' }}>
              <div style={s.assistantLabel}>◈ BHAGYA</div>
              <div style={{ ...s.bubble('assistant'), display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--gold)', display: 'inline-block', animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ background: 'rgba(224,123,57,0.1)', border: '1px solid rgba(224,123,57,0.3)', borderRadius: '10px', padding: '0.8rem 1rem', color: '#E07B39', fontSize: '0.85rem' }}>
              ⚠ {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input row */}
      <div style={{ background: 'var(--bg-elevated)', backdropFilter: 'blur(18px) saturate(1.4)', WebkitBackdropFilter: 'blur(18px) saturate(1.4)', borderTop: '1px solid var(--border)', padding: '1rem 1.5rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
          <textarea
            style={s.textarea}
            value={input}
            placeholder={isHindi ? 'अपना प्रश्न यहाँ लिखें...' : 'Ask about your chart...'}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send()
              }
            }}
            rows={1}
          />
          <button style={s.sendBtn} onClick={() => send()} disabled={loading || !input.trim()}>
            {loading ? '...' : '↑'}
          </button>
        </div>
        <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.73rem', margin: '0.5rem 0 0' }}>
          {isHindi
            ? 'भाग्य AI खगोलीय प्रवृत्तियाँ बताता है — निश्चित भविष्यवाणी नहीं।'
            : 'Bhagya AI describes cosmic tendencies — not certainties. Always use your own judgement.'}
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
