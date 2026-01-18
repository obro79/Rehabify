/**
 * Plan Generation API Route
 *
 * POST /api/plans/generate
 * Generates a 12-week rehabilitation plan using Gemini AI from a patient assessment.
 *
 * Requires: PT or admin role
 */

import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { withAuth } from '@/lib/api/auth';
import { success } from '@/lib/api/response';
import { APIError, ErrorCode } from '@/lib/api/errors';
import { validateBody } from '@/lib/api/validation';
import { db, plans, assessments } from '@/db';
import { generatePlan } from '@/lib/gemini/plan-generator';
import { generatePlanRequestSchema } from '@/lib/gemini/types';

/**
 * Generate a rehabilitation plan from an assessment
 *
 * POST /api/plans/generate
 * Body: { assessmentId: string, patientId: string }
 *
 * Returns: { data: { planId: string, structure: PlanStructure, summary: string, recommendations: Recommendation[] } }
 */
export const POST = withAuth(
  async (request: NextRequest, { user }) => {
    // Only PTs and admins can generate plans
    if (user.role !== 'pt' && user.role !== 'admin') {
      throw new APIError(
        ErrorCode.FORBIDDEN,
        'Only physical therapists and admins can generate plans'
      );
    }

    // Validate request body
    let body: { assessmentId: string; patientId: string };
    try {
      body = await validateBody(request, generatePlanRequestSchema);
    } catch (err) {
      throw new APIError(
        ErrorCode.VALIDATION_ERROR,
        err instanceof Error ? err.message : 'Invalid request body'
      );
    }

    const { assessmentId, patientId } = body;

    // Generate plan using Gemini
    const generatedPlan = await generatePlan({
      assessmentId,
      patientId,
    });

    // Create plan record in database
    const [newPlan] = await db
      .insert(plans)
      .values({
        patientId,
        ptId: user.role === 'pt' ? user.id : null,
        name: 'AI-Generated Rehabilitation Plan',
        status: 'pending_review',
        structure: generatedPlan.structure,
        ptSummary: generatedPlan.summary,
        recommendations: generatedPlan.recommendations,
      })
      .returning();

    // Link assessment to plan
    await db
      .update(assessments)
      .set({ planId: newPlan.id })
      .where(eq(assessments.id, assessmentId));

    return success(
      {
        planId: newPlan.id,
        structure: generatedPlan.structure,
        summary: generatedPlan.summary,
        recommendations: generatedPlan.recommendations,
      },
      201
    );
  },
  { roles: ['pt', 'admin'] }
);

