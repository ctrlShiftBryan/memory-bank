import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/personal_assistant',
  
  // Authentication
  JWT_SECRET: process.env.JWT_SECRET || 'your-jwt-secret',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
  
  // Azure OpenAI
  AZURE_OPENAI_ENDPOINT: process.env.AZURE_OPENAI_ENDPOINT || '',
  AZURE_OPENAI_DEPLOYMENT_NAME: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4-turbo',
  
  // External APIs
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || '',
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || '',
  
  // YouTube API
  YOUTUBE_CLIENT_ID: process.env.YOUTUBE_CLIENT_ID || '',
  YOUTUBE_CLIENT_SECRET: process.env.YOUTUBE_CLIENT_SECRET || '',
  YOUTUBE_REDIRECT_URI: process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/api/activities/youtube/callback',
  
  // File System
  CLAUDE_PROJECTS_PATH: process.env.CLAUDE_PROJECTS_PATH || '/home/user/projects',
  ALLOWED_FILE_EXTENSIONS: (process.env.ALLOWED_FILE_EXTENSIONS || '.js,.ts,.py,.md,.json').split(','),
  
  // Security
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:8081',
  SESSION_SECRET: process.env.SESSION_SECRET || 'your-session-secret',
  
  // Server
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
};