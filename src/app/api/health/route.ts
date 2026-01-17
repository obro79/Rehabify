/**
 * Health Check API Route
 *
 * Simple endpoint to verify the API is running.
 * Used by monitoring services and load balancers.
 *
 * GET /api/health
 */

import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/types';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
}

export async function GET(): Promise<NextResponse<ApiResponse<HealthStatus>>> {
  const response: ApiResponse<HealthStatus> = {
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '0.0.0',
    },
  };

  return NextResponse.json(response);
}
