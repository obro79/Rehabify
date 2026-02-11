/**
 * PT Clients API Route
 *
 * GET /api/pt/clients
 * Fetch all patients assigned to the current PT, including latest session,
 * active plan status, and alerts.
 *
 * Requires: PT or admin role
 */

import { NextRequest } from 'next/server';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { withAuth } from '@/lib/api/auth';
import { success } from '@/lib/api/response';
import { db, profiles, plans, sessions, ptAlerts } from '@/db';

export const GET = withAuth(
  async (_request: NextRequest, { user }) => {
    // Fetch all patients assigned to this PT
    const patients = await db
      .select()
      .from(profiles)
      .where(eq(profiles.ptId, user.id));

    // For each patient, fetch their latest session, active plan, and active alerts
    const clientsData = await Promise.all(
      patients.map(async (patient) => {
        const [latestSession, activePlan, activeAlerts] = await Promise.all([
          // Latest session
          db
            .select()
            .from(sessions)
            .where(eq(sessions.patientId, patient.id))
            .orderBy(desc(sessions.date))
            .limit(1)
            .then((rows) => rows[0] ?? null),

          // Most recent plan (active/approved or pending review)
          db
            .select()
            .from(plans)
            .where(eq(plans.patientId, patient.id))
            .orderBy(desc(plans.createdAt))
            .limit(1)
            .then((rows) => rows[0] ?? null),

          // Active (non-dismissed) alerts for this patient assigned to this PT
          db
            .select()
            .from(ptAlerts)
            .where(
              and(
                eq(ptAlerts.patientId, patient.id),
                eq(ptAlerts.ptId, user.id),
                isNull(ptAlerts.dismissedAt)
              )
            )
            .orderBy(desc(ptAlerts.createdAt)),
        ]);

        return {
          id: patient.id,
          name: patient.displayName || patient.email,
          email: patient.email,
          avatarUrl: patient.avatarUrl,
          status: activeAlerts.length > 0 ? 'alert' : 'active',
          memberSince: patient.createdAt,
          lastSession: latestSession?.date ?? null,
          currentPlan: activePlan
            ? {
                id: activePlan.id,
                name: activePlan.name,
                status: activePlan.status as 'pending_review' | 'approved' | 'modified',
                createdAt: activePlan.createdAt,
                reviewedAt: activePlan.reviewedAt,
                structure: activePlan.structure,
              }
            : null,
          alerts: activeAlerts.map((alert) => ({
            id: alert.id,
            type: alert.type,
            severity: alert.severity,
            message: alert.description,
            createdAt: alert.createdAt,
          })),
          sessionHistory: [],
        };
      })
    );

    return success(clientsData);
  },
  { roles: ['pt', 'admin'] }
);
