import { test, expect } from '@playwright/test';

test('debug single test', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => {
    console.log(`Browser console ${msg.type()}: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.log(`Page error: ${error.message}`);
  });

  // Navigate to the app
  const response = await page.goto('http://localhost:8081', { 
    waitUntil: 'networkidle',
    timeout: 60000 
  });
  
  console.log('Response status:', response?.status());
  console.log('Response URL:', response?.url());
  
  // Wait for React to render
  await page.waitForTimeout(5000);
  
  // Take screenshot
  await page.screenshot({ path: 'single-test-screenshot.png', fullPage: true });
  
  // Get page content
  const html = await page.content();
  console.log('HTML length:', html.length);
  
  // Check for specific elements
  const title = await page.title();
  console.log('Page title:', title);
  
  // Look for any text content
  const bodyText = await page.locator('body').textContent();
  console.log('Body text (first 500 chars):', bodyText?.substring(0, 500));
  
  // Check for error messages
  const errorMessages = await page.locator('[role="alert"], .error, .alert').allTextContents();
  if (errorMessages.length > 0) {
    console.log('Error messages found:', errorMessages);
  }
  
  // Check what's actually rendered
  const mainContent = await page.locator('main, #root, #app, [data-testid="app-root"]').first().textContent();
  console.log('Main content:', mainContent?.substring(0, 200));
  
  expect(response?.status()).toBeLessThan(400);
});