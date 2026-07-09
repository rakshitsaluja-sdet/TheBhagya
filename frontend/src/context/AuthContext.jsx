import { createContext, useContext, useState, useCallback } from 'react'

// Plan feature matrix — mirrors backend PLAN_LIMITS
// free    = no login required (₹0)
// jyotish = ₹299/month
// guru    = ₹799/month
const PLAN_FEATURES = {
  free: {
    // Free tier — no login required
    chart: true, horoscope: true, panchang: true,
    dreams: true, biorhythm: true, vastu: true, gemstones: true,
    // Jyotish tier (₹299) — not included
    kundli: false, 'sade-sati': false, doshas: false, numerology: false,
    'lal-kitab': false, tarot: false, palmistry: false,
    // Guru tier (₹799) — not included
    chat: false, varshphal: false, transit: false, muhurat: false, pdf: false,
    // Meta
    maxCharts: 3, label: 'Free', badge: '✦ FREE',
  },
  jyotish: {
    // Free tier — included
    chart: true, horoscope: true, panchang: true,
    dreams: true, biorhythm: true, vastu: true, gemstones: true,
    // Jyotish tier (₹299) — included
    kundli: true, 'sade-sati': true, doshas: true, numerology: true,
    'lal-kitab': true, tarot: true, palmistry: true,
    // Guru tier (₹799) — not included
    chat: false, varshphal: false, transit: false, muhurat: false, pdf: false,
    // Meta
    maxCharts: 999, label: 'Jyotish', badge: '⭐ JYOTISH',
  },
  guru: {
    // Free tier — included
    chart: true, horoscope: true, panchang: true,
    dreams: true, biorhythm: true, vastu: true, gemstones: true,
    // Jyotish tier (₹299) — included
    kundli: true, 'sade-sati': true, doshas: true, numerology: true,
    'lal-kitab': true, tarot: true, palmistry: true,
    // Guru tier (₹799) — included
    chat: true, varshphal: true, transit: true, muhurat: true, pdf: true,
    // Meta
    maxCharts: 999, label: 'Guru', badge: '🔮 GURU',
  },
}

const AuthContext = createContext(null)

function _parseToken(token) {
  // JWT payload is base64url-encoded middle segment
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

function _loadFromStorage() {
  try {
    const token = localStorage.getItem('bhagya_token')
    const user  = JSON.parse(localStorage.getItem('bhagya_user') || 'null')
    if (token && user) return { token, user }
  } catch {}
  return { token: null, user: null }
}

export function AuthProvider({ children }) {
  const saved = _loadFromStorage()
  const [token, setToken] = useState(saved.token)
  const [user,  setUser]  = useState(saved.user)

  const login = useCallback((tokenStr, userData) => {
    localStorage.setItem('bhagya_token', tokenStr)
    localStorage.setItem('bhagya_user',  JSON.stringify(userData))
    setToken(tokenStr)
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('bhagya_token')
    localStorage.removeItem('bhagya_user')
    setToken(null)
    setUser(null)
  }, [])

  const plan       = user?.plan || 'free'
  const features   = PLAN_FEATURES[plan] || PLAN_FEATURES.free
  const isLoggedIn = !!token

  // canUse('chat') → true/false based on current plan
  const canUse = (feature) => features[feature] ?? false

  // Check if user has hit chart limit
  const chartLimitReached = () =>
    plan === 'free' && (user?.chart_count ?? 0) >= features.maxCharts

  // Increment local chart count after creating a chart
  const incrementChartCount = () => {
    if (!user) return
    const updated = { ...user, chart_count: (user.chart_count || 0) + 1 }
    localStorage.setItem('bhagya_user', JSON.stringify(updated))
    setUser(updated)
  }

  return (
    <AuthContext.Provider value={{
      token, user, isLoggedIn,
      plan, features,
      login, logout,
      canUse, chartLimitReached, incrementChartCount,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
export { PLAN_FEATURES }
