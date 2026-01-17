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

// Types for Vapi webhook payloads
interface VapiToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

interface VapiWebhookPayload {
  message?: {
    type: 'tool-calls' | 'transcript' | 'end-of-call-report' | string;
    toolCalls?: VapiToolCall[];
    role?: string;
    transcript?: string;
    call?: {
      id: string;
      metadata?: Record<string, unknown>;
    };
  };
  call?: {
    id: string;
    metadata?: Record<string, unknown>;
  };
}

interface ToolResult {
  toolCallId: string;
  result: string;
}

/**
 * POST /api/vapi/webhook
 * Handle Vapi webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const body: VapiWebhookPayload = await request.json();
    console.log('[vapi-webhook] Received:', JSON.stringify(body, null, 2));

    // Handle different message types
    const messageType = body.message?.type;

    switch (messageType) {
      case 'tool-calls':
        return handleToolCalls(body);

      case 'transcript':
        // Log transcripts for debugging
        console.log(
          `[vapi-webhook] Transcript [${body.message?.role}]: ${body.message?.transcript}`
        );
        return NextResponse.json({ success: true });

      case 'end-of-call-report':
        console.log('[vapi-webhook] Call ended:', body.message);
        return NextResponse.json({ success: true });

      default:
        // Unknown message type - acknowledge anyway
        console.log('[vapi-webhook] Unknown message type:', messageType);
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
 * Handle tool calls from Vapi assistant
 */
async function handleToolCalls(body: VapiWebhookPayload): Promise<NextResponse> {
  const toolCalls = body.message?.toolCalls || [];
  const callMetadata = body.message?.call?.metadata || body.call?.metadata || {};
  const sessionId = callMetadata.sessionId as string | undefined;

  const results: ToolResult[] = await Promise.all(
    toolCalls.map(async (call) => {
      const { name, arguments: argsString } = call.function;
      let args: Record<string, unknown> = {};

      try {
        args = JSON.parse(argsString || '{}');
      } catch {
        console.warn('[vapi-webhook] Failed to parse arguments:', argsString);
      }

      console.log(`[vapi-webhook] Tool call: ${name}`, args);

      let result: Record<string, unknown>;

      switch (name) {
        case 'get_form_status':
          result = await handleGetFormStatus(sessionId);
          break;

        case 'get_exercise_info':
          result = await handleGetExerciseInfo(args.exercise_id as string);
          break;

        case 'log_pain_report':
          result = await handleLogPainReport(sessionId, args);
          break;

        default:
          result = { error: `Unknown tool: ${name}` };
      }

      return {
        toolCallId: call.id,
        result: JSON.stringify(result),
      };
    })
  );

  return NextResponse.json({ results });
}

/**
 * get_form_status tool handler
 * Returns current form data from session state
 */
async function handleGetFormStatus(
  sessionId: string | undefined
): Promise<Record<string, unknown>> {
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
}

/**
 * get_exercise_info tool handler
 * Returns exercise instructions and cues
 */
async function handleGetExerciseInfo(
  exerciseId: string | undefined
): Promise<Record<string, unknown>> {
  if (!exerciseId) {
    return { error: 'exercise_id required' };
  }

  const exercise = exercisesData.exercises.find(
    (ex) => ex.id === exerciseId || ex.slug === exerciseId
  );

  if (!exercise) {
    return { error: `Exercise not found: ${exerciseId}` };
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
}

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
 * log_pain_report tool handler
 * Logs pain report and returns recommendation
 */
async function handleLogPainReport(
  sessionId: string | undefined,
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const painLevel = args.pain_level as number;
  const location = args.location as string;
  const exerciseId = args.exercise_id as string;
  const notes = args.notes as string | undefined;

  // Validate required fields
  if (typeof painLevel !== 'number' || !location) {
    return { error: 'pain_level (number) and location (string) required' };
  }

  // Log the pain report
  console.log('[vapi-webhook] Pain report:', {
    sessionId,
    exerciseId,
    painLevel,
    location,
    notes,
    timestamp: Date.now(),
  });

  // TODO: In production, save to database
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
}

/**
 * GET /api/vapi/webhook
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'vapi-webhook',
    timestamp: new Date().toISOString(),
  });
}
