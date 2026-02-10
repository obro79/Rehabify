/**
 * Profile API Route
 *
 * GET /api/profile - Get current user's profile
 * PATCH /api/profile - Update profile (displayName, preferences)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/api/auth';
import { success } from '@/lib/api/response';
import { handleAPIError } from '@/lib/api/errors';
import { validateBody } from '@/lib/api/validation';
import { db, profiles } from '@/db';

/**
 * GET /api/profile
 * Returns the current user's profile.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, user.id));

    if (!profile) {
      return success({
        id: user.id,
        email: user.email,
        displayName: user.name || null,
        xp: 0,
        level: 1,
        currentStreak: 0,
        longestStreak: 0,
        lastWorkoutDate: null,
        preferences: {},
      });
    }

    return success({
      id: profile.id,
      email: profile.email,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      role: profile.role,
      xp: profile.xp,
      level: profile.level,
      currentStreak: profile.currentStreak,
      longestStreak: profile.longestStreak,
      lastWorkoutDate: profile.lastWorkoutDate,
      preferences: profile.preferences,
      createdAt: profile.createdAt,
    });
  } catch (err) {
    return handleAPIError(err);
  }
}

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  preferences: z.record(z.string(), z.unknown()).optional(),
});

/**
 * PATCH /api/profile
 * Update the current user's profile.
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const body = await validateBody(request, updateProfileSchema);

    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.displayName !== undefined) {
      updates.displayName = body.displayName;
    }

    if (body.preferences !== undefined) {
      // Merge with existing preferences
      const [existing] = await db
        .select({ preferences: profiles.preferences })
        .from(profiles)
        .where(eq(profiles.id, user.id));

      const existingPrefs =
        existing?.preferences && typeof existing.preferences === 'object'
          ? existing.preferences
          : {};

      updates.preferences = { ...existingPrefs, ...body.preferences };
    }

    const [updated] = await db
      .update(profiles)
      .set(updates)
      .where(eq(profiles.id, user.id))
      .returning();

    if (!updated) {
      return success({ message: 'Profile not found' }, 404);
    }

    return success({
      id: updated.id,
      email: updated.email,
      displayName: updated.displayName,
      avatarUrl: updated.avatarUrl,
      xp: updated.xp,
      level: updated.level,
      currentStreak: updated.currentStreak,
      longestStreak: updated.longestStreak,
      lastWorkoutDate: updated.lastWorkoutDate,
      preferences: updated.preferences,
    });
  } catch (err) {
    return handleAPIError(err);
  }
}
