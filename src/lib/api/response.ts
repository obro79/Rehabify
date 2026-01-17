import { NextResponse } from 'next/server';
import { ErrorCode, ERROR_STATUS_MAP } from './errors';
import type { SuccessResponse, ErrorResponse, PaginatedResponse, PaginationMeta } from './types';

/**
 * Creates a successful API response with the standard { data: T } format.
 *
 * @param data - The response data to wrap
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with JSON body
 *
 * @example
 * return success({ id: '123', name: 'Test' });
 * // Response: { data: { id: '123', name: 'Test' } }
 *
 * @example
 * return success(createdResource, 201);
 * // Response with 201 status
 */
export function success<T>(data: T, status: number = 200): NextResponse<SuccessResponse<T>> {
  return NextResponse.json({ data }, { status });
}

/**
 * Creates an error API response with the standard error format.
 *
 * @param code - Error code from ErrorCode enum
 * @param message - Human-readable error message
 * @param status - HTTP status code (uses default for code if not provided)
 * @param details - Optional additional error details
 * @returns NextResponse with JSON error body
 *
 * @example
 * return error(ErrorCode.NOT_FOUND, 'User not found');
 * // Response: { error: { code: 'NOT_FOUND', message: 'User not found' } }
 */
export function error(
  code: ErrorCode,
  message: string,
  status?: number,
  details?: Record<string, unknown>
): NextResponse<ErrorResponse> {
  const responseBody: ErrorResponse = {
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };

  return NextResponse.json(responseBody, {
    status: status ?? ERROR_STATUS_MAP[code],
  });
}

/**
 * Creates a paginated API response with data and pagination metadata.
 *
 * @param data - Array of items for current page
 * @param pagination - Pagination metadata (total, limit, offset)
 * @returns NextResponse with paginated JSON body
 *
 * @example
 * const items = await db.select().from(users).limit(20).offset(0);
 * const total = await db.select({ count: count() }).from(users);
 * return paginated(items, { total: total[0].count, limit: 20, offset: 0 });
 */
export function paginated<T>(
  data: T[],
  pagination: Omit<PaginationMeta, 'hasMore'>
): NextResponse<PaginatedResponse<T>> {
  const { total, limit, offset } = pagination;
  const hasMore = offset + data.length < total;

  return NextResponse.json({
    data,
    pagination: {
      total,
      limit,
      offset,
      hasMore,
    },
  });
}

/**
 * Creates a 204 No Content response (for DELETE operations).
 *
 * @returns NextResponse with no body and 204 status
 */
export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

/**
 * Helper to parse pagination query parameters from a request URL.
 *
 * @param request - The incoming request
 * @param defaults - Default values for limit and maxLimit
 * @returns Parsed limit and offset values
 *
 * @example
 * const { limit, offset } = getPaginationParams(request);
 * const items = await db.select().from(users).limit(limit).offset(offset);
 */
export function getPaginationParams(
  request: Request,
  defaults: { limit?: number; maxLimit?: number } = {}
): { limit: number; offset: number } {
  const { limit: defaultLimit = 20, maxLimit = 100 } = defaults;
  const url = new URL(request.url);

  const limitParam = url.searchParams.get('limit');
  const offsetParam = url.searchParams.get('offset');

  const limit = Math.min(
    Math.max(1, parseInt(limitParam ?? String(defaultLimit), 10) || defaultLimit),
    maxLimit
  );
  const offset = Math.max(0, parseInt(offsetParam ?? '0', 10) || 0);

  return { limit, offset };
}
