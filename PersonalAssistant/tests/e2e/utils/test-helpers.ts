import { Page, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

export class TestHelpers {
  constructor(private page: Page) {}

  async waitForLoadComplete() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000); // Extra wait for React Native Web
  }

  async login(email: string, password: string) {
    // For web version, use API login since UI might not show login form
    const response = await this.page.request.post('http://localhost:3003/api/auth/login', {
      data: {
        email,
        password,
      },
    });

    if (!response.ok()) {
      throw new Error(`Login failed: ${response.status()}`);
    }

    const data = await response.json();
    
    // Set tokens in browser storage using a safer approach
    try {
      await this.page.addInitScript((tokens) => {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('access_token', tokens.accessToken);
          window.localStorage.setItem('refresh_token', tokens.refreshToken);
        }
      }, { accessToken: data.accessToken, refreshToken: data.refreshToken });
      
      // Reload to apply the tokens
      await this.page.reload();
      await this.waitForLoadComplete();
    } catch (error) {
      console.log('Could not set tokens in localStorage:', error.message);
      // Try alternative approach using cookies
      await this.page.context().addCookies([
        {
          name: 'access_token',
          value: data.accessToken,
          domain: 'localhost',
          path: '/',
        },
        {
          name: 'refresh_token',
          value: data.refreshToken,
          domain: 'localhost',
          path: '/',
        }
      ]);
    }

    // Navigate to dashboard
    await this.page.goto('/');
    await this.waitForLoadComplete();
  }

  async logout() {
    // Try UI logout first
    try {
      const profileButton = this.page.getByRole('button', { name: /profile|menu|account/i });
      if (await profileButton.isVisible({ timeout: 2000 })) {
        await profileButton.click();
        await this.page.waitForTimeout(500);
        const logoutButton = this.page.getByRole('button', { name: /logout|sign out/i });
        if (await logoutButton.isVisible({ timeout: 2000 })) {
          await logoutButton.click();
          return;
        }
      }
    } catch (error) {
      // If UI logout fails, continue with manual cleanup
    }

    // Fallback: Clear tokens manually
    try {
      await this.page.addInitScript(() => {
        if (typeof window !== 'undefined') {
          if (window.localStorage) {
            window.localStorage.removeItem('access_token');
            window.localStorage.removeItem('refresh_token');
          }
          if (window.sessionStorage) {
            window.sessionStorage.clear();
          }
        }
      });
      await this.page.reload();
    } catch (error) {
      console.log('Could not clear tokens from storage:', error.message);
      // Clear cookies as fallback
      await this.page.context().clearCookies();
    }
  }

  async createTestUser() {
    const user = {
      email: faker.internet.email(),
      password: 'TestPassword123!',
      name: faker.person.fullName(),
    };

    // Direct API call to create user
    const response = await this.page.request.post('http://localhost:3003/api/auth/register', {
      data: user,
    });

    const data = await response.json();
    return {
      ...user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      id: data.user.id,
    };
  }

  async setupAuthenticatedSession(user: { email: string; password: string }) {
    // Login via API to get tokens
    const response = await this.page.request.post('http://localhost:3003/api/auth/login', {
      data: {
        email: user.email,
        password: user.password,
      },
    });

    const data = await response.json();
    
    // Set tokens in browser storage using a safer approach
    try {
      await this.page.addInitScript((tokens) => {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('access_token', tokens.accessToken);
          window.localStorage.setItem('refresh_token', tokens.refreshToken);
        }
      }, { accessToken: data.accessToken, refreshToken: data.refreshToken });
      
      // Reload to apply the tokens
      await this.page.reload();
      await this.waitForLoadComplete();
    } catch (error) {
      console.log('Could not set tokens in localStorage:', error.message);
      // Try alternative approach using cookies
      await this.page.context().addCookies([
        {
          name: 'access_token',
          value: data.accessToken,
          domain: 'localhost',
          path: '/',
        },
        {
          name: 'refresh_token',
          value: data.refreshToken,
          domain: 'localhost',
          path: '/',
        }
      ]);
    }
  }

  async mockGitHubActivities(userId: string, token: string) {
    const activities = Array.from({ length: 5 }, () => ({
      type: faker.helpers.arrayElement(['PushEvent', 'PullRequestEvent', 'IssuesEvent']),
      repo: { name: faker.company.name() + '/' + faker.word.noun() },
      created_at: faker.date.recent().toISOString(),
      payload: {
        commits: [{ message: faker.git.commitMessage() }],
      },
    }));

    return activities;
  }

  async mockYouTubePlaylist() {
    const videos = Array.from({ length: 10 }, () => ({
      id: faker.string.alphanumeric(11),
      snippet: {
        title: faker.lorem.sentence(),
        channelTitle: faker.company.name(),
        publishedAt: faker.date.recent().toISOString(),
      },
    }));

    return videos;
  }

  async waitForToast(message: string) {
    // Toast might appear in different containers
    const toast = this.page.locator(`text="${message}"`).or(this.page.getByText(message));
    await expect(toast).toBeVisible({ timeout: 10000 });
  }

  async checkAccessibility() {
    const violations = await this.page.evaluate(async () => {
      // Simple accessibility check
      const images = Array.from(document.querySelectorAll('img'));
      const missingAlt = images.filter(img => !img.alt);
      
      const buttons = Array.from(document.querySelectorAll('button'));
      const missingLabels = buttons.filter(btn => 
        !btn.textContent?.trim() && !btn.getAttribute('aria-label')
      );

      return {
        missingAlt: missingAlt.length,
        missingLabels: missingLabels.length,
      };
    });

    expect(violations.missingAlt).toBe(0);
    expect(violations.missingLabels).toBe(0);
  }
}