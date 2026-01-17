import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, withAuth, hasRole, assertRole, AuthenticatedUser } from '../auth';
import { APIError, ErrorCode } from '../errors';

// Mock requireAuth from @/lib/auth
vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(),
}));

import { requireAuth } from '@/lib/auth';

const mockRequireAuth = vi.mocked(requireAuth);

describe('getCurrentUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns authenticated user', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com', name: 'Test User' };
    mockRequireAuth.mockResolvedValue(mockUser);

    const user = await getCurrentUser();

    expect(user).toEqual(mockUser);
    expect(mockRequireAuth).toHaveBeenCalled();
  });

  it('throws UNAUTHORIZED when requireAuth fails', async () => {
    mockRequireAuth.mockRejectedValue(new Error('Not authenticated'));

    await expect(getCurrentUser()).rejects.toThrow(APIError);
    await expect(getCurrentUser()).rejects.toMatchObject({
      code: ErrorCode.UNAUTHORIZED,
      message: 'Authentication required',
    });
  });
});

describe('withAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createMockRequest(): NextRequest {
    return new NextRequest('http://localhost/api/test');
  }

  it('calls handler with user context when authenticated', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com', name: 'Test User' };
    mockRequireAuth.mockResolvedValue(mockUser);

    const handler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
    const wrappedHandler = withAuth(handler);

    const request = createMockRequest();
    const response = await wrappedHandler(request);

    expect(handler).toHaveBeenCalled();
    expect(handler.mock.calls[0][0]).toBe(request);
    expect(handler.mock.calls[0][1]).toHaveProperty('user');
    expect(handler.mock.calls[0][1].user.id).toBe('user-123');
    expect(response.status).toBe(200);
  });

  it('returns 401 when not authenticated', async () => {
    mockRequireAuth.mockRejectedValue(new Error('Not authenticated'));

    const handler = vi.fn();
    const wrappedHandler = withAuth(handler);

    const request = createMockRequest();
    const response = await wrappedHandler(request);

    expect(handler).not.toHaveBeenCalled();
    expect(response.status).toBe(401);

    const body = await response.json();
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('enforces role restriction', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com', role: 'patient' };
    mockRequireAuth.mockResolvedValue(mockUser);

    const handler = vi.fn();
    const wrappedHandler = withAuth(handler, { roles: ['admin'] });

    const request = createMockRequest();
    const response = await wrappedHandler(request);

    expect(handler).not.toHaveBeenCalled();
    expect(response.status).toBe(403);

    const body = await response.json();
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('allows access when user has required role', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com', role: 'admin' };
    mockRequireAuth.mockResolvedValue(mockUser);

    const handler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
    const wrappedHandler = withAuth(handler, { roles: ['admin'] });

    const request = createMockRequest();
    const response = await wrappedHandler(request);

    expect(handler).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('allows multiple roles', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com', role: 'pt' };
    mockRequireAuth.mockResolvedValue(mockUser);

    const handler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
    const wrappedHandler = withAuth(handler, { roles: ['pt', 'admin'] });

    const request = createMockRequest();
    const response = await wrappedHandler(request);

    expect(handler).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it('defaults to patient role when none specified', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' }; // No role
    mockRequireAuth.mockResolvedValue(mockUser);

    const handler = vi.fn().mockResolvedValue(NextResponse.json({ success: true }));
    const wrappedHandler = withAuth(handler, { roles: ['patient'] });

    const request = createMockRequest();
    const response = await wrappedHandler(request);

    expect(handler).toHaveBeenCalled();
    expect(response.status).toBe(200);

    // Verify user context has default role
    expect(handler.mock.calls[0][1].user.role).toBe('patient');
  });

  it('handles handler errors', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    mockRequireAuth.mockResolvedValue(mockUser);

    const handler = vi.fn().mockRejectedValue(
      new APIError(ErrorCode.NOT_FOUND, 'Resource not found')
    );
    const wrappedHandler = withAuth(handler);

    const request = createMockRequest();
    const response = await wrappedHandler(request);

    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('handles unexpected handler errors', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    mockRequireAuth.mockResolvedValue(mockUser);

    const handler = vi.fn().mockRejectedValue(new Error('Unexpected error'));
    const wrappedHandler = withAuth(handler);

    const request = createMockRequest();
    const response = await wrappedHandler(request);

    expect(response.status).toBe(500);

    const body = await response.json();
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});

describe('hasRole', () => {
  it('returns true when user has matching role', () => {
    const user: AuthenticatedUser = { id: '1', email: 'test@example.com', role: 'admin' };

    expect(hasRole(user, ['admin'])).toBe(true);
    expect(hasRole(user, ['admin', 'pt'])).toBe(true);
  });

  it('returns false when user lacks required role', () => {
    const user: AuthenticatedUser = { id: '1', email: 'test@example.com', role: 'patient' };

    expect(hasRole(user, ['admin'])).toBe(false);
    expect(hasRole(user, ['admin', 'pt'])).toBe(false);
  });

  it('defaults to patient role when not specified', () => {
    const user: AuthenticatedUser = { id: '1', email: 'test@example.com' }; // No role

    expect(hasRole(user, ['patient'])).toBe(true);
    expect(hasRole(user, ['admin'])).toBe(false);
  });
});

describe('assertRole', () => {
  it('does not throw when user has required role', () => {
    const user: AuthenticatedUser = { id: '1', email: 'test@example.com', role: 'admin' };

    expect(() => assertRole(user, ['admin'])).not.toThrow();
  });

  it('throws FORBIDDEN when user lacks required role', () => {
    const user: AuthenticatedUser = { id: '1', email: 'test@example.com', role: 'patient' };

    expect(() => assertRole(user, ['admin'])).toThrow(APIError);
    expect(() => assertRole(user, ['admin'])).toThrow(
      expect.objectContaining({
        code: ErrorCode.FORBIDDEN,
        message: 'You do not have permission to perform this action',
      })
    );
  });

  it('allows any of multiple roles', () => {
    const ptUser: AuthenticatedUser = { id: '1', email: 'test@example.com', role: 'pt' };
    const adminUser: AuthenticatedUser = { id: '2', email: 'admin@example.com', role: 'admin' };

    expect(() => assertRole(ptUser, ['pt', 'admin'])).not.toThrow();
    expect(() => assertRole(adminUser, ['pt', 'admin'])).not.toThrow();
  });
});
