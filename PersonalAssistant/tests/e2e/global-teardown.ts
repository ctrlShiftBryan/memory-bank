import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('Starting global test teardown...');
  
  // Clean up test data if needed
  // For now, we'll leave the containers running for debugging
  // In CI, they would be cleaned up by the CI script
  
  console.log('Global test teardown complete');
}

export default globalTeardown;