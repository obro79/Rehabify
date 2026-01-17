/**
 * Session State API Route
 *
 * Bridges client-side form state to webhook tool calls.
 * The webhook can't access client state directly, so clients sync here.
 *
 * POST: Update session state (called every 1 second from client)
 * GET: Retrieve state by sessionId (called by webhook tool handlers)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Session state schema
const sessionStateSchema = z.object({
  sessionId: z.string().min(1),
  exerciseId: z.string().min(1),
  exerciseName: z.string().optional(),
  formScore: z.number().min(0).max(100),
  activeErrors: z.array(z.string()),
  repCount: z.number().min(0),
  targetReps: z.number().min(0).optional(),
  phase: z.string(),
  isTracking: z.boolean().optional(),
});

export type SessionState = z.infer<typeof sessionStateSchema> & {
  updatedAt: number;
};

// In-memory store with TTL
const sessionStore = new Map<string, SessionState>();
const SESSION_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Cleanup expired sessions periodically
function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [sessionId, state] of sessionStore.entries()) {
    if (now - state.updatedAt > SESSION_TTL_MS) {
      sessionStore.delete(sessionId);
      console.log(`[session-state] Cleaned up expired session: ${sessionId}`);
    }
  }
}

// Run cleanup every minute
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredSessions, 60 * 1000);
}

/**
 * POST /api/session-state
 * Update session state (called by client during workout)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = sessionStateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Invalid session state',
          details: result.error.issues,
        },
        { status: 400 }
      );
    }

    const sessionState: SessionState = {
      ...result.data,
      updatedAt: Date.now(),
    };

    sessionStore.set(result.data.sessionId, sessionState);

    return NextResponse.json({
      success: true,
      sessionId: result.data.sessionId,
    });
  } catch (error) {
    console.error('[session-state] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to update session state' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/session-state?sessionId=xxx
 * Retrieve session state (called by webhook tool handlers)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId query parameter required' },
        { status: 400 }
      );
    }

    const state = sessionStore.get(sessionId);

    if (!state) {
      return NextResponse.json(
        { error: 'Session not found', sessionId },
        { status: 404 }
      );
    }

    // Check if state is stale (not updated in last 10 seconds)
    const isStale = Date.now() - state.updatedAt > 10 * 1000;

    return NextResponse.json({
      ...state,
      isStale,
    });
  } catch (error) {
    console.error('[session-state] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve session state' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/session-state?sessionId=xxx
 * Clean up session state when session ends
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId query parameter required' },
        { status: 400 }
      );
    }

    const existed = sessionStore.delete(sessionId);

    return NextResponse.json({
      success: true,
      existed,
    });
  } catch (error) {
    console.error('[session-state] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete session state' },
      { status: 500 }
    );
  }
}

// Export for testing and webhook access
export function getSessionState(sessionId: string): SessionState | undefined {
  return sessionStore.get(sessionId);
}
