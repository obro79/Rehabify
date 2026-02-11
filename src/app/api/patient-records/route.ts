/**
 * Patient Records API Route
 *
 * GET /api/patient-records?patientId=...
 * Get all records (assessments, plans, sessions) for a patient.
 *
 * Patients can only access their own records.
 * PTs can access their assigned patients' records.
 */

import { NextRequest } from 'next/server';
import { eq, desc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/api/auth';
import { success } from '@/lib/api/response';
import { handleAPIError } from '@/lib/api/errors';
import { getTargetPatientId } from '@/lib/api/patient-access';
import { db, assessments, plans, sessions } from '@/db';

/**
 * Get all records for a patient
 *
 * GET /api/patient-records?patientId=...
 * - Patients: Gets their own records (patientId ignored)
 * - PTs: Can optionally specify patientId to get a patient's records
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const targetPatientId = getTargetPatientId(request, user);

    // Fetch all records in parallel
    const [patientAssessments, patientPlans, patientSessions] = await Promise.all([
      // Assessments
      db
        .select()
        .from(assessments)
        .where(eq(assessments.patientId, targetPatientId))
        .orderBy(desc(assessments.createdAt)),

      // Plans
      db
        .select()
        .from(plans)
        .where(eq(plans.patientId, targetPatientId))
        .orderBy(desc(plans.createdAt)),

      // Sessions
      db
        .select()
        .from(sessions)
        .where(eq(sessions.patientId, targetPatientId))
        .orderBy(desc(sessions.date)),
    ]);

    return success({
      assessments: patientAssessments,
      plans: patientPlans,
      sessions: patientSessions,
    });
  } catch (err) {
    return handleAPIError(err);
  }
}

