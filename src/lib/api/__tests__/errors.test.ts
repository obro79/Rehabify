import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import {
  ErrorCode,
  APIError,
  handleAPIError,
  Errors,
  ERROR_STATUS_MAP,
} from '../errors';

describe('ErrorCode', () => {
  it('has all required error codes', () => {
    expect(ErrorCode.UNAUTHORIZED).toBe('UNAUTHORIZED');
    expect(ErrorCode.FORBIDDEN).toBe('FORBIDDEN');
    expect(ErrorCode.NOT_FOUND).toBe('NOT_FOUND');
    expect(ErrorCode.BAD_REQUEST).toBe('BAD_REQUEST');
    expect(ErrorCode.CONFLICT).toBe('CONFLICT');
    expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    expect(ErrorCode.RATE_LIMITED).toBe('RATE_LIMITED');
    expect(ErrorCode.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
  });
});

describe('ERROR_STATUS_MAP', () => {
  it('maps error codes to correct HTTP status codes', () => {
    expect(ERROR_STATUS_MAP[ErrorCode.UNAUTHORIZED]).toBe(401);
    expect(ERROR_STATUS_MAP[ErrorCode.FORBIDDEN]).toBe(403);
    expect(ERROR_STATUS_MAP[ErrorCode.NOT_FOUND]).toBe(404);
    expect(ERROR_STATUS_MAP[ErrorCode.BAD_REQUEST]).toBe(400);
    expect(ERROR_STATUS_MAP[ErrorCode.CONFLICT]).toBe(409);
    expect(ERROR_STATUS_MAP[ErrorCode.VALIDATION_ERROR]).toBe(422);
    expect(ERROR_STATUS_MAP[ErrorCode.RATE_LIMITED]).toBe(429);
    expect(ERROR_STATUS_MAP[ErrorCode.INTERNAL_ERROR]).toBe(500);
  });
});

describe('APIError', () => {
  it('creates error with code, message, and default status', () => {
    const error = new APIError(ErrorCode.NOT_FOUND, 'User not found');

    expect(error.code).toBe(ErrorCode.NOT_FOUND);
    expect(error.message).toBe('User not found');
    expect(error.status).toBe(404);
    expect(error.details).toBeUndefined();
    expect(error.name).toBe('APIError');
  });

  it('allows custom status code override', () => {
    const error = new APIError(ErrorCode.BAD_REQUEST, 'Custom error', 418);

    expect(error.status).toBe(418);
  });

  it('includes details when provided', () => {
    const details = { field: 'email', reason: 'invalid format' };
    const error = new APIError(
      ErrorCode.VALIDATION_ERROR,
      'Validation failed',
      422,
      details
    );

    expect(error.details).toEqual(details);
  });

  it('serializes to correct JSON format', () => {
    const error = new APIError(
      ErrorCode.VALIDATION_ERROR,
      'Validation failed',
      422,
      { fields: { email: ['Invalid email'] } }
    );

    const json = error.toJSON();

    expect(json).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: { fields: { email: ['Invalid email'] } },
      },
    });
  });

  it('omits details from JSON when not provided', () => {
    const error = new APIError(ErrorCode.NOT_FOUND, 'Not found');
    const json = error.toJSON();

    expect(json).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Not found',
      },
    });
    expect('details' in json.error).toBe(false);
  });

  it('is instanceof Error', () => {
    const error = new APIError(ErrorCode.INTERNAL_ERROR, 'Server error');
    expect(error instanceof Error).toBe(true);
  });
});

describe('handleAPIError', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('handles APIError and returns correct NextResponse', async () => {
    const apiError = new APIError(ErrorCode.NOT_FOUND, 'Resource not found');
    const response = handleAPIError(apiError);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found',
      },
    });
  });

  it('handles APIError with details', async () => {
    const apiError = new APIError(
      ErrorCode.VALIDATION_ERROR,
      'Validation failed',
      422,
      { fields: { name: ['Required'] } }
    );
    const response = handleAPIError(apiError);

    expect(response.status).toBe(422);

    const body = await response.json();
    expect(body.error.details).toEqual({ fields: { name: ['Required'] } });
  });

  it('handles unknown errors and returns 500', async () => {
    const unknownError = new Error('Something went wrong');
    const response = handleAPIError(unknownError);

    expect(response.status).toBe(500);

    const body = await response.json();
    expect(body).toEqual({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  });

  it('logs unknown errors to console', () => {
    const unknownError = new Error('Database connection failed');
    handleAPIError(unknownError);

    expect(console.error).toHaveBeenCalledWith(
      'Unhandled API error:',
      unknownError
    );
  });

  it('does not expose internal error details to client', async () => {
    const sensitiveError = new Error('Database password is incorrect');
    const response = handleAPIError(sensitiveError);

    const body = await response.json();
    expect(body.error.message).toBe('An unexpected error occurred');
    expect(body.error.message).not.toContain('password');
  });
});

describe('Errors helpers', () => {
  it('creates unauthorized error', () => {
    const error = Errors.unauthorized();
    expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
    expect(error.message).toBe('Authentication required');
    expect(error.status).toBe(401);
  });

  it('creates unauthorized error with custom message', () => {
    const error = Errors.unauthorized('Token expired');
    expect(error.message).toBe('Token expired');
  });

  it('creates forbidden error', () => {
    const error = Errors.forbidden();
    expect(error.code).toBe(ErrorCode.FORBIDDEN);
    expect(error.message).toBe('Access denied');
    expect(error.status).toBe(403);
  });

  it('creates notFound error with resource name', () => {
    const error = Errors.notFound('User');
    expect(error.code).toBe(ErrorCode.NOT_FOUND);
    expect(error.message).toBe('User not found');
    expect(error.status).toBe(404);
  });

  it('creates badRequest error', () => {
    const error = Errors.badRequest('Invalid input');
    expect(error.code).toBe(ErrorCode.BAD_REQUEST);
    expect(error.message).toBe('Invalid input');
    expect(error.status).toBe(400);
  });

  it('creates conflict error', () => {
    const error = Errors.conflict('Email already exists');
    expect(error.code).toBe(ErrorCode.CONFLICT);
    expect(error.message).toBe('Email already exists');
    expect(error.status).toBe(409);
  });

  it('creates validation error with details', () => {
    const error = Errors.validation('Invalid data', {
      fields: { email: ['Invalid format'] },
    });
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.message).toBe('Invalid data');
    expect(error.status).toBe(422);
    expect(error.details).toEqual({ fields: { email: ['Invalid format'] } });
  });

  it('creates rateLimited error', () => {
    const error = Errors.rateLimited();
    expect(error.code).toBe(ErrorCode.RATE_LIMITED);
    expect(error.message).toBe('Too many requests');
    expect(error.status).toBe(429);
  });

  it('creates internal error', () => {
    const error = Errors.internal();
    expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
    expect(error.message).toBe('An unexpected error occurred');
    expect(error.status).toBe(500);
  });
});
