import { defineConfig, devices } from '@playwright/test';

const CI = Boolean(process.env.CI);

// Dev server (port 5173) carries the test hooks. The preview of the production
// build (port 4173) carries the production CSP and is used only for the CSP test.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  retries: CI ? 1 : 0,
  timeout: 180_000,
  expect: { timeout: 30_000 },
  reporter: [['list'], ['json', { outputFile: 'test-results/e2e-results.json' }]],
  use: {
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: /(csp|workers)\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:5173' },
    },
    {
      name: 'webkit',
      testIgnore: /(csp|workers)\.spec\.ts/,
      use: { ...devices['Desktop Safari'], baseURL: 'http://127.0.0.1:5173' },
    },
    {
      name: 'preview-chromium',
      testMatch: /(csp|workers)\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:4173' },
    },
    {
      name: 'preview-webkit',
      testMatch: /(csp|workers)\.spec\.ts/,
      use: { ...devices['Desktop Safari'], baseURL: 'http://127.0.0.1:4173' },
    },
  ],
  webServer: [
    {
      command: 'npm run dev -- --host 127.0.0.1',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: !CI,
      timeout: 120_000,
    },
    {
      command: 'npm run preview -- --host 127.0.0.1',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: !CI,
      timeout: 120_000,
    },
  ],
});
