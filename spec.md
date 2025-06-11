# Comprehensive Technical Plan for Personal Assistant App

## Executive Summary

This technical plan outlines building a personal assistant app that tracks daily activities from YouTube, GitHub, and local Claude Code projects, then uses Azure OpenAI GPT-4.1 to provide intelligent summaries and work prioritization. **Critical limitation**: YouTube watch history is no longer accessible via API since 2016, requiring alternative approaches.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     React Native Expo Frontend                   │
│                    (NativeWind + RN Reusables)                  │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTPS/JWT
┌─────────────────────┴───────────────────────────────────────────┐
│                    Node.js/Bun Express Backend                   │
│                  (Drizzle ORM + PostgreSQL)                     │
├─────────────────────┬───────────────────────────────────────────┤
│   Data Sources      │              AI Processing                 │
├─────────────────────┼───────────────────────────────────────────┤
│ • GitHub API        │         Azure OpenAI GPT-4.1             │
│ • Local Files       │      (Activity Summarization)            │
│ • YouTube Takeout   │                                          │
└─────────────────────┴───────────────────────────────────────────┘
```

## Frontend Implementation

### Project Setup

```bash
# Create Expo project
npx create-expo-app PersonalAssistant --template tabs
cd PersonalAssistant

# Install NativeWind and dependencies
npm install nativewind
npm install --save-dev tailwindcss@3.3.2
npx tailwindcss init

# Install React Native Reusables components
npm install @rn-primitives/slot @rn-primitives/types
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react-native react-native-svg
```

### NativeWind Configuration

**tailwind.config.js:**

```javascript
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

### Key UI Components

**Activity Dashboard (app/(tabs)/index.tsx):**

```typescript
import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useActivityStore } from "@/stores/activityStore";
import { ActivitySummary } from "@/components/ActivitySummary";

export default function DashboardScreen() {
  const { activities, summary, loading, fetchActivities } = useActivityStore();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchActivities();
    setRefreshing(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1 px-4 py-6"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="mb-6">
          <Text className="text-3xl font-bold text-gray-900 mb-2">
            Today's Overview
          </Text>
          <Text className="text-lg text-gray-600">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>

        {summary && (
          <Card className="mb-6 p-6 bg-white rounded-xl shadow-sm">
            <ActivitySummary summary={summary} />
          </Card>
        )}

        <View className="space-y-4">
          <ActivitySourceCard
            title="GitHub Activity"
            count={activities.github?.length || 0}
            icon="github"
          />
          <ActivitySourceCard
            title="YouTube History"
            count={activities.youtube?.length || 0}
            icon="youtube"
          />
          <ActivitySourceCard
            title="Claude Projects"
            count={activities.local?.length || 0}
            icon="code"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

### State Management with Zustand

```typescript
// stores/activityStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiClient } from "@/lib/api";

interface ActivityStore {
  activities: {
    github: GitHubActivity[];
    youtube: YouTubeActivity[];
    local: LocalProject[];
  };
  summary: AISummary | null;
  loading: boolean;
  fetchActivities: () => Promise<void>;
  generateSummary: () => Promise<void>;
}

