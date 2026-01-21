// Assessment Data Store - In-memory storage (would be database in production)

import type { AssessmentData } from "@/types/vapi-webhook";
import { ASSESSMENT_FIELDS } from "./constants";

const assessmentDataStore = new Map<string, AssessmentData>();

export function getOrCreateAssessment(callId: string): AssessmentData {
  const existing = assessmentDataStore.get(callId);
  if (existing) return existing;

  const newAssessment: AssessmentData = { callId, data: {}, updatedAt: Date.now() };
  assessmentDataStore.set(callId, newAssessment);
  return newAssessment;
}

export function getAssessment(callId: string): AssessmentData | undefined {
  return assessmentDataStore.get(callId);
}

export function saveAssessment(callId: string, assessment: AssessmentData): void {
  assessmentDataStore.set(callId, assessment);
}

export function deleteAssessment(callId: string): void {
  assessmentDataStore.delete(callId);
}

export function getActiveAssessmentCount(): number {
  return assessmentDataStore.size;
}

export function mergeAssessmentFields(
  existing: AssessmentData,
  body: Record<string, unknown>
): void {
  for (const field of ASSESSMENT_FIELDS) {
    if (body[field]) existing.data[field] = body[field];
  }
  existing.updatedAt = Date.now();
}

export function addRedFlag(
  assessment: AssessmentData,
  redFlagType: string,
  details: string
): void {
  if (!assessment.data.redFlags) assessment.data.redFlags = [];
  (assessment.data.redFlags as unknown[]).push({
    type: redFlagType,
    details,
    timestamp: Date.now(),
  });
  assessment.updatedAt = Date.now();
}
