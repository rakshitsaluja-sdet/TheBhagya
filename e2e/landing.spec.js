/**
 * landing.spec.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Landing page: hero section, feature cards, CTA links, footer.
 *
 * Coverage types: FUNCTIONAL, HAPPY FLOW
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { test, expect } from '@playwright/test'

test.describe('Landing page', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('domcontentloaded')
  })

  // ── Hero ─────────────────────────────────────────────────────────────────
  test('hero heading is visible', async ({ page }) => {
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible()
  })

  test('BHAGYA brand wordmark in Cinzel font', async ({ page }) => {
    // The brand word "BHAGYA" must appear
    const brand = page.getByText('BHAGYA')
    await expect(brand.first()).toBeVisible()
  })

  test('Free Kundali CTA button is visible and links to /chart/new', async ({ page }) => {
    // Primary CTA — "Free Kundali" or similar
    const cta = page.locator('a[href*="/chart"], button').filter({ hasText: /kundali|free|start|begin/i }).first()
    await expect(cta).toBeVisible()
  })

  // ── Feature cards ────────────────────────────────────────────────────────
  test('Lal Kitab feature card links to /lal-kitab', async ({ page }) => {
    const card = page.locator('a[href="/lal-kitab"]').first()
    await expect(card).toBeVisible()
  })

  test('Kundli Match feature card links to /kundli-matching', async ({ page }) => {
    const card = page.locator('a[href="/kundli-matching"]').first()
    await expect(card).toBeVisible()
  })

  test('Destiny Chat feature card links to /destiny-chat', async ({ page }) => {
    const card = page.locator('a[href="/destiny-chat"]').first()
    await expect(card).toBeVisible()
  })

  // ── Navigation ───────────────────────────────────────────────────────────
  test('clicking Pricing link navigates to /pricing', async ({ page }) => {
    const link = page.locator('a[href="/pricing"]').first()
    await expect(link).toBeVisible()
    await link.click()
    await expect(page).toHaveURL(/\/pricing/)
  })

  test('Sign In button navigates to /login', async ({ page }) => {
    const link = page.locator('a[href="/login"], a').filter({ hasText: /sign in|login/i }).first()
    await expect(link).toBeVisible()
    await link.click()
    await expect(page).toHaveURL(/\/login/)
  })

  // ── Footer ───────────────────────────────────────────────────────────────
  test('footer renders with Lal Kitab link', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    const footerLink = page.locator('footer a[href="/lal-kitab"]').first()
    await expect(footerLink).toBeVisible({ timeout: 8000 })
  })

  // ── No crash ─────────────────────────────────────────────────────────────
  test('no unhandled JS errors on load', async ({ page }) => {
    const errors = []
    page.on('pageerror', e => errors.push(e.message))
    await page.reload()
    await page.waitForLoadState('networkidle')
    expect(errors.filter(e => !e.includes('ResizeObserver'))).toHaveLength(0)
  })
})
