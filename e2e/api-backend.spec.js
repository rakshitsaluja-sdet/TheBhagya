/**
 * api-backend.spec.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Direct API tests against the Railway backend.
 * These use Playwright's request context (no browser overhead).
 *
 * Base URL: BACKEND_URL env var (default: Railway production)
 *
 * Coverage types: API, FUNCTIONAL, NEGATIVE, BOUNDARY
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { test, expect } from '@playwright/test'

const BACKEND = process.env.BACKEND_URL || 'https://thebhagya-backend-production.up.railway.app'

const VALID_BIRTH = {
  dob: '1990-01-15',
  tob: '14:30',
  lat: 28.6139,
  lon: 77.2090,
  timezone: 'Asia/Kolkata',
}

/* ── Health ──────────────────────────────────────────────────────────────── */
test.describe('API — Health check', () => {

  test('GET / or /health returns 2xx', async ({ request }) => {
    const res = await request.get(`${BACKEND}/health`, { timeout: 20000 }).catch(() => null)
      || await request.get(`${BACKEND}/`, { timeout: 20000 }).catch(() => null)
    if (res) {
      expect(res.status()).toBeLessThan(500)
    } else {
      test.skip(true, 'Backend unreachable — Railway may be sleeping')
    }
  })
})

/* ── Lal Kitab API ───────────────────────────────────────────────────────── */
test.describe('API — Lal Kitab', () => {

  test('POST /api/v1/lal-kitab returns 200 with required fields', async ({ request }) => {
    const res = await request.post(`${BACKEND}/api/v1/lal-kitab`, {
      data: VALID_BIRTH,
      timeout: 35000,
    }).catch(() => null)

    if (!res) { test.skip(true, 'Backend unreachable'); return }

    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('lagna')
    expect(body).toHaveProperty('planets')
    expect(body).toHaveProperty('house_map')
    expect(body).toHaveProperty('lal_kitab')
    expect(body.lal_kitab).toHaveProperty('remedies')
    expect(body.lal_kitab.remedies.length).toBeGreaterThan(0)
  })

  test('POST /api/v1/lal-kitab — planet readings present', async ({ request }) => {
    const res = await request.post(`${BACKEND}/api/v1/lal-kitab`, {
      data: VALID_BIRTH,
      timeout: 35000,
    }).catch(() => null)
    if (!res) { test.skip(true, 'Backend unreachable'); return }

    const body = await res.json()
    expect(body.lal_kitab).toHaveProperty('planet_readings')
    expect(Array.isArray(body.lal_kitab.planet_readings)).toBe(true)
    expect(body.lal_kitab.planet_readings.length).toBe(9) // 9 planets
  })

  test('NEGATIVE: POST /api/v1/lal-kitab without dob returns 4xx', async ({ request }) => {
    const res = await request.post(`${BACKEND}/api/v1/lal-kitab`, {
      data: { tob: '14:30', lat: 28.6139, lon: 77.2090, timezone: 'Asia/Kolkata' },
      timeout: 10000,
    }).catch(() => null)
    if (!res) { test.skip(true, 'Backend unreachable'); return }
    expect(res.status()).toBeGreaterThanOrEqual(400)
    expect(res.status()).toBeLessThan(500)
  })

  test('NEGATIVE: POST /api/v1/lal-kitab with invalid timezone returns 4xx or graceful error', async ({ request }) => {
    const res = await request.post(`${BACKEND}/api/v1/lal-kitab`, {
      data: { ...VALID_BIRTH, timezone: 'Invalid/Zone' },
      timeout: 10000,
    }).catch(() => null)
    if (!res) { test.skip(true, 'Backend unreachable'); return }
    // Either 4xx or returns 200 with error detail — should not 500
    expect(res.status()).not.toBe(500)
  })

  test('BOUNDARY: POST /api/v1/lal-kitab with date 1900-01-01 does not 500', async ({ request }) => {
    const res = await request.post(`${BACKEND}/api/v1/lal-kitab`, {
      data: { ...VALID_BIRTH, dob: '1900-01-01' },
      timeout: 15000,
    }).catch(() => null)
    if (!res) { test.skip(true, 'Backend unreachable'); return }
    expect(res.status()).not.toBe(500)
  })

  test('BOUNDARY: POST /api/v1/lal-kitab with midnight time (00:00) succeeds', async ({ request }) => {
    const res = await request.post(`${BACKEND}/api/v1/lal-kitab`, {
      data: { ...VALID_BIRTH, tob: '00:00' },
      timeout: 15000,
    }).catch(() => null)
    if (!res) { test.skip(true, 'Backend unreachable'); return }
    expect(res.status()).toBe(200)
  })
})

