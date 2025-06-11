import { FullConfig, chromium } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('Starting global test setup...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3003/api';
  process.env.TEST_DATABASE_URL = 'postgresql://testuser:testpassword@localhost:5437/personal_assistant_test';
  process.env.PORT = '3003';
  
  // Ensure the backend is ready
  console.log('Checking backend availability...');
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  let backendReady = false;
  for (let i = 0; i < 30; i++) {
    try {
      const response = await page.request.post('http://localhost:3003/api/auth/register', {
        data: {
          email: `test${Date.now()}@example.com`,
          password: 'testpass123',
          name: 'Test User'
        }
      });
      if (response.ok() || response.status() === 400) { // 400 means email exists, backend is working
        backendReady = true;
        console.log('Backend is ready!');
        break;
      }
    } catch (error) {
      // Backend not ready yet
    }
    console.log(`Waiting for backend... (${i + 1}/30)`);
    await page.waitForTimeout(2000);
  }
  
  await browser.close();
  
  if (!backendReady) {
    throw new Error('Backend failed to start in time');
  }
  
  console.log('Global test setup complete');
}

export default globalSetup;