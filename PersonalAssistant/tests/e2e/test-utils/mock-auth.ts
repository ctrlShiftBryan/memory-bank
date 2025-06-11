import { Page } from '@playwright/test';

export async function mockAuthenticatedUser(page: Page) {
  // Mock authentication by setting localStorage/cookies
  await page.addInitScript(() => {
    // Mock auth token in localStorage
    window.localStorage.setItem('auth_token', 'mock-test-token');
    window.localStorage.setItem('refresh_token', 'mock-refresh-token');
    window.localStorage.setItem('user', JSON.stringify({
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User'
    }));
  });
}

export async function clearAuth(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });
}