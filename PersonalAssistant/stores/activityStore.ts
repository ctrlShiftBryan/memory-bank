import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiClient } from "../lib/api";

interface GitHubActivity {
  id: string;
  type: string;
  title: string;
  description?: string;
  timestamp: string;
  metadata: any;
}

interface YouTubeActivity {
  id: string;
  type: string;
  title: string;
  description?: string;
  timestamp: string;
  metadata: {
    videoId?: string;
    channelName?: string;
    url?: string;
  };
}

interface LocalProject {
  id: string;
  type: string;
  title: string;
  description?: string;
  timestamp: string;
  metadata: {
    path: string;
    lastModified: string;
    files: string[];
    languages: string[];
  };
}

interface AISummary {
  text: string;
  insights: {
    executiveSummary: string;
    timeAllocation: Array<{ category: string; percentage: number }>;
    productivityInsights: string[];
    keyAchievements: string[];
    areasOfConcern: string[];
  };
  priorities: string[];
}

interface ActivityStore {
  activities: {
    github: GitHubActivity[];
    youtube: YouTubeActivity[];
    local: LocalProject[];
  };
  summary: AISummary | null;
  loading: boolean;
  error: string | null;
  lastSync: Date | null;
  youtubeConnected: boolean;
  
  fetchActivities: () => Promise<void>;
  generateSummary: (date?: Date) => Promise<void>;
  syncActivities: () => Promise<void>;
  connectYouTube: (code: string) => Promise<void>;
  trackYouTubeVideo: (videoId: string) => Promise<void>;
  clearError: () => void;
}

export const useActivityStore = create<ActivityStore>()(
  persist(
    (set, get) => ({
      activities: { github: [], youtube: [], local: [] },
      summary: null,
      loading: false,
      error: null,
      lastSync: null,
      youtubeConnected: false,

      fetchActivities: async () => {
        set({ loading: true, error: null });
        try {
          const [github, youtube, local] = await Promise.all([
            apiClient.getGitHubActivities(),
            apiClient.getYouTubeActivities(),
            apiClient.getLocalProjects(),
          ]);

          set({
            activities: { github, youtube, local },
            loading: false,
            lastSync: new Date(),
          });
        } catch (error) {
          console.error("Failed to fetch activities:", error);
          set({ loading: false, error: "Failed to fetch activities" });
        }
      },

      generateSummary: async (date?: Date) => {
        set({ loading: true, error: null });
        try {
          const response = await apiClient.generateAISummary(date);
          if (response.error) {
            throw new Error(response.error);
          }
          set({ summary: response.data, loading: false });
        } catch (error) {
          console.error("Failed to generate summary:", error);
          set({ loading: false, error: "Failed to generate summary" });
        }
      },

      syncActivities: async () => {
        set({ loading: true, error: null });
        try {
          const response = await apiClient.syncActivities();
          if (response.error) {
            throw new Error(response.error);
          }
          
          // Fetch updated activities after sync
          await get().fetchActivities();
        } catch (error) {
          console.error("Failed to sync activities:", error);
          set({ loading: false, error: "Failed to sync activities" });
        }
      },

      connectYouTube: async (code: string) => {
        set({ loading: true, error: null });
        try {
          const response = await apiClient.exchangeYouTubeCode(code);
          if (response.error) {
            throw new Error(response.error);
          }
          
          // Store YouTube tokens
          await AsyncStorage.setItem('youtube_tokens', JSON.stringify(response.data.tokens));
          set({ youtubeConnected: true, loading: false });
          
          // Sync YouTube playlist after connection
          await get().syncActivities();
        } catch (error) {
          console.error("Failed to connect YouTube:", error);
          set({ loading: false, error: "Failed to connect YouTube" });
        }
      },

      trackYouTubeVideo: async (videoId: string) => {
        set({ loading: true, error: null });
        try {
          const response = await apiClient.trackYouTubeVideo(videoId);
          if (response.error) {
            throw new Error(response.error);
          }
          set({ loading: false });
        } catch (error) {
          console.error("Failed to track YouTube video:", error);
          set({ loading: false, error: "Failed to track video" });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "activity-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        activities: state.activities,
        summary: state.summary,
        lastSync: state.lastSync,
      }),
    }
  )
);