module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/e2e/',
    '/.expo/',
    '/dist/',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)'
  ],
  collectCoverageFrom: [
    '**/*.{ts,tsx,js,jsx}',
    '!**/coverage/**',
    '!**/node_modules/**',
    '!**/babel.config.js',
    '!**/jest.setup.js',
    '!**/tests/e2e/**',
  ],
  projects: [
    {
      displayName: 'frontend',
      testMatch: [
        '<rootDir>/components/**/__tests__/**/*.{js,jsx,ts,tsx}',
        '<rootDir>/components/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/app/**/__tests__/**/*.{js,jsx,ts,tsx}',
        '<rootDir>/app/**/*.test.{js,jsx,ts,tsx}',
      ],
      preset: 'jest-expo',
    },
    {
      displayName: 'backend',
      rootDir: '<rootDir>/backend',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
        '<rootDir>/src/**/*.test.{js,jsx,ts,tsx}',
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
    },
  ],
};