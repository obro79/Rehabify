/**
 * Vapi Assessment Webhook Route
 *
 * Handles incoming webhook events from Vapi assessment workflows.
 * Processes variable extractions and tool calls specific to assessments.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  type VapiWebhookPayload,
  type ToolHandler,
  type ToolCallContext,
  processToolCalls,
  extractCallMetadata,
  createHealthCheckResponse,
} from "@/lib/vapi";

// In-memory storage for assessment data (would be database in production)
const assessmentDataStore = new Map<
  string,
  {
    callId: string;
    data: Record<string, unknown>;
    updatedAt: number;
  }
>();

/**
 * save_assessment_response tool handler
 * Saves assessment data for a specific phase
 */
const handleSaveAssessmentResponse: ToolHandler = async (args, context) => {
  const { callId } = context;
  const phase = args.phase as string;
  const data = args.data as Record<string, unknown>;

  if (!phase || !data) {
    return { error: "phase and data are required" };
  }

  if (callId) {
    const existing = assessmentDataStore.get(callId) || {
      callId,
      data: {},
      updatedAt: Date.now(),
    };

    existing.data[phase] = data;
    existing.updatedAt = Date.now();

    assessmentDataStore.set(callId, existing);
  }

  return {
    saved: true,
    phase,
    timestamp: Date.now(),
  };
};

/**
 * get_movement_screen_result tool handler
 * Returns movement screen results captured by vision system
 */
const handleGetMovementScreenResult: ToolHandler = async (_args, context) => {
  const { callId } = context;
  // In production, this would fetch from database or session state
  // For now, return placeholder data
  if (callId) {
    const assessmentData = assessmentDataStore.get(callId);
    if (assessmentData?.data.movementScreen) {
      return assessmentData.data.movementScreen as Record<string, unknown>;
    }
  }

  return {
    flexion: {
      romAngle: null,
      pain: null,
      note: "Awaiting vision data",
    },
    extension: {
      romAngle: null,
      pain: null,
      note: "Awaiting vision data",
    },
    sideBend: {
      leftAngle: null,
      rightAngle: null,
      pain: null,
      note: "Awaiting vision data",
    },
  };
};

/**
 * generate_rehab_plan tool handler
 * Triggers plan generation via Gemini API
 */
const handleGenerateRehabPlan: ToolHandler = async (_args, _context) => {
  // TODO: Call Gemini API to generate plan based on assessment data
  // const { callId } = context;
  // const assessmentData = await db.assessments.findById(assessmentId);
  // const plan = await generatePlanWithGemini(assessmentData);

  return {
    planGenerated: true,
    planId: `plan_${Date.now()}`,
    message: "Your personalized plan has been created",
    // In production, would include actual plan details
    summary: {
      focus: "Mobility and core stability",
      duration: "12 weeks",
      sessionsPerWeek: 3,
    },
  };
};

/**
 * flag_red_flag tool handler
 * Records a red flag and returns referral recommendation
 */
const handleFlagRedFlag: ToolHandler = async (args, context) => {
  const { callId } = context;
  const redFlagType = args.red_flag_type as string;
  const details = args.details as string;

  if (callId) {
    const existing = assessmentDataStore.get(callId) || {
      callId,
      data: {},
      updatedAt: Date.now(),
    };

    existing.data.redFlags = existing.data.redFlags || [];
    (existing.data.redFlags as unknown[]).push({
      type: redFlagType,
      details,
      timestamp: Date.now(),
    });
    existing.updatedAt = Date.now();

    assessmentDataStore.set(callId, existing);
  }

  return {
    flagged: true,
    redFlagType,
    recommendation: "medical_referral",
    message:
      "Based on this finding, we recommend seeking evaluation from a healthcare provider before starting exercises.",
  };
};

/**
 * start_movement_screen tool handler
 * Signals the client to activate camera for movement tests
 */
const handleStartMovementScreen: ToolHandler = async () => {
  // This tool is primarily a signal - the client will detect the node transition
  // and activate the camera accordingly
  return {
    started: true,
    message: "Camera should now be active for movement tests",
    tests: ["flexion", "extension", "sideBend"],
  };
};

/**
 * Tool handlers map for assessment webhook
 */
const toolHandlers: Record<string, ToolHandler> = {
  save_assessment_response: handleSaveAssessmentResponse,
  get_movement_screen_result: handleGetMovementScreenResult,
  generate_rehab_plan: handleGenerateRehabPlan,
  flag_red_flag: handleFlagRedFlag,
  start_movement_screen: handleStartMovementScreen,
};

/**
 * Handle tool calls from Vapi assistant
 */
async function handleToolCalls(
  body: VapiWebhookPayload,
  context: ToolCallContext
): Promise<NextResponse> {
  const toolCalls = body.message?.toolCalls || [];
  const results = await processToolCalls(toolCalls, toolHandlers, context);
  return NextResponse.json({ results });
}

