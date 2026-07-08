import { defineConfig, devices } from '@playwright/test'

/**
 * TheBhagya — Playwright configuration
 * Targets: https://the-bhagya.vercel.app (prod) by default.
 * Override with: BASE_URL=http://localhost:5173 npx playwright test
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 40_000,          // per-test timeout (API cold-start headroom)
  expect: { timeout: 12_000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,

  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'https://the-bhagya.vercel.app',
    trace:      'on-first-retry',
    screenshot: 'only-on-failure',
    video:      'on-first-retry',
    // Mimic real user — don't cache between tests
    storageState: undefined,
  },

  projects: [
    // ── Desktop ──────────────────────────────────────────────────────────
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    // ── Mobile ───────────────────────────────────────────────────────────
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
        viewport: { width: 390, height: 844 },
      },
    },
  ],

  /* Un-comment to spin up dev server before tests:
  webServer: {
    command: 'cd frontend && npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
  */
})
