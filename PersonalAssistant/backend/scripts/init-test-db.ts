import { setupTestDatabase, teardownTestDatabase } from '../src/config/test-db';

async function initTestDb() {
  console.log('Setting up test database...');
  const { pool } = await setupTestDatabase();
  console.log('Test database initialized successfully');
  await teardownTestDatabase(pool);
  process.exit(0);
}

initTestDb().catch((error) => {
  console.error('Failed to initialize test database:', error);
  process.exit(1);
});