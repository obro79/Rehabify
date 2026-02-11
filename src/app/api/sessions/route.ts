/**
 * Sessions API Route
 *
 * POST /api/sessions - Save a completed workout session
 * Updates profile XP, streak, and level.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { eq, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/api/auth';
import { success } from '@/lib/api/response';
import { handleAPIError } from '@/lib/api/errors';
import { validateBody } from '@/lib/api/validation';
import { db, sessions, profiles } from '@/db';

const createSessionSchema = z.object({
  exerciseSlug: z.string().min(1),
  exerciseName: z.string().min(1),
  category: z.string().min(1),
  formScore: z.number().min(0).max(100),
  repsCompleted: z.number().int().min(0),
  targetReps: z.number().int().min(1),
  durationSeconds: z.number().int().min(0),
  planId: z.string().uuid().optional(),
});

/**
 * POST /api/sessions
 * Save a completed workout session and update profile gamification.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await validateBody(request, createSessionSchema);

    // Calculate XP: 10 per rep + bonus for high form score
    const baseXP = body.repsCompleted * 10;
    const bonusXP = body.formScore > 80 ? Math.round(body.repsCompleted * 5) : 0;
    const xpEarned = baseXP + bonusXP;

    // Get current profile for streak calculation
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, user.id));

    if (!profile) {
      // Profile doesn't exist yet - this shouldn't happen but handle gracefully
      throw new Error('Profile not found');
    }

    const today = new Date().toISOString().split('T')[0];
    const lastWorkout = profile.lastWorkoutDate;

    // Calculate streak
    let newStreak = profile.currentStreak;
    if (!lastWorkout) {
      // First ever workout
      newStreak = 1;
    } else {
      const lastDate = new Date(lastWorkout);
      const todayDate = new Date(today);
      const diffDays = Math.floor(
        (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 0) {
        // Same day - keep streak as is
      } else if (diffDays === 1) {
        // Consecutive day - increment
        newStreak = profile.currentStreak + 1;
      } else {
        // Streak broken - reset to 1
        newStreak = 1;
      }
    }

    const newLongestStreak = Math.max(profile.longestStreak, newStreak);

    // Calculate new level (every 500 XP = 1 level)
    const newTotalXP = profile.xp + xpEarned;
    const newLevel = Math.max(1, Math.floor(newTotalXP / 500) + 1);

    // Build exercises JSONB array entry
    const exerciseEntry = {
      exerciseSlug: body.exerciseSlug,
      exerciseName: body.exerciseName,
      category: body.category,
      formScore: body.formScore,
      repsCompleted: body.repsCompleted,
      targetReps: body.targetReps,
    };

    // Insert session and update profile in parallel
    const [newSession] = await db
      .insert(sessions)
      .values({
        patientId: user.id,
        planId: body.planId || null,
        date: today,
        exercises: [exerciseEntry],
        durationSeconds: body.durationSeconds,
        overallFormScore: String(body.formScore),
        status: 'completed',
        xpEarned,
      })
      .returning();

    await db
      .update(profiles)
      .set({
        xp: sql`${profiles.xp} + ${xpEarned}`,
        level: newLevel,
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastWorkoutDate: today,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, user.id));

    return success(
      {
        session: newSession,
        stats: {
          xpEarned,
          totalXP: newTotalXP,
          level: newLevel,
          levelProgress: Math.round(((newTotalXP % 500) / 500) * 100),
          nextLevelXP: newLevel * 500,
          currentStreak: newStreak,
          longestStreak: newLongestStreak,
        },
      },
      201
    );
  } catch (err) {
    return handleAPIError(err);
  }
}
