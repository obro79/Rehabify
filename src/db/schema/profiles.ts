/**
 * Profiles Schema
 *
 * User profiles extending Neon Auth users with gamification and preferences.
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  date,
  jsonb,
  index,
  check,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').primaryKey(),
    email: text('email').notNull(),
    displayName: text('display_name'),
    avatarUrl: text('avatar_url'),

    // Role and assignment
    role: text('role').notNull().default('patient'),
    ptId: uuid('pt_id').references((): AnyPgColumn => profiles.id, {
      onDelete: 'set null',
    }),
    ptNotes: text('pt_notes'),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),

    // Gamification
    xp: integer('xp').default(0).notNull(),
    level: integer('level').default(1).notNull(),
    currentStreak: integer('current_streak').default(0).notNull(),
    longestStreak: integer('longest_streak').default(0).notNull(),
    lastWorkoutDate: date('last_workout_date'),

    // Preferences (JSONB)
    preferences: jsonb('preferences')
      .default(
        sql`'{"voice_speed": "normal", "voice_verbosity": "standard", "difficulty_level": "beginner", "notifications_enabled": true}'::jsonb`
      )
      .notNull(),
  },
  (table) => [
    index('idx_profiles_xp').on(table.xp),
    index('idx_profiles_role').on(table.role),
    index('idx_profiles_pt').on(table.ptId),
    check('role_check', sql`${table.role} IN ('patient', 'pt', 'admin')`),
    check('xp_non_negative', sql`${table.xp} >= 0`),
    check('level_positive', sql`${table.level} >= 1`),
    check('streak_non_negative', sql`${table.currentStreak} >= 0`),
  ]
);

// Type exports
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
