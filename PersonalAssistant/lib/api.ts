import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

class ApiClient {
  private async getToken(): Promise<string | null> {
    return AsyncStorage.getItem('access_token');
  }

  private async setTokens(accessToken: string, refreshToken: string) {
    await AsyncStorage.setItem('access_token', accessToken);
    await AsyncStorage.setItem('refresh_token', refreshToken);
  }

  private async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
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
      });

      // Try to refresh token if unauthorized
      if (response.status === 401 && token) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          const newToken = await this.getToken();
          headers['Authorization'] = `Bearer ${newToken}`;
          response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
          });
        }
      }

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Request failed' };
      }

      return { data };
    } catch (error) {
      return { error: 'Network error' };
    }
  }

  // Auth endpoints
  async register(email: string, password: string, name: string) {
    const response = await this.request<{
      user: any;
      accessToken: string;
      refreshToken: string;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });

    if (response.data) {
      await this.setTokens(response.data.accessToken, response.data.refreshToken);
    }

    return response;
  }

  async login(email: string, password: string) {
    const response = await this.request<{
      user: any;
      accessToken: string;
      refreshToken: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.data) {
      await this.setTokens(response.data.accessToken, response.data.refreshToken);
    }

    return response;
  }

  async logout() {
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('refresh_token');
  }

  // Activity endpoints
  async syncActivities() {
    const youtubeTokens = await AsyncStorage.getItem('youtube_tokens');
    return this.request('/activities/sync', {
      method: 'POST',
      body: JSON.stringify({
        youtubeTokens: youtubeTokens ? JSON.parse(youtubeTokens) : null,
      }),
    });
  }

  async getActivities(startDate?: Date, endDate?: Date) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());
    
    return this.request(`/activities?${params.toString()}`);
  }

  async generateAISummary(date?: Date) {
    return this.request('/activities/summary', {
      method: 'POST',
      body: JSON.stringify({ date: date?.toISOString() }),
    });
  }

  async getSummaries() {
    return this.request('/activities/summaries');
  }

  // YouTube Playlist Methods
  async getYouTubeAuthUrl() {
    return this.request('/activities/youtube/auth');
  }

  async exchangeYouTubeCode(code: string) {
    return this.request('/activities/youtube/token', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async trackYouTubeVideo(videoId: string) {
    const youtubeTokens = await AsyncStorage.getItem('youtube_tokens');
    if (!youtubeTokens) {
      return { error: 'YouTube not connected' };
    }

    return this.request('/activities/youtube/track', {
      method: 'POST',
      body: JSON.stringify({
        videoId,
        tokens: JSON.parse(youtubeTokens),
      }),
    });
  }

  async syncYouTubePlaylist() {
    const youtubeTokens = await AsyncStorage.getItem('youtube_tokens');
    if (!youtubeTokens) {
      return { error: 'YouTube not connected' };
    }

    return this.request('/activities/sync', {
      method: 'POST',
      body: JSON.stringify({
        youtubeTokens: JSON.parse(youtubeTokens),
      }),
    });
  }

  // Separate methods for cleaner store usage
  async getGitHubActivities() {
    const response = await this.getActivities();
    if (response.data) {
      return response.data.filter((a: any) => a.type.includes('Event'));
    }
    return [];
  }

  async getYouTubeActivities() {
    const response = await this.getActivities();
    if (response.data) {
      return response.data.filter((a: any) => a.type === 'video_watched');
    }
    return [];
  }

  async getLocalProjects() {
    const response = await this.getActivities();
    if (response.data) {
      return response.data.filter((a: any) => a.type === 'code_project');
    }
    return [];
  }
}

export const apiClient = new ApiClient();