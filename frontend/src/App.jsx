import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { LanguageProvider } from './context/LanguageContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import GravityCanvas from './components/GravityCanvas'
import ScrollToTop from './components/ScrollToTop'
import Landing from './pages/Landing'
import Login from './pages/Login'
import ChartForm from './pages/ChartForm'
import ChartResult from './pages/ChartResult'
import MyCharts from './pages/MyCharts'
import DestinyChat from './pages/DestinyChat'
import Numerology from './pages/Numerology'
import Palmistry from './pages/Palmistry'
import Horoscope from './pages/Horoscope'
import SadeSati from './pages/SadeSati'
import Doshas from './pages/Doshas'
import KundliMatching from './pages/KundliMatching'
import LalKitab from './pages/LalKitab'
import Pricing from './pages/Pricing'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import { trackPageView } from './hooks/useApi'

// ── Plan gate — redirects to /pricing if feature not in plan ─────────────────
function PlanGate({ feature, children }) {
  const { isLoggedIn, canUse } = useAuth()
  const location = useLocation()

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  if (!canUse(feature)) {
    return <Navigate to="/pricing" state={{ upgradeFor: feature }} replace />
  }
  return children
}

// ── Page view tracker ─────────────────────────────────────────────────────────
function PageTracker() {
  const location = useLocation()
  useEffect(() => {
    // Skip tracking admin pages
    if (!location.pathname.startsWith('/admin')) {
      trackPageView(location.pathname)
    }
  }, [location.pathname])
  return null
}

// ── App shell ─────────────────────────────────────────────────────────────────
function AppShell() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <ScrollToTop />
      <PageTracker />
      <Routes>
        {/* ── Admin routes (no Navbar/Footer) ── */}
        <Route path="/admin"           element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* ── Standalone dark pages (no Navbar/Footer) ── */}
        <Route path="/"        element={<Landing />} />
        <Route path="/login"   element={<Login />} />
        <Route path="/pricing" element={<Pricing />} />

        {/* ── All other public routes (with Navbar/Footer + subtle gravity bg) ── */}
        <Route path="/*" element={
          <>
            {/* Gravity mesh on all inner pages — low opacity, theme-neutral */}
            <GravityCanvas density={38} force={3} radius={145} glow={38} opacity={0.18} />
            <Navbar />
            <main style={{ flex: 1, position: 'relative', zIndex: 1 }}>
              <Routes>
                <Route path="/palmistry"  element={<Palmistry />} />
                <Route path="/horoscope" element={<Horoscope />} />
                <Route path="/sade-sati" element={<SadeSati />} />
                <Route path="/doshas"           element={<Doshas />} />
                <Route path="/kundli-matching" element={<KundliMatching />} />
                <Route path="/lal-kitab"      element={<LalKitab />} />
                <Route path="/chart/new" element={<ChartForm />} />
                <Route path="/chart/:id" element={<ChartResult />} />
                <Route path="/my-charts" element={<MyCharts />} />
                <Route path="/destiny-chat" element={<PlanGate feature="chat"><DestinyChat /></PlanGate>} />
                <Route path="/numerology"   element={<PlanGate feature="numerology"><Numerology /></PlanGate>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <div style={{ position: 'relative', zIndex: 1 }}><Footer /></div>
          </>
        } />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
