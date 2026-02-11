import { neonAuth } from '@neondatabase/auth/next/server';
import { headers } from 'next/headers';

// Demo users for development/testing
const DEMO_PATIENT = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'demo@rehabify.dev',
  name: 'Demo User',
  role: 'patient' as const,
};

const DEMO_PT = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'dr.sarah@rehabify.demo',
  name: 'Dr. Sarah Chen, DPT',
  role: 'pt' as const,
};

/**
 * Require authentication - throws if not authenticated.
 * Use at the start of protected Server Actions or API routes.
 * In demo mode, returns a mock user for development.
 * Checks x-demo-role header to determine which demo user to return.
 */
export async function requireAuth() {
  // Bypass auth in demo mode
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    const headersList = await headers();
    const demoRole = headersList.get('x-demo-role');
    if (demoRole === 'pt') {
      return DEMO_PT;
    }
    return DEMO_PATIENT;
  }

  const { user } = await neonAuth();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export { neonAuth };
