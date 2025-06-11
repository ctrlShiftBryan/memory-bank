# Personal Assistant App

A React Native app that tracks your daily activities from GitHub, YouTube, and local Claude Code projects, then uses Azure OpenAI GPT-4.1 to provide intelligent summaries and work prioritization.

## Features

- **GitHub Integration**: Automatically tracks commits, PRs, and issues
- **YouTube Playlist Tracking**: Uses YouTube API to track videos from a dedicated playlist
- **Local Project Tracking**: Monitors Claude Code projects and development activity
- **AI-Powered Summaries**: Daily activity analysis with insights and priorities
- **Cross-Platform**: Works on iOS, Android, and web via Expo

## Architecture

- **Frontend**: React Native Expo with TypeScript, NativeWind, and Zustand
- **Backend**: Node.js/Express with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: Azure OpenAI GPT-4.1 for activity summarization

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Azure OpenAI API access
- GitHub OAuth app credentials
- YouTube Data API v3 credentials

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables in `.env`

5. Run database migrations:
   ```bash
   npm run db:push
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file:
   ```bash
   echo "EXPO_PUBLIC_API_URL=http://localhost:3000/api" > .env
   ```

3. Start the Expo development server:
   ```bash
   npx expo start
   ```

## Docker Deployment

1. Build and run with Docker Compose:
   ```bash
   docker-compose up -d
   ```

2. The backend will be available at `http://localhost:3000`

## YouTube Playlist Integration

The app uses the YouTube Data API v3 to track videos from a dedicated playlist:

1. **Initial Setup**:
   - App requests OAuth2 authorization to access your YouTube account
   - Creates a private playlist called "Personal Assistant Activity Tracker"
   - You can manage this playlist directly on YouTube

2. **Adding Videos**:
   - Add videos to the tracking playlist using YouTube's "Save" button
   - Use the browser extension for one-click addition
   - Share videos to the app from mobile YouTube

3. **Data Sync**:
   - App syncs playlist contents periodically
   - Full video metadata is retrieved via the API
   - All data remains private in your account

## Security Notes

- JWT tokens expire after 15 minutes
- All API credentials are encrypted in the database
- File system access is sandboxed to specified directories
- Rate limiting is enabled on all endpoints

## Development

### Backend Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm run db:studio` - Open Drizzle Studio for database management

### Frontend Commands

- `npx expo start` - Start Expo development server
- `npx expo run:ios` - Run on iOS simulator
- `npx expo run:android` - Run on Android emulator
- `npx expo build` - Create production builds

## License

MIT