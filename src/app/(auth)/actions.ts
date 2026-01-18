'use server';

import { db } from '@/db';
import { profiles } from '@/db/schema';
import { requireAuth } from '@/lib/auth/server';

export async function createProfile() {
  try {
    const user = await requireAuth();
    if (!user || !user.email) return { error: 'Not authenticated' };

    await db.insert(profiles).values({
      id: user.id,
      email: user.email,
      displayName: user.name || user.email.split('@')[0],
      role: 'patient',
    }).onConflictDoNothing();

    return { success: true };
  } catch (error) {
    console.error('Failed to create profile:', error);
    return { error: 'Failed to create profile' };
  }
}
