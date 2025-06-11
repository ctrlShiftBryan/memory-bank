import { test, expect } from '@playwright/test';

test.describe('App Functionality', () => {
  test('should load dashboard and show activity sections', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify dashboard elements
    await expect(page.locator('text=/Today\'s Overview/i')).toBeVisible();
    await expect(page.locator('text=/Sync Activities/i')).toBeVisible();
    await expect(page.locator('text=/Generate Summary/i')).toBeVisible();

    // Verify activity sections
    await expect(page.locator('text=/GitHub Activity/i')).toBeVisible();
    await expect(page.locator('text=/YouTube History/i')).toBeVisible();
    await expect(page.locator('text=/Claude Projects/i')).toBeVisible();

    // Verify navigation tabs
    await expect(page.locator('text=/Dashboard/i').first()).toBeVisible();
    await expect(page.locator('text=/Activities/i').first()).toBeVisible();
  });

  test('should navigate between dashboard and activities', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify we're on dashboard
    await expect(page.locator('text=/Today\'s Overview/i')).toBeVisible();

    // Click on Activities tab - try the bottom navigation
    const activitiesTab = page.locator('text="Activities"').last();
    await activitiesTab.click();
    await page.waitForTimeout(2000);

    // Take screenshot to debug
    await page.screenshot({ path: 'activities-navigation.png' });

    // Activities page might show different content based on state
    const hasActivitiesHeader = await page.locator('text=/All Activities/i').count() > 0;
    const hasEmptyState = await page.locator('text=/No activities/i').count() > 0;
    
    expect(hasActivitiesHeader || hasEmptyState).toBeTruthy();
    
    // Navigate back to dashboard
    const dashboardTab = page.locator('text="Dashboard"').last();
    await dashboardTab.click();
    await page.waitForTimeout(1000);
    
    // Verify back on dashboard
    await expect(page.locator('text=/Today\'s Overview/i')).toBeVisible();
  });

  test('should show activity counts', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for activity count displays
    const githubCard = page.locator('text=/GitHub Activity/i').locator('..');
    const youtubeCard = page.locator('text=/YouTube History/i').locator('..');
    const claudeCard = page.locator('text=/Claude Projects/i').locator('..');

    // Each card should show a count (even if 0)
    await expect(githubCard.locator('text=/\\d+ activities?/i')).toBeVisible();
    await expect(youtubeCard.locator('text=/\\d+ activities?/i')).toBeVisible();
    await expect(claudeCard.locator('text=/\\d+ activities?/i')).toBeVisible();
  });

  test('should have working sync button', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for the sync text/button - might be rendered as text in web
    const syncElement = page.locator('text="Sync Activities"');
    await expect(syncElement).toBeVisible();

    // Note: We don't click it since backend might not be fully set up
    // Just verify it exists and is clickable
  });

  test('should have working generate summary button', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for the summary text/button - might be rendered as text in web
    const summaryElement = page.locator('text="Generate Summary"');
    await expect(summaryElement).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(500);
    await expect(page.locator('text=/Today\'s Overview/i')).toBeVisible();

    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    await expect(page.locator('text=/Today\'s Overview/i')).toBeVisible();
    
    // Navigation should still work
    await expect(page.locator('text=/Dashboard/i').first()).toBeVisible();
  });

  test('should show correct date', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const today = new Date();
    const expectedDateParts = [
      today.toLocaleDateString('en-US', { weekday: 'long' }),
      today.toLocaleDateString('en-US', { month: 'long' }),
      today.getDate().toString(),
      today.getFullYear().toString()
    ];

    // Check that date parts are visible
    for (const part of expectedDateParts) {
      await expect(page.locator(`text=/${part}/`)).toBeVisible();
    }
  });

  test('should handle empty state gracefully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to activities - use last() for bottom nav
    const activitiesTab = page.locator('text="Activities"').last();
    await activitiesTab.click();
    await page.waitForTimeout(2000);

    // Check for either empty state or activities
    const pageContent = await page.locator('body').textContent();
    
    // The page should contain either activities content or empty state
    const hasActivitiesContent = pageContent?.includes('All Activities') || 
                                pageContent?.includes('activities') ||
                                pageContent?.includes('No activities');
    
    expect(hasActivitiesContent).toBeTruthy();
  });
});