/* ── Kundli API ──────────────────────────────────────────────────────────── */
test.describe('API — Kundli chart', () => {

  test('POST /api/v1/kundli returns lagna and 9 planets', async ({ request }) => {
    const res = await request.post(`${BACKEND}/api/v1/kundli`, {
      data: VALID_BIRTH,
      timeout: 35000,
    }).catch(() => null)
    if (!res) { test.skip(true, 'Backend unreachable'); return }

    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('lagna')
    expect(body).toHaveProperty('planets')
    const planetNames = Object.keys(body.planets || {})
    expect(planetNames.length).toBeGreaterThanOrEqual(9)
  })
})

/* ── Numerology API ──────────────────────────────────────────────────────── */
test.describe('API — Numerology', () => {

  test('POST /api/v1/numerology returns life path and destiny numbers', async ({ request }) => {
    const res = await request.post(`${BACKEND}/api/v1/numerology`, {
      data: { name: 'Arjun Sharma', dob: '1990-01-15' },
      timeout: 15000,
    }).catch(() => null)
    if (!res) { test.skip(true, 'Backend unreachable'); return }

    expect(res.status()).toBe(200)
    const body = await res.json()
    // Should have at least life_path or destiny_number
    const hasNumbers = body.life_path || body.destiny_number || body.lifePath || body.destinyNumber
    expect(hasNumbers).toBeTruthy()
  })

  test('BOUNDARY: numerology with single-character name', async ({ request }) => {
    const res = await request.post(`${BACKEND}/api/v1/numerology`, {
      data: { name: 'A', dob: '1990-01-15' },
      timeout: 10000,
    }).catch(() => null)
    if (!res) { test.skip(true, 'Backend unreachable'); return }
    expect(res.status()).not.toBe(500)
  })

  test('EDGE: numerology with Hindi name characters', async ({ request }) => {
    const res = await request.post(`${BACKEND}/api/v1/numerology`, {
      data: { name: 'राज कुमार', dob: '1990-01-15' },
      timeout: 10000,
    }).catch(() => null)
    if (!res) { test.skip(true, 'Backend unreachable'); return }
    // Should not crash — either 200 or 4xx
    expect(res.status()).not.toBe(500)
  })
})

/* ── Kundli Matching API ─────────────────────────────────────────────────── */
test.describe('API — Kundli Matching', () => {

  test('POST /api/v1/kundli-matching returns score out of 36', async ({ request }) => {
    const res = await request.post(`${BACKEND}/api/v1/kundli-matching`, {
      data: {
        bride_dob: '1992-03-20', bride_tob: '10:00',
        groom_dob: '1990-01-15', groom_tob: '14:30',
        bride_timezone: 'Asia/Kolkata',
        groom_timezone: 'Asia/Kolkata',
      },
      timeout: 35000,
    }).catch(() => null)
    if (!res) { test.skip(true, 'Backend unreachable'); return }

    expect(res.status()).toBe(200)
    const body = await res.json()
    // Score should be a number between 0 and 36
    const score = body.total_score || body.totalScore || body.score
    if (score !== undefined) {
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(36)
    }
  })
})

/* ── Horoscope API ───────────────────────────────────────────────────────── */
test.describe('API — Horoscope', () => {

  test('GET /api/v1/horoscope returns reading for Aries daily', async ({ request }) => {
    const res = await request.get(`${BACKEND}/api/v1/horoscope?sign=Aries&period=daily`, {
      timeout: 15000,
    }).catch(() => null)
    if (!res) { test.skip(true, 'Backend unreachable'); return }
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toBeTruthy()
  })

  test('NEGATIVE: GET /api/v1/horoscope with invalid sign returns 4xx', async ({ request }) => {
    const res = await request.get(`${BACKEND}/api/v1/horoscope?sign=NotASign&period=daily`, {
      timeout: 10000,
    }).catch(() => null)
    if (!res) { test.skip(true, 'Backend unreachable'); return }
    expect(res.status()).toBeGreaterThanOrEqual(400)
  })
})
