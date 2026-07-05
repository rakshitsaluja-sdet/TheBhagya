import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminGetStats } from '../hooks/useApi'
import { useTheme } from '../context/ThemeContext'

/* ── Mini bar chart (pure CSS) ─────────────────────────────── */
function BarChart({ data, valueKey, labelKey, color = 'var(--gold)', height = 80 }) {
  if (!data?.length) return null
  const max = Math.max(...data.map(d => d[valueKey]), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: `${height}px` }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{d[valueKey] || ''}</div>
          <div style={{
            width: '100%', background: color, borderRadius: '3px 3px 0 0',
            height: `${Math.max((d[valueKey] / max) * (height - 20), d[valueKey] > 0 ? 4 : 0)}px`,
            opacity: 0.85, transition: 'height 0.3s',
          }} />
          <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textAlign: 'center', whiteSpace: 'nowrap' }}>
            {d[labelKey]}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Dual bar chart (total vs anon) ────────────────────────── */
function DualBarChart({ data, height = 80 }) {
  if (!data?.length) return null
  const max = Math.max(...data.map(d => d.total), 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: `${height}px` }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>{d.total || ''}</div>
          <div style={{ width: '100%', position: 'relative', height: `${height - 20}px`, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            {/* Total bar */}
            <div style={{
              position: 'absolute', bottom: 0, left: '25%', width: '25%',
              height: `${Math.max((d.total / max) * (height - 20), d.total > 0 ? 4 : 0)}px`,
              background: 'var(--gold)', borderRadius: '2px 2px 0 0', opacity: 0.8,
            }} />
            {/* Anon bar */}
            <div style={{
              position: 'absolute', bottom: 0, left: '58%', width: '25%',
              height: `${Math.max((d.anon / max) * (height - 20), d.anon > 0 ? 4 : 0)}px`,
              background: '#9B8EC4', borderRadius: '2px 2px 0 0', opacity: 0.8,
            }} />
          </div>
          <div style={{ fontSize: '0.52rem', color: 'var(--text-muted)', textAlign: 'center', whiteSpace: 'nowrap' }}>
            {d.date}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── KPI Card ───────────────────────────────────────────────── */
function KpiCard({ icon, label, value, sub, color = 'var(--gold)', trend }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: '12px', padding: '1.25rem 1.4rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
        <span style={{ fontSize: '1.4rem' }}>{icon}</span>
        {trend !== undefined && (
          <span style={{ fontSize: '0.72rem', color: trend >= 0 ? '#4CAF50' : '#E07B39', fontWeight: 700 }}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}
          </span>
        )}
      </div>
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '1.5px',
                    textTransform: 'uppercase', marginBottom: '0.3rem' }}>{label}</div>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: '1.8rem', fontWeight: 800, color, lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>{sub}</div>}
    </div>
  )
}

/* ── Section header ─────────────────────────────────────────── */
function SectionHead({ children }) {
  return (
    <div style={{
      fontFamily: "'Cinzel', serif", fontSize: '0.75rem', color: 'var(--gold)',
      letterSpacing: '2px', textTransform: 'uppercase',
      borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem',
      marginBottom: '1rem', marginTop: '2rem',
    }}>{children}</div>
  )
}

/* ── Plan badge ─────────────────────────────────────────────── */
function PlanBadge({ plan }) {
  const colors = { starter: '#8B7B5E', pro: '#C9933A', jyotish: '#9B8EC4' }
  return (
    <span style={{
      fontSize: '0.65rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
      padding: '0.15rem 0.55rem', borderRadius: '10px',
      background: `${colors[plan] || '#5A4E38'}22`, color: colors[plan] || '#5A4E38',
      border: `1px solid ${colors[plan] || '#5A4E38'}44`,
    }}>{plan}</span>
  )
}

