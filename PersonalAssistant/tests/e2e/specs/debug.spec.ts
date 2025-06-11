import { test, expect } from '@playwright/test';

test.describe('Debug Tests', () => {
  test('should check what is being served', async ({ page }) => {
    const response = await page.goto('http://localhost:8081/', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    console.log('Response status:', response?.status());
    console.log('Response URL:', response?.url());
    
    // Wait a bit for React to render
    await page.waitForTimeout(5000);
    
    // Get page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Get all text content
    const bodyText = await page.locator('body').textContent();
    console.log('Body text preview:', bodyText?.substring(0, 500));
    
    // Check for specific elements
    const hasLoginForm = await page.locator('input[placeholder="Email"]').count() > 0;
    const hasDashboard = await page.locator('text=/Dashboard|Today\'s Overview/i').count() > 0;
    const hasExpoDemo = await page.locator('text=/Expo RSC/i').count() > 0;
    
    console.log('Has login form:', hasLoginForm);
    console.log('Has dashboard:', hasDashboard);
    console.log('Has Expo demo:', hasExpoDemo);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-screenshot.png' });
    
    // The page should load successfully
    expect(response?.status()).toBeLessThan(400);
  });
});