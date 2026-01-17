/**
 * Alerts Schema
 *
 * PT alerts for monitoring patients and AI recommendations.
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { profiles } from './profiles';
import { sessions } from './sessions';
import { plans } from './plans';

export const ptAlerts = pgTable(
  'pt_alerts',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    patientId: uuid('patient_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    ptId: uuid('pt_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    sessionId: uuid('session_id').references(() => sessions.id, {
      onDelete: 'set null',
    }),

    type: text('type').notNull(),
    severity: text('severity').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    recommendation: text('recommendation'),

    dismissedAt: timestamp('dismissed_at', { withTimezone: true }),
    dismissedBy: uuid('dismissed_by').references(() => profiles.id),
    dismissReason: text('dismiss_reason'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_alerts_pt_id').on(table.ptId),
    index('idx_alerts_patient_id').on(table.patientId),
    index('idx_alerts_severity').on(table.severity),
    check(
      'type_check',
      sql`${table.type} IN ('high_pain', 'missed_sessions', 'declining_form', 'patient_concern')`
    ),
    check('severity_check', sql`${table.severity} IN ('high', 'medium', 'low')`),
  ]
);

export const ptRecommendations = pgTable(
  'pt_recommendations',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    patientId: uuid('patient_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    ptId: uuid('pt_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    planId: uuid('plan_id').references(() => plans.id, { onDelete: 'cascade' }),

    type: text('type').notNull(),
    reason: text('reason').notNull(),
    suggestedChanges: jsonb('suggested_changes').notNull(),

    status: text('status').notNull().default('pending'),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    resolvedBy: uuid('resolved_by').references(() => profiles.id),
    resolutionNotes: text('resolution_notes'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_recommendations_pt_id').on(table.ptId),
    check(
      'type_check',
      sql`${table.type} IN ('reduce_difficulty', 'increase_difficulty', 'substitute_exercise', 'modify_schedule')`
    ),
    check(
      'status_check',
      sql`${table.status} IN ('pending', 'approved', 'rejected')`
    ),
  ]
);

// Type exports
export type PtAlert = typeof ptAlerts.$inferSelect;
export type NewPtAlert = typeof ptAlerts.$inferInsert;
export type PtRecommendation = typeof ptRecommendations.$inferSelect;
export type NewPtRecommendation = typeof ptRecommendations.$inferInsert;
