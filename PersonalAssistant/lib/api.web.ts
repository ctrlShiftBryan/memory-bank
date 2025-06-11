// Web-specific implementation that handles both localStorage and cookies
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

// Helper to get cookie value
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

class ApiClient {
  private async getToken(): Promise<string | null> {
    // Try localStorage first
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = window.localStorage.getItem('access_token');
      if (token) return token;
    }
    
    // Fallback to cookies
    return getCookie('access_token');
  }

  private async setTokens(accessToken: string, refreshToken: string) {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem('access_token', accessToken);
        window.localStorage.setItem('refresh_token', refreshToken);
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
        // Fallback to cookies
        document.cookie = `access_token=${accessToken}; path=/; max-age=3600`;
        document.cookie = `refresh_token=${refreshToken}; path=/; max-age=604800`;
      }
    }
  }

  private async refreshToken(): Promise<boolean> {
    try {
      let refreshToken = null;
      
      // Try localStorage first
      if (typeof window !== 'undefined' && window.localStorage) {
        refreshToken = window.localStorage.getItem('refresh_token');
      }
      
      // Fallback to cookies
      if (!refreshToken) {
        refreshToken = getCookie('refresh_token');
      }
      
      if (!refreshToken) return false;

      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      await this.setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = await this.getToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      let response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include', // Include cookies
      });

      // If unauthorized, try to refresh token
      if (response.status === 401) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          const newToken = await this.getToken();
          if (newToken) {
            headers['Authorization'] = `Bearer ${newToken}`;
          }
          response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
            credentials: 'include',
          });
        }
      }

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Request failed' };
      }

      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  // Auth methods
  async register(email: string, password: string, name: string) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });

    if (response.data) {
      await this.setTokens(response.data.accessToken, response.data.refreshToken);
    }

    return response;
  }

  async login(email: string, password: string) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.data) {
      await this.setTokens(response.data.accessToken, response.data.refreshToken);
    }

    return response;
  }

  async logout() {
    if (typeof window !== 'undefined') {
      if (window.localStorage) {
        window.localStorage.removeItem('access_token');
        window.localStorage.removeItem('refresh_token');
      }
      // Clear cookies
      document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
    
    await this.request('/auth/logout', { method: 'POST' });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Activity sources
  async getActivitySources() {
    return this.request('/activities/sources');
  }

  async connectGitHub(code: string) {
    return this.request('/activities/github/connect', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async disconnectSource(sourceId: string) {
    return this.request(`/activities/sources/${sourceId}`, {
      method: 'DELETE',
    });
  }

  // Activities
  async getActivities(filters?: {
    sourceType?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.sourceType) params.append('sourceType', filters.sourceType);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const queryString = params.toString();
    return this.request(`/activities${queryString ? `?${queryString}` : ''}`);
  }

  async syncActivities(sourceType?: string) {
    return this.request('/activities/sync', {
      method: 'POST',
      body: JSON.stringify({ sourceType }),
    });
  }

  // AI Summaries
  async generateSummary(date?: string) {
    return this.request('/activities/summary/generate', {
      method: 'POST',
      body: JSON.stringify({ date }),
    });
  }

  async getSummaries(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const queryString = params.toString();
    return this.request(`/activities/summaries${queryString ? `?${queryString}` : ''}`);
  }

  // YouTube specific
  async getYouTubeAuthUrl() {
    return this.request('/activities/youtube/auth-url');
  }

  async connectYouTube(code: string) {
    return this.request('/activities/youtube/callback', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }
}

export const api = new ApiClient();