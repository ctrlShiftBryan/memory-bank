# Memory Bank

A personal assistant application that tracks and analyzes your digital activities across GitHub, YouTube, and local projects using AI-powered insights.

## Features

- 📊 **Activity Tracking**: Automatically sync activities from GitHub, YouTube playlists, and local Claude Code projects
- 🤖 **AI-Powered Summaries**: Daily activity analysis with priorities and insights using GPT-4
- 📱 **Cross-Platform**: React Native app for iOS, Android, and web
- 🔒 **Secure**: JWT authentication, encrypted credentials, and sandboxed file access
- 🎬 **YouTube Integration**: Track watched videos via playlist API (browser extension included)
- 📈 **Activity Dashboard**: Visualize your digital footprint with detailed statistics

## Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac only) or Android Emulator

### Backend Setup

```bash
# Navigate to backend directory
cd PersonalAssistant/backend

# Install dependencies
npm install

# Start PostgreSQL database
docker-compose up -d

# Create .env file
cp .env.example .env
# Edit .env with your configuration

# Initialize database
npm run db:push

# Start development server
npm run dev
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd PersonalAssistant

# Install dependencies
npm install

# Create .env file
echo "EXPO_PUBLIC_API_URL=http://localhost:3000" > .env

# Start Expo development server
npm start
```

### Running the App

- **iOS**: Press `i` in the Expo CLI or run `npm run ios`
- **Android**: Press `a` in the Expo CLI or run `npm run android`
- **Web**: Press `w` in the Expo CLI or run `npm run web`

## Architecture

```
memory-bank/
├── PersonalAssistant/          # React Native frontend
│   ├── app/                    # Expo Router screens
│   ├── components/             # Reusable components
│   ├── contexts/              # React contexts (Auth, Toast)
│   ├── lib/                   # API client
│   └── stores/                # Zustand state management
├── PersonalAssistant/backend/  # Node.js backend
│   ├── src/
│   │   ├── controllers/       # Route handlers
│   │   ├── services/         # Business logic
│   │   ├── db/              # Database schema
│   │   └── middleware/      # Auth middleware
│   └── docker-compose.yml    # PostgreSQL setup
└── PersonalAssistant/browser-extension/  # Chrome extension

```

## Key Technologies

### Frontend
- React Native + Expo
- TypeScript
- NativeWind (Tailwind CSS)
- Zustand (State Management)
- Expo Router (Navigation)

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL + Drizzle ORM
- JWT Authentication
- Azure OpenAI API

### Testing
- Playwright (E2E)
- Jest (Unit)

## Testing

```bash
# Run E2E tests
cd PersonalAssistant
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run unit tests
npm test
```

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://membank:membank123@localhost:5432/memory_bank
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com
AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment
```

### Frontend (.env)
```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## YouTube Integration

Due to YouTube API limitations, the app uses a playlist-based tracking approach:

1. Install the browser extension from `/PersonalAssistant/browser-extension/`
2. Create a dedicated playlist for tracking (e.g., "Watch History Tracker")
3. The extension automatically adds watched videos to your playlist
4. The app syncs from this playlist to track your viewing history

## Development

### Database Changes
```bash
# Modify schema in backend/src/db/schema.ts
cd PersonalAssistant/backend
npm run db:push    # Push changes to database
npm run db:studio  # Open database GUI
```

### API Development
- Controllers: `backend/src/controllers/`
- Services: `backend/src/services/`
- Middleware: `backend/src/middleware/`

### Frontend Development
- Screens: `app/`
- Components: `components/`
- API Client: `lib/api.ts`
- State: `stores/`

## Docker Deployment

```bash
cd PersonalAssistant
docker-compose -f docker-compose.yml up -d
```

## Security Features

- JWT authentication with refresh tokens
- Rate limiting (100 requests/15 min)
- File system sandboxing
- Encrypted credential storage
- CORS protection
- Input validation and sanitization

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with Expo and React Native
- AI summaries powered by Azure OpenAI
- YouTube tracking inspired by privacy-conscious design