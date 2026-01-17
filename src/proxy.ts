import { neonAuthMiddleware } from '@neondatabase/auth/next/server';

export default neonAuthMiddleware({ loginUrl: '/login' });

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
