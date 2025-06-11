# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Memory Bank is a full-stack personal assistant application that tracks and analyzes user activities across GitHub, YouTube, and local projects using AI-powered insights.

## Architecture

### Frontend (React Native Expo)
- **Location**: `/PersonalAssistant/`
- **Framework**: React Native with Expo managed workflow
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **State Management**: Zustand with AsyncStorage persistence
- **Navigation**: Expo Router with tab-based layout and auth flow

### Backend (Node.js/Express)
- **Location**: `/PersonalAssistant/backend/`
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT (RS256) with refresh tokens
- **AI Integration**: Azure OpenAI GPT-4.1 for activity summarization

### Key Architectural Decisions
- **YouTube Integration**: Uses YouTube Playlist API (not watch history) with browser extension for tracking
- **Security**: File system sandboxing, rate limiting, encrypted credentials
- **Testing**: Playwright for E2E, Jest for unit tests

## Essential Commands

### Frontend Development
```bash
cd PersonalAssistant
npm install
npm start          # Start Expo dev server
npm run ios        # iOS simulator
npm run android    # Android emulator
npm run web        # Web browser
```

### Backend Development
```bash
cd PersonalAssistant/backend
npm install
docker-compose up -d  # Start PostgreSQL
npm run db:push      # Initialize database
npm run dev          # Start dev server (port 3000)
```

### Testing
```bash
# Frontend E2E tests
cd PersonalAssistant
npm run test:e2e           # Run all Playwright tests
npm run test:e2e:headed    # Run with browser visible
npm run test:e2e:ui        # Open Playwright UI

# Backend test environment
cd PersonalAssistant/backend
npm run dev:test           # Start server in test mode
npm run test:db:init       # Initialize test database
```

### Database Management
```bash
cd PersonalAssistant/backend
npm run db:studio    # Open Drizzle Studio GUI
npm run db:migrate   # Run migrations
npm run db:push      # Push schema changes
```

## Environment Configuration

### Backend (.env)
```
DATABASE_URL=postgresql://membank:membank123@localhost:5432/memory_bank
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com
AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment
```

### Frontend (.env)
```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token

### Activities
- `GET /api/activities` - List user activities
- `POST /api/activities/sync/github` - Sync GitHub activities
- `POST /api/activities/sync/youtube` - Sync YouTube playlist
- `GET /api/activities/summary` - Get AI-generated summary

## Testing Approach

### E2E Tests
- Located in `/PersonalAssistant/tests/e2e/`
- Test auth flow, activity sync, and dashboard
- Uses test database with Docker Compose

### Running Single Tests
```bash
# Run specific test file
npx playwright test tests/e2e/specs/auth.spec.ts

# Run with specific browser
npx playwright test --project=chromium

# Debug mode
npx playwright test --debug
```

## Development Workflow

1. **Database Changes**: Modify schema in `backend/src/db/schema.ts`, then run `npm run db:push`
2. **API Changes**: Update controllers in `backend/src/controllers/`, services in `backend/src/services/`
3. **Frontend Changes**: Components in `components/`, screens in `app/`, API client in `lib/api.ts`
4. **Testing**: Write E2E tests for new features, run before committing

## Important Notes

- YouTube tracking requires users to manually add videos to a tracking playlist (API limitation workaround)
- File system access is sandboxed to user's home directory
- All AI summaries are structured JSON for consistent parsing
- Mobile app uses Expo Go for development, requires EAS for production builds