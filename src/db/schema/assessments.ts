/**
 * Assessments Schema
 *
 * Voice interview data, pain profile, movement screen results.
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
import { profiles } from './profiles';
import { plans } from './plans';

export const assessments = pgTable(
  'assessments',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    patientId: uuid('patient_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),

    // Interview data
    chiefComplaint: jsonb('chief_complaint').notNull(),
    painProfile: jsonb('pain_profile').notNull(),
    functionalImpact: jsonb('functional_impact'),
    medicalHistory: jsonb('medical_history'),

    // Movement screen
    movementScreen: jsonb('movement_screen').notNull(),

    // Synthesis
    directionalPreference: text('directional_preference'),
    redFlags: text('red_flags').array().default(sql`'{}'`),

    // Plan reference
    planId: uuid('plan_id').references(() => plans.id),

    // Session info
    durationSeconds: integer('duration_seconds'),
    voiceTranscript: text('voice_transcript'),
    completed: boolean('completed').default(false).notNull(),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_assessments_patient_id').on(table.patientId),
    check(
      'directional_preference_check',
      sql`${table.directionalPreference} IS NULL OR ${table.directionalPreference} IN ('flexion', 'extension', 'neutral')`
    ),
  ]
);

// Type exports
export type Assessment = typeof assessments.$inferSelect;
export type NewAssessment = typeof assessments.$inferInsert;
