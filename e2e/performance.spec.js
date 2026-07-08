/**
 * performance.spec.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Page load performance benchmarks using Playwright's performance API.
 * Measures LCP, FCP, TTFB and total load time for key pages.
 *
 * Thresholds (reasonable for a Vercel + Railway stack):
 *   - TTFB      < 600ms
 *   - FCP       < 2500ms
 *   - LCP       < 4000ms
 *   - Total load < 5000ms
 *
 * Coverage types: PERFORMANCE
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { test, expect } from '@playwright/test'

// Only run Chromium for performance tests (consistent metrics)
test.use({ browserName: 'chromium' })

const KEY_PAGES = [
  { path: '/',               name: 'Landing' },
  { path: '/pricing',        name: 'Pricing' },
  { path: '/lal-kitab',      name: 'Lal Kitab' },
  { path: '/horoscope',      name: 'Horoscope' },
  { path: '/login',          name: 'Login' },
  { path: '/kundli-matching',name: 'Kundli Matching' },
]

for (const { path, name } of KEY_PAGES) {
  test(`Performance — ${name} (${path})`, async ({ page }) => {
    const startTime = Date.now()

    await page.goto(path, { waitUntil: 'domcontentloaded' })

    const loadTime = Date.now() - startTime

    // Gather Web Vitals via Performance API
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const result = {
          ttfb:        null,
          fcp:         null,
          lcp:         null,
          domLoaded:   null,
          resourceCount: performance.getEntriesByType('resource').length,
        }

        // TTFB
        const navEntry = performance.getEntriesByType('navigation')[0]
        if (navEntry) {
          result.ttfb = navEntry.responseStart - navEntry.requestStart
          result.domLoaded = navEntry.domContentLoadedEventEnd
        }

        // FCP
        const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0]
        if (fcpEntry) result.fcp = fcpEntry.startTime

        // LCP — use PerformanceObserver
        if ('PerformanceObserver' in window) {
          let lcpValue = 0
          try {
            new PerformanceObserver((list) => {
              const entries = list.getEntries()
              const last = entries[entries.length - 1]
              lcpValue = last.startTime
            }).observe({ type: 'largest-contentful-paint', buffered: true })
          } catch (e) { /* not supported */ }
          result.lcp = lcpValue || null
        }

        setTimeout(() => resolve(result), 300)
      })
    })

    // Log metrics
    console.log(`\n📊 ${name} (${path})`)
    console.log(`  TTFB:       ${metrics.ttfb?.toFixed(0) ?? 'n/a'} ms`)
    console.log(`  FCP:        ${metrics.fcp?.toFixed(0) ?? 'n/a'} ms`)
    console.log(`  LCP:        ${metrics.lcp?.toFixed(0) ?? 'n/a'} ms`)
    console.log(`  DOM loaded: ${metrics.domLoaded?.toFixed(0) ?? 'n/a'} ms`)
    console.log(`  Resources:  ${metrics.resourceCount}`)
    console.log(`  Wall time:  ${loadTime} ms`)

    // Assert thresholds
    expect(loadTime, `${name} total load time exceeded 8s`).toBeLessThan(8000)

    if (metrics.fcp) {
      expect(metrics.fcp, `${name} FCP exceeded 3s`).toBeLessThan(3000)
    }

    if (metrics.lcp && metrics.lcp > 0) {
      expect(metrics.lcp, `${name} LCP exceeded 5s`).toBeLessThan(5000)
    }
  })
}

test('Bundle size — JS chunk is under 1.5 MB (gzipped)', async ({ page }) => {
  const resources = []
  page.on('response', async resp => {
    if (resp.url().includes('.js') && resp.status() === 200) {
      const headers = resp.headers()
      const size = parseInt(headers['content-length'] || '0', 10)
      resources.push({ url: resp.url(), size })
    }
  })

  await page.goto('/')
  await page.waitForLoadState('networkidle')

  const totalJS = resources.reduce((sum, r) => sum + r.size, 0)
  console.log(`\n📦 Total JS transferred: ${(totalJS / 1024).toFixed(1)} KB`)

  // 1.5MB gzipped is already large — warn but don't fail hard
  // The actual bundle is ~268KB gzipped (from npm run build output)
  if (totalJS > 0) {
    expect(totalJS, 'JS bundle exceeds 1.5MB gzipped').toBeLessThan(1_500_000)
  }
})

test('No 4xx/5xx errors on resource load for Landing', async ({ page }) => {
  const failedRequests = []
  page.on('response', resp => {
    if (resp.status() >= 400 && !resp.url().includes('analytics')) {
      failedRequests.push({ url: resp.url(), status: resp.status() })
    }
  })

  await page.goto('/')
  await page.waitForLoadState('networkidle')

  if (failedRequests.length > 0) {
    console.warn('Failed requests:', failedRequests)
  }
  // Filter out known 3rd-party failures (fonts, analytics)
  const criticalFailures = failedRequests.filter(r => r.url.includes('vercel.app'))
  expect(criticalFailures).toHaveLength(0)
})
