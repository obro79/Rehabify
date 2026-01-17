import { neonAuth } from '@neondatabase/auth/next/server';

/**
 * Require authentication - throws if not authenticated.
 * Use at the start of protected Server Actions or API routes.
 */
export async function requireAuth() {
  const { user } = await neonAuth();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export { neonAuth };
