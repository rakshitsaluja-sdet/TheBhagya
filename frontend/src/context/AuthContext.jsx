import { createContext, useContext, useState, useCallback } from 'react'

// Plan feature matrix — mirrors backend PLAN_LIMITS
const PLAN_FEATURES = {
  starter:  { maxCharts: 3,   pdf: false, chat: false, numerology: false, label: 'Starter',       badge: '✦ FREE' },
  pro:      { maxCharts: 999, pdf: true,  chat: true,  numerology: true,  label: 'Bhagya Pro',    badge: '⭐ PRO' },
  jyotish:  { maxCharts: 999, pdf: true,  chat: true,  numerology: true,  label: 'Bhagya Jyotish',badge: '🔮 JYOTISH' },
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

  const plan       = user?.plan || 'starter'
  const features   = PLAN_FEATURES[plan] || PLAN_FEATURES.starter
  const isLoggedIn = !!token

  // canUse('chat') → true/false based on current plan
  const canUse = (feature) => features[feature] ?? false

  // Check if user has hit chart limit
  const chartLimitReached = () =>
    plan === 'starter' && (user?.chart_count ?? 0) >= features.maxCharts

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
