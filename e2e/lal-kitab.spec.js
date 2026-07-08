/**
 * lal-kitab.spec.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Lal Kitab page — form validation, city preset auto-fill, accordion regression,
 * happy-flow API result, and edge/negative/boundary cases.
 *
 * Coverage types: FUNCTIONAL, HAPPY FLOW, EDGE, NEGATIVE, BOUNDARY, REGRESSION
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { test, expect } from '@playwright/test'

test.describe('Lal Kitab — page load', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/lal-kitab')
    await page.waitForLoadState('domcontentloaded')
  })

  test('heading and eyebrow are visible', async ({ page }) => {
    await expect(page.getByText(/lal kitab reading/i)).toBeVisible()
    await expect(page.getByText(/remedial astrology/i)).toBeVisible()
  })

  test('form has all required fields', async ({ page }) => {
    await expect(page.locator('input[type="date"]')).toBeVisible()
    await expect(page.locator('input[type="time"]')).toBeVisible()
    await expect(page.locator('select')).toBeVisible()
    await expect(page.locator('input[type="number"]').first()).toBeVisible() // lat
    await expect(page.locator('input[type="number"]').last()).toBeVisible()  // lon
  })

  test('submit button is disabled when form is empty', async ({ page }) => {
    const btn = page.locator('button').filter({ hasText: /get lal kitab/i })
    await expect(btn).toBeDisabled()
  })
})

test.describe('Lal Kitab — city preset auto-fill', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/lal-kitab')
    await page.waitForLoadState('domcontentloaded')
  })

  test('selecting Mumbai fills lat, lon, and timezone', async ({ page }) => {
    await page.selectOption('select', { label: 'Mumbai' })

    const lat = page.locator('input[placeholder*="28"], input[placeholder*="19"], input[type="number"]').first()
    // Value must be non-empty after city selection
    const latVal = await page.locator('input[type="number"]').first().inputValue()
    expect(latVal).not.toBe('')
    expect(parseFloat(latVal)).toBeCloseTo(19.076, 1)

    const timezone = await page.locator('input[placeholder*="Kolkata"]').inputValue()
    expect(timezone).toBe('Asia/Kolkata')
  })

  test('selecting Toronto fills negative longitude and correct timezone', async ({ page }) => {
    await page.selectOption('select', { label: 'Toronto' })
    const lon = await page.locator('input[type="number"]').last().inputValue()
    expect(parseFloat(lon)).toBeLessThan(0)
    const tz = await page.locator('input[placeholder*="Kolkata"], input[value*="America"]').last().inputValue()
    expect(tz).toBe('America/Toronto')
  })

  test('selecting Dubai fills Middle-East timezone', async ({ page }) => {
    await page.selectOption('select', { label: 'Dubai' })
    const tz = await page.locator('input[type="text"]').filter({ hasText: '' }).last().inputValue()
    // Timezone field should contain Dubai
    const tzInput = page.locator('input').nth(4) // 5th input = timezone
    const tzVal = await tzInput.inputValue()
    expect(tzVal).toBe('Asia/Dubai')
  })
})

test.describe('Lal Kitab — form validation (negative / boundary)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/lal-kitab')
    await page.waitForLoadState('domcontentloaded')
  })

  test('NEGATIVE: button stays disabled with only date filled', async ({ page }) => {
    await page.locator('input[type="date"]').fill('1990-05-20')
    const btn = page.locator('button').filter({ hasText: /get lal kitab/i })
    await expect(btn).toBeDisabled()
  })

  test('NEGATIVE: button stays disabled with date + time but no coordinates', async ({ page }) => {
    await page.locator('input[type="date"]').fill('1990-05-20')
    await page.locator('input[type="time"]').fill('14:30')
    const btn = page.locator('button').filter({ hasText: /get lal kitab/i })
    await expect(btn).toBeDisabled()
  })

  test('BOUNDARY: minimum valid date (1900-01-01) is accepted', async ({ page }) => {
    await page.selectOption('select', { label: 'Delhi' })
    await page.locator('input[type="date"]').fill('1900-01-01')
    await page.locator('input[type="time"]').fill('12:00')
    const btn = page.locator('button').filter({ hasText: /get lal kitab/i })
    await expect(btn).toBeEnabled()
  })

  test('BOUNDARY: future date (2099-12-31) is accepted', async ({ page }) => {
    await page.selectOption('select', { label: 'Delhi' })
    await page.locator('input[type="date"]').fill('2099-12-31')
    await page.locator('input[type="time"]').fill('23:59')
    const btn = page.locator('button').filter({ hasText: /get lal kitab/i })
    await expect(btn).toBeEnabled()
  })

  test('BOUNDARY: midnight time (00:00) is accepted', async ({ page }) => {
    await page.selectOption('select', { label: 'Mumbai' })
    await page.locator('input[type="date"]').fill('1985-06-15')
    await page.locator('input[type="time"]').fill('00:00')
    const btn = page.locator('button').filter({ hasText: /get lal kitab/i })
    await expect(btn).toBeEnabled()
  })

  test('EDGE: manual lat/lon entry enables submit', async ({ page }) => {
    await page.locator('input[type="date"]').fill('1990-05-20')
    await page.locator('input[type="time"]').fill('17:13')
    await page.locator('input[type="number"]').first().fill('28.6139')
    await page.locator('input[type="number"]').last().fill('77.2090')
    // Timezone already pre-filled as Asia/Kolkata
    const btn = page.locator('button').filter({ hasText: /get lal kitab/i })
    await expect(btn).toBeEnabled()
  })
})

test.describe('Lal Kitab — happy flow & API result', () => {

  test('happy flow: fill form → compute → results panel renders', async ({ page }) => {
    await page.goto('/lal-kitab')
    await page.waitForLoadState('domcontentloaded')

    // Fill form using city preset
    await page.selectOption('select', { label: 'Delhi' })
    await page.locator('input[type="date"]').fill('1990-01-15')
    await page.locator('input[type="time"]').fill('14:30')

    const btn = page.locator('button').filter({ hasText: /get lal kitab/i })
    await expect(btn).toBeEnabled()
    await btn.click()

    // Loading state
    await expect(page.locator('button').filter({ hasText: /computing/i })).toBeVisible({ timeout: 5000 }).catch(() => {})

    // Wait for result — Railway may cold-start (up to 35s)
    const result = page.locator('#lk-result')
    await expect(result).toBeVisible({ timeout: 35000 })

    // House map SVG must be present
    await expect(page.locator('svg')).toBeVisible()

    // Chart summary section
    await expect(page.getByText(/lagna|ascendant/i).first()).toBeVisible()

    // Remedies section
    await expect(page.getByText(/personalised lal kitab remedies/i)).toBeVisible()
  })
})

test.describe('Lal Kitab — accordion regression (stopPropagation fix)', () => {

  /**
   * REGRESSION: Before fix, clicking a sub-accordion (Mantra/Steps/Rules/Avoid)
   * would bubble up and close the parent remedy card.
   * After fix: parent card stays open while inner accordion expands.
   */
  test('clicking Mantra sub-accordion does NOT close the parent remedy card', async ({ page }) => {
    await page.goto('/lal-kitab')
    await page.waitForLoadState('domcontentloaded')

    await page.selectOption('select', { label: 'Delhi' })
    await page.locator('input[type="date"]').fill('1990-01-15')
    await page.locator('input[type="time"]').fill('14:30')

    await page.locator('button').filter({ hasText: /get lal kitab/i }).click()
    await expect(page.locator('#lk-result')).toBeVisible({ timeout: 35000 })

    // Open the first remedy card
    const firstCard = page.locator('#lk-result').locator('[style*="cursor: pointer"]').first()
    await firstCard.click()

    // The card should show 'Close' when open
    await expect(firstCard.getByText(/close/i)).toBeVisible({ timeout: 5000 })

    // Now click the Mantra sub-accordion inside it
    const mantraBtn = firstCard.getByText('Mantra')
    if (await mantraBtn.isVisible()) {
      await mantraBtn.click()

      // Parent card must STILL show 'Close' — not collapsed
      await expect(firstCard.getByText(/close/i)).toBeVisible()

      // Mantra content must be visible now
      await expect(firstCard.locator('text=▲')).toBeVisible()
    }
  })

  test('clicking Step-by-Step Guide does NOT close the parent card', async ({ page }) => {
    await page.goto('/lal-kitab')
    await page.waitForLoadState('domcontentloaded')

    await page.selectOption('select', { label: 'Delhi' })
    await page.locator('input[type="date"]').fill('1990-01-15')
    await page.locator('input[type="time"]').fill('14:30')

    await page.locator('button').filter({ hasText: /get lal kitab/i }).click()
    await expect(page.locator('#lk-result')).toBeVisible({ timeout: 35000 })

    const firstCard = page.locator('#lk-result').locator('[style*="cursor: pointer"]').first()
    await firstCard.click()
    await expect(firstCard.getByText(/close/i)).toBeVisible({ timeout: 5000 })

    const stepBtn = firstCard.getByText(/step-by-step/i)
    if (await stepBtn.isVisible()) {
      await stepBtn.click()
      // Parent must stay open
      await expect(firstCard.getByText(/close/i)).toBeVisible()
    }
  })
})

test.describe('Lal Kitab — CTA section', () => {
  test('Create Full Kundali CTA appears in results and links to /chart/new', async ({ page }) => {
    await page.goto('/lal-kitab')
    await page.waitForLoadState('domcontentloaded')

    await page.selectOption('select', { label: 'Delhi' })
    await page.locator('input[type="date"]').fill('1990-01-15')
    await page.locator('input[type="time"]').fill('14:30')
    await page.locator('button').filter({ hasText: /get lal kitab/i }).click()
    await expect(page.locator('#lk-result')).toBeVisible({ timeout: 35000 })

    const cta = page.locator('a[href="/chart/new"]').filter({ hasText: /full kundali/i })
    await expect(cta).toBeVisible()
  })
})
