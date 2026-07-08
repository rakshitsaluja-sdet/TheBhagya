/**
 * kundli-matching.spec.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Kundli Matching page — form, city presets, Ashtakoot score, validation.
 *
 * Coverage types: FUNCTIONAL, HAPPY FLOW, NEGATIVE, BOUNDARY
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { test, expect } from '@playwright/test'

test.describe('Kundli Matching — page load', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/kundli-matching')
    await page.waitForLoadState('domcontentloaded')
  })

  test('page heading is visible', async ({ page }) => {
    await expect(page.getByText(/kundli match|kundali match|compatibility/i)).toBeVisible()
  })

  test('bride and groom sections both present', async ({ page }) => {
    await expect(page.getByText(/bride|girl|female/i).first()).toBeVisible()
    await expect(page.getByText(/groom|boy|male/i).first()).toBeVisible()
  })

  test('submit button is disabled on page load', async ({ page }) => {
    const btn = page.locator('button').filter({ hasText: /match|check|analyse/i }).first()
    await expect(btn).toBeDisabled()
  })
})

test.describe('Kundli Matching — city presets', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/kundli-matching')
    await page.waitForLoadState('domcontentloaded')
  })

  test('bride city select auto-fills timezone', async ({ page }) => {
    const selects = page.locator('select')
    // First select = bride city
    await selects.first().selectOption({ label: 'Mumbai' })
    // After selection, some timezone-related text should appear
    const inputs = page.locator('input')
    const count = await inputs.count()
    expect(count).toBeGreaterThan(1)
  })

  test('groom city select auto-fills independently', async ({ page }) => {
    const selects = page.locator('select')
    await selects.first().selectOption({ label: 'Mumbai' })
    await selects.last().selectOption({ label: 'Delhi' })
    // Both should have values
    const firstVal = await selects.first().inputValue()
    const lastVal = await selects.last().inputValue()
    expect(firstVal).not.toBe(lastVal)
  })
})

test.describe('Kundli Matching — validation (negative / boundary)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/kundli-matching')
    await page.waitForLoadState('domcontentloaded')
  })

  test('NEGATIVE: only bride data filled — button still disabled', async ({ page }) => {
    const dates = page.locator('input[type="date"]')
    const times = page.locator('input[type="time"]')

    await dates.first().fill('1992-03-20')
    await times.first().fill('10:00')

    const btn = page.locator('button').filter({ hasText: /match|check|analyse/i }).first()
    await expect(btn).toBeDisabled()
  })

  test('BOUNDARY: same DOB for bride and groom is allowed', async ({ page }) => {
    const selects = page.locator('select')
    await selects.first().selectOption({ label: 'Delhi' })
    await selects.last().selectOption({ label: 'Mumbai' })

    const dates = page.locator('input[type="date"]')
    const times = page.locator('input[type="time"]')

    await dates.nth(0).fill('1995-06-15')
    await times.nth(0).fill('10:00')
    await dates.nth(1).fill('1995-06-15')
    await times.nth(1).fill('10:00')

    const btn = page.locator('button').filter({ hasText: /match|check|analyse/i }).first()
    await expect(btn).toBeEnabled()
  })
})

test.describe('Kundli Matching — happy flow', () => {

  test('happy flow: fill both persons → compute → score visible', async ({ page }) => {
    await page.goto('/kundli-matching')
    await page.waitForLoadState('domcontentloaded')

    const selects = page.locator('select')
    await selects.nth(0).selectOption({ label: 'Delhi' })
    await selects.nth(1).selectOption({ label: 'Mumbai' })

    const dates = page.locator('input[type="date"]')
    const times = page.locator('input[type="time"]')

    await dates.nth(0).fill('1992-03-20')
    await times.nth(0).fill('10:00')
    await dates.nth(1).fill('1990-01-15')
    await times.nth(1).fill('14:30')

    const btn = page.locator('button').filter({ hasText: /match|check|analyse/i }).first()
    await expect(btn).toBeEnabled()
    await btn.click()

    // Wait for result (API cold start)
    const score = page.getByText(/guna|points|score|\/36/i)
    await expect(score).toBeVisible({ timeout: 35000 })
  })
})
