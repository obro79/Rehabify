/**
 * Sessions Schema
 *
 * Workout sessions with exercise results, metrics, and PT notes.
 */

import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  date,
  decimal,
  jsonb,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { profiles } from './profiles';
import { plans } from './plans';

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    patientId: uuid('patient_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    planId: uuid('plan_id').references(() => plans.id, { onDelete: 'set null' }),

    date: date('date').notNull(),

    // Exercise results
    exercises: jsonb('exercises').default(sql`'[]'::jsonb`),

    // Metrics
    durationSeconds: integer('duration_seconds').default(0),
    overallFormScore: decimal('overall_form_score', { precision: 5, scale: 2 }),

    // Feedback
    overallPain: integer('overall_pain'),
    overallRating: integer('overall_rating'),
    voiceFeedback: text('voice_feedback'),

    // Status
    status: text('status').default('completed'),

    // XP
    xpEarned: integer('xp_earned').default(0),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_sessions_patient_id').on(table.patientId),
    index('idx_sessions_plan_id').on(table.planId),
    index('idx_sessions_date').on(table.date),
    check(
      'status_check',
      sql`${table.status} IN ('completed', 'partial', 'missed')`
    ),
    check(
      'pain_check',
      sql`${table.overallPain} IS NULL OR (${table.overallPain} >= 0 AND ${table.overallPain} <= 10)`
    ),
    check(
      'rating_check',
      sql`${table.overallRating} IS NULL OR (${table.overallRating} >= 1 AND ${table.overallRating} <= 5)`
    ),
  ]
);

export const sessionNotes = pgTable(
  'session_notes',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    sessionId: uuid('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id')
      .notNull()
      .references(() => profiles.id),

    content: text('content').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('idx_session_notes_session').on(table.sessionId)]
);

// Type exports
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type SessionNote = typeof sessionNotes.$inferSelect;
export type NewSessionNote = typeof sessionNotes.$inferInsert;
