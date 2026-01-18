/**
 * Plans API Route
 *
 * POST /api/plans - Create a new plan
 * GET /api/plans/[planId] - Get a plan by ID
 *
 * Requires: PT or admin role
 */

import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api/auth';
import { success } from '@/lib/api/response';
import { APIError, ErrorCode } from '@/lib/api/errors';
import { validateBody } from '@/lib/api/validation';
import { db, plans } from '@/db';
import { planStructureSchema } from '@/lib/gemini/types';
import { z } from 'zod';

const createPlanSchema = z.object({
  patientId: z.string().uuid(),
  name: z.string().min(1).max(200),
  structure: planStructureSchema,
  ptSummary: z.string().optional(),
  recommendations: z.array(z.any()).optional(),
});

/**
 * Create a new plan
 *
 * POST /api/plans
 * Body: { patientId, name, structure, ptSummary?, recommendations? }
 */
export const POST = withAuth(
  async (request: NextRequest, { user }) => {
    // Only PTs and admins can create plans
    if (user.role !== 'pt' && user.role !== 'admin') {
      throw new APIError(
        ErrorCode.FORBIDDEN,
        'Only physical therapists and admins can create plans'
      );
    }

    // Validate request body
    const body = await validateBody(request, createPlanSchema);

    // Create plan record in database
    const [newPlan] = await db
      .insert(plans)
      .values({
        patientId: body.patientId,
        ptId: user.role === 'pt' ? user.id : null,
        name: body.name,
        status: 'pending_review',
        structure: body.structure,
        ptSummary: body.ptSummary,
        recommendations: body.recommendations || [],
      })
      .returning();

    return success(newPlan, 201);
  },
  { roles: ['pt', 'admin'] }
);

