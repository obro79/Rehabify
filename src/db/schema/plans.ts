/**
 * Plans Schema
 *
 * 12-week rehabilitation programs with JSONB structure and modification history.
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

export const plans = pgTable(
  'plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    patientId: uuid('patient_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    ptId: uuid('pt_id').references(() => profiles.id, { onDelete: 'set null' }),

    name: text('name').notNull().default('Rehabilitation Plan'),
    status: text('status').notNull().default('pending_review'),

    // 12-week structure (JSONB)
    structure: jsonb('structure').notNull(),

    // AI-generated content
    ptSummary: text('pt_summary'),
    recommendations: jsonb('recommendations').default(sql`'[]'::jsonb`),

    // Review tracking
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    reviewedBy: uuid('reviewed_by').references(() => profiles.id),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('idx_plans_patient_id').on(table.patientId),
    index('idx_plans_pt_id').on(table.ptId),
    index('idx_plans_status').on(table.status),
    check(
      'status_check',
      sql`${table.status} IN ('pending_review', 'approved', 'modified')`
    ),
  ]
);

export const planModifications = pgTable(
  'plan_modifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    planId: uuid('plan_id')
      .notNull()
      .references(() => plans.id, { onDelete: 'cascade' }),
    modifiedBy: uuid('modified_by')
      .notNull()
      .references(() => profiles.id),

    changes: jsonb('changes').notNull(),
    notes: text('notes').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('idx_plan_mods_plan_id').on(table.planId)]
);

// Type exports
export type Plan = typeof plans.$inferSelect;
export type NewPlan = typeof plans.$inferInsert;
export type PlanModification = typeof planModifications.$inferSelect;
export type NewPlanModification = typeof planModifications.$inferInsert;
