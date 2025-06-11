import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../db/schema';
import { sql } from 'drizzle-orm';

const testDbUrl = process.env.TEST_DATABASE_URL || 'postgresql://user:password@localhost:5432/personal_assistant_test';

export async function setupTestDatabase() {
  const pool = new Pool({ connectionString: testDbUrl });
  const db = drizzle(pool, { schema });

  // Drop all tables and recreate
  await db.execute(sql`DROP SCHEMA public CASCADE`);
  await db.execute(sql`CREATE SCHEMA public`);
  
  // Create tables
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS activity_sources (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id),
      type VARCHAR(50) NOT NULL,
      credentials TEXT,
      last_sync TIMESTAMP,
      is_active BOOLEAN NOT NULL DEFAULT true
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS activities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id),
      source_id UUID REFERENCES activity_sources(id),
      type VARCHAR(100) NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      metadata JSONB NOT NULL,
      timestamp TIMESTAMP NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS ai_summaries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id),
      date TIMESTAMP NOT NULL,
      summary TEXT NOT NULL,
      insights JSONB NOT NULL,
      priorities JSONB,
      model_version VARCHAR(50),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  return { db, pool };
}

export async function teardownTestDatabase(pool: Pool) {
  await pool.end();
}