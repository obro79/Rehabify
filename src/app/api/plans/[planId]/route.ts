/**
 * Plan Detail API Route
 *
 * GET /api/plans/[planId] - Fetch a plan by ID
 * PATCH /api/plans/[planId] - Update plan structure, status, or name
 *
 * Requires: authenticated user (PT/admin for updates)
 */

import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { withAuth } from '@/lib/api/auth';
import { success } from '@/lib/api/response';
import { APIError, ErrorCode } from '@/lib/api/errors';
import { db, plans } from '@/db';
import { z } from 'zod';
import { validateBody } from '@/lib/api/validation';

interface RouteContext {
  params: Promise<{ planId: string }>;
}

/**
 * GET /api/plans/[planId]
 * Fetch a plan by ID
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const handler = withAuth(
    async (_req: NextRequest) => {
      const { planId } = await context.params;

      const [plan] = await db
        .select()
        .from(plans)
        .where(eq(plans.id, planId))
        .limit(1);

      if (!plan) {
        throw new APIError(ErrorCode.NOT_FOUND, 'Plan not found');
      }

      return success(plan);
    }
  );

  return handler(request);
}

const updatePlanSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  status: z.enum(['pending_review', 'approved', 'modified']).optional(),
  structure: z.any().optional(),
  ptSummary: z.string().optional(),
});

/**
 * PATCH /api/plans/[planId]
 * Update plan structure, status, or name
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  const handler = withAuth(
    async (req: NextRequest, { user }) => {
      if (user.role !== 'pt' && user.role !== 'admin') {
        throw new APIError(
          ErrorCode.FORBIDDEN,
          'Only physical therapists and admins can update plans'
        );
      }

      const { planId } = await context.params;
      const body = await validateBody(req, updatePlanSchema);

      // Verify plan exists
      const [existingPlan] = await db
        .select()
        .from(plans)
        .where(eq(plans.id, planId))
        .limit(1);

      if (!existingPlan) {
        throw new APIError(ErrorCode.NOT_FOUND, 'Plan not found');
      }

      // Build update object
      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (body.name !== undefined) updateData.name = body.name;
      if (body.status !== undefined) {
        updateData.status = body.status;
        if (body.status === 'approved') {
          updateData.reviewedAt = new Date();
          updateData.reviewedBy = user.id;
        }
      }
      if (body.structure !== undefined) updateData.structure = body.structure;
      if (body.ptSummary !== undefined) updateData.ptSummary = body.ptSummary;

      const [updatedPlan] = await db
        .update(plans)
        .set(updateData)
        .where(eq(plans.id, planId))
        .returning();

      return success(updatedPlan);
    },
    { roles: ['pt', 'admin'] }
  );

  return handler(request);
}
