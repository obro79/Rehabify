/**
 * Achievements Schema
 *
 * Gamification system with achievement definitions and user progress.
 */

import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core';
import { profiles } from './profiles';

export const achievements = pgTable('achievements', {
  id: uuid('id').primaryKey().defaultRandom(),

  name: text('name').notNull(),
  description: text('description').notNull(),
  iconUrl: text('icon_url'),

  conditionType: text('condition_type').notNull(),
  conditionValue: integer('condition_value').notNull(),

  xpReward: integer('xp_reward').default(0).notNull(),
  category: text('category').default('general'),
  sortOrder: integer('sort_order').default(0),

  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const userAchievements = pgTable(
  'user_achievements',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    achievementId: uuid('achievement_id')
      .notNull()
      .references(() => achievements.id, { onDelete: 'cascade' }),

    earnedAt: timestamp('earned_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.achievementId] }),
    index('idx_user_achievements_user').on(table.userId),
  ]
);

// Type exports
export type Achievement = typeof achievements.$inferSelect;
export type NewAchievement = typeof achievements.$inferInsert;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type NewUserAchievement = typeof userAchievements.$inferInsert;
