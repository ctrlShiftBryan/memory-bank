// Test environment config that doesn't require a real database
export const testConfig = {
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  JWT_SECRET: 'test-jwt-secret',
  JWT_REFRESH_SECRET: 'test-refresh-secret',
  AZURE_OPENAI_ENDPOINT: 'https://test.openai.azure.com/',
  AZURE_OPENAI_DEPLOYMENT_NAME: 'test-deployment',
  GITHUB_CLIENT_ID: 'test-github-client',
  GITHUB_CLIENT_SECRET: 'test-github-secret',
  YOUTUBE_CLIENT_ID: 'test-youtube-client',
  YOUTUBE_CLIENT_SECRET: 'test-youtube-secret',
  YOUTUBE_REDIRECT_URI: 'http://localhost:3000/api/activities/youtube/callback',
  CLAUDE_PROJECTS_PATH: '/tmp/test-projects',
  ALLOWED_FILE_EXTENSIONS: ['.js', '.ts', '.py', '.md', '.json'],
  CORS_ORIGIN: 'http://localhost:8081',
  SESSION_SECRET: 'test-session-secret',
  PORT: 3000,
  NODE_ENV: 'test',
};