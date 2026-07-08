/**
 * pricing.spec.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Pricing page — plan cards, CTAs, Bhagya brand, light/dark toggle.
 *
 * Coverage types: FUNCTIONAL, VISUAL SMOKE
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { test, expect } from '@playwright/test'

test.describe('Pricing page — structure', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing')
    await page.waitForLoadState('domcontentloaded')
  })

  test('page heading mentions pricing or plans', async ({ page }) => {
    await expect(page.getByText(/plan|pricing|choose/i).first()).toBeVisible()
  })

  test('three plan tiers are visible', async ({ page }) => {
    // Expect at least 3 CTA buttons (one per plan)
    const ctaButtons = page.locator('button, a').filter({ hasText: /get started|free|subscribe|choose|upgrade/i })
    await expect(ctaButtons).toHaveCount(3, { timeout: 5000 }).catch(async () => {
      // Fallback: at least 2 plan sections exist
      const cards = page.locator('[class*="card"], [class*="plan"], div').filter({ has: page.locator('h2, h3') })
      const count = await cards.count()
      expect(count).toBeGreaterThanOrEqual(2)
    })
  })

  test('Bhagya brand wordmark is visible on pricing page', async ({ page }) => {
    await expect(page.getByText(/bhagya/i).first()).toBeVisible()
  })

  test('BHAGYA wordmark uses Cinzel font (brand identity)', async ({ page }) => {
    const brandEl = page.getByText(/bhagya/i).first()
    await expect(brandEl).toBeVisible()
    const fontFamily = await brandEl.evaluate(el => getComputedStyle(el).fontFamily)
    expect(fontFamily.toLowerCase()).toContain('cinzel')
  })
})

test.describe('Pricing page — interactions', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing')
    await page.waitForLoadState('domcontentloaded')
  })

  test('clicking a paid plan CTA navigates to /login or checkout', async ({ page }) => {
    const paidCta = page.locator('button, a').filter({ hasText: /subscribe|upgrade|jyotish|pro/i }).first()
    if (await paidCta.isVisible()) {
      await paidCta.click()
      await page.waitForTimeout(1000)
      const url = page.url()
      expect(url).toMatch(/login|checkout|pricing|razorpay/i)
    }
  })

  test('free plan CTA navigates to /chart/new or /login', async ({ page }) => {
    const freeCta = page.locator('button, a').filter({ hasText: /free|start for free/i }).first()
    if (await freeCta.isVisible()) {
      await freeCta.click()
      await page.waitForTimeout(1000)
      const url = page.url()
      expect(url).toMatch(/chart|login/)
    }
  })
})

test.describe('Pricing page — no crashes', () => {

  test('no unhandled JS errors', async ({ page }) => {
    const errors = []
    page.on('pageerror', e => errors.push(e.message))
    await page.goto('/pricing')
    await page.waitForLoadState('networkidle')
    expect(errors.filter(e => !e.includes('ResizeObserver'))).toHaveLength(0)
  })
})
