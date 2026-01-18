/**
 * Create Default Plan API Route
 *
 * POST /api/plans/create-default
 * Creates a default plan for the current patient user with cat-camel as the first exercise
 *
 * Requires: Patient role
 */

import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { withAuth } from '@/lib/api/auth';
import { success } from '@/lib/api/response';
import { APIError, ErrorCode } from '@/lib/api/errors';
import { db, plans } from '@/db';
import { getExerciseBySlug } from '@/lib/exercises';
import type { PlanStructure } from '@/lib/gemini/types';

/**
 * Create a default plan for the current patient
 *
 * POST /api/plans/create-default
 */
export const POST = withAuth(
  async (request: NextRequest, { user }) => {
    // Only patients can create their own default plan
    if (user.role !== 'patient') {
      throw new APIError(
        ErrorCode.FORBIDDEN,
        'Only patients can create default plans'
      );
    }

    // Check if patient already has a plan
    const existingPlans = await db
      .select()
      .from(plans)
      .where(eq(plans.patientId, user.id))
      .limit(1);

    if (existingPlans.length > 0) {
      // Return existing plan
      return success(existingPlans[0]);
    }

    // Get cat-camel exercise
    const catCamelExercise = getExerciseBySlug('cat-camel');
    if (!catCamelExercise) {
      throw new APIError(
        ErrorCode.INTERNAL_ERROR,
        'Cat-camel exercise not found'
      );
    }

    // Create a simple default plan structure with cat-camel in week 1
    const defaultStructure: PlanStructure = {
      weeks: Array.from({ length: 12 }, (_, i) => ({
        weekNumber: i + 1,
        focus: i === 0
          ? 'Gentle mobility and pain relief'
          : `Week ${i + 1} progression`,
        notes: i === 0
          ? 'Start with gentle movements. Focus on pain-free range of motion. Stop if pain increases.'
          : 'Continue with your rehabilitation program. Progress gradually.',
        exercises: i === 0
          ? [
              {
                exerciseId: catCamelExercise.id,
                exerciseSlug: catCamelExercise.slug,
                name: catCamelExercise.name,
                sets: 2,
                reps: 8,
                holdSeconds: 3,
                days: [1, 3, 5], // Monday, Wednesday, Friday
                order: 0,
                notes: 'Move slowly and focus on smooth transitions between positions.',
              },
            ]
          : [],
      })),
    };

    // Create plan record in database
    const [newPlan] = await db
      .insert(plans)
      .values({
        patientId: user.id,
        ptId: null, // No PT assigned for default plan
        name: 'Default Rehabilitation Plan',
        status: 'approved', // Auto-approve default plans
        structure: defaultStructure,
        ptSummary: 'Default plan created automatically. Cat-camel exercise for gentle spinal mobility.',
        recommendations: [],
      })
      .returning();

    return success(newPlan, 201);
  },
  { roles: ['patient'] }
);

