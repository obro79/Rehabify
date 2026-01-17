import type { ErrorCode } from './errors';

/**
 * Standard success response format.
 * All successful API responses wrap data in this structure.
 */
export interface SuccessResponse<T> {
  data: T;
}

/**
 * Standard error response format.
 * All error responses follow this structure.
 */
export interface ErrorResponse {
  error: {
    code: ErrorCode | string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Pagination metadata included in paginated responses.
 */
export interface PaginationMeta {
  /** Total number of items across all pages */
  total: number;
  /** Maximum items per page */
  limit: number;
  /** Number of items skipped */
  offset: number;
  /** Whether more items exist beyond current page */
  hasMore: boolean;
}

/**
 * Standard paginated response format.
 * Used for list endpoints that support pagination.
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Union type for all possible API responses.
 */
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

/**
 * User roles for authorization.
 */
export type UserRole = 'patient' | 'pt' | 'admin';

/**
 * Authenticated user context passed to handlers.
 */
export interface AuthContext {
  user: {
    id: string;
    email: string;
    name?: string;
    role: UserRole;
  };
}

/**
 * Options for the withAuth middleware.
 */
export interface WithAuthOptions {
  /** Required roles for access. If empty, any authenticated user is allowed. */
  roles?: UserRole[];
}

/**
 * Type helper for extracting data type from a response.
 */
export type ExtractData<T> = T extends SuccessResponse<infer U> ? U : never;

/**
 * Type helper for creating typed API handlers.
 */
export type ApiHandler<TResponse> = (
  request: Request
) => Promise<Response | SuccessResponse<TResponse> | ErrorResponse>;
