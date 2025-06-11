import { test, expect } from '@playwright/test';

test('check authentication flow', async ({ page }) => {
  // Clear any existing auth state
  await page.context().clearCookies();
  try {
    await page.evaluate(() => localStorage.clear());
  } catch (error) {
    console.log('Could not clear localStorage:', error.message);
  }
  
  // Navigate to app
  await page.goto('http://localhost:8081');
  await page.waitForLoadState('networkidle');
  
  // Take screenshot of initial state
  await page.screenshot({ path: 'auth-check-initial.png', fullPage: true });
  
  // Check what's visible
  const loginFormVisible = await page.locator('input[placeholder="Email"]').isVisible().catch(() => false);
  const dashboardVisible = await page.locator('text=/Today\'s Overview/i').isVisible().catch(() => false);
  
  console.log('Login form visible:', loginFormVisible);
  console.log('Dashboard visible:', dashboardVisible);
  
  // Get page content
  const bodyText = await page.locator('body').textContent();
  console.log('Page content preview:', bodyText?.substring(0, 300));
  
  // The app should show either login or dashboard
  expect(loginFormVisible || dashboardVisible).toBeTruthy();
});