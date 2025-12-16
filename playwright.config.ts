import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'test/e2e',
  timeout: 3 * 60 * 1000,
  expect: {timeout: 30 * 1000},
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.PW_BASE_URL || 'http://localhost:3000',
    // page.gotoのための待ち時間
    navigationTimeout: 2 * 60 * 1000,
    actionTimeout: 30 * 1000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // 必要なら増やす
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
})