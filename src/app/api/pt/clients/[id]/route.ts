/**
 * PT Client Detail API Route
 *
 * GET /api/pt/clients/[id]
 * Fetch a single patient's full data including sessions, plans, and alerts.
 *
 * Requires: PT or admin role
 */

import { NextRequest } from 'next/server';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { withAuth } from '@/lib/api/auth';
import { success } from '@/lib/api/response';
import { APIError, ErrorCode } from '@/lib/api/errors';
import { db, profiles, plans, sessions, ptAlerts } from '@/db';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const handler = withAuth(
    async (_req: NextRequest, { user }) => {
      const { id: patientId } = await context.params;

      // Fetch patient profile
      const [patient] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, patientId))
        .limit(1);

      if (!patient) {
        throw new APIError(ErrorCode.NOT_FOUND, 'Patient not found');
      }

      // Fetch all related data in parallel
      const [patientPlans, patientSessions, activeAlerts] = await Promise.all([
        db
          .select()
          .from(plans)
          .where(eq(plans.patientId, patientId))
          .orderBy(desc(plans.createdAt)),

        db
          .select()
          .from(sessions)
          .where(eq(sessions.patientId, patientId))
          .orderBy(desc(sessions.date))
          .limit(20),

        db
          .select()
          .from(ptAlerts)
          .where(
            and(
              eq(ptAlerts.patientId, patientId),
              eq(ptAlerts.ptId, user.id),
              isNull(ptAlerts.dismissedAt)
            )
          )
          .orderBy(desc(ptAlerts.createdAt)),
      ]);

      const currentPlan = patientPlans[0] ?? null;

      return success({
        id: patient.id,
        name: patient.displayName || patient.email,
        email: patient.email,
        avatarUrl: patient.avatarUrl,
        status: activeAlerts.length > 0 ? 'alert' : 'active',
        memberSince: patient.createdAt,
        lastSession: patientSessions[0]?.date ?? null,
        currentPlan: currentPlan
          ? {
              id: currentPlan.id,
              name: currentPlan.name,
              status: currentPlan.status as 'pending_review' | 'approved' | 'modified',
              exercises: [],
              createdAt: currentPlan.createdAt,
              reviewedAt: currentPlan.reviewedAt,
              notes: currentPlan.ptSummary,
              structure: currentPlan.structure,
            }
          : null,
        alerts: activeAlerts.map((alert) => ({
          id: alert.id,
          type: alert.type,
          severity: alert.severity,
          message: alert.description,
          createdAt: alert.createdAt,
        })),
        sessionHistory: patientSessions.map((session) => ({
          id: session.id,
          date: session.date,
          formScore: session.overallFormScore ? Number(session.overallFormScore) : 0,
          duration: session.durationSeconds
            ? `${Math.floor(session.durationSeconds / 60)}:${String(session.durationSeconds % 60).padStart(2, '0')}`
            : '0:00',
          painLevel: session.overallPain ?? undefined,
          status: session.status,
          exercises: session.exercises,
        })),
        plans: patientPlans,
      });
    },
    { roles: ['pt', 'admin'] }
  );

  return handler(request);
}
