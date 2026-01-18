/**
 * Assessments API Route
 *
 * GET /api/assessments/[patientId]
 * Get all assessments for a patient.
 *
 * Requires: PT or admin role
 */

import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/api/auth';
import { success, error } from '@/lib/api/response';
import { ErrorCode, handleAPIError } from '@/lib/api/errors';
import { db, assessments } from '@/db';

/**
 * Get assessments for a patient
 *
 * GET /api/assessments/[patientId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const user = await getCurrentUser();

    // Only PTs and admins can view assessments
    if (user.role !== 'pt' && user.role !== 'admin') {
      return error(
        ErrorCode.FORBIDDEN,
        'Only physical therapists and admins can view assessments'
      );
    }

    const { patientId } = await params;

    if (!patientId) {
      return error(ErrorCode.BAD_REQUEST, 'Patient ID is required');
    }

    const patientAssessments = await db
      .select()
      .from(assessments)
      .where(eq(assessments.patientId, patientId))
      .orderBy(assessments.createdAt);

    return success(patientAssessments);
  } catch (err) {
    return handleAPIError(err);
  }
}

