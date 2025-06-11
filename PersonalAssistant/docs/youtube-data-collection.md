# YouTube Data Collection Methods

## YouTube Playlist API Approach

The YouTube Data API v3 provides full access to user playlists, allowing us to create a dedicated playlist for tracking videos. Users can add videos they watch to this playlist, and our app can retrieve all videos from it using the official API.

### How It Works

1. **OAuth2 Authentication**
   - User authorizes our app to access their YouTube account
   - App requests playlist read/write permissions
   - Tokens are securely stored for future API calls

2. **Dedicated Tracking Playlist**
   - App creates a private playlist called "Personal Assistant Activity Tracker"
   - Users add videos to this playlist as they watch them
   - App syncs playlist contents periodically

3. **API Access**
   - Full access to playlist contents via YouTube Data API v3
   - Can retrieve video metadata (title, channel, duration, etc.)
   - Real-time sync capabilities
   - No ToS violations

### Implementation Details

```javascript
// Example API calls
// List playlists
GET https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true

// Get playlist items
GET https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=PLAYLIST_ID

// Add video to playlist
POST https://www.googleapis.com/youtube/v3/playlistItems
```

### Benefits of Playlist Approach

1. **Official API Support** - Uses Google's supported methods
2. **Real-time Access** - Sync playlist contents anytime
3. **Rich Metadata** - Full video and channel information
4. **User Control** - Users explicitly choose what to track
5. **Privacy Friendly** - Only tracks what users add to playlist

## Browser Extension for Easy Playlist Addition

A browser extension can make adding videos to the tracking playlist seamless:

### Implementation Overview

1. **Manifest Configuration** (manifest.json)
   - Permissions for YouTube domains
   - Content script injection
   - OAuth2 authentication flow

2. **Content Script** (content.js)
   - Adds "Track Video" button to YouTube interface
   - One-click addition to tracking playlist
   - Visual feedback when video is added

3. **Benefits**
   - Seamless user experience
   - Works with existing YouTube session
   - No manual playlist navigation needed
   - Can add videos automatically based on watch time

### Sample Extension Flow

```javascript
// When user watches a video
if (videoWatchTime > 30) { // seconds
  // Prompt to add to tracking playlist
  showAddToPlaylistPrompt();
}

// One-click addition
async function addToTrackingPlaylist(videoId) {
  await youtube.playlistItems.insert({
    playlistId: TRACKING_PLAYLIST_ID,
    videoId: videoId
  });
}
```

## Mobile App Integration

For mobile users, integrate with YouTube's native sharing:

1. **iOS Shortcuts**
   - Create shortcut to add shared YouTube videos to playlist
   - Use YouTube API to add video to tracking playlist

2. **Android Intent Filters**
   - Register app to receive YouTube share intents
   - Extract video ID and add to playlist via API

## User Workflow

1. **Initial Setup**
   - User authorizes app via OAuth2
   - App creates private tracking playlist
   - User installs browser extension (optional)

2. **Daily Usage**
   - User watches videos normally on YouTube
   - Adds videos to tracking playlist via:
     - YouTube's "Save" button
     - Browser extension button
     - Mobile share menu
   - App syncs playlist periodically

3. **Data Analysis**
   - App fetches playlist contents via API
   - Processes viewing patterns
   - Generates AI summaries of video consumption

## Privacy and Control

- User has complete control over what gets tracked
- Playlist can be managed directly on YouTube
- Videos can be removed from tracking anytime
- Private playlist ensures data privacy