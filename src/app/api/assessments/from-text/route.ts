/**
 * Text-to-Assessment API Route
 *
 * POST /api/assessments/from-text
 * Parse free-text symptom description into structured assessment data,
 * then save and generate a rehabilitation plan.
 *
 * Requires: Authenticated user
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/api/auth";
import { success } from "@/lib/api/response";
import { handleAPIError } from "@/lib/api/errors";
import { validateBody } from "@/lib/api/validation";
import { db, assessments, plans } from "@/db";
import { generateContent, parseGeminiJson } from "@/lib/gemini/client";
import { generatePlan } from "@/lib/gemini/plan-generator";
import { generateFallbackPlan } from "@/lib/gemini/fallback-plan";
import type { GeminiPlanResponse } from "@/lib/gemini/types";

const fromTextSchema = z.object({
  text: z.string().min(10, "Please describe your symptoms in at least a few words"),
});

/**
 * Gemini prompt to parse free-text into structured assessment fields
 */
function buildParsingPrompt(text: string): string {
  return `You are a physical therapy intake assistant. Parse the following patient description into structured assessment data. Return ONLY valid JSON, no markdown.

Patient description:
"""
${text}
"""

Return this exact JSON structure (use null for anything not mentioned):
{
  "chiefComplaint": {
    "bodyPart": "<string, e.g. 'lower back'>",
    "symptomType": "<string, e.g. 'pain and stiffness'>",
    "duration": "<string, e.g. '3 weeks'>",
    "onset": "<'gradual' | 'sudden' | 'injury' | null>"
  },
  "pain": {
    "currentLevel": <number 0-10 or null>,
    "worstLevel": <number 0-10 or null>,
    "character": [<strings like "sharp", "dull", "aching", "burning">],
    "radiates": <boolean>,
    "aggravators": [<strings>],
    "relievers": [<strings>]
  },
  "functional": {
    "limitedActivities": [<strings>],
    "dailyImpact": "<string or null>",
    "goals": [<strings>]
  },
  "history": {
    "previousInjuries": <boolean>,
    "imaging": <"xray" | "mri" | "ct" | "none" | null>,
    "currentTreatment": "<string or null>",
    "redFlags": [<strings - only include if explicitly mentioned: "bowel/bladder changes", "saddle numbness", "progressive weakness", "fever", "unexplained weight loss", "night pain">]
  },
  "movementScreen": {
    "flexion": { "pain": <number 0-10 or null>, "painLocation": "<string or null>" },
    "extension": { "pain": <number 0-10 or null>, "comparison": <"better" | "worse" | "same" | null> },
    "sideBend": { "pain": <number 0-10 or null>, "painSide": <"left" | "right" | "both" | "neither" | null> }
  }
}

If information is missing, use reasonable defaults:
- Default pain level: 4
- Default body part: "lower back"
- Default onset: "gradual"
- Empty arrays for missing lists
- null for unknown values
- Movement screen should use estimated values based on described symptoms`;
}

/**
 * Default assessment data when parsing fails entirely
 */
