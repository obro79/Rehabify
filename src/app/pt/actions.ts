'use server';

import { db } from '@/db';
import { profiles, sessions } from '@/db/schema';
import { requireAuth } from '@/lib/auth/server';
import { eq, desc } from 'drizzle-orm';

export async function getPTProfile() {
  const user = await requireAuth();
  if (!user) throw new Error('Unauthorized');

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.id, user.id),
  });

  return profile;
}

export async function getPTPatients() {
  const user = await requireAuth();
  if (!user) throw new Error('Unauthorized');

  // Fetch patients assigned to this PT
  const patients = await db.query.profiles.findMany({
    where: eq(profiles.ptId, user.id),
    with: {
      // Fetch latest session for "last exercise"
      // Note: This assumes relations are set up in schema/index.ts, if not we might need raw query or separate fetch
    }
  });

  // For each patient, fetch additional stats (alerts, last session) manually if relations aren't perfect
  const enrichedPatients = await Promise.all(patients.map(async (patient) => {
    const lastSession = await db.query.sessions.findFirst({
      where: eq(sessions.patientId, patient.id),
      orderBy: [desc(sessions.date)],
    });

    // Mock alerts for now as alerts table might be complex to aggregate quickly without relations
    // Real impl would fetch from pt_alerts
    return {
      id: patient.id,
      name: patient.displayName || 'Unknown',
      status: 'active', // Derived
      avatar: patient.avatarUrl,
      lastSession: lastSession ? new Date(lastSession.date) : undefined,
      currentPlan: { name: 'Rehab Plan', status: 'active' }, // Placeholder
      alerts: [], // Placeholder
      progress: 0, // Placeholder
    };
  }));

  return enrichedPatients;
}
