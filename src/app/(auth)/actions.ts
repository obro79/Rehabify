'use server';

import { db } from '@/db';
import { profiles } from '@/db/schema';
import { requireAuth } from '@/lib/auth/server';

export async function createProfile(role: 'patient' | 'pt' = 'patient') {
  try {
    const user = await requireAuth();
    if (!user || !user.email) return { error: 'Not authenticated' };

    let joinCode: string | null = null;
    if (role === 'pt') {
      // Generate a simple 6-char unique code
      joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    await db.insert(profiles).values({
      id: user.id,
      email: user.email,
      displayName: user.name || user.email.split('@')[0],
      role,
      joinCode,
    }).onConflictDoNothing();

    return { success: true, role };
  } catch (error) {
    console.error('Failed to create profile:', error);
    return { error: 'Failed to create profile' };
  }
}
