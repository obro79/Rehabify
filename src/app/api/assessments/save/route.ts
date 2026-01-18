/**
 * Save Assessment API Route
 *
 * POST /api/assessments/save
 * Save a completed voice-guided assessment.
 *
 * Requires: Authenticated user (patient or PT)
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/api/auth";
import { success, error } from "@/lib/api/response";
import { ErrorCode, handleAPIError } from "@/lib/api/errors";
import { validateBody } from "@/lib/api/validation";
import { db, assessments, plans } from "@/db";
import { generatePlan } from "@/lib/gemini/plan-generator";
import { generateFallbackPlan } from "@/lib/gemini/fallback-plan";
import type { GeminiPlanResponse } from "@/lib/gemini/types";

// Validation schema for assessment data
const chiefComplaintSchema = z.object({
  bodyPart: z.string().nullable(),
  symptomType: z.string().nullable(),
  duration: z.string().nullable(),
  onset: z.enum(["gradual", "sudden", "injury"]).nullable(),
  onsetDetails: z.string().optional(),
});

const painProfileSchema = z.object({
  currentLevel: z.number().min(0).max(10).nullable(),
  worstLevel: z.number().min(0).max(10).nullable(),
  character: z.array(z.string()),
  radiates: z.boolean(),
  radiationPattern: z.string().optional(),
  aggravators: z.array(z.string()),
  relievers: z.array(z.string()),
});

const functionalImpactSchema = z.object({
  limitedActivities: z.array(z.string()),
  dailyImpact: z.string().nullable(),
  goals: z.array(z.string()),
});

const medicalHistorySchema = z.object({
  previousInjuries: z.boolean(),
  previousInjuryDetails: z.string().optional(),
  imaging: z.enum(["xray", "mri", "ct", "none"]).nullable(),
  imagingFindings: z.string().optional(),
  currentTreatment: z.string().nullable(),
  redFlags: z.array(z.string()),
});

const movementScreenSchema = z.object({
  flexion: z.object({
    pain: z.number().nullable(),
    painLocation: z.string().optional(),
    romAngle: z.number().optional(),
  }),
  extension: z.object({
    pain: z.number().nullable(),
    comparison: z.enum(["better", "worse", "same"]).optional(),
    romAngle: z.number().optional(),
  }),
  sideBend: z.object({
    pain: z.number().nullable(),
    painSide: z.enum(["left", "right", "both", "neither"]).optional(),
    leftAngle: z.number().optional(),
    rightAngle: z.number().optional(),
  }),
});

const saveAssessmentSchema = z.object({
  chiefComplaint: chiefComplaintSchema,
  pain: painProfileSchema,
  functional: functionalImpactSchema,
  history: medicalHistorySchema,
  movementScreen: movementScreenSchema,
  summaryConfirmed: z.boolean(),
  duration: z.number().optional(), // Duration in seconds
  transcript: z.string().optional(), // Voice transcript
});

/**
 * POST /api/assessments/save
 * Save a completed assessment
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    // Validate request body
    const data = await validateBody(request, saveAssessmentSchema);

    // Determine directional preference based on pain responses
    let directionalPreference: "flexion" | "extension" | "neutral" = "neutral";
    const { flexion, extension } = data.movementScreen;

    if (flexion.pain !== null && extension.pain !== null) {
      // Flexion intolerant (prefers extension)
      if (flexion.pain > 5 && extension.pain < 3) {
        directionalPreference = "extension";
      }
      // Extension intolerant (prefers flexion)
      else if (extension.pain > 5 && flexion.pain < 3) {
        directionalPreference = "flexion";
      }
    }

    // Also consider comparison if available
    if (extension.comparison === "better") {
      directionalPreference = "extension";
    } else if (extension.comparison === "worse") {
      directionalPreference = "flexion";
    }

    // Check for red flags
    const hasRedFlags = data.history.redFlags.length > 0;

    // Create assessment record
    const [newAssessment] = await db
      .insert(assessments)
      .values({
        patientId: user.id,
        chiefComplaint: data.chiefComplaint,
        painProfile: data.pain,
        functionalImpact: data.functional,
        medicalHistory: data.history,
        movementScreen: data.movementScreen,
        directionalPreference,
        redFlags: data.history.redFlags,
        durationSeconds: data.duration || null,
        voiceTranscript: data.transcript || null,
        completed: data.summaryConfirmed && !hasRedFlags,
        completedAt: data.summaryConfirmed ? new Date() : null,
      })
      .returning();

    // If assessment is complete, generate the rehabilitation plan
    let planId: string | null = null;

    if (newAssessment.completed) {
      let planResponse: GeminiPlanResponse | null = null;
      let usedFallback = false;

      // Try to generate plan with Gemini (with 1 retry)
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          planResponse = await generatePlan({
            assessmentId: newAssessment.id,
            patientId: user.id,
          });
          break; // Success, exit retry loop
        } catch (err) {
          console.error(
            `Plan generation attempt ${attempt} failed:`,
            err instanceof Error ? err.message : err
          );
          if (attempt === 2) {
            // Both attempts failed, use fallback
            console.log("Using fallback plan");
          }
        }
      }

      // If Gemini failed, use fallback plan
      if (!planResponse) {
        try {
          planResponse = await generateFallbackPlan({
            directionalPreference: directionalPreference as
              | "flexion"
              | "extension"
              | "neutral",
          });
          usedFallback = true;
        } catch (fallbackErr) {
          console.error("Fallback plan generation failed:", fallbackErr);
          // Continue without a plan - user can still see assessment
        }
      }

      // Save the plan if we have one
      if (planResponse) {
        const [newPlan] = await db
          .insert(plans)
          .values({
            patientId: user.id,
            name: "Your Recovery Plan",
            status: "approved", // Auto-approve for patient self-service
            structure: planResponse.structure,
            ptSummary: planResponse.summary,
            recommendations: planResponse.recommendations,
          })
          .returning();

        planId = newPlan.id;

        // Link assessment to plan
        await db
          .update(assessments)
          .set({ planId: newPlan.id })
          .where(eq(assessments.id, newAssessment.id));
      }
    }

    return success(
      {
        id: newAssessment.id,
        planId,
        directionalPreference,
        hasRedFlags,
        completed: newAssessment.completed,
      },
      201
    );
  } catch (err) {
    return handleAPIError(err);
  }
}
