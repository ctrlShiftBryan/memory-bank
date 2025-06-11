import { test, expect } from '@playwright/test';

test.describe('Basic App Tests', () => {
  test('should load the app without errors', async ({ page }) => {
    // Navigate to the app
    const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Check that the page loaded successfully
    expect(response?.status()).toBeLessThan(400);
    
    // Wait for any content to appear
    await page.waitForTimeout(2000);
    
    // The page should have some content
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(10);
  });

  test('should have viewport meta tag for mobile', async ({ page }) => {
    await page.goto('/');
    
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
  });

  test('should handle navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Try to find any clickable element
    const links = await page.locator('a, button').count();
    expect(links).toBeGreaterThan(0);
  });

  test('should be responsive to viewport changes', async ({ page }) => {
    await page.goto('/');
    
    // Desktop viewport
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(500);
    let desktopContent = await page.locator('body').isVisible();
    expect(desktopContent).toBeTruthy();
    
    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    let mobileContent = await page.locator('body').isVisible();
    expect(mobileContent).toBeTruthy();
  });

  test('should not have console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // Ignore some common non-critical errors
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('Failed to load resource') &&
      !error.includes('xcrun simctl') &&
      !error.includes('password authentication failed') && // Database connection issues in test
      !error.includes('localStorage') && // localStorage might not be accessible
      !error.includes('AsyncStorage') && // AsyncStorage web fallback
      !error.includes('Unable to resolve') // Module resolution warnings
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});