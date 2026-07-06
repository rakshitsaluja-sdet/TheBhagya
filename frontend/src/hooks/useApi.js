// Central API helper
// Dev:  Vite proxy forwards /v1 → localhost:8000 (see vite.config.js)
// Prod: VITE_API_BASE_URL env var points to deployed backend (e.g. Railway/Render URL)

const BASE = (import.meta.env.VITE_API_BASE_URL || '') + '/v1'

function authHeaders() {
  const token = localStorage.getItem('bhagya_token')
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' }
}

// ── Charts ────────────────────────────────────────────────────────────────

export async function createChart(data) {
  const res = await fetch(`${BASE}/charts`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Error ${res.status}`)
  }
  return res.json()
}

export async function getChart(id) {
  const res = await fetch(`${BASE}/charts/${id}`, { headers: authHeaders() })
  if (!res.ok) throw new Error('Chart not found')
  return res.json()
}

export async function listCharts() {
  const res = await fetch(`${BASE}/charts`, { headers: authHeaders() })
  if (!res.ok) throw new Error('Failed to load charts')
  return res.json()
}

export async function deleteChart(id) {
  const res = await fetch(`${BASE}/charts/${id}`, { method: 'DELETE', headers: authHeaders() })
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`)
}

// ── Numerology ────────────────────────────────────────────────────────────

export async function computeNumerology(data) {
  const res = await fetch(`${BASE}/numerology`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Error ${res.status}`)
  }
  return res.json()
}

// ── Auth ──────────────────────────────────────────────────────────────────

export async function authSeed() {
  const res = await fetch(`${BASE}/auth/seed`, { method: 'POST' })
  if (!res.ok) throw new Error('Seed failed')
  return res.json()
}

export async function authLogin(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Login failed')
  return data
}

export async function authRegister(email, password, plan) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, plan }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Registration failed')
  return data
}

export async function authGoogleLogin(credential) {
  const res = await fetch(`${BASE}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Google login failed: ${res.status}`)
  }
  return res.json()
}

// ── Page View Tracking ────────────────────────────────────────────────────

// Generate or retrieve a stable session ID for this browser tab
function getSessionId() {
  let sid = sessionStorage.getItem('bhagya_sid')
  if (!sid) {
    sid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now()
    sessionStorage.setItem('bhagya_sid', sid)
  }
  return sid
}

export async function trackPageView(page) {
  try {
    const token   = localStorage.getItem('bhagya_token')
    let   user_id = null
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        user_id = payload.sub || null
      } catch {}
    }
    await fetch(`${BASE}/admin/track`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: getSessionId(),
        user_id,
        page: page || window.location.pathname,
        referrer: document.referrer || null,
      }),
    })
  } catch {
    // Tracking is non-critical — never throw
  }
}

// ── Admin ─────────────────────────────────────────────────────────────────

function adminHeaders() {
  const token = localStorage.getItem('bhagya_admin_token')
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' }
}

export async function adminLogin(email, password) {
  const res = await fetch(`${BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Invalid admin credentials')
  return data
}

export async function adminGetStats() {
  const res = await fetch(`${BASE}/admin/stats`, { headers: adminHeaders() })
  if (res.status === 401) throw new Error('Admin session expired — please log in again')
  if (!res.ok) throw new Error('Failed to load stats')
  return res.json()
}
