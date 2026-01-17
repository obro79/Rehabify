import { NextResponse } from 'next/server';

/**
 * Standard API error codes matching the API contract.
 * Each code maps to a specific HTTP status code.
 */
export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  BAD_REQUEST = 'BAD_REQUEST',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/**
 * Maps error codes to their default HTTP status codes.
 */
export const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.BAD_REQUEST]: 400,
  [ErrorCode.CONFLICT]: 409,
  [ErrorCode.VALIDATION_ERROR]: 422,
  [ErrorCode.RATE_LIMITED]: 429,
  [ErrorCode.INTERNAL_ERROR]: 500,
};

/**
 * Custom API error class for consistent error handling.
 * Extends Error with code, status, and optional details.
 */
export class APIError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message: string,
    status?: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.status = status ?? ERROR_STATUS_MAP[code];
    this.details = details;

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, APIError);
    }
  }

  /**
   * Converts the error to the standard API error response format.
   */
  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
    };
  }
}

/**
 * Centralized error handler for API routes.
 * Catches APIError and unknown errors, returns appropriate NextResponse.
 *
 * @param error - The error to handle
 * @returns NextResponse with appropriate status and error body
 */
export function handleAPIError(error: unknown): NextResponse {
  // Handle known API errors
  if (error instanceof APIError) {
    return NextResponse.json(error.toJSON(), { status: error.status });
  }

  // Log unknown errors for debugging (never expose to client)
  console.error('Unhandled API error:', error);

  // Return generic internal error
  return NextResponse.json(
    {
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
      },
    },
    { status: 500 }
  );
}

/**
 * Helper to create common errors quickly.
 */
export const Errors = {
  unauthorized: (message = 'Authentication required') =>
    new APIError(ErrorCode.UNAUTHORIZED, message),

  forbidden: (message = 'Access denied') =>
    new APIError(ErrorCode.FORBIDDEN, message),

  notFound: (resource = 'Resource') =>
    new APIError(ErrorCode.NOT_FOUND, `${resource} not found`),

  badRequest: (message: string) =>
    new APIError(ErrorCode.BAD_REQUEST, message),

  conflict: (message: string) =>
    new APIError(ErrorCode.CONFLICT, message),

  validation: (message: string, details?: Record<string, unknown>) =>
    new APIError(ErrorCode.VALIDATION_ERROR, message, 422, details),

  rateLimited: (message = 'Too many requests') =>
    new APIError(ErrorCode.RATE_LIMITED, message),

  internal: (message = 'An unexpected error occurred') =>
    new APIError(ErrorCode.INTERNAL_ERROR, message),
};
