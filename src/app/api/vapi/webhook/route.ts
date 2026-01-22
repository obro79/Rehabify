/**
 * Vapi Webhook Route
 *
 * Handles incoming webhook events from Vapi platform.
 * Primary use: Tool calls from the AI assistant.
 *
 * Tools implemented:
 * - get_form_status: Returns current form data from session state
 * - get_exercise_info: Returns exercise instructions and cues
 * - log_pain_report: Logs pain and returns recommendation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSessionState } from '../../session-state/route';
import exercisesData from '@/lib/exercises/data.json';
import {
  type VapiWebhookPayload,
  type ToolHandler,
  processToolCalls,
  extractCallMetadata,
  createHealthCheckResponse,
} from '@/lib/vapi';

/**
 * Extract key coaching cues from exercise data
 */
function extractKeyCues(exercise: (typeof exercisesData.exercises)[0]): string[] {
  // Extract important cues from instructions
  const cues: string[] = [];

  // First instruction often contains setup
  if (exercise.instructions[0]) {
    cues.push(exercise.instructions[0]);
  }

  // Look for breathing cues
  const breathingCue = exercise.instructions.find(
    (i) => i.toLowerCase().includes('inhale') || i.toLowerCase().includes('exhale')
  );
  if (breathingCue) {
    cues.push(breathingCue);
  }

  // Add hold instruction if relevant
  if (exercise.default_hold_seconds && exercise.default_hold_seconds > 0) {
    const holdCue = exercise.instructions.find((i) =>
      i.toLowerCase().includes('hold')
    );
    if (holdCue) {
      cues.push(holdCue);
    }
  }

  return cues;
}

/**
 * get_form_status tool handler
 * Returns current form data from session state
 */
const handleGetFormStatus: ToolHandler = async (_args, context) => {
  const { sessionId } = context;

  if (!sessionId) {
    return {
      error: 'No session ID available',
      isTracking: false,
      formScore: 0,
      issues: [],
    };
  }

  const state = getSessionState(sessionId);

  if (!state) {
    return {
      error: 'Session not found',
      sessionId,
      isTracking: false,
      formScore: 0,
      issues: [],
    };
  }

  return {
    exercise: state.exerciseId,
    exerciseName: state.exerciseName,
    currentPhase: state.phase,
    repCount: state.repCount,
    targetReps: state.targetReps,
    formScore: state.formScore,
    issues: state.activeErrors,
    isTracking: state.isTracking ?? true,
    lastUpdated: state.updatedAt,
  };
};

/**
 * get_exercise_info tool handler
 * Returns exercise instructions and cues
 */
const handleGetExerciseInfo: ToolHandler = async (args) => {
  // Fallback to bodyweight-squat if no ID provided
  const targetId = (args.exercise_id as string) || 'bodyweight-squat';

  const exercise = exercisesData.exercises.find(
    (ex) => ex.id === targetId || ex.slug === targetId
  );

  if (!exercise) {
    return { error: `Exercise not found: ${targetId}` };
  }

  return {
    id: exercise.id,
    name: exercise.name,
    description: exercise.description,
    instructions: exercise.instructions,
    commonMistakes: exercise.common_mistakes,
    keyCues: extractKeyCues(exercise),
    modifications: exercise.modifications,
    defaultReps: exercise.default_reps,
    defaultHoldSeconds: exercise.default_hold_seconds,
    phases: exercise.detection_config?.phases,
  };
};

/**
 * log_pain_report tool handler
 * Logs pain report and returns recommendation
 */
const handleLogPainReport: ToolHandler = async (args, _context) => {
  const painLevel = args.pain_level as number;
  const location = args.location as string;

  // Validate required fields
  if (typeof painLevel !== 'number' || !location) {
    return { error: 'pain_level (number) and location (string) required' };
  }

  // TODO: In production, save to database
  // const { sessionId } = context;
  // await db.painReports.create({ sessionId, exerciseId, painLevel, location, notes });

  // Determine recommendation based on pain level
  let recommendation: 'continue' | 'modify' | 'stop';
  let message: string;

  if (painLevel >= 7) {
    recommendation = 'stop';
    message = 'Pain level is high. Please stop the exercise immediately and rest.';
  } else if (painLevel >= 4) {
    recommendation = 'modify';
    message = 'Consider reducing range of motion or taking a break.';
  } else {
    recommendation = 'continue';
    message = 'Mild discomfort is normal. Continue with awareness.';
  }

  return {
    logged: true,
    painLevel,
    location,
    recommendation,
    message,
    timestamp: Date.now(),
  };
};

/**
 * Tool handlers map
 */
const toolHandlers: Record<string, ToolHandler> = {
  get_form_status: handleGetFormStatus,
  get_exercise_info: handleGetExerciseInfo,
  log_pain_report: handleLogPainReport,
};

/**
 * Handle tool calls from Vapi assistant
 */
async function handleToolCalls(body: VapiWebhookPayload): Promise<NextResponse> {
  const toolCalls = body.message?.toolCalls || [];
  const { sessionId, callId, metadata } = extractCallMetadata(body);

  const results = await processToolCalls(toolCalls, toolHandlers, {
    sessionId,
    callId,
    metadata,
  });

  return NextResponse.json({ results });
}

/**
 * POST /api/vapi/webhook
 * Handle Vapi webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const body: VapiWebhookPayload = await request.json();

    // Handle different message types
    const messageType = body.message?.type;

    switch (messageType) {
      case 'tool-calls':
        return handleToolCalls(body);

      case 'transcript':
        return NextResponse.json({ success: true });

      case 'end-of-call-report':
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('[vapi-webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/vapi/webhook
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json(createHealthCheckResponse('vapi-webhook'));
}
