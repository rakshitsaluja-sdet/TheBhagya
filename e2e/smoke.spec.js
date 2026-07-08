/**
 * smoke.spec.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Every public route must: load, render visible content, and produce no
 * unhandled JS exceptions.  These are the fastest, most critical tests.
 *
 * Coverage type: SMOKE
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { test, expect } from '@playwright/test'

// Routes accessible without login
const PUBLIC_ROUTES = [
  { path: '/',               title: /bhagya|destiny|astro/i,  selector: 'h1, h2' },
  { path: '/login',          title: /bhagya|login|sign/i,     selector: 'form, input' },
  { path: '/pricing',        title: /bhagya|pricing|plan/i,   selector: 'h1, h2' },
  { path: '/horoscope',      title: /bhagya|horoscope/i,      selector: 'select, button' },
  { path: '/sade-sati',      title: /bhagya|sade/i,           selector: 'button, input' },
  { path: '/doshas',         title: /bhagya|dosha/i,          selector: 'button, input' },
  { path: '/kundli-matching',title: /bhagya|kundli|match/i,   selector: 'button, input' },
  { path: '/lal-kitab',      title: /bhagya|lal kitab/i,      selector: 'button, input' },
  { path: '/admin',          title: /bhagya|admin/i,          selector: 'form, input' },
]

// Routes that require login → should redirect to /login
const AUTH_GATED_ROUTES = [
  '/my-charts',
  '/chart/new',
  '/destiny-chat',
  '/numerology',
]

test.describe('Smoke — public routes render', () => {
  for (const { path, title, selector } of PUBLIC_ROUTES) {
    test(`GET ${path} → visible content`, async ({ page }) => {
      const errors = []
      page.on('pageerror', err => errors.push(err.message))

      await page.goto(path)
      await page.waitForLoadState('domcontentloaded')

      // Page must have a title
      await expect(page).toHaveTitle(title)

      // At least one key element must be visible
      const el = page.locator(selector).first()
      await expect(el).toBeVisible({ timeout: 8000 })

      // No unhandled JS errors
      expect(errors.filter(e => !e.includes('ResizeObserver'))).toHaveLength(0)
    })
  }
})

test.describe('Smoke — auth-gated routes redirect', () => {
  for (const path of AUTH_GATED_ROUTES) {
    test(`GET ${path} → redirects to /login`, async ({ page }) => {
      await page.goto(path)
      await page.waitForURL(/\/login/, { timeout: 10000 })
      await expect(page).toHaveURL(/\/login/)
    })
  }
})

test.describe('Smoke — 404 fallback', () => {
  test('unknown route redirects to /', async ({ page }) => {
    await page.goto('/this-route-does-not-exist')
    await page.waitForLoadState('domcontentloaded')
    // Router falls back to / (Navigate replace)
    await expect(page).toHaveURL('/')
  })
})
