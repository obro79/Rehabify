import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { APIError, ErrorCode, handleAPIError } from './errors';
import type { UserRole, AuthContext, WithAuthOptions } from './types';

/**
 * User type returned from authentication.
 * Extended to include role for authorization.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  role?: UserRole;
}

/**
 * Gets the current authenticated user.
 * Wraps requireAuth with proper error handling.
 *
 * @returns The authenticated user
 * @throws APIError with UNAUTHORIZED code if not authenticated
 *
 * @example
 * export async function GET(request: NextRequest) {
 *   const user = await getCurrentUser();
 *   return success({ userId: user.id });
 * }
 */
export async function getCurrentUser(): Promise<AuthenticatedUser> {
  try {
    const user = await requireAuth();
    return user as AuthenticatedUser;
  } catch {
    throw new APIError(ErrorCode.UNAUTHORIZED, 'Authentication required');
  }
}

/**
 * Higher-order function that wraps an API handler with authentication.
 * Ensures the user is authenticated before calling the handler.
 * Optionally enforces role-based access control.
 *
 * @param handler - The API handler function to wrap
 * @param options - Optional configuration (roles)
 * @returns A wrapped handler that checks authentication
 *
 * @example
 * // Basic authentication
 * export const GET = withAuth(async (request, { user }) => {
 *   const items = await db.select().from(resources).where(eq(resources.userId, user.id));
 *   return success(items);
 * });
 *
 * @example
 * // With role restriction
 * export const DELETE = withAuth(
 *   async (request, { user }) => {
 *     // Only admins can reach here
 *     await db.delete(resources);
 *     return noContent();
 *   },
 *   { roles: ['admin'] }
 * );
 *
 * @example
 * // Multiple allowed roles
 * export const PUT = withAuth(
 *   async (request, { user }) => {
 *     // PTs and admins can access
 *     return success({ updated: true });
 *   },
 *   { roles: ['pt', 'admin'] }
 * );
 */
export function withAuth<T>(
  handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse<T>>,
  options?: WithAuthOptions
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Get authenticated user
      const user = await getCurrentUser();

      // Check role authorization if roles specified
      if (options?.roles && options.roles.length > 0) {
        const userRole = user.role ?? 'patient'; // Default to patient if no role

        if (!options.roles.includes(userRole)) {
          throw new APIError(
            ErrorCode.FORBIDDEN,
            'You do not have permission to access this resource'
          );
        }
      }

      // Call the handler with user context
      const context: AuthContext = {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: (user.role as UserRole) ?? 'patient',
        },
      };

      return await handler(request, context);
    } catch (error) {
      return handleAPIError(error);
    }
  };
}

/**
 * Checks if the current user has any of the specified roles.
 * Useful for conditional logic within handlers.
 *
 * @param user - The authenticated user
 * @param roles - Array of allowed roles
 * @returns True if user has any of the specified roles
 *
 * @example
 * if (hasRole(user, ['admin', 'pt'])) {
 *   // Show extra data for privileged users
 * }
 */
export function hasRole(user: AuthenticatedUser, roles: UserRole[]): boolean {
  const userRole = user.role ?? 'patient';
  return roles.includes(userRole);
}

/**
 * Asserts that the current user has one of the specified roles.
 * Throws FORBIDDEN error if not.
 *
 * @param user - The authenticated user
 * @param roles - Array of required roles
 * @throws APIError with FORBIDDEN code if user lacks required role
 *
 * @example
 * export async function DELETE(request: NextRequest) {
 *   const user = await getCurrentUser();
 *   assertRole(user, ['admin']); // Throws if not admin
 *   await db.delete(resources);
 *   return noContent();
 * }
 */
export function assertRole(user: AuthenticatedUser, roles: UserRole[]): void {
  if (!hasRole(user, roles)) {
    throw new APIError(
      ErrorCode.FORBIDDEN,
      'You do not have permission to perform this action'
    );
  }
}
