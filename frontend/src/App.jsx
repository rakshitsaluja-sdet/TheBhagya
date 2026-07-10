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
import Panchang from './pages/Panchang'
import Gemstones from './pages/Gemstones'
import Varshphal from './pages/Varshphal'
import DreamInterpretation from './pages/DreamInterpretation'
import Biorhythm from './pages/Biorhythm'
import Transit from './pages/Transit'
import Muhurat from './pages/Muhurat'
import Tarot from './pages/Tarot'
import Vastu from './pages/Vastu'
import KPSystem from './pages/KPSystem'
import NadiAstrology from './pages/NadiAstrology'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'
import Pricing from './pages/Pricing'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import { trackPageView } from './hooks/useApi'

// ── Login gate — requires sign-in only, no plan check ────────────────────────
function LoginGate({ children }) {
  const { isLoggedIn } = useAuth()
  const location = useLocation()
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  return children
}

// ── Plan gate — requires sign-in + correct plan ───────────────────────────────
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
                {/* ── Free plan — login required ── */}
                <Route path="/horoscope"            element={<LoginGate><Horoscope /></LoginGate>} />
                <Route path="/panchang"             element={<LoginGate><Panchang /></LoginGate>} />
                <Route path="/gemstones"            element={<LoginGate><Gemstones /></LoginGate>} />
                <Route path="/dream-interpretation" element={<LoginGate><DreamInterpretation /></LoginGate>} />
                <Route path="/biorhythm"            element={<LoginGate><Biorhythm /></LoginGate>} />
                <Route path="/vastu"                element={<LoginGate><Vastu /></LoginGate>} />
                <Route path="/chart/new"            element={<LoginGate><ChartForm /></LoginGate>} />
                <Route path="/chart/:id"            element={<LoginGate><ChartResult /></LoginGate>} />
                <Route path="/my-charts"            element={<LoginGate><MyCharts /></LoginGate>} />
                {/* ── Jyotish plan ── */}
                <Route path="/kundli-matching" element={<PlanGate feature="kundli"><KundliMatching /></PlanGate>} />
                <Route path="/sade-sati"       element={<PlanGate feature="sade-sati"><SadeSati /></PlanGate>} />
                <Route path="/doshas"          element={<PlanGate feature="doshas"><Doshas /></PlanGate>} />
                <Route path="/lal-kitab"       element={<PlanGate feature="lal-kitab"><LalKitab /></PlanGate>} />
                <Route path="/tarot"           element={<PlanGate feature="tarot"><Tarot /></PlanGate>} />
                <Route path="/numerology"      element={<PlanGate feature="numerology"><Numerology /></PlanGate>} />
                <Route path="/palmistry"       element={<PlanGate feature="palmistry"><Palmistry /></PlanGate>} />
                {/* ── Guru plan ── */}
                <Route path="/destiny-chat"   element={<PlanGate feature="chat"><DestinyChat /></PlanGate>} />
                <Route path="/varshphal"      element={<PlanGate feature="varshphal"><Varshphal /></PlanGate>} />
                <Route path="/transit"        element={<PlanGate feature="transit"><Transit /></PlanGate>} />
                <Route path="/muhurat"        element={<PlanGate feature="muhurat"><Muhurat /></PlanGate>} />
                <Route path="/kp-system"      element={<PlanGate feature="kp"><KPSystem /></PlanGate>} />
                <Route path="/nadi-astrology" element={<PlanGate feature="nadi"><NadiAstrology /></PlanGate>} />
                {/* ── Blog / Content CMS — fully public ── */}
                <Route path="/blog"           element={<Blog />} />
                <Route path="/blog/:slug"     element={<BlogPost />} />
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
