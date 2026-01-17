/**
 * API Utilities
 *
 * Centralized utilities for building consistent, type-safe API routes.
 *
 * @example
 * import { success, error, ErrorCode, validateBody, withAuth } from '@/lib/api';
 *
 * export const GET = withAuth(async (request, { user }) => {
 *   const items = await db.select().from(resources);
 *   return success(items);
 * });
 *
 * export async function POST(request: NextRequest) {
 *   const body = await validateBody(request, createSchema);
 *   const [item] = await db.insert(resources).values(body).returning();
 *   return success(item, 201);
 * }
 */

// Error handling
export {
  ErrorCode,
  APIError,
  handleAPIError,
  Errors,
  ERROR_STATUS_MAP,
} from './errors';

// Response helpers
export {
  success,
  error,
  paginated,
  noContent,
  getPaginationParams,
} from './response';

// Validation
export {
  validateBody,
  validateQuery,
  validateParams,
  schemas,
} from './validation';

// Authentication
export {
  getCurrentUser,
  withAuth,
  hasRole,
  assertRole,
} from './auth';
export type { AuthenticatedUser } from './auth';

// Types
export type {
  SuccessResponse,
  ErrorResponse,
  PaginatedResponse,
  PaginationMeta,
  ApiResponse,
  UserRole,
  AuthContext,
  WithAuthOptions,
  ExtractData,
  ApiHandler,
} from './types';
