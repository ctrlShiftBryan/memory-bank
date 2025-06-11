import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60 * 1000, // Increased for Firefox
  expect: {
    timeout: 10000 // Increased for Firefox
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  globalSetup: require.resolve('./tests/e2e/global-setup'),
  globalTeardown: require.resolve('./tests/e2e/global-teardown'),
  use: {
    baseURL: 'http://localhost:8081',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Set permissions (clipboard not needed for auth tests)
    permissions: [],
    // Set up context options
    contextOptions: {
      // Allow insecure localhost connections
      ignoreHTTPSErrors: true,
      // Set proper browser context
      bypassCSP: true,
    },
    // Ensure we're running in a proper browser context
    launchOptions: {
      args: [
        '--disable-web-security',
        '--disable-features=IsolateOrigins',
        '--disable-site-isolation-trials'
      ],
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: process.env.USE_DOCKER_COMPOSE ? undefined : [
    {
      command: 'cd backend && npm run dev',
      port: 3003,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
      env: {
        ...process.env,
        NODE_ENV: 'test',
        PORT: '3003',
        DATABASE_URL: 'postgresql://testuser:testpassword@localhost:5437/personal_assistant_test',
      },
    },
    {
      command: 'npm run web -- --port 8081',
      port: 8081,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
      env: {
        ...process.env,
        EXPO_PUBLIC_API_URL: 'http://localhost:3003/api',
      },
    }
  ],
});