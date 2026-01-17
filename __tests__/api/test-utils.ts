/**
 * API Test Utilities
 *
 * Provides helpers for testing Next.js App Router API routes.
 * Includes mock request/response builders and type-safe assertions.
 */

import { vi } from 'vitest';
import type { ApiResponse, ApiError } from '@/types';

/**
 * Options for creating a mock NextRequest
 */
export interface MockRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  searchParams?: Record<string, string>;
  cookies?: Record<string, string>;
}

/**
 * Creates a mock NextRequest for API route testing.
 *
 * @example
 * ```typescript
 * const req = createMockRequest('http://localhost:3000/api/sessions', {
 *   method: 'POST',
 *   body: { exerciseId: '123' },
 *   headers: { 'Authorization': 'Bearer token' }
 * });
 * ```
 */
export function createMockRequest(
  url: string,
  options: MockRequestOptions = {}
): Request {
  const {
    method = 'GET',
    headers = {},
    body,
    searchParams = {},
  } = options;

  // Build URL with search params
  const urlObj = new URL(url);
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value);
  });

  // Build headers
  const requestHeaders = new Headers();
  requestHeaders.set('Content-Type', 'application/json');
  Object.entries(headers).forEach(([key, value]) => {
    requestHeaders.set(key, value);
  });

  // Create request init
  const init: RequestInit = {
    method,
    headers: requestHeaders,
  };

  // Add body for non-GET requests
  if (body && method !== 'GET') {
    init.body = JSON.stringify(body);
  }

  return new Request(urlObj.toString(), init);
}

/**
 * Creates a mock NextRequest using the NextRequest class.
 * Use this when the route handler expects NextRequest-specific features.
 */
export async function createNextRequest(
  url: string,
  options: MockRequestOptions = {}
): Promise<Request> {
  // For now, return a standard Request since NextRequest extends it
  // Routes that need NextRequest features can import it directly
  return createMockRequest(url, options);
}

/**
 * Parses a Response and returns the JSON body with type safety.
 */
export async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) {
    throw new Error('Response body is empty');
  }
  return JSON.parse(text) as T;
}

/**
 * Type-safe assertion helpers for API responses
 */
export const assertResponse = {
  /**
   * Asserts that the response is a successful API response
   */
  async isSuccess<T>(
    response: Response,
    expectedStatus = 200
  ): Promise<ApiResponse<T>> {
    const status = response.status;
    if (status !== expectedStatus) {
      const body = await response.text();
      throw new Error(
        `Expected status ${expectedStatus}, got ${status}. Body: ${body}`
      );
    }

    const body = await parseJsonResponse<ApiResponse<T>>(response);

    if (!body.success) {
      throw new Error(
        `Expected success response, got error: ${JSON.stringify(body.error)}`
      );
    }

    return body;
  },

  /**
   * Asserts that the response is an error API response
   */
  async isError(
    response: Response,
    expectedStatus: number,
    expectedCode?: string
  ): Promise<ApiError> {
    const status = response.status;
    if (status !== expectedStatus) {
      const body = await response.text();
      throw new Error(
        `Expected status ${expectedStatus}, got ${status}. Body: ${body}`
      );
    }

    const body = await parseJsonResponse<ApiResponse<unknown>>(response);

    if (body.success) {
      throw new Error('Expected error response, got success');
    }

    if (!body.error) {
      throw new Error('Error response missing error field');
    }

    if (expectedCode && body.error.code !== expectedCode) {
      throw new Error(
        `Expected error code "${expectedCode}", got "${body.error.code}"`
      );
    }

    return body.error;
  },

  /**
   * Asserts that the response has specific headers
   */
  hasHeaders(response: Response, expectedHeaders: Record<string, string>): void {
    Object.entries(expectedHeaders).forEach(([key, value]) => {
      const actual = response.headers.get(key);
      if (actual !== value) {
        throw new Error(
          `Expected header "${key}" to be "${value}", got "${actual}"`
        );
      }
    });
  },
};

/**
 * Mock database client factory.
 * Creates a mock database client for testing API routes without database access.
 *
 * @example
 * ```typescript
 * const mockDb = createMockDbClient({
 *   users: [{ id: '1', name: 'Test User' }],
 *   sessions: []
 * });
 *
 * vi.mock('@/lib/db', () => ({ db: mockDb }));
 * ```
 */
export function createMockDbClient<T extends Record<string, unknown[]>>(
  initialData: T = {} as T
) {
  const store = new Map<string, unknown[]>();

  // Initialize store with provided data
  Object.entries(initialData).forEach(([table, rows]) => {
    store.set(table, [...rows]);
  });

  return {
    /**
     * Mock select query
     */
    select: vi.fn().mockImplementation(() => ({
      from: vi.fn().mockImplementation((table: string) => ({
        where: vi.fn().mockImplementation(() => ({
          execute: vi.fn().mockResolvedValue(store.get(table) ?? []),
        })),
        execute: vi.fn().mockResolvedValue(store.get(table) ?? []),
      })),
    })),

    /**
     * Mock insert query
     */
    insert: vi.fn().mockImplementation(() => ({
      values: vi.fn().mockImplementation((data: unknown) => ({
        returning: vi.fn().mockResolvedValue([data]),
        execute: vi.fn().mockResolvedValue({ rowCount: 1 }),
      })),
    })),

    /**
     * Mock update query
     */
    update: vi.fn().mockImplementation(() => ({
      set: vi.fn().mockImplementation(() => ({
        where: vi.fn().mockImplementation(() => ({
          returning: vi.fn().mockResolvedValue([]),
          execute: vi.fn().mockResolvedValue({ rowCount: 1 }),
        })),
      })),
    })),

    /**
     * Mock delete query
     */
    delete: vi.fn().mockImplementation(() => ({
      where: vi.fn().mockImplementation(() => ({
        execute: vi.fn().mockResolvedValue({ rowCount: 1 }),
      })),
    })),

    /**
     * Access to raw store for test assertions
     */
    _store: store,

    /**
     * Reset all mock data
     */
    _reset: (data: T = {} as T) => {
      store.clear();
      Object.entries(data).forEach(([table, rows]) => {
        store.set(table, [...rows]);
      });
    },
  };
}

/**
 * Creates a mock authenticated user context for testing protected routes.
 */
export function createMockAuthContext(overrides: Partial<MockAuthContext> = {}): MockAuthContext {
  return {
    userId: 'test-user-123',
    email: 'test@example.com',
    role: 'patient',
    ...overrides,
  };
}

export interface MockAuthContext {
  userId: string;
  email: string;
  role: 'patient' | 'pt' | 'admin';
}

/**
 * Creates Authorization header with a mock JWT token.
 * For testing auth middleware - does not create a real JWT.
 */
export function createMockAuthHeader(userId = 'test-user-123'): Record<string, string> {
  return {
    Authorization: `Bearer mock-jwt-token-${userId}`,
  };
}

/**
 * Helper to create a standard JSON Response for route handlers.
 */
export function createJsonResponse<T>(
  data: ApiResponse<T>,
  status = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Helper to create an error Response for route handlers.
 */
export function createErrorResponse(
  code: string,
  message: string,
  status = 400,
  details?: Record<string, unknown>
): Response {
  const body: ApiResponse<never> = {
    success: false,
    error: { code, message, details },
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Wait for a specified number of milliseconds.
 * Useful for testing async behavior in routes.
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates a mock for the request context params in App Router.
 * Used for dynamic route segments like /api/users/[id].
 */
export function createMockRouteContext<T extends Record<string, string>>(
  params: T
): { params: Promise<T> } {
  return {
    params: Promise.resolve(params),
  };
}