export const useActivityStore = create<ActivityStore>()(
  persist(
    (set, get) => ({
      activities: { github: [], youtube: [], local: [] },
      summary: null,
      loading: false,

      fetchActivities: async () => {
        set({ loading: true });
        try {
          const [github, youtube, local] = await Promise.all([
            apiClient.getGitHubActivities(),
            apiClient.getYouTubeActivities(),
            apiClient.getLocalProjects(),
          ]);

          set({
            activities: { github, youtube, local },
            loading: false,
          });
        } catch (error) {
          console.error("Failed to fetch activities:", error);
          set({ loading: false });
        }
      },

      generateSummary: async () => {
        const { activities } = get();
        try {
          const summary = await apiClient.generateAISummary(activities);
          set({ summary });
        } catch (error) {
          console.error("Failed to generate summary:", error);
        }
      },
    }),
    {
      name: "activity-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

## Backend Implementation

### Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   └── env.ts
│   ├── db/
│   │   ├── schema.ts
│   │   ├── migrations/
│   │   └── index.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── activities.controller.ts
│   │   └── ai.controller.ts
│   ├── services/
│   │   ├── github.service.ts
│   │   ├── youtube.service.ts
│   │   ├── fileSystem.service.ts
│   │   └── openai.service.ts
│   ├── middleware/
│   │   └── auth.middleware.ts
│   └── app.ts
```

### Database Schema (Drizzle ORM)

```typescript
// src/db/schema.ts
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  jsonb,
  boolean,
  integer,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const activitySources = pgTable("activity_sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  type: varchar("type", { length: 50 }).notNull(), // 'github', 'youtube', 'local'
  credentials: text("credentials"), // Encrypted API tokens
  lastSync: timestamp("last_sync"),
  isActive: boolean("is_active").notNull().default(true),
});

export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  sourceId: uuid("source_id").references(() => activitySources.id),
  type: varchar("type", { length: 100 }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  metadata: jsonb("metadata").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const aiSummaries = pgTable("ai_summaries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  date: timestamp("date").notNull(),
  summary: text("summary").notNull(),
  insights: jsonb("insights").notNull(),
  priorities: jsonb("priorities"),
  modelVersion: varchar("model_version", { length: 50 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

### Activity Collection Services

**GitHub Service (src/services/github.service.ts):**

```typescript
import { Octokit } from "@octokit/rest";
import { db } from "../db";
import { activities } from "../db/schema";

export class GitHubService {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  async fetchUserActivities(username: string, userId: string) {
    try {
      // Fetch user events
      const { data: events } = await this.octokit.request(
        "GET /users/{username}/events",
        {
          username,
          per_page: 100,
        }
      );

      // Process and store activities
      const processedActivities = events.map((event) => ({
        userId,
        sourceId: "github-source-id",
        type: event.type,
        title: this.generateTitle(event),
        description: this.generateDescription(event),
        metadata: {
          repo: event.repo.name,
          payload: event.payload,
        },
        timestamp: new Date(event.created_at),
      }));

      // Batch insert activities
      await db.insert(activities).values(processedActivities);

      return processedActivities;
    } catch (error) {
      console.error("GitHub fetch error:", error);
      throw error;
    }
  }

  private generateTitle(event: any): string {
    switch (event.type) {
      case "PushEvent":
        return `Pushed ${event.payload.commits?.length || 1} commits to ${
          event.repo.name
        }`;
      case "PullRequestEvent":
        return `${event.payload.action} PR #${event.payload.pull_request.number} in ${event.repo.name}`;
      case "IssuesEvent":
        return `${event.payload.action} issue #${event.payload.issue.number} in ${event.repo.name}`;
      default:
        return `${event.type} in ${event.repo.name}`;
    }
  }
}
```

**YouTube Alternative Service (src/services/youtube.service.ts):**

```typescript
// Since YouTube API doesn't provide watch history, use Google Takeout data
export class YouTubeService {
  async processGoogleTakeoutData(takeoutFilePath: string, userId: string) {
    try {
      const takeoutData = await this.parseTakeoutFile(takeoutFilePath);

      const processedActivities = takeoutData
        .filter((item) => item.titleUrl)
        .map((item) => ({
          userId,
          sourceId: "youtube-source-id",
          type: "video_watched",
          title: item.title || "Unknown Video",
          description: `Watched video from ${
            item.subtitles?.[0]?.name || "Unknown Channel"
          }`,
          metadata: {
            videoId: this.extractVideoId(item.titleUrl),
            channelName: item.subtitles?.[0]?.name,
            url: item.titleUrl,
          },
          timestamp: new Date(item.time),
        }));

      await db.insert(activities).values(processedActivities);
      return processedActivities;
    } catch (error) {
      console.error("YouTube data processing error:", error);
      throw error;
    }
  }

  private extractVideoId(url: string): string | null {
    const match = url.match(/watch\?v=([^&]+)/);
    return match ? match[1] : null;
  }

  // Alternative: Implement browser extension or manual import
  async setupWatchHistoryImport() {
    return {
      instructions: [
        "1. Go to https://takeout.google.com",
        '2. Select "YouTube and YouTube Music"',
        "3. Download watch history",
        "4. Upload the JSON file through the app",
      ],
    };
  }
}
```

**File System Service (src/services/fileSystem.service.ts):**

```typescript
import * as path from "path";
import * as fs from "fs/promises";
import { createHash } from "crypto";

export class FileSystemService {
  private readonly allowedPaths: string[];

  constructor(allowedPaths: string[]) {
    this.allowedPaths = allowedPaths.map((p) => path.resolve(p));
  }

  async scanClaudeProjects(userId: string) {
    const projects = [];

    for (const basePath of this.allowedPaths) {
      try {
        const files = await this.recursiveScan(basePath);
        const claudeProjects = files.filter(
          (f) => f.includes(".claude") || f.includes("claude.json")
        );

        for (const projectPath of claudeProjects) {
          const projectInfo = await this.analyzeProject(projectPath);
          projects.push({
            userId,
            sourceId: "local-source-id",
            type: "code_project",
            title: projectInfo.name,
            description: `Claude project: ${projectInfo.description}`,
            metadata: {
              path: projectPath,
              lastModified: projectInfo.lastModified,
              files: projectInfo.files,
              languages: projectInfo.languages,
            },
            timestamp: projectInfo.lastModified,
          });
        }
      } catch (error) {
        console.error(`Error scanning ${basePath}:`, error);
      }
    }

    await db.insert(activities).values(projects);
    return projects;
  }

  private async recursiveScan(
    dir: string,
    depth = 0,
    maxDepth = 5
  ): Promise<string[]> {
    if (depth > maxDepth) return [];

    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      // Security: Ensure we stay within allowed paths
      if (!this.isPathAllowed(fullPath)) continue;

      if (entry.isDirectory() && !entry.name.startsWith(".")) {
        files.push(
          ...(await this.recursiveScan(fullPath, depth + 1, maxDepth))
        );
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }

    return files;
  }

  private isPathAllowed(testPath: string): boolean {
    const resolved = path.resolve(testPath);
    return this.allowedPaths.some((allowed) => resolved.startsWith(allowed));
  }
}
```

### AI Integration Service

**Azure OpenAI Service (src/services/openai.service.ts):**

```typescript
import { AzureOpenAI } from "openai";
import {
  DefaultAzureCredential,
  getBearerTokenProvider,
} from "@azure/identity";

export class OpenAIService {
  private client: AzureOpenAI;

  constructor() {
    const credential = new DefaultAzureCredential();
    const azureADTokenProvider = getBearerTokenProvider(
      credential,
      "https://cognitiveservices.azure.com/.default"
    );

    this.client = new AzureOpenAI({
      azureADTokenProvider,
      apiVersion: "2024-10-21",
      azure_endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    });
  }

  async generateDailySummary(activities: any[], date: Date) {
    const prompt = this.buildSummaryPrompt(activities, date);

    const response = await this.client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      messages: [
        {
          role: "system",
          content:
            "You are an intelligent personal assistant that analyzes daily activities and provides actionable insights.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 2000,
      temperature: 0.3,
    });

    return this.parseSummaryResponse(response.choices[0].message.content);
  }

  private buildSummaryPrompt(activities: any[], date: Date): string {
    return `
    Analyze my activities for ${date.toLocaleDateString()} and provide:
    
    ## Activities Data
    ${JSON.stringify(activities, null, 2)}
    
    ## Required Analysis
    1. **Executive Summary** (2-3 sentences highlighting key accomplishments)
    2. **Time Allocation** (breakdown by activity type with percentages)
    3. **Productivity Insights** (patterns, focus areas, distractions)
    4. **Key Achievements** (top 3-5 accomplishments)
    5. **Areas of Concern** (unfinished tasks, time sinks)
    6. **Tomorrow's Priorities** (based on today's activities)
    
    Format the response as structured JSON.
    `;
  }

  async generateWorkPriorities(recentActivities: any[], upcomingTasks: any[]) {
    const response = await this.client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      messages: [
        {
          role: "system",
          content:
            "You are a productivity expert who helps prioritize work based on past activities and upcoming commitments.",
        },
        {
          role: "user",
          content: this.buildPriorityPrompt(recentActivities, upcomingTasks),
        },
      ],
      max_tokens: 1500,
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content);
  }
}
```

### API Endpoints

**Activities Controller (src/controllers/activities.controller.ts):**

```typescript
import { Router } from "express";
import { authenticateToken } from "../middleware/auth.middleware";
import { GitHubService } from "../services/github.service";
import { YouTubeService } from "../services/youtube.service";
import { FileSystemService } from "../services/fileSystem.service";
import { OpenAIService } from "../services/openai.service";

const router = Router();
router.use(authenticateToken);

// Sync all activities
router.post("/sync", async (req, res) => {
  try {
    const userId = req.user.id;

    // Initialize services
    const githubService = new GitHubService(req.user.githubToken);
    const youtubeService = new YouTubeService();
    const fileSystemService = new FileSystemService([
      process.env.CLAUDE_PROJECTS_PATH,
    ]);

    // Fetch activities in parallel
    const [githubActivities, localProjects] = await Promise.all([
      githubService.fetchUserActivities(req.user.githubUsername, userId),
      fileSystemService.scanClaudeProjects(userId),
    ]);

    res.json({
      github: githubActivities.length,
      local: localProjects.length,
      message: "Activities synced successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate AI summary
router.post("/summary", async (req, res) => {
  try {
    const { date = new Date() } = req.body;
    const userId = req.user.id;

    // Fetch activities for the date
    const dayActivities = await db
      .select()
      .from(activities)
      .where(
        and(
          eq(activities.userId, userId),
          gte(activities.timestamp, startOfDay(date)),
          lte(activities.timestamp, endOfDay(date))
        )
      );

    // Generate summary
    const openaiService = new OpenAIService();
    const summary = await openaiService.generateDailySummary(
      dayActivities,
      date
    );

    // Store summary
    await db.insert(aiSummaries).values({
      userId,
      date,
      summary: summary.text,
      insights: summary.insights,
      priorities: summary.priorities,
      modelVersion: "gpt-4.1-turbo",
    });

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export { router as activitiesRouter };
```

## Security Implementation

### Authentication Flow

```typescript
// JWT Authentication with refresh tokens
export class AuthService {
  generateTokens(userId: string) {
    const accessToken = jwt.sign(
      { userId, type: "access" },
      process.env.JWT_SECRET,
      {
        algorithm: "RS256",
        expiresIn: "15m",
        issuer: "personal-assistant-api",
        audience: "personal-assistant-app",
      }
    );

    const refreshToken = jwt.sign(
      { userId, type: "refresh" },
      process.env.JWT_REFRESH_SECRET,
      {
        algorithm: "RS256",
        expiresIn: "7d",
      }
    );

    return { accessToken, refreshToken };
  }

  async validateToken(token: string, type: "access" | "refresh") {
    const secret =
      type === "access"
        ? process.env.JWT_SECRET
        : process.env.JWT_REFRESH_SECRET;

    return jwt.verify(token, secret, {
      algorithms: ["RS256"],
      issuer: "personal-assistant-api",
      audience: "personal-assistant-app",
    });
  }
}
```

### Environment Variables

**.env configuration:**

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/personal_assistant

# Authentication
JWT_SECRET=your-rsa-private-key
JWT_REFRESH_SECRET=your-refresh-rsa-private-key

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4-turbo

# External APIs
GITHUB_CLIENT_ID=your-github-oauth-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-client-secret

# File System
CLAUDE_PROJECTS_PATH=/home/user/projects
ALLOWED_FILE_EXTENSIONS=.js,.ts,.py,.md,.json

# Security
CORS_ORIGIN=http://localhost:8081
SESSION_SECRET=your-session-secret
```

## Deployment Strategy

### Docker Configuration

**Backend Dockerfile:**

```dockerfile
FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

FROM oven/bun:1-alpine
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
WORKDIR /app

COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .

USER nodejs
EXPOSE 3000
CMD ["bun", "run", "src/app.ts"]
```

**Docker Compose:**

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: personal_assistant
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app_network

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/personal_assistant
    depends_on:
      - postgres
    ports:
      - "3000:3000"
    networks:
      - app_network
    volumes:
      - ${CLAUDE_PROJECTS_PATH}:/projects:ro

volumes:
  postgres_data:

networks:
  app_network:
```

### CI/CD Pipeline

**GitHub Actions workflow:**

```yaml
name: Deploy Personal Assistant

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun test
      - run: bun run lint

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t personal-assistant-backend ./backend

      - name: Deploy to Cloud Run
        uses: google-github-actions/deploy-cloudrun@v1
        with:
          service: personal-assistant-api
          image: gcr.io/${{ secrets.GCP_PROJECT }}/personal-assistant-backend

  deploy-expo:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas build --platform all --non-interactive
      - run: eas submit --platform all --non-interactive
```

## Key Implementation Considerations

### YouTube History Alternatives

Since YouTube API doesn't provide watch history:

1. **Google Takeout Integration**: Build UI for users to upload their YouTube history export
2. **Browser Extension**: Create optional extension to track YouTube activity
3. **Manual Entry**: Allow users to manually log important videos
4. **Future-proof**: Design system to easily integrate if YouTube API changes

### Performance Optimizations

1. **Activity Caching**: Cache frequently accessed data in Redis
2. **Batch Processing**: Process activities in batches for AI summarization
3. **Incremental Sync**: Only fetch new activities since last sync
4. **Background Jobs**: Use job queues for heavy processing

### Security Checklist

- ✅ JWT with RS256 algorithm and short expiration
- ✅ Encrypted storage for API credentials
- ✅ File system sandboxing with path validation
- ✅ Rate limiting on all endpoints
- ✅ Input validation and sanitization
- ✅ HTTPS only with secure headers
- ✅ Regular security audits

### Monitoring and Analytics

1. **Application Monitoring**: Sentry for error tracking
2. **Performance Monitoring**: Datadog or New Relic
3. **User Analytics**: Privacy-focused analytics with Plausible
4. **Health Checks**: Automated uptime monitoring

## Next Steps

1. **Phase 1**: Set up development environment and basic authentication
2. **Phase 2**: Implement GitHub integration and file system scanning
3. **Phase 3**: Add YouTube Takeout processing and AI summarization
4. **Phase 4**: Build comprehensive dashboard and insights
5. **Phase 5**: Deploy and iterate based on usage

This architecture provides a secure, scalable foundation for your personal assistant app while handling the YouTube API limitations gracefully and leveraging cutting-edge AI capabilities for intelligent activity analysis.