const FALLBACK_ASSESSMENT = {
  chiefComplaint: {
    bodyPart: "lower back",
    symptomType: "pain and discomfort",
    duration: "unknown",
    onset: "gradual" as const,
  },
  pain: {
    currentLevel: 4,
    worstLevel: 6,
    character: ["aching"],
    radiates: false,
    aggravators: [] as string[],
    relievers: [] as string[],
  },
  functional: {
    limitedActivities: [] as string[],
    dailyImpact: "Some interference with daily activities",
    goals: ["reduce pain", "improve mobility"],
  },
  history: {
    previousInjuries: false,
    imaging: null,
    currentTreatment: null,
    redFlags: [] as string[],
  },
  movementScreen: {
    flexion: { pain: 3, painLocation: "lower back" },
    extension: { pain: 2, comparison: "same" as const },
    sideBend: { pain: 2, painSide: "neither" as const },
  },
};

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { text } = await validateBody(request, fromTextSchema);

    // Try to parse free text with Gemini
    let assessmentData = FALLBACK_ASSESSMENT;
    try {
      const prompt = buildParsingPrompt(text);
      const rawResponse = await generateContent(prompt, 2);
      const parsed = parseGeminiJson<typeof FALLBACK_ASSESSMENT>(rawResponse);

      // Merge parsed data with fallback defaults for any missing fields
      assessmentData = {
        chiefComplaint: {
          bodyPart: parsed.chiefComplaint?.bodyPart ?? FALLBACK_ASSESSMENT.chiefComplaint.bodyPart,
          symptomType: parsed.chiefComplaint?.symptomType ?? FALLBACK_ASSESSMENT.chiefComplaint.symptomType,
          duration: parsed.chiefComplaint?.duration ?? FALLBACK_ASSESSMENT.chiefComplaint.duration,
          onset: parsed.chiefComplaint?.onset ?? FALLBACK_ASSESSMENT.chiefComplaint.onset,
        },
        pain: {
          currentLevel: parsed.pain?.currentLevel ?? FALLBACK_ASSESSMENT.pain.currentLevel,
          worstLevel: parsed.pain?.worstLevel ?? FALLBACK_ASSESSMENT.pain.worstLevel,
          character: parsed.pain?.character ?? FALLBACK_ASSESSMENT.pain.character,
          radiates: parsed.pain?.radiates ?? FALLBACK_ASSESSMENT.pain.radiates,
          aggravators: parsed.pain?.aggravators ?? FALLBACK_ASSESSMENT.pain.aggravators,
          relievers: parsed.pain?.relievers ?? FALLBACK_ASSESSMENT.pain.relievers,
        },
        functional: {
          limitedActivities: parsed.functional?.limitedActivities ?? FALLBACK_ASSESSMENT.functional.limitedActivities,
          dailyImpact: parsed.functional?.dailyImpact ?? FALLBACK_ASSESSMENT.functional.dailyImpact,
          goals: parsed.functional?.goals ?? FALLBACK_ASSESSMENT.functional.goals,
        },
        history: {
          previousInjuries: parsed.history?.previousInjuries ?? FALLBACK_ASSESSMENT.history.previousInjuries,
          imaging: parsed.history?.imaging ?? FALLBACK_ASSESSMENT.history.imaging,
          currentTreatment: parsed.history?.currentTreatment ?? FALLBACK_ASSESSMENT.history.currentTreatment,
          redFlags: parsed.history?.redFlags ?? FALLBACK_ASSESSMENT.history.redFlags,
        },
        movementScreen: {
          flexion: {
            pain: parsed.movementScreen?.flexion?.pain ?? FALLBACK_ASSESSMENT.movementScreen.flexion.pain,
            painLocation: parsed.movementScreen?.flexion?.painLocation ?? FALLBACK_ASSESSMENT.movementScreen.flexion.painLocation,
          },
          extension: {
            pain: parsed.movementScreen?.extension?.pain ?? FALLBACK_ASSESSMENT.movementScreen.extension.pain,
            comparison: parsed.movementScreen?.extension?.comparison ?? FALLBACK_ASSESSMENT.movementScreen.extension.comparison,
          },
          sideBend: {
            pain: parsed.movementScreen?.sideBend?.pain ?? FALLBACK_ASSESSMENT.movementScreen.sideBend.pain,
            painSide: parsed.movementScreen?.sideBend?.painSide ?? FALLBACK_ASSESSMENT.movementScreen.sideBend.painSide,
          },
        },
      };
    } catch (err) {
      console.error("[from-text] Gemini parsing failed, using fallback:", err);
      // Continue with FALLBACK_ASSESSMENT
    }

    // Determine directional preference
    let directionalPreference: "flexion" | "extension" | "neutral" = "neutral";
    const { flexion, extension } = assessmentData.movementScreen;
    if (flexion.pain !== null && extension.pain !== null) {
      if (flexion.pain > 5 && extension.pain < 3) {
        directionalPreference = "extension";
      } else if (extension.pain > 5 && flexion.pain < 3) {
        directionalPreference = "flexion";
      }
    }
    const comparison = extension.comparison as string | null;
    if (comparison === "better") {
      directionalPreference = "extension";
    } else if (comparison === "worse") {
      directionalPreference = "flexion";
    }

    const hasRedFlags = assessmentData.history.redFlags.length > 0;

    // Save assessment
    const [newAssessment] = await db
      .insert(assessments)
      .values({
        patientId: user.id,
        chiefComplaint: assessmentData.chiefComplaint,
        painProfile: assessmentData.pain,
        functionalImpact: assessmentData.functional,
        medicalHistory: assessmentData.history,
        movementScreen: assessmentData.movementScreen,
        directionalPreference,
        redFlags: assessmentData.history.redFlags,
        voiceTranscript: `[Text Input]\n${text}`,
        completed: !hasRedFlags,
        completedAt: !hasRedFlags ? new Date() : null,
      })
      .returning();

    // Generate plan if no red flags
    let planId: string | null = null;
    if (newAssessment.completed) {
      let planResponse: GeminiPlanResponse | null = null;

      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          planResponse = await generatePlan({
            assessmentId: newAssessment.id,
            patientId: user.id,
          });
          break;
        } catch (err) {
          console.error(`[from-text] Plan generation attempt ${attempt} failed:`, err);
        }
      }

      if (!planResponse) {
        try {
          planResponse = await generateFallbackPlan({ directionalPreference });
        } catch (err) {
          console.error("[from-text] Fallback plan generation failed:", err);
        }
      }

      if (planResponse) {
        const [newPlan] = await db
          .insert(plans)
          .values({
            patientId: user.id,
            name: "Your Recovery Plan",
            status: "approved",
            structure: planResponse.structure,
            ptSummary: planResponse.summary,
            recommendations: planResponse.recommendations,
          })
          .returning();

        planId = newPlan.id;

        await db
          .update(assessments)
          .set({ planId: newPlan.id })
          .where(eq(assessments.id, newAssessment.id));
      }
    }

    return success(
      {
        assessmentId: newAssessment.id,
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
