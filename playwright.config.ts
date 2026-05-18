import { defineConfig, devices } from '@playwright/test';

const FRONTEND_PORT = 3000;
const BACKEND_PORT = 8080;

const isCI = !!process.env.CI;

// Backend env passthrough. Locally these come from backend/.env (loaded by
// godotenv inside cmd/server). In CI they must be set explicitly on the
// workflow job (DATABASE_URL pointing at a fresh, migrated test DB).
const backendEnv: Record<string, string> = {
  PORT: String(BACKEND_PORT),
  CORS_ORIGINS: `http://localhost:${FRONTEND_PORT}`,
  JWT_SECRET: process.env.JWT_SECRET ?? 'e2e-test-secret-not-for-prod',
  COOKIE_SECURE: 'false',
};
if (process.env.DATABASE_URL) backendEnv.DATABASE_URL = process.env.DATABASE_URL;

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './tests/e2e/.results',
  fullyParallel: false, // sequential — shared DB state
  workers: 1,
  retries: isCI ? 2 : 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'list',

  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'kiosk-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    // Future: kiosk-portrait (1080x1920), mobile (iPhone 13), etc.
  ],

  // Two-server orchestration: backend first (frontend will fail health
  // checks if API isn't up). Playwright starts both in parallel but waits
  // until each port responds before running tests.
  webServer: [
    {
      command: 'go run ./cmd/server',
      cwd: '../backend',
      port: BACKEND_PORT,
      reuseExistingServer: !isCI,
      timeout: 120_000,
      env: backendEnv,
    },
    {
      command: 'npm run dev',
      port: FRONTEND_PORT,
      reuseExistingServer: !isCI,
      timeout: 120_000,
      env: {
        NEXT_PUBLIC_API_URL: `http://localhost:${BACKEND_PORT}/api/v1`,
      },
    },
  ],
});
