import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listCharts, deleteChart } from '../hooks/useApi'
import { useAuth } from '../context/AuthContext'

const s = {
  wrap: { maxWidth: '800px', margin: '3rem auto', padding: '0 1.5rem' },
  heading: { fontFamily: "'Cinzel', serif", fontSize: '1.8rem', color: 'var(--gold)', marginBottom: '0.5rem' },
  sub: { color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem' },
  empty: { textAlign: 'center', padding: '4rem', color: 'var(--text-dim)' },
  emptyIcon: { fontSize: '3rem', marginBottom: '1rem' },
  list: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  card: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: '12px', padding: '1.25rem 1.5rem',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    transition: 'border-color 0.2s',
  },
  name: { fontFamily: "'Cinzel', serif", fontSize: '1.05rem', color: 'var(--gold)', marginBottom: '0.25rem' },
  meta: { color: 'var(--text-dim)', fontSize: '0.82rem' },
  actions: { display: 'flex', gap: '0.75rem', alignItems: 'center' },
  viewBtn: {
    color: 'var(--gold)', fontWeight: 500, fontSize: '0.85rem', textDecoration: 'none',
    border: '1px solid rgba(201,147,58,0.3)', borderRadius: '6px',
    padding: '0.4rem 0.9rem', transition: 'border-color 0.2s',
  },
  delBtn: { color: 'var(--text-dim)', fontSize: '0.82rem', background: 'none', border: 'none', cursor: 'pointer', padding: '0.4rem 0.6rem' },
  loading: { textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', fontFamily: "'Cinzel', serif" },
  guestBox: {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: '14px', padding: '3rem 2rem', textAlign: 'center',
  },
  guestIcon: { fontSize: '2.5rem', marginBottom: '1rem' },
  guestTitle: { fontFamily: "'Cinzel', serif", fontSize: '1.2rem', color: 'var(--gold)', marginBottom: '0.5rem' },
  guestSub: { color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.75rem', maxWidth: '380px', margin: '0 auto 1.75rem' },
  btnRow: { display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' },
}

export default function MyCharts() {
  const { isLoggedIn } = useAuth()
  const [charts, setCharts] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    if (!isLoggedIn) { setLoading(false); return }
    setLoading(true)
    listCharts().then(setCharts).catch(() => setCharts([])).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [isLoggedIn])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this chart?')) return
    try {
      await deleteChart(id)
      setCharts(c => c.filter(ch => ch.id !== id))
    } catch (err) {
      alert('Could not delete chart: ' + err.message)
    }
  }

  // ── Not logged in ────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div style={s.wrap}>
        <h1 style={s.heading}>My Charts</h1>
        <p style={s.sub}>Your saved birth chart readings.</p>
        <div style={s.guestBox}>
          <div style={s.guestIcon}>🔮</div>
          <div style={s.guestTitle}>Sign in to view your charts</div>
          <p style={s.guestSub}>
            Create an account to save your charts and access them any time.
            Your readings are always private and tied to your account.
          </p>
          <div style={s.btnRow}>
            <Link to="/login" className="btn-primary">Sign In</Link>
            <Link to="/chart/new" style={{ color: 'var(--gold)', textDecoration: 'none', padding: '0.6rem 1.4rem', border: '1px solid rgba(201,147,58,0.3)', borderRadius: '8px', fontSize: '0.9rem' }}>
              Try a Free Chart
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── Logged in ────────────────────────────────────────────────────────────
  return (
    <div style={s.wrap}>
      <h1 style={s.heading}>My Charts</h1>
      <p style={s.sub}>All your saved birth chart readings. Click to open the full reading.</p>

      {loading && <div style={s.loading}>Loading your stars...</div>}

      {!loading && charts.length === 0 && (
        <div style={s.empty}>
          <div style={s.emptyIcon}>✦</div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>No charts yet. Create your first reading.</p>
          <Link to="/chart/new" className="btn-primary">Get Your Reading</Link>
        </div>
      )}

      {!loading && charts.length > 0 && (
        <div style={s.list}>
          {charts.map(ch => (
            <div key={ch.id} style={s.card}
              onMouseEnter={e => e.currentTarget.style.borderColor='rgba(201,147,58,0.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
              <div>
                <div style={s.name}>{ch.label || 'Unnamed Chart'}</div>
                <div style={s.meta}>{ch.dob} · {ch.tob} · {ch.timezone}</div>
                {ch.place_name && <div style={s.meta}>{ch.place_name}</div>}
              </div>
              <div style={s.actions}>
                <Link to={`/chart/${ch.id}`} style={s.viewBtn}>View →</Link>
                <button style={s.delBtn} onClick={() => handleDelete(ch.id)} title="Delete">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '2rem' }}>
        <Link to="/chart/new" className="btn-primary">+ New Chart</Link>
      </div>
    </div>
  )
}
