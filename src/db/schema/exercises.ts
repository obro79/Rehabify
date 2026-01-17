/**
 * Exercises Schema
 *
 * Static exercise library with 52 exercises across Tier 1 (AI form detection)
 * and Tier 2 (voice-guided).
 */

import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const exercises = pgTable(
  'exercises',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    name: text('name').notNull(),
    slug: text('slug').unique().notNull(),

    // Classification
    category: text('category').notNull(),
    bodyRegion: text('body_region').notNull(),
    targetArea: text('target_area'),
    difficulty: text('difficulty').notNull(),
    tier: integer('tier').notNull().default(2),

    // Content
    description: text('description').notNull(),
    instructions: text('instructions').array().notNull(),
    commonMistakes: text('common_mistakes').array().default(sql`'{}'`),
    modifications: jsonb('modifications').default(sql`'{}'`),
    contraindications: text('contraindications').array().default(sql`'{}'`),

    // Exercise configuration
    defaultReps: integer('default_reps').default(10),
    defaultSets: integer('default_sets').default(3),
    defaultHoldSeconds: integer('default_hold_seconds').default(0),
    repType: text('rep_type').default('standard'),
    equipment: text('equipment'),

    // Media
    thumbnailUrl: text('thumbnail_url'),
    videoUrl: text('video_url'),

    // Vision config
    formDetectionEnabled: boolean('form_detection_enabled').default(false),
    detectionConfig: jsonb('detection_config'),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_exercises_category').on(table.category),
    index('idx_exercises_body_region').on(table.bodyRegion),
    index('idx_exercises_tier').on(table.tier),
    index('idx_exercises_slug').on(table.slug),
    check(
      'difficulty_check',
      sql`${table.difficulty} IN ('beginner', 'intermediate', 'advanced')`
    ),
    check('tier_check', sql`${table.tier} IN (1, 2)`),
  ]
);

// Type exports
export type Exercise = typeof exercises.$inferSelect;
export type NewExercise = typeof exercises.$inferInsert;
