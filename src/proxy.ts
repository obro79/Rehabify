import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { neonAuthMiddleware } from '@neondatabase/auth/next/server';

export default function middleware(request: NextRequest) {
  // Skip auth in demo mode
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    return NextResponse.next();
  }

  // Use Neon Auth middleware for production
  return neonAuthMiddleware({ loginUrl: '/login' })(request);
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/workout/:path*',
    '/profile/:path*',
    '/history/:path*',
    '/exercises/:path*',
    '/progress/:path*',
    '/messages/:path*',
    '/assessment/:path*',
    '/pt/:path*',
  ],
};