/* ── Main Dashboard ─────────────────────────────────────────── */
export default function AdminDashboard() {
  const navigate   = useNavigate()
  const [stats,    setStats]    = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [lastSync, setLastSync] = useState(null)

  const load = useCallback(async () => {
    try {
      const data = await adminGetStats()
      setStats(data)
      setLastSync(new Date().toLocaleTimeString())
      setError('')
    } catch (e) {
      if (e.message.includes('expired')) {
        localStorage.removeItem('bhagya_admin_token')
        navigate('/admin')
      } else {
        setError(e.message)
      }
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    // Check token exists
    if (!localStorage.getItem('bhagya_admin_token')) {
      navigate('/admin')
      return
    }
    load()
    // Auto-refresh every 60s
    const id = setInterval(load, 60000)
    return () => clearInterval(id)
  }, [load, navigate])

  const { theme, toggle: toggleTheme } = useTheme()

  const logout = () => {
    localStorage.removeItem('bhagya_admin_token')
    navigate('/admin')
  }

  const page = {
    minHeight: '100vh', background: 'var(--bg-deep)', padding: '0',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  }
  const topBar = {
    background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
    padding: '0.85rem 1.75rem', display: 'flex', justifyContent: 'space-between',
    alignItems: 'center',
  }
  const wrap = { maxWidth: '1200px', margin: '0 auto', padding: '1.75rem 1.75rem 4rem' }
  const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }
  const grid4 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }
  const card  = {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '1.25rem 1.4rem',
  }

  if (loading) {
    return (
      <div style={{ ...page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--gold)' }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: '1.1rem', marginBottom: '0.5rem' }}>⟳ Loading dashboard...</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Querying all metrics</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ ...page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#E07B39', marginBottom: '1rem' }}>⚠ {error}</div>
          <button onClick={load} style={{ background: 'var(--gold)', color: 'var(--bg-deep)', border: 'none', borderRadius: '8px', padding: '0.6rem 1.4rem', cursor: 'pointer', fontWeight: 700 }}>Retry</button>
        </div>
      </div>
    )
  }

  const u = stats?.users || {}
  const c = stats?.charts || {}
  const t = stats?.traffic || {}
  const r = stats?.revenue || {}

  // Plan donut data (as % widths)
  const planTotal = (u.by_plan?.starter || 0) + (u.by_plan?.pro || 0) + (u.by_plan?.jyotish || 0) || 1
  const planBars = [
    { plan: 'Starter (Free)', count: u.by_plan?.starter || 0, color: '#8B7B5E' },
    { plan: 'Bhagya Pro',     count: u.by_plan?.pro     || 0, color: '#C9933A' },
    { plan: 'Jyotish',        count: u.by_plan?.jyotish || 0, color: '#9B8EC4' },
  ]

  return (
    <div style={page}>
      {/* Top bar */}
      <div style={topBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontFamily: "'Cinzel', serif", color: 'var(--gold)', fontSize: '1rem', fontWeight: 700 }}>
            ◈ TheBhagya Admin
          </span>
          <span style={{ fontSize: '0.68rem', background: 'var(--gold-pale)', color: 'var(--gold)', padding: '0.2rem 0.7rem', borderRadius: '20px', border: '1px solid var(--border)' }}>
            SUPER ADMIN
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {lastSync && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Last sync: {lastSync}</span>}
          <button onClick={load} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--gold)', padding: '0.35rem 0.75rem', cursor: 'pointer', fontSize: '0.78rem' }}>
            ↻ Refresh
          </button>
          <button onClick={toggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--gold)' }}>
            {theme === 'dark' ? '☀' : '🌙'}
          </button>
          <button onClick={logout} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.78rem' }}>
            Sign Out
          </button>
        </div>
      </div>

      <div style={wrap}>
        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ fontFamily: "'Cinzel', serif", color: 'var(--gold)', fontSize: '1.4rem', margin: '0 0 0.25rem' }}>
            Business Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
            Generated {stats?.generated_at}
          </p>
        </div>

        {/* ── TOP KPIs ── */}
        <div style={grid4}>
          <KpiCard icon="👥" label="Total Users"        value={u.total || 0}         sub={`+${u.new_today} today`}               color="#C9933A" trend={u.new_today} />
          <KpiCard icon="📊" label="Charts Generated"   value={c.total || 0}         sub={`${c.today} today · avg ${c.avg_per_user}/user`} color="#E8B86D" trend={c.today} />
          <KpiCard icon="👁" label="Page Views Today"    value={t.views_today || 0}   sub={`${t.unique_sessions_today} unique sessions`}     color="#9B8EC4" trend={t.views_today} />
          <KpiCard icon="₹" label="Est. MRR"            value={`₹${r.mrr_inr?.toLocaleString() || 0}`} sub={`${r.paid_total} paid subscribers`} color="#4CAF50" />
        </div>

        <div style={{ ...grid4, marginTop: '1rem' }}>
          <KpiCard icon="🆓" label="Anon Hits Today"    value={t.anon_today || 0}    sub={`${t.anon_week} this week (no sign-in)`}  color="#8B7B5E" />
          <KpiCard icon="🔄" label="Returning Sessions"  value={t.returning_sessions || 0} sub="Visited more than once"           color="#E07B39" />
          <KpiCard icon="💎" label="Paid Subscribers"   value={r.paid_total || 0}    sub={`Pro: ${r.pro_subs} · Jyotish: ${r.jyotish_subs}`} color="#9B8EC4" />
          <KpiCard icon="📅" label="New This Month"     value={u.new_month || 0}     sub={`${u.new_week} this week`}              color="#C9933A" />
        </div>

        {/* ── USER GROWTH ── */}
        <SectionHead>◈ User Growth — Last 14 Days</SectionHead>
        <div style={card}>
          <BarChart data={u.signups_14d} valueKey="count" labelKey="date" color="#C9933A" height={100} />
          <div style={{ display: 'flex', gap: '2rem', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>⬆ +{u.new_today} today</span>
            <span>⬆ +{u.new_week} this week</span>
            <span>⬆ +{u.new_month} this month</span>
          </div>
        </div>

        {/* ── TRAFFIC ── */}
        <SectionHead>◈ Traffic — Last 7 Days</SectionHead>
        <div style={card}>
          <DualBarChart data={t.traffic_7d} height={100} />
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.72rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--gold)', display: 'inline-block' }} /> All visits
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#9B8EC4', display: 'inline-block' }} /> Anonymous (no login)
            </span>
          </div>
          <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span>Total views: {t.total_views}</span>
            <span>Unique sessions (week): {t.unique_sessions_week}</span>
            <span>Anon this week: {t.anon_week}</span>
          </div>
        </div>

        {/* ── PLAN + TOP PAGES ── */}
        <div style={{ ...grid2, marginTop: '0' }}>
          <div>
            <SectionHead>◈ Users by Plan</SectionHead>
            <div style={card}>
              {planBars.map(p => (
                <div key={p.plan} style={{ marginBottom: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.8rem', color: p.color, fontWeight: 600 }}>{p.plan}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.count} ({Math.round((p.count / planTotal) * 100)}%)</span>
                  </div>
                  <div style={{ background: 'var(--bg-elevated)', borderRadius: '4px', height: '6px' }}>
                    <div style={{
                      height: '6px', borderRadius: '4px',
                      width: `${Math.round((p.count / planTotal) * 100)}%`,
                      background: p.color, transition: 'width 0.5s',
                    }} />
                  </div>
                </div>
              ))}
              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--gold-pale)', borderRadius: '8px', fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Pro × ₹299</span>
                  <span style={{ color: 'var(--gold)', fontWeight: 600 }}>₹{(r.pro_subs * 299).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Jyotish × ₹799</span>
                  <span style={{ color: '#9B8EC4', fontWeight: 600 }}>₹{(r.jyotish_subs * 799).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '0.85rem' }}>Total MRR</span>
                  <span style={{ color: '#4CAF50', fontWeight: 700, fontSize: '0.85rem' }}>₹{r.mrr_inr?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <SectionHead>◈ Top Pages (last 7 days)</SectionHead>
            <div style={card}>
              {!t.top_pages?.length && <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No page view data yet.</p>}
              {t.top_pages?.map((p, i) => {
                const maxH = t.top_pages[0]?.hits || 1
                return (
                  <div key={i} style={{ marginBottom: '0.65rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{p.page || '/'}</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--gold)', fontWeight: 600 }}>{p.hits}</span>
                    </div>
                    <div style={{ background: 'var(--bg-elevated)', borderRadius: '3px', height: '4px' }}>
                      <div style={{ height: '4px', borderRadius: '3px', width: `${(p.hits / maxH) * 100}%`, background: 'var(--gold)', opacity: 0.7 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── RECENT SIGNUPS ── */}
        <SectionHead>◈ Recent Signups</SectionHead>
        <div style={{ ...card, overflowX: 'auto' }}>
          {!u.recent?.length && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No users yet.</p>
          )}
          {u.recent?.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Email', 'Plan', 'Signed Up'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '1px', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {u.recent.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-primary)' }}>{row.email}</td>
                    <td style={{ padding: '0.6rem 0.75rem' }}><PlanBadge plan={row.plan} /></td>
                    <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.76rem' }}>{row.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── QUICK STATS FOOTER ── */}
        <SectionHead>◈ At a Glance</SectionHead>
        <div style={grid4}>
          {[
            { label: 'Conversion Rate',  value: u.total ? `${((r.paid_total / u.total) * 100).toFixed(1)}%` : '0%', sub: 'Free → Paid' },
            { label: 'Charts / User',    value: c.avg_per_user,  sub: 'Average' },
            { label: 'Anon Sessions (week)', value: t.unique_sessions_week, sub: 'Unique browser tabs' },
            { label: 'Returning Rate',   value: t.unique_sessions_week ? `${Math.round((t.returning_sessions / (t.unique_sessions_week || 1)) * 100)}%` : '0%', sub: 'Multi-page visitors' },
          ].map((item, i) => (
            <div key={i} style={{ ...card, textAlign: 'center' }}>
              <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.4rem' }}>{item.label}</div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: '1.5rem', color: 'var(--gold)', fontWeight: 800 }}>{item.value}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
