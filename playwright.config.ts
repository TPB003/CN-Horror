import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: 'list',
  timeout: 90_000,
  expect: { timeout: 12_000 },
  workers: process.env.CI ? 2 : 1,
  use: {
    baseURL: 'http://127.0.0.1:5185',
    browserName: 'chromium',
    headless: true,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5185',
    url: 'http://127.0.0.1:5185',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
