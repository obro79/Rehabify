import { neonAuth } from '@neondatabase/auth/next/server';

// Demo user for development/testing
const DEMO_USER = {
  id: 'demo-user-id',
  email: 'demo@rehabify.dev',
  name: 'Demo User',
};

/**
 * Require authentication - throws if not authenticated.
 * Use at the start of protected Server Actions or API routes.
 * In demo mode, returns a mock user for development.
 */
export async function requireAuth() {
  const { user } = await neonAuth();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export { neonAuth };
