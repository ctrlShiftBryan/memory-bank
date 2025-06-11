import { test as base } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';

type MyFixtures = {
  testHelpers: TestHelpers;
  authenticatedUser: {
    email: string;
    password: string;
    name: string;
    id: string;
    accessToken: string;
    refreshToken: string;
  };
};

export const test = base.extend<MyFixtures>({
  testHelpers: async ({ page, context }, use) => {
    // Navigate to the app first to establish proper context
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    const helpers = new TestHelpers(page);
    await use(helpers);
  },

  authenticatedUser: async ({ page, context, testHelpers }, use) => {
    // Navigate to the app first
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Create a test user
    const user = await testHelpers.createTestUser();
    
    // Set up authenticated session
    await testHelpers.setupAuthenticatedSession(user);
    
    // Navigate to refresh the page with auth
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Use the fixture
    await use(user);
    
    // Cleanup - logout
    await testHelpers.logout();
  },
});

// Create a separate test instance that doesn't require authentication
export const testWithoutAuth = base.extend<{ testHelpers: TestHelpers }>({
  testHelpers: async ({ page }, use) => {
    const helpers = new TestHelpers(page);
    await use(helpers);
  },
});

export { expect } from '@playwright/test';