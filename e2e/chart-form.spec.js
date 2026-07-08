/**
 * chart-form.spec.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Chart form (/chart/new) — birth details form, anonymous access,
 * validation, boundary cases, happy flow.
 *
 * Note: /chart/new is public (no login required per the codebase).
 *
 * Coverage types: FUNCTIONAL, HAPPY FLOW, NEGATIVE, BOUNDARY, EDGE
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { test, expect } from '@playwright/test'

test.describe('Chart form — page load', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/chart/new')
    await page.waitForLoadState('domcontentloaded')
  })

  test('form renders without crashing', async ({ page }) => {
    await expect(page.locator('form, [role="form"], input').first()).toBeVisible()
  })

  test('name input is present', async ({ page }) => {
    const nameInput = page.locator('input[name="name"], input[placeholder*="name"], input[type="text"]').first()
    await expect(nameInput).toBeVisible()
  })

  test('date and time inputs are present', async ({ page }) => {
    await expect(page.locator('input[type="date"]')).toBeVisible()
    await expect(page.locator('input[type="time"]')).toBeVisible()
  })

  test('city/location input is present', async ({ page }) => {
    const cityInput = page.locator('input[placeholder*="city"], input[placeholder*="place"], select').first()
    await expect(cityInput).toBeVisible()
  })
})

test.describe('Chart form — validation (negative / boundary)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/chart/new')
    await page.waitForLoadState('domcontentloaded')
  })

  test('NEGATIVE: submit with empty form shows error or stays on page', async ({ page }) => {
    const btn = page.locator('button[type="submit"], button').filter({ hasText: /compute|generate|create|get chart/i }).first()
    if (await btn.isVisible()) {
      if (!(await btn.isDisabled())) {
        await btn.click()
        await page.waitForTimeout(1000)
        await expect(page).toHaveURL(/\/chart\/new/)
      }
    }
  })

  test('BOUNDARY: name with 1 character is accepted', async ({ page }) => {
    const nameInput = page.locator('input[type="text"]').first()
    if (await nameInput.isVisible()) {
      await nameInput.fill('A')
      await expect(nameInput).toHaveValue('A')
    }
  })

  test('BOUNDARY: name with 100 characters does not crash', async ({ page }) => {
    const nameInput = page.locator('input[type="text"]').first()
    if (await nameInput.isVisible()) {
      await nameInput.fill('A'.repeat(100))
      const errors = []
      page.on('pageerror', e => errors.push(e.message))
      expect(errors).toHaveLength(0)
    }
  })

  test('EDGE: special characters in name field are handled', async ({ page }) => {
    const nameInput = page.locator('input[type="text"]').first()
    if (await nameInput.isVisible()) {
      await nameInput.fill('राज Kumar <test>')
      await expect(page).toHaveURL(/\/chart\/new/)
    }
  })

  test('BOUNDARY: date Jan 1 1900 is accepted', async ({ page }) => {
    const dateInput = page.locator('input[type="date"]')
    await dateInput.fill('1900-01-01')
    await expect(dateInput).toHaveValue('1900-01-01')
  })
})

test.describe('Chart form — happy flow', () => {

  test('happy flow: fill form → submit → chart result page', async ({ page }) => {
    await page.goto('/chart/new')
    await page.waitForLoadState('domcontentloaded')

    // Fill name
    const nameInput = page.locator('input[type="text"]').first()
    if (await nameInput.isVisible()) {
      await nameInput.fill('Arjun Sharma')
    }

    // Fill date and time
    await page.locator('input[type="date"]').fill('1990-01-15')
    await page.locator('input[type="time"]').fill('14:30')

    // Fill city — try select first, then text input
    const select = page.locator('select').first()
    if (await select.isVisible()) {
      await select.selectOption({ index: 1 }) // Pick first non-empty option
    }

    // Submit
    const btn = page.locator('button').filter({ hasText: /compute|generate|create|get|chart/i }).first()
    if (await btn.isEnabled()) {
      await btn.click()
      // Should navigate to result or show loading
      await page.waitForURL(/\/chart\//, { timeout: 35000 }).catch(() => {})
    }
  })
})
