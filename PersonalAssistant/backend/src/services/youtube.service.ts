import { google, youtube_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { db } from "../config/database";
import { activities } from "../db/schema";
import { config } from "../config/env";

export class YouTubePlaylistService {
  private youtube: youtube_v3.Youtube;
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      config.YOUTUBE_CLIENT_ID,
      config.YOUTUBE_CLIENT_SECRET,
      config.YOUTUBE_REDIRECT_URI
    );

    this.youtube = google.youtube({
      version: 'v3',
      auth: this.oauth2Client
    });
  }

  // Get OAuth URL for user to authorize
  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtube'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      include_granted_scopes: true
    });
  }

  // Exchange auth code for tokens
  async getTokens(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    return tokens;
  }

  // Set user's tokens
  setCredentials(tokens: any) {
    this.oauth2Client.setCredentials(tokens);
  }

  // Create a "Watch History" playlist if it doesn't exist
  async ensureWatchHistoryPlaylist(userId: string): Promise<string> {
    try {
      // First, check if playlist already exists
      const playlistsResponse = await this.youtube.playlists.list({
        part: ['snippet'],
        mine: true,
        maxResults: 50
      });

      const existingPlaylist = playlistsResponse.data.items?.find(
        playlist => playlist.snippet?.title === 'Personal Assistant Watch History'
      );

      if (existingPlaylist?.id) {
        return existingPlaylist.id;
      }

      // Create new playlist
      const createResponse = await this.youtube.playlists.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title: 'Personal Assistant Watch History',
            description: 'Videos tracked by Personal Assistant app for activity summaries',
            tags: ['personal-assistant', 'watch-history']
          },
          status: {
            privacyStatus: 'private' // Keep it private
          }
        }
      });

      return createResponse.data.id!;
    } catch (error) {
      console.error('Error ensuring playlist:', error);
      throw error;
    }
  }

  // Get all videos from the watch history playlist
  async getWatchHistoryFromPlaylist(userId: string, playlistId: string) {
    try {
      const videos = [];
      let nextPageToken: string | undefined;

      do {
        const response = await this.youtube.playlistItems.list({
          part: ['snippet', 'contentDetails'],
          playlistId: playlistId,
          maxResults: 50,
          pageToken: nextPageToken
        });

        if (response.data.items) {
          videos.push(...response.data.items);
        }

        nextPageToken = response.data.nextPageToken || undefined;
      } while (nextPageToken);

      // Transform to our activity format
      const activities = videos.map(item => ({
        userId,
        sourceId: 'youtube-playlist',
        type: 'video_watched',
        title: item.snippet?.title || 'Unknown Video',
        description: `Watched video from ${item.snippet?.channelTitle || 'Unknown Channel'}`,
        metadata: {
          videoId: item.contentDetails?.videoId,
          channelName: item.snippet?.channelTitle,
          channelId: item.snippet?.channelId,
          thumbnails: item.snippet?.thumbnails,
          publishedAt: item.snippet?.publishedAt,
          addedToPlaylistAt: item.snippet?.publishedAt
        },
        timestamp: new Date(item.snippet?.publishedAt || Date.now())
      }));

      return activities;
    } catch (error) {
      console.error('Error fetching playlist videos:', error);
      throw error;
    }
  }

  // Add a video to the watch history playlist
  async addVideoToWatchHistory(videoId: string, playlistId: string) {
    try {
      const response = await this.youtube.playlistItems.insert({
        part: ['snippet'],
        requestBody: {
          snippet: {
            playlistId: playlistId,
            resourceId: {
              kind: 'youtube#video',
              videoId: videoId
            }
          }
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error adding video to playlist:', error);
      throw error;
    }
  }

  // Sync playlist to database
  async syncPlaylistToDatabase(userId: string) {
    try {
      // Ensure playlist exists
      const playlistId = await this.ensureWatchHistoryPlaylist(userId);
      
      // Get all videos from playlist
      const playlistActivities = await this.getWatchHistoryFromPlaylist(userId, playlistId);
      
      // Batch insert (with upsert to avoid duplicates)
      if (playlistActivities.length > 0) {
        await db.insert(activities)
          .values(playlistActivities)
          .onConflictDoNothing(); // Assumes you have a unique constraint
      }

      return {
        playlistId,
        count: playlistActivities.length,
        activities: playlistActivities
      };
    } catch (error) {
      console.error('Sync error:', error);
      throw error;
    }
  }

  // Get user's channel info
  async getUserChannel() {
    try {
      const response = await this.youtube.channels.list({
        part: ['snippet', 'statistics'],
        mine: true
      });

      return response.data.items?.[0];
    } catch (error) {
      console.error('Error fetching user channel:', error);
      throw error;
    }
  }
}