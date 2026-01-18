import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { neonAuthMiddleware } from '@neondatabase/auth/next/server';

export default function middleware(request: NextRequest) {
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
