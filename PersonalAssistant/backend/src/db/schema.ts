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