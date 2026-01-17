import { authApiHandler } from '@neondatabase/auth/next/server';

// Force dynamic to prevent build-time evaluation
export const dynamic = 'force-dynamic';

export const { GET, POST } = authApiHandler();
