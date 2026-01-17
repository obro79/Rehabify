import { describe, it, expect } from 'vitest';
import { NextResponse } from 'next/server';
import { success, error, paginated, noContent, getPaginationParams } from '../response';
import { ErrorCode } from '../errors';

describe('success', () => {
  it('returns NextResponse with data wrapper', async () => {
    const data = { id: '123', name: 'Test' };
    const response = success(data);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual({ data: { id: '123', name: 'Test' } });
  });

  it('allows custom status code', async () => {
    const response = success({ created: true }, 201);

    expect(response.status).toBe(201);

    const body = await response.json();
    expect(body).toEqual({ data: { created: true } });
  });

  it('handles null data', async () => {
    const response = success(null);

    const body = await response.json();
    expect(body).toEqual({ data: null });
  });

  it('handles array data', async () => {
    const items = [{ id: 1 }, { id: 2 }];
    const response = success(items);

    const body = await response.json();
    expect(body).toEqual({ data: [{ id: 1 }, { id: 2 }] });
  });

  it('handles complex nested objects', async () => {
    const complexData = {
      user: {
        id: '1',
        profile: {
          name: 'Test',
          settings: { theme: 'dark' },
        },
      },
    };
    const response = success(complexData);

    const body = await response.json();
    expect(body.data).toEqual(complexData);
  });
});

describe('error', () => {
  it('returns error with code and message', async () => {
    const response = error(ErrorCode.NOT_FOUND, 'User not found');

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'User not found',
      },
    });
  });

  it('uses ERROR_STATUS_MAP for default status', async () => {
    const response = error(ErrorCode.UNAUTHORIZED, 'Not authenticated');
    expect(response.status).toBe(401);

    const response2 = error(ErrorCode.FORBIDDEN, 'Access denied');
    expect(response2.status).toBe(403);

    const response3 = error(ErrorCode.VALIDATION_ERROR, 'Invalid data');
    expect(response3.status).toBe(422);
  });

  it('allows custom status code override', async () => {
    const response = error(ErrorCode.BAD_REQUEST, 'Custom error', 418);

    expect(response.status).toBe(418);
  });

  it('includes details when provided', async () => {
    const details = { fields: { email: ['Invalid format'] } };
    const response = error(ErrorCode.VALIDATION_ERROR, 'Validation failed', 422, details);

    const body = await response.json();
    expect(body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: { fields: { email: ['Invalid format'] } },
      },
    });
  });

  it('omits details when not provided', async () => {
    const response = error(ErrorCode.NOT_FOUND, 'Not found');

    const body = await response.json();
    expect('details' in body.error).toBe(false);
  });
});

describe('paginated', () => {
  it('returns paginated response with correct structure', async () => {
    const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const response = paginated(data, { total: 10, limit: 3, offset: 0 });

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual({
      data: [{ id: 1 }, { id: 2 }, { id: 3 }],
      pagination: {
        total: 10,
        limit: 3,
        offset: 0,
        hasMore: true,
      },
    });
  });

  it('calculates hasMore correctly when more items exist', async () => {
    const data = [{ id: 1 }, { id: 2 }];
    const response = paginated(data, { total: 10, limit: 2, offset: 0 });

    const body = await response.json();
    expect(body.pagination.hasMore).toBe(true);
  });

  it('calculates hasMore correctly when on last page', async () => {
    const data = [{ id: 9 }, { id: 10 }];
    const response = paginated(data, { total: 10, limit: 2, offset: 8 });

    const body = await response.json();
    expect(body.pagination.hasMore).toBe(false);
  });

  it('handles empty data array', async () => {
    const response = paginated([], { total: 0, limit: 20, offset: 0 });

    const body = await response.json();
    expect(body.data).toEqual([]);
    expect(body.pagination.hasMore).toBe(false);
  });

  it('handles partial last page', async () => {
    const data = [{ id: 6 }];
    const response = paginated(data, { total: 6, limit: 5, offset: 5 });

    const body = await response.json();
    expect(body.pagination.hasMore).toBe(false);
  });
});

describe('noContent', () => {
  it('returns 204 status with no body', async () => {
    const response = noContent();

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(204);
    expect(response.body).toBeNull();
  });
});

describe('getPaginationParams', () => {
  function createRequest(url: string): Request {
    return new Request(url);
  }

  it('returns default values when no params provided', () => {
    const request = createRequest('http://localhost/api/items');
    const { limit, offset } = getPaginationParams(request);

    expect(limit).toBe(20);
    expect(offset).toBe(0);
  });

  it('parses limit and offset from query params', () => {
    const request = createRequest('http://localhost/api/items?limit=10&offset=50');
    const { limit, offset } = getPaginationParams(request);

    expect(limit).toBe(10);
    expect(offset).toBe(50);
  });

  it('respects custom default limit', () => {
    const request = createRequest('http://localhost/api/items');
    const { limit } = getPaginationParams(request, { limit: 50 });

    expect(limit).toBe(50);
  });

  it('enforces maxLimit', () => {
    const request = createRequest('http://localhost/api/items?limit=500');
    const { limit } = getPaginationParams(request, { maxLimit: 100 });

    expect(limit).toBe(100);
  });

  it('enforces minimum limit of 1', () => {
    const request = createRequest('http://localhost/api/items?limit=-5');
    const { limit } = getPaginationParams(request);

    // Negative values are clamped to at least 1
    expect(limit).toBe(1);
  });

  it('enforces minimum offset of 0', () => {
    const request = createRequest('http://localhost/api/items?offset=-10');
    const { offset } = getPaginationParams(request);

    expect(offset).toBe(0);
  });

  it('handles invalid limit gracefully', () => {
    const request = createRequest('http://localhost/api/items?limit=invalid');
    const { limit } = getPaginationParams(request);

    expect(limit).toBe(20);
  });

  it('handles invalid offset gracefully', () => {
    const request = createRequest('http://localhost/api/items?offset=invalid');
    const { offset } = getPaginationParams(request);

    expect(offset).toBe(0);
  });
});