/**
 * Handle end of call - finalize and persist assessment
 */
async function handleEndOfCall(callId: string | undefined): Promise<NextResponse> {
  if (!callId) {
    return NextResponse.json({ success: true });
  }

  const assessmentData = assessmentDataStore.get(callId);
  if (assessmentData) {
    // TODO: Persist to database
    // await db.assessments.create({
    //   callId,
    //   data: assessmentData.data,
    //   completedAt: new Date(),
    // });

    // Clean up in-memory storage
    assessmentDataStore.delete(callId);
  }

  return NextResponse.json({ success: true });
}

/**
 * Handle workflow node transitions
 */
async function handleNodeTransition(
  body: VapiWebhookPayload,
  callId: string | undefined
): Promise<NextResponse> {
  const nodeId = body.message?.node?.id;
  const extractedVariables = body.message?.extractedVariables;

  if (callId && extractedVariables && Object.keys(extractedVariables).length > 0) {
    // Store extracted variables
    const existing = assessmentDataStore.get(callId) || {
      callId,
      data: {},
      updatedAt: Date.now(),
    };

    // Merge new variables into existing data
    existing.data = {
      ...existing.data,
      [nodeId || "unknown"]: extractedVariables,
    };
    existing.updatedAt = Date.now();

    assessmentDataStore.set(callId, existing);
  }

  return NextResponse.json({ success: true });
}

/**
 * Handle save_assessment_response from direct API request
 * Body contains: phase, chiefComplaint, pain, functional, history
 */
async function handleSaveAssessmentResponseDirect(
  callId: string | undefined,
  body: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const phase = body.phase as string;

  if (callId) {
    const existing = assessmentDataStore.get(callId) || {
      callId,
      data: {},
      updatedAt: Date.now(),
    };

    // Store each section from the body
    if (body.chiefComplaint) existing.data.chiefComplaint = body.chiefComplaint;
    if (body.pain) existing.data.pain = body.pain;
    if (body.functional) existing.data.functional = body.functional;
    if (body.history) existing.data.history = body.history;
    if (body.flexionPain) existing.data.flexionPain = body.flexionPain;
    if (body.extensionPain) existing.data.extensionPain = body.extensionPain;
    if (body.sidebendPain) existing.data.sidebendPain = body.sidebendPain;

    existing.updatedAt = Date.now();
    assessmentDataStore.set(callId, existing);
  }

  return {
    saved: true,
    phase,
    timestamp: Date.now(),
  };
}

/**
 * Handle direct apiRequest calls from Vapi workflow nodes
 * These come with "function" at the top level of the body
 */
async function handleDirectApiRequest(
  body: Record<string, unknown>
): Promise<NextResponse> {
  const functionName = body.function as string;
  const callId = body.callId as string | undefined;
  const context: ToolCallContext = { callId };

  switch (functionName) {
    case "save_assessment_response": {
      const result = await handleSaveAssessmentResponseDirect(callId, body);
      return NextResponse.json(result);
    }

    case "get_movement_screen_result": {
      const result = await handleGetMovementScreenResult({}, context);
      return NextResponse.json(result);
    }

    case "generate_rehab_plan": {
      const result = await handleGenerateRehabPlan(body, context);
      return NextResponse.json(result);
    }

    case "flag_red_flag": {
      const result = await handleFlagRedFlag(body, context);
      return NextResponse.json(result);
    }

    case "start_movement_screen": {
      const result = await handleStartMovementScreen({}, context);
      return NextResponse.json(result);
    }

    default:
      return NextResponse.json({ error: `Unknown function: ${functionName}` });
  }
}

/**
 * POST /api/vapi/assessment-webhook
 * Handle Vapi assessment webhook events
 *
 * Supports two formats:
 * 1. Direct apiRequest from workflow nodes (has "function" field at top level)
 * 2. Standard Vapi webhook events (has "message.type" field)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if this is a direct apiRequest from workflow (has "function" at top level)
    if (body.function && typeof body.function === "string") {
      return handleDirectApiRequest(body);
    }

    // Otherwise, handle as standard Vapi webhook event
    const vapiBody = body as VapiWebhookPayload;
    const messageType = vapiBody.message?.type;
    const { callId, sessionId, metadata } = extractCallMetadata(vapiBody);

    switch (messageType) {
      case "tool-calls":
        return handleToolCalls(vapiBody, { callId, sessionId, metadata });

      case "workflow-node-started":
        return handleNodeTransition(vapiBody, callId);

      case "transcript":
        return NextResponse.json({ success: true });

      case "end-of-call-report":
        return handleEndOfCall(callId);

      default:
        return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error("[assessment-webhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/vapi/assessment-webhook
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json(
    createHealthCheckResponse("vapi-assessment-webhook", {
      activeAssessments: assessmentDataStore.size,
    })
  );
}
