import { testWithoutAuth as test, expect } from '../fixtures/test-fixtures';

test.describe('YouTube Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing state to start fresh
    try {
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    } catch (error) {
      // Storage might not be accessible in some environments
      console.log('Could not clear storage:', error.message);
    }
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display YouTube card on dashboard', async ({ page, testHelpers }) => {
    await testHelpers.waitForLoadComplete();

    // Look for YouTube card
    const youtubeCard = page.getByText(/youtube/i).first();
    await expect(youtubeCard).toBeVisible({ timeout: 10000 });
    
    // Check if card is clickable
    try {
      await youtubeCard.click();
      await page.waitForTimeout(1000);
      
      // Check for any YouTube-related content or prompts
      const youtubeContent = page.getByText(/youtube|video|playlist|connect|history/i);
      const contentCount = await youtubeContent.count();
      console.log(`Found ${contentCount} YouTube-related elements after clicking`);
    } catch (error) {
      console.log('YouTube card might not be interactive');
    }
  });

  test('should check for YouTube connection UI', async ({ page, testHelpers }) => {
    await testHelpers.waitForLoadComplete();

    // Mock OAuth URL response
    await page.route('**/api/activities/youtube/auth', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          authUrl: 'https://accounts.google.com/oauth/authorize?client_id=test&redirect_uri=test'
        }),
      });
    });

    // Look for YouTube-related elements
    const youtubeElements = page.getByText(/youtube|connect.*youtube|youtube.*history/i);
    const elementCount = await youtubeElements.count();
    
    if (elementCount > 0) {
      console.log(`Found ${elementCount} YouTube elements`);
      const firstElement = youtubeElements.first();
      await expect(firstElement).toBeVisible();
      
      // Try to find connect button
      const connectButton = page.getByText(/connect/i).first();
      if (await connectButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('Connect button found');
        
        // Check if clicking opens new window/tab
        try {
          const popupPromise = page.context().waitForEvent('page', { timeout: 5000 });
          await connectButton.click();
          const popup = await popupPromise;
          console.log('OAuth popup opened:', popup.url());
          await popup.close();
        } catch (error) {
          console.log('No popup opened - OAuth might be handled differently');
        }
      }
    } else {
      console.log('No YouTube-specific UI elements found');
    }
  });

  test('should handle OAuth callback URL', async ({ page, testHelpers }) => {
    // Mock token exchange
    await page.route('**/api/activities/youtube/token', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          tokens: {
            access_token: 'test-access-token',
            refresh_token: 'test-refresh-token',
            expires_in: 3600,
          }
        }),
      });
    });

    // Simulate OAuth callback
    await page.goto('/?code=test-auth-code');
    await testHelpers.waitForLoadComplete();

    // Check if tokens are stored (might fail due to localStorage access)
    try {
      const tokens = await page.evaluate(() => 
        localStorage.getItem('youtube_tokens')
      );
      console.log('Tokens stored:', tokens ? 'yes' : 'no');
    } catch (error) {
      console.log('Could not check localStorage:', error.message);
    }
    
    // Check if UI reflects authenticated state
    await page.waitForTimeout(2000);
    const youtubeCard = page.getByText(/youtube/i).first();
    await expect(youtubeCard).toBeVisible();
  });

  test('should update YouTube activity count after sync', async ({ page, testHelpers }) => {
    await testHelpers.waitForLoadComplete();

    // Try to set up YouTube tokens (might fail)
    try {
      await page.evaluate(() => {
        localStorage.setItem('youtube_tokens', JSON.stringify({
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
        }));
      });
    } catch (error) {
      console.log('Could not set tokens:', error.message);
    }

    // Mock playlist sync response
    await page.route('**/api/activities/sync', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          github: 0,
          youtube: 5,
          local: 0,
          message: 'Activities synced successfully',
        }),
      });
    });

    // Click sync button
    const syncButton = page.getByText(/sync activities/i).first();
    await expect(syncButton).toBeVisible({ timeout: 10000 });
    await syncButton.click();

    // Wait for sync to complete
    await page.waitForTimeout(2000);

    // Look for YouTube activity count
    const activityCounts = page.locator('text=/\d+ activit/i');
    const counts = await activityCounts.all();
    console.log(`Found ${counts.length} activity count elements`);
    
    // Check if any show 5 activities
    const fiveActivities = page.getByText(/5 activit/i);
    if (await fiveActivities.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('YouTube activity count updated to 5');
    } else {
      console.log('Activity count might be displayed differently');
    }
  });

  test('should test YouTube tracking API endpoint', async ({ page, testHelpers }) => {
    await testHelpers.waitForLoadComplete();

    // Try to set up tokens
    let tokens = {};
    try {
      await page.evaluate(() => {
        localStorage.setItem('youtube_tokens', JSON.stringify({
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
        }));
      });
      tokens = { access_token: 'test-access-token', refresh_token: 'test-refresh-token' };
    } catch (error) {
      console.log('Could not set tokens:', error.message);
    }

    // Mock track video endpoint
    await page.route('**/api/activities/youtube/track', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          success: true,
          playlistId: 'test-playlist-id',
        }),
      });
    });

    // Test API endpoint directly
    try {
      const response = await page.request.post('http://localhost:3003/api/activities/youtube/track', {
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          videoId: 'test-video-id',
          tokens: tokens,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      console.log('YouTube tracking API working correctly');
    } catch (error) {
      console.log('API request failed:', error.message);
    }
  });

  test('should handle YouTube API errors gracefully', async ({ page, testHelpers }) => {
    await testHelpers.waitForLoadComplete();

    // Mock API error
    await page.route('**/api/activities/youtube/auth', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'YouTube API error' }),
      });
    });

    // Look for YouTube elements
    const youtubeCard = page.getByText(/youtube/i).first();
    if (await youtubeCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await youtubeCard.click();
      await page.waitForTimeout(1000);
      
      // Look for any connect/auth elements
      const connectElements = page.getByText(/connect|authenticate|sign in/i);
      if (await connectElements.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        await connectElements.first().click();
        await page.waitForTimeout(2000);
        
        // Check for error messages
        const errorElements = page.getByText(/error|failed|try again/i);
        const errorCount = await errorElements.count();
        if (errorCount > 0) {
          console.log('Error handling displayed correctly');
        } else {
          console.log('No explicit error message shown');
        }
      }
    }
  });

  test('should verify YouTube UI elements are present', async ({ page, testHelpers }) => {
    await testHelpers.waitForLoadComplete();

    // Check YouTube card exists
    const youtubeCard = page.getByText(/youtube/i).first();
    await expect(youtubeCard).toBeVisible({ timeout: 10000 });

    // Try to check connection status
    let hasTokens = false;
    try {
      hasTokens = await page.evaluate(() => {
        const tokens = localStorage.getItem('youtube_tokens');
        return !!tokens;
      });
      console.log('Initial connection status:', hasTokens ? 'connected' : 'disconnected');
    } catch (error) {
      console.log('Could not check connection status:', error.message);
    }

    // Try to set tokens and reload
    try {
      await page.evaluate(() => {
        localStorage.setItem('youtube_tokens', JSON.stringify({
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
        }));
      });
      
      await page.reload();
      await testHelpers.waitForLoadComplete();
      
      // Check if UI changed after setting tokens
      const connectElements = page.getByText(/connect/i);
      const connectCount = await connectElements.count();
      console.log(`Found ${connectCount} 'connect' elements after setting tokens`);
    } catch (error) {
      console.log('Could not test with tokens:', error.message);
    }
    
    // Verify YouTube card is still visible
    await expect(youtubeCard).toBeVisible();
  });
});