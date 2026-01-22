// Assessment Webhook Tool Handlers

import type { ToolHandler } from "@/types/vapi-webhook";
import { DEFAULT_MOVEMENT_SCREEN, MOVEMENT_TESTS } from "./constants";
import {
  getOrCreateAssessment,
  getAssessment,
  saveAssessment,
  mergeAssessmentFields,
  addRedFlag,
} from "./store";

function handleSaveAssessmentResponse(
  callId: string | undefined,
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const phase = args.phase as string;
  const data = args.data as Record<string, unknown>;

  if (!phase || !data) {
    return Promise.resolve({ error: "phase and data are required" });
  }

  if (callId) {
    const assessment = getOrCreateAssessment(callId);
    assessment.data[phase] = data;
    assessment.updatedAt = Date.now();
    saveAssessment(callId, assessment);
  }

  return Promise.resolve({ saved: true, phase, timestamp: Date.now() });
}

export function handleSaveAssessmentResponseDirect(
  callId: string | undefined,
  body: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const phase = body.phase as string;
  console.log("[assessment-webhook] Saving interview data for phase:", phase);

  if (callId) {
    const assessment = getOrCreateAssessment(callId);
    mergeAssessmentFields(assessment, body);
    saveAssessment(callId, assessment);
    console.log("[assessment-webhook] Stored data:", JSON.stringify(assessment.data, null, 2));
  }

  return Promise.resolve({ saved: true, phase, timestamp: Date.now() });
}

function handleGetMovementScreenResult(
  callId: string | undefined
): Promise<Record<string, unknown>> {
  if (callId) {
    const assessment = getAssessment(callId);
    if (assessment?.data.movementScreen) {
      return Promise.resolve(assessment.data.movementScreen as Record<string, unknown>);
    }
  }
  return Promise.resolve(DEFAULT_MOVEMENT_SCREEN);
}

function handleGenerateRehabPlan(
  _callId: string | undefined,
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  console.log("[assessment-webhook] Generating rehab plan for:", args.assessment_id);

  return Promise.resolve({
    planGenerated: true,
    planId: `plan_${Date.now()}`,
    message: "Your personalized plan has been created",
    summary: { focus: "Mobility and core stability", duration: "12 weeks", sessionsPerWeek: 3 },
  });
}

function handleFlagRedFlag(
  callId: string | undefined,
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const redFlagType = args.red_flag_type as string;
  const details = args.details as string;
  console.log("[assessment-webhook] Red flag detected:", redFlagType, details);

  if (callId) {
    const assessment = getOrCreateAssessment(callId);
    addRedFlag(assessment, redFlagType, details);
    saveAssessment(callId, assessment);
  }

  return Promise.resolve({
    flagged: true,
    redFlagType,
    recommendation: "medical_referral",
    message: "Based on this finding, we recommend seeking evaluation from a healthcare provider before starting exercises.",
  });
}

function handleStartMovementScreen(callId: string | undefined): Promise<Record<string, unknown>> {
  console.log("[assessment-webhook] Starting movement screen for call:", callId);
  return Promise.resolve({
    started: true,
    message: "Camera should now be active for movement tests",
    tests: MOVEMENT_TESTS,
  });
}

export const toolHandlers: Record<string, ToolHandler> = {
  save_assessment_response: handleSaveAssessmentResponse,
  get_movement_screen_result: handleGetMovementScreenResult,
  generate_rehab_plan: handleGenerateRehabPlan,
  flag_red_flag: handleFlagRedFlag,
  start_movement_screen: handleStartMovementScreen,
};

export function executeToolHandler(
  toolName: string,
  callId: string | undefined,
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const handler = toolHandlers[toolName];
  if (!handler) {
    console.log("[assessment-webhook] Unknown tool:", toolName);
    return Promise.resolve({ error: `Unknown tool: ${toolName}` });
  }
  return handler(callId, args);
}
