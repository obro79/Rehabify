/**
 * Vapi Assessment Webhook Route
 *
 * Handles incoming webhook events from Vapi assessment workflows.
 * Processes variable extractions and tool calls specific to assessments.
 */

import { NextRequest, NextResponse } from "next/server";

// Types for Vapi webhook payloads
interface VapiToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

interface VapiWebhookPayload {
  message?: {
    type:
      | "tool-calls"
      | "transcript"
      | "end-of-call-report"
      | "workflow-node-started"
      | string;
    toolCalls?: VapiToolCall[];
    role?: string;
    transcript?: string;
    call?: {
      id: string;
      metadata?: Record<string, unknown>;
    };
    // Workflow-specific fields
    node?: {
      id: string;
      name?: string;
    };
    extractedVariables?: Record<string, unknown>;
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
    console.log(
      "[assessment-webhook] Received:",
      JSON.stringify(body, null, 2)
    );

    // Check if this is a direct apiRequest from workflow (has "function" at top level)
    if (body.function && typeof body.function === "string") {
      return handleDirectApiRequest(body);
    }

    // Otherwise, handle as standard Vapi webhook event
    const vapiBody = body as VapiWebhookPayload;
    const messageType = vapiBody.message?.type;
    const callId = vapiBody.message?.call?.id || vapiBody.call?.id;

    switch (messageType) {
      case "tool-calls":
        return handleToolCalls(vapiBody, callId);

      case "workflow-node-started":
        return handleNodeTransition(vapiBody, callId);

      case "transcript":
        console.log(
          `[assessment-webhook] Transcript [${vapiBody.message?.role}]: ${vapiBody.message?.transcript}`
        );
        return NextResponse.json({ success: true });

      case "end-of-call-report":
        console.log("[assessment-webhook] Call ended, finalizing assessment");
        return handleEndOfCall(vapiBody, callId);

      default:
        console.log("[assessment-webhook] Unknown message type:", messageType);
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
 * Handle direct apiRequest calls from Vapi workflow nodes
 * These come with "function" at the top level of the body
 */
async function handleDirectApiRequest(
  body: Record<string, unknown>
): Promise<NextResponse> {
  const functionName = body.function as string;
  const callId = body.callId as string | undefined;

  console.log(`[assessment-webhook] Direct API request: ${functionName}`);

  switch (functionName) {
    case "save_assessment_response": {
      const result = await handleSaveAssessmentResponseDirect(callId, body);
      return NextResponse.json(result);
    }

    case "get_movement_screen_result": {
      const result = await handleGetMovementScreenResult(callId);
      return NextResponse.json(result);
    }

    case "generate_rehab_plan": {
      const result = await handleGenerateRehabPlan(callId, body);
      return NextResponse.json(result);
    }

    case "flag_red_flag": {
      const result = await handleFlagRedFlag(callId, body);
      return NextResponse.json(result);
    }

    case "start_movement_screen": {
      const result = await handleStartMovementScreen(callId);
      return NextResponse.json(result);
    }

    default:
      console.log("[assessment-webhook] Unknown function:", functionName);
      return NextResponse.json({ error: `Unknown function: ${functionName}` });
  }
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

  console.log("[assessment-webhook] Saving interview data for phase:", phase);

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

    console.log("[assessment-webhook] Stored data:", JSON.stringify(existing.data, null, 2));
  }

  return {
    saved: true,
    phase,
    timestamp: Date.now(),
  };
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

  console.log("[assessment-webhook] Node transition:", nodeId);
  console.log("[assessment-webhook] Extracted variables:", extractedVariables);

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
    console.log("[assessment-webhook] Stored data for call:", callId);
  }

  return NextResponse.json({ success: true });
}

/**
 * Handle tool calls from Vapi assistant
 */
async function handleToolCalls(
  body: VapiWebhookPayload,
  callId: string | undefined
): Promise<NextResponse> {
  const toolCalls = body.message?.toolCalls || [];

  const results: ToolResult[] = await Promise.all(
    toolCalls.map(async (call) => {
      const { name, arguments: argsString } = call.function;
      let args: Record<string, unknown> = {};

      try {
        args = JSON.parse(argsString || "{}");
      } catch {
        console.warn(
          "[assessment-webhook] Failed to parse arguments:",
          argsString
        );
      }

      console.log(`[assessment-webhook] Tool call: ${name}`, args);

      let result: Record<string, unknown>;

      switch (name) {
        case "save_assessment_response":
          result = await handleSaveAssessmentResponse(callId, args);
          break;

        case "get_movement_screen_result":
          result = await handleGetMovementScreenResult(callId);
          break;

        case "generate_rehab_plan":
          result = await handleGenerateRehabPlan(callId, args);
          break;

        case "flag_red_flag":
          result = await handleFlagRedFlag(callId, args);
          break;

        case "start_movement_screen":
          result = await handleStartMovementScreen(callId);
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
 * Handle end of call - finalize and persist assessment
 */
async function handleEndOfCall(
  body: VapiWebhookPayload,
  callId: string | undefined
): Promise<NextResponse> {
  if (!callId) {
    return NextResponse.json({ success: true });
  }

  const assessmentData = assessmentDataStore.get(callId);
  if (assessmentData) {
    console.log(
      "[assessment-webhook] Final assessment data:",
      JSON.stringify(assessmentData, null, 2)
    );

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
 * save_assessment_response tool handler
 * Saves assessment data for a specific phase
 */
async function handleSaveAssessmentResponse(
  callId: string | undefined,
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
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
}

/**
 * get_movement_screen_result tool handler
 * Returns movement screen results captured by vision system
 */
async function handleGetMovementScreenResult(
  callId: string | undefined
): Promise<Record<string, unknown>> {
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
}

/**
 * generate_rehab_plan tool handler
 * Triggers plan generation via Gemini API
 */
async function handleGenerateRehabPlan(
  callId: string | undefined,
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const assessmentId = args.assessment_id as string;

  console.log("[assessment-webhook] Generating rehab plan for:", assessmentId);

  // TODO: Call Gemini API to generate plan based on assessment data
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
}

/**
 * flag_red_flag tool handler
 * Records a red flag and returns referral recommendation
 */
async function handleFlagRedFlag(
  callId: string | undefined,
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const redFlagType = args.red_flag_type as string;
  const details = args.details as string;

  console.log("[assessment-webhook] Red flag detected:", redFlagType, details);

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
}

/**
 * start_movement_screen tool handler
 * Signals the client to activate camera for movement tests
 */
async function handleStartMovementScreen(
  callId: string | undefined
): Promise<Record<string, unknown>> {
  console.log("[assessment-webhook] Starting movement screen for call:", callId);

  // This tool is primarily a signal - the client will detect the node transition
  // and activate the camera accordingly
  return {
    started: true,
    message: "Camera should now be active for movement tests",
    tests: ["flexion", "extension", "sideBend"],
  };
}

/**
 * GET /api/vapi/assessment-webhook
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: "healthy",
    service: "vapi-assessment-webhook",
    timestamp: new Date().toISOString(),
    activeAssessments: assessmentDataStore.size,
  });
}
