/**
 * Health Check API Route Tests
 *
 * Tests for GET /api/health endpoint.
 * Demonstrates the API testing pattern for App Router routes.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '@/app/api/health/route';
import { assertResponse, parseJsonResponse } from '../test-utils';
import type { ApiResponse } from '@/types';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
}

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 status code', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
  });

  it('returns success response with health data', async () => {
    const response = await GET();
    const body = await parseJsonResponse<ApiResponse<HealthStatus>>(response);

    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(body.data?.status).toBe('healthy');
  });

  it('includes timestamp in response', async () => {
    const response = await GET();
    const body = await parseJsonResponse<ApiResponse<HealthStatus>>(response);

    expect(body.data?.timestamp).toBeDefined();
    // Verify timestamp is a valid ISO string
    const timestamp = new Date(body.data?.timestamp ?? '');
    expect(timestamp.getTime()).not.toBeNaN();
  });

  it('includes version in response', async () => {
    const response = await GET();
    const body = await parseJsonResponse<ApiResponse<HealthStatus>>(response);

    expect(body.data?.version).toBeDefined();
    expect(typeof body.data?.version).toBe('string');
  });

  it('returns JSON content type', async () => {
    const response = await GET();
    const contentType = response.headers.get('content-type');

    expect(contentType).toContain('application/json');
  });

  it('can be verified with assertResponse helper', async () => {
    const response = await GET();
    const body = await assertResponse.isSuccess<HealthStatus>(response, 200);

    expect(body.data?.status).toBe('healthy');
  });
});